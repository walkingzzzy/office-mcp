/**
 * 文档上下文提取器
 * 
 * 提供结构化的文档上下文信息，帮助 AI 更好地理解文档内容
 * 
 * 功能：
 * 1. 提取文档结构（标题、段落、表格、图片）
 * 2. 获取选区上下文（前后文）
 * 3. 基于用户意图提取相关段落
 * 4. 缓存机制减少重复调用
 */

import Logger from '../../utils/logger'
import { mcpToolExecutor } from './McpToolExecutor'

const logger = new Logger('DocumentContextExtractor')

/**
 * 文档结构信息
 */
export interface DocumentStructure {
  /** 标题列表 */
  headings: Array<{ level: number; text: string; position: number }>
  /** 段落数量 */
  paragraphCount: number
  /** 表格数量 */
  tableCount: number
  /** 图片数量 */
  imageCount: number
  /** 是否包含问题标记（如 TODO、FIXME） */
  hasIssueMarkers?: boolean
  /** 文档总字数估计 */
  estimatedWordCount?: number
}

/**
 * 选区上下文信息
 */
export interface SelectionContextInfo {
  /** 选区前的文本（最多 200 字符） */
  beforeText: string
  /** 选中的文本 */
  selectedText: string
  /** 选区后的文本（最多 200 字符） */
  afterText: string
  /** 选区类型 */
  selectionType?: 'text' | 'table' | 'image' | 'none'
}

/**
 * 完整的文档上下文
 */
export interface DocumentContext {
  /** 文档标题 */
  title?: string
  /** 文档结构 */
  structure: DocumentStructure
  /** 选区上下文 */
  selectionContext?: SelectionContextInfo
  /** 与用户意图相关的段落 */
  relevantParagraphs?: string[]
  /** 文档摘要（前几段内容） */
  summary?: string
}

/**
 * 文档上下文提取器
 */
export class DocumentContextExtractor {
  /** 缓存的文档上下文 */
  private cache: DocumentContext | null = null
  
  /** 缓存时间戳 */
  private cacheTimestamp: number = 0
  
  /** 缓存 TTL（毫秒） */
  private cacheTTL: number = 10000 // 10 秒缓存

  /** 当前应用类型 */
  private currentApp: 'word' | 'excel' | 'powerpoint' = 'word'

  /**
   * 设置当前应用类型
   */
  setCurrentApp(app: 'word' | 'excel' | 'powerpoint'): void {
    if (this.currentApp !== app) {
      this.clearCache() // 切换应用时清除缓存
      this.currentApp = app
    }
  }

  /**
   * 提取文档上下文
   * 
   * @param userMessage 用户消息（用于提取相关段落）
   * @param forceRefresh 是否强制刷新缓存
   */
  async extractContext(userMessage?: string, forceRefresh: boolean = false): Promise<DocumentContext> {
    // 检查缓存
    if (!forceRefresh && this.cache && Date.now() - this.cacheTimestamp < this.cacheTTL) {
      logger.debug('[CONTEXT] Using cached document context', {
        age: Date.now() - this.cacheTimestamp,
        ttl: this.cacheTTL
      })
      return this.cache
    }

    const startTime = Date.now()

    try {
      // 并行获取文档结构和选区上下文
      const [structure, selectionContext] = await Promise.all([
        this.getDocumentStructure(),
        this.getSelectionContext()
      ])

      // 基于用户意图提取相关段落（如果有用户消息）
      let relevantParagraphs: string[] | undefined
      if (userMessage) {
        relevantParagraphs = await this.findRelevantParagraphs(userMessage, structure)
      }

      // 获取文档摘要
      const summary = await this.getDocumentSummary()

      const context: DocumentContext = {
        structure,
        selectionContext,
        relevantParagraphs,
        summary
      }

      // 更新缓存
      this.cache = context
      this.cacheTimestamp = Date.now()

      logger.info('[CONTEXT] Document context extracted', {
        executionTime: Date.now() - startTime,
        paragraphCount: structure.paragraphCount,
        headingCount: structure.headings.length,
        hasSelection: !!selectionContext?.selectedText,
        relevantParagraphCount: relevantParagraphs?.length || 0
      })

      return context
    } catch (error) {
      logger.error('[CONTEXT] Failed to extract context', { error })
      
      // 返回空上下文而不是抛出错误
      return {
        structure: {
          headings: [],
          paragraphCount: 0,
          tableCount: 0,
          imageCount: 0
        }
      }
    }
  }

  /**
   * 获取文档结构
   */
  private async getDocumentStructure(): Promise<DocumentStructure> {
    try {
      const toolName = this.getToolName('get_paragraphs')
      const result = await mcpToolExecutor.executeTool(toolName, {})

      if (!result.success || !result.data) {
        return this.getEmptyStructure()
      }

      const data = result.data as {
        paragraphs?: Array<{ style?: string; text?: string; isHeading?: boolean }>
        tableCount?: number
        imageCount?: number
      }

      const paragraphs = data.paragraphs || []
      
      // 提取标题
      const headings = paragraphs
        .filter((p) => p.style?.startsWith('Heading') || p.isHeading)
        .map((p, index) => ({
          level: this.extractHeadingLevel(p.style),
          text: this.truncateText(p.text, 50),
          position: index
        }))

      // 检测问题标记
      const hasIssueMarkers = paragraphs.some((p) => 
        /TODO|FIXME|BUG|ISSUE|问题|待办|修复/i.test(p.text || '')
      )

      // 估算字数
      const estimatedWordCount = paragraphs.reduce((sum, p) => 
        sum + (p.text?.length || 0), 0
      )

      return {
        headings,
        paragraphCount: paragraphs.length,
        tableCount: data.tableCount || 0,
        imageCount: data.imageCount || 0,
        hasIssueMarkers,
        estimatedWordCount
      }
    } catch (error) {
      logger.warn('[CONTEXT] Failed to get document structure', { error })
      return this.getEmptyStructure()
    }
  }

  /**
   * 获取选区上下文
   */
  private async getSelectionContext(): Promise<SelectionContextInfo | undefined> {
    try {
      const toolName = this.getToolName('get_selected_text')
      const result = await mcpToolExecutor.executeTool(toolName, {})

      if (!result.success || !result.data) {
        return undefined
      }

      const data = result.data as {
        text?: string
        beforeText?: string
        afterText?: string
        selectionType?: 'text' | 'table' | 'image' | 'none'
      }

      if (!data.text) {
        return undefined
      }

      return {
        beforeText: this.truncateText(data.beforeText || '', 200, 'start'),
        selectedText: data.text,
        afterText: this.truncateText(data.afterText || '', 200, 'end'),
        selectionType: data.selectionType || 'text'
      }
    } catch (error) {
      logger.debug('[CONTEXT] No selection or failed to get selection', { error })
      return undefined
    }
  }

  /**
   * 获取文档摘要（前几段内容）
   */
  private async getDocumentSummary(): Promise<string | undefined> {
    try {
      const toolName = this.getToolName('read_document')
      const result = await mcpToolExecutor.executeTool(toolName, { maxLength: 500 })

      if (!result.success || !result.data) {
        return undefined
      }

      const data = result.data as { content?: string }

      if (!data.content) {
        return undefined
      }

      return this.truncateText(data.content, 500, 'end')
    } catch (error) {
      logger.debug('[CONTEXT] Failed to get document summary', { error })
      return undefined
    }
  }

  /**
   * 基于用户意图查找相关段落
   */
  private async findRelevantParagraphs(
    userMessage: string,
    structure: DocumentStructure
  ): Promise<string[]> {
    // 提取关键词
    const keywords = this.extractKeywords(userMessage)
    
    if (keywords.length === 0) {
      return []
    }

    try {
      // 使用搜索工具查找相关内容
      const toolName = this.getToolName('search_text')
      const relevantParagraphs: string[] = []

      // 搜索每个关键词
      for (const keyword of keywords.slice(0, 3)) { // 最多搜索 3 个关键词
        const result = await mcpToolExecutor.executeTool(toolName, { 
          searchText: keyword,
          maxResults: 2
        })

        if (!result.success || !result.data) {
          continue
        }

        const data = result.data as { matches?: Array<{ context?: string }> }

        if (data.matches) {
          for (const match of data.matches) {
            if (match.context && !relevantParagraphs.includes(match.context)) {
              relevantParagraphs.push(this.truncateText(match.context, 200))
            }
          }
        }
      }

      return relevantParagraphs.slice(0, 5) // 最多返回 5 个相关段落
    } catch (error) {
      logger.debug('[CONTEXT] Failed to find relevant paragraphs', { error })
      return []
    }
  }

  /**
   * 从用户消息中提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 中文停用词
    const stopWords = new Set([
      '的', '是', '在', '和', '了', '有', '我', '你', '这', '那',
      '把', '被', '给', '让', '对', '与', '及', '或', '但', '而',
      '如果', '因为', '所以', '虽然', '但是', '然后', '接着',
      '请', '帮', '帮我', '能', '可以', '需要', '想要', '希望',
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from'
    ])

    // 分词并过滤
    const words = text
      .replace(/[，。！？、；：""''（）【】《》\s]+/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 1 && 
        !stopWords.has(word.toLowerCase()) &&
        !/^\d+$/.test(word) // 排除纯数字
      )

    // 去重并限制数量
    return [...new Set(words)].slice(0, 5)
  }

  /**
   * 获取工具名称（根据当前应用）
   */
  private getToolName(action: string): string {
    const prefix = this.currentApp === 'powerpoint' ? 'ppt' : this.currentApp
    return `${prefix}_${action}`
  }

  /**
   * 提取标题级别
   */
  private extractHeadingLevel(style: string | undefined): number {
    if (!style) return 1
    const match = style.match(/Heading\s*(\d+)/i)
    return match ? parseInt(match[1], 10) : 1
  }

  /**
   * 截断文本
   */
  private truncateText(text: string | undefined, maxLength: number, position: 'start' | 'end' = 'end'): string {
    if (!text) return ''
    if (text.length <= maxLength) return text
    
    if (position === 'start') {
      return '...' + text.slice(-maxLength)
    }
    return text.slice(0, maxLength) + '...'
  }

  /**
   * 获取空结构
   */
  private getEmptyStructure(): DocumentStructure {
    return {
      headings: [],
      paragraphCount: 0,
      tableCount: 0,
      imageCount: 0
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache = null
    this.cacheTimestamp = 0
    logger.debug('[CONTEXT] Cache cleared')
  }

  /**
   * 获取缓存状态
   */
  getCacheStatus(): { cached: boolean; age: number; ttl: number } {
    return {
      cached: this.cache !== null,
      age: this.cache ? Date.now() - this.cacheTimestamp : 0,
      ttl: this.cacheTTL
    }
  }

  /**
   * 格式化文档上下文为提示词片段
   */
  formatContextForPrompt(context: DocumentContext): string {
    const parts: string[] = []

    // 文档结构
    if (context.structure) {
      const { structure } = context
      parts.push(`【当前文档信息】`)
      parts.push(`- 段落数: ${structure.paragraphCount}`)
      
      if (structure.headings.length > 0) {
        parts.push(`- 标题数: ${structure.headings.length}`)
      }
      if (structure.tableCount > 0) {
        parts.push(`- 表格数: ${structure.tableCount}`)
      }
      if (structure.imageCount > 0) {
        parts.push(`- 图片数: ${structure.imageCount}`)
      }
      if (structure.estimatedWordCount) {
        parts.push(`- 估计字数: ${structure.estimatedWordCount}`)
      }
      if (structure.hasIssueMarkers) {
        parts.push(`- ⚠️ 文档包含待处理标记 (TODO/FIXME)`)
      }

      // 文档结构大纲
      if (structure.headings.length > 0) {
        parts.push(`\n文档大纲:`)
        const headingList = structure.headings
          .slice(0, 5)
          .map(h => `${'  '.repeat(h.level - 1)}${h.level}. ${h.text}`)
          .join('\n')
        parts.push(headingList)
      }
    }

    // 选区上下文
    if (context.selectionContext?.selectedText) {
      const { selectionContext } = context
      parts.push(`\n【当前选区】`)
      
      if (selectionContext.beforeText) {
        parts.push(`前文: ...${selectionContext.beforeText.slice(-50)}`)
      }
      
      const selectedPreview = selectionContext.selectedText.length > 100
        ? selectionContext.selectedText.slice(0, 100) + '...'
        : selectionContext.selectedText
      parts.push(`选中: ${selectedPreview}`)
      
      if (selectionContext.afterText) {
        parts.push(`后文: ${selectionContext.afterText.slice(0, 50)}...`)
      }
    }

    // 相关段落
    if (context.relevantParagraphs && context.relevantParagraphs.length > 0) {
      parts.push(`\n【相关内容】`)
      context.relevantParagraphs.forEach((p, i) => {
        parts.push(`${i + 1}. ${p}`)
      })
    }

    return parts.join('\n')
  }
}

// 导出单例实例
export const documentContextExtractor = new DocumentContextExtractor()
