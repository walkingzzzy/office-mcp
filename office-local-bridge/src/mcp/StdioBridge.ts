/**
 * stdio 通信桥接
 * 负责与 MCP Server 的 JSON-RPC 通信
 */

import { EventEmitter } from 'node:events'
import type { JsonRpcRequest, JsonRpcResponse } from '../types/index.js'
import { createLogger } from '../utils/logger.js'
import { processManager } from './ProcessManager.js'
import { loadConfig } from '../config/index.js'

const logger = createLogger('StdioBridge')

/**
 * 待处理的请求
 */
interface PendingRequest {
  resolve: (response: JsonRpcResponse) => void
  reject: (error: Error) => void
  timeout: NodeJS.Timeout
}

/**
 * stdio 桥接器
 */
// 缓冲区大小限制：1MB
const MAX_BUFFER_SIZE = 1024 * 1024

export class StdioBridge extends EventEmitter {
  private pendingRequests: Map<string | number, PendingRequest> = new Map()
  private buffers: Map<string, string> = new Map()
  private requestTimeout: number

  constructor() {
    super()
    const config = loadConfig()
    this.requestTimeout = config.mcpRequestTimeout ?? 30000
  }

  /**
   * 初始化服务器的 stdio 监听
   */
  initServer(serverId: string): void {
    const stdio = processManager.getProcessStdio(serverId)
    if (!stdio) {
      logger.error('无法获取进程 stdio', { serverId })
      return
    }

    this.buffers.set(serverId, '')

    stdio.stdout.on('data', (data: Buffer) => {
      this.handleStdoutData(serverId, data)
    })

    logger.info('stdio 桥接已初始化', { serverId })
  }

  /**
   * 处理 stdout 数据
   */
  private handleStdoutData(serverId: string, data: Buffer): void {
    let buffer = this.buffers.get(serverId) || ''
    buffer += data.toString()

    // 检查缓冲区大小，防止内存泄漏
    if (buffer.length > MAX_BUFFER_SIZE) {
      logger.error('MCP 服务器缓冲区溢出，丢弃数据并重置缓冲区', {
        serverId,
        bufferSize: buffer.length,
        maxSize: MAX_BUFFER_SIZE
      })
      // 只保留最后一部分数据（可能是未完成的行）
      // 从最后一个换行符之后开始保留
      const lastNewlineIndex = buffer.lastIndexOf('\n')
      if (lastNewlineIndex !== -1 && buffer.length - lastNewlineIndex <= MAX_BUFFER_SIZE / 2) {
        buffer = buffer.slice(lastNewlineIndex + 1)
      } else {
        // 完全清空缓冲区
        buffer = ''
      }
      this.buffers.set(serverId, buffer)
      this.emit('bufferOverflow', serverId)
      return
    }

    // 按行分割处理
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    this.buffers.set(serverId, buffer)

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      try {
        const response = JSON.parse(trimmed) as JsonRpcResponse
        this.handleResponse(serverId, response)
      } catch (parseError) {
        // 区分错误和普通日志
        if (trimmed.toLowerCase().includes('error') || trimmed.includes('Error')) {
          logger.warn('MCP 服务器错误输出', { serverId, line: trimmed })
        } else {
          logger.debug('MCP 服务器日志', { serverId, line: trimmed })
        }
      }
    }
  }

  /**
   * 处理 JSON-RPC 响应
   */
  private handleResponse(serverId: string, response: JsonRpcResponse): void {
    const requestId = response.id
    const pending = this.pendingRequests.get(requestId)

    if (pending) {
      clearTimeout(pending.timeout)
      this.pendingRequests.delete(requestId)
      pending.resolve(response)
      logger.debug('收到响应', { serverId, id: requestId })
    } else {
      // 可能是通知或未知响应
      this.emit('notification', serverId, response)
      logger.debug('收到通知', { serverId, response })
    }
  }

  /**
   * 发送 JSON-RPC 请求
   */
  async sendRequest(serverId: string, method: string, params?: unknown): Promise<JsonRpcResponse> {
    const stdio = processManager.getProcessStdio(serverId)
    if (!stdio) {
      throw new Error(`MCP 服务器未运行: ${serverId}`)
    }

    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const pending = this.pendingRequests.get(id)
        if (pending) {
          this.pendingRequests.delete(id)
          logger.warn('请求超时', { serverId, method, id, timeout: this.requestTimeout })
          this.emit('timeout', serverId, method, id)
          reject(new Error(`请求超时: ${method}`))
        }
      }, this.requestTimeout)

      this.pendingRequests.set(id, { resolve, reject, timeout })

      const message = JSON.stringify(request) + '\n'
      stdio.stdin.write(message, (error) => {
        if (error) {
          clearTimeout(timeout)
          this.pendingRequests.delete(id)
          logger.error('写入请求失败', { serverId, method, id, error: error.message })
          reject(error)
        }
      })

      logger.debug('发送请求', { serverId, method, id })
    })
  }

  /**
   * 调用 MCP 工具
   */
  async callTool(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    const response = await this.sendRequest(serverId, 'tools/call', {
      name: toolName,
      arguments: args
    })

    // 更新最后活动时间
    processManager.updateLastActivityTime(serverId)

    if (response.error) {
      throw new Error(response.error.message)
    }

    return response.result
  }

  /**
   * 列出 MCP 工具
   */
  async listTools(serverId: string): Promise<unknown> {
    const response = await this.sendRequest(serverId, 'tools/list')

    if (response.error) {
      throw new Error(response.error.message)
    }

    // 更新工具数量到 ProcessManager
    const result = response.result as { tools?: unknown[] }
    if (result?.tools) {
      processManager.updateToolCount(serverId, result.tools.length)
    }

    // 更新最后活动时间
    processManager.updateLastActivityTime(serverId)

    return response.result
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout)
      pending.reject(new Error('桥接器已关闭'))
    }
    this.pendingRequests.clear()
    this.buffers.clear()
  }
}

export const stdioBridge = new StdioBridge()
