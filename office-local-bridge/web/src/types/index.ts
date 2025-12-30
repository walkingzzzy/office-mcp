/**
 * 前端配置类型定义
 */

/**
 * AI 提供商类型
 */
export type AIProviderType = 'openai' | 'azure' | 'anthropic' | 'ollama' | 'custom'

/**
 * AI 提供商配置
 */
export interface AIProviderConfig {
  id: string
  type: AIProviderType
  name: string
  enabled: boolean
  apiKey: string
  baseUrl?: string
  azureEndpoint?: string
  azureDeployment?: string
  azureApiVersion?: string
  customHeaders?: Record<string, string>
  connectionStatus?: 'unknown' | 'connected' | 'error'
  lastTestedAt?: number
  /** 用户选择的模型列表 */
  selectedModels?: string[]
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
  type: AIProviderType
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
 * 模型配置
 */
export interface ModelConfig {
  id: string
  providerId: string
  name: string
  displayName: string
  enabled: boolean
  maxTokens?: number
  temperature?: number
}

/**
 * MCP 服务器配置
 */
export interface McpServerConfig {
  id: string
  name: string
  command: string
  args?: string[]
  cwd?: string
  env?: Record<string, string>
  enabled: boolean
}

/**
 * MCP 服务器状态
 */
export interface McpServerStatus {
  id: string
  name: string
  status: 'running' | 'stopped' | 'error'
  pid?: number
  startTime?: number
  lastError?: string
}

/**
 * 联网搜索配置
 */
export interface WebSearchConfig {
  enabled: boolean
  provider: 'tavily' | 'serper' | 'bing' | 'google'
  apiKey: string
  maxResults?: number
}

/**
 * 桥接服务配置
 */
export interface BridgeConfig {
  port: number
  host: string
  mcpServers: McpServerConfig[]
  providers: AIProviderConfig[]
  models: ModelConfig[]
  webSearch: WebSearchConfig
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

/**
 * 健康检查响应
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error'
  timestamp: number
  mcpServers: McpServerStatus[]
}
