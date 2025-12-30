/**
 * WebSocket 消息类型定义
 */

import type { LogEntry } from '../utils/LogStore.js'

/**
 * WebSocket 消息类型
 */
export type WebSocketMessageType = 'subscribe' | 'unsubscribe' | 'status' | 'log' | 'ping' | 'pong' | 'error'

/**
 * 订阅频道
 */
export type SubscriptionChannel = 'status' | 'logs'

/**
 * 客户端消息 - 订阅
 */
export interface SubscribeMessage {
  type: 'subscribe'
  channels: SubscriptionChannel[]
  filter?: {
    module?: string
    level?: string
    serverId?: string
  }
}

/**
 * 客户端消息 - 取消订阅
 */
export interface UnsubscribeMessage {
  type: 'unsubscribe'
  channels: SubscriptionChannel[]
}

/**
 * 服务端消息 - 状态更新
 */
export interface StatusMessage {
  type: 'status'
  data: {
    serverId: string
    status: 'running' | 'stopped' | 'error'
    timestamp: number
    message?: string
    pid?: number
  }
}

/**
 * 服务端消息 - 日志
 */
export interface LogMessage {
  type: 'log'
  data: LogEntry
}

/**
 * 服务端消息 - 心跳
 */
export interface PingMessage {
  type: 'ping'
  timestamp: number
}

/**
 * 客户端消息 - 心跳响应
 */
export interface PongMessage {
  type: 'pong'
  timestamp: number
}

/**
 * 服务端消息 - 错误
 */
export interface ErrorMessage {
  type: 'error'
  message: string
  code?: string
}

/**
 * 所有客户端消息类型
 */
export type ClientMessage = SubscribeMessage | UnsubscribeMessage | PongMessage

/**
 * 所有服务端消息类型
 */
export type ServerMessage = StatusMessage | LogMessage | PingMessage | ErrorMessage

/**
 * 客户端订阅信息
 */
export interface ClientSubscription {
  channels: Set<SubscriptionChannel>
  filter?: {
    module?: string
    level?: string
    serverId?: string
  }
}
