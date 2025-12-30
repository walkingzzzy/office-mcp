/**
 * Word 文档定位相关类型定义
 */

/**
 * 文档位置信息
 */
export interface DocumentPosition {
  /** 段落索引 */
  paragraphIndex: number
  /** 在段落中的字符偏移 */
  characterOffset: number
  /** 段落文本内容 */
  paragraphText: string
  /** 文档中的全局位置 */
  globalPosition?: number
}

/**
 * 高亮选项
 */
export interface HighlightOptions {
  /** 高亮颜色 */
  color: string
  /** 高亮持续时间（毫秒），默认3000ms */
  duration?: number
  /** 是否自动滚动到位置 */
  scrollToPosition?: boolean
  /** 高亮透明度 */
  opacity?: number
  /** 文本长度（用于精确定位） */
  textLength?: number
}
