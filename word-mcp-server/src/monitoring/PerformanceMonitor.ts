/**
 * 性能监控模块
 * 负责收集和跟踪 Office MCP Server 的性能指标
 */

import process from 'node:process'
import { clearInterval, setInterval } from 'node:timers'

import { logger } from '@office-mcp/shared'

export interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
  metadata?: Record<string, any>
}

export interface ToolCallMetric {
  toolName: string
  duration: number
  success: boolean
  timestamp: number
  error?: string
}

export interface SystemMetric {
  memoryUsage: {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
  }
  cpuUsage: {
    user: number
    system: number
  }
  uptime: number
  timestamp: number
}

export interface PerformanceStats {
  toolCalls: {
    total: number
    successful: number
    failed: number
    averageDuration: number
    byTool: Record<
      string,
      {
        total: number
        successful: number
        failed: number
        averageDuration: number
        lastError?: string
      }
    >
  }
  system: {
    currentMemoryMB: number
    peakMemoryMB: number
    averageMemoryMB: number
    uptime: number
  }
  errors: {
    total: number
    byType: Record<string, number>
    recent: Array<{
      message: string
      timestamp: number
      toolName?: string
    }>
  }
}

/**
 * 性能监控器类
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private toolCallMetrics: ToolCallMetric[] = []
  private systemMetrics: SystemMetric[] = []
  private errors: Array<{ message: string; timestamp: number; toolName?: string }> = []

  private readonly MAX_METRICS = 10000 // 最多保留 10000 条指标
  private readonly MAX_ERRORS = 100 // 最多保留 100 条错误
  private readonly METRICS_RETENTION_MS = 24 * 60 * 60 * 1000 // 24小时

  private monitoringInterval?: NodeJS.Timeout
  private startTime: number = Date.now()
  private peakMemoryMB: number = 0

  private constructor() {
    logger.info('Performance monitor initialized')
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * 启动监控
   */
  start(intervalMs: number = 60000): void {
    if (this.monitoringInterval) {
      logger.warn('Performance monitoring already started')
      return
    }

    logger.info(`Starting performance monitoring with ${intervalMs}ms interval`)

    // 立即收集一次系统指标
    this.collectSystemMetrics()

    // 定期收集系统指标
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics()
      this.cleanupOldMetrics()
    }, intervalMs)
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
      logger.info('Performance monitoring stopped')
    }
  }

  /**
   * 记录工具调用
   */
  recordToolCall(metric: ToolCallMetric): void {
    this.toolCallMetrics.push(metric)

    // 限制数组大小 - 使用 splice 原地修改避免创建新数组
    if (this.toolCallMetrics.length > this.MAX_METRICS) {
      this.toolCallMetrics.splice(0, this.toolCallMetrics.length - this.MAX_METRICS)
    }

    // 如果失败，记录错误
    if (!metric.success && metric.error) {
      this.recordError({
        message: metric.error,
        timestamp: metric.timestamp,
        toolName: metric.toolName
      })
    }
  }

  /**
   * 记录自定义指标
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)

    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.splice(0, this.metrics.length - this.MAX_METRICS)
    }
  }

  /**
   * 记录错误
   */
  recordError(error: { message: string; timestamp: number; toolName?: string }): void {
    this.errors.push(error)

    if (this.errors.length > this.MAX_ERRORS) {
      this.errors.splice(0, this.errors.length - this.MAX_ERRORS)
    }
  }

  /**
   * 收集系统指标
   */
  private collectSystemMetrics(): void {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    const memoryMB = memUsage.rss / 1024 / 1024
    if (memoryMB > this.peakMemoryMB) {
      this.peakMemoryMB = memoryMB
    }

    const systemMetric: SystemMetric = {
      memoryUsage: memUsage,
      cpuUsage: cpuUsage,
      uptime: process.uptime(),
      timestamp: Date.now()
    }

    this.systemMetrics.push(systemMetric)

    // 限制系统指标数量（保留最近1000条）- 使用 splice 原地修改
    if (this.systemMetrics.length > 1000) {
      this.systemMetrics.splice(0, this.systemMetrics.length - 1000)
    }
  }

  /**
   * 清理过期指标
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.METRICS_RETENTION_MS

    this.toolCallMetrics = this.toolCallMetrics.filter((m) => m.timestamp >= cutoff)
    this.metrics = this.metrics.filter((m) => m.timestamp >= cutoff)
    this.errors = this.errors.filter((e) => e.timestamp >= cutoff)
  }

  /**
   * 获取性能统计
   */
  getStats(timeRangeMs?: number): PerformanceStats {
    const cutoff = timeRangeMs ? Date.now() - timeRangeMs : 0
    const relevantCalls = this.toolCallMetrics.filter((m) => m.timestamp >= cutoff)

    // 工具调用统计
    const toolStats: Record<
      string,
      {
        total: number
        successful: number
        failed: number
        durations: number[]
        lastError?: string
      }
    > = {}

    let totalCalls = 0
    let successfulCalls = 0
    let failedCalls = 0
    let totalDuration = 0

    for (const call of relevantCalls) {
      totalCalls++
      totalDuration += call.duration

      if (call.success) {
        successfulCalls++
      } else {
        failedCalls++
      }

      if (!toolStats[call.toolName]) {
        toolStats[call.toolName] = {
          total: 0,
          successful: 0,
          failed: 0,
          durations: []
        }
      }

      const stat = toolStats[call.toolName]
      stat.total++
      stat.durations.push(call.duration)

      if (call.success) {
        stat.successful++
      } else {
        stat.failed++
        if (call.error) {
          stat.lastError = call.error
        }
      }
    }

    // 计算每个工具的平均耗时
    const byTool: Record<string, any> = {}
    for (const [toolName, stat] of Object.entries(toolStats)) {
      const avgDuration =
        stat.durations.length > 0 ? stat.durations.reduce((a, b) => a + b, 0) / stat.durations.length : 0

      byTool[toolName] = {
        total: stat.total,
        successful: stat.successful,
        failed: stat.failed,
        averageDuration: Math.round(avgDuration),
        lastError: stat.lastError
      }
    }

    // 系统指标统计
    const recentSystemMetrics = this.systemMetrics.filter((m) => m.timestamp >= cutoff)
    const currentMemory =
      recentSystemMetrics.length > 0
        ? recentSystemMetrics[recentSystemMetrics.length - 1].memoryUsage.rss / 1024 / 1024
        : 0

    const avgMemory =
      recentSystemMetrics.length > 0
        ? recentSystemMetrics.reduce((sum, m) => sum + m.memoryUsage.rss, 0) / recentSystemMetrics.length / 1024 / 1024
        : 0

    // 错误统计
    const recentErrors = this.errors.filter((e) => e.timestamp >= cutoff)
    const errorsByType: Record<string, number> = {}

    for (const error of recentErrors) {
      const type = error.toolName || 'system'
      errorsByType[type] = (errorsByType[type] || 0) + 1
    }

    return {
      toolCalls: {
        total: totalCalls,
        successful: successfulCalls,
        failed: failedCalls,
        averageDuration: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0,
        byTool
      },
      system: {
        currentMemoryMB: Math.round(currentMemory),
        peakMemoryMB: Math.round(this.peakMemoryMB),
        averageMemoryMB: Math.round(avgMemory),
        uptime: Math.round(process.uptime())
      },
      errors: {
        total: recentErrors.length,
        byType: errorsByType,
        recent: recentErrors.slice(-10) // 最近10条错误
      }
    }
  }

  /**
   * 获取实时指标（用于仪表板）
   */
  getRealTimeMetrics(): {
    currentMemoryMB: number
    currentCPU: { user: number; system: number }
    uptime: number
    recentToolCalls: ToolCallMetric[]
    activeErrors: number
  } {
    const latestSystem = this.systemMetrics[this.systemMetrics.length - 1]
    const last5Minutes = Date.now() - 5 * 60 * 1000
    const recentCalls = this.toolCallMetrics.filter((m) => m.timestamp >= last5Minutes)
    const recentErrors = this.errors.filter((e) => e.timestamp >= last5Minutes)

    return {
      currentMemoryMB: latestSystem ? Math.round(latestSystem.memoryUsage.rss / 1024 / 1024) : 0,
      currentCPU: latestSystem?.cpuUsage || { user: 0, system: 0 },
      uptime: Math.round(process.uptime()),
      recentToolCalls: recentCalls.slice(-20), // 最近20次调用
      activeErrors: recentErrors.length
    }
  }

  /**
   * 导出所有指标（用于调试）
   */
  exportMetrics(): {
    metrics: PerformanceMetric[]
    toolCalls: ToolCallMetric[]
    systemMetrics: SystemMetric[]
    errors: Array<{ message: string; timestamp: number; toolName?: string }>
  } {
    return {
      metrics: [...this.metrics],
      toolCalls: [...this.toolCallMetrics],
      systemMetrics: [...this.systemMetrics],
      errors: [...this.errors]
    }
  }

  /**
   * 重置所有指标
   */
  reset(): void {
    this.metrics = []
    this.toolCallMetrics = []
    this.systemMetrics = []
    this.errors = []
    this.peakMemoryMB = 0
    this.startTime = Date.now()
    logger.warn('Performance metrics reset')
  }
}

// 导出单例实例
export const performanceMonitor = PerformanceMonitor.getInstance()
