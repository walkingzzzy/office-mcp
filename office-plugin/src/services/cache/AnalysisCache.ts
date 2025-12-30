/**
 * 分析结果缓存服务
 * 用于缓存复杂度检测、意图分析等结果，避免重复计算
 * 
 * @created 2025-12-30 - P0 优化：合并重复的复杂度检测
 */

import type { ComplexityResult } from '../ai/prompts/TaskComplexityDetector'
import Logger from '../../utils/logger'

const logger = new Logger('AnalysisCache')

/** 缓存条目 */
interface CacheEntry<T> {
  result: T
  timestamp: number
}

/**
 * 分析缓存类
 * 提供短期缓存，避免同一请求周期内重复计算
 */
class AnalysisCacheImpl {
  /** 复杂度检测缓存 */
  private complexityCache = new Map<string, CacheEntry<ComplexityResult>>()
  
  /** 意图检测缓存 */
  private intentCache = new Map<string, CacheEntry<string>>()
  
  /** 缓存 TTL（毫秒）- 1秒内复用 */
  private readonly TTL = 1000
  
  /** 最大缓存条目数 */
  private readonly MAX_SIZE = 20

  /**
   * 生成缓存 key
   * 使用输入的前100字符作为 key，避免长文本影响性能
   */
  private generateKey(input: string): string {
    return input.substring(0, 100).trim().toLowerCase()
  }

  /**
   * 清理过期缓存
   */
  private cleanup<T>(cache: Map<string, CacheEntry<T>>): void {
    const now = Date.now()
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        cache.delete(key)
      }
    }
    
    // LRU 淘汰：如果超过最大数量，删除最旧的
    if (cache.size > this.MAX_SIZE) {
      const oldestKey = cache.keys().next().value
      if (oldestKey) {
        cache.delete(oldestKey)
      }
    }
  }

  // ==================== 复杂度检测缓存 ====================

  /**
   * 获取缓存的复杂度检测结果
   */
  getComplexity(input: string): ComplexityResult | null {
    const key = this.generateKey(input)
    const cached = this.complexityCache.get(key)
    
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      logger.debug('[CACHE HIT] 复杂度检测缓存命中', { 
        key: key.substring(0, 30),
        age: `${Date.now() - cached.timestamp}ms`
      })
      return cached.result
    }
    
    return null
  }

  /**
   * 设置复杂度检测缓存
   */
  setComplexity(input: string, result: ComplexityResult): void {
    this.cleanup(this.complexityCache)
    
    const key = this.generateKey(input)
    this.complexityCache.set(key, { 
      result, 
      timestamp: Date.now() 
    })
    
    logger.debug('[CACHE SET] 复杂度检测结果已缓存', { 
      key: key.substring(0, 30),
      complexity: result.complexity
    })
  }

  // ==================== 意图检测缓存 ====================

  /**
   * 获取缓存的意图检测结果
   */
  getIntent(input: string): string | null {
    const key = this.generateKey(input)
    const cached = this.intentCache.get(key)
    
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      logger.debug('[CACHE HIT] 意图检测缓存命中', { 
        key: key.substring(0, 30),
        intent: cached.result
      })
      return cached.result
    }
    
    return null
  }

  /**
   * 设置意图检测缓存
   */
  setIntent(input: string, intent: string): void {
    this.cleanup(this.intentCache)
    
    const key = this.generateKey(input)
    this.intentCache.set(key, { 
      result: intent, 
      timestamp: Date.now() 
    })
    
    logger.debug('[CACHE SET] 意图检测结果已缓存', { 
      key: key.substring(0, 30),
      intent
    })
  }

  // ==================== 工具方法 ====================

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.complexityCache.clear()
    this.intentCache.clear()
    logger.info('[CACHE] 所有分析缓存已清空')
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { complexitySize: number; intentSize: number } {
    return {
      complexitySize: this.complexityCache.size,
      intentSize: this.intentCache.size
    }
  }
}

/** 单例实例 */
export const analysisCache = new AnalysisCacheImpl()

export default analysisCache
