/**
 * 用户反馈存储模块
 * 负责持久化和管理用户反馈数据
 */

import { existsSync, mkdirSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'

import { logger } from '@office-mcp/shared'

/**
 * 反馈类型
 */
export enum FeedbackType {
  FEATURE_REQUEST = 'feature_request', // 功能建议
  BUG_REPORT = 'bug_report', // 错误报告
  USABILITY = 'usability', // 使用体验
  PERFORMANCE = 'performance', // 性能问题
  DOCUMENTATION = 'documentation', // 文档相关
  OTHER = 'other' // 其他
}

/**
 * 反馈优先级
 */
export enum FeedbackPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 反馈状态
 */
export enum FeedbackStatus {
  NEW = 'new', // 新提交
  REVIEWING = 'reviewing', // 审核中
  PLANNED = 'planned', // 已计划
  IN_PROGRESS = 'in_progress', // 进行中
  RESOLVED = 'resolved', // 已解决
  CLOSED = 'closed' // 已关闭
}

/**
 * 反馈项
 */
export interface FeedbackItem {
  id: string
  type: FeedbackType
  title: string
  description: string
  rating?: number // 1-5 星评分
  priority: FeedbackPriority
  status: FeedbackStatus
  tags: string[]
  metadata: {
    toolName?: string // 相关工具名称
    version?: string // 版本信息
    userAgent?: string // 用户代理
    [key: string]: any
  }
  timestamp: number
  updatedAt: number
  resolvedAt?: number
}

/**
 * 反馈统计
 */
export interface FeedbackStats {
  total: number
  byType: Record<FeedbackType, number>
  byStatus: Record<FeedbackStatus, number>
  byPriority: Record<FeedbackPriority, number>
  averageRating: number
  recentCount: number // 最近7天
  resolvedCount: number
  resolutionRate: number // 解决率
}

/**
 * 反馈历史
 */
export interface FeedbackHistory {
  feedbacks: FeedbackItem[]
  lastUpdated: number
  stats: FeedbackStats
}

/**
 * 反馈存储类
 */
export class FeedbackStorage {
  private static instance: FeedbackStorage
  private storageDir: string
  private feedbackFile: string
  private readonly MAX_FEEDBACKS = 1000 // 最多保留 1000 条反馈

  private constructor() {
    this.storageDir = join(process.cwd(), 'data', 'powerpoint-feedback')
    this.feedbackFile = join(this.storageDir, 'feedbacks.json')
    this.ensureStorageDir()
  }

  static getInstance(): FeedbackStorage {
    if (!FeedbackStorage.instance) {
      FeedbackStorage.instance = new FeedbackStorage()
    }
    return FeedbackStorage.instance
  }

  /**
   * 确保存储目录存在（同步创建，避免竞态条件）
   */
  private ensureStorageDir(): void {
    try {
      if (!existsSync(this.storageDir)) {
        mkdirSync(this.storageDir, { recursive: true })
        logger.info(`Created feedback storage directory: ${this.storageDir}`)
      }
    } catch (error: any) {
      logger.error(`Failed to create feedback storage directory: ${error.message}`)
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 添加反馈
   */
  async addFeedback(feedback: Omit<FeedbackItem, 'id' | 'timestamp' | 'updatedAt' | 'status'>): Promise<FeedbackItem> {
    try {
      const newFeedback: FeedbackItem = {
        ...feedback,
        id: this.generateId(),
        status: FeedbackStatus.NEW,
        timestamp: Date.now(),
        updatedAt: Date.now()
      }

      const history = await this.loadHistory()
      history.feedbacks.push(newFeedback)

      // 限制反馈数量
      if (history.feedbacks.length > this.MAX_FEEDBACKS) {
        history.feedbacks = history.feedbacks.slice(-this.MAX_FEEDBACKS)
      }

      history.lastUpdated = Date.now()
      history.stats = this.calculateStats(history.feedbacks)

      await this.saveHistory(history)

      logger.info(`Added new feedback: ${newFeedback.id} (${newFeedback.type})`)
      return newFeedback
    } catch (error: any) {
      logger.error(`Failed to add feedback: ${error.message}`)
      throw error
    }
  }

  /**
   * 更新反馈
   */
  async updateFeedback(
    id: string,
    updates: Partial<Omit<FeedbackItem, 'id' | 'timestamp'>>
  ): Promise<FeedbackItem | null> {
    try {
      const history = await this.loadHistory()
      const index = history.feedbacks.findIndex((f) => f.id === id)

      if (index === -1) {
        logger.warn(`Feedback not found: ${id}`)
        return null
      }

      const updatedFeedback: FeedbackItem = {
        ...history.feedbacks[index],
        ...updates,
        updatedAt: Date.now()
      }

      // 如果状态变为已解决，记录解决时间
      if (updates.status === FeedbackStatus.RESOLVED && !history.feedbacks[index].resolvedAt) {
        updatedFeedback.resolvedAt = Date.now()
      }

      history.feedbacks[index] = updatedFeedback
      history.lastUpdated = Date.now()
      history.stats = this.calculateStats(history.feedbacks)

      await this.saveHistory(history)

      logger.info(`Updated feedback: ${id}`)
      return updatedFeedback
    } catch (error: any) {
      logger.error(`Failed to update feedback: ${error.message}`)
      throw error
    }
  }

  /**
   * 删除反馈
   */
  async deleteFeedback(id: string): Promise<boolean> {
    try {
      const history = await this.loadHistory()
      const originalLength = history.feedbacks.length

      history.feedbacks = history.feedbacks.filter((f) => f.id !== id)

      if (history.feedbacks.length === originalLength) {
        logger.warn(`Feedback not found: ${id}`)
        return false
      }

      history.lastUpdated = Date.now()
      history.stats = this.calculateStats(history.feedbacks)

      await this.saveHistory(history)

      logger.info(`Deleted feedback: ${id}`)
      return true
    } catch (error: any) {
      logger.error(`Failed to delete feedback: ${error.message}`)
      throw error
    }
  }

  /**
   * 获取反馈
   */
  async getFeedback(id: string): Promise<FeedbackItem | null> {
    const history = await this.loadHistory()
    return history.feedbacks.find((f) => f.id === id) || null
  }

  /**
   * 查询反馈
   */
  async queryFeedbacks(filters?: {
    type?: FeedbackType
    status?: FeedbackStatus
    priority?: FeedbackPriority
    tags?: string[]
    startTime?: number
    endTime?: number
    limit?: number
    offset?: number
  }): Promise<{ feedbacks: FeedbackItem[]; total: number }> {
    const history = await this.loadHistory()
    let filtered = [...history.feedbacks]

    // 应用过滤器
    if (filters) {
      if (filters.type) {
        filtered = filtered.filter((f) => f.type === filters.type)
      }
      if (filters.status) {
        filtered = filtered.filter((f) => f.status === filters.status)
      }
      if (filters.priority) {
        filtered = filtered.filter((f) => f.priority === filters.priority)
      }
      if (filters.tags && filters.tags.length > 0) {
        filtered = filtered.filter((f) => filters.tags!.some((tag) => f.tags.includes(tag)))
      }
      if (filters.startTime) {
        filtered = filtered.filter((f) => f.timestamp >= filters.startTime!)
      }
      if (filters.endTime) {
        filtered = filtered.filter((f) => f.timestamp <= filters.endTime!)
      }
    }

    const total = filtered.length

    // 按时间倒序排序
    filtered.sort((a, b) => b.timestamp - a.timestamp)

    // 分页
    if (filters?.offset !== undefined) {
      filtered = filtered.slice(filters.offset)
    }
    if (filters?.limit !== undefined) {
      filtered = filtered.slice(0, filters.limit)
    }

    return { feedbacks: filtered, total }
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<FeedbackStats> {
    const history = await this.loadHistory()
    return history.stats
  }

  /**
   * 加载历史数据
   */
  private async loadHistory(): Promise<FeedbackHistory> {
    try {
      if (existsSync(this.feedbackFile)) {
        const data = await readFile(this.feedbackFile, 'utf-8')
        const history = JSON.parse(data)
        // 确保统计信息是最新的
        history.stats = this.calculateStats(history.feedbacks)
        return history
      }
    } catch (error: any) {
      logger.warn(`Failed to load feedback history: ${error.message}`)
    }

    // 返回空历史
    return {
      feedbacks: [],
      lastUpdated: Date.now(),
      stats: this.calculateStats([])
    }
  }

  /**
   * 保存历史数据
   */
  private async saveHistory(history: FeedbackHistory): Promise<void> {
    await writeFile(this.feedbackFile, JSON.stringify(history, null, 2), 'utf-8')
  }

  /**
   * 计算统计信息
   */
  private calculateStats(feedbacks: FeedbackItem[]): FeedbackStats {
    const stats: FeedbackStats = {
      total: feedbacks.length,
      byType: {} as Record<FeedbackType, number>,
      byStatus: {} as Record<FeedbackStatus, number>,
      byPriority: {} as Record<FeedbackPriority, number>,
      averageRating: 0,
      recentCount: 0,
      resolvedCount: 0,
      resolutionRate: 0
    }

    // 初始化计数器
    Object.values(FeedbackType).forEach((type) => {
      stats.byType[type] = 0
    })
    Object.values(FeedbackStatus).forEach((status) => {
      stats.byStatus[status] = 0
    })
    Object.values(FeedbackPriority).forEach((priority) => {
      stats.byPriority[priority] = 0
    })

    if (feedbacks.length === 0) {
      return stats
    }

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    let totalRating = 0
    let ratingCount = 0

    for (const feedback of feedbacks) {
      // 按类型统计
      stats.byType[feedback.type]++

      // 按状态统计
      stats.byStatus[feedback.status]++

      // 按优先级统计
      stats.byPriority[feedback.priority]++

      // 评分统计
      if (feedback.rating !== undefined) {
        totalRating += feedback.rating
        ratingCount++
      }

      // 最近7天统计
      if (feedback.timestamp >= sevenDaysAgo) {
        stats.recentCount++
      }

      // 已解决统计
      if (feedback.status === FeedbackStatus.RESOLVED || feedback.status === FeedbackStatus.CLOSED) {
        stats.resolvedCount++
      }
    }

    // 计算平均评分
    stats.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0

    // 计算解决率
    stats.resolutionRate = feedbacks.length > 0 ? (stats.resolvedCount / feedbacks.length) * 100 : 0

    return stats
  }

  /**
   * 导出数据
   */
  async exportData(outputPath: string): Promise<void> {
    try {
      const history = await this.loadHistory()
      await writeFile(outputPath, JSON.stringify(history, null, 2), 'utf-8')
      logger.info(`Exported feedback data to ${outputPath}`)
    } catch (error: any) {
      logger.error(`Failed to export feedback data: ${error.message}`)
      throw error
    }
  }

  /**
   * 清理过期数据
   */
  async cleanup(retentionDays: number = 90): Promise<void> {
    try {
      const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000
      const history = await this.loadHistory()

      const originalCount = history.feedbacks.length
      // 只清理已关闭的反馈
      history.feedbacks = history.feedbacks.filter((f) => f.timestamp >= cutoff || f.status !== FeedbackStatus.CLOSED)

      if (history.feedbacks.length < originalCount) {
        history.lastUpdated = Date.now()
        history.stats = this.calculateStats(history.feedbacks)
        await this.saveHistory(history)
        logger.info(`Cleaned up ${originalCount - history.feedbacks.length} old feedbacks`)
      }
    } catch (error: any) {
      logger.error(`Failed to cleanup old feedbacks: ${error.message}`)
    }
  }

  /**
   * 重置存储
   */
  async reset(): Promise<void> {
    try {
      const emptyHistory: FeedbackHistory = {
        feedbacks: [],
        lastUpdated: Date.now(),
        stats: this.calculateStats([])
      }
      await this.saveHistory(emptyHistory)
      logger.warn('Feedback storage reset')
    } catch (error: any) {
      logger.error(`Failed to reset feedback storage: ${error.message}`)
    }
  }
}

// 导出单例实例
export const feedbackStorage = FeedbackStorage.getInstance()
