/**
 * Error Handler and Recovery Mechanisms - Phase 2 架构完善
 * 
 * 注意：恢复策略统一使用 HTTP 通道（sendIPCCommand），
 * 避免与 MCP 的 stdio transport 冲突。
 */

import { logger } from '@office-mcp/shared'
import { sendIPCCommand } from './ipc.js'

export interface ErrorContext {
  toolName: string
  args: any
  timestamp: number
  retryCount: number
}

export interface RecoveryStrategy {
  name: string
  canHandle: (error: Error, context: ErrorContext) => boolean
  recover: (error: Error, context: ErrorContext) => Promise<any>
}

export class ErrorHandler {
  private strategies: RecoveryStrategy[] = []
  private errorHistory: ErrorContext[] = []
  private readonly maxHistorySize: number = 100

  constructor(maxHistorySize: number = 100) {
    this.maxHistorySize = maxHistorySize
    this.registerDefaultStrategies()
  }

  registerStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy)
  }

  async handleError(error: Error, context: ErrorContext): Promise<any> {
    logger.error(`Error in ${context.toolName}: ${error.message}`)

    // Record error in history with size limit
    this.errorHistory.push({ ...context, timestamp: Date.now() })
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift() // Remove oldest entry
    }

    // Try recovery strategies
    for (const strategy of this.strategies) {
      if (strategy.canHandle(error, context)) {
        try {
          logger.info(`Attempting recovery with strategy: ${strategy.name}`)
          return await strategy.recover(error, context)
        } catch (recoveryError: any) {
          logger.warn(`Recovery strategy ${strategy.name} failed: ${recoveryError.message}`)
        }
      }
    }

    // If no recovery strategy worked, re-throw the error
    throw error
  }

  private registerDefaultStrategies(): void {
    // Retry strategy for timeout errors
    // 使用 HTTP 通道 (sendIPCCommand) 而非 STDIO，避免与 MCP 协议冲突
    this.registerStrategy({
      name: 'RetryOnTimeout',
      canHandle: (error: Error, context: ErrorContext) => {
        return error.message.includes('timeout') && context.retryCount < 3
      },
      recover: async (error: Error, context: ErrorContext) => {
        context.retryCount++
        logger.info(`重试 ${context.toolName} (第 ${context.retryCount} 次)`)
        // 使用 HTTP 通道重试
        return await sendIPCCommand(context.toolName, context.args)
      }
    })

    // Fallback strategy for document operations
    this.registerStrategy({
      name: 'DocumentFallback',
      canHandle: (error: Error, context: ErrorContext) => {
        return (
          context.toolName.startsWith('word_') ||
          context.toolName.startsWith('excel_') ||
          context.toolName.startsWith('ppt_')
        )
      },
      recover: async (error: Error, context: ErrorContext) => {
        logger.info('Attempting document operation fallback')
        // Return a safe fallback result
        return {
          success: false,
          error: error.message,
          fallback: true,
          message: 'Operation failed, but system recovered gracefully'
        }
      }
    })

    // Cache invalidation strategy
    // 使用 HTTP 通道 (sendIPCCommand) 而非 STDIO
    this.registerStrategy({
      name: 'CacheInvalidation',
      canHandle: (error: Error, context: ErrorContext) => {
        return error.message.includes('cache') || error.message.includes('stale')
      },
      recover: async (error: Error, context: ErrorContext) => {
        logger.info('清理缓存并重试操作')
        // 使用 HTTP 通道清理缓存并重试
        await sendIPCCommand('clear_cache', { cacheType: 'all' })
        return await sendIPCCommand(context.toolName, context.args)
      }
    })
  }

  getErrorHistory(): ErrorContext[] {
    return [...this.errorHistory]
  }

  clearErrorHistory(): void {
    this.errorHistory = []
  }

  getErrorStats(): { totalErrors: number; errorsByTool: Record<string, number> } {
    const errorsByTool: Record<string, number> = {}

    for (const error of this.errorHistory) {
      errorsByTool[error.toolName] = (errorsByTool[error.toolName] || 0) + 1
    }

    return {
      totalErrors: this.errorHistory.length,
      errorsByTool
    }
  }
}

// Global error handler instance
export const globalErrorHandler = new ErrorHandler()
