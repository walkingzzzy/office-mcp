/**
 * MCP 工具执行器
 * 负责将工具调用委派给主进程提供的 MCP Server 接口
 *
 * 性能优化：
 * - 本地缓存机制：减少重复读取操作的 IPC 调用
 * - 智能缓存失效：写操作自动失效相关缓存
 * - 动态 TTL 机制：根据工具类型设置不同的缓存时间
 * - 细粒度缓存失效：写操作只失效相关的缓存条目
 * 
 * @updated 2025-12-29 - 优化缓存策略 (修复 P7)
 */

import type { FunctionResult } from './types'

import useConfigStore from '../../store/configStore'
import { mcpApi } from '../api/endpoints/mcp.api'
import Logger from '../../utils/logger'

interface ExecuteOptions {
  serverId?: string
  toolCallId?: string
  messageId?: string
  /** 是否跳过缓存（强制执行） */
  skipCache?: boolean
}

interface CacheEntry {
  result: FunctionResult
  timestamp: number
  toolName: string
  args: Record<string, any>
  /** 动态 TTL，根据工具类型设置 */
  ttl: number
}

const logger = new Logger('McpToolExecutor')

/**
 * 工具类型对应的 TTL 配置（毫秒）
 * - 文档结构类：较长 TTL（15秒），因为结构变化不频繁
 * - 选中内容类：较短 TTL（3秒），因为用户可能频繁改变选择
 * - 数据读取类：中等 TTL（8秒），平衡性能和实时性
 */
const TOOL_TTL_CONFIG: Record<string, number> = {
  // 文档结构 - 15秒
  'word_get_document_structure': 15000,
  'word_get_paragraphs': 15000,
  'excel_get_sheet_names': 15000,
  'ppt_get_slide_count': 15000,
  
  // 选中内容 - 3秒
  'word_get_selected_text': 3000,
  'excel_get_active_cell': 3000,
  'excel_get_selection': 3000,
  
  // 默认 TTL - 8秒
  'default': 8000
}

/**
 * 缓存失效映射：写操作 → 需要失效的读操作模式
 * 实现细粒度缓存失效，避免全量清除
 */
const CACHE_INVALIDATION_MAP: Record<string, RegExp[]> = {
  // Word 写操作
  'word_text': [/^word_get_/, /^word_read/],
  'word_paragraph': [/^word_get_paragraphs/, /^word_get_document_structure/],
  'word_table': [/^word_get_/, /^word_read/],
  'word_image': [/^word_get_document_structure/],
  'word_document': [/^word_/],
  
  // Excel 写操作
  'excel_cell': [/^excel_get_/, /^excel_data/],
  'excel_format': [/^excel_get_/],
  'excel_chart': [/^excel_get_sheet_names/],
  'excel_worksheet': [/^excel_get_sheet_names/, /^excel_get_/],
  
  // PowerPoint 写操作
  'ppt_slide': [/^ppt_get_/, /^ppt_notes/],
  'ppt_shape': [/^ppt_get_/],
  'ppt_media': [/^ppt_get_/]
}

/**
 * 封装 MCP 工具调用的通用逻辑
 */
export class McpToolExecutor {
  /** 缓存存储 */
  private cache: Map<string, CacheEntry> = new Map()

  /** 默认缓存 TTL（毫秒），降低到 8 秒以提升实时性 */
  private defaultCacheTTL: number = 8000

  /** 缓存最大大小 */
  private readonly maxCacheSize: number = 200

  /** 可缓存的工具名称模式（读操作） */
  private cacheablePatterns: RegExp[] = [
    // 旧版工具名模式
    /^word_get_/,
    /^word_read_/,
    /^excel_get_/,
    /^excel_read_/,
    /^ppt_get_/,
    /^ppt_read_/,
    // 🆕 新增：文档结构相关的读取操作
    /^word_get_paragraphs$/,
    /^word_get_document_structure$/,
    /^word_get_selected_text$/,
    /^excel_get_sheet_names$/,
    /^excel_get_active_cell$/,
    /^ppt_get_slide_count$/,
    // 压缩版工具名模式（通过 action 参数判断）
    /^word_read$/,
    /^excel_data$/,  // 数据导入导出
    /^ppt_notes$/    // 备注管理
  ]

  /** 会使缓存失效的工具名称模式（写操作） */
  private invalidationPatterns: RegExp[] = [
    // 旧版工具名模式
    /^word_insert_/,
    /^word_set_/,
    /^word_delete_/,
    /^word_clear_/,
    /^word_save_/,
    /^word_replace_/,
    /^word_format_/,
    /^excel_insert_/,
    /^excel_set_/,
    /^excel_delete_/,
    /^excel_clear_/,
    /^ppt_insert_/,
    /^ppt_set_/,
    /^ppt_delete_/,
    /^ppt_clear_/,
    // 压缩版工具名模式（大部分压缩工具都包含写操作）
    /^word_text$/,
    /^word_paragraph$/,
    /^word_table$/,
    /^word_image$/,
    /^word_document$/,
    /^excel_cell$/,
    /^excel_format$/,
    /^excel_chart$/,
    /^excel_worksheet$/,
    /^ppt_slide$/,
    /^ppt_shape$/,
    /^ppt_media$/
  ]

  /** 缓存命中统计 */
  private cacheStats = {
    hits: 0,
    misses: 0,
    invalidations: 0,
    fineGrainedInvalidations: 0
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(toolName: string, args: Record<string, any>): string {
    return `${toolName}:${JSON.stringify(args)}`
  }

  /**
   * 获取工具的动态 TTL
   * 根据工具类型返回不同的缓存时间
   */
  private getDynamicTTL(toolName: string): number {
    // 精确匹配
    if (TOOL_TTL_CONFIG[toolName]) {
      return TOOL_TTL_CONFIG[toolName]
    }
    
    // 模式匹配：选中内容类工具使用较短 TTL
    if (toolName.includes('selected') || toolName.includes('selection') || toolName.includes('active')) {
      return 3000
    }
    
    // 模式匹配：结构类工具使用较长 TTL
    if (toolName.includes('structure') || toolName.includes('sheet_names') || toolName.includes('slide_count')) {
      return 15000
    }
    
    return this.defaultCacheTTL
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStatistics() {
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0
      ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(1)
      : '0'
    
    return {
      ...this.cacheStats,
      hitRate: `${hitRate}%`,
      cacheSize: this.cache.size,
      maxSize: this.maxCacheSize,
      defaultTTL: this.defaultCacheTTL
    }
  }

  /**
   * 检查工具是否可缓存
   */
  private isCacheable(toolName: string): boolean {
    return this.cacheablePatterns.some(pattern => pattern.test(toolName))
  }

  /**
   * 检查工具是否会使缓存失效
   */
  private shouldInvalidateCache(toolName: string): boolean {
    return this.invalidationPatterns.some(pattern => pattern.test(toolName))
  }

  /**
   * 从缓存获取结果
   */
  private getFromCache(toolName: string, args: Record<string, any>): FunctionResult | null {
    const key = this.getCacheKey(toolName, args)
    const entry = this.cache.get(key)

    if (!entry) {
      this.cacheStats.misses++
      return null
    }

    // 检查是否过期（使用条目自身的 TTL）
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.cacheStats.misses++
      logger.debug('[CACHE] 缓存已过期', { toolName, key, ttl: entry.ttl })
      return null
    }

    this.cacheStats.hits++
    logger.info('[CACHE] 🎯 命中缓存', {
      toolName,
      age: `${now - entry.timestamp}ms`,
      ttl: entry.ttl,
      hitRate: `${(this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(1)}%`
    })

    return entry.result
  }

  /**
   * 保存结果到缓存
   */
  private saveToCache(toolName: string, args: Record<string, any>, result: FunctionResult): void {
    const key = this.getCacheKey(toolName, args)
    const ttl = this.getDynamicTTL(toolName)

    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxCacheSize && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      toolName,
      args,
      ttl
    })

    logger.debug('[CACHE] 保存到缓存', { toolName, key, ttl, cacheSize: this.cache.size })
  }

  /**
   * 使缓存失效（细粒度失效）
   * 根据写操作类型，只失效相关的缓存条目
   */
  private invalidateCache(toolName: string): void {
    // 获取细粒度失效模式
    const invalidationPatterns = CACHE_INVALIDATION_MAP[toolName]
    
    if (invalidationPatterns && invalidationPatterns.length > 0) {
      // 细粒度失效：只失效匹配的缓存条目
      let invalidatedCount = 0
      for (const [key, entry] of this.cache.entries()) {
        const shouldInvalidate = invalidationPatterns.some(pattern => pattern.test(entry.toolName))
        if (shouldInvalidate) {
          this.cache.delete(key)
          invalidatedCount++
        }
      }
      
      if (invalidatedCount > 0) {
        this.cacheStats.fineGrainedInvalidations += invalidatedCount
        logger.info('[CACHE] 🎯 细粒度缓存失效', {
          trigger: toolName,
          patterns: invalidationPatterns.map(p => p.source),
          invalidatedCount,
          remainingSize: this.cache.size
        })
      }
    } else {
      // 回退：根据应用类型失效相关缓存
      const application = toolName.split('_')[0] // word, excel, ppt
      let invalidatedCount = 0

      for (const [key, entry] of this.cache.entries()) {
        if (entry.toolName.startsWith(application)) {
          this.cache.delete(key)
          invalidatedCount++
        }
      }

      if (invalidatedCount > 0) {
        this.cacheStats.invalidations += invalidatedCount
        logger.info('[CACHE] 🗑️ 应用级缓存失效', {
          trigger: toolName,
          application,
          invalidatedCount,
          remainingSize: this.cache.size
        })
      }
    }
  }

  /**
   * 清空所有缓存
   */
  public clearCache(): void {
    const size = this.cache.size
    this.cache.clear()
    logger.info('[CACHE] 清空所有缓存', { clearedCount: size })
  }

  /**
   * 获取缓存统计信息
   */
  public getCacheStats() {
    return {
      size: this.cache.size,
      defaultTTL: this.defaultCacheTTL,
      stats: this.cacheStats,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        toolName: entry.toolName,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl
      }))
    }
  }

  /**
   * 解析要使用的 serverId：优先显式参数 → 启用的 MCP Server → 配置列表首个
   */
  private resolveServerId(explicit?: string): string | null {
    if (explicit) return explicit

    const storeState = useConfigStore.getState()
    const enabledServers = storeState.getEnabledMcpServers?.() ?? []
    if (enabledServers.length > 0) {
      return enabledServers[0].id
    }

    const allServers = storeState.getMcpServers?.() ?? []
    return allServers.length > 0 ? allServers[0].id : null
  }

  /**
   * 执行 MCP 工具（带缓存优化）
   */
  async executeTool(
    toolName: string,
    args: Record<string, any>,
    options?: ExecuteOptions
  ): Promise<FunctionResult> {
    const startTime = Date.now()
    const serverId = this.resolveServerId(options?.serverId)

    if (!serverId) {
      const error = new Error('未找到可用的 MCP 服务器，请在设置中启用后重试')
      logger.error('No MCP server available for tool execution', { toolName })
      return {
        success: false,
        message: error.message,
        error,
        executionTime: Date.now() - startTime
      }
    }

    // 检查缓存（仅对读操作）
    if (!options?.skipCache && this.isCacheable(toolName)) {
      const cachedResult = this.getFromCache(toolName, args)
      if (cachedResult) {
        return {
          ...cachedResult,
          executionTime: Date.now() - startTime,
          fromCache: true
        } as FunctionResult
      }
    }

    logger.info('[MCP_TOOL_EXECUTOR] 🚀 准备执行工具', {
      serverId,
      toolName,
      toolCallId: options?.toolCallId,
      messageId: options?.messageId,
      cacheable: this.isCacheable(toolName)
    })

    try {
      const result = await mcpApi.callMCPTool(serverId, toolName, args ?? {})
      const executionTime = Date.now() - startTime

      logger.info('[MCP_TOOL_EXECUTOR] ✅ 工具执行完成', {
        serverId,
        toolName,
        executionTime,
        toolCallId: options?.toolCallId
      })

      const functionResult: FunctionResult = {
        success: true,
        message: 'MCP 工具执行成功',
        data: result,
        executionTime
      }

      // 保存到缓存（仅对读操作）
      if (this.isCacheable(toolName)) {
        this.saveToCache(toolName, args, functionResult)
      }

      // 使缓存失效（对写操作）
      if (this.shouldInvalidateCache(toolName)) {
        this.invalidateCache(toolName)
      }

      return functionResult
    } catch (error: unknown) {
      const err = error as Error
      const executionTime = Date.now() - startTime
      logger.error('[MCP_TOOL_EXECUTOR] ❌ 工具执行失败', {
        serverId,
        toolName,
        toolCallId: options?.toolCallId,
        error: err?.message || String(error)
      })

      return {
        success: false,
        message: err?.message || 'MCP 工具执行失败',
        error: error instanceof Error ? error : new Error(String(error)),
        executionTime
      }
    }
  }
}

/**
 * 导出单例实例
 */
export const mcpToolExecutor = new McpToolExecutor()
