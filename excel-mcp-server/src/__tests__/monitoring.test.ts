/**
 * 监控模块测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, rmSync, mkdtempSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { MetricsStorage } from '../monitoring/MetricsStorage.js'
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor.js'

describe('MetricsStorage', () => {
  let testDataDir: string

  beforeEach(() => {
    // 创建临时目录
    testDataDir = mkdtempSync(join(tmpdir(), 'excel-metrics-test-'))
    MetricsStorage.resetInstance(testDataDir)
  })

  afterEach(() => {
    // 重置实例并清理临时目录
    MetricsStorage.resetInstance()
    if (existsSync(testDataDir)) {
      rmSync(testDataDir, { recursive: true, force: true })
    }
  })

  it('应该创建存储目录', async () => {
    const storage = MetricsStorage.getInstance()
    expect(existsSync(testDataDir)).toBe(true)
  })

  it('应该保存和加载历史数据', async () => {
    const storage = MetricsStorage.getInstance()

    const mockStats = {
      toolCalls: {
        total: 10,
        successful: 9,
        failed: 1,
        averageDuration: 150,
        byTool: {}
      },
      system: {
        currentMemoryMB: 50,
        peakMemoryMB: 100,
        averageMemoryMB: 75,
        uptime: 3600
      },
      errors: {
        total: 1,
        byType: {},
        recent: []
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
    expect(history.snapshots[0].stats.toolCalls.total).toBe(10)
  })
})

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // 重置监控器状态
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

  it('应该按工具名称统计', () => {
    const monitor = PerformanceMonitor.getInstance()

    monitor.recordToolCall({
      toolName: 'excel_cell',
      duration: 50,
      success: true,
      timestamp: Date.now()
    })
    monitor.recordToolCall({
      toolName: 'excel_cell',
      duration: 100,
      success: true,
      timestamp: Date.now()
    })
    monitor.recordToolCall({
      toolName: 'excel_format',
      duration: 200,
      success: false,
      timestamp: Date.now(),
      error: 'Format error'
    })

    const stats = monitor.getStats()
    expect(stats.toolCalls.byTool['excel_cell'].total).toBe(2)
    expect(stats.toolCalls.byTool['excel_cell'].averageDuration).toBe(75)
    expect(stats.toolCalls.byTool['excel_format'].failed).toBe(1)
    expect(stats.toolCalls.byTool['excel_format'].lastError).toBe('Format error')
  })
})
