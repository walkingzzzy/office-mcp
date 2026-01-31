/**
 * AI 服务主入口
 * 负责与武汉问津主应用的 AI API 通信
 * 支持流式输出和非流式输出
 */

import type {
  AIErrorResponse,
  AIServiceConfig,
  ChatCompletionChunk,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatMessage,
  KnowledgeSearchRequest,
  KnowledgeSearchResult,
  MCPToolCallRequest,
  MCPToolCallResponse,
  StreamOptions,
  ToolChoice,
  ToolDefinition
} from '../../types/ai'
import Logger from '../../utils/logger'
import { retryHandler, type RetryProgressCallback } from './retryHandler'
import { streamHandler } from './streamHandler'
import type { FormattingFunction } from './types'

const logger = new Logger('AIService')

/**
 * 获取默认配置
 * 支持环境变量配置
 */
function getDefaultConfig(): Required<AIServiceConfig> {
  // 优先级：环境变量 > 默认值
  return {
    baseUrl:
      import.meta.env?.VITE_API_BASE_URL ||
      (typeof process !== 'undefined' && process.env?.REACT_APP_API_BASE_URL) ||
      'http://localhost:3001',
    apiKey: import.meta.env?.VITE_API_KEY || (typeof process !== 'undefined' && process.env?.REACT_APP_API_KEY) || '',
    timeout:
      parseInt(import.meta.env?.VITE_API_TIMEOUT || '60000') ||
      parseInt(typeof process !== 'undefined' ? process.env?.REACT_APP_API_TIMEOUT || '60000' : '60000'),
    retries:
      parseInt(import.meta.env?.VITE_API_RETRIES || '3') ||
      parseInt(typeof process !== 'undefined' ? process.env?.REACT_APP_API_RETRIES || '3' : '3'),
    retryDelay:
      parseInt(import.meta.env?.VITE_API_RETRY_DELAY || '1000') ||
      parseInt(typeof process !== 'undefined' ? process.env?.REACT_APP_API_RETRY_DELAY || '1000' : '1000')
  }
}

/**
 * AI 服务类
 */
export class AIService {
  private config: Required<AIServiceConfig>

  constructor(config?: AIServiceConfig) {
    this.config = { ...getDefaultConfig(), ...config }
  }

  /**
   * 设置重试进度回调
   */
  setRetryProgressCallback(callback?: RetryProgressCallback): void {
    retryHandler.setRetryProgressCallback(callback)
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 获取当前配置
   */
  getConfig(): Required<AIServiceConfig> {
    return { ...this.config }
  }

  /**
   * 验证配置是否有效
   */
  async validateConfig(): Promise<{
    isValid: boolean
    error?: string
    details?: {
      baseUrl: boolean
      timeout: boolean
      retries: boolean
    }
  }> {
    const details = {
      baseUrl: false,
      timeout: false,
      retries: false
    }

    try {
      // 验证 baseUrl 格式
      new URL(this.config.baseUrl)
      details.baseUrl = true
    } catch {
      return {
        isValid: false,
        error: '无效的 API 基础 URL 格式',
        details
      }
    }

    // 验证超时时间
    if (this.config.timeout > 0 && this.config.timeout <= 300000) {
      // 最大5分钟
      details.timeout = true
    }

    // 验证重试次数
    if (this.config.retries >= 0 && this.config.retries <= 10) {
      details.retries = true
    }

    const isValid = Object.values(details).every(Boolean)

    return {
      isValid,
      error: isValid ? undefined : '配置参数无效',
      details
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<{
    success: boolean
    message: string
    responseTime?: number
  }> {
    const startTime = Date.now()

    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` })
        },
        signal: AbortSignal.timeout(5000) // 5秒超时
      })

      const responseTime = Date.now() - startTime

      if (response.ok) {
        return {
          success: true,
          message: '连接成功',
          responseTime
        }
      } else {
        return {
          success: false,
          message: `连接失败: HTTP ${response.status}`,
          responseTime
        }
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        success: false,
        message: `连接错误: ${(error as Error).message}`,
        responseTime
      }
    }
  }

  /**
   * 创建聊天完成（非流式）
   */
  async createChatCompletion(request: ChatCompletionRequest, signal?: AbortSignal): Promise<ChatCompletionResponse> {
    const url = `${this.config.baseUrl}/api/ai/chat/completions`

    const requestBody: ChatCompletionRequest = {
      ...request,
      stream: false,
      knowledgeBaseIds: request.knowledgeBaseIds,
      mcpToolIds: request.mcpToolIds
    }

    try {
      const response = await retryHandler.fetchWithRetry(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` })
          },
          body: JSON.stringify(requestBody),
          signal
        },
        this.config.retries,
        this.config.retryDelay,
        this.config.timeout
      )

      if (!response.ok) {
        const errorData: AIErrorResponse = await response.json().catch(() => ({
          error: {
            message: `HTTP ${response.status}: ${response.statusText}`,
            type: 'http_error',
            code: `http_${response.status}`
          }
        }))
        throw new Error(errorData.error.message || `HTTP ${response.status}`)
      }

      const data: ChatCompletionResponse = await response.json()
      return data
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Request was cancelled')
      }
      throw error
    }
  }

  /**
   * 流式聊天完成（返回可迭代流）
   */
  async *streamChatCompletion(request: {
    messages: ChatMessage[]
    model: string
    tools?: ToolDefinition[]
    tool_choice?: ToolChoice
    officeTools?: FormattingFunction[]
    knowledgeBaseIds?: string[]
    mcpToolIds?: string[]
    webSearchEnabled?: boolean
    officeDocument?: {
      base64: string
      type: 'word' | 'excel' | 'powerpoint'
      filename?: string
    }
    signal?: AbortSignal
    streamOptions?: StreamOptions
  }): AsyncGenerator<ChatCompletionChunk, void, unknown> {
    const response = await this.createChatCompletionStream(
      {
        ...request,
        knowledgeBaseIds: request.knowledgeBaseIds || [],
        mcpToolIds: request.mcpToolIds || [],
        tool_choice: request.tool_choice
      },
      {
        signal: request.signal,
        ...request.streamOptions
      }
    )

    if (!response?.body) {
      throw new Error('No response body received')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') return

            try {
              const parsed = JSON.parse(data)
              yield parsed
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * 创建聊天完成（流式）
   */
  async createChatCompletionStream(
    request: ChatCompletionRequest,
    options?: StreamOptions
  ): Promise<Response | undefined> {
    // 使用 Bridge 的 AI 聊天端点
    const url = `${this.config.baseUrl}/api/ai/chat/completions`

    const requestBody: ChatCompletionRequest = {
      ...request,
      stream: true,
      knowledgeBaseIds: request.knowledgeBaseIds,
      mcpToolIds: request.mcpToolIds,
      officeTools: request.officeTools,
      tools: request.tools,
      tool_choice: request.tool_choice,
      officeDocument: request.officeDocument
    }

    logger.info('[OFFICE_TOOL_FLOW] 📤 发送聊天完成请求', {
      url,
      model: request.model,
      messageCount: request.messages.length,
      hasApiKey: !!this.config.apiKey,
      knowledgeBaseIds: request.knowledgeBaseIds,
      mcpToolIds: request.mcpToolIds,
      hasOfficeTools: !!request.officeTools,
      officeToolsCount: request.officeTools?.length ?? 0,
      officeToolNames: request.officeTools?.map(t => t.name),
      hasTools: !!request.tools,
      toolsCount: request.tools?.length ?? 0,
      toolNames: request.tools?.map(t => t.function?.name),
      tool_choice: request.tool_choice
    })
    
    // 🔍 完整请求体日志（用于调试）
    logger.debug('[OFFICE_TOOL_FLOW] 完整请求体', {
      requestBodyKeys: Object.keys(requestBody),
      tools: JSON.stringify(requestBody.tools || []).substring(0, 500),
      officeTools: JSON.stringify(requestBody.officeTools || []).substring(0, 500)
    })

    logger.logApiRequest('POST', url, {
      model: request.model,
      messageCount: request.messages.length
    })

    // 🔍 DEBUG: 打印完整请求体以验证工具参数是否正确传递
    if (request.officeTools && request.officeTools.length > 0) {
      logger.debug('[CRITICAL] Request body with Office tools', {
        hasOfficeTools: !!requestBody.officeTools,
        officeToolNames: requestBody.officeTools?.map((t) => t.name),
        hasTools: !!requestBody.tools,
        toolNames: requestBody.tools?.map((t) => t.function.name),
        tool_choice: requestBody.tool_choice
      })
    }

    try {
      // 构建请求头，包含 API Key 认证
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      }
      
      // 添加 Authorization header
      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: options?.signal
      })

      logger.info('Stream response received', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type')
      })

      if (!response.ok) {
        const errorData: AIErrorResponse = await response.json().catch(() => ({
          error: {
            message: `HTTP ${response.status}: ${response.statusText}`,
            type: 'http_error',
            code: `http_${response.status}`
          }
        }))
        throw new Error(errorData.error.message || `HTTP ${response.status}`)
      }

      if (options) {
        // 处理 SSE 流
        logger.info('Starting to process SSE stream')
        await streamHandler.processSSEStream(response, options)
        logger.info('SSE stream processing completed')
      }

      return response
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        logger.info('Stream was cancelled')
        return undefined
      }
      logger.error('Chat completion error', { error })
      if (options?.onError) {
        options.onError(error as Error)
        return undefined
      } else {
        throw error
      }
    }
  }

  /**
   * 知识库检索
   */
  async searchKnowledge(request: KnowledgeSearchRequest, signal?: AbortSignal): Promise<KnowledgeSearchResult[]> {
    const url = `${this.config.baseUrl}/api/knowledge/search`

    try {
      const response = await retryHandler.fetchWithRetry(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` })
          },
          body: JSON.stringify(request),
          signal
        },
        this.config.retries,
        this.config.retryDelay,
        this.config.timeout
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.results || []
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Request was cancelled')
      }
      throw error
    }
  }

  /**
   * MCP 工具调用
   */
  async callMCPTool(request: MCPToolCallRequest, signal?: AbortSignal): Promise<MCPToolCallResponse> {
    const url = `${this.config.baseUrl}/api/mcp/servers/call`

    try {
      const response = await retryHandler.fetchWithRetry(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` })
          },
          body: JSON.stringify(request),
          signal
        },
        this.config.retries,
        this.config.retryDelay,
        this.config.timeout
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: MCPToolCallResponse = await response.json()
      return data
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Request was cancelled')
      }
      throw error
    }
  }
}

/**
 * 创建 AI 服务单例
 */
export const aiService = new AIService()

/**
 * 导出默认实例
 */
export default aiService
