/**
 * Word 格式化相关类型定义
 */

/**
 * 段落格式化选项
 */
export interface ParagraphFormatOptions {
  /** 对齐方式 */
  alignment?: 'mixed' | 'left' | 'centered' | 'right' | 'justified'
  /** 左缩进（单位：磅） */
  leftIndent?: number
  /** 右缩进（单位：磅） */
  rightIndent?: number
  /** 首行缩进（单位：磅） */
  firstLineIndent?: number
  /** 行距（默认单位：磅；当 lineSpacingRule = multiple 且值 ≤ 10 时按倍数转换） */
  lineSpacing?: number
  /** 行距规则 */
  lineSpacingRule?: 'single' | 'onePointFive' | 'double' | 'atLeast' | 'exactly' | 'multiple'
}

/**
 * 字体格式化选项
 */
export interface FontFormatOptions {
  /** 字体名称 */
  name?: string
  /** 字体大小（磅） */
  size?: number
  /** 字体颜色 */
  color?: string
  /** 粗体 */
  bold?: boolean
  /** 斜体 */
  italic?: boolean
  /** 下划线类型 */
  underline?: 'none' | 'single' | 'double' | 'thick' | 'dotted' | 'dashed' | 'dotDash' | 'dotDotDash' | 'wavy' | 'wavyDouble' | 'words'
  /** 字符间距（磅） */
  spacing?: number
  /** 缩放比例 */
  scale?: number
}

/**
 * 样式管理选项
 */
export interface StyleOptions {
  /** 样式名称 */
  styleName: string
  /** 应用范围 */
  scope?: 'selection' | 'paragraph' | 'document'
  /** 目标文本（可选） */
  targetText?: string
}

/**
 * 样式批量修改选项
 */
export interface StyleBatchModifyOptions {
  /** 原样式名称 */
  fromStyle?: string
  /** 目标样式名称 */
  toStyle?: string
  /** 修改的属性 */
  modifyProperties?: {
    /** 字体颜色 */
    color?: string
    /** 字体大小 */
    size?: number
    /** 粗体 */
    bold?: boolean
    /** 斜体 */
    italic?: boolean
  }
  /** 应用范围 */
  scope?: 'document' | 'selection'
}
