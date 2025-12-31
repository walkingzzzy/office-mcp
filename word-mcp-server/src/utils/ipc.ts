/**
 * Tool Execution Utility
 *
 * This module handles communication with the main Electron process API server
 * to execute tools in the Office plugin.
 * 
 * 特性：
 * - 从 ConfigManager 读取 API URL 配置
 * - 支持超时控制 (AbortController)
 * - 支持带指数退避的重试逻辑
 */

import { ConfigManager } from '../config/ConfigManager.js'
import type { ToolExecutionResult } from '../types/index.js'
import { logger } from '@office-mcp/shared'

// 获取 IPC 配置
function getIPCConfig() {
  const config = ConfigManager.getInstance().getConfig()
  return {
    apiBaseUrl: process.env.OFFICE_PLUGIN_API_URL || config.ipc.apiBaseUrl,
    timeout: config.ipc.timeout,
    maxRetries: config.ipc.maxRetries,
    retryDelay: config.ipc.retryDelay
  }
}

/**
 * 带超时的 fetch 请求
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * 计算指数退避延迟
 */
function calculateBackoff(attempt: number, baseDelay: number): number {
  // 指数退避：baseDelay * 2^attempt，最大 30 秒
  return Math.min(baseDelay * Math.pow(2, attempt), 30000)
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Send HTTP command to execute tool in Office plugin
 * 支持超时控制和重试逻辑
 */
export async function sendIPCCommand(
  toolName: string,
  args: any
): Promise<ToolExecutionResult> {
  const config = getIPCConfig()
  const callId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  const startTime = Date.now()

  logger.info(`[MCP_TOOL_FLOW] 🚀 发起工具执行请求`, {
    toolName,
    callId,
    args: JSON.stringify(args).substring(0, 200),
    apiUrl: `${config.apiBaseUrl}/execute-tool`,
    timeout: config.timeout,
    maxRetries: config.maxRetries
  })

  let lastError: Error | null = null

  // 重试循环
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const backoffDelay = calculateBackoff(attempt - 1, config.retryDelay)
        logger.info(`[MCP_TOOL_FLOW] 🔄 重试 ${attempt}/${config.maxRetries}，等待 ${backoffDelay}ms`, {
          toolName,
          callId
        })
        await delay(backoffDelay)
      }

      const response = await fetchWithTimeout(
        `${config.apiBaseUrl}/execute-tool`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            toolName,
            args,
            callId
          })
        },
        config.timeout
      )

      logger.info(`[MCP_TOOL_FLOW] 📡 收到 HTTP 响应`, {
        toolName,
        callId,
        status: response.status,
        ok: response.ok,
        attempt
      })

      if (!response.ok) {
        // 尝试解析错误详情
        try {
          const errorData = await response.json() as any
          if (errorData && errorData.error) {
            throw new Error(typeof errorData.error === 'object' ? errorData.error.message : errorData.error)
          }
        } catch (e) {
          // 解析失败，忽略
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json() as any

      logger.info(`[MCP_TOOL_FLOW] 📦 解析响应数据`, {
        toolName,
        callId,
        success: data.success,
        hasResult: !!data.result,
        error: data.error
      })

      if (!data.success) {
        throw new Error(data.error || 'Unknown error')
      }

      const duration = Date.now() - startTime
      logger.info(`[MCP_TOOL_FLOW] ✅ 工具执行成功`, {
        toolName,
        callId,
        duration: `${duration}ms`,
        attempts: attempt + 1,
        resultPreview: JSON.stringify(data.result).substring(0, 100)
      })

      return {
        success: true,
        data: data.result
      }
    } catch (error: any) {
      lastError = error

      // 检查是否是超时错误
      const isTimeout = error.name === 'AbortError'
      const isRetryable = isTimeout ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('fetch failed')

      logger.warn(`[MCP_TOOL_FLOW] ⚠️ 请求失败 (attempt ${attempt + 1}/${config.maxRetries + 1})`, {
        toolName,
        callId,
        error: error.message,
        isTimeout,
        isRetryable
      })

      // 如果不可重试或已达到最大重试次数，退出循环
      if (!isRetryable || attempt >= config.maxRetries) {
        break
      }
    }
  }

  // 所有重试都失败
  const duration = Date.now() - startTime
  logger.error(`[MCP_TOOL_FLOW] ❌ 工具执行失败（已重试 ${config.maxRetries} 次）`, {
    toolName,
    callId,
    duration: `${duration}ms`,
    error: lastError?.message,
    stack: lastError?.stack
  })

  return {
    success: false,
    error: lastError?.message || 'Unknown error after retries'
  }
}
