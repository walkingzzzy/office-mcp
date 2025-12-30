/**
 * AI API 代理类型定义
 */

/**
 * AI 提供商类型
 */
export type AIProvider = 'openai' | 'azure' | 'anthropic' | 'ollama' | 'custom'

/**
 * AI 请求配置
 */
export interface AIRequestConfig {
  provider: AIProvider
  apiKey: string
  baseUrl?: string
  model: string
  // Azure 特有
  azureDeployment?: string
  azureApiVersion?: string
  // 自定义端点
  customHeaders?: Record<string, string>
}

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
 * 聊天完成响应（非流式）
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
 * 模型信息
 */
export interface ModelInfo {
  id: string
  name: string
  description?: string
  contextWindow?: number
  supportsVision?: boolean
  supportsTools?: boolean
  supportsStreaming?: boolean
}

/**
 * 验证供应商请求
 */
export interface ValidateProviderRequest {
  type: AIProvider
  apiKey: string
  baseUrl?: string
  azureEndpoint?: string
  azureDeployment?: string
  azureApiVersion?: string
}

/**
 * 验证供应商响应
 */
export interface ValidateProviderResponse {
  valid: boolean
  error?: string
  models?: ModelInfo[]
}

/**
 * 测试模型请求
 */
export interface TestModelRequest {
  modelId: string
  testMessage?: string
}

/**
 * 测试模型响应
 */
export interface TestModelResponse {
  success: boolean
  response?: string
  latency?: number
  error?: string
}

/**
 * AI 提供商适配器接口
 */
export interface AIProviderAdapter {
  /**
   * 提供商名称
   */
  name: AIProvider

  /**
   * 发送聊天完成请求
   */
  chatCompletion(
    config: AIRequestConfig,
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse>

  /**
   * 发送流式聊天完成请求
   */
  chatCompletionStream(
    config: AIRequestConfig,
    request: ChatCompletionRequest
  ): AsyncGenerator<ChatCompletionChunk, void, unknown>

  /**
   * 获取可用模型列表（可选）
   */
  listModels?(config: AIRequestConfig): Promise<ModelInfo[]>
}
