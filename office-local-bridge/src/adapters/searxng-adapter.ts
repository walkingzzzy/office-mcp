/**
 * SearXNG 元搜索引擎适配器
 * 支持自部署实例或公共实例
 */

import type { WebSearchAdapter, WebSearchOptions } from './types.js'
import type { SearchResult } from '../types/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('SearXNGAdapter')

/**
 * SearXNG 配置
 */
export interface SearXNGConfig {
  /** SearXNG 实例 URL */
  instanceUrl: string
  /** 搜索引擎列表（可选） */
  engines?: string[]
  /** 语言 */
  language?: string
  /** 安全搜索级别 0-2 */
  safesearch?: number
}

/**
 * SearXNG API 响应
 */
interface SearXNGResponse {
  query: string
  number_of_results: number
  results: Array<{
    url: string
    title: string
    content?: string
    engine: string
    score?: number
    publishedDate?: string
  }>
}

/**
 * 公共 SearXNG 实例列表（备用）
 * 来源: https://searx.space/
 */
const PUBLIC_INSTANCES = [
  'https://search.inetol.net',
  'https://searx.work',
  'https://search.ononoki.org',
  'https://searx.namejeff.xyz',
  'https://search.mdosch.de',
]

/**
 * SearXNG 搜索适配器
 */
export class SearXNGAdapter implements WebSearchAdapter {
  readonly name = 'SearXNG'
  private config: SearXNGConfig
  private currentInstanceIndex = 0

  constructor(config: SearXNGConfig) {
    this.config = config
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const results = await this.search('test', { maxResults: 1 })
      return {
        success: true,
        message: `连接成功，实例: ${this.config.instanceUrl}`
      }
    } catch (error) {
      return {
        success: false,
        message: `连接失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  async search(query: string, options?: WebSearchOptions): Promise<SearchResult[]> {
    const maxResults = options?.maxResults || 5
    logger.info('SearXNG 搜索', { query, maxResults, instance: this.config.instanceUrl })

    // 尝试主实例
    try {
      return await this.searchInstance(this.config.instanceUrl, query, maxResults)
    } catch (error) {
      logger.warn('主实例搜索失败，尝试备用实例', { error })
      
      // 尝试公共实例
      for (const instance of PUBLIC_INSTANCES) {
        try {
          logger.info('尝试公共实例', { instance })
          return await this.searchInstance(instance, query, maxResults)
        } catch (e) {
          logger.warn('公共实例失败', { instance, error: e })
        }
      }
      
      throw new Error('所有 SearXNG 实例均不可用')
    }
  }

  private async searchInstance(instanceUrl: string, query: string, maxResults: number): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      language: this.config.language || 'zh-CN',
      safesearch: String(this.config.safesearch ?? 1),
    })

    if (this.config.engines?.length) {
      params.set('engines', this.config.engines.join(','))
    }

    const url = `${instanceUrl}/search?${params.toString()}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8秒超时
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json() as SearXNGResponse

      return data.results.slice(0, maxResults).map((item, index) => ({
        title: item.title,
        url: item.url,
        snippet: item.content || '',
        score: item.score || (1 - index * 0.1),
        publishedDate: item.publishedDate
      }))
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }
}

export function createSearXNGAdapter(config: SearXNGConfig): SearXNGAdapter {
  return new SearXNGAdapter(config)
}
