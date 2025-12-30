/**
 * 日志工具
 */

import { logStore, type LogEntry } from './LogStore.js'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

let currentLevel: LogLevel = 'info'

/**
 * 设置日志级别
 */
export function setLogLevel(level: LogLevel): void {
  currentLevel = level
}

/**
 * 获取当前时间戳
 */
function getTimestamp(): string {
  return new Date().toISOString()
}

/**
 * 格式化日志消息
 */
function formatMessage(level: LogLevel, module: string, message: string, data?: unknown): string {
  const timestamp = getTimestamp()
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${module}]`
  if (data !== undefined) {
    return `${prefix} ${message} ${JSON.stringify(data)}`
  }
  return `${prefix} ${message}`
}

/**
 * 记录日志到存储
 */
function logToStore(level: LogLevel, module: string, message: string, data?: unknown): void {
  const entry: LogEntry = {
    timestamp: Date.now(),
    level,
    module,
    message,
    data
  }
  logStore.add(module, entry)
}

/**
 * 创建模块日志器
 */
export function createLogger(module: string) {
  return {
    debug(message: string, data?: unknown): void {
      logToStore('debug', module, message, data)
      if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.debug) {
        console.log(formatMessage('debug', module, message, data))
      }
    },

    info(message: string, data?: unknown): void {
      logToStore('info', module, message, data)
      if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.info) {
        console.log(formatMessage('info', module, message, data))
      }
    },

    warn(message: string, data?: unknown): void {
      logToStore('warn', module, message, data)
      if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.warn) {
        console.warn(formatMessage('warn', module, message, data))
      }
    },

    error(message: string, data?: unknown): void {
      logToStore('error', module, message, data)
      if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.error) {
        console.error(formatMessage('error', module, message, data))
      }
    }
  }
}

export const logger = createLogger('Bridge')
export { logStore } from './LogStore.js'
