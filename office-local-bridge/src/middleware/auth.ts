/**
 * API 认证中间件
 * 提供简单的 Token 认证机制
 */

import type { Request, Response, NextFunction } from 'express'
import { loadConfig } from '../config/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('AuthMiddleware')

/**
 * Token 认证中间件
 * 如果配置了 apiToken，则验证请求头中的 Authorization
 */
export function tokenAuth(req: Request, res: Response, next: NextFunction): void {
  const config = loadConfig()

  // 如果未配置 token，跳过认证
  if (!config.apiToken) {
    return next()
  }

  const authHeader = req.headers.authorization

  // 检查 Authorization 头
  if (!authHeader) {
    logger.warn('请求缺少 Authorization 头', { path: req.path, ip: req.ip })
    res.status(401).json({ error: '未授权：缺少认证信息' })
    return
  }

  // 支持 Bearer token 格式
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader

  // 验证 token
  if (token !== config.apiToken) {
    logger.warn('Token 验证失败', { path: req.path, ip: req.ip })
    res.status(401).json({ error: '未授权：Token 无效' })
    return
  }

  next()
}

/**
 * 验证 WebSocket 连接的 Token
 * @param token 客户端提供的 token
 * @returns 是否验证通过
 */
export function validateWebSocketToken(token: string | undefined): boolean {
  const config = loadConfig()

  // 如果未配置 token，允许所有连接
  if (!config.apiToken) {
    return true
  }

  // 验证 token
  return token === config.apiToken
}
