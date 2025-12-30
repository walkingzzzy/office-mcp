/**
 * @office-mcp/shared
 * Office MCP 服务器共享代码包
 */

// 导出基础类型（从 types 模块）
export {
  JsonSchemaProperty,
  ToolInputSchema,
  ToolExecutionResult,
  ToolHandler,
  ToolDefinition,
  ToolRegistryStats,
  ErrorContext,
  RecoveryStrategy,
  LogLevel,
  LogMetadata,
  McpServerConfig,
  McpProcessStatus
} from './types/index.js'

// 导出核心模块
export * from './core/index.js'

// 导出工具模块
export * from './utils/index.js'

// 导出工具类型（排除与 types 重复的）
export {
  ToolCategory,
  ApplicationType,
  ToolExample,
  ToolMetadata,
  ToolValidationError,
  ToolValidationResult
} from './tools/types.js'
