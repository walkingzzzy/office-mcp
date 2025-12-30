/**
 * AI 请求重试处理器
 * 负责实现带指数退避的重试机制
 */

import Logger from '../../utils/logger'

const logger = new Logger('RetryHandler')

export interface RetryProgressCallback {
  (attempt: number, maxAttempts: number, delay: number, error: Error): void
}

export class RetryHandler {
  private retryProgressCallback?: RetryProgressCallback

  /**
   * 设置重试进度回调
   */
  setRetryProgressCallback(callback?: RetryProgressCallback): void {
    this.retryProgressCallback = callback
  }

  /**
   * 带重试的 fetch（支持指数退避策略）
   */
  async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number,
    retryDelay: number,
    timeout: number
  ): Promise<Response> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          ...options,
          signal: options.signal || controller.signal
        })

        clearTimeout(timeoutId)
        return response
      } catch (error) {
        lastError = error as Error

        // 如果是最后一次尝试，抛出错误
        if (attempt === retries) {
          break
        }

        // 如果是 AbortError（用户取消或超时），不重试
        if ((error as Error).name === 'AbortError') {
          break
        }

        // 计算指数退避延迟
        // 公式: baseDelay * (2 ^ attempt) + random jitter
        // 例如: 1000ms, 2000ms, 4000ms, 8000ms...
        const exponentialDelay = retryDelay * Math.pow(2, attempt)
        const jitter = Math.random() * 1000 // 0-1000ms 随机抖动
        const delay = Math.min(exponentialDelay + jitter, 30000) // 最大 30 秒

        // 触发重试进度回调
        if (this.retryProgressCallback) {
          this.retryProgressCallback(attempt + 1, retries + 1, delay, lastError)
        }

        // 等待后重试
        logger.warn('Request failed, retrying', {
          attempt: attempt + 1,
          maxAttempts: retries + 1,
          delay: Math.round(delay),
          error: error instanceof Error ? error.message : String(error)
        })
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw lastError || new Error('Request failed')
  }

  /**
   * 计算指数退避延迟
   */
  calculateBackoffDelay(attempt: number, baseDelay: number, maxDelay: number = 30000): number {
    const exponentialDelay = baseDelay * Math.pow(2, attempt)
    const jitter = Math.random() * 1000
    return Math.min(exponentialDelay + jitter, maxDelay)
  }
}

export const retryHandler = new RetryHandler()
