/**
 * API 认证中间件
 * 提供简单的 Token 认证机制
 * 
 * 安全特性：
 * - 使用 timingSafeEqual 防止时序攻击
 * - 配置缓存避免频繁文件读取
 */

import type { Request, Response, NextFunction } from 'express'
import { timingSafeEqual } from 'crypto'
import { loadConfig } from '../config/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('AuthMiddleware')

// 配置缓存，避免每次请求都读取配置文件
let cachedConfig: { apiToken?: string } | null = null
let configCacheTime = 0
const CONFIG_CACHE_TTL = 60000 // 1分钟缓存

function getCachedConfig() {
  const now = Date.now()
  if (!cachedConfig || now - configCacheTime > CONFIG_CACHE_TTL) {
    cachedConfig = loadConfig()
    configCacheTime = now
  }
  return cachedConfig
}

/**
 * 安全的 token 比较，防止时序攻击
 * @param provided 用户提供的 token
 * @param expected 期望的 token
 * @returns 是否匹配
 */
function secureTokenCompare(provided: string, expected: string): boolean {
  // 长度不同时，仍然执行比较以保持恒定时间
  const providedBuffer = Buffer.from(provided, 'utf8')
  const expectedBuffer = Buffer.from(expected, 'utf8')
  
  // 如果长度不同，创建相同长度的 buffer 进行比较
  if (providedBuffer.length !== expectedBuffer.length) {
    // 使用 expected 长度创建填充 buffer，确保恒定时间比较
    const paddedProvided = Buffer.alloc(expectedBuffer.length)
    providedBuffer.copy(paddedProvided, 0, 0, Math.min(providedBuffer.length, expectedBuffer.length))
    // 执行比较但返回 false（因为长度不同）
    timingSafeEqual(paddedProvided, expectedBuffer)
    return false
  }
  
  return timingSafeEqual(providedBuffer, expectedBuffer)
}

/**
 * Token 认证中间件
 * 如果配置了 apiToken，则验证请求头中的 Authorization
 */
export function tokenAuth(req: Request, res: Response, next: NextFunction): void {
  const config = getCachedConfig()

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

  // 使用安全比较验证 token，防止时序攻击
  if (!secureTokenCompare(token, config.apiToken)) {
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
  const config = getCachedConfig()

  // 如果未配置 token，允许所有连接
  if (!config.apiToken) {
    return true
  }

  // 如果没有提供 token
  if (!token) {
    return false
  }

  // 使用安全比较验证 token
  return secureTokenCompare(token, config.apiToken)
}
