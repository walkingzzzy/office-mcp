/**
 * 选区上下文缓存服务
 * 缓存 Office 应用的选区状态，避免重复调用 Office.js API
 * 
 * @created 2025-12-30 - P1 优化：选区上下文缓存
 */

import type { SelectionContext } from '../ai/types'
import type { OfficeAppType } from '../ai/SelectionContextProvider'
import Logger from '../../utils/logger'

const logger = new Logger('SelectionContextCache')

/** 缓存条目 */
interface CacheEntry {
  context: SelectionContext
  timestamp: number
  appType: OfficeAppType
}

/**
 * 选区上下文缓存类
 */
class SelectionContextCacheImpl {
  /** 缓存数据 */
  private cache: CacheEntry | null = null
  
  /** 缓存 TTL（毫秒）- 2秒 */
  private readonly TTL = 2000

  /**
   * 获取缓存的选区上下文
   * @returns 缓存的上下文，如果缓存无效则返回 null
   */
  get(appType: OfficeAppType): SelectionContext | null {
    if (!this.cache) {
      return null
    }
    
    const now = Date.now()
    const age = now - this.cache.timestamp
    
    // 检查 TTL 和应用类型
    if (age > this.TTL || this.cache.appType !== appType) {
      logger.debug('[CACHE MISS] 选区上下文缓存过期或应用类型不匹配', {
        age: `${age}ms`,
        cachedApp: this.cache.appType,
        requestedApp: appType
      })
      return null
    }
    
    logger.debug('[CACHE HIT] 选区上下文缓存命中', {
      age: `${age}ms`,
      appType,
      selectionType: this.cache.context.selectionType
    })
    
    return this.cache.context
  }

  /**
   * 设置选区上下文缓存
   */
  set(appType: OfficeAppType, context: SelectionContext): void {
    this.cache = {
      context,
      timestamp: Date.now(),
      appType
    }
    
    logger.debug('[CACHE SET] 选区上下文已缓存', {
      appType,
      selectionType: context.selectionType,
      hasSelection: context.hasSelection
    })
  }

  /**
   * 检查缓存是否有效
   */
  isValid(appType: OfficeAppType): boolean {
    if (!this.cache) return false
    if (this.cache.appType !== appType) return false
    return (Date.now() - this.cache.timestamp) < this.TTL
  }

  /**
   * 使缓存失效
   */
  invalidate(): void {
    this.cache = null
    logger.debug('[CACHE] 选区上下文缓存已失效')
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    hasCache: boolean
    cacheAge: number | null
    appType: OfficeAppType | null
    selectionType: string | null
  } {
    if (!this.cache) {
      return {
        hasCache: false,
        cacheAge: null,
        appType: null,
        selectionType: null
      }
    }
    
    return {
      hasCache: true,
      cacheAge: Date.now() - this.cache.timestamp,
      appType: this.cache.appType,
      selectionType: this.cache.context.selectionType
    }
  }
}

/** 单例实例 */
export const selectionContextCache = new SelectionContextCacheImpl()

export default selectionContextCache
