/**
 * Word 文档相关类型定义
 */

/**
 * Word 文档内容
 */
export interface WordDocumentContent {
  /** 文档文本内容 */
  text: string
  /** 段落列表 */
  paragraphs: WordParagraph[]
  /** 文档统计信息 */
  statistics: WordDocumentStatistics
}

/**
 * Word 段落
 */
export interface WordParagraph {
  /** 段落索引 */
  index: number
  /** 段落文本 */
  text: string
  /** 段落样式 */
  style?: string
  /** 是否为列表项 */
  isListItem?: boolean
  /** 段落对齐方式 */
  alignment?: 'mixed' | 'left' | 'centered' | 'right' | 'justified'
  /** 段落缩进 */
  indentation?: {
    left?: number
    right?: number
    firstLine?: number
  }
  /** 行距 */
  lineSpacing?: number
  /** 行距规则 */
  lineSpacingRule?: 'single' | 'onePointFive' | 'double' | 'atLeast' | 'exactly' | 'multiple'
}

/**
 * Word 文档统计信息
 */
export interface WordDocumentStatistics {
  /** 字符数 */
  characterCount: number
  /** 段落数 */
  paragraphCount: number
  /** 行数 */
  lineCount?: number
}

/**
 * 选中的文本信息
 */
export interface WordSelection {
  /** 选中的文本 */
  text: string
  /** 开始位置 */
  start?: number
  /** 结束位置 */
  end?: number
}
