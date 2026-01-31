/**
 * 工具模块导出
 */

export { Logger, createLogger, logger } from './logger.js'
export type { LoggerConfig } from './logger.js'

export {
  HealthChecker,
  createHealthChecker,
  globalHealthChecker
} from './healthCheck.js'
export type { HealthStatus, HealthCheckResult, HealthCheck } from './healthCheck.js'

export * from './ErrorCodes.js'
export * from './ipc.js'
export * from './toolExecutor.js'

// 路径验证
export {
  validateFilePath,
  validateImagePath,
  validateDataFilePath,
  validateDocumentPath,
  sanitizeForLogging
} from './pathValidator.js'
export type { PathValidationResult } from './pathValidator.js'

// 参数验证
export {
  validateParams,
  validateActionParams,
  required,
  optional,
  stringParam,
  numberParam,
  booleanParam,
  cellParam,
  rangeParam,
  filePathParam,
  imagePathParam,
  textParam,
  indexParam
} from './paramValidator.js'
export type {
  ParamValidationResult,
  ParamRule,
  ActionParamRules
} from './paramValidator.js'

// 工具工厂
export {
  createActionTool,
  createSimpleTool,
  validateAction,
  unsupportedActionError
} from './toolFactory.js'
export type {
  ToolDefinition as FactoryToolDefinition,
  ActionToolConfig,
  SimpleToolConfig
} from './toolFactory.js'
