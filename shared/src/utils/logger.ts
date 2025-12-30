/**
 * 通用日志工具
 * 为 MCP 服务器提供统一的日志接口
 */

import type { LogLevel, LogMetadata } from '../types/index.js'

/**
 * 日志配置
 */
export interface LoggerConfig {
  /** 最小日志级别 */
  minLevel?: LogLevel
  /** 是否输出到 stderr（MCP 服务器需要，因为 stdout 用于通信） */
  useStderr?: boolean
  /** 是否启用彩色输出 */
  colorize?: boolean
  /** 日志前缀 */
  prefix?: string
}

/**
 * 日志级别优先级
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

/**
 * 日志级别颜色（ANSI）
 */
const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // 青色
  info: '\x1b[32m',  // 绿色
  warn: '\x1b[33m',  // 黄色
  error: '\x1b[31m'  // 红色
}

const RESET_COLOR = '\x1b[0m'

/**
 * 通用日志类
 */
export class Logger {
  private prefix: string
  private minLevel: LogLevel
  private useStderr: boolean
  private colorize: boolean

  constructor(prefix: string, config?: LoggerConfig) {
    this.prefix = prefix
    this.minLevel = config?.minLevel ?? 'info'
    this.useStderr = config?.useStderr ?? true
    this.colorize = config?.colorize ?? true
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString()
    const levelStr = level.toUpperCase().padEnd(5)

    let formatted = `[${timestamp}] [${levelStr}] [${this.prefix}] ${message}`

    if (metadata && Object.keys(metadata).length > 0) {
      formatted += ` ${JSON.stringify(metadata)}`
    }

    if (this.colorize) {
      const color = LOG_LEVEL_COLORS[level]
      formatted = `${color}${formatted}${RESET_COLOR}`
    }

    return formatted
  }

  /**
   * 检查是否应该输出该级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel]
  }

  /**
   * 输出日志
   */
  private output(level: LogLevel, message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog(level)) return

    const formatted = this.formatMessage(level, message, metadata)

    // MCP 服务器必须使用 stderr，因为 stdout 用于 JSON-RPC 通信
    if (this.useStderr) {
      console.error(formatted)
    } else {
      if (level === 'error') {
        console.error(formatted)
      } else if (level === 'warn') {
        console.warn(formatted)
      } else {
        console.log(formatted)
      }
    }
  }

  /**
   * 调试日志
   */
  debug(message: string, metadata?: LogMetadata): void {
    this.output('debug', message, metadata)
  }

  /**
   * 信息日志
   */
  info(message: string, metadata?: LogMetadata): void {
    this.output('info', message, metadata)
  }

  /**
   * 警告日志
   */
  warn(message: string, metadata?: LogMetadata): void {
    this.output('warn', message, metadata)
  }

  /**
   * 错误日志
   */
  error(message: string, metadata?: LogMetadata): void {
    this.output('error', message, metadata)
  }

  /**
   * 设置最小日志级别
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level
  }

  /**
   * 创建子日志器
   */
  child(subPrefix: string): Logger {
    return new Logger(`${this.prefix}:${subPrefix}`, {
      minLevel: this.minLevel,
      useStderr: this.useStderr,
      colorize: this.colorize
    })
  }
}

/**
 * 创建日志器工厂函数
 */
export function createLogger(prefix: string, config?: LoggerConfig): Logger {
  return new Logger(prefix, config)
}

/**
 * 默认日志器
 */
export const logger = createLogger('MCP')
