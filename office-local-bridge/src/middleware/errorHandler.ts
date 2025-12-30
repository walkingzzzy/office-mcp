/**
 * 统一错误处理中间件
 * 提供集中式的错误处理和异步路由包装
 */

import type { Request, Response, NextFunction } from 'express'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('ErrorHandler')

/**
 * 扩展 Error 接口，支持 API 错误
 */
export interface ApiError extends Error {
  statusCode?: number
  code?: string
  details?: unknown
}

/**
 * 创建 API 错误
 */
export function createApiError(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: unknown
): ApiError {
  const error = new Error(message) as ApiError
  error.statusCode = statusCode
  error.code = code
  error.details = details
  return error
}

/**
 * 异步路由处理器包装器
 * 自动捕获异步错误并传递给 Express 错误处理中间件
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * 统一错误处理中间件
 * 处理所有未捕获的错误，返回统一的错误响应格式
 */
export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'
  const code = err.code || 'INTERNAL_ERROR'

  // 记录错误日志
  logger.error(`[${req.method}] ${req.path} - ${message}`, {
    error: err.message,
    stack: err.stack,
    code,
    statusCode,
    details: err.details
  })

  // 返回统一的错误响应
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      // 仅在开发环境返回详细信息
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err.details
      })
    }
  })
}

/**
 * 404 处理中间件
 * 处理未匹配的路由
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `路由未找到: ${req.method} ${req.path}`
    }
  })
}
