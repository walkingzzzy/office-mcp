/**
 * 知识库服务类型定义
 */

/**
 * 知识库类型
 */
export type KnowledgeBaseType = 'milvus' | 'pinecone' | 'chroma' | 'http' | 'custom'

/**
 * 知识库配置基础接口
 */
export interface KnowledgeBaseConfig {
  id: string
  type: KnowledgeBaseType
  name: string
  enabled: boolean
  description?: string
}

/**
 * Milvus 配置
 */
export interface MilvusConfig extends KnowledgeBaseConfig {
  type: 'milvus'
  host: string
  port: number
  collection: string
  username?: string
  password?: string
  secure?: boolean
}

/**
 * Pinecone 配置
 */
export interface PineconeConfig extends KnowledgeBaseConfig {
  type: 'pinecone'
  apiKey: string
  environment: string
  indexName: string
  namespace?: string
}

/**
 * Chroma 配置
 */
export interface ChromaConfig extends KnowledgeBaseConfig {
  type: 'chroma'
  host: string
  port: number
  collection: string
  apiKey?: string
}

/**
 * 通用 HTTP 知识库配置
 */
export interface HttpKnowledgeBaseConfig extends KnowledgeBaseConfig {
  type: 'http'
  baseUrl: string
  apiKey?: string
  headers?: Record<string, string>
  searchEndpoint?: string
  embeddingEndpoint?: string
}

/**
 * 所有知识库配置类型
 */
export type AnyKnowledgeBaseConfig =
  | MilvusConfig
  | PineconeConfig
  | ChromaConfig
  | HttpKnowledgeBaseConfig

/**
 * 检索结果文档
 */
export interface RetrievedDocument {
  id: string
  content: string
  score: number
  metadata?: Record<string, unknown>
  source?: string
}

/**
 * 检索请求
 */
export interface RetrievalRequest {
  query: string
  topK?: number
  filter?: Record<string, unknown>
  minScore?: number
}

/**
 * 检索响应
 */
export interface RetrievalResponse {
  documents: RetrievedDocument[]
  totalCount: number
  queryTime: number
}

/**
 * 知识库连接器接口
 */
export interface KnowledgeBaseConnector {
  /**
   * 连接器类型
   */
  type: KnowledgeBaseType

  /**
   * 初始化连接
   */
  connect(): Promise<void>

  /**
   * 断开连接
   */
  disconnect(): Promise<void>

  /**
   * 检查连接状态
   */
  isConnected(): boolean

  /**
   * 检索文档
   */
  retrieve(request: RetrievalRequest): Promise<RetrievalResponse>

  /**
   * 健康检查
   */
  healthCheck(): Promise<boolean>
}

/**
 * 知识库管理器接口
 */
export interface KnowledgeBaseManager {
  /**
   * 添加知识库
   */
  addKnowledgeBase(config: AnyKnowledgeBaseConfig): Promise<void>

  /**
   * 移除知识库
   */
  removeKnowledgeBase(id: string): Promise<void>

  /**
   * 获取所有知识库
   */
  getKnowledgeBases(): AnyKnowledgeBaseConfig[]

  /**
   * 获取已启用的知识库
   */
  getEnabledKnowledgeBases(): AnyKnowledgeBaseConfig[]

  /**
   * 从多个知识库检索
   */
  retrieve(request: RetrievalRequest): Promise<RetrievalResponse>
}
