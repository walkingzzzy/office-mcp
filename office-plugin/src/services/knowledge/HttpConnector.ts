/**
 * 通用 HTTP 知识库连接器
 * 支持任何提供 HTTP API 的知识库服务
 */

import { BaseConnector } from './BaseConnector'
import type {
  HttpKnowledgeBaseConfig,
  RetrievalRequest,
  RetrievalResponse,
  RetrievedDocument
} from './types'
import Logger from '../../utils/logger'

const logger = new Logger('HttpConnector')

/**
 * HTTP 知识库连接器
 */
export class HttpConnector extends BaseConnector {
  type = 'http' as const

  private config: HttpKnowledgeBaseConfig

  constructor(config: HttpKnowledgeBaseConfig) {
    super()
    this.config = config
  }

  /**
   * 连接（验证配置）
   */
  async connect(): Promise<void> {
    this.clearError()

    try {
      // 尝试健康检查
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        headers: this.buildHeaders(),
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        this.connected = true
      } else {
        // 即使健康检查失败，也尝试连接
        this.connected = true
        logger.warn('HTTP 知识库健康检查失败，但仍尝试连接')
      }
    } catch (error) {
      // 健康检查端点可能不存在，仍然标记为已连接
      this.connected = true
      logger.warn('HTTP 知识库健康检查端点不可用')
    }
  }

  /**
   * 构建请求头
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers
    }

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    return headers
  }

  /**
   * 检索文档
   */
  async retrieve(request: RetrievalRequest): Promise<RetrievalResponse> {
    if (!this.connected) {
      await this.connect()
    }

    const startTime = Date.now()
    const endpoint = this.config.searchEndpoint || '/search'
    const url = `${this.config.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          query: request.query,
          top_k: request.topK || 5,
          filter: request.filter,
          min_score: request.minScore
        })
      })

      if (!response.ok) {
        const error = await response.text()
        this.setError(`检索失败: ${response.status} - ${error}`)
        return { documents: [], totalCount: 0, queryTime: Date.now() - startTime }
      }

      const data = await response.json()
      const documents = this.parseResponse(data)

      return {
        documents,
        totalCount: documents.length,
        queryTime: Date.now() - startTime
      }
    } catch (error) {
      this.setError(`检索请求失败: ${(error as Error).message}`)
      return { documents: [], totalCount: 0, queryTime: Date.now() - startTime }
    }
  }

  /**
   * 解析响应数据
   */
  private parseResponse(data: unknown): RetrievedDocument[] {
    // 尝试多种常见的响应格式
    if (Array.isArray(data)) {
      return this.parseDocumentArray(data)
    }

    const obj = data as Record<string, unknown>

    // 常见的响应字段名
    const possibleFields = ['documents', 'results', 'hits', 'data', 'matches']
    for (const field of possibleFields) {
      if (Array.isArray(obj[field])) {
        return this.parseDocumentArray(obj[field] as unknown[])
      }
    }

    return []
  }

  /**
   * 解析文档数组
   */
  private parseDocumentArray(arr: unknown[]): RetrievedDocument[] {
    return arr.map((item, index) => {
      const doc = item as Record<string, unknown>
      const metadata = doc.metadata as Record<string, unknown> | undefined

      // 尝试提取内容
      const content = (
        doc.content ||
        doc.text ||
        doc.page_content ||
        doc.document ||
        doc.body ||
        ''
      ) as string

      // 尝试提取分数
      const score = (
        doc.score ||
        doc.similarity ||
        doc.distance ||
        doc._score ||
        1 - index * 0.1
      ) as number

      // 尝试提取 ID
      const id = (
        doc.id ||
        doc._id ||
        doc.document_id ||
        `doc_${index}`
      ) as string

      // 尝试提取来源
      const source = (
        doc.source ||
        metadata?.source ||
        doc.url ||
        undefined
      ) as string | undefined

      return {
        id,
        content,
        score: typeof score === 'number' ? score : 1,
        metadata,
        source
      }
    })
  }
}

export default HttpConnector
