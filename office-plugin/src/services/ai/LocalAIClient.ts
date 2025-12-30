/**
 * 本地 AI 客户端
 * 通过 office-local-bridge 代理调用 AI API
 */

import type { AIProviderConfig } from '../config/LocalConfigManager'

/**
 * 聊天消息
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  name?: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

/**
 * 工具调用
 */
export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

/**
 * 工具定义
 */
export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

/**
 * 聊天完成请求
 */
export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  tools?: ToolDefinition[]
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } }
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

/**
 * 聊天完成响应
 */
export interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: ChatMessage
    finish_reason: string
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * 流式响应块
 */
export interface ChatCompletionChunk {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    delta: Partial<ChatMessage>
    finish_reason: string | null
  }[]
}

/**
 * 本地 AI 客户端类
 */
export class LocalAIClient {
  private bridgeUrl: string

  constructor(bridgeUrl: string = 'http://localhost:3001') {
    this.bridgeUrl = bridgeUrl
  }

  /**
   * 设置桥接服务 URL
   */
  setBridgeUrl(url: string): void {
    this.bridgeUrl = url
  }

  /**
   * 发送聊天完成请求（非流式）
   */
  async chatCompletion(
    provider: AIProviderConfig,
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.bridgeUrl}/api/ai/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        config: {
          provider: provider.type,
          apiKey: provider.apiKey,
          baseUrl: provider.baseUrl,
          model: request.model,
          azureDeployment: provider.azureDeployment,
          azureApiVersion: provider.azureApiVersion,
          customHeaders: provider.customHeaders
        },
        request: {
          ...request,
          stream: false
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`AI 请求失败: ${response.status} - ${error}`)
    }

    return response.json()
  }

  /**
   * 发送流式聊天完成请求
   */
  async *chatCompletionStream(
    provider: AIProviderConfig,
    request: ChatCompletionRequest
  ): AsyncGenerator<ChatCompletionChunk, void, unknown> {
    const response = await fetch(`${this.bridgeUrl}/api/ai/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        config: {
          provider: provider.type,
          apiKey: provider.apiKey,
          baseUrl: provider.baseUrl,
          model: request.model,
          azureDeployment: provider.azureDeployment,
          azureApiVersion: provider.azureApiVersion,
          customHeaders: provider.customHeaders
        },
        request: {
          ...request,
          stream: true
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`AI 流式请求失败: ${response.status} - ${error}`)
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
      reader.releaseLock()
    }
  }

  /**
   * 检查桥接服务连接
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.bridgeUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * 获取支持的提供商列表
   */
  async getProviders(): Promise<string[]> {
    const response = await fetch(`${this.bridgeUrl}/api/ai/providers`)
    if (!response.ok) {
      throw new Error('获取提供商列表失败')
    }
    const data = await response.json()
    return data.providers
  }
}

export const localAIClient = new LocalAIClient()
export default localAIClient
