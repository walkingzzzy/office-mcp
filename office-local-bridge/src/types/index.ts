/**
 * office-local-bridge 类型定义
 */

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
  autoStart?: boolean
}

/**
 * AI 提供商类型
 */
export type AIProviderType = 'openai' | 'azure' | 'anthropic' | 'ollama' | 'custom'

/**
 * AI 提供商连接状态
 */
export type ConnectionStatus = 'unknown' | 'connected' | 'error'

/**
 * 模型类型
 */
export type ModelType = 'chat' | 'embedding' | 'multimodal'

/**
 * 已选择的模型（保存在 Provider 中）
 */
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

/**
 * AI 提供商配置
 */
export interface AIProviderConfig {
  id: string
  type: AIProviderType
  name: string
  enabled: boolean
  isDefault: boolean
  baseUrl: string
  apiKey: string
  connectionStatus: ConnectionStatus
  lastTestedAt?: number
  modelCount?: number
  /** 用户选择的模型列表（新格式） */
  selectedModels?: SelectedModel[]
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
  isDefault: boolean
  maxTokens: number
  temperature: number
  topP: number
  supportsVision: boolean
  supportsTools: boolean
  supportsStreaming: boolean
  contextWindow: number
}

/**
 * 模型预设
 */
export interface ModelPreset {
  name: string
  displayName: string
  contextWindow: number
  supportsVision: boolean
  supportsTools: boolean
  recommended: boolean
}

/**
 * 桥接服务配置
 */
export interface BridgeConfig {
  port: number
  host: string
  mcpServers: McpServerConfig[]
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  providers?: AIProviderConfig[]
  models?: ModelConfig[]
  defaultProviderId?: string
  defaultChatModelId?: string      // 默认对话模型 (格式: providerId:modelId)
  defaultEmbeddingModelId?: string // 默认嵌入模型 (格式: providerId:modelId)
  autoStart?: boolean
  minimizeToTray?: boolean
  version?: number
  // MCP 请求超时时间（毫秒），默认 30000
  mcpRequestTimeout?: number
  // 命令执行超时时间（毫秒），默认 60000
  commandTimeout?: number
  // API 认证 Token（可选，设置后启用认证）
  apiToken?: string
  // 知识库配置
  knowledge?: {
    useRealEmbeddings?: boolean  // 是否使用真实的 embedding API
    embeddingProvider?: string   // embedding 提供商（默认使用 defaultProviderId）
    embeddingModel?: string      // embedding 模型（默认 text-embedding-3-small）
  }
}

/**
 * 工具执行请求
 */
export interface ToolExecuteRequest {
  toolName: string
  args: Record<string, unknown>
  callId: string
  serverId?: string
}

/**
 * 工具执行结果
 */
export interface ToolExecuteResult {
  success: boolean
  data?: unknown
  error?: string
  callId: string
}

/**
 * 待执行命令
 */
export interface PendingCommand {
  callId: string
  toolName: string
  args: Record<string, unknown>
  serverId?: string
  timestamp: number
}

/**
 * 命令执行结果回调
 */
export interface CommandResult {
  callId: string
  success: boolean
  result?: unknown
  error?: string
}

/**
 * MCP 工具定义
 */
export interface McpTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  category?: string
}

/**
 * MCP 进程状态
 */
export interface McpProcessStatus {
  id: string
  name: string
  status: 'running' | 'stopped' | 'error'
  pid?: number
  startTime?: number
  lastError?: string
  // 扩展状态信息
  toolCount?: number
  tools?: McpTool[]
  uptime?: number
  memoryUsage?: number
  restartCount?: number
  lastActivityTime?: number
}

/**
 * JSON-RPC 请求
 */
export interface JsonRpcRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: unknown
}

/**
 * JSON-RPC 响应
 */
export interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: string | number
  result?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

/**
 * 健康检查响应
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error' | 'degraded'
  timestamp: number
  version: string
  mcpServers: McpProcessStatus[] | {
    total: number
    running: number
    stopped: number
    error: number
    details: McpProcessStatus[]
  }
  uptime?: {
    uptimeSeconds: number
    uptimeFormatted: string
    startTime: number
  }
  memory?: {
    heapUsed: number
    heapTotal: number
    external: number
    rss: number
    heapUsedMB: string
    rssMB: string
  }
  process?: {
    pid: number
    nodeVersion: string
    platform: string
    arch: string
  }
}

/**
 * 联网搜索配置
 */
export type SearchProvider = 'tavily' | 'serper' | 'bing' | 'google' | 'duckduckgo' | 'searxng'

export interface WebSearchConfig {
  enabled: boolean
  provider: SearchProvider
  apiKey: string
  maxResults: number
  searchDepth: 'basic' | 'advanced'
  includeImages: boolean
  includeDomains: string[]
  excludeDomains: string[]
  region?: string
  language?: string
  /** SearXNG 实例 URL */
  searxngInstanceUrl?: string
}

/**
 * 搜索结果
 */
export interface SearchResult {
  title: string
  url: string
  snippet: string
  score?: number
  publishedDate?: string
}

/**
 * 外部知识库服务提供商
 */
export type ExternalKBProvider = 'dify' | 'custom'

/**
 * 外部知识库连接状态
 */
export type ExternalKBConnectionStatus = 'unknown' | 'connected' | 'error'

/**
 * 外部知识库连接配置
 */
export interface ExternalKBConnection {
  id: string
  name: string
  provider: ExternalKBProvider
  apiEndpoint: string
  apiKey: string
  datasetId?: string
  enabled: boolean
  lastTested?: number
  status: ExternalKBConnectionStatus
  statusMessage?: string
}

/**
 * Dify 知识库数据集信息
 */
export interface DifyDataset {
  id: string
  name: string
  description?: string
  documentCount: number
  wordCount: number
  permission: string
  createdAt: string
  updatedAt: string
}

/**
 * 知识库搜索选项
 */
export interface KnowledgeSearchOptions {
  topK?: number
  scoreThreshold?: number
  searchMethod?: 'keyword_search' | 'semantic_search' | 'hybrid_search'
  rerankingEnable?: boolean
}

/**
 * 知识库搜索结果
 */
export interface KnowledgeSearchResult {
  content: string
  score: number
  title?: string
  documentId?: string
  documentName?: string
  metadata?: Record<string, unknown>
}

/**
 * 统一搜索结果（包含来源信息）
 */
export interface UnifiedSearchResult {
  source: 'knowledge_base' | 'web_search'
  connectionId?: string
  connectionName?: string
  results: KnowledgeSearchResult[] | SearchResult[]
  searchTime: number
}
