/**
 * GlobalErrorHandler 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AppError, ErrorType, globalErrorHandler } from './GlobalErrorHandler'

describe('AppError', () => {
  it('应该创建带有正确属性的错误对象', () => {
    const error = new AppError(
      '测试错误',
      ErrorType.API,
      new Error('原始错误'),
      '用户友好的错误消息'
    )

    expect(error.message).toBe('测试错误')
    expect(error.type).toBe(ErrorType.API)
    expect(error.userMessage).toBe('用户友好的错误消息')
    expect(error.name).toBe('AppError')
  })

  it('应该使用默认错误类型', () => {
    const error = new AppError('测试错误')
    expect(error.type).toBe(ErrorType.UNKNOWN)
  })
})

describe('GlobalErrorHandler', () => {
  beforeEach(() => {
    // 重置配置
    globalErrorHandler.configure({
      onError: undefined,
      showUserNotification: false
    })
  })

  it('应该处理 AppError', () => {
    const onError = vi.fn()
    globalErrorHandler.configure({ onError })

    const error = new AppError('测试错误', ErrorType.API)
    globalErrorHandler.handleError(error)

    expect(onError).toHaveBeenCalledWith(error)
  })

  it('应该将 TypeError 转换为网络错误', () => {
    const onError = vi.fn()
    globalErrorHandler.configure({ onError })

    const typeError = new TypeError('fetch failed')
    globalErrorHandler.handleError(typeError)

    expect(onError).toHaveBeenCalled()
    const capturedError = onError.mock.calls[0][0] as AppError
    expect(capturedError.type).toBe(ErrorType.NETWORK)
  })

  it('应该将普通 Error 转换为 AppError', () => {
    const onError = vi.fn()
    globalErrorHandler.configure({ onError })

    const error = new Error('普通错误')
    globalErrorHandler.handleError(error)

    expect(onError).toHaveBeenCalled()
    const capturedError = onError.mock.calls[0][0] as AppError
    expect(capturedError).toBeInstanceOf(AppError)
    expect(capturedError.message).toBe('普通错误')
  })

  it('应该处理字符串错误', () => {
    const onError = vi.fn()
    globalErrorHandler.configure({ onError })

    globalErrorHandler.handleError('字符串错误')

    expect(onError).toHaveBeenCalled()
    const capturedError = onError.mock.calls[0][0] as AppError
    expect(capturedError.message).toBe('字符串错误')
  })

  it('应该支持上下文信息', () => {
    const onError = vi.fn()
    globalErrorHandler.configure({ onError })

    const error = new AppError('测试错误')
    globalErrorHandler.handleError(error, 'API调用')

    expect(onError).toHaveBeenCalledWith(error)
  })
})
