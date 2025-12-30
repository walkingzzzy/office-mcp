/**
 * 本地知识库类型定义
 */

/**
 * 文档元数据
 */
export interface DocumentMetadata {
  id: string
  title: string
  content: string
  chunks: number
  createdAt: number
  updatedAt: number
  metadata?: Record<string, unknown>
}

/**
 * 文档块
 */
export interface DocumentChunk {
  id: string
  documentId: string
  content: string
  index: number
  embedding?: number[]
}

/**
 * 搜索结果
 */
export interface SearchResult {
  id: string
  title: string
  content: string
  score: number
  metadata?: Record<string, unknown>
}

/**
 * 添加文档请求
 */
export interface AddDocumentRequest {
  title: string
  content: string
  metadata?: Record<string, unknown>
}

/**
 * 搜索请求参数
 */
export interface SearchOptions {
  query: string
  limit?: number
  threshold?: number
}
