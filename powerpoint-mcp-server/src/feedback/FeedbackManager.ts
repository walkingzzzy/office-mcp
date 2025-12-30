/**
 * 反馈管理器
 * 提供反馈收集和管理的高级接口
 */

import { logger } from '@office-mcp/shared'
import {
  FeedbackItem,
  FeedbackPriority,
  FeedbackStats,
  FeedbackStatus,
  FeedbackStorage,
  FeedbackType
} from './FeedbackStorage.js'

export interface CreateFeedbackInput {
  type: FeedbackType
  title: string
  description: string
  rating?: number
  priority?: FeedbackPriority
  tags?: string[]
  metadata?: Record<string, any>
}

export interface UpdateFeedbackInput {
  title?: string
  description?: string
  rating?: number
  priority?: FeedbackPriority
  status?: FeedbackStatus
  tags?: string[]
  metadata?: Record<string, any>
}

export interface FeedbackQueryOptions {
  type?: FeedbackType
  status?: FeedbackStatus
  priority?: FeedbackPriority
  tags?: string[]
  startTime?: number
  endTime?: number
  limit?: number
  offset?: number
}

/**
 * 反馈管理器类
 */
export class FeedbackManager {
  private static instance: FeedbackManager
  private storage: FeedbackStorage

  private constructor() {
    this.storage = FeedbackStorage.getInstance()
    logger.info('Feedback manager initialized')
  }

  static getInstance(): FeedbackManager {
    if (!FeedbackManager.instance) {
      FeedbackManager.instance = new FeedbackManager()
    }
    return FeedbackManager.instance
  }

  /**
   * 创建反馈
   */
  async createFeedback(input: CreateFeedbackInput): Promise<FeedbackItem> {
    // 验证输入
    this.validateFeedbackInput(input)

    const feedback = await this.storage.addFeedback({
      type: input.type,
      title: input.title.trim(),
      description: input.description.trim(),
      rating: input.rating,
      priority: input.priority || FeedbackPriority.MEDIUM,
      tags: input.tags || [],
      metadata: input.metadata || {}
    })

    logger.info(`Feedback created: ${feedback.id}`)
    return feedback
  }

  /**
   * 更新反馈
   */
  async updateFeedback(id: string, input: UpdateFeedbackInput): Promise<FeedbackItem | null> {
    const feedback = await this.storage.updateFeedback(id, input)

    if (feedback) {
      logger.info(`Feedback updated: ${id}`)
    }

    return feedback
  }

  /**
   * 删除反馈
   */
  async deleteFeedback(id: string): Promise<boolean> {
    return await this.storage.deleteFeedback(id)
  }

  /**
   * 获取反馈
   */
  async getFeedback(id: string): Promise<FeedbackItem | null> {
    return await this.storage.getFeedback(id)
  }

  /**
   * 查询反馈
   */
  async queryFeedbacks(options?: FeedbackQueryOptions): Promise<{ feedbacks: FeedbackItem[]; total: number }> {
    return await this.storage.queryFeedbacks(options)
  }

  /**
   * 获取最近的反馈
   */
  async getRecentFeedbacks(limit: number = 10): Promise<FeedbackItem[]> {
    const result = await this.storage.queryFeedbacks({ limit })
    return result.feedbacks
  }

  /**
   * 获取待处理的反馈
   */
  async getPendingFeedbacks(limit?: number): Promise<FeedbackItem[]> {
    const result = await this.storage.queryFeedbacks({
      status: FeedbackStatus.NEW,
      limit
    })
    return result.feedbacks
  }

  /**
   * 获取高优先级反馈
   */
  async getHighPriorityFeedbacks(limit?: number): Promise<FeedbackItem[]> {
    const result = await this.storage.queryFeedbacks({
      priority: FeedbackPriority.HIGH,
      limit
    })
    return result.feedbacks
  }

  /**
   * 按类型获取反馈
   */
  async getFeedbacksByType(type: FeedbackType, limit?: number): Promise<FeedbackItem[]> {
    const result = await this.storage.queryFeedbacks({ type, limit })
    return result.feedbacks
  }

  /**
   * 按标签获取反馈
   */
  async getFeedbacksByTags(tags: string[], limit?: number): Promise<FeedbackItem[]> {
    const result = await this.storage.queryFeedbacks({ tags, limit })
    return result.feedbacks
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<FeedbackStats> {
    return await this.storage.getStats()
  }

  /**
   * 标记反馈为已审核
   */
  async markAsReviewing(id: string): Promise<FeedbackItem | null> {
    return await this.storage.updateFeedback(id, {
      status: FeedbackStatus.REVIEWING
    })
  }

  /**
   * 标记反馈为已计划
   */
  async markAsPlanned(id: string): Promise<FeedbackItem | null> {
    return await this.storage.updateFeedback(id, {
      status: FeedbackStatus.PLANNED
    })
  }

  /**
   * 标记反馈为进行中
   */
  async markAsInProgress(id: string): Promise<FeedbackItem | null> {
    return await this.storage.updateFeedback(id, {
      status: FeedbackStatus.IN_PROGRESS
    })
  }

  /**
   * 标记反馈为已解决
   */
  async markAsResolved(id: string): Promise<FeedbackItem | null> {
    return await this.storage.updateFeedback(id, {
      status: FeedbackStatus.RESOLVED
    })
  }

  /**
   * 关闭反馈
   */
  async closeFeedback(id: string): Promise<FeedbackItem | null> {
    return await this.storage.updateFeedback(id, {
      status: FeedbackStatus.CLOSED
    })
  }

  /**
   * 更新反馈优先级
   */
  async updatePriority(id: string, priority: FeedbackPriority): Promise<FeedbackItem | null> {
    return await this.storage.updateFeedback(id, { priority })
  }

  /**
   * 添加标签
   */
  async addTags(id: string, tags: string[]): Promise<FeedbackItem | null> {
    const feedback = await this.storage.getFeedback(id)
    if (!feedback) return null

    const newTags = [...new Set([...feedback.tags, ...tags])]
    return await this.storage.updateFeedback(id, { tags: newTags })
  }

  /**
   * 移除标签
   */
  async removeTags(id: string, tags: string[]): Promise<FeedbackItem | null> {
    const feedback = await this.storage.getFeedback(id)
    if (!feedback) return null

    const newTags = feedback.tags.filter((tag) => !tags.includes(tag))
    return await this.storage.updateFeedback(id, { tags: newTags })
  }

  /**
   * 导出反馈数据
   */
  async exportFeedbacks(outputPath: string): Promise<void> {
    await this.storage.exportData(outputPath)
  }

  /**
   * 清理过期反馈
   */
  async cleanup(retentionDays: number = 90): Promise<void> {
    await this.storage.cleanup(retentionDays)
  }

  /**
   * 验证反馈输入
   */
  private validateFeedbackInput(input: CreateFeedbackInput): void {
    if (!input.title || input.title.trim().length === 0) {
      throw new Error('Feedback title is required')
    }

    if (input.title.length > 200) {
      throw new Error('Feedback title is too long (max 200 characters)')
    }

    if (!input.description || input.description.trim().length === 0) {
      throw new Error('Feedback description is required')
    }

    if (input.description.length > 5000) {
      throw new Error('Feedback description is too long (max 5000 characters)')
    }

    if (input.rating !== undefined && (input.rating < 1 || input.rating > 5)) {
      throw new Error('Feedback rating must be between 1 and 5')
    }

    if (!Object.values(FeedbackType).includes(input.type)) {
      throw new Error('Invalid feedback type')
    }

    if (input.priority && !Object.values(FeedbackPriority).includes(input.priority)) {
      throw new Error('Invalid feedback priority')
    }
  }

  /**
   * 获取反馈趋势（按天统计）
   */
  async getFeedbackTrend(days: number = 30): Promise<
    Array<{
      date: string
      count: number
      byType: Record<FeedbackType, number>
    }>
  > {
    const startTime = Date.now() - days * 24 * 60 * 60 * 1000
    const result = await this.storage.queryFeedbacks({ startTime })

    // 按天分组
    const trendMap = new Map<
      string,
      {
        count: number
        byType: Record<FeedbackType, number>
      }
    >()

    for (const feedback of result.feedbacks) {
      const date = new Date(feedback.timestamp).toISOString().split('T')[0]

      if (!trendMap.has(date)) {
        trendMap.set(date, {
          count: 0,
          byType: {} as Record<FeedbackType, number>
        })
      }

      const trend = trendMap.get(date)!
      trend.count++
      trend.byType[feedback.type] = (trend.byType[feedback.type] || 0) + 1
    }

    // 转换为数组并排序
    return Array.from(trendMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * 获取热门标签
   */
  async getPopularTags(limit: number = 10): Promise<Array<{ tag: string; count: number }>> {
    const result = await this.storage.queryFeedbacks({})
    const tagCounts = new Map<string, number>()

    for (const feedback of result.feedbacks) {
      for (const tag of feedback.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      }
    }

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }
}

// 导出单例实例
export const feedbackManager = FeedbackManager.getInstance()
