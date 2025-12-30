/**
 * 日志存储模块
 * 提供内存中的日志存储和查询功能
 */

import {
  MAX_LOGS_PER_MODULE,
  MAX_LOG_MODULES,
  MAX_GLOBAL_LOG_ENTRIES,
  DEFAULT_LOG_QUERY_LIMIT
} from './constants.js'

export interface LogEntry {
  timestamp: number
  level: 'debug' | 'info' | 'warn' | 'error'
  module: string
  message: string
  data?: unknown
}

/**
 * 日志监听器类型
 */
export type LogListener = (entry: LogEntry) => void

/**
 * 日志存储类
 */
class LogStore {
  private logs: Map<string, LogEntry[]> = new Map()
  private maxLogsPerModule = MAX_LOGS_PER_MODULE
  private maxModules = MAX_LOG_MODULES
  private maxGlobalEntries = MAX_GLOBAL_LOG_ENTRIES
  private totalEntries = 0 // 当前总条目数
  private listeners: Set<LogListener> = new Set()

  /**
   * 添加日志条目
   */
  add(module: string, entry: LogEntry): void {
    // 检查模块数量限制
    if (!this.logs.has(module)) {
      if (this.logs.size >= this.maxModules) {
        // 移除最旧的模块
        const oldestModule = this.findOldestModule()
        if (oldestModule) {
          const removedLogs = this.logs.get(oldestModule)
          this.totalEntries -= removedLogs?.length || 0
          this.logs.delete(oldestModule)
        }
      }
      this.logs.set(module, [])
    }

    const moduleLogs = this.logs.get(module)!
    moduleLogs.push(entry)
    this.totalEntries++

    // 触发监听器
    for (const listener of this.listeners) {
      try {
        listener(entry)
      } catch (error) {
        // 忽略监听器错误，避免影响日志记录
      }
    }

    // 保持单模块日志数量在限制内
    if (moduleLogs.length > this.maxLogsPerModule) {
      moduleLogs.shift()
      this.totalEntries--
    }

    // 检查全局日志条目上限
    if (this.totalEntries > this.maxGlobalEntries) {
      this.trimGlobalEntries()
    }
  }

  /**
   * 查找最旧的模块（基于最早的日志条目）
   */
  private findOldestModule(): string | null {
    let oldestModule: string | null = null
    let oldestTimestamp = Infinity

    for (const [module, logs] of this.logs) {
      if (logs.length > 0 && logs[0].timestamp < oldestTimestamp) {
        oldestTimestamp = logs[0].timestamp
        oldestModule = module
      }
    }

    return oldestModule
  }

  /**
   * 裁剪全局日志条目数量
   */
  private trimGlobalEntries(): void {
    const targetEntries = Math.floor(this.maxGlobalEntries * 0.8) // 裁剪到 80%
    
    while (this.totalEntries > targetEntries && this.logs.size > 0) {
      // 从每个模块移除最旧的条目
      for (const [module, logs] of this.logs) {
        if (logs.length > 0 && this.totalEntries > targetEntries) {
          logs.shift()
          this.totalEntries--
        }
        // 如果模块为空，移除模块
        if (logs.length === 0) {
          this.logs.delete(module)
        }
      }
    }
  }

  /**
   * 获取指定模块的日志
   */
  get(module: string, options?: {
    limit?: number
    level?: string
    since?: number
  }): LogEntry[] {
    const moduleLogs = this.logs.get(module) || []
    let filtered = moduleLogs

    // 按时间筛选
    if (options?.since !== undefined) {
      filtered = filtered.filter(log => log.timestamp >= options.since!)
    }

    // 按级别筛选
    if (options?.level) {
      filtered = filtered.filter(log => log.level === options.level)
    }

    // 限制返回数量
    const limit = options?.limit || DEFAULT_LOG_QUERY_LIMIT
    return filtered.slice(-limit)
  }

  /**
   * 获取所有日志
   */
  getAll(options?: {
    limit?: number
    level?: string
    since?: number
  }): LogEntry[] {
    const allLogs: LogEntry[] = []

    for (const moduleLogs of this.logs.values()) {
      allLogs.push(...moduleLogs)
    }

    // 按时间排序
    allLogs.sort((a, b) => a.timestamp - b.timestamp)

    let filtered = allLogs

    // 按时间筛选
    if (options?.since !== undefined) {
      filtered = filtered.filter(log => log.timestamp >= options.since!)
    }

    // 按级别筛选
    if (options?.level) {
      filtered = filtered.filter(log => log.level === options.level)
    }

    // 限制返回数量
    const limit = options?.limit || DEFAULT_LOG_QUERY_LIMIT
    return filtered.slice(-limit)
  }

  /**
   * 清空指定模块的日志
   */
  clear(module: string): void {
    const moduleLogs = this.logs.get(module)
    if (moduleLogs) {
      this.totalEntries -= moduleLogs.length
    }
    this.logs.delete(module)
  }

  /**
   * 清空所有日志
   */
  clearAll(): void {
    this.logs.clear()
    this.totalEntries = 0
  }

  /**
   * 添加日志监听器
   */
  addListener(listener: LogListener): void {
    this.listeners.add(listener)
  }

  /**
   * 移除日志监听器
   */
  removeListener(listener: LogListener): void {
    this.listeners.delete(listener)
  }
}

export const logStore = new LogStore()
