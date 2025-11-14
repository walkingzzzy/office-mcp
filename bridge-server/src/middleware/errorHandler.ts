import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import logger from '../utils/logger';

/**
 * 自定义错误类
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 错误处理中间件
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = '服务器内部错误';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  // 记录错误日志
  logger.error(`错误: ${message}`, {
    statusCode,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  // 返回错误响应
  const response: ApiResponse = {
    success: false,
    error: message,
    message: '请求失败',
  };

  res.status(statusCode).json(response);
};

/**
 * 404处理中间件
 */
export const notFoundHandler = (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: false,
    error: '路由不存在',
    message: `无法找到 ${req.method} ${req.originalUrl}`,
  };

  res.status(404).json(response);
};

/**
 * 异步路由包装器
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
