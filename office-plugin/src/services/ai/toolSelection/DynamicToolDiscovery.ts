/**
 * 动态工具发现服务
 *
 * 从主应用的 API 动态获取可用的 MCP 工具列表
 * 替代硬编码的 MCP_POC_TOOLS 列表
 */

import Logger from '../../../utils/logger'

const logger = new Logger('DynamicToolDiscovery')

export interface ToolDefinition {
  name: string
  description: string
  category?: string
  inputSchema: Record<string, unknown>
  metadata?: {
    scenario?: string
    contextTip?: string
    intentKeywords?: string[]
    applicableFor?: Array<'text' | 'image' | 'table' | 'none'>
    documentTypes?: Array<'word' | 'excel' | 'powerpoint'>
    priority?: 'P0' | 'P1' | 'P2'
    tags?: string[]
  }
}

export interface ToolsResponse {
  success: boolean
  data?: {
    tools: ToolDefinition[]
    stats: {
      total: number
      byType: {
        browser: number
        server: number
      }
      byCategory: {
        word: number
        excel: number
        powerpoint: number
      }
    }
    timestamp: string
  }
  error?: {
    message: string
    type: string
    code: string
  }
}

/**
 * 动态工具发现服务类
 */
export class DynamicToolDiscovery {
  private apiHost: string = ''
  private apiKey: string = ''
  private cachedTools: ToolDefinition[] = []
  private cacheTimestamp: number = 0
  private cacheTTL: number = 5 * 60 * 1000 // 5 分钟缓存

  /**
   * 配置 API 连接信息
   */
  configure(apiHost: string, apiKey: string): void {
    this.apiHost = apiHost
    this.apiKey = apiKey
    logger.info('Dynamic tool discovery configured', { apiHost })
  }

  /**
   * 获取可用工具列表
   * @param type 工具类型过滤 (browser, server, all)
   * @param category 工具类别过滤 (word, excel, powerpoint, common)
   * @param forceRefresh 强制刷新缓存
   */
  async getAvailableTools(
    type: 'browser' | 'server' | 'all' = 'all',
    category?: string,
    forceRefresh: boolean = false
  ): Promise<ToolDefinition[]> {
    // 检查缓存
    if (!forceRefresh && this.isCacheValid()) {
      logger.debug('Returning cached tools', { count: this.cachedTools.length })
      return this.filterTools(this.cachedTools, type, category)
    }

    if (!this.apiHost || !this.apiKey) {
      logger.warn('API not configured, returning empty tools list')
      return []
    }

    try {
      logger.info('Fetching tools from API', { type, category })

      const url = new URL('/v1/office/tools', this.apiHost)
      if (type !== 'all') {
        url.searchParams.set('type', type)
      }
      if (category) {
        url.searchParams.set('category', category)
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: ToolsResponse = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to fetch tools')
      }

      // 更新缓存
      this.cachedTools = result.data.tools
      this.cacheTimestamp = Date.now()

      logger.info('Tools fetched successfully', {
        total: result.data.stats.total,
        browser: result.data.stats.byType.browser,
        server: result.data.stats.byType.server
      })

      return result.data.tools
    } catch (error: unknown) {
      const err = error as Error
      logger.error('Failed to fetch tools from API', { error: err.message })

      // 如果有缓存，返回缓存的工具（即使过期）
      if (this.cachedTools.length > 0) {
        logger.warn('Returning stale cached tools due to API error')
        return this.filterTools(this.cachedTools, type, category)
      }

      return []
    }
  }

  /**
   * 获取浏览器端工具（POC 工具）
   */
  async getBrowserTools(category?: string): Promise<ToolDefinition[]> {
    return this.getAvailableTools('browser', category)
  }

  /**
   * 获取服务器端工具
   */
  async getServerTools(category?: string): Promise<ToolDefinition[]> {
    return this.getAvailableTools('server', category)
  }

  /**
   * 检查工具是否存在
   */
  async hasTool(toolName: string): Promise<boolean> {
    const tools = await this.getAvailableTools()
    return tools.some((tool) => tool.name === toolName)
  }

  /**
   * 获取工具定义
   */
  async getToolDefinition(toolName: string): Promise<ToolDefinition | undefined> {
    const tools = await this.getAvailableTools()
    return tools.find((tool) => tool.name === toolName)
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cachedTools = []
    this.cacheTimestamp = 0
    logger.debug('Tool cache cleared')
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(): boolean {
    if (this.cachedTools.length === 0) {
      return false
    }

    const age = Date.now() - this.cacheTimestamp
    return age < this.cacheTTL
  }

  /**
   * 过滤工具列表
   */
  private filterTools(
    tools: ToolDefinition[],
    type: 'browser' | 'server' | 'all',
    category?: string
  ): ToolDefinition[] {
    let filtered = tools

    // 按类型过滤
    if (type !== 'all') {
      if (type === 'browser') {
        filtered = filtered.filter((tool) => tool.name.endsWith('_browser'))
      } else if (type === 'server') {
        filtered = filtered.filter((tool) => !tool.name.endsWith('_browser'))
      }
    }

    // 按类别过滤
    if (category) {
      filtered = filtered.filter((tool) => {
        const toolName = tool.name.toLowerCase()
        if (toolName.startsWith('word_')) return category === 'word'
        if (toolName.startsWith('excel_')) return category === 'excel'
        if (toolName.startsWith('ppt_')) return category === 'powerpoint'
        return category === 'common'
      })
    }

    return filtered
  }

  /**
   * 获取工具统计信息
   */
  async getToolStats(): Promise<{
    total: number
    browser: number
    server: number
    byCategory: Record<string, number>
  }> {
    const tools = await this.getAvailableTools()

    const stats = {
      total: tools.length,
      browser: tools.filter((t) => t.name.endsWith('_browser')).length,
      server: tools.filter((t) => !t.name.endsWith('_browser')).length,
      byCategory: {} as Record<string, number>
    }

    // 统计各类别工具数量
    tools.forEach((tool) => {
      const category = tool.category || 'common'
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1
    })

    return stats
  }
}

// 导出单例
export const dynamicToolDiscovery = new DynamicToolDiscovery()
