/**
 * 监控系统 - 生产环境监控和日志
 */

import { logger } from '@office-mcp/shared'
import { PerformanceMonitor, PerformanceStats } from './PerformanceMonitor.js'

export interface MonitoringConfig {
  enableMetrics: boolean
  metricsInterval: number
  enableHealthCheck: boolean
  healthCheckInterval: number
  enableAlerts: boolean
  alertThresholds: {
    memoryUsage: number
    responseTime: number
    errorRate: number
  }
}

export class MonitoringSystem {
  private static instance: MonitoringSystem
  private config: MonitoringConfig
  private performanceMonitor: PerformanceMonitor
  private metricsInterval?: NodeJS.Timeout
  private healthInterval?: NodeJS.Timeout

  private constructor(config: MonitoringConfig) {
    this.config = config
    this.performanceMonitor = PerformanceMonitor.getInstance()
  }

  static getInstance(config?: MonitoringConfig): MonitoringSystem {
    if (!MonitoringSystem.instance && config) {
      MonitoringSystem.instance = new MonitoringSystem(config)
    }
    return MonitoringSystem.instance
  }

  start(): void {
    logger.info('启动监控系统')

    if (this.config.enableMetrics) {
      this.startMetricsCollection()
    }

    if (this.config.enableHealthCheck) {
      this.startHealthChecks()
    }
  }

  stop(): void {
    if (this.metricsInterval) {
      globalThis.clearInterval(this.metricsInterval)
    }
    if (this.healthInterval) {
      globalThis.clearInterval(this.healthInterval)
    }
    logger.info('监控系统已停止')
  }

  private startMetricsCollection(): void {
    this.metricsInterval = globalThis.setInterval(() => {
      const metrics = this.performanceMonitor.getStats()
      this.checkAlerts(metrics)
      logger.info('性能指标收集')
    }, this.config.metricsInterval)
  }

  private startHealthChecks(): void {
    this.healthInterval = globalThis.setInterval(() => {
      // 简单的健康检查：检查内存使用
      const memUsage = process.memoryUsage()
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024
      if (heapUsedMB > 500) {
        logger.warn(`内存使用较高: ${heapUsedMB.toFixed(2)} MB`)
      }
    }, this.config.healthCheckInterval)
  }

  private checkAlerts(metrics: PerformanceStats): void {
    if (!this.config.enableAlerts) return

    // 内存使用率告警
    if (metrics.system.currentMemoryMB > this.config.alertThresholds.memoryUsage) {
      logger.error(`内存使用率过高: ${metrics.system.currentMemoryMB.toFixed(2)} MB`)
    }

    // 响应时间告警
    if (metrics.toolCalls.averageDuration > this.config.alertThresholds.responseTime) {
      logger.error(`响应时间过长: ${metrics.toolCalls.averageDuration.toFixed(2)} ms`)
    }

    // 错误率告警
    const errorRate = metrics.toolCalls.total > 0
      ? metrics.toolCalls.failed / metrics.toolCalls.total
      : 0
    if (errorRate > this.config.alertThresholds.errorRate) {
      logger.error(`错误率过高: ${(errorRate * 100).toFixed(2)}%`)
    }
  }

  getMetrics() {
    return this.performanceMonitor.getStats()
  }

  getHealth() {
    const memUsage = process.memoryUsage()
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024
    return {
      status: heapUsedMB > 500 ? 'warning' : 'healthy',
      memoryUsage: heapUsedMB,
      uptime: process.uptime()
    }
  }
}
