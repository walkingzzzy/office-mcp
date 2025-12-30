/**
 * Word 搜索相关类型定义
 */

/**
 * 搜索增强选项
 */
export interface EnhancedSearchOptions {
  /** 搜索文本 */
  searchText: string
  /** 是否支持通配符 */
  useWildcards?: boolean
  /** 是否区分大小写 */
  matchCase?: boolean
  /** 是否全词匹配 */
  matchWholeWord?: boolean
  /** 格式化搜索条件 */
  formatConditions?: {
    /** 字体名称 */
    fontName?: string
    /** 字体大小 */
    fontSize?: number
    /** 是否粗体 */
    bold?: boolean
    /** 是否斜体 */
    italic?: boolean
  }
}

/**
 * 文本搜索结果
 */
export interface WordSearchResult {
  /** 是否找到 */
  found: boolean
  /** 找到的文本 */
  text?: string
  /** 匹配的范围 */
  ranges?: Word.Range[]
}

/**
 * 文本高亮选项
 */
export interface WordHighlightOptions {
  /** 高亮颜色 */
  color: string
  /** 持续时间（毫秒）*/
  duration?: number
  /** 是否滚动到视图 */
  scrollIntoView?: boolean
}
