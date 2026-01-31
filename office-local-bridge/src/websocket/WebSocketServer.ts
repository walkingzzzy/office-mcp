/**
 * WebSocket 服务器实现
 * 提供实时状态和日志推送
 */

import { WebSocketServer as WSServer, WebSocket } from 'ws'
import type { Server } from 'node:http'
import type { IncomingMessage } from 'node:http'
import { createLogger } from '../utils/logger.js'
import { validateWebSocketToken } from '../middleware/auth.js'
import type {
  ClientMessage,
  ServerMessage,
  ClientSubscription,
  SubscriptionChannel,
  StatusMessage,
  LogMessage
} from './types.js'
import type { LogEntry } from '../utils/LogStore.js'

const logger = createLogger('WebSocketServer')

/**
 * 连接速率限制记录
 */
interface RateLimitRecord {
  count: number
  resetTime: number
}

/**
 * WebSocket 服务器类
 */
export class WebSocketServer {
  private wss: WSServer
  private clients: Map<WebSocket, ClientSubscription> = new Map()
  private pingInterval: NodeJS.Timeout | null = null
  private logBuffer: LogEntry[] = []
  private logFlushInterval: NodeJS.Timeout | null = null
  private rateLimitCleanupInterval: NodeJS.Timeout | null = null
  private readonly LOG_BUFFER_TIME = 100 // 100ms 缓冲时间

  // 连接限制配置
  private readonly MAX_CONNECTIONS = 100 // 最大连接数
  private readonly RATE_LIMIT_WINDOW = 1000 // 速率限制窗口（1秒）
  private readonly MAX_CONNECTIONS_PER_IP = 5 // 每个IP每秒最多5个新连接
  private readonly RATE_LIMIT_CLEANUP_INTERVAL = 60000 // 每分钟清理一次过期记录
  private rateLimitMap: Map<string, RateLimitRecord> = new Map()

  constructor(server: Server) {
    this.wss = new WSServer({ server, path: '/ws' })
    this.setupServer()
    this.startPingInterval()
    this.startLogFlushInterval()
    this.startRateLimitCleanupInterval()
    logger.info('WebSocket 服务器已创建')
  }

  /**
   * 获取客户端 IP 地址
   */
  private getClientIP(req: IncomingMessage): string {
    // 优先使用 X-Forwarded-For 头（代理场景）
    const forwarded = req.headers['x-forwarded-for']
    if (forwarded) {
      const ips = typeof forwarded === 'string' ? forwarded : forwarded[0]
      return ips.split(',')[0].trim()
    }
    // 回退到 socket 地址
    return req.socket.remoteAddress || 'unknown'
  }

  /**
   * 检查连接速率限制
   * @returns true 如果超过限制，应该拒绝连接
   */
  private checkRateLimit(ip: string): boolean {
    const now = Date.now()
    const record = this.rateLimitMap.get(ip)

    if (!record || now >= record.resetTime) {
      // 新窗口，重置计数
      this.rateLimitMap.set(ip, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW
      })
      return false
    }

    // 增加计数
    record.count++

    // 检查是否超过限制
    if (record.count > this.MAX_CONNECTIONS_PER_IP) {
      logger.warn('连接速率超限', { ip, count: record.count })
      return true
    }

    return false
  }

  /**
   * 清理过期的速率限制记录
   */
  private cleanupRateLimitRecords(): void {
    const now = Date.now()
    let cleanedCount = 0
    for (const [ip, record] of this.rateLimitMap.entries()) {
      if (now >= record.resetTime) {
        this.rateLimitMap.delete(ip)
        cleanedCount++
      }
    }
    if (cleanedCount > 0) {
      logger.debug('清理过期速率限制记录', { 
        cleaned: cleanedCount, 
        remaining: this.rateLimitMap.size 
      })
    }
  }

  /**
   * 启动速率限制记录清理定时器
   */
  private startRateLimitCleanupInterval(): void {
    this.rateLimitCleanupInterval = setInterval(() => {
      this.cleanupRateLimitRecords()
    }, this.RATE_LIMIT_CLEANUP_INTERVAL)
  }

  /**
   * 设置服务器事件处理
   */
  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const clientIP = this.getClientIP(req)

      // 检查最大连接数
      if (this.clients.size >= this.MAX_CONNECTIONS) {
        logger.warn('WebSocket 连接被拒绝：超过最大连接数', {
          current: this.clients.size,
          max: this.MAX_CONNECTIONS
        })
        ws.close(4003, '服务器连接数已满')
        return
      }

      // 检查连接速率限制
      if (this.checkRateLimit(clientIP)) {
        logger.warn('WebSocket 连接被拒绝：连接速率超限', { ip: clientIP })
        ws.close(4029, '连接频率过高，请稍后重试')
        return
      }

      // 从 URL 查询参数或 Authorization 头获取 token
      const url = new URL(req.url || '', `http://${req.headers.host}`)
      const tokenFromQuery = url.searchParams.get('token')
      const authHeader = req.headers.authorization
      const tokenFromHeader = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader

      const token = tokenFromQuery || tokenFromHeader

      // 验证 token
      if (!validateWebSocketToken(token || undefined)) {
        logger.warn('WebSocket 连接被拒绝：Token 无效')
        ws.close(4001, '未授权：Token 无效')
        return
      }

      logger.info('客户端已连接', { ip: clientIP, totalConnections: this.clients.size + 1 })

      // 初始化客户端订阅
      this.clients.set(ws, {
        channels: new Set()
      })

      // 处理客户端消息
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as ClientMessage
          this.handleClientMessage(ws, message)
        } catch (error) {
          logger.error('解析客户端消息失败', { error })
          this.sendError(ws, '无效的消息格式')
        }
      })

      // 处理客户端断开
      ws.on('close', () => {
        logger.info('客户端已断开')
        this.clients.delete(ws)
      })

      // 处理错误
      ws.on('error', (error) => {
        logger.error('WebSocket 错误', { error })
        this.clients.delete(ws)
      })
    })
  }

  /**
   * 处理客户端消息
   */
  private handleClientMessage(ws: WebSocket, message: ClientMessage): void {
    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(ws, message.channels, message.filter)
        break
      case 'unsubscribe':
        this.handleUnsubscribe(ws, message.channels)
        break
      case 'pong':
        // 心跳响应，不需要处理
        break
      default:
        this.sendError(ws, '未知的消息类型')
    }
  }

  /**
   * 处理订阅
   */
  private handleSubscribe(
    ws: WebSocket,
    channels: SubscriptionChannel[],
    filter?: ClientSubscription['filter']
  ): void {
    const subscription = this.clients.get(ws)
    if (!subscription) return

    for (const channel of channels) {
      subscription.channels.add(channel)
    }

    if (filter) {
      subscription.filter = filter
    }

    logger.info('客户端已订阅', { channels, filter })
  }

  /**
   * 处理取消订阅
   */
  private handleUnsubscribe(ws: WebSocket, channels: SubscriptionChannel[]): void {
    const subscription = this.clients.get(ws)
    if (!subscription) return

    for (const channel of channels) {
      subscription.channels.delete(channel)
    }

    logger.info('客户端已取消订阅', { channels })
  }

  /**
   * 发送消息到客户端
   */
  private sendMessage(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message))
      } catch (error) {
        logger.error('发送消息失败', { error })
      }
    }
  }

  /**
   * 发送错误消息
   */
  private sendError(ws: WebSocket, message: string, code?: string): void {
    this.sendMessage(ws, {
      type: 'error',
      message,
      code
    })
  }

  /**
   * 广播状态更新
   */
  broadcastStatus(serverId: string, status: 'running' | 'stopped' | 'error', message?: string, pid?: number): void {
    const statusMessage: StatusMessage = {
      type: 'status',
      data: {
        serverId,
        status,
        timestamp: Date.now(),
        message,
        pid
      }
    }

    for (const [ws, subscription] of this.clients.entries()) {
      if (subscription.channels.has('status')) {
        // 应用过滤器
        if (subscription.filter?.serverId && subscription.filter.serverId !== serverId) {
          continue
        }
        this.sendMessage(ws, statusMessage)
      }
    }
  }

  /**
   * 广播日志（添加到缓冲区）
   */
  broadcastLog(logEntry: LogEntry): void {
    this.logBuffer.push(logEntry)
  }

  /**
   * 启动日志刷新定时器
   */
  private startLogFlushInterval(): void {
    this.logFlushInterval = setInterval(() => {
      this.flushLogBuffer()
    }, this.LOG_BUFFER_TIME)
  }

  /**
   * 刷新日志缓冲区
   */
  private flushLogBuffer(): void {
    if (this.logBuffer.length === 0) {
      return
    }

    // 获取缓冲区中的所有日志
    const logs = [...this.logBuffer]
    this.logBuffer = []

    // 为每个客户端发送符合其过滤条件的日志
    for (const [ws, subscription] of this.clients.entries()) {
      if (!subscription.channels.has('logs')) {
        continue
      }

      // 过滤日志
      const filteredLogs = logs.filter(logEntry => {
        if (subscription.filter?.module && subscription.filter.module !== logEntry.module) {
          return false
        }
        if (subscription.filter?.level && subscription.filter.level !== logEntry.level) {
          return false
        }
        return true
      })

      // 批量发送
      if (filteredLogs.length > 0) {
        for (const logEntry of filteredLogs) {
          const logMessage: LogMessage = {
            type: 'log',
            data: logEntry
          }
          this.sendMessage(ws, logMessage)
        }
      }
    }
  }

  /**
   * 启动心跳检测
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      for (const [ws] of this.clients.entries()) {
        if (ws.readyState === WebSocket.OPEN) {
          this.sendMessage(ws, {
            type: 'ping',
            timestamp: Date.now()
          })
        }
      }
    }, 30000) // 30秒心跳
  }

  /**
   * 关闭服务器
   */
  close(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }

    if (this.logFlushInterval) {
      clearInterval(this.logFlushInterval)
      this.logFlushInterval = null
    }

    if (this.rateLimitCleanupInterval) {
      clearInterval(this.rateLimitCleanupInterval)
      this.rateLimitCleanupInterval = null
    }

    // 清理速率限制记录
    this.rateLimitMap.clear()

    // 刷新剩余的日志
    this.flushLogBuffer()

    for (const [ws] of this.clients.entries()) {
      ws.close()
    }

    this.wss.close()
    logger.info('WebSocket 服务器已关闭')
  }
}
