/**
 * Azure OpenAI API 适配器
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

const logger = createLogger('AzureAdapter')

const DEFAULT_API_VERSION = '2024-02-15-preview'

/**
 * Azure OpenAI 适配器
 */
export class AzureOpenAIAdapter implements AIProviderAdapter {
  name = 'azure' as const

  /**
   * 构建 Azure OpenAI URL
   */
  private buildUrl(config: AIRequestConfig): string {
    if (!config.baseUrl) {
      throw new Error('Azure OpenAI 需要配置 baseUrl（资源端点）')
    }
    if (!config.azureDeployment) {
      throw new Error('Azure OpenAI 需要配置 azureDeployment（部署名称）')
    }

    const apiVersion = config.azureApiVersion || DEFAULT_API_VERSION
    return `${config.baseUrl}/openai/deployments/${config.azureDeployment}/chat/completions?api-version=${apiVersion}`
  }

  /**
   * 发送聊天完成请求
   */
  async chatCompletion(
    config: AIRequestConfig,
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const url = this.buildUrl(config)

    logger.info('发送 Azure OpenAI 请求', {
      deployment: config.azureDeployment,
      stream: false
    })

    // Azure 不需要在请求体中指定 model
    const { model: _model, ...requestBody } = request

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': config.apiKey
        },
        body: JSON.stringify({
          ...requestBody,
          stream: false
        }),
        signal: controller.signal
      })
    } catch (error) {
      clearTimeout(timeoutId)
      if ((error as Error).name === 'AbortError') {
        throw new Error('Azure OpenAI API 请求超时')
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const error = await response.text()
      logger.error('Azure OpenAI 请求失败', { status: response.status, error })
      throw new Error(`Azure OpenAI API 错误: ${response.status} - ${error}`)
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
    const url = this.buildUrl(config)

    logger.info('发送 Azure OpenAI 流式请求', {
      deployment: config.azureDeployment
    })

    const { model: _model, ...requestBody } = request

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60秒超时

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': config.apiKey
        },
        body: JSON.stringify({
          ...requestBody,
          stream: true
        }),
        signal: controller.signal
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      const err = fetchError as Error
      if (err.name === 'AbortError') {
        throw new Error('Azure OpenAI API 请求超时')
      }
      throw new Error(`Azure OpenAI 网络请求失败: ${err.message}`)
    }

    if (!response.ok) {
      const error = await response.text()
      logger.error('Azure OpenAI 流式请求失败', { status: response.status, error })
      throw new Error(`Azure OpenAI API 错误: ${response.status} - ${error}`)
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
   * 获取可用模型列表（Azure 部署列表）
   */
  async listModels(config: AIRequestConfig): Promise<ModelInfo[]> {
    if (!config.baseUrl) {
      throw new Error('Azure OpenAI 需要配置 baseUrl（资源端点）')
    }

    const apiVersion = config.azureApiVersion || DEFAULT_API_VERSION
    const url = `${config.baseUrl}/openai/deployments?api-version=${apiVersion}`

    logger.info('获取 Azure OpenAI 部署列表')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    let response: Response
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { 'api-key': config.apiKey },
        signal: controller.signal
      })
    } catch (error) {
      clearTimeout(timeoutId)
      if ((error as Error).name === 'AbortError') {
        throw new Error('Azure OpenAI API 请求超时')
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const error = await response.text()
      logger.error('获取部署列表失败', { status: response.status, error })
      throw new Error(`Azure OpenAI API 错误: ${response.status} - ${error}`)
    }

    const data = await response.json() as { data: Array<{ id: string; model: string }> }
    return data.data.map(d => ({
      id: d.id,
      name: d.model || d.id,
      description: `Azure 部署: ${d.id}`
    }))
  }
}

export const azureAdapter = new AzureOpenAIAdapter()
