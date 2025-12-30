/**
 * Ollama API 适配器
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

const logger = createLogger('OllamaAdapter')

const DEFAULT_BASE_URL = 'http://localhost:11434'

/**
 * Ollama 适配器
 */
export class OllamaAdapter implements AIProviderAdapter {
  name = 'ollama' as const

  /**
   * 发送聊天完成请求
   */
  async chatCompletion(
    config: AIRequestConfig,
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL
    const url = `${baseUrl}/api/chat`

    logger.info('发送 Ollama 请求', { model: request.model })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          stream: false
        }),
        signal: controller.signal
      })
    } catch (error) {
      clearTimeout(timeoutId)
      if ((error as Error).name === 'AbortError') {
        throw new Error('Ollama API 请求超时')
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const error = await response.text()
      logger.error('Ollama 请求失败', { status: response.status, error })
      throw new Error(`Ollama API 错误: ${response.status} - ${error}`)
    }

    const data = await response.json() as {
      message: { role: string; content: string }
      model: string
      created_at: string
    }

    return {
      id: `ollama-${Date.now()}`,
      object: 'chat.completion',
      created: Date.now(),
      model: data.model,
      choices: [{
        index: 0,
        message: { role: 'assistant', content: data.message.content },
        finish_reason: 'stop'
      }]
    }
  }

  /**
   * 发送流式聊天完成请求
   */
  async *chatCompletionStream(
    config: AIRequestConfig,
    request: ChatCompletionRequest
  ): AsyncGenerator<ChatCompletionChunk, void, unknown> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL
    const url = `${baseUrl}/api/chat`

    logger.info('发送 Ollama 流式请求', { model: request.model })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60秒超时

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          stream: true
        }),
        signal: controller.signal
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      const err = fetchError as Error
      if (err.name === 'AbortError') {
        throw new Error('Ollama API 请求超时')
      }
      throw new Error(`Ollama 网络请求失败: ${err.message}`)
    }

    if (!response.ok) {
      const error = await response.text()
      logger.error('Ollama 流式请求失败', { status: response.status, error })
      throw new Error(`Ollama API 错误: ${response.status} - ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('无法获取响应流')

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
          if (!line.trim()) continue
          try {
            const data = JSON.parse(line) as { message?: { content: string }; done: boolean }
            if (data.message?.content) {
              yield {
                id: `ollama-${Date.now()}`,
                object: 'chat.completion.chunk',
                created: Date.now(),
                model: request.model,
                choices: [{
                  index: 0,
                  delta: { content: data.message.content },
                  finish_reason: data.done ? 'stop' : null
                }]
              }
            }
          } catch { /* ignore */ }
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
    const url = `${baseUrl}/api/tags`

    logger.info('获取 Ollama 模型列表')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    let response: Response
    try {
      response = await fetch(url, { method: 'GET', signal: controller.signal })
    } catch (error) {
      clearTimeout(timeoutId)
      if ((error as Error).name === 'AbortError') {
        throw new Error('Ollama API 请求超时')
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const error = await response.text()
      logger.error('获取模型列表失败', { status: response.status, error })
      throw new Error(`Ollama API 错误: ${response.status} - ${error}`)
    }

    const data = await response.json() as { models: Array<{ name: string; size: number }> }
    return data.models.map(m => ({
      id: m.name,
      name: m.name,
      description: `Ollama 本地模型 (${Math.round(m.size / 1024 / 1024 / 1024 * 10) / 10}GB)`
    }))
  }
}

export const ollamaAdapter = new OllamaAdapter()
