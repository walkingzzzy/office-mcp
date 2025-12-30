/**
 * 自定义端点适配器
 * 支持 OpenAI 兼容的 API 端点
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

const logger = createLogger('CustomAdapter')

/**
 * 自定义端点适配器
 */
export class CustomAdapter implements AIProviderAdapter {
  name = 'custom' as const

  /**
   * 发送聊天完成请求
   */
  async chatCompletion(
    config: AIRequestConfig,
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    if (!config.baseUrl) {
      throw new Error('自定义端点需要配置 baseUrl')
    }

    const url = `${config.baseUrl}/chat/completions`

    logger.info('发送自定义端点请求', { baseUrl: config.baseUrl, model: request.model })

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.customHeaders
    }

    // 支持多种认证方式
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...request,
          stream: false
        }),
        signal: controller.signal
      })
    } catch (error) {
      clearTimeout(timeoutId)
      if ((error as Error).name === 'AbortError') {
        throw new Error('自定义端点 API 请求超时')
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const error = await response.text()
      logger.error('自定义端点请求失败', { status: response.status, error })
      throw new Error(`自定义端点 API 错误: ${response.status} - ${error}`)
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
    if (!config.baseUrl) {
      throw new Error('自定义端点需要配置 baseUrl')
    }

    const url = `${config.baseUrl}/chat/completions`

    logger.info('发送自定义端点流式请求', { baseUrl: config.baseUrl, model: request.model })

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.customHeaders
    }

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60秒超时

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...request,
          stream: true
        }),
        signal: controller.signal
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      const err = fetchError as Error
      if (err.name === 'AbortError') {
        throw new Error('自定义端点 API 请求超时')
      }
      throw new Error(`自定义端点网络请求失败: ${err.message}`)
    }

    if (!response.ok) {
      const error = await response.text()
      logger.error('自定义端点流式请求失败', { status: response.status, error })
      throw new Error(`自定义端点 API 错误: ${response.status} - ${error}`)
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
   * 获取可用模型列表（尝试调用 /models 端点）
   */
  async listModels(config: AIRequestConfig): Promise<ModelInfo[]> {
    if (!config.baseUrl) return []

    const url = `${config.baseUrl}/models`
    const headers: Record<string, string> = { ...config.customHeaders }
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    try {
      const response = await fetch(url, { method: 'GET', headers, signal: controller.signal })
      clearTimeout(timeoutId)
      if (!response.ok) return []

      const data = await response.json() as { data?: Array<{ id: string }> }
      return (data.data || []).map(m => ({ id: m.id, name: m.id }))
    } catch {
      clearTimeout(timeoutId)
      return []
    }
  }
}

export const customAdapter = new CustomAdapter()
