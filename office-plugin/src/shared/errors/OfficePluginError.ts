/**
 * 统一错误处理模块
 * 提供标准化的错误类型和错误处理工具
 */

import { toastManager } from '../../components/molecules/ToastNotifications/ToastNotifications'
import Logger from '../../utils/logger'

const logger = new Logger('ErrorHandler')

/**
 * 错误严重程度
 */
export enum ErrorSeverity {
  /** 信息 - 不影响功能 */
  INFO = 'info',
  /** 警告 - 可能影响用户体验 */
  WARNING = 'warning',
  /** 错误 - 功能无法正常工作 */
  ERROR = 'error',
  /** 严重 - 系统级错误 */
  CRITICAL = 'critical'
}

/**
 * 错误代码枚举
 */
export enum ErrorCode {
  // ==================== 网络错误 (1xxx) ====================
  /** 网络连接失败 */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** 请求超时 */
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  /** API 响应错误 */
  API_ERROR = 'API_ERROR',
  /** 未授权 */
  UNAUTHORIZED = 'UNAUTHORIZED',
  /** 禁止访问 */
  FORBIDDEN = 'FORBIDDEN',
  /** 资源未找到 */
  NOT_FOUND = 'NOT_FOUND',

  // ==================== Office.js 错误 (2xxx) ====================
  /** Office.js 初始化失败 */
  OFFICE_INIT_ERROR = 'OFFICE_INIT_ERROR',
  /** Office.js API 调用失败 */
  OFFICE_API_ERROR = 'OFFICE_API_ERROR',
  /** 不支持的 Office 版本 */
  OFFICE_VERSION_NOT_SUPPORTED = 'OFFICE_VERSION_NOT_SUPPORTED',
  /** Office 上下文错误 */
  OFFICE_CONTEXT_ERROR = 'OFFICE_CONTEXT_ERROR',

  // ==================== 数据验证错误 (3xxx) ====================
  /** 无效的输入 */
  INVALID_INPUT = 'INVALID_INPUT',
  /** 缺少必需参数 */
  MISSING_REQUIRED_PARAM = 'MISSING_REQUIRED_PARAM',
  /** 数据格式错误 */
  INVALID_DATA_FORMAT = 'INVALID_DATA_FORMAT',
  /** 数据验证失败 */
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // ==================== 业务逻辑错误 (4xxx) ====================
  /** 操作失败 */
  OPERATION_FAILED = 'OPERATION_FAILED',
  /** 不支持的操作 */
  UNSUPPORTED_OPERATION = 'UNSUPPORTED_OPERATION',
  /** 资源冲突 */
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  /** 状态错误 */
  INVALID_STATE = 'INVALID_STATE',

  // ==================== 系统错误 (5xxx) ====================
  /** 未知错误 */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  /** 配置错误 */
  CONFIG_ERROR = 'CONFIG_ERROR',
  /** 存储错误 */
  STORAGE_ERROR = 'STORAGE_ERROR',
  /** 内部错误 */
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/**
 * Office 插件统一错误类
 */
export class OfficePluginError extends Error {
  /** 错误代码 */
  public readonly code: ErrorCode
  /** 错误严重程度 */
  public readonly severity: ErrorSeverity
  /** 原始错误对象 */
  public readonly originalError?: Error
  /** 错误上下文信息 */
  public readonly context?: Record<string, unknown>
  /** 错误发生时间 */
  public readonly timestamp: Date

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    originalError?: Error,
    context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'OfficePluginError'
    this.code = code
    this.severity = severity
    this.originalError = originalError
    this.context = context
    this.timestamp = new Date()

    // 保持正确的原型链
    Object.setPrototypeOf(this, OfficePluginError.prototype)
  }

  /**
   * 转换为 JSON 对象
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : undefined
    }
  }

  /**
   * 转换为用户友好的错误消息
   */
  toUserMessage(): string {
    // 根据错误代码返回用户友好的消息
    const userMessages: Record<ErrorCode, string> = {
      [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
      [ErrorCode.REQUEST_TIMEOUT]: '请求超时，请稍后重试',
      [ErrorCode.API_ERROR]: 'API 请求失败，请稍后重试',
      [ErrorCode.UNAUTHORIZED]: '未授权，请重新登录',
      [ErrorCode.FORBIDDEN]: '没有权限执行此操作',
      [ErrorCode.NOT_FOUND]: '请求的资源不存在',
      [ErrorCode.OFFICE_INIT_ERROR]: 'Office 插件初始化失败',
      [ErrorCode.OFFICE_API_ERROR]: 'Office 操作失败',
      [ErrorCode.OFFICE_VERSION_NOT_SUPPORTED]: '当前 Office 版本不支持此功能',
      [ErrorCode.OFFICE_CONTEXT_ERROR]: 'Office 上下文错误',
      [ErrorCode.INVALID_INPUT]: '输入数据无效',
      [ErrorCode.MISSING_REQUIRED_PARAM]: '缺少必需参数',
      [ErrorCode.INVALID_DATA_FORMAT]: '数据格式错误',
      [ErrorCode.VALIDATION_ERROR]: '数据验证失败',
      [ErrorCode.OPERATION_FAILED]: '操作失败',
      [ErrorCode.UNSUPPORTED_OPERATION]: '不支持的操作',
      [ErrorCode.RESOURCE_CONFLICT]: '资源冲突',
      [ErrorCode.INVALID_STATE]: '状态错误',
      [ErrorCode.UNKNOWN_ERROR]: '未知错误',
      [ErrorCode.CONFIG_ERROR]: '配置错误',
      [ErrorCode.STORAGE_ERROR]: '存储错误',
      [ErrorCode.INTERNAL_ERROR]: '内部错误'
    }

    return userMessages[this.code] || this.message
  }
}

/**
 * 错误处理工具类
 */
export class ErrorHandler {
  /**
   * 处理未知错误，转换为 OfficePluginError
   */
  static handle(error: unknown): OfficePluginError {
    // 如果已经是 OfficePluginError，直接返回
    if (error instanceof OfficePluginError) {
      return error
    }

    // 如果是 Office.js 错误
    if (error && typeof error === 'object' && 'code' in error) {
      const officeError = error as { message?: string; code?: string }
      return new OfficePluginError(
        officeError.message || 'Office API 错误',
        ErrorCode.OFFICE_API_ERROR,
        ErrorSeverity.ERROR,
        error instanceof Error ? error : new Error(officeError.message || 'Office API 错误'),
        { officeErrorCode: officeError.code }
      )
    }

    // 如果是标准 Error 对象
    if (error instanceof Error) {
      // 判断是否是网络错误
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return new OfficePluginError(
          '网络请求失败',
          ErrorCode.NETWORK_ERROR,
          ErrorSeverity.ERROR,
          error
        )
      }

      // 判断是否是超时错误
      if (error.message.includes('timeout') || error.message.includes('超时')) {
        return new OfficePluginError(
          '请求超时',
          ErrorCode.REQUEST_TIMEOUT,
          ErrorSeverity.WARNING,
          error
        )
      }

      // 其他 Error 对象
      return new OfficePluginError(
        error.message,
        ErrorCode.UNKNOWN_ERROR,
        ErrorSeverity.ERROR,
        error
      )
    }

    // 其他类型的错误
    return new OfficePluginError(
      String(error),
      ErrorCode.UNKNOWN_ERROR,
      ErrorSeverity.ERROR
    )
  }

  /**
   * 记录错误日志
   */
  static log(error: OfficePluginError): void {
    const logData = error.toJSON()

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.ERROR:
        logger.error(`[${error.code}] ${error.message}`, logData)
        break
      case ErrorSeverity.WARNING:
        logger.warn(`[${error.code}] ${error.message}`, logData)
        break
      case ErrorSeverity.INFO:
        logger.info(`[${error.code}] ${error.message}`, logData)
        break
      default:
        logger.debug(`[${error.code}] ${error.message}`, logData)
    }
  }

  /**
   * 显示用户友好的错误提示
   */
  static showUserError(error: OfficePluginError): void {
    const userMessage = error.toUserMessage()
    const title = this.getErrorTitle(error.severity)

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.ERROR:
        toastManager.error(title, userMessage, {
          persistent: error.severity === ErrorSeverity.CRITICAL,
          duration: 8000
        })
        break
      case ErrorSeverity.WARNING:
        toastManager.warning(title, userMessage, {
          duration: 6000
        })
        break
      case ErrorSeverity.INFO:
        toastManager.info(title, userMessage, {
          duration: 4000
        })
        break
      default:
        toastManager.info(title, userMessage)
    }

    this.log(error)
  }

  /**
   * 根据严重程度获取错误标题
   */
  private static getErrorTitle(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return '严重错误'
      case ErrorSeverity.ERROR:
        return '操作失败'
      case ErrorSeverity.WARNING:
        return '警告'
      case ErrorSeverity.INFO:
        return '提示'
      default:
        return '通知'
    }
  }

  /**
   * 创建网络错误
   */
  static createNetworkError(message: string, originalError?: Error): OfficePluginError {
    return new OfficePluginError(
      message,
      ErrorCode.NETWORK_ERROR,
      ErrorSeverity.ERROR,
      originalError
    )
  }

  /**
   * 创建 Office.js 错误
   */
  static createOfficeError(message: string, originalError?: Error): OfficePluginError {
    return new OfficePluginError(
      message,
      ErrorCode.OFFICE_API_ERROR,
      ErrorSeverity.ERROR,
      originalError
    )
  }

  /**
   * 创建验证错误
   */
  static createValidationError(message: string, context?: Record<string, unknown>): OfficePluginError {
    return new OfficePluginError(
      message,
      ErrorCode.VALIDATION_ERROR,
      ErrorSeverity.WARNING,
      undefined,
      context
    )
  }
}

/**
 * 错误处理装饰器（用于类方法）
 */
export function HandleError(
  errorCode: ErrorCode = ErrorCode.OPERATION_FAILED,
  severity: ErrorSeverity = ErrorSeverity.ERROR
) {
  return function <T extends object>(
    _target: T,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      try {
        return await originalMethod.apply(this, args)
      } catch (error) {
        const pluginError = new OfficePluginError(
          `${propertyKey} 执行失败`,
          errorCode,
          severity,
          error instanceof Error ? error : undefined
        )
        ErrorHandler.log(pluginError)
        throw pluginError
      }
    }

    return descriptor
  }
}