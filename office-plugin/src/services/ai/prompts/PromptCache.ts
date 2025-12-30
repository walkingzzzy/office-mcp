/**
 * 提示词缓存 - 缓存常用提示词组合，提升性能
 */

import Logger from '../../../utils/logger'
import type { PromptSelectionContext,PromptTemplate } from './types'

const logger = new Logger('PromptCache')

interface CacheEntry {
  systemPrompt: string
  templates: PromptTemplate[]
  timestamp: number
  hitCount: number
}

export class PromptCache {
  private cache = new Map<string, CacheEntry>()
  private maxSize = 100
  private ttl = 5 * 60 * 1000 // 5分钟TTL

  /**
   * 生成缓存键
   */
  private generateCacheKey(context: PromptSelectionContext, requiredLevel: number): string {
    return `${context.selectionType}_${context.userIntent}_${context.toolCount}_${context.hasMultipleTasks}_${requiredLevel}`
  }

  /**
   * 获取缓存的提示词
   */
  getCachedPrompt(context: PromptSelectionContext, requiredLevel: number): string | null {
    const key = this.generateCacheKey(context, requiredLevel)
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // 检查TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    // 更新命中次数
    entry.hitCount++

    logger.debug('Cache hit', { key, hitCount: entry.hitCount })
    return entry.systemPrompt
  }

  /**
   * 设置缓存
   */
  setCachedPrompt(
    context: PromptSelectionContext,
    requiredLevel: number,
    systemPrompt: string,
    templates: PromptTemplate[]
  ): void {
    const key = this.generateCacheKey(context, requiredLevel)

    // LRU淘汰策略
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, {
      systemPrompt,
      templates,
      timestamp: Date.now(),
      hitCount: 1
    })

    logger.debug('Cache set', { key, promptLength: systemPrompt.length })
  }

  /**
   * LRU淘汰策略
   */
  private evictLRU(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      logger.debug('Cache evicted', { key: oldestKey })
    }
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key))

    if (expiredKeys.length > 0) {
      logger.info('Cache cleanup completed', { expiredCount: expiredKeys.length })
    }
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    const totalHits = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hitCount, 0)
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits,
      hitRate: totalHits > 0 ? (totalHits / (totalHits + this.cache.size)) : 0
    }
  }
}