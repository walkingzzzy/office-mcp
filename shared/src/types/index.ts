/**
 * 工具定义类型
 * 用于定义 MCP 服务器中的工具
 */

/**
 * JSON Schema 属性定义
 */
export interface JsonSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'
  description?: string
  enum?: (string | number | boolean)[]
  default?: unknown
  items?: JsonSchemaProperty
  properties?: Record<string, JsonSchemaProperty>
  required?: string[]
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  pattern?: string
}

/**
 * 工具输入 Schema
 */
export interface ToolInputSchema {
  type: 'object'
  properties: Record<string, JsonSchemaProperty>
  required?: string[]
  additionalProperties?: boolean
}

/**
 * 工具执行结果
 */
export interface ToolExecutionResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
  executionTime?: number
}

/**
 * 工具处理函数类型
 */
export type ToolHandler<TArgs = Record<string, unknown>, TResult = unknown> = (
  args: TArgs
) => Promise<ToolExecutionResult<TResult>>

/**
 * 工具定义
 */
export interface ToolDefinition<TArgs = Record<string, unknown>, TResult = unknown> {
  /** 工具名称 */
  name: string
  /** 工具描述 */
  description: string
  /** 工具分类 */
  category: string
  /** 输入参数 Schema */
  inputSchema: ToolInputSchema
  /** 工具处理函数 */
  handler: ToolHandler<TArgs, TResult>
  /** 工具标签 */
  tags?: string[]
  /** 是否启用 */
  enabled?: boolean
  /** 优先级 */
  priority?: 'P0' | 'P1' | 'P2' | 'P3'
}

/**
 * 工具注册表统计信息
 */
export interface ToolRegistryStats {
  total: number
  byCategory: Record<string, number>
  byPriority?: Record<string, number>
}

/**
 * 错误上下文
 */
export interface ErrorContext {
  error: Error
  timestamp: Date
  operation?: string
  metadata?: Record<string, unknown>
  recovered?: boolean
}

/**
 * 错误恢复策略
 */
export interface RecoveryStrategy {
  name: string
  canHandle: (error: Error) => boolean
  recover: (context: ErrorContext) => Promise<boolean>
  priority?: number
}

/**
 * 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * 日志元数据
 */
export type LogMetadata = Record<string, unknown>

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
 * MCP 进程状态
 */
export interface McpProcessStatus {
  id: string
  name: string
  status: 'running' | 'stopped' | 'error'
  pid?: number
  startTime?: number
  lastError?: string
  restartCount?: number
}
