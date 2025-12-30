/**
 * AI 服务相关类型定义
 * 兼容 OpenAI API 格式
 */

import type { FormattingFunction } from '../services/ai/types'

/**
 * 聊天模式
 * - agent: Agent 模式，可以调用工具执行文档操作
 * - ask: Ask 模式，只回答问题，不调用工具（类似 Cursor 的 Ask 模式）
 */
export type ChatMode = 'agent' | 'ask'

/**
 * Agent 执行模式
 * - immediate: 立即执行，一次性完成所有操作
 * - planned: 任务规划模式，先拆分任务再逐步执行
 */
export type AgentExecutionMode = 'immediate' | 'planned'

/**
 * 任务规划配置
 */
export interface TaskPlanningConfig {
  /** 是否启用任务规划 */
  enabled: boolean
  /** 是否需要用户确认才能执行 */
  requiresConfirmation?: boolean
  /** 最大步骤数 */
  maxSteps?: number
  /** 步骤超时时间（毫秒） */
  stepTimeout?: number
}

/**
 * 聊天消息角色
 */
export type ChatMessageRole = 'system' | 'user' | 'assistant' | 'function' | 'tool'

/**
 * 工具调用信息
 */
export interface ToolCallInfo {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

/**
 * 函数调用信息
 */
export interface FunctionCallInfo {
  name: string
  arguments: string
}

/**
 * 聊天消息
 */
export interface ChatMessage {
  role: ChatMessageRole
  content: string | null
  name?: string
  tool_call_id?: string
  function_call?: FunctionCallInfo
  tool_calls?: ToolCallInfo[]
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
 * 工具调用策略
 */
export type ToolChoice =
  | 'auto'
  | 'none'
  | 'required'
  | {
      type: 'function'
      function: {
        name: string
      }
    }

/**
 * 聊天完成请求参数
 */
export interface ChatCompletionRequest {
  /**
   * 模型 ID（格式：providerId/modelName）
   */
  model: string

  /**
   * 消息列表
   */
  messages: ChatMessage[]

  /**
   * 是否使用流式输出
   * @default false
   */
  stream?: boolean

  /**
   * 温度参数（0-2）
   * @default 1
   */
  temperature?: number

  /**
   * Top-p 采样参数（0-1）
   */
  top_p?: number

  /**
   * 最大生成 token 数
   */
  max_tokens?: number

  /**
   * 停止序列
   */
  stop?: string | string[]

  /**
   * 存在惩罚（-2.0 到 2.0）
   */
  presence_penalty?: number

  /**
   * 频率惩罚（-2.0 到 2.0）
   */
  frequency_penalty?: number

  /**
   * 用户标识
   */
  user?: string

  /**
   * 工具列表（Function Calling）
   * 参考 OpenAI tools 参数格式
   */
  tools?: ToolDefinition[]

  /**
   * Office 应用的格式化工具列表，由 AI SDK 转换为工具 ToolSet
   */
  officeTools?: FormattingFunction[]

  /**
   * 工具调用策略
   * @default 'auto'
   */
  tool_choice?: ToolChoice

  /**
   * 知识库 ID 列表
   */
  knowledgeBaseIds?: string[]

  /**
   * MCP 工具 ID 列表
   */
  mcpToolIds?: string[]

  /**
   * 是否启用网络搜索
   */
  enableWebSearch?: boolean

  /**
   * Office 文档数据（Base64 编码）
   *
   * 用于二进制文档传输模式
   */
  officeDocument?: {
    base64: string
    type: 'word' | 'excel' | 'powerpoint'
    filename?: string
  }

  /**
   * Office 文档会话 ID
   *
   * 用于关联临时文件和 MCP 工具调用
   */
  officeDocumentSessionId?: string
}

/**
 * 聊天完成响应（非流式）
 */
export interface ChatCompletionResponse {
  id: string
  object: 'chat.completion'
  created: number
  model: string
  choices: Array<{
    index: number
    message: ChatMessage
    finish_reason: 'stop' | 'length' | 'function_call' | 'tool_calls' | 'content_filter' | null
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * 聊天完成流式响应块
 */
export interface ChatCompletionChunk {
  id: string
  object: 'chat.completion.chunk'
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: ChatMessageRole
      content?: string
      function_call?: {
        name?: string
        arguments?: string
      }
      tool_calls?: Array<{
        index: number
        id?: string
        type?: 'function'
        function?: {
          name?: string
          arguments?: string
        }
      }>
    }
    finish_reason: 'stop' | 'length' | 'function_call' | 'tool_calls' | 'content_filter' | null
  }>
}

/**
 * AI 错误响应
 */
export interface AIErrorResponse {
  error: {
    message: string
    type: string
    code: string
  }
}

/**
 * 流式输出回调函数
 */
export type StreamCallback = (chunk: ChatCompletionChunk) => void

/**
 * 流式输出完成回调函数
 */
export type StreamCompleteCallback = (finishReason?: string | null) => void

/**
 * 流式输出错误回调函数
 */
export type StreamErrorCallback = (error: Error) => void

/**
 * 工具调用增量信息
 */
export interface ToolCallDelta {
  index: number
  id?: string
  type?: 'function'
  function?: {
    name?: string
    arguments?: string
  }
}

/**
 * 知识库引用信息
 */
export interface KnowledgeReference {
  id: string
  content: string
  source?: string | {
    fileName?: string
    knowledgeBaseName?: string
  }
  title?: string
  score?: number
}

/**
 * MCP 工具响应
 */
export interface MCPToolResponse {
  toolName: string
  result: unknown
  error?: string
  // 扩展字段，用于流式响应
  id?: string
  status?: 'pending' | 'running' | 'done' | 'error'
  tool?: {
    name?: string
    type?: string
  }
  arguments?: Record<string, unknown>
  response?: unknown
  serverName?: string
}

/**
 * Office 工具调用
 */
export interface OfficeToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
  result?: unknown
  error?: string
}

/**
 * 思考过程信息
 */
export interface ThinkingInfo {
  content: string
  duration?: number
  // 扩展字段，用于流式响应
  text?: string
  thinking_millsec?: number
}

/**
 * 文档更新信息
 */
export interface DocumentUpdateInfo {
  sessionId: string
  filePath: string
  documentType: 'word' | 'excel' | 'powerpoint'
  description?: string
}

/**
 * 流式输出选项
 */
export interface StreamOptions {
  /**
   * 每个 chunk 的回调
   */
  onChunk: StreamCallback

  /**
   * 工具调用增量回调
   */
  onToolCallDelta?: (toolCallDelta: ToolCallDelta) => void

  /**
   * 知识库引用回调
   */
  onKnowledgeRefs?: (refs: KnowledgeReference[]) => void

  /**
   * MCP 工具调用回调
   */
  onMCPTool?: (responses: MCPToolResponse[]) => void

  /**
   * Office 工具调用回调
   */
  onOfficeToolCall?: (toolCalls: OfficeToolCall[]) => void

  /**
   * 思考过程回调
   */
  onThinking?: (thinking: ThinkingInfo) => void

  /**
   * 文档更新回调
   */
  onDocumentUpdate?: (docUpdate: DocumentUpdateInfo) => void

  /**
   * 流式输出完成的回调
   */
  onComplete?: StreamCompleteCallback

  /**
   * 流式输出错误的回调
   */
  onError?: StreamErrorCallback

  /**
   * AbortSignal 用于取消请求
   */
  signal?: AbortSignal
}

/**
 * AI 服务配置
 */
export interface AIServiceConfig {
  /**
   * API 基础 URL
   * @default 'http://localhost:3001'
   */
  baseUrl?: string

  /**
   * API 密钥
   */
  apiKey?: string

  /**
   * 请求超时时间（毫秒）
   * @default 60000 (60秒)
   */
  timeout?: number

  /**
   * 重试次数
   * @default 3
   */
  retries?: number

  /**
   * 重试延迟（毫秒）
   * @default 1000
   */
  retryDelay?: number
}

/**
 * 知识库检索请求
 */
export interface KnowledgeSearchRequest {
  /**
   * 查询文本
   */
  query: string

  /**
   * 知识库 ID 列表
   */
  knowledgeBaseIds?: string[]

  /**
   * 返回结果数量
   * @default 5
   */
  limit?: number

  /**
   * 相似度阈值（0-1）
   * @default 0.7
   */
  threshold?: number
}

/**
 * 知识库检索结果
 */
export interface KnowledgeSearchResult {
  /**
   * 文档 ID
   */
  id: string

  /**
   * 文档内容
   */
  content: string

  /**
   * 相似度分数（0-1）
   */
  score: number

  /**
   * 元数据
   */
  metadata?: {
    source?: string
    title?: string
    [key: string]: unknown
  }
}

/**
 * MCP 工具调用请求
 */
export interface MCPToolCallRequest {
  /**
   * 工具名称
   */
  toolName: string

  /**
   * 工具参数
   */
  arguments: Record<string, unknown>
}

/**
 * MCP 工具调用响应
 */
export interface MCPToolCallResponse {
  /**
   * 调用结果
   */
  result: unknown

  /**
   * 错误信息（如果有）
   */
  error?: string
}
