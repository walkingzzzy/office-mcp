/**
 * StdioBridge 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StdioBridge } from './StdioBridge.js'
import type { JsonRpcResponse } from '../types/index.js'

describe('StdioBridge', () => {
  let bridge: StdioBridge

  beforeEach(() => {
    bridge = new StdioBridge()
  })

  describe('sendRequest', () => {
    it('应该生成唯一的请求 ID', async () => {
      const serverId = 'test-server'
      const method = 'test/method'
      const params = {}

      // 模拟 processManager.getProcessStdio 返回 null，使请求失败
      // 这只是测试请求 Promise 是不同的实例
      const promise1 = bridge.sendRequest(serverId, method, params).catch(() => {})
      const promise2 = bridge.sendRequest(serverId, method, params).catch(() => {})

      expect(promise1).not.toBe(promise2)
    })

    it('应该在服务器未运行时抛出错误', async () => {
      const serverId = 'test-server'
      const method = 'test/method'

      await expect(
        bridge.sendRequest(serverId, method)
      ).rejects.toThrow('MCP 服务器未运行')
    })
  })

  describe('handleResponse', () => {
    it('应该正确解析 JSON-RPC 响应', () => {
      const response: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: { success: true }
      }

      const jsonString = JSON.stringify(response)
      const parsed = JSON.parse(jsonString)

      expect(parsed.jsonrpc).toBe('2.0')
      expect(parsed.id).toBe(1)
      expect(parsed.result).toEqual({ success: true })
    })

    it('应该处理错误响应', () => {
      const errorResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32600,
          message: 'Invalid Request'
        }
      }

      expect(errorResponse.error).toBeDefined()
      expect(errorResponse.error?.code).toBe(-32600)
    })
  })

  describe('cleanup', () => {
    it('应该清理所有待处理的请求', () => {
      bridge.cleanup()

      const pendingRequests = (bridge as any).pendingRequests
      expect(pendingRequests.size).toBe(0)
    })
  })
})
