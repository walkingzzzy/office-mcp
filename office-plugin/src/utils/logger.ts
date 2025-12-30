/**
 * Logger - Office 插件统一日志服务
 * 提供结构化日志记录，便于开发调试和问题诊断
 * 
 * @updated 2025-12-29 - 改进类型安全 (修复 P1)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * 日志数据类型 - 替代 any
 * 支持各种数据类型，包括自定义接口对象
 */
export type LogData = Record<string, unknown> | unknown[] | string | number | boolean | null | undefined | object | unknown

export interface LogEntry {
  timestamp: string
  level: LogLevel
  context: string
  message: string
  data?: LogData
}

class Logger {
  private context: string
  private isDev: boolean
  private quietMode: boolean

  constructor(context: string = 'OfficePlugin') {
    this.context = context
    // 浏览器环境兼容：使用 import.meta.env
    this.isDev = import.meta.env?.DEV === true
    // 检查是否启用安静模式（减少日志输出）
    this.quietMode = localStorage.getItem('office-plugin-quiet-mode') === 'true' ||
                     import.meta.env?.VITE_OFFICE_PLUGIN_QUIET === 'true'
  }

  /**
   * 创建带有特定上下文的 Logger 实例
   */
  withContext(context: string): Logger {
    return new Logger(context)
  }

  /**
   * 格式化日志输出
   */
  private formatLog(level: LogLevel, message: string, data?: LogData): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      data
    }
  }

  /**
   * 检查是否应该输出日志
   */
  private shouldLog(level: LogLevel): boolean {
    // 安静模式下只显示错误和警告
    if (this.quietMode) {
      return level === 'error' || level === 'warn'
    }

    // 开发环境下显示所有日志
    if (this.isDev) {
      return true
    }

    // 生产环境下只显示 info、warn、error
    return level !== 'debug'
  }

  /**
   * 输出日志到控制台
   */
  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return
    }

    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.context}]`
    const message = `${prefix} ${entry.message}`

    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.data || '')
        break
      case 'info':
        console.info(message, entry.data || '')
        break
      case 'warn':
        console.warn(message, entry.data || '')
        break
      case 'error':
        console.error(message, entry.data || '')
        break
    }
  }

  /**
   * Debug 级别日志（仅开发环境）
   */
  debug(message: string, data?: LogData): void {
    const entry = this.formatLog('debug', message, data)
    this.output(entry)
  }

  /**
   * Info 级别日志
   */
  info(message: string, data?: LogData): void {
    const entry = this.formatLog('info', message, data)
    this.output(entry)
  }

  /**
   * Warning 级别日志
   */
  warn(message: string, data?: LogData): void {
    const entry = this.formatLog('warn', message, data)
    this.output(entry)
  }

  /**
   * Error 级别日志
   */
  error(message: string, error?: Error | LogData): void {
    const data = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      : error

    const entry = this.formatLog('error', message, data)
    this.output(entry)
  }

  /**
   * 记录 API 请求
   */
  logApiRequest(method: string, url: string, data?: LogData): void {
    this.debug(`API Request: ${method} ${url}`, data)
  }

  /**
   * 记录 API 响应
   */
  logApiResponse(method: string, url: string, status: number, data?: LogData): void {
    if (status >= 200 && status < 300) {
      this.debug(`API Response: ${method} ${url} - ${status}`, data)
    } else {
      this.warn(`API Response: ${method} ${url} - ${status}`, data)
    }
  }

  /**
   * 记录 API 错误
   */
  logApiError(method: string, url: string, error: Error | LogData): void {
    this.error(`API Error: ${method} ${url}`, error)
  }

  /**
   * 记录组件生命周期
   */
  logComponentLifecycle(componentName: string, event: 'mount' | 'unmount' | 'update', data?: LogData): void {
    this.debug(`Component ${event}: ${componentName}`, data)
  }

  /**
   * 记录数据流
   */
  logDataFlow(stage: string, data: LogData): void {
    this.debug(`Data Flow - ${stage}`, data)
  }

  /**
   * 记录用户操作
   */
  logUserAction(action: string, data?: LogData): void {
    this.info(`User Action: ${action}`, data)
  }

  /**
   * 记录性能指标
   */
  logPerformance(operation: string, duration: number, data?: LogData): void {
    this.debug(`Performance: ${operation} took ${duration}ms`, data)
  }

  /**
   * 创建性能计时器
   */
  startTimer(operation: string): () => void {
    const startTime = performance.now()
    return () => {
      const duration = performance.now() - startTime
      this.logPerformance(operation, duration)
    }
  }

  /**
   * 设置安静模式
   */
  setQuietMode(quiet: boolean): void {
    localStorage.setItem('office-plugin-quiet-mode', String(quiet))
    this.quietMode = quiet
  }

  /**
   * 获取当前安静模式状态
   */
  getQuietMode(): boolean {
    return this.quietMode
  }

  /**
   * 静态方法：全局设置安静模式
   */
  static setGlobalQuietMode(quiet: boolean): void {
    localStorage.setItem('office-plugin-quiet-mode', String(quiet))
  }

  /**
   * 静态方法：获取全局安静模式状态
   */
  static getGlobalQuietMode(): boolean {
    return localStorage.getItem('office-plugin-quiet-mode') === 'true'
  }

  /**
   * 初始化全局错误捕获
   */
  initGlobalErrorHandling(): void {
    if (typeof window === 'undefined') return

    // 捕获全局未处理的错误
    window.onerror = (message, source, lineno, colno, error) => {
      this.error('Global Uncaught Error', {
        message,
        source,
        lineno,
        colno,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      })
      return false // 允许默认处理（控制台输出）
    }

    // 捕获未处理的 Promise Rejection
    window.onunhandledrejection = (event) => {
      this.error('Global Unhandled Rejection', {
        reason: event.reason instanceof Error ? {
          name: event.reason.name,
          message: event.reason.message,
          stack: event.reason.stack
        } : event.reason
      })
    }

    this.info('Global error handling initialized')
  }
}

// 导出默认实例
export const logger = new Logger('OfficePlugin')

// 导出 Logger 类，允许创建自定义实例
export default Logger

