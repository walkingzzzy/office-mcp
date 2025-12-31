/**
 * Browser Tool Executor
 *
 * 通过 IPC 调用浏览器端 Office.js API 的执行器
 * 这个执行器负责将 MCP 工具调用转发到 Office 插件的浏览器环境
 */

import { clearTimeout, setTimeout } from 'node:timers'

import { logger } from '@office-mcp/shared'
import type { ToolExecutionResult } from '../types.js'

export interface IPCBridge {
  sendToRenderer(channel: string, ...args: any[]): void
  invoke(channel: string, ...args: any[]): Promise<any>
}

/**
 * 浏览器工具执行器
 * 负责通过 IPC 与 Office 插件通信
 */
export class BrowserToolExecutor {
  private ipcBridge: IPCBridge | null = null
  private timeout: number = 30000 // 30 秒超时

  /**
   * 设置 IPC 桥接
   */
  setIPCBridge(bridge: IPCBridge): void {
    this.ipcBridge = bridge
    logger.info('IPC Bridge configured for BrowserToolExecutor')
  }

  /**
   * 设置超时时间
   */
  setTimeout(timeout: number): void {
    this.timeout = timeout
  }

  /**
   * 执行浏览器端工具
   * @param toolName 工具名称
   * @param args 工具参数
   * @returns 执行结果
   */
  async executeBrowserTool(toolName: string, args: Record<string, any>): Promise<ToolExecutionResult> {
    if (!this.ipcBridge) {
      return {
        success: false,
        error: 'IPC Bridge not configured. Cannot execute browser tools.',
        message: 'Browser tool execution requires IPC bridge to be set up.'
      }
    }

    const startTime = Date.now()

    try {
      logger.info(`Executing browser tool: ${toolName} with args: ${JSON.stringify(args)}`)

      // 创建超时 Promise，保存 timer 引用以便清理
      let timeoutTimer: NodeJS.Timeout | null = null
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutTimer = setTimeout(() => {
          reject(new Error(`Tool execution timeout after ${this.timeout}ms`))
        }, this.timeout)

        // 确保在 Node.js 环境中 timer 不会阻止进程退出
        if (timeoutTimer.unref) {
          timeoutTimer.unref()
        }
      })

      // 通过 IPC 调用浏览器端工具
      const executionPromise = this.ipcBridge.invoke('office:execute-mcp-tool', {
        toolName,
        args
      })

      try {
        // 竞速：执行 vs 超时
        const result = await Promise.race([executionPromise, timeoutPromise])

        const executionTime = Date.now() - startTime

        logger.info(`Browser tool ${toolName} completed in ${executionTime}ms (success: ${result.success})`)

        return {
          ...result,
          metadata: {
            ...result.metadata,
            executionTime,
            timestamp: Date.now()
          }
        }
      } finally {
        // 清理定时器，防止内存泄漏和未捕获的 rejection
        if (timeoutTimer) {
          clearTimeout(timeoutTimer)
        }
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime

      logger.error(`Browser tool ${toolName} failed after ${executionTime}ms: ${error.message}`)

      return {
        success: false,
        error: error.message || 'Unknown error during browser tool execution',
        stack: error.stack,
        message: `Failed to execute browser tool: ${toolName}`,
        metadata: {
          executionTime,
          timestamp: Date.now()
        }
      }
    }
  }

  /**
   * 检查 IPC 桥接是否可用
   */
  isAvailable(): boolean {
    return this.ipcBridge !== null
  }

  /**
   * 获取浏览器端可用工具列表
   */
  async getAvailableTools(): Promise<string[]> {
    if (!this.ipcBridge) {
      logger.warn('IPC Bridge not configured, cannot get available tools')
      return []
    }

    try {
      const result = await this.ipcBridge.invoke('office:get-available-tools')
      return result.tools || []
    } catch (error: any) {
      logger.error(`Failed to get available browser tools: ${error.message}`)
      return []
    }
  }
}

// 单例实例
let browserToolExecutorInstance: BrowserToolExecutor | null = null

/**
 * 获取浏览器工具执行器单例
 */
export function getBrowserToolExecutor(): BrowserToolExecutor {
  if (!browserToolExecutorInstance) {
    browserToolExecutorInstance = new BrowserToolExecutor()
  }
  return browserToolExecutorInstance
}

/**
 * 配置浏览器工具执行器的 IPC 桥接
 */
export function configureBrowserToolExecutor(bridge: IPCBridge): void {
  const executor = getBrowserToolExecutor()
  executor.setIPCBridge(bridge)
}
