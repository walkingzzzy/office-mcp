/**
 * 错误处理系统
 * 提供统一的错误处理和恢复机制
 */

import type { ErrorContext, RecoveryStrategy } from '../types/index.js'
import { createLogger } from './logger.js'

const logger = createLogger('ErrorHandler')

/**
 * 错误处理器
 */
export class ErrorHandler {
  private strategies: RecoveryStrategy[] = []
  private errorHistory: ErrorContext[] = []
  private maxHistorySize: number

  constructor(maxHistorySize: number = 100) {
    this.maxHistorySize = maxHistorySize
  }

  /**
   * 注册恢复策略
   */
  registerStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy)
    // 按优先级排序（高优先级在前）
    this.strategies.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    logger.debug(`恢复策略已注册: ${strategy.name}`)
  }

  /**
   * 注册多个恢复策略
   */
  registerStrategies(strategies: RecoveryStrategy[]): void {
    strategies.forEach(s => this.registerStrategy(s))
  }

  /**
   * 处理错误
   */
  async handle(error: Error, operation?: string, metadata?: Record<string, unknown>): Promise<boolean> {
    const context: ErrorContext = {
      error,
      timestamp: new Date(),
      operation,
      metadata,
      recovered: false
    }

    // 记录错误
    this.recordError(context)

    logger.error(`错误发生: ${error.message}`, {
      operation,
      errorName: error.name,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    })

    // 尝试恢复
    for (const strategy of this.strategies) {
      if (strategy.canHandle(error)) {
        logger.info(`尝试恢复策略: ${strategy.name}`)
        try {
          const recovered = await strategy.recover(context)
          if (recovered) {
            context.recovered = true
            logger.info(`恢复成功: ${strategy.name}`)
            return true
          }
        } catch (recoveryError) {
          logger.warn(`恢复策略失败: ${strategy.name}`, {
            error: recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
          })
        }
      }
    }

    logger.warn('所有恢复策略均失败')
    return false
  }

  /**
   * 记录错误到历史
   */
  private recordError(context: ErrorContext): void {
    this.errorHistory.push(context)

    // 限制历史记录大小
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift()
    }
  }

  /**
   * 获取错误历史
   */
  getHistory(): ErrorContext[] {
    return [...this.errorHistory]
  }

  /**
   * 获取最近的错误
   */
  getRecentErrors(count: number = 10): ErrorContext[] {
    return this.errorHistory.slice(-count)
  }

  /**
   * 获取特定操作的错误
   */
  getErrorsByOperation(operation: string): ErrorContext[] {
    return this.errorHistory.filter(ctx => ctx.operation === operation)
  }

  /**
   * 清除错误历史
   */
  clearHistory(): void {
    this.errorHistory = []
  }

  /**
   * 获取错误统计
   */
  getStats(): {
    total: number
    recovered: number
    unrecovered: number
    byOperation: Record<string, number>
  } {
    const byOperation: Record<string, number> = {}

    for (const ctx of this.errorHistory) {
      const op = ctx.operation ?? 'unknown'
      byOperation[op] = (byOperation[op] ?? 0) + 1
    }

    return {
      total: this.errorHistory.length,
      recovered: this.errorHistory.filter(ctx => ctx.recovered).length,
      unrecovered: this.errorHistory.filter(ctx => !ctx.recovered).length,
      byOperation
    }
  }
}

/**
 * 创建错误处理器
 */
export function createErrorHandler(maxHistorySize?: number): ErrorHandler {
  return new ErrorHandler(maxHistorySize)
}

/**
 * 预定义的恢复策略：重试
 */
export function createRetryStrategy(
  maxRetries: number = 3,
  delayMs: number = 1000
): RecoveryStrategy {
  const retryCount = new Map<string, number>()

  return {
    name: 'retry',
    priority: 10,
    canHandle: (error: Error) => {
      // 可重试的错误类型
      const retryableErrors = [
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'NetworkError',
        'TimeoutError'
      ]
      return retryableErrors.some(
        type => error.message.includes(type) || error.name.includes(type)
      )
    },
    recover: async (context: ErrorContext) => {
      const key = context.operation ?? 'default'
      const count = retryCount.get(key) ?? 0

      if (count >= maxRetries) {
        retryCount.delete(key)
        return false
      }

      retryCount.set(key, count + 1)

      // 指数退避
      const actualDelay = delayMs * Math.pow(2, count)
      await new Promise(resolve => setTimeout(resolve, actualDelay))

      logger.info(`重试 ${count + 1}/${maxRetries}`, { operation: key, delay: actualDelay })
      return true
    }
  }
}

/**
 * 预定义的恢复策略：忽略特定错误
 */
export function createIgnoreStrategy(errorPatterns: (string | RegExp)[]): RecoveryStrategy {
  return {
    name: 'ignore',
    priority: 5,
    canHandle: (error: Error) => {
      return errorPatterns.some(pattern => {
        if (typeof pattern === 'string') {
          return error.message.includes(pattern) || error.name.includes(pattern)
        }
        return pattern.test(error.message) || pattern.test(error.name)
      })
    },
    recover: async () => {
      logger.debug('错误已忽略')
      return true
    }
  }
}

/**
 * 全局错误处理器实例
 */
export const errorHandler = createErrorHandler()
