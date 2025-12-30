/**
 * 文档上下文感知提供器
 * 负责提取和分析当前文档的上下文信息，为 AI 提供更准确的参数推断
 */

import Logger from '../../utils/logger'
import { AlignmentType,DocumentContext } from './types'

const logger = new Logger('DocumentContextProvider')

/**
 * 字体使用统计项
 */
interface FontUsageStatItem {
  fontName?: string
  name?: string
  fontSize?: number
  size?: number
  count?: number
}

/**
 * 对齐方式使用统计项
 */
interface AlignmentUsageStatItem {
  alignment: string
  count?: number
}

/**
 * WordService 接口（用于类型安全）
 */
interface WordServiceLike {
  getSelection(): Promise<{ text?: string; paragraphs?: unknown[]; formatting?: Record<string, unknown> } | null>
  getDocumentStats?(): Promise<{ paragraphCount?: number; wordCount?: number; characterCount?: number } | null>
  getStyles?(): Promise<{ items?: Array<{ name: string }> } | null>
  getPrimaryFont?(): Promise<{ name?: string; size?: number } | null>
  getPrimaryAlignment?(): Promise<AlignmentType | null>
  getRecentFormattingHistory?(): Promise<FormattingHistoryItem[]>
  getDocumentContent?(): Promise<{ content: string } | null>
  getDocumentStyles?(): Promise<{ items?: Array<{ name: string }> } | null>
  getFontUsageStats?(): Promise<FontUsageStatItem[] | null>
  getAlignmentUsageStats?(): Promise<AlignmentUsageStatItem[] | null>
}

/**
 * 格式化历史项
 */
interface FormattingHistoryItem {
  fontName?: string
  name?: string
  fontSize?: number
  size?: number
  color?: string
  bold?: boolean
  italic?: boolean
}

/**
 * 上下文提取配置
 */
export interface ContextExtractionOptions {
  /** 是否分析文档统计信息 */
  includeStats?: boolean
  /** 是否分析样式信息 */
  includeStyles?: boolean
  /** 是否分析选区信息 */
  includeSelection?: boolean
  /** 是否分析最近使用的格式 */
  includeRecentFormatting?: boolean
  /** 最大样式数量限制 */
  maxStylesCount?: number
  /** 最大段落数量限制 */
  maxParagraphsCount?: number
}

/**
 * 文档统计信息
 */
export interface DocumentStats {
  /** 总段落数 */
  paragraphCount: number
  /** 总字数 */
  wordCount: number
  /** 总字符数 */
  characterCount: number
  /** 平均段落数 */
  avgParagraphLength: number
  /** 表格数量 */
  tableCount: number
  /** 图片数量 */
  imageCount: number
  /** 列表数量 */
  listCount: number
  /** 主要字体 */
  primaryFont?: string
}

/**
 * 样式分析结果
 */
export interface StyleAnalysis {
  /** 主要字体 */
  primaryFont?: string
  /** 主要字体大小 */
  primaryFontSize?: number
  /** 主要对齐方式 */
  primaryAlignment?: AlignmentType
  /** 使用的样式列表 */
  styles: string[]
  /** 样式使用频率 */
  styleFrequencies: Record<string, number>
}

/**
 * 文档上下文提供器类
 */
export class DocumentContextProvider {
  private wordService: WordServiceLike
  private contextCache: Map<string, { context: DocumentContext; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存
  private readonly maxCacheSize: number = 50

  constructor(wordService: WordServiceLike) {
    this.wordService = wordService
    logger.debug('DocumentContextProvider initialized')
  }

  /**
   * 获取当前文档上下文
   */
  async getCurrentContext(
    options: ContextExtractionOptions = {}
  ): Promise<DocumentContext> {
    const startTime = Date.now()
    const operationId = `context-extract-${startTime}`

    // 合并默认选项
    const opts: Required<ContextExtractionOptions> = {
      includeStats: options.includeStats ?? true,
      includeStyles: options.includeStyles ?? true,
      includeSelection: options.includeSelection ?? true,
      includeRecentFormatting: options.includeRecentFormatting ?? true,
      maxStylesCount: options.maxStylesCount ?? 20,
      maxParagraphsCount: options.maxParagraphsCount ?? 100
    }

    logger.info(`[${operationId}] Extracting document context`, { options: opts })

    try {
      const context: DocumentContext = {}

      // 提取选区信息
      if (opts.includeSelection) {
        context.selection = await this.extractSelectionInfo(operationId)
      }

      // 提取文档统计信息
      if (opts.includeStats) {
        context.document = await this.extractDocumentStats(operationId, opts)
      }

      // 提取样式分析
      if (opts.includeStyles && context.document) {
        const styleAnalysis = await this.extractStyleAnalysis(operationId, opts)
        context.document.primaryFont = styleAnalysis.primaryFont
        context.document.styles = styleAnalysis.styles
      }

      // 提取最近使用的格式
      if (opts.includeRecentFormatting) {
        context.recentFormatting = await this.extractRecentFormatting(operationId)
      }

      const extractionTime = Date.now() - startTime
      logger.info(`[${operationId}] Context extraction completed`, {
        extractionTime,
        hasSelection: !!context.selection,
        hasDocument: !!context.document,
        hasRecentFormatting: !!context.recentFormatting
      })

      return context

    } catch (error) {
      logger.error(`[${operationId}] Context extraction failed`, {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * 提取选区信息
   */
  private async extractSelectionInfo(operationId: string): Promise<DocumentContext['selection']> {
    logger.debug(`[${operationId}] Extracting selection info`)

    try {
      // 这里需要调用 WordService 来获取选区信息
      // 假设 WordService 有获取选区的方法
      const selection = await this.wordService.getSelection()

      if (!selection || !selection.text) {
        logger.debug(`[${operationId}] No selection found`)
        return {
          length: 0
        }
      }

      const selectionInfo: DocumentContext['selection'] = {
        text: selection.text,
        length: selection.text.length,
        formatting: selection.formatting || {}
      }

      logger.debug(`[${operationId}] Selection info extracted`, {
        textLength: selectionInfo.length,
        hasFormatting: !!selectionInfo.formatting
      })

      return selectionInfo

    } catch (error) {
      logger.warn(`[${operationId}] Failed to extract selection info`, {
        error: error instanceof Error ? error.message : String(error)
      })
      return {
        length: 0
      }
    }
  }

  /**
   * 提取文档统计信息
   */
  private async extractDocumentStats(
    operationId: string,
    options: Required<ContextExtractionOptions>
  ): Promise<DocumentContext['document']> {
    logger.debug(`[${operationId}] Extracting document stats`)

    try {
      // 获取文档内容
      const documentContent = await this.wordService.getDocumentContent?.()

      if (!documentContent) {
        logger.debug(`[${operationId}] No document content found`)
        return {
          paragraphCount: 0,
          wordCount: 0,
          styles: []
        }
      }

      // 分析文档统计
      const stats = this.calculateDocumentStats(documentContent.content)

      const documentInfo: DocumentContext['document'] = {
        paragraphCount: stats.paragraphCount,
        wordCount: stats.wordCount,
        styles: [], // 将在样式分析中填充
        primaryFont: stats.primaryFont
      }

      logger.debug(`[${operationId}] Document stats extracted`, {
        paragraphCount: stats.paragraphCount,
        wordCount: stats.wordCount,
        characterCount: stats.characterCount
      })

      return documentInfo

    } catch (error) {
      logger.warn(`[${operationId}] Failed to extract document stats`, {
        error: error instanceof Error ? error.message : String(error)
      })
      return {
        paragraphCount: 0,
        wordCount: 0,
        styles: []
      }
    }
  }

  /**
   * 提取样式分析
   */
  private async extractStyleAnalysis(
    operationId: string,
    options: Required<ContextExtractionOptions>
  ): Promise<StyleAnalysis> {
    logger.debug(`[${operationId}] Extracting style analysis`)

    try {
      // 获取样式信息
      const styles = await this.wordService.getDocumentStyles?.()

      const styleAnalysis: StyleAnalysis = {
        styles: [],
        styleFrequencies: {}
      }

      if (styles && Array.isArray(styles.items)) {
        // 分析样式使用频率
        const styleNames = styles.items.slice(0, options.maxStylesCount).map((style) => style.name)
        styleAnalysis.styles = styleNames

        // 计算样式使用频率
        styleNames.forEach((styleName: string) => {
          styleAnalysis.styleFrequencies[styleName] = (styleAnalysis.styleFrequencies[styleName] || 0) + 1
        })
      }

      // 获取主要字体信息
      const primaryFont = await this.getPrimaryFont()
      if (primaryFont) {
        styleAnalysis.primaryFont = primaryFont.name
        styleAnalysis.primaryFontSize = primaryFont.size
      }

      // 获取主要对齐方式
      const primaryAlignment = await this.getPrimaryAlignment()
      if (primaryAlignment) {
        styleAnalysis.primaryAlignment = primaryAlignment
      }

      logger.debug(`[${operationId}] Style analysis extracted`, {
        stylesCount: styleAnalysis.styles.length,
        primaryFont: styleAnalysis.primaryFont,
        primaryAlignment: styleAnalysis.primaryAlignment
      })

      return styleAnalysis

    } catch (error) {
      logger.warn(`[${operationId}] Failed to extract style analysis`, {
        error: error instanceof Error ? error.message : String(error)
      })
      return {
        styles: [],
        styleFrequencies: {}
      }
    }
  }

  /**
   * 提取最近使用的格式
   */
  private async extractRecentFormatting(operationId: string): Promise<DocumentContext['recentFormatting']> {
    logger.debug(`[${operationId}] Extracting recent formatting`)

    try {
      // 获取最近的格式化操作历史
      const recentHistory = await this.wordService.getRecentFormattingHistory()

      if (!recentHistory || recentHistory.length === 0) {
        logger.debug(`[${operationId}] No recent formatting found`)
        return {}
      }

      // 分析最近的格式化模式
      const recentFormatting = this.analyzeRecentFormatting(recentHistory.slice(0, 5))

      logger.debug(`[${operationId}] Recent formatting extracted`, {
        hasFontName: !!recentFormatting.fontName,
        hasFontSize: !!recentFormatting.fontSize,
        hasColor: !!recentFormatting.color
      })

      return recentFormatting

    } catch (error) {
      logger.warn(`[${operationId}] Failed to extract recent formatting`, {
        error: error instanceof Error ? error.message : String(error)
      })
      return {}
    }
  }

  /**
   * 计算文档统计信息
   */
  private calculateDocumentStats(content: string): DocumentStats {
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0)
    const words = content.split(/\s+/).filter(w => w.length > 0)

    return {
      paragraphCount: paragraphs.length,
      wordCount: words.length,
      characterCount: content.length,
      avgParagraphLength: words.length / Math.max(paragraphs.length, 1),
      tableCount: (content.match(/<w:tbl/g) || []).length,
      imageCount: (content.match(/<w:drawing/g) || []).length,
      listCount: (content.match(/<w:numPr/g) || []).length
    }
  }

  /**
   * 获取主要字体
   */
  private async getPrimaryFont(): Promise<{ name?: string; size?: number }> {
    try {
      // 获取文档中最常用的字体
      const fontStats = await this.wordService.getFontUsageStats?.()

      if (fontStats && fontStats.length > 0) {
        const primaryFont = fontStats[0]
        return {
          name: primaryFont.fontName || primaryFont.name,
          size: primaryFont.fontSize || primaryFont.size
        }
      }
    } catch (error) {
      logger.warn('Failed to get primary font', { error })
    }

    return {}
  }

  /**
   * 获取主要对齐方式
   */
  private async getPrimaryAlignment(): Promise<AlignmentType | undefined> {
    try {
      // 获取文档中最常用的对齐方式
      const alignmentStats = await this.wordService.getAlignmentUsageStats?.()

      if (alignmentStats && alignmentStats.length > 0) {
        return alignmentStats[0].alignment as AlignmentType
      }
    } catch (error) {
      logger.warn('Failed to get primary alignment', { error })
    }

    return undefined
  }

  /**
   * 分析最近格式化
   */
  private analyzeRecentFormatting(recentHistory: FormattingHistoryItem[]): DocumentContext['recentFormatting'] {
    if (!recentHistory || recentHistory.length === 0) {
      return {}
    }

    const formattingCounts = {
      fontName: {} as Record<string, number>,
      fontSize: {} as Record<number, number>,
      color: {} as Record<string, number>,
      bold: 0,
      italic: 0
    }

    recentHistory.forEach(item => {
      const fontName = item.fontName || item.name
      const fontSize = item.fontSize || item.size
      
      if (fontName) {
        formattingCounts.fontName[fontName] = (formattingCounts.fontName[fontName] || 0) + 1
      }
      if (fontSize) {
        formattingCounts.fontSize[fontSize] = (formattingCounts.fontSize[fontSize] || 0) + 1
      }
      if (item.color) {
        formattingCounts.color[item.color] = (formattingCounts.color[item.color] || 0) + 1
      }
      if (item.bold) {
        formattingCounts.bold++
      }
      if (item.italic) {
        formattingCounts.italic++
      }
    })

    // 获取最常用的格式
    const recentFormatting: DocumentContext['recentFormatting'] = {}

    if (Object.keys(formattingCounts.fontName).length > 0) {
      const mostUsedFont = Object.entries(formattingCounts.fontName)
        .sort(([, a], [, b]) => b - a)[0]
      recentFormatting.fontName = mostUsedFont[0]
    }

    if (Object.keys(formattingCounts.fontSize).length > 0) {
      const mostUsedSize = Object.entries(formattingCounts.fontSize)
        .sort(([, a], [, b]) => b - a)[0]
      recentFormatting.fontSize = Number(mostUsedSize[0])
    }

    if (Object.keys(formattingCounts.color).length > 0) {
      const mostUsedColor = Object.entries(formattingCounts.color)
        .sort(([, a], [, b]) => b - a)[0]
      recentFormatting.color = mostUsedColor[0]
    }

    recentFormatting.bold = formattingCounts.bold > recentHistory.length / 2
    recentFormatting.italic = formattingCounts.italic > recentHistory.length / 2

    return recentFormatting
  }

  /**
   * 构建上下文提示词
   * 将文档上下文转换为 AI 可理解的提示词
   */
  buildContextPrompt(context: DocumentContext): string {
    const prompts: string[] = []

    if (context.selection && context.selection.length > 0) {
      prompts.push(`当前选区: ${context.selection.length} 个字符`)
      if (context.selection.text) {
        prompts.push(`选区内容: "${context.selection.text.substring(0, 50)}${context.selection.text.length > 50 ? '...' : ''}"`)
      }
    }

    if (context.document) {
      prompts.push(`文档信息: ${context.document.wordCount} 字, ${context.document.paragraphCount} 段落`)

      if (context.document.primaryFont) {
        prompts.push(`主要字体: ${context.document.primaryFont}`)
      }

      if (context.document.styles && context.document.styles.length > 0) {
        prompts.push(`使用样式: ${context.document.styles.slice(0, 5).join(', ')}`)
      }
    }

    if (context.recentFormatting) {
      const recent = []
      if (context.recentFormatting.fontName) recent.push(`字体: ${context.recentFormatting.fontName}`)
      if (context.recentFormatting.fontSize) recent.push(`字号: ${context.recentFormatting.fontSize}`)
      if (context.recentFormatting.color) recent.push(`颜色: ${context.recentFormatting.color}`)
      if (recent.length > 0) {
        prompts.push(`最近使用格式: ${recent.join(', ')}`)
      }
    }

    return prompts.join('\n')
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.contextCache.clear()
    logger.debug('Document context cache cleared')
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): {
    size: number
    oldestTimestamp?: number
    newestTimestamp?: number
  } {
    if (this.contextCache.size === 0) {
      return { size: 0 }
    }

    const timestamps = Array.from(this.contextCache.values()).map(c => c.timestamp)
    return {
      size: this.contextCache.size,
      oldestTimestamp: Math.min(...timestamps),
      newestTimestamp: Math.max(...timestamps)
    }
  }
}

/**
 * 便捷函数：创建文档上下文提供器
 */
export function createDocumentContextProvider(wordService: WordServiceLike): DocumentContextProvider {
  return new DocumentContextProvider(wordService)
}

/**
 * 便捷函数：获取文档上下文
 */
export async function getDocumentContext(
  wordService: WordServiceLike,
  options?: ContextExtractionOptions
): Promise<DocumentContext> {
  const provider = new DocumentContextProvider(wordService)
  return provider.getCurrentContext(options)
}