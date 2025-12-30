/**
 * 监控数据存储模块
 * 负责持久化和管理监控数据
 */

import { existsSync, mkdirSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'

import { logger } from '@office-mcp/shared'
import type { PerformanceStats } from './PerformanceMonitor.js'

export interface StoredMetrics {
  timestamp: number
  stats: PerformanceStats
  serverInfo: {
    version: string
    uptime: number
    startTime: number
  }
}

export interface MetricsHistory {
  snapshots: StoredMetrics[]
  lastUpdated: number
}

/**
 * 监控数据存储类
 */
export class MetricsStorage {
  private static instance: MetricsStorage
  private storageDir: string
  private historyFile: string
  private readonly MAX_SNAPSHOTS = 288 // 24小时，每5分钟一个快照

  private constructor() {
    this.storageDir = join(process.cwd(), 'data', 'word-metrics')
    this.historyFile = join(this.storageDir, 'history.json')
    this.ensureStorageDir()
  }

  static getInstance(): MetricsStorage {
    if (!MetricsStorage.instance) {
      MetricsStorage.instance = new MetricsStorage()
    }
    return MetricsStorage.instance
  }

  /**
   * 确保存储目录存在（同步创建，避免竞态条件）
   */
  private ensureStorageDir(): void {
    try {
      if (!existsSync(this.storageDir)) {
        mkdirSync(this.storageDir, { recursive: true })
        logger.info(`Created metrics storage directory: ${this.storageDir}`)
      }
    } catch (error: any) {
      logger.error(`Failed to create storage directory: ${error.message}`)
    }
  }

  /**
   * 保存性能快照
   */
  async saveSnapshot(
    stats: PerformanceStats,
    serverInfo: { version: string; uptime: number; startTime: number }
  ): Promise<void> {
    try {
      const snapshot: StoredMetrics = {
        timestamp: Date.now(),
        stats,
        serverInfo
      }

      // 读取现有历史
      const history = await this.loadHistory()

      // 添加新快照
      history.snapshots.push(snapshot)

      // 限制快照数量
      if (history.snapshots.length > this.MAX_SNAPSHOTS) {
        history.snapshots = history.snapshots.slice(-this.MAX_SNAPSHOTS)
      }

      history.lastUpdated = Date.now()

      // 保存到文件
      await writeFile(this.historyFile, JSON.stringify(history, null, 2), 'utf-8')

      logger.info(`Saved metrics snapshot (${history.snapshots.length} total)`)
    } catch (error: any) {
      logger.error(`Failed to save metrics snapshot: ${error.message}`)
    }
  }

  /**
   * 加载历史数据
   */
  async loadHistory(): Promise<MetricsHistory> {
    try {
      if (existsSync(this.historyFile)) {
        const data = await readFile(this.historyFile, 'utf-8')
        return JSON.parse(data)
      }
    } catch (error: any) {
      logger.warn(`Failed to load metrics history: ${error.message}`)
    }

    // 返回空历史
    return {
      snapshots: [],
      lastUpdated: Date.now()
    }
  }

  /**
   * 获取指定时间范围的快照
   */
  async getSnapshots(startTime?: number, endTime?: number): Promise<StoredMetrics[]> {
    const history = await this.loadHistory()

    if (!startTime && !endTime) {
      return history.snapshots
    }

    return history.snapshots.filter((snapshot) => {
      if (startTime && snapshot.timestamp < startTime) return false
      if (endTime && snapshot.timestamp > endTime) return false
      return true
    })
  }

  /**
   * 获取最新的快照
   */
  async getLatestSnapshot(): Promise<StoredMetrics | null> {
    const history = await this.loadHistory()
    return history.snapshots.length > 0 ? history.snapshots[history.snapshots.length - 1] : null
  }

  /**
   * 清理过期数据
   */
  async cleanup(retentionDays: number = 7): Promise<void> {
    try {
      const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000
      const history = await this.loadHistory()

      const originalCount = history.snapshots.length
      history.snapshots = history.snapshots.filter((s) => s.timestamp >= cutoff)

      if (history.snapshots.length < originalCount) {
        await writeFile(this.historyFile, JSON.stringify(history, null, 2), 'utf-8')
        logger.info(`Cleaned up ${originalCount - history.snapshots.length} old snapshots`)
      }
    } catch (error: any) {
      logger.error(`Failed to cleanup old metrics: ${error.message}`)
    }
  }

  /**
   * 导出数据（用于备份或分析）
   */
  async exportData(outputPath: string): Promise<void> {
    try {
      const history = await this.loadHistory()
      await writeFile(outputPath, JSON.stringify(history, null, 2), 'utf-8')
      logger.info(`Exported metrics data to ${outputPath}`)
    } catch (error: any) {
      logger.error(`Failed to export metrics data: ${error.message}`)
      throw error
    }
  }

  /**
   * 重置存储
   */
  async reset(): Promise<void> {
    try {
      const emptyHistory: MetricsHistory = {
        snapshots: [],
        lastUpdated: Date.now()
      }
      await writeFile(this.historyFile, JSON.stringify(emptyHistory, null, 2), 'utf-8')
      logger.warn('Metrics storage reset')
    } catch (error: any) {
      logger.error(`Failed to reset metrics storage: ${error.message}`)
    }
  }
}

// 导出单例实例
export const metricsStorage = MetricsStorage.getInstance()
