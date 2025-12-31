/**
 * 工具错误处理器
 * 提供统一的错误处理、格式化和恢复机制
 */

import {
  ErrorCode,
  ErrorCategory,
  formatErrorMessage,
  getErrorSuggestion,
  isRetryable,
  ERROR_DEFINITIONS
} from './ErrorCodes.js'
import { logger } from '@office-mcp/shared'

/**
 * 工具错误接口
 */
export interface ToolError {
  /** 是否成功 */
  success: false
  /** 错误码 */
  code: ErrorCode
  /** 错误类别 */
  category: ErrorCategory
  /** 错误消息 */
  message: string
  /** 恢复建议 */
  suggestion?: string
  /** 是否可重试 */
  retryable: boolean
  /** 原始错误 */
  originalError?: any
  /** 错误详情 */
  details?: Record<string, any>
}

/**
 * 工具成功结果接口
 */
export interface ToolSuccess<T = any> {
  /** 是否成功 */
  success: true
  /** 成功消息 */
  message: string
  /** 返回数据 */
  data?: T
}

/**
 * 工具结果类型
 */
export type ToolResult<T = any> = ToolSuccess<T> | ToolError

/**
 * 工具错误处理器类
 */
export class ToolErrorHandler {
  /**
   * 创建错误结果
   * @param code 错误码
   * @param params 参数对象
   * @param originalError 原始错误
   * @returns 错误结果
   */
  static createError(
    code: ErrorCode,
    params?: Record<string, any>,
    originalError?: any
  ): ToolError {
    const definition = ERROR_DEFINITIONS[code]
    const message = formatErrorMessage(code, params)
    const suggestion = getErrorSuggestion(code)
    const retryable = isRetryable(code)

    const error: ToolError = {
      success: false,
      code,
      category: definition.category,
      message,
      suggestion,
      retryable,
      originalError,
      details: params
    }

    // 记录错误日志
    logger.error(`[ToolError] ${code}: ${message}`, {
      category: definition.category,
      retryable,
      details: params,
      originalError: originalError?.message || originalError
    })

    return error
  }

  /**
   * 创建成功结果
   * @param message 成功消息
   * @param data 返回数据
   * @returns 成功结果
   */
  static createSuccess<T = any>(message: string, data?: T): ToolSuccess<T> {
    return {
      success: true,
      message,
      data
    }
  }

  /**
   * 处理 Office.js API 错误
   * @param error Office.js 错误对象
   * @param context 上下文信息
   * @returns 错误结果
   */
  static handleOfficeApiError(error: any, context?: Record<string, any>): ToolError {
    // 检查是否是权限错误
    if (error.code === 'AccessDenied' || error.message?.includes('permission')) {
      return this.createError(ErrorCode.PERMISSION_DENIED, context, error)
    }

    // 检查是否是文档未打开
    if (error.code === 'InvalidObjectPath' || error.message?.includes('not open')) {
      return this.createError(ErrorCode.DOCUMENT_NOT_OPEN, context, error)
    }

    // 检查是否是只读文档
    if (error.message?.includes('read-only') || error.message?.includes('readonly')) {
      return this.createError(ErrorCode.DOCUMENT_READONLY, context, error)
    }

    // 检查是否是超时
    if (error.code === 'Timeout' || error.message?.includes('timeout')) {
      return this.createError(ErrorCode.API_TIMEOUT, context, error)
    }

    // 通用 API 错误
    return this.createError(
      ErrorCode.OFFICE_API_ERROR,
      { details: error.message || String(error), ...context },
      error
    )
  }

  /**
   * 处理参数验证错误
   * @param paramName 参数名称
   * @param expectedType 期望类型
   * @param actualType 实际类型
   * @returns 错误结果
   */
  static handleInvalidParamType(
    paramName: string,
    expectedType: string,
    actualType: string
  ): ToolError {
    return this.createError(ErrorCode.INVALID_PARAM_TYPE, {
      param: paramName,
      expected: expectedType,
      actual: actualType
    })
  }

  /**
   * 处理缺少必需参数错误
   * @param paramName 参数名称
   * @returns 错误结果
   */
  static handleMissingRequiredParam(paramName: string): ToolError {
    return this.createError(ErrorCode.MISSING_REQUIRED_PARAM, {
      param: paramName
    })
  }

  /**
   * 处理参数超出范围错误
   * @param paramName 参数名称
   * @param min 最小值
   * @param max 最大值
   * @returns 错误结果
   */
  static handleParamOutOfRange(paramName: string, min: number, max: number): ToolError {
    return this.createError(ErrorCode.PARAM_OUT_OF_RANGE, {
      param: paramName,
      min,
      max
    })
  }

  /**
   * 处理平台不支持错误
   * @param platform 平台类型
   * @returns 错误结果
   */
  static handlePlatformNotSupported(platform: 'desktop' | 'web' | 'windows' | 'mac'): ToolError {
    const codeMap = {
      desktop: ErrorCode.DESKTOP_ONLY,
      web: ErrorCode.WEB_ONLY,
      windows: ErrorCode.WINDOWS_ONLY,
      mac: ErrorCode.MAC_ONLY
    }
    return this.createError(codeMap[platform])
  }

  /**
   * 处理资源未找到错误
   * @param resourceType 资源类型
   * @param identifier 资源标识
   * @returns 错误结果
   */
  static handleResourceNotFound(resourceType: string, identifier: string): ToolError {
    const codeMap: Record<string, ErrorCode> = {
      bookmark: ErrorCode.BOOKMARK_NOT_FOUND,
      contentControl: ErrorCode.CONTENT_CONTROL_NOT_FOUND,
      image: ErrorCode.IMAGE_NOT_FOUND
    }

    const code = codeMap[resourceType] || ErrorCode.RESOURCE_NOT_FOUND
    const paramKey = resourceType === 'bookmark' ? 'name' :
      resourceType === 'contentControl' ? 'tag' :
        resourceType === 'image' ? 'name' : 'resource'

    return this.createError(code, { [paramKey]: identifier })
  }

  /**
   * 处理 IPC 通信错误
   * @param details 错误详情
   * @param originalError 原始错误
   * @returns 错误结果
   */
  static handleIpcError(details: string, originalError?: any): ToolError {
    return this.createError(ErrorCode.IPC_COMMUNICATION_ERROR, { details }, originalError)
  }

  /**
   * 包装工具执行函数，自动处理错误
   * @param handler 工具处理函数
   * @returns 包装后的处理函数
   */
  static wrapHandler<T = any>(
    handler: (args: any) => Promise<any>
  ): (args: any) => Promise<ToolResult<T>> {
    return async (args: any): Promise<ToolResult<T>> => {
      try {
        return await handler(args)
      } catch (error: any) {
        // 如果已经是 ToolError，直接返回
        if (error.success === false && error.code) {
          return error as ToolError
        }

        // 尝试识别错误类型
        if (error.name === 'OfficeExtension.Error' || error.debugInfo) {
          return this.handleOfficeApiError(error)
        }

        // 未知错误
        return this.createError(
          ErrorCode.UNKNOWN_ERROR,
          { details: error.message || String(error) },
          error
        )
      }
    }
  }

  /**
   * 验证必需参数
   * @param args 参数对象
   * @param requiredParams 必需参数列表
   * @returns 验证结果，如果失败返回错误
   */
  static validateRequiredParams(
    args: any,
    requiredParams: string[]
  ): ToolError | null {
    for (const param of requiredParams) {
      if (args[param] === undefined || args[param] === null) {
        return this.handleMissingRequiredParam(param)
      }
    }
    return null
  }

  /**
   * 验证参数类型
   * @param args 参数对象
   * @param paramTypes 参数类型映射
   * @returns 验证结果，如果失败返回错误
   */
  static validateParamTypes(
    args: any,
    paramTypes: Record<string, string>
  ): ToolError | null {
    for (const [param, expectedType] of Object.entries(paramTypes)) {
      if (args[param] !== undefined) {
        const actualType = typeof args[param]
        if (actualType !== expectedType) {
          return this.handleInvalidParamType(param, expectedType, actualType)
        }
      }
    }
    return null
  }

  /**
   * 验证参数范围
   * @param args 参数对象
   * @param paramRanges 参数范围映射
   * @returns 验证结果，如果失败返回错误
   */
  static validateParamRanges(
    args: any,
    paramRanges: Record<string, { min: number; max: number }>
  ): ToolError | null {
    for (const [param, range] of Object.entries(paramRanges)) {
      if (args[param] !== undefined) {
        const value = args[param]
        if (typeof value === 'number' && (value < range.min || value > range.max)) {
          return this.handleParamOutOfRange(param, range.min, range.max)
        }
      }
    }
    return null
  }

  /**
   * 检查平台支持
   * @param requiredPlatform 需要的平台
   * @returns 是否支持，如果不支持返回错误
   */
  static async checkPlatformSupport(
    requiredPlatform: 'desktop' | 'web' | 'windows' | 'mac'
  ): Promise<ToolError | null> {
    // 注意：这个方法需要在 Office.js 环境中调用
    // 在 MCP Server 端无法直接检测平台，需要通过 IPC 调用 Office Plugin 端检测
    // 这里提供一个占位实现，实际检测逻辑应该在 Office Plugin 端实现

    // 如果在 Node.js 环境（MCP Server），无法检测平台
    // 返回 null 表示跳过检测，由 Office Plugin 端处理
    if (typeof window === 'undefined') {
      return null
    }

    // 如果在浏览器环境（Office Plugin），尝试检测平台
    try {
      // @ts-ignore - Office 对象可能不存在
      if (typeof Office !== 'undefined' && Office.context) {
        // @ts-ignore
        const platform = Office.context.platform
        // @ts-ignore
        const host = Office.context.host

        // 检查是否是桌面版
        const isDesktop = platform === Office.PlatformType.PC ||
          platform === Office.PlatformType.Mac ||
          platform === Office.PlatformType.OfficeOnline === false

        // 检查是否是 Web 版
        const isWeb = platform === Office.PlatformType.OfficeOnline

        // 检查操作系统
        const isWindows = platform === Office.PlatformType.PC
        const isMac = platform === Office.PlatformType.Mac

        // 根据需求检查平台
        switch (requiredPlatform) {
          case 'desktop':
            if (!isDesktop) {
              return this.handlePlatformNotSupported('desktop')
            }
            break
          case 'web':
            if (!isWeb) {
              return this.handlePlatformNotSupported('web')
            }
            break
          case 'windows':
            if (!isWindows) {
              return this.handlePlatformNotSupported('windows')
            }
            break
          case 'mac':
            if (!isMac) {
              return this.handlePlatformNotSupported('mac')
            }
            break
        }

        return null // 平台支持
      }
    } catch (error) {
      // 检测失败，记录日志但不阻止执行
      logger.warn('[PlatformCheck] 平台检测失败，跳过检测', { error })
      return null
    }

    // 无法检测平台，返回 null 允许继续执行
    return null
  }

  /**
   * 检查 API 版本支持
   * @param requiredVersion 需要的 API 版本（如 "1.3"）
   * @param apiSet API 集合名称（如 "WordApi"）
   * @returns 是否支持，如果不支持返回错误
   */
  static async checkApiVersionSupport(
    apiSet: string,
    requiredVersion: string
  ): Promise<ToolError | null> {
    // 注意：这个方法需要在 Office.js 环境中调用
    // 在 MCP Server 端无法直接检测 API 版本

    if (typeof window === 'undefined') {
      return null
    }

    try {
      // @ts-ignore
      if (typeof Office !== 'undefined' && Office.context && Office.context.requirements) {
        // @ts-ignore
        const isSupported = Office.context.requirements.isSetSupported(apiSet, requiredVersion)

        if (!isSupported) {
          return this.createError(ErrorCode.API_VERSION_NOT_SUPPORTED, {
            required: `${apiSet} ${requiredVersion}`,
            current: '未知版本'
          })
        }

        return null // API 版本支持
      }
    } catch (error) {
      // 检测失败，记录日志但不阻止执行
      logger.warn('[ApiVersionCheck] API 版本检测失败，跳过检测', { error })
      return null
    }

    return null
  }
}

/**
 * 导出便捷函数
 */
export const createError = ToolErrorHandler.createError.bind(ToolErrorHandler)
export const createSuccess = ToolErrorHandler.createSuccess.bind(ToolErrorHandler)
export const handleOfficeApiError = ToolErrorHandler.handleOfficeApiError.bind(ToolErrorHandler)
export const wrapHandler = ToolErrorHandler.wrapHandler.bind(ToolErrorHandler)
