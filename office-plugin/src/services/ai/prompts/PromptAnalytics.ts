/**
 * 提示词性能分析器 - 监控和分析提示词性能
 */

import Logger from '../../../utils/logger'
import type { IntentType } from './types'

const logger = new Logger('PromptAnalytics')

interface PerformanceMetric {
  timestamp: number
  templateIds: string[]
  intentType: IntentType
  selectionType: string
  tokenCount: number
  responseTime: number
  success: boolean
  toolsSelected: number
  toolsExecuted: number
}

interface AnalyticsReport {
  totalRequests: number
  avgTokenCount: number
  avgResponseTime: number
  successRate: number
  topIntents: Array<{ intent: IntentType; count: number }>
  topTemplates: Array<{ templateId: string; count: number }>
  tokenSavings: number
}

export class PromptAnalytics {
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 5000
  private baselineTokenCount = 400 // 原始系统提示词token数

  /**
   * 记录性能指标
   */
  recordMetric(
    templateIds: string[],
    intentType: IntentType,
    selectionType: string,
    tokenCount: number,
    responseTime: number,
    success: boolean,
    toolsSelected: number,
    toolsExecuted: number
  ): void {
    const metric: PerformanceMetric = {
      timestamp: Date.now(),
      templateIds,
      intentType,
      selectionType,
      tokenCount,
      responseTime,
      success,
      toolsSelected,
      toolsExecuted
    }

    this.metrics.push(metric)

    // 限制指标数量
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    logger.debug('Performance metric recorded', metric)
  }

  /**
   * 生成分析报告
   */
  generateReport(timeRange?: { start: number; end: number }): AnalyticsReport {
    let filteredMetrics = this.metrics

    if (timeRange) {
      filteredMetrics = this.metrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      )
    }

    if (filteredMetrics.length === 0) {
      return {
        totalRequests: 0,
        avgTokenCount: 0,
        avgResponseTime: 0,
        successRate: 0,
        topIntents: [],
        topTemplates: [],
        tokenSavings: 0
      }
    }

    // 计算基础统计
    const totalRequests = filteredMetrics.length
    const avgTokenCount = filteredMetrics.reduce((sum, m) => sum + m.tokenCount, 0) / totalRequests
    const avgResponseTime = filteredMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
    const successRate = filteredMetrics.filter(m => m.success).length / totalRequests

    // 统计意图类型
    const intentCounts = new Map<IntentType, number>()
    filteredMetrics.forEach(m => {
      intentCounts.set(m.intentType, (intentCounts.get(m.intentType) || 0) + 1)
    })

    const topIntents = Array.from(intentCounts.entries())
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // 统计模板使用
    const templateCounts = new Map<string, number>()
    filteredMetrics.forEach(m => {
      m.templateIds.forEach(id => {
        templateCounts.set(id, (templateCounts.get(id) || 0) + 1)
      })
    })

    const topTemplates = Array.from(templateCounts.entries())
      .map(([templateId, count]) => ({ templateId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // 计算Token节省
    const tokenSavings = Math.round(
      ((this.baselineTokenCount - avgTokenCount) / this.baselineTokenCount) * 100
    )

    return {
      totalRequests,
      avgTokenCount: Math.round(avgTokenCount),
      avgResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate * 100) / 100,
      topIntents,
      topTemplates,
      tokenSavings
    }
  }

  /**
   * 获取实时统计
   */
  getRealTimeStats() {
    const last24h = Date.now() - 24 * 60 * 60 * 1000
    const recentMetrics = this.metrics.filter(m => m.timestamp >= last24h)

    return {
      last24hRequests: recentMetrics.length,
      currentSuccessRate: recentMetrics.length > 0
        ? recentMetrics.filter(m => m.success).length / recentMetrics.length
        : 0,
      avgTokensLast24h: recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.tokenCount, 0) / recentMetrics.length
        : 0
    }
  }

  /**
   * 清理旧数据
   */
  cleanup(olderThanDays: number = 7): void {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    const originalLength = this.metrics.length

    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff)

    const removed = originalLength - this.metrics.length
    if (removed > 0) {
      logger.info('Analytics cleanup completed', { removed, remaining: this.metrics.length })
    }
  }
}