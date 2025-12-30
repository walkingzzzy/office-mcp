/**
 * 配置缓存服务
 * 提供配置的内存缓存和持久化缓存
 */

/**
 * 缓存项
 */
interface CacheItem<T> {
  value: T
  timestamp: number
  ttl: number
}

/**
 * 缓存选项
 */
interface CacheOptions {
  ttl?: number // 过期时间（毫秒）
  persist?: boolean // 是否持久化
}

const DEFAULT_TTL = 5 * 60 * 1000 // 5 分钟

/**
 * 配置缓存类
 */
class ConfigCacheImpl {
  private memoryCache: Map<string, CacheItem<unknown>> = new Map()
  private storagePrefix = 'config_cache_'
  private readonly maxCacheSize: number = 100

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    // 先检查内存缓存
    const memoryItem = this.memoryCache.get(key) as CacheItem<T> | undefined
    if (memoryItem) {
      if (this.isValid(memoryItem)) {
        return memoryItem.value
      }
      this.memoryCache.delete(key)
    }

    // 检查持久化缓存
    try {
      const stored = localStorage.getItem(this.storagePrefix + key)
      if (stored) {
        const item = JSON.parse(stored) as CacheItem<T>
        if (this.isValid(item)) {
          // 恢复到内存缓存
          this.memoryCache.set(key, item)
          return item.value
        }
        localStorage.removeItem(this.storagePrefix + key)
      }
    } catch {
      // 忽略存储错误
    }

    return null
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const { ttl = DEFAULT_TTL, persist = false } = options

    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      ttl
    }

    // 如果缓存已满，删除最旧的条目
    if (this.memoryCache.size >= this.maxCacheSize && !this.memoryCache.has(key)) {
      const oldestKey = this.memoryCache.keys().next().value
      if (oldestKey) {
        this.memoryCache.delete(oldestKey)
      }
    }

    this.memoryCache.set(key, item)

    if (persist) {
      try {
        localStorage.setItem(this.storagePrefix + key, JSON.stringify(item))
      } catch {
        // 忽略存储错误
      }
    }
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.memoryCache.delete(key)
    try {
      localStorage.removeItem(this.storagePrefix + key)
    } catch {
      // 忽略存储错误
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.memoryCache.clear()

    try {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith(this.storagePrefix)) {
          localStorage.removeItem(key)
        }
      }
    } catch {
      // 忽略存储错误
    }
  }

  /**
   * 检查缓存是否有效
   */
  private isValid<T>(item: CacheItem<T>): boolean {
    return Date.now() - item.timestamp < item.ttl
  }

  /**
   * 获取或设置缓存（带回调）
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const value = await fetchFn()
    this.set(key, value, options)
    return value
  }

  /**
   * 使缓存失效
   */
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.clear()
      return
    }

    const regex = new RegExp(pattern)

    // 清除内存缓存
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key)
      }
    }

    // 清除持久化缓存
    try {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith(this.storagePrefix)) {
          const cacheKey = key.slice(this.storagePrefix.length)
          if (regex.test(cacheKey)) {
            localStorage.removeItem(key)
          }
        }
      }
    } catch {
      // 忽略存储错误
    }
  }
}

export const configCache = new ConfigCacheImpl()
export default configCache
