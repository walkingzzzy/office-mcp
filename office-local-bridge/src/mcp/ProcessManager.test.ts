/**
 * ProcessManager 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ProcessManager } from './ProcessManager.js'
import type { McpServerConfig } from '../types/index.js'

describe('ProcessManager', () => {
  let manager: ProcessManager

  const mockConfig: McpServerConfig = {
    id: 'test-server',
    name: 'Test MCP Server',
    command: 'node',
    args: ['--version'],
    enabled: true
  }

  beforeEach(() => {
    manager = new ProcessManager()
  })

  afterEach(async () => {
    await manager.stopAll()
  })

  describe('register', () => {
    it('应该成功注册 MCP 服务器', () => {
      manager.register(mockConfig)
      const status = manager.getStatus(mockConfig.id)

      expect(status).toBeDefined()
      expect(status?.id).toBe(mockConfig.id)
      expect(status?.name).toBe(mockConfig.name)
      expect(status?.status).toBe('stopped')
    })

    it('应该忽略重复注册', () => {
      manager.register(mockConfig)
      manager.register(mockConfig)

      const allStatus = manager.getAllStatus()
      expect(allStatus).toHaveLength(1)
    })
  })

  describe('start', () => {
    it('应该成功启动 MCP 服务器', async () => {
      manager.register(mockConfig)
      const result = await manager.start(mockConfig.id)

      expect(result).toBe(true)

      const status = manager.getStatus(mockConfig.id)
      expect(status?.status).toBe('running')
    })

    it('应该拒绝启动未注册的服务器', async () => {
      const result = await manager.start('non-existent')
      expect(result).toBe(false)
    })
  })

  describe('stop', () => {
    it('应该成功停止运行中的服务器', async () => {
      manager.register(mockConfig)
      await manager.start(mockConfig.id)

      const result = await manager.stop(mockConfig.id)
      expect(result).toBe(true)

      const status = manager.getStatus(mockConfig.id)
      expect(status?.status).toBe('stopped')
    })
  })

  describe('getAllStatus', () => {
    it('应该返回所有服务器状态', () => {
      manager.register(mockConfig)
      manager.register({
        ...mockConfig,
        id: 'test-server-2',
        name: 'Test Server 2'
      })

      const allStatus = manager.getAllStatus()
      expect(allStatus).toHaveLength(2)
    })
  })
})
