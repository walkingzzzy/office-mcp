/**
 * 全局错误处理器
 * 统一处理应用中的错误，提供错误日志和用户通知
 * 
 * @updated 2025-12-29 - 集成 Toast 通知系统 (修复 P2/P12)
 */

import Logger from '../../utils/logger'
import { toastManager } from '../../components/molecules/ToastNotifications'

const logger = new Logger('GlobalErrorHandler')

/**
 * 错误类型枚举
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  STORAGE = 'STORAGE',
  OFFICE = 'OFFICE',
  UNKNOWN = 'UNKNOWN'
}

/**
 * 通知类型
 */
type NotificationType = 'error' | 'warning' | 'info'

/**
 * 应用错误类
 */
export class AppError extends Error {
  constructor(
    message: string,
    public type: ErrorType = ErrorType.UNKNOWN,
    public originalError?: unknown,
    public userMessage?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * 错误处理器配置
 */
interface ErrorHandlerConfig {
  onError?: (error: AppError) => void
  showUserNotification?: boolean
}

/**
 * 错误类型到通知类型的映射
 */
const ERROR_TYPE_TO_NOTIFICATION: Record<ErrorType, NotificationType> = {
  [ErrorType.NETWORK]: 'warning',
  [ErrorType.API]: 'error',
  [ErrorType.STORAGE]: 'warning',
  [ErrorType.OFFICE]: 'error',
  [ErrorType.UNKNOWN]: 'error'
}

/**
 * 错误类型到标题的映射
 */
const ERROR_TYPE_TITLES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: '网络错误',
  [ErrorType.API]: 'API 错误',
  [ErrorType.STORAGE]: '存储错误',
  [ErrorType.OFFICE]: 'Office 错误',
  [ErrorType.UNKNOWN]: '操作失败'
}

/**
 * 全局错误处理器类
 */
class GlobalErrorHandler {
  private config: ErrorHandlerConfig = {
    showUserNotification: true
  }

  /**
   * 配置错误处理器
   */
  configure(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 处理错误
   */
  handleError(error: unknown, context?: string): void {
    const appError = this.normalizeError(error)

    // 记录错误日志
    logger.error(`错误发生${context ? ` [${context}]` : ''}`, {
      type: appError.type,
      message: appError.message,
      originalError: appError.originalError
    })

    // 调用自定义错误处理器
    if (this.config.onError) {
      this.config.onError(appError)
    }

    // 显示用户通知（如果配置启用）
    if (this.config.showUserNotification && appError.userMessage) {
      this.showNotification(appError.userMessage, appError.type)
    }
  }

  /**
   * 标准化错误对象
   */
  private normalizeError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new AppError(
        '网络请求失败',
        ErrorType.NETWORK,
        error,
        '网络连接失败，请检查网络设置'
      )
    }

    if (error instanceof Error) {
      return new AppError(
        error.message,
        ErrorType.UNKNOWN,
        error,
        '操作失败，请稍后重试'
      )
    }

    return new AppError(
      String(error),
      ErrorType.UNKNOWN,
      error,
      '发生未知错误'
    )
  }

  /**
   * 显示用户通知
   * 使用 Toast 通知系统替代 console.error
   */
  private showNotification(message: string, errorType: ErrorType = ErrorType.UNKNOWN): void {
    const notificationType = ERROR_TYPE_TO_NOTIFICATION[errorType]
    const title = ERROR_TYPE_TITLES[errorType]

    switch (notificationType) {
      case 'error':
        toastManager.error(title, message)
        break
      case 'warning':
        toastManager.warning(title, message)
        break
      case 'info':
        toastManager.info(title, message)
        break
      default:
        toastManager.error(title, message)
    }
  }

  /**
   * 显示成功通知
   */
  showSuccess(title: string, message?: string): void {
    toastManager.success(title, message)
  }

  /**
   * 显示警告通知
   */
  showWarning(title: string, message?: string): void {
    toastManager.warning(title, message)
  }

  /**
   * 显示信息通知
   */
  showInfo(title: string, message?: string): void {
    toastManager.info(title, message)
  }
}

export const globalErrorHandler = new GlobalErrorHandler()
export default globalErrorHandler
