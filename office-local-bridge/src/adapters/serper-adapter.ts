/**
 * Serper API 适配器
 * Google 搜索 API，提供高质量搜索结果
 * https://serper.dev/
 */

import type { WebSearchAdapter, WebSearchOptions } from './types.js'
import type { SearchResult } from '../types/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('SerperAdapter')

/**
 * Serper 配置
 */
export interface SerperConfig {
  apiKey: string
  /** 搜索类型: search, images, news, places */
  searchType?: 'search' | 'images' | 'news' | 'places'
  /** 国家/地区代码 */
  gl?: string
  /** 语言代码 */
  hl?: string
}

/**
 * Serper API 响应
 */
interface SerperResponse {
  searchParameters: {
    q: string
    gl: string
    hl: string
    num: number
  }
  organic: Array<{
    title: string
    link: string
    snippet: string
    position: number
    date?: string
  }>
  knowledgeGraph?: {
    title: string
    type: string
    description: string
    website?: string
  }
  answerBox?: {
    title: string
    answer: string
    link?: string
  }
}

/**
 * Serper 搜索适配器
 */
export class SerperAdapter implements WebSearchAdapter {
  readonly name = 'Serper'
  private config: SerperConfig
  private readonly apiEndpoint = 'https://google.serper.dev'

  constructor(config: SerperConfig) {
    this.config = config
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.search('test', { maxResults: 1 })
      return {
        success: true,
        message: '连接成功'
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误'
      logger.error('Serper 连接测试失败', { error: message })
      return {
        success: false,
        message: `连接失败: ${message}`
      }
    }
  }

  async search(query: string, options?: WebSearchOptions): Promise<SearchResult[]> {
    const maxResults = options?.maxResults || 5
    logger.info('Serper 搜索', { query, maxResults })

    try {
      const requestBody: Record<string, unknown> = {
        q: query,
        num: maxResults,
        gl: this.config.gl || 'cn',
        hl: this.config.hl || 'zh-cn',
      }

      const searchType = this.config.searchType || 'search'
      const url = `${this.apiEndpoint}/${searchType}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.config.apiKey
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('Serper API 请求失败', {
          status: response.status,
          error: errorText
        })
        
        if (response.status === 401) {
          throw new Error('API Key 无效')
        } else if (response.status === 429) {
          throw new Error('API 请求次数超限')
        }
        throw new Error(`Serper API 错误: ${response.status}`)
      }

      const data = await response.json() as SerperResponse
      const results: SearchResult[] = []

      // 添加知识图谱结果（如果有）
      if (data.knowledgeGraph?.description) {
        results.push({
          title: data.knowledgeGraph.title,
          url: data.knowledgeGraph.website || `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          snippet: data.knowledgeGraph.description,
          score: 1.0
        })
      }

      // 添加答案框结果（如果有）
      if (data.answerBox?.answer) {
        results.push({
          title: data.answerBox.title || '直接答案',
          url: data.answerBox.link || `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          snippet: data.answerBox.answer,
          score: 0.99
        })
      }

      // 添加有机搜索结果
      for (const item of data.organic || []) {
        if (results.length >= maxResults) break
        
        results.push({
          title: item.title,
          url: item.link,
          snippet: item.snippet,
          score: 1 - (item.position * 0.05),
          publishedDate: item.date
        })
      }

      logger.info('Serper 搜索完成', { resultCount: results.length })
      return results.slice(0, maxResults)
    } catch (error) {
      logger.error('Serper 搜索失败', { error, query })
      throw error
    }
  }
}

export function createSerperAdapter(config: SerperConfig): SerperAdapter {
  return new SerperAdapter(config)
}
