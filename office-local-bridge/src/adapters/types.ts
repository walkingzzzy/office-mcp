/**
 * 适配器接口定义
 * 用于统一外部知识库和搜索服务的访问方式
 */

import type {
  KnowledgeSearchResult,
  KnowledgeSearchOptions,
  DifyDataset,
  SearchResult
} from '../types/index.js'

/**
 * 知识库适配器接口
 * 定义与外部知识库服务交互的标准方法
 */
export interface KnowledgeBaseAdapter {
  /**
   * 适配器名称
   */
  readonly name: string

  /**
   * 测试连接是否有效
   */
  testConnection(): Promise<{ success: boolean; message: string }>

  /**
   * 获取可用的数据集列表
   */
  getDatasets(): Promise<DifyDataset[]>

  /**
   * 搜索知识库
   * @param query 搜索查询
   * @param datasetId 数据集 ID
   * @param options 搜索选项
   */
  search(
    query: string,
    datasetId: string,
    options?: KnowledgeSearchOptions
  ): Promise<KnowledgeSearchResult[]>
}

/**
 * 网络搜索适配器接口
 * 定义与网络搜索服务交互的标准方法
 */
export interface WebSearchAdapter {
  /**
   * 适配器名称
   */
  readonly name: string

  /**
   * 测试连接是否有效
   */
  testConnection(): Promise<{ success: boolean; message: string }>

  /**
   * 执行网络搜索
   * @param query 搜索查询
   * @param options 搜索选项
   */
  search(
    query: string,
    options?: WebSearchOptions
  ): Promise<SearchResult[]>
}

/**
 * 网络搜索选项
 */
export interface WebSearchOptions {
  maxResults?: number
  searchDepth?: 'basic' | 'advanced'
  includeImages?: boolean
  includeDomains?: string[]
  excludeDomains?: string[]
  language?: string
  region?: string
}

/**
 * 适配器配置基类
 */
export interface AdapterConfig {
  apiEndpoint: string
  apiKey: string
}

/**
 * Dify 适配器配置
 */
export interface DifyAdapterConfig extends AdapterConfig {
  defaultDatasetId?: string
}

/**
 * Tavily 适配器配置
 */
export interface TavilyAdapterConfig {
  apiKey: string
}
