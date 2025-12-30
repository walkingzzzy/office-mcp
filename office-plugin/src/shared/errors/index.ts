/**
 * 统一错误处理模块导出
 * 
 * @description 提供统一的错误处理工具，包括：
 * - Result 类型：函数式错误处理
 * - tryCatch 工具：简化 try-catch 模式
 * - 错误类型和处理器
 * 
 * @updated 2025-12-29 - 修复 P2 错误处理不一致问题
 */

export { OfficePluginError, ErrorCode, ErrorSeverity, ErrorHandler, HandleError } from './OfficePluginError'
export type { Result, Ok, Err } from './Result'
export { ok, err, tryCatch, tryCatchAsync, isOk, isErr, unwrap, unwrapOr, mapResult, flatMapResult } from './Result'
