/**
 * Dify 知识库适配器
 * 实现与 Dify 知识库 API 的集成
 */

import type {
  KnowledgeBaseAdapter,
  DifyAdapterConfig
} from './types.js'
import type { KnowledgeSearchResult, DifyDataset, KnowledgeSearchOptions } from '../types/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('DifyAdapter')

/**
 * Dify API 响应类型定义
 */
interface DifyDatasetResponse {
  id: string
  name: string
  description?: string
  document_count: number
  word_count: number
  permission: string
  created_at: string
  updated_at: string
}

interface DifyDatasetsListResponse {
  data: DifyDatasetResponse[]
  has_more: boolean
  limit: number
  total: number
  page: number
}

interface DifyRetrieveRecord {
  segment: {
    id: string
    content: string
    document_id: string
    document: {
      id: string
      name: string
      data_source_type: string
    }
    keywords?: string[]
    word_count: number
  }
  score: number
}

interface DifyRetrieveResponse {
  query: { content: string }
  records: DifyRetrieveRecord[]
}

/**
 * Dify 知识库适配器实现
 */
export class DifyAdapter implements KnowledgeBaseAdapter {
  readonly name = 'Dify'
  private config: DifyAdapterConfig

  constructor(config: DifyAdapterConfig) {
    this.config = config
  }

  /**
   * 发送 API 请求
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.config.apiEndpoint}${path}`

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json'
    }

    const options: RequestInit = {
      method,
      headers
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    logger.debug('发送 Dify API 请求', { method, path })

    const response = await fetch(url, options)

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Dify API 请求失败', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`Dify API 错误: ${response.status} ${response.statusText}`)
    }

    return response.json() as Promise<T>
  }

  /**
   * 测试连接是否有效
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.request<DifyDatasetsListResponse>(
        'GET',
        '/v1/datasets?page=1&limit=1'
      )

      return {
        success: true,
        message: `连接成功，共有 ${result.total} 个知识库`
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误'
      logger.error('Dify 连接测试失败', { error: message })
      return {
        success: false,
        message: `连接失败: ${message}`
      }
    }
  }

  /**
   * 获取可用的数据集列表
   */
  async getDatasets(): Promise<DifyDataset[]> {
    try {
      const result = await this.request<DifyDatasetsListResponse>(
        'GET',
        '/v1/datasets?page=1&limit=100'
      )

      return result.data.map(dataset => ({
        id: dataset.id,
        name: dataset.name,
        description: dataset.description,
        documentCount: dataset.document_count,
        wordCount: dataset.word_count,
        permission: dataset.permission,
        createdAt: dataset.created_at,
        updatedAt: dataset.updated_at
      }))
    } catch (error) {
      logger.error('获取 Dify 数据集列表失败', { error })
      throw error
    }
  }

  /**
   * 搜索知识库
   */
  async search(
    query: string,
    datasetId: string,
    options?: KnowledgeSearchOptions
  ): Promise<KnowledgeSearchResult[]> {
    try {
      const requestBody = {
        query,
        retrieval_model: {
          search_method: options?.searchMethod || 'semantic_search',
          reranking_enable: options?.rerankingEnable ?? false,
          reranking_mode: null,
          reranking_model: {
            reranking_provider_name: '',
            reranking_model_name: ''
          },
          weights: null,
          top_k: options?.topK || 5,
          score_threshold_enabled: options?.scoreThreshold !== undefined,
          score_threshold: options?.scoreThreshold || null
        }
      }

      const result = await this.request<DifyRetrieveResponse>(
        'POST',
        `/v1/datasets/${datasetId}/retrieve`,
        requestBody
      )

      return result.records.map(record => ({
        content: record.segment.content,
        score: record.score,
        documentId: record.segment.document_id,
        documentName: record.segment.document?.name,
        title: record.segment.document?.name,
        metadata: {
          segmentId: record.segment.id,
          keywords: record.segment.keywords,
          wordCount: record.segment.word_count,
          dataSourceType: record.segment.document?.data_source_type
        }
      }))
    } catch (error) {
      logger.error('Dify 知识库搜索失败', { error, datasetId, query })
      throw error
    }
  }
}

/**
 * 创建 Dify 适配器实例
 */
export function createDifyAdapter(config: DifyAdapterConfig): DifyAdapter {
  return new DifyAdapter(config)
}
