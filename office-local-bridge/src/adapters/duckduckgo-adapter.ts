/**
 * DuckDuckGo 网络搜索适配器
 * 使用 HTML 解析获取真实搜索结果
 */

import type { WebSearchAdapter, WebSearchOptions } from './types.js'
import type { SearchResult } from '../types/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('DuckDuckGoAdapter')

/**
 * DuckDuckGo 搜索适配器
 */
export class DuckDuckGoAdapter implements WebSearchAdapter {
  readonly name = 'DuckDuckGo'
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const results = await this.search('test', { maxResults: 1 })
      return {
        success: results.length > 0,
        message: results.length > 0 ? '连接成功' : '连接成功但无结果'
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
    logger.info('DuckDuckGo HTML 搜索', { query, maxResults })

    try {
      // 使用 DuckDuckGo HTML 版本
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      return this.parseHtmlResults(html, maxResults)
    } catch (error) {
      logger.error('DuckDuckGo 搜索失败', { error, query })
      
      // 降级到 Instant Answer API
      logger.info('降级到 Instant Answer API')
      return this.searchInstantAnswer(query, maxResults)
    }
  }

  /**
   * 解析 HTML 搜索结果
   */
  private parseHtmlResults(html: string, maxResults: number): SearchResult[] {
    const results: SearchResult[] = []
    
    // 备用解析方法：直接匹配 result__a 链接和 result__snippet
    const linkPattern = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi
    const snippetPattern = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi
    
    const links: Array<{url: string, title: string}> = []
    const snippets: string[] = []
    
    let match
    while ((match = linkPattern.exec(html)) !== null) {
      let url = match[1]
      const title = this.stripHtml(match[2]).trim()
      
      // 解析重定向 URL
      if (url.includes('uddg=')) {
        const uddgMatch = url.match(/uddg=([^&]+)/)
        if (uddgMatch) {
          url = decodeURIComponent(uddgMatch[1])
        }
      }
      
      // 跳过广告和内部链接
      if (!url.includes('ad_provider') && 
          !url.includes('duckduckgo.com/y.js') && 
          url.startsWith('http') &&
          title) {
        links.push({ url, title })
      }
    }
    
    while ((match = snippetPattern.exec(html)) !== null) {
      snippets.push(this.stripHtml(match[1]).trim())
    }
    
    // 组合结果
    for (let i = 0; i < Math.min(links.length, maxResults); i++) {
      results.push({
        title: links[i].title,
        url: links[i].url,
        snippet: snippets[i] || '',
        score: 1 - (i * 0.1)
      })
    }

    logger.info('DuckDuckGo HTML 解析完成', { resultCount: results.length, linksFound: links.length })
    return results
  }

  /**
   * 去除 HTML 标签并解码实体
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * 降级：使用 Instant Answer API
   */
  private async searchInstantAnswer(query: string, maxResults: number): Promise<SearchResult[]> {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    
    const response = await fetch(url)
    const data = await response.json() as {
      Abstract?: string
      AbstractURL?: string
      AbstractSource?: string
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>
    }

    const results: SearchResult[] = []

    if (data.Abstract && data.AbstractURL) {
      results.push({
        title: data.AbstractSource || 'DuckDuckGo',
        url: data.AbstractURL,
        snippet: data.Abstract,
        score: 1.0
      })
    }

    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, maxResults - 1)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text,
            url: topic.FirstURL,
            snippet: topic.Text,
            score: 0.8
          })
        }
      }
    }

    return results.slice(0, maxResults)
  }
}

export function createDuckDuckGoAdapter(): DuckDuckGoAdapter {
  return new DuckDuckGoAdapter()
}
