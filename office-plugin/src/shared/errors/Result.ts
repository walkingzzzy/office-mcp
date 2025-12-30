/**
 * Result 类型 - 函数式错误处理
 * 
 * @description 提供类型安全的错误处理方式，避免 try-catch 的不一致性
 * 
 * 使用场景：
 * - 需要明确处理成功/失败两种情况
 * - 避免静默吞掉错误
 * - 链式处理多个可能失败的操作
 * 
 * @example
 * ```typescript
 * // 基本使用
 * const result = await tryCatchAsync(() => fetchData())
 * if (isOk(result)) {
 *   console.log(result.data)
 * } else {
 *   handleError(result.error)
 * }
 * 
 * // 链式处理
 * const finalResult = mapResult(result, data => data.items)
 * ```
 * 
 * @updated 2025-12-29 - 修复 P2 错误处理不一致问题
 */

import { OfficePluginError, ErrorCode, ErrorSeverity, ErrorHandler } from './OfficePluginError'

/**
 * 成功结果
 */
export interface Ok<T> {
  readonly success: true
  readonly data: T
}

/**
 * 失败结果
 */
export interface Err<E = OfficePluginError> {
  readonly success: false
  readonly error: E
}

/**
 * Result 类型 - 表示可能成功或失败的操作结果
 */
export type Result<T, E = OfficePluginError> = Ok<T> | Err<E>

/**
 * 创建成功结果
 */
export function ok<T>(data: T): Ok<T> {
  return { success: true, data }
}

/**
 * 创建失败结果
 */
export function err<E = OfficePluginError>(error: E): Err<E> {
  return { success: false, error }
}

/**
 * 检查是否为成功结果
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.success === true
}

/**
 * 检查是否为失败结果
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.success === false
}

/**
 * 解包成功结果，失败时抛出错误
 */
export function unwrap<T, E extends Error>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.data
  }
  throw result.error
}

/**
 * 解包成功结果，失败时返回默认值
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isOk(result)) {
    return result.data
  }
  return defaultValue
}

/**
 * 映射成功结果
 */
export function mapResult<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.data))
  }
  return result
}

/**
 * 扁平映射成功结果
 */
export function flatMapResult<T, U, E>(result: Result<T, E>, fn: (data: T) => Result<U, E>): Result<U, E> {
  if (isOk(result)) {
    return fn(result.data)
  }
  return result
}

/**
 * 同步 try-catch 包装器
 * 
 * @example
 * ```typescript
 * const result = tryCatch(() => JSON.parse(jsonString))
 * if (isOk(result)) {
 *   console.log(result.data)
 * }
 * ```
 */
export function tryCatch<T>(
  fn: () => T,
  errorCode: ErrorCode = ErrorCode.OPERATION_FAILED,
  context?: string
): Result<T> {
  try {
    const data = fn()
    return ok(data)
  } catch (error) {
    const pluginError = error instanceof OfficePluginError
      ? error
      : new OfficePluginError(
          context || (error instanceof Error ? error.message : String(error)),
          errorCode,
          ErrorSeverity.ERROR,
          error instanceof Error ? error : undefined
        )
    return err(pluginError)
  }
}

/**
 * 异步 try-catch 包装器
 * 
 * @example
 * ```typescript
 * const result = await tryCatchAsync(
 *   () => fetchUserData(userId),
 *   ErrorCode.API_ERROR,
 *   '获取用户数据失败'
 * )
 * ```
 */
export async function tryCatchAsync<T>(
  fn: () => Promise<T>,
  errorCode: ErrorCode = ErrorCode.OPERATION_FAILED,
  context?: string
): Promise<Result<T>> {
  try {
    const data = await fn()
    return ok(data)
  } catch (error) {
    const pluginError = error instanceof OfficePluginError
      ? error
      : new OfficePluginError(
          context || (error instanceof Error ? error.message : String(error)),
          errorCode,
          ErrorSeverity.ERROR,
          error instanceof Error ? error : undefined
        )
    return err(pluginError)
  }
}

/**
 * 带日志记录的异步 try-catch 包装器
 * 
 * @example
 * ```typescript
 * const result = await tryCatchWithLog(
 *   () => saveDocument(),
 *   ErrorCode.STORAGE_ERROR,
 *   '保存文档'
 * )
 * ```
 */
export async function tryCatchWithLog<T>(
  fn: () => Promise<T>,
  errorCode: ErrorCode = ErrorCode.OPERATION_FAILED,
  context?: string
): Promise<Result<T>> {
  const result = await tryCatchAsync(fn, errorCode, context)
  
  if (isErr(result)) {
    ErrorHandler.log(result.error)
  }
  
  return result
}

/**
 * 带用户通知的异步 try-catch 包装器
 * 
 * @example
 * ```typescript
 * const result = await tryCatchWithNotify(
 *   () => deleteFile(fileId),
 *   ErrorCode.OPERATION_FAILED,
 *   '删除文件'
 * )
 * ```
 */
export async function tryCatchWithNotify<T>(
  fn: () => Promise<T>,
  errorCode: ErrorCode = ErrorCode.OPERATION_FAILED,
  context?: string
): Promise<Result<T>> {
  const result = await tryCatchAsync(fn, errorCode, context)
  
  if (isErr(result)) {
    ErrorHandler.showUserError(result.error)
  }
  
  return result
}

/**
 * 组合多个 Result
 * 
 * @example
 * ```typescript
 * const results = await Promise.all([
 *   tryCatchAsync(() => fetchUser()),
 *   tryCatchAsync(() => fetchPosts())
 * ])
 * const combined = combineResults(results)
 * ```
 */
export function combineResults<T>(results: Result<T>[]): Result<T[]> {
  const data: T[] = []
  
  for (const result of results) {
    if (isErr(result)) {
      return result
    }
    data.push(result.data)
  }
  
  return ok(data)
}

/**
 * 从 Result 数组中收集所有成功的结果
 */
export function collectOk<T>(results: Result<T>[]): T[] {
  return results.filter(isOk).map(r => r.data)
}

/**
 * 从 Result 数组中收集所有错误
 */
export function collectErr<T, E>(results: Result<T, E>[]): E[] {
  return results.filter(isErr).map(r => r.error)
}
