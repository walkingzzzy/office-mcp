/**
 * MCP 工具定义缓存服务
 * 
 * 功能：
 * - 缓存 MCP 工具定义，避免每次组件挂载时重新获取
 * - 支持 TTL 过期机制
 * - 支持版本控制和手动失效
 * 
 * @created 2025-12-29 - 修复 P5: MCP 工具同步优化
 */

import type { ToolDefinition } from './DynamicToolDiscovery'
import Logger from '../../utils/logger'

const logger = new Logger('ToolDefinitionCache')

/** 缓存条目接口 */
interface ToolCacheEntry {
  /** 工具定义列表 */
  tools: ToolDefinition[]
  /** 缓存时间戳 */
  timestamp: number
  /** 缓存版本（用于强制失效） */
  version: string
  /** 服务器配置哈希（baseUrl + 部分 apiKey） */
  configHash: string
}

/** 缓存统计信息 */
interface CacheStats {
  hits: number
  misses: number
  invalidations: number
  lastHitTime: number | null
  lastMissTime: number | null
}

/** 当前缓存版本 - 修改此值可强制所有客户端刷新缓存 */
const CACHE_VERSION = '1.0.0'

/** 缓存存储键 */
const CACHE_STORAGE_KEY = 'mcp_tool_definitions_cache'

/**
 * MCP 工具定义缓存类
 * 使用单例模式，确保全局共享缓存状态
 */
class ToolDefinitionCacheImpl {
  /** 内存缓存（优先使用，比 localStorage 更快） */
  private memoryCache: ToolCacheEntry | null = null
  
  /** 缓存 TTL（毫秒）- 默认 30 分钟（工具定义变化不频繁） */
  private readonly cacheTTL: number = 30 * 60 * 1000
  
  /** 缓存统计 */
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    invalidations: 0,
    lastHitTime: null,
    lastMissTime: null
  }

  constructor() {
    // 尝试从 localStorage 恢复缓存
    this.loadFromStorage()
  }

  /**
   * 生成配置哈希
   * 用于检测服务器配置是否变更
   */
  private generateConfigHash(baseUrl: string, apiKey: string): string {
    // 只使用 apiKey 的前8位，避免存储完整密钥
    const keyPrefix = apiKey ? apiKey.substring(0, 8) : 'no-key'
    return `${baseUrl}:${keyPrefix}`
  }

  /**
   * 从 localStorage 加载缓存
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(CACHE_STORAGE_KEY)
      if (stored) {
        const entry = JSON.parse(stored) as ToolCacheEntry
        // 验证版本
        if (entry.version === CACHE_VERSION) {
          this.memoryCache = entry
          logger.debug('[CACHE] 从 localStorage 恢复缓存', {
            toolCount: entry.tools.length,
            age: `${Math.round((Date.now() - entry.timestamp) / 1000)}s`
          })
        } else {
          logger.info('[CACHE] 缓存版本不匹配，清除旧缓存', {
            stored: entry.version,
            current: CACHE_VERSION
          })
          localStorage.removeItem(CACHE_STORAGE_KEY)
        }
      }
    } catch (error) {
      logger.warn('[CACHE] 加载缓存失败', { error })
    }
  }

  /**
   * 保存缓存到 localStorage
   */
  private saveToStorage(entry: ToolCacheEntry): void {
    try {
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entry))
    } catch (error) {
      logger.warn('[CACHE] 保存缓存到 localStorage 失败', { error })
    }
  }

  /**
   * 检查缓存是否有效
   * @param baseUrl 当前服务器 URL
   * @param apiKey 当前 API Key
   */
  isValid(baseUrl: string, apiKey: string): boolean {
    if (!this.memoryCache) {
      return false
    }

    const now = Date.now()
    const age = now - this.memoryCache.timestamp

    // 检查 TTL
    if (age > this.cacheTTL) {
      logger.debug('[CACHE] 缓存已过期', { age: `${Math.round(age / 1000)}s`, ttl: `${this.cacheTTL / 1000}s` })
      return false
    }

    // 检查配置是否变更
    const currentHash = this.generateConfigHash(baseUrl, apiKey)
    if (this.memoryCache.configHash !== currentHash) {
      logger.debug('[CACHE] 配置已变更，缓存失效', {
        cached: this.memoryCache.configHash,
        current: currentHash
      })
      return false
    }

    return true
  }

  /**
   * 获取缓存的工具定义
   * @param baseUrl 当前服务器 URL
   * @param apiKey 当前 API Key
   * @returns 工具定义列表，如果缓存无效则返回 null
   */
  getTools(baseUrl: string, apiKey: string): ToolDefinition[] | null {
    if (!this.isValid(baseUrl, apiKey)) {
      this.stats.misses++
      this.stats.lastMissTime = Date.now()
      return null
    }

    this.stats.hits++
    this.stats.lastHitTime = Date.now()

    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) * 100
    logger.info('[CACHE] 🎯 命中工具定义缓存', {
      toolCount: this.memoryCache!.tools.length,
      age: `${Math.round((Date.now() - this.memoryCache!.timestamp) / 1000)}s`,
      hitRate: `${hitRate.toFixed(1)}%`
    })

    return this.memoryCache!.tools
  }

  /**
   * 设置/更新缓存
   * @param tools 工具定义列表
   * @param baseUrl 服务器 URL
   * @param apiKey API Key
   */
  setTools(tools: ToolDefinition[], baseUrl: string, apiKey: string): void {
    const entry: ToolCacheEntry = {
      tools,
      timestamp: Date.now(),
      version: CACHE_VERSION,
      configHash: this.generateConfigHash(baseUrl, apiKey)
    }

    this.memoryCache = entry
    this.saveToStorage(entry)

    logger.info('[CACHE] 已缓存工具定义', {
      toolCount: tools.length,
      configHash: entry.configHash
    })
  }

  /**
   * 手动失效缓存
   * 用于服务器重启、用户手动刷新等场景
   */
  invalidate(): void {
    this.memoryCache = null
    localStorage.removeItem(CACHE_STORAGE_KEY)
    this.stats.invalidations++
    logger.info('[CACHE] 缓存已手动失效')
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats & { cacheAge: number | null; toolCount: number } {
    return {
      ...this.stats,
      cacheAge: this.memoryCache ? Date.now() - this.memoryCache.timestamp : null,
      toolCount: this.memoryCache?.tools.length ?? 0
    }
  }

  /**
   * 获取缓存 TTL（毫秒）
   */
  getTTL(): number {
    return this.cacheTTL
  }
}

/** 单例实例 */
export const toolDefinitionCache = new ToolDefinitionCacheImpl()

/** 导出类型供外部使用 */
export type { ToolCacheEntry, CacheStats }
