/**
 * 监控模块测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, rmSync } from 'fs'
import { join } from 'path'
import { MetricsStorage } from '../monitoring/MetricsStorage.js'
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor.js'

describe('MetricsStorage', () => {
  const testDataDir = join(process.cwd(), 'data', 'powerpoint-metrics-test')

  beforeEach(() => {
    // 清理测试数据
    if (existsSync(testDataDir)) {
      rmSync(testDataDir, { recursive: true, force: true })
    }
  })

  afterEach(() => {
    // 清理测试数据
    if (existsSync(testDataDir)) {
      rmSync(testDataDir, { recursive: true, force: true })
    }
  })

  it('应该创建存储目录', async () => {
    const storage = MetricsStorage.getInstance()
    expect(existsSync(testDataDir)).toBe(false)
  })

  it('应该保存和加载历史数据', async () => {
    const storage = MetricsStorage.getInstance()

    const mockStats = {
      totalRequests: 10,
      successfulRequests: 9,
      failedRequests: 1,
      averageResponseTime: 150,
      requestsPerSecond: 2.5,
      errorRate: 0.1,
      uptime: 3600,
      memoryUsage: {
        heapUsed: 50 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        external: 5 * 1024 * 1024,
        rss: 120 * 1024 * 1024
      },
      cpuUsage: {
        user: 1000000,
        system: 500000
      }
    }

    const serverInfo = {
      version: '1.0.0',
      uptime: 3600,
      startTime: Date.now() - 3600000
    }

    await storage.saveSnapshot(mockStats, serverInfo)

    const history = await storage.loadHistory()
    expect(history.snapshots).toHaveLength(1)
    expect(history.snapshots[0].stats.totalRequests).toBe(10)
  })
})

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    const monitor = PerformanceMonitor.getInstance()
    monitor.reset()
  })

  it('应该记录工具调用', () => {
    const monitor = PerformanceMonitor.getInstance()

    monitor.recordToolCall({
      toolName: 'test-tool',
      duration: 100,
      success: true,
      timestamp: Date.now()
    })

    const stats = monitor.getStats()
    expect(stats.toolCalls.total).toBe(1)
    expect(stats.toolCalls.successful).toBe(1)
  })

  it('应该计算平均响应时间', () => {
    const monitor = PerformanceMonitor.getInstance()

    monitor.recordToolCall({
      toolName: 'test-tool-1',
      duration: 100,
      success: true,
      timestamp: Date.now()
    })
    monitor.recordToolCall({
      toolName: 'test-tool-2',
      duration: 200,
      success: true,
      timestamp: Date.now()
    })

    const stats = monitor.getStats()
    expect(stats.toolCalls.averageDuration).toBe(150)
  })

  it('应该计算错误率', () => {
    const monitor = PerformanceMonitor.getInstance()

    monitor.recordToolCall({
      toolName: 'test-tool-1',
      duration: 100,
      success: true,
      timestamp: Date.now()
    })
    monitor.recordToolCall({
      toolName: 'test-tool-2',
      duration: 100,
      success: false,
      timestamp: Date.now(),
      error: 'Test error'
    })

    const stats = monitor.getStats()
    const errorRate = stats.toolCalls.failed / stats.toolCalls.total
    expect(errorRate).toBe(0.5)
    expect(stats.errors.total).toBe(1)
  })
})
