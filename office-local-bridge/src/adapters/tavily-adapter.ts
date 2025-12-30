/**
 * Tavily 网络搜索适配器
 * 实现与 Tavily Search API 的集成
 */

import type {
  WebSearchAdapter,
  TavilyAdapterConfig,
  WebSearchOptions
} from './types.js'
import type { SearchResult } from '../types/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('TavilyAdapter')

/**
 * Tavily API 响应类型定义
 */
interface TavilySearchResult {
  title: string
  url: string
  content: string
  score: number
  published_date?: string
}

interface TavilySearchResponse {
  query: string
  results: TavilySearchResult[]
  response_time: number
}

/**
 * Tavily 网络搜索适配器实现
 */
export class TavilyAdapter implements WebSearchAdapter {
  readonly name = 'Tavily'
  private config: TavilyAdapterConfig
  private readonly apiEndpoint = 'https://api.tavily.com'

  constructor(config: TavilyAdapterConfig) {
    this.config = config
  }

  /**
   * 测试连接是否有效
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // 使用简单查询测试 API 连接
      await this.search('test', { maxResults: 1 })
      return {
        success: true,
        message: '连接成功'
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误'
      logger.error('Tavily 连接测试失败', { error: message })
      return {
        success: false,
        message: `连接失败: ${message}`
      }
    }
  }

  /**
   * 执行网络搜索
   */
  async search(
    query: string,
    options?: WebSearchOptions
  ): Promise<SearchResult[]> {
    try {
      const requestBody: Record<string, unknown> = {
        api_key: this.config.apiKey,
        query,
        max_results: options?.maxResults || 5,
        search_depth: options?.searchDepth || 'basic',
        include_images: options?.includeImages || false,
        include_domains: options?.includeDomains || [],
        exclude_domains: options?.excludeDomains || []
      }

      // 添加 region 参数（如果不是 auto）
      if (options?.region && options.region !== 'auto') {
        requestBody.region = options.region
      }

      // 添加 language 参数
      if (options?.language) {
        requestBody.language = options.language
      }

      logger.debug('发送 Tavily 搜索请求', { query, options })

      const response = await fetch(`${this.apiEndpoint}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('Tavily API 请求失败', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        throw new Error(`Tavily API 错误: ${response.status} ${response.statusText}`)
      }

      const result = await response.json() as TavilySearchResponse

      return result.results.map(item => ({
        title: item.title,
        url: item.url,
        snippet: item.content,
        score: item.score,
        publishedDate: item.published_date
      }))
    } catch (error) {
      logger.error('Tavily 搜索失败', { error, query })
      throw error
    }
  }
}

/**
 * 创建 Tavily 适配器实例
 */
export function createTavilyAdapter(config: TavilyAdapterConfig): TavilyAdapter {
  return new TavilyAdapter(config)
}
