/**
 * MCP 命令轮询服务
 * 从主进程 API 获取待执行的 MCP 工具命令，通过 McpToolExecutor 执行后返回结果
 *
 * ⚠️ 所有工具执行通过 McpToolExecutor → MCP Server 完成
 */

import Logger from '../utils/logger'
import type { FunctionResult } from './ai/types'
import { officeToolExecutor } from './OfficeToolExecutor'

const logger = new Logger('McpCommandPoller')

/**
 * 统一的 localStorage 键名（与 config.ts 保持一致）
 */
const STORAGE_KEY_API_BASE_URL = 'wuhanwenjin_office_api_base_url'

/**
 * 获取 API Base URL
 * 优先级: 环境变量 > localStorage > 相对路径（开发模式）> 默认值
 */
function getApiBaseUrl(): string {
  // 1. 环境变量
  if (import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }

  // 2. localStorage 配置（使用统一的键名）
  try {
    const stored = localStorage.getItem(STORAGE_KEY_API_BASE_URL)
    if (stored) {
      return stored
    }
  } catch {
    // localStorage 不可用时忽略
  }

  // 3. 开发模式使用相对路径，让 Vite 代理处理 HTTPS → HTTP
  const isDev = import.meta.env?.DEV ?? false
  if (isDev) {
    return ''  // 相对路径，通过 Vite 代理访问
  }

  // 4. 生产环境默认值
  return 'http://localhost:3001'
}

// 轮询配置
const POLL_INTERVAL_BASE = 500 // 基础轮询间隔 500ms
const POLL_INTERVAL_MAX = 5000 // 最大轮询间隔 5s
const BACKOFF_MULTIPLIER = 1.5 // 退避倍数
const MAX_CONSECUTIVE_ERRORS = 10 // 连续错误阈值
const COMMAND_EXECUTION_TIMEOUT = 55000 // 命令执行超时（略小于 Bridge 的 60s）

interface PendingCommand {
  callId: string
  toolName: string
  args: Record<string, unknown>
}

class McpCommandPoller {
  private polling = false
  private intervalId: number | null = null
  private processing = new Set<string>() // 正在处理的命令，防止重复执行
  private consecutiveErrors = 0 // 连续错误计数
  private currentInterval = POLL_INTERVAL_BASE // 当前轮询间隔
  private commandResultEndpointMissing = false // 标记 bridge 服务是否未实现回调端点

  constructor() {}

  /**
   * 启动轮询
   */
  start(): void {
    if (this.polling) {
      logger.warn('Poller already running')
      return
    }

    this.polling = true
    this.consecutiveErrors = 0
    this.currentInterval = POLL_INTERVAL_BASE
    logger.info('[MCP_POLLER] 🚀 启动 MCP 命令轮询服务', { 
      apiBaseUrl: getApiBaseUrl(),
      interval: this.currentInterval 
    })

    this.scheduleNextPoll()
  }

  /**
   * 调度下一次轮询（支持动态间隔）
   */
  private scheduleNextPoll(): void {
    if (!this.polling) return
    
    this.intervalId = window.setTimeout(() => {
      this.poll().finally(() => {
        this.scheduleNextPoll()
      })
    }, this.currentInterval)
  }

  /**
   * 停止轮询
   */
  stop(): void {
    if (!this.polling) return

    this.polling = false
    if (this.intervalId !== null) {
      window.clearTimeout(this.intervalId)
      this.intervalId = null
    }
    logger.info('[MCP_POLLER] 停止 MCP 命令轮询服务')
  }

  /**
   * 处理成功轮询 - 重置退避
   */
  private onPollSuccess(): void {
    if (this.consecutiveErrors > 0) {
      logger.info('[MCP_POLLER] 连接恢复正常')
    }
    this.consecutiveErrors = 0
    this.currentInterval = POLL_INTERVAL_BASE
  }

  /**
   * 处理轮询失败 - 指数退避
   */
  private onPollError(error: Error): void {
    this.consecutiveErrors++
    
    // 指数退避
    this.currentInterval = Math.min(
      this.currentInterval * BACKOFF_MULTIPLIER,
      POLL_INTERVAL_MAX
    )
    
    // 记录错误日志
    if (this.consecutiveErrors === 1) {
      logger.warn('[MCP_POLLER] ⚠️ 轮询失败，启动退避', {
        error: error.message,
        nextInterval: this.currentInterval
      })
    } else if (this.consecutiveErrors % 5 === 0) {
      // 每5次错误记录一次，避免日志泛滥
      logger.error('[MCP_POLLER] ❌ 持续轮询失败', {
        consecutiveErrors: this.consecutiveErrors,
        error: error.message,
        nextInterval: this.currentInterval
      })
    }
    
    // 超过阈值时发出警告
    if (this.consecutiveErrors === MAX_CONSECUTIVE_ERRORS) {
      logger.error('[MCP_POLLER] 连接可能已断开，请检查 office-local-bridge 服务是否运行', {
        apiBaseUrl: getApiBaseUrl()
      })
    }
  }

  /**
   * 执行一次轮询
   */
  private async poll(): Promise<void> {
    if (!this.polling) return

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/pending-commands`)
      if (!response.ok) {
        this.onPollError(new Error(`HTTP ${response.status}`))
        return
      }

      const data = await response.json()
      const commands: PendingCommand[] = data.commands || []
      
      // 轮询成功，重置退避
      this.onPollSuccess()

      for (const cmd of commands) {
        // 跳过正在处理的命令
        if (this.processing.has(cmd.callId)) continue

        this.processing.add(cmd.callId)
        this.executeCommand(cmd).finally(() => {
          this.processing.delete(cmd.callId)
        })
      }
    } catch (error: unknown) {
      this.onPollError(error as Error)
    }
  }

  /**
   * 执行命令并返回结果
   * 
   * ⚠️ 所有工具执行通过 OfficeToolExecutor
   * 添加执行超时以与 Bridge 的 60s 超时保持同步
   */
  private async executeCommand(cmd: PendingCommand): Promise<void> {
    const { callId, toolName, args } = cmd
    logger.info('[MCP_POLLER] ✨ 执行 MCP 命令', { callId, toolName })

    try {
      // 创建超时 Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('命令执行超时')), COMMAND_EXECUTION_TIMEOUT)
      })

      // 通过 OfficeToolExecutor 执行工具，带超时控制
      const result = await Promise.race([
        officeToolExecutor.executeTool(toolName, args, { toolCallId: callId }),
        timeoutPromise
      ])

      if (result.success) {
        logger.info('[MCP_POLLER] ✅ 命令执行成功', {
          callId,
          toolName
        })
        await this.sendResult(callId, true, result)
      } else {
        logger.warn('[MCP_POLLER] ⚠️ 命令执行失败', {
          callId,
          toolName,
          message: result.message
        })
        await this.sendResult(callId, false, result, result.message)
      }
    } catch (error: unknown) {
      const err = error as Error
      const isTimeout = err.message === '命令执行超时'
      logger.error('[MCP_POLLER] ❌ 命令执行异常', {
        callId,
        toolName,
        error: err.message,
        isTimeout
      })

      // 返回错误结果
      await this.sendResult(callId, false, null, isTimeout ? '命令执行超时（55秒）' : err.message)
    }
  }

  /**
   * 发送执行结果到主进程
   */
  private async sendResult(
    callId: string,
    success: boolean,
    result: FunctionResult | null,
    error?: string
  ): Promise<void> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/command-result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          callId,
          success,
          result,
          error
        })
      })

      if (response.status === 404) {
        if (!this.commandResultEndpointMissing) {
          this.commandResultEndpointMissing = true
          logger.info('[MCP_POLLER] Command result endpoint not implemented, skip reporting', { callId })
        }
        return
      }

      if (this.commandResultEndpointMissing && response.ok) {
        this.commandResultEndpointMissing = false
      }

      if (!response.ok) {
        const responseText = await response.text().catch(() => '')
        logger.warn('[MCP_POLLER] Failed to deliver command result', {
          callId,
          status: response.status,
          body: responseText
        })
      }
    } catch (e) {
      logger.error('Failed to send command result', { callId, error: e })
    }
  }
}

// 导出单例
export const mcpCommandPoller = new McpCommandPoller()
