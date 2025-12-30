/**
 * 本地知识库实现
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { createLogger } from '../utils/logger.js'
import { loadConfig } from '../config/index.js'
import type {
  DocumentMetadata,
  DocumentChunk,
  SearchResult,
  AddDocumentRequest,
  SearchOptions
} from './types.js'

const logger = createLogger('LocalKnowledgeBase')

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * LRU 缓存项
 */
interface CacheEntry {
  results: SearchResult[]
  timestamp: number
}

/**
 * 本地知识库类
 */
export class LocalKnowledgeBase {
  private documents: Map<string, DocumentMetadata> = new Map()
  private chunks: Map<string, DocumentChunk[]> = new Map()
  private storageDir: string
  private metadataFile: string
  private contentDir: string
  private searchCache: Map<string, CacheEntry> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存
  private readonly MAX_CACHE_SIZE = 100 // 最多缓存100个查询

  constructor(storageDir?: string) {
    this.storageDir = storageDir || join(__dirname, '../../data/knowledge')
    this.metadataFile = join(this.storageDir, 'documents.json')
    this.contentDir = join(this.storageDir, 'content')

    this.ensureDirectories()
    this.loadDocuments()
  }

  /**
   * 确保存储目录存在
   */
  private ensureDirectories(): void {
    if (!existsSync(this.storageDir)) {
      mkdirSync(this.storageDir, { recursive: true })
    }
    if (!existsSync(this.contentDir)) {
      mkdirSync(this.contentDir, { recursive: true })
    }
  }

  /**
   * 加载文档元数据
   */
  private loadDocuments(): void {
    if (existsSync(this.metadataFile)) {
      try {
        const content = readFileSync(this.metadataFile, 'utf-8')
        const docs = JSON.parse(content) as DocumentMetadata[]
        for (const doc of docs) {
          this.documents.set(doc.id, doc)
        }
        logger.info('文档元数据已加载', { count: docs.length })
      } catch (error) {
        logger.error('加载文档元数据失败', { error })
      }
    }
  }

  /**
   * 保存文档元数据
   */
  private saveDocuments(): void {
    try {
      const docs = Array.from(this.documents.values())
      writeFileSync(this.metadataFile, JSON.stringify(docs, null, 2), 'utf-8')
      logger.info('文档元数据已保存', { count: docs.length })
    } catch (error) {
      logger.error('保存文档元数据失败', { error })
      throw error
    }
  }

  /**
   * 将文本分块
   */
  private chunkText(text: string, maxChunkSize = 1000): string[] {
    const chunks: string[] = []
    const sentences = text.split(/[。！？\n]+/).filter(s => s.trim())

    let currentChunk = ''
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim())
        currentChunk = sentence
      } else {
        currentChunk += (currentChunk ? '。' : '') + sentence
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim())
    }

    return chunks.length > 0 ? chunks : [text]
  }

  /**
   * 生成文本嵌入向量
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const config = loadConfig()

    // 检查是否使用真实 embedding API
    if (config.knowledge?.useRealEmbeddings) {
      return this.generateRealEmbedding(text)
    }

    // 使用模拟向量（向后兼容）
    logger.debug('使用模拟embedding向量')
    return this.generateMockEmbedding(text)
  }

  /**
   * 生成真实的 embedding 向量（OpenAI API）
   */
  private async generateRealEmbedding(text: string): Promise<number[]> {
    const config = loadConfig()
    const providerId = config.knowledge?.embeddingProvider || config.defaultProviderId
    const provider = config.providers?.find(p => p.id === providerId)

    if (!provider) {
      throw new Error('未配置 embedding 提供商')
    }

    if (provider.type !== 'openai') {
      throw new Error('目前仅支持 OpenAI embedding API')
    }

    const model = config.knowledge?.embeddingModel || 'text-embedding-3-small'
    const baseUrl = provider.baseUrl || 'https://api.openai.com/v1'

    logger.debug('调用 OpenAI Embeddings API', { model })

    const response = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model,
        input: text
      })
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('OpenAI Embeddings API 调用失败', { status: response.status, error })
      throw new Error(`OpenAI Embeddings API 错误: ${response.status}`)
    }

    const data = await response.json() as {
      data: Array<{ embedding: number[] }>
    }

    return data.data[0].embedding
  }

  /**
   * 生成模拟 embedding 向量（向后兼容）
   */
  private generateMockEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/)
    const vector = new Array(384).fill(0)

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      for (let j = 0; j < word.length; j++) {
        const charCode = word.charCodeAt(j)
        vector[(charCode + i + j) % 384] += 1
      }
    }

    // 归一化
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    return magnitude > 0 ? vector.map(v => v / magnitude) : vector
  }

  /**
   * 计算余弦相似度
   */
  private calculateSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      return 0
    }

    let dotProduct = 0
    let mag1 = 0
    let mag2 = 0

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      mag1 += vec1[i] * vec1[i]
      mag2 += vec2[i] * vec2[i]
    }

    const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2)
    return magnitude > 0 ? dotProduct / magnitude : 0
  }

  /**
   * 清除搜索缓存
   */
  private clearSearchCache(): void {
    this.searchCache.clear()
    logger.debug('搜索缓存已清除')
  }

  /**
   * 添加文档
   */
  async addDocument(request: AddDocumentRequest): Promise<DocumentMetadata> {
    const id = randomUUID()
    const now = Date.now()

    logger.info('添加文档', { id, title: request.title })

    // 分块
    const textChunks = this.chunkText(request.content)
    logger.info('文档已分块', { id, chunks: textChunks.length })

    // 为每个块生成embedding
    const chunks: DocumentChunk[] = []
    for (let i = 0; i < textChunks.length; i++) {
      const chunkId = `${id}-${i}`
      const embedding = await this.generateEmbedding(textChunks[i])

      chunks.push({
        id: chunkId,
        documentId: id,
        content: textChunks[i],
        index: i,
        embedding
      })
    }

    this.chunks.set(id, chunks)

    // 保存文档内容
    const contentFile = join(this.contentDir, `${id}.txt`)
    writeFileSync(contentFile, request.content, 'utf-8')

    // 保存元数据
    const metadata: DocumentMetadata = {
      id,
      title: request.title,
      content: request.content.substring(0, 200) + '...',
      chunks: textChunks.length,
      createdAt: now,
      updatedAt: now,
      metadata: request.metadata
    }

    this.documents.set(id, metadata)
    this.saveDocuments()

    // 清除搜索缓存
    this.clearSearchCache()

    logger.info('文档添加成功', { id, title: request.title })
    return metadata
  }

  /**
   * 批量添加文档
   */
  async addDocuments(requests: AddDocumentRequest[]): Promise<{
    success: DocumentMetadata[]
    failed: Array<{ request: AddDocumentRequest; error: string }>
  }> {
    logger.info('批量添加文档', { count: requests.length })

    const success: DocumentMetadata[] = []
    const failed: Array<{ request: AddDocumentRequest; error: string }> = []

    // 使用 Promise.allSettled 并行处理所有文档
    const results = await Promise.allSettled(
      requests.map(request => this.addDocument(request))
    )

    // 处理结果
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.status === 'fulfilled') {
        success.push(result.value)
      } else {
        failed.push({
          request: requests[i],
          error: result.reason instanceof Error ? result.reason.message : '未知错误'
        })
      }
    }

    logger.info('批量添加完成', {
      total: requests.length,
      success: success.length,
      failed: failed.length
    })

    return { success, failed }
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(options: SearchOptions): string {
    return JSON.stringify({
      query: options.query,
      limit: options.limit || 10,
      threshold: options.threshold || 0.7
    })
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.searchCache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.searchCache.delete(key)
      }
    }
  }

  /**
   * 清理缓存（LRU策略）
   */
  private evictCache(): void {
    if (this.searchCache.size <= this.MAX_CACHE_SIZE) {
      return
    }

    // 找到最旧的缓存项并删除
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, entry] of this.searchCache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.searchCache.delete(oldestKey)
    }
  }

  /**
   * 搜索文档（带缓存）
   */
  async searchDocuments(options: SearchOptions): Promise<SearchResult[]> {
    const { query, limit = 10, threshold = 0.7 } = options

    // 生成缓存键
    const cacheKey = this.getCacheKey(options)

    // 检查缓存
    const cached = this.searchCache.get(cacheKey)
    if (cached) {
      const now = Date.now()
      if (now - cached.timestamp < this.CACHE_TTL) {
        logger.info('使用缓存的搜索结果', { query })
        return cached.results
      } else {
        // 缓存过期，删除
        this.searchCache.delete(cacheKey)
      }
    }

    logger.info('搜索文档', { query, limit, threshold })

    // 生成查询向量
    const queryEmbedding = await this.generateEmbedding(query)

    // 计算所有块的相似度
    const results: Array<{ chunk: DocumentChunk; score: number }> = []

    for (const chunks of this.chunks.values()) {
      for (const chunk of chunks) {
        if (!chunk.embedding) continue

        const score = this.calculateSimilarity(queryEmbedding, chunk.embedding)
        if (score >= threshold) {
          results.push({ chunk, score })
        }
      }
    }

    // 按相似度排序
    results.sort((a, b) => b.score - a.score)

    // 取前N个结果，按文档聚合
    const documentResults = new Map<string, SearchResult>()

    for (const { chunk, score } of results.slice(0, limit * 2)) {
      const doc = this.documents.get(chunk.documentId)
      if (!doc) continue

      if (!documentResults.has(chunk.documentId)) {
        documentResults.set(chunk.documentId, {
          id: doc.id,
          title: doc.title,
          content: chunk.content,
          score,
          metadata: doc.metadata
        })
      }
    }

    const finalResults = Array.from(documentResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    // 缓存结果
    this.searchCache.set(cacheKey, {
      results: finalResults,
      timestamp: Date.now()
    })

    // 清理过期缓存和执行LRU淘汰
    this.cleanExpiredCache()
    this.evictCache()

    logger.info('搜索完成', { query, results: finalResults.length })
    return finalResults
  }

  /**
   * 更新文档
   */
  async updateDocument(id: string, updates: Partial<AddDocumentRequest>): Promise<DocumentMetadata> {
    logger.info('更新文档', { id, updates })

    const doc = this.documents.get(id)
    if (!doc) {
      throw new Error(`文档不存在: ${id}`)
    }

    const now = Date.now()
    let needsReembedding = false

    // 更新标题
    if (updates.title !== undefined) {
      doc.title = updates.title
    }

    // 更新元数据
    if (updates.metadata !== undefined) {
      doc.metadata = updates.metadata
    }

    // 更新内容（需要重新生成 embeddings）
    if (updates.content !== undefined && updates.content !== doc.content) {
      needsReembedding = true

      // 分块
      const textChunks = this.chunkText(updates.content)
      logger.info('文档已重新分块', { id, chunks: textChunks.length })

      // 为每个块生成 embedding
      const chunks: DocumentChunk[] = []
      for (let i = 0; i < textChunks.length; i++) {
        const chunkId = `${id}-${i}`
        const embedding = await this.generateEmbedding(textChunks[i])

        chunks.push({
          id: chunkId,
          documentId: id,
          content: textChunks[i],
          index: i,
          embedding
        })
      }

      this.chunks.set(id, chunks)

      // 更新文档内容
      doc.content = updates.content.substring(0, 200) + '...'
      doc.chunks = textChunks.length

      // 保存完整内容到文件
      const contentFile = join(this.contentDir, `${id}.txt`)
      writeFileSync(contentFile, updates.content, 'utf-8')
    }

    // 更新时间戳
    doc.updatedAt = now

    // 保存元数据
    this.documents.set(id, doc)
    this.saveDocuments()

    // 清除搜索缓存
    this.clearSearchCache()

    logger.info('文档更新成功', { id, needsReembedding })
    return doc
  }

  /**
   * 删除文档
   */
  async deleteDocument(id: string): Promise<void> {
    logger.info('删除文档', { id })

    const doc = this.documents.get(id)
    if (!doc) {
      throw new Error(`文档不存在: ${id}`)
    }

    // 删除文档内容文件
    const contentFile = join(this.contentDir, `${id}.txt`)
    if (existsSync(contentFile)) {
      unlinkSync(contentFile)
    }

    // 删除内存中的数据
    this.documents.delete(id)
    this.chunks.delete(id)

    // 保存元数据
    this.saveDocuments()

    // 清除搜索缓存
    this.clearSearchCache()

    logger.info('文档删除成功', { id })
  }

  /**
   * 列出所有文档
   */
  listDocuments(limit = 100, offset = 0): { documents: DocumentMetadata[]; total: number } {
    const allDocs = Array.from(this.documents.values())
      .sort((a, b) => b.updatedAt - a.updatedAt)

    return {
      documents: allDocs.slice(offset, offset + limit),
      total: allDocs.length
    }
  }

  /**
   * 获取文档详情
   */
  getDocument(id: string): DocumentMetadata | undefined {
    return this.documents.get(id)
  }
}

export const localKnowledgeBase = new LocalKnowledgeBase()
