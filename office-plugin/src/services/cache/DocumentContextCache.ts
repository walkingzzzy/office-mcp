/**
 * 文档内容缓存服务
 * 缓存 Word 文档内容，避免每次发送消息都读取文档
 * 
 * @created 2025-12-30 - P1 优化：文档内容缓存
 */

import type { WordService } from '../WordService'
import type { WordParagraph } from '../../types/word'
import Logger from '../../utils/logger'

const logger = new Logger('DocumentContextCache')

/** 文档内容缓存条目 */
interface DocumentCacheEntry {
  /** 文档文本内容 */
  text: string
  /** 段落列表 */
  paragraphs: WordParagraph[]
  /** 缓存时间戳 */
  timestamp: number
  /** 内容哈希（用于检测变化） */
  hash: string
}

/** 选区内容缓存条目 */
interface SelectionCacheEntry {
  /** 选区文本 */
  text: string
  /** 是否有选区 */
  hasSelection: boolean
  /** 缓存时间戳 */
  timestamp: number
}

/**
 * 文档内容缓存类
 */
class DocumentContextCacheImpl {
  /** 文档内容缓存 */
  private documentCache: DocumentCacheEntry | null = null
  
  /** 选区内容缓存 */
  private selectionCache: SelectionCacheEntry | null = null
  
  /** 文档缓存 TTL（毫秒）- 5秒 */
  private readonly DOCUMENT_TTL = 5000
  
  /** 选区缓存 TTL（毫秒）- 2秒（选区变化更频繁） */
  private readonly SELECTION_TTL = 2000

  /**
   * 简单哈希函数
   * 用于检测文档内容是否变化
   */
  private computeHash(text: string): string {
    let hash = 0
    for (let i = 0; i < Math.min(text.length, 1000); i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(16)
  }

  // ==================== 文档内容缓存 ====================

  /**
   * 获取文档内容（带缓存）
   */
  async getDocumentContent(wordService: WordService): Promise<{
    text: string
    paragraphs: WordParagraph[]
    fromCache: boolean
  }> {
    const now = Date.now()
    
    // 检查缓存是否有效
    if (this.documentCache && (now - this.documentCache.timestamp) < this.DOCUMENT_TTL) {
      logger.debug('[CACHE HIT] 文档内容缓存命中', {
        age: `${now - this.documentCache.timestamp}ms`,
        textLength: this.documentCache.text.length
      })
      return {
        text: this.documentCache.text,
        paragraphs: this.documentCache.paragraphs,
        fromCache: true
      }
    }
    
    // 读取新内容
    const startTime = performance.now()
    const content = await wordService.readDocument()
    const elapsed = performance.now() - startTime
    
    // 更新缓存
    this.documentCache = {
      text: content.text,
      paragraphs: content.paragraphs as WordParagraph[],
      timestamp: now,
      hash: this.computeHash(content.text)
    }
    
    logger.info('[CACHE MISS] 文档内容已读取并缓存', {
      textLength: content.text.length,
      paragraphCount: content.paragraphs?.length || 0,
      readTime: `${elapsed.toFixed(1)}ms`
    })
    
    return {
      text: content.text,
      paragraphs: content.paragraphs as WordParagraph[],
      fromCache: false
    }
  }

  /**
   * 检查文档缓存是否有效
   */
  isDocumentCacheValid(): boolean {
    if (!this.documentCache) return false
    return (Date.now() - this.documentCache.timestamp) < this.DOCUMENT_TTL
  }

  // ==================== 选区内容缓存 ====================

  /**
   * 获取选区内容（带缓存）
   */
  async getSelectionContent(wordService: WordService): Promise<{
    text: string
    hasSelection: boolean
    fromCache: boolean
  }> {
    const now = Date.now()
    
    // 检查缓存是否有效
    if (this.selectionCache && (now - this.selectionCache.timestamp) < this.SELECTION_TTL) {
      logger.debug('[CACHE HIT] 选区内容缓存命中', {
        age: `${now - this.selectionCache.timestamp}ms`,
        hasSelection: this.selectionCache.hasSelection
      })
      return {
        text: this.selectionCache.text,
        hasSelection: this.selectionCache.hasSelection,
        fromCache: true
      }
    }
    
    // 检查是否有选区
    const hasSelection = await wordService.hasSelection()
    
    if (!hasSelection) {
      this.selectionCache = {
        text: '',
        hasSelection: false,
        timestamp: now
      }
      return { text: '', hasSelection: false, fromCache: false }
    }
    
    // 读取选区内容
    const startTime = performance.now()
    const selection = await wordService.readSelection()
    const elapsed = performance.now() - startTime
    
    // 更新缓存
    this.selectionCache = {
      text: selection.text,
      hasSelection: true,
      timestamp: now
    }
    
    logger.debug('[CACHE MISS] 选区内容已读取并缓存', {
      textLength: selection.text.length,
      readTime: `${elapsed.toFixed(1)}ms`
    })
    
    return {
      text: selection.text,
      hasSelection: true,
      fromCache: false
    }
  }

  /**
   * 检查选区缓存是否有效
   */
  isSelectionCacheValid(): boolean {
    if (!this.selectionCache) return false
    return (Date.now() - this.selectionCache.timestamp) < this.SELECTION_TTL
  }

  // ==================== 工具方法 ====================

  /**
   * 使文档缓存失效
   * 在文档被修改后调用
   */
  invalidateDocument(): void {
    this.documentCache = null
    logger.debug('[CACHE] 文档缓存已失效')
  }

  /**
   * 使选区缓存失效
   * 在选区变化后调用
   */
  invalidateSelection(): void {
    this.selectionCache = null
    logger.debug('[CACHE] 选区缓存已失效')
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.documentCache = null
    this.selectionCache = null
    logger.info('[CACHE] 文档上下文缓存已清空')
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    hasDocumentCache: boolean
    documentCacheAge: number | null
    hasSelectionCache: boolean
    selectionCacheAge: number | null
  } {
    const now = Date.now()
    return {
      hasDocumentCache: !!this.documentCache,
      documentCacheAge: this.documentCache ? now - this.documentCache.timestamp : null,
      hasSelectionCache: !!this.selectionCache,
      selectionCacheAge: this.selectionCache ? now - this.selectionCache.timestamp : null
    }
  }
}

/** 单例实例 */
export const documentContextCache = new DocumentContextCacheImpl()

export default documentContextCache
