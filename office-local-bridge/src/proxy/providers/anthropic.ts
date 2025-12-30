/**
 * Anthropic (Claude) API 适配器
 */

import type {
  AIProviderAdapter,
  AIRequestConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  ChatMessage,
  ToolDefinition,
  ModelInfo
} from '../types.js'
import { createLogger } from '../../utils/logger.js'

const logger = createLogger('AnthropicAdapter')

const DEFAULT_BASE_URL = 'https://api.anthropic.com'
const API_VERSION = '2023-06-01'

/**
 * Anthropic 消息格式
 */
interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string | AnthropicContentBlock[]
}

interface AnthropicContentBlock {
  type: 'text' | 'tool_use' | 'tool_result'
  text?: string
  id?: string
  name?: string
  input?: unknown
  tool_use_id?: string
  content?: string
}

/**
 * Anthropic 工具格式
 */
interface AnthropicTool {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

/**
 * Anthropic 响应格式
 */
interface AnthropicResponse {
  id: string
  type: string
  role: string
  content: AnthropicContentBlock[]
  model: string
  stop_reason: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

/**
 * Anthropic 流式事件
 */
interface AnthropicStreamEvent {
  type: string
  message?: AnthropicResponse
  index?: number
  content_block?: AnthropicContentBlock
  delta?: {
    type: string
    text?: string
    partial_json?: string
  }
}

/**
 * Anthropic 适配器
 */
export class AnthropicAdapter implements AIProviderAdapter {
  name = 'anthropic' as const

  /**
   * 转换消息格式：OpenAI -> Anthropic
   */
  private convertMessages(messages: ChatMessage[]): {
    system?: string
    messages: AnthropicMessage[]
  } {
    let system: string | undefined
    const anthropicMessages: AnthropicMessage[] = []

    for (const msg of messages) {
      if (msg.role === 'system') {
        system = msg.content || ''
        continue
      }

      if (msg.role === 'tool') {
        // 工具结果需要合并到上一条用户消息
        const lastMsg = anthropicMessages[anthropicMessages.length - 1]
        if (lastMsg && lastMsg.role === 'user') {
          if (typeof lastMsg.content === 'string') {
            lastMsg.content = [{ type: 'text', text: lastMsg.content }]
          }
          (lastMsg.content as AnthropicContentBlock[]).push({
            type: 'tool_result',
            tool_use_id: msg.tool_call_id,
            content: msg.content || ''
          })
        } else {
          anthropicMessages.push({
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: msg.tool_call_id,
              content: msg.content || ''
            }]
          })
        }
        continue
      }

      if (msg.role === 'assistant' && msg.tool_calls) {
        // 助手消息带工具调用
        const content: AnthropicContentBlock[] = []
        if (msg.content) {
          content.push({ type: 'text', text: msg.content })
        }
        for (const tc of msg.tool_calls) {
          let parsedInput: unknown
          try {
            parsedInput = JSON.parse(tc.function.arguments)
          } catch (parseError) {
            logger.warn('工具调用参数解析失败，使用空对象', {
              toolId: tc.id,
              functionName: tc.function.name,
              arguments: tc.function.arguments,
              error: parseError instanceof Error ? parseError.message : String(parseError)
            })
            parsedInput = {}
          }
          content.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.function.name,
            input: parsedInput
          })
        }
        anthropicMessages.push({ role: 'assistant', content })
        continue
      }

      anthropicMessages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content || ''
      })
    }

    return { system, messages: anthropicMessages }
  }

  /**
   * 转换工具格式：OpenAI -> Anthropic
   */
  private convertTools(tools?: ToolDefinition[]): AnthropicTool[] | undefined {
    if (!tools) return undefined
    return tools.map(t => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters
    }))
  }

  /**
   * 转换响应格式：Anthropic -> OpenAI
   */
  private convertResponse(response: AnthropicResponse): ChatCompletionResponse {
    const message: ChatMessage = {
      role: 'assistant',
      content: null
    }

    const textBlocks = response.content.filter(b => b.type === 'text')
    if (textBlocks.length > 0) {
      message.content = textBlocks.map(b => b.text).join('')
    }

    const toolBlocks = response.content.filter(b => b.type === 'tool_use')
    if (toolBlocks.length > 0) {
      message.tool_calls = toolBlocks.map(b => ({
        id: b.id!,
        type: 'function' as const,
        function: {
          name: b.name!,
          arguments: JSON.stringify(b.input)
        }
      }))
    }

    return {
      id: response.id,
      object: 'chat.completion',
      created: Date.now(),
      model: response.model,
      choices: [{
        index: 0,
        message,
        finish_reason: response.stop_reason === 'tool_use' ? 'tool_calls' : 'stop'
      }],
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens
      }
    }
  }

  /**
   * 发送聊天完成请求
   */
  async chatCompletion(
    config: AIRequestConfig,
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL
    const url = `${baseUrl}/v1/messages`

    logger.info('发送 Anthropic 请求', { model: request.model, stream: false })

    const { system, messages } = this.convertMessages(request.messages)
    const tools = this.convertTools(request.tools)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': API_VERSION
        },
        body: JSON.stringify({
          model: request.model,
          max_tokens: request.max_tokens || 4096,
          system,
          messages,
          tools,
          stream: false
        }),
        signal: controller.signal
      })
    } catch (error) {
      clearTimeout(timeoutId)
      if ((error as Error).name === 'AbortError') {
        throw new Error('Anthropic API 请求超时')
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const error = await response.text()
      logger.error('Anthropic 请求失败', { status: response.status, error })
      throw new Error(`Anthropic API 错误: ${response.status} - ${error}`)
    }

    const anthropicResponse = await response.json() as AnthropicResponse
    return this.convertResponse(anthropicResponse)
  }

  /**
   * 发送流式聊天完成请求
   */
  async *chatCompletionStream(
    config: AIRequestConfig,
    request: ChatCompletionRequest
  ): AsyncGenerator<ChatCompletionChunk, void, unknown> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL
    const url = `${baseUrl}/v1/messages`

    logger.info('发送 Anthropic 流式请求', { model: request.model })

    const { system, messages } = this.convertMessages(request.messages)
    const tools = this.convertTools(request.tools)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60秒超时

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': API_VERSION
        },
        body: JSON.stringify({
          model: request.model,
          max_tokens: request.max_tokens || 4096,
          system,
          messages,
          tools,
          stream: true
        }),
        signal: controller.signal
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      const err = fetchError as Error
      if (err.name === 'AbortError') {
        throw new Error('Anthropic API 请求超时')
      }
      throw new Error(`Anthropic 网络请求失败: ${err.message}`)
    }

    if (!response.ok) {
      const error = await response.text()
      logger.error('Anthropic 流式请求失败', { status: response.status, error })
      throw new Error(`Anthropic API 错误: ${response.status} - ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法获取响应流')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let messageId = ''
    let model = request.model

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue

          try {
            const json = trimmed.slice(6)
            const event = JSON.parse(json) as AnthropicStreamEvent

            if (event.type === 'message_start' && event.message) {
              messageId = event.message.id
              model = event.message.model
            }

            if (event.type === 'content_block_delta' && event.delta?.text) {
              yield {
                id: messageId,
                object: 'chat.completion.chunk',
                created: Date.now(),
                model,
                choices: [{
                  index: 0,
                  delta: { content: event.delta.text },
                  finish_reason: null
                }]
              }
            }

            if (event.type === 'message_stop') {
              yield {
                id: messageId,
                object: 'chat.completion.chunk',
                created: Date.now(),
                model,
                choices: [{
                  index: 0,
                  delta: {},
                  finish_reason: 'stop'
                }]
              }
            }
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
   * 获取可用模型列表（Anthropic 没有官方 API，返回预设模型）
   */
  async listModels(_config: AIRequestConfig): Promise<ModelInfo[]> {
    return [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', contextWindow: 200000, supportsVision: true, supportsTools: true },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', contextWindow: 200000, supportsVision: true, supportsTools: true },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', contextWindow: 200000, supportsVision: true, supportsTools: true },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', contextWindow: 200000, supportsVision: true, supportsTools: true },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', contextWindow: 200000, supportsVision: true, supportsTools: true },
    ]
  }
}

export const anthropicAdapter = new AnthropicAdapter()
