/**
 * 类型定义
 */

// AI 提供商类型
export type AIProviderType = 'openai' | 'azure' | 'anthropic' | 'ollama' | 'custom'

// 模型类型
export type ModelType = 'chat' | 'embedding' | 'multimodal'

// 已选择的模型（保存在 Provider 中）
export interface SelectedModel {
  id: string
  name: string
  displayName?: string
  modelType: ModelType
  contextWindow?: number
  supportsVision?: boolean
  supportsTools?: boolean
  supportsStreaming?: boolean
}

// AI 提供商配置
export interface AIProviderConfig {
  id: string
  type: AIProviderType
  name: string
  enabled: boolean
  isDefault: boolean
  apiKey: string
  baseUrl?: string
  // Azure 特有
  azureEndpoint?: string
  azureDeployment?: string
  azureApiVersion?: string
  // 自定义端点
  customHeaders?: Record<string, string>
  // 已选择的模型列表
  selectedModels?: SelectedModel[]
  // 状态
  connectionStatus?: 'connected' | 'disconnected' | 'unknown'
  lastTestedAt?: number
}

// 模型配置
export interface ModelConfig {
  id: string
  providerId: string
  name: string
  displayName: string
  enabled: boolean
  isDefault: boolean
  // 参数配置
  maxTokens?: number
  temperature?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  // 功能支持
  supportsVision?: boolean
  supportsTools?: boolean
  supportsStreaming?: boolean
  // 上下文窗口
  contextWindow?: number
}

// MCP 服务器配置
export interface McpServerConfig {
  id: string
  name: string
  command: string
  args?: string[]
  cwd?: string
  env?: Record<string, string>
  enabled: boolean
  autoStart: boolean
}

// MCP 工具定义
export interface McpTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  category?: string
}

// MCP 服务器状态
export interface McpServerStatus {
  id: string
  name: string
  status: 'running' | 'stopped' | 'error'
  pid?: number
  startTime?: number
  lastError?: string
  toolCount?: number
  tools?: McpTool[]
  uptime?: number
  memoryUsage?: number
  restartCount?: number
  lastActivityTime?: number
}

// 日志条目
export interface LogEntry {
  timestamp: number
  level: 'debug' | 'info' | 'warn' | 'error'
  module: string
  message: string
  data?: Record<string, unknown>
}

// 主配置
export interface BridgeConfig {
  version: number
  port: number
  host: string
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  defaultProviderId?: string
  defaultChatModelId?: string      // 默认对话模型
  defaultEmbeddingModelId?: string // 默认嵌入模型
  autoStart: boolean
  minimizeToTray: boolean
}

// 桥接服务状态
export interface BridgeStatus {
  running: boolean
  port: number
  url: string
  uptime?: number
}

// API 响应格式
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// 连接测试结果
export interface ConnectionTestResult {
  success: boolean
  latency?: number
  error?: string
  availableModels?: string[]
}

// 模型信息（从 API 获取）
export interface ModelInfo {
  id: string
  name: string
  description?: string
  contextWindow?: number
  supportsVision?: boolean
  supportsTools?: boolean
  supportsStreaming?: boolean
  modelType?: ModelType
}

// 验证供应商请求
export interface ValidateProviderRequest {
  type: AIProviderType
  apiKey: string
  baseUrl?: string
  azureEndpoint?: string
  azureDeployment?: string
  azureApiVersion?: string
}

// 验证供应商响应
export interface ValidateProviderResponse {
  valid: boolean
  error?: string
  models?: ModelInfo[]
}

// 测试模型请求
export interface TestModelRequest {
  modelId: string
  testMessage?: string
}

// 测试模型响应
export interface TestModelResponse {
  success: boolean
  response?: string
  latency?: number
  error?: string
}

// ===== Office 相关类型 =====

// Office 应用名称
export type OfficeAppName = 'Word' | 'Excel' | 'PowerPoint' | 'Outlook' | 'OneNote'

// Office 应用信息
export interface OfficeApp {
  name: OfficeAppName
  installed: boolean
  path?: string
  version?: string
}

// Office 环境信息
export interface OfficeEnvironment {
  detected: boolean
  version?: string
  versionNumber?: string
  installPath?: string
  platform?: string
  apps: OfficeApp[]
  clickToRun?: boolean
  lastChecked?: string
}

// Office 应用类型（与后端一致）
export type OfficeAppType = 'Word' | 'Excel' | 'PowerPoint' | 'Outlook' | 'OneNote'

// Office 插件信息
export interface OfficePlugin {
  id: string
  name: string
  version: string
  provider?: string
  description?: string
  manifestPath: string
  supportedApps: OfficeAppType[]
  installedAt?: string
  sourceUrl?: string
  iconUrl?: string
}
