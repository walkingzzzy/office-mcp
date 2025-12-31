/**
 * ToolCache
 * 记录最近使用的工具,用于在下一轮候选工具中提高命中率
 */

import Logger from '../../../utils/logger'

export interface ToolUsageEntry {
  name: string
  lastUsedAt: number
  count: number
}

const logger = new Logger('ToolCache')

export class ToolCache {
  private readonly usage = new Map<string, ToolUsageEntry>()
  private readonly maxEntries: number

  constructor(maxEntries = 50) {
    this.maxEntries = maxEntries
  }

  /**
   * 记录一次工具调用
   */
  recordToolUse(name: string): void {
    if (!name) return

    const now = Date.now()
    const existing = this.usage.get(name)

    if (existing) {
      existing.lastUsedAt = now
      existing.count += 1
      this.usage.set(name, existing)
    } else {
      this.usage.set(name, {
        name,
        lastUsedAt: now,
        count: 1
      })
    }

    this.trim()
    logger.debug('Tool usage recorded', { name })
  }

  /**
   * 获取最近使用的工具
   */
  getRecentTools(maxCount = 5): ToolUsageEntry[] {
    if (this.usage.size === 0) return []

    return Array.from(this.usage.values())
      .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
      .slice(0, maxCount)
  }

  /**
   * 获取某个工具的调用次数
   */
  getUsage(name: string): ToolUsageEntry | undefined {
    return this.usage.get(name)
  }

  /**
   * 清空数据(用于测试)
   */
  clear(): void {
    this.usage.clear()
  }

  private trim(): void {
    if (this.usage.size <= this.maxEntries) return

    const sorted = Array.from(this.usage.values()).sort((a, b) => b.lastUsedAt - a.lastUsedAt)
    const keepSet = new Set(sorted.slice(0, this.maxEntries).map(entry => entry.name))

    Array.from(this.usage.keys()).forEach(name => {
      if (!keepSet.has(name)) {
        this.usage.delete(name)
      }
    })
  }
}

let toolCacheInstance: ToolCache | null = null

export function getToolCache(): ToolCache {
  if (!toolCacheInstance) {
    toolCacheInstance = new ToolCache()
  }
  return toolCacheInstance
}

export function resetToolCache(): void {
  toolCacheInstance?.clear()
  toolCacheInstance = null
}
