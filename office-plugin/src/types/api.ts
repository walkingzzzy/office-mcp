/**
 * API 类型定义
 * 统一定义所有 API 接口的请求和响应类型
 * 
 * @created 2025-12-29 - 修复 P1 类型安全问题
 */

// ==================== MCP 相关类型 ====================

/**
 * MCP 服务器状态
 */
export type McpServerStatus = 'running' | 'stopped' | 'error' | 'starting' | 'unknown'

/**
 * MCP 工具输入参数 Schema
 */
export interface McpToolInputSchema {
  type: 'object'
  properties?: Record<string, {
    type: string
    description?: string
    enum?: string[]
    default?: unknown
  }>
  required?: string[]
}

/**
 * MCP 工具定义
 */
export interface McpTool {
  name: string
  description: string
  inputSchema: McpToolInputSchema
}

/**
 * MCP 服务器信息
 */
export interface McpServer {
  id: string
  name: string
  status?: McpServerStatus
  tools?: McpTool[]
  description?: string
  version?: string
  enabled?: boolean
}

/**
 * MCP 服务器状态详情
 */
export interface McpServerStatusDetail {
  status: McpServerStatus
  uptime?: number
  lastError?: string
  toolCount?: number
}

/**
 * MCP 工具调用参数
 */
export type McpToolArgs = Record<string, unknown>

/**
 * MCP 工具调用结果
 */
export interface McpToolResult {
  success: boolean
  data?: unknown
  error?: string
  executionTime?: number
}

// ==================== 助手相关类型 ====================

/**
 * 助手模型配置
 */
export interface AssistantModel {
  id: string
  providerId: string
  name: string
  maxTokens?: number
  temperature?: number
  type?: string
  displayName?: string
}

/**
 * 助手设置
 */
export interface AssistantSettings {
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

/**
 * 助手信息
 */
export interface Assistant {
  id: string
  name: string
  description?: string
  model?: AssistantModel
  settings?: AssistantSettings
  knowledgeBases?: string[]
  mcpTools?: string[]
  createdAt?: string
  updatedAt?: string
}

/**
 * 助手更新参数
 */
export interface AssistantUpdateParams {
  name?: string
  description?: string
  model?: Partial<AssistantModel>
  settings?: Partial<AssistantSettings>
  knowledgeBases?: string[]
  mcpTools?: string[]
}

// ==================== 对话相关类型 ====================

/**
 * 对话消息角色
 */
export type ConversationMessageRole = 'user' | 'assistant' | 'system'

/**
 * 对话消息
 */
export interface ConversationMessage {
  id: string
  role: ConversationMessageRole
  content: string
  timestamp: string
  metadata?: Record<string, unknown>
}

/**
 * 对话信息
 */
export interface Conversation {
  id: string
  name?: string
  title?: string
  assistantId?: string
  messages?: ConversationMessage[]
  createdAt?: string
  updatedAt?: string
  favorite?: boolean
}

/**
 * 对话更新参数
 */
export interface ConversationUpdateParams {
  name?: string
  title?: string
  favorite?: boolean
}

// ==================== 知识库相关类型 ====================

/**
 * 知识库项目
 */
export interface KnowledgeBaseItem {
  id: string
  name: string
  type: 'file' | 'url' | 'text'
  content?: string
  filePath?: string
  url?: string
  createdAt?: string
}

/**
 * 知识库信息
 */
export interface KnowledgeBase {
  id: string
  name: string
  description?: string
  items?: KnowledgeBaseItem[]
  createdAt?: string
  updatedAt?: string
  enabled?: boolean
}

// ==================== 消息相关类型 ====================

/**
 * API 消息
 */
export interface ApiMessage {
  id: string
  role: ConversationMessageRole
  content: string
  timestamp: string
  topicId?: string
  metadata?: Record<string, unknown>
}

// ==================== 通用类型 ====================

/**
 * API 错误响应
 */
export interface ApiError {
  code: string
  message: string
  details?: unknown
}

/**
 * 健康检查响应
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error' | 'degraded'
  timestamp: number
  version: string
  services?: Record<string, {
    status: 'ok' | 'error'
    latency?: number
  }>
}

/**
 * Provider 配置
 */
export interface Provider {
  id: string
  name: string
  enabled: boolean
  baseUrl?: string
  apiKey?: string
  description?: string
}

/**
 * Model 配置
 */
export interface Model {
  id: string
  providerId: string
  name: string
  type?: string | string[]
  displayName?: string
  maxTokens?: number
  contextWindow?: number
  supportVision?: boolean
  supportFunctionCall?: boolean
  capabilities?: Array<{
    type: string
    [key: string]: unknown
  }> | {
    vision?: boolean
    functionCalling?: boolean
    streaming?: boolean
    [key: string]: unknown
  }
}

/**
 * 功能标志
 */
export interface FeatureFlags {
  enableMcp?: boolean
  enableKnowledgeBase?: boolean
  enableWebSearch?: boolean
  enableVision?: boolean
  [key: string]: unknown
}

/**
 * Office 插件配置响应
 */
export interface OfficePluginConfigResponse {
  providers: Provider[]
  models: Model[]
  assistants: Assistant[]
  knowledgeBases: KnowledgeBase[]
  mcpServers: McpServer[]
  mcpTools?: McpTool[]
  featureFlags?: FeatureFlags
  settings?: {
    theme?: string
    language?: string
    apiKey?: string
    apiHost?: string
    [key: string]: unknown
  }
  syncInfo?: {
    lastSync?: string
    status?: string
    version?: string
    timestamp?: number | string
  }
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}


/**
 * 知识库搜索结果 (从 ai.ts 重新导出以保持兼容性)
 */
export type { KnowledgeSearchResult } from './ai'
