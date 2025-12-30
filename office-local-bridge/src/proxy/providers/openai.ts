/**
 * OpenAI API 适配器
 */

import type {
  AIProviderAdapter,
  AIRequestConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  ModelInfo
} from '../types.js'
import { createLogger } from '../../utils/logger.js'

const logger = createLogger('OpenAIAdapter')

const DEFAULT_BASE_URL = 'https://api.openai.com/v1'

/**
 * OpenAI 适配器
 */
export class OpenAIAdapter implements AIProviderAdapter {
  name = 'openai' as const

  /**
   * 发送聊天完成请求
   */
  async chatCompletion(
    config: AIRequestConfig,
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL
    const url = `${baseUrl}/chat/completions`

    logger.info('发送 OpenAI 请求', { model: request.model, stream: false })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          ...request,
          stream: false
        }),
        signal: controller.signal
      })
    } catch (error) {
      clearTimeout(timeoutId)
      if ((error as Error).name === 'AbortError') {
        throw new Error('OpenAI API 请求超时')
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const error = await response.text()
      logger.error('OpenAI 请求失败', { status: response.status, error })
      throw new Error(`OpenAI API 错误: ${response.status} - ${error}`)
    }

    return response.json() as Promise<ChatCompletionResponse>
  }

  /**
   * 发送流式聊天完成请求
   */
  async *chatCompletionStream(
    config: AIRequestConfig,
    request: ChatCompletionRequest
  ): AsyncGenerator<ChatCompletionChunk, void, unknown> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL
    const url = `${baseUrl}/chat/completions`

    logger.info('发送 OpenAI 流式请求', { model: request.model, url, baseUrl })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60秒超时

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          ...request,
          stream: true
        }),
        signal: controller.signal
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      const err = fetchError as Error
      logger.error('OpenAI fetch 失败', { 
        url,
        error: err.message, 
        cause: err.cause,
        stack: err.stack?.substring(0, 500)
      })
      throw new Error(`网络请求失败: ${err.message}`)
    }

    if (!response.ok) {
      const error = await response.text()
      logger.error('OpenAI 流式请求失败', { status: response.status, error })
      throw new Error(`OpenAI API 错误: ${response.status} - ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法获取响应流')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue
          if (!trimmed.startsWith('data: ')) continue

          try {
            const json = trimmed.slice(6)
            const chunk = JSON.parse(json) as ChatCompletionChunk
            yield chunk
          } catch {
            // 忽略解析错误
          }
        }
      }
    } finally {
      clearTimeout(timeoutId)
      reader.releaseLock()
    }
  }

  /**
   * 获取可用模型列表
   */
  async listModels(config: AIRequestConfig): Promise<ModelInfo[]> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL
    const url = `${baseUrl}/models`

    logger.info('获取 OpenAI 模型列表')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    let response: Response
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        },
        signal: controller.signal
      })
    } catch (error) {
      clearTimeout(timeoutId)
      if ((error as Error).name === 'AbortError') {
        throw new Error('OpenAI API 请求超时')
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const error = await response.text()
      logger.error('获取模型列表失败', { status: response.status, error })
      throw new Error(`OpenAI API 错误: ${response.status} - ${error}`)
    }

    const data = await response.json() as { data: Array<{ id: string; created: number; owned_by: string }> }

    // 返回所有模型（不再只过滤 gpt- 开头的）
    // 排除明显不是聊天模型的（如 embedding、whisper、tts、dall-e 等）
    const excludePatterns = ['embedding', 'whisper', 'tts', 'dall-e', 'davinci', 'babbage', 'ada', 'curie']
    
    return data.data
      .filter(model => !excludePatterns.some(pattern => model.id.toLowerCase().includes(pattern)))
      .map(model => ({
        id: model.id,
        name: model.id,
        description: model.owned_by ? `${model.owned_by} - ${model.id}` : model.id
      }))
  }
}

export const openaiAdapter = new OpenAIAdapter()
