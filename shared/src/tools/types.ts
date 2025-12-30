/**
 * Tool Definition Types - Phase 2 完善
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'

export type ToolCategory =
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'common'
  | 'track_changes'
  | 'annotation'
  | 'canvas'
  | 'coauthoring'
  | 'comment'
  | 'conditional_format'
  | 'conflict'
  | 'document'
  | 'education'
  | 'field'
  | 'layout'
  | 'pivot'
  | 'pivot_table'
  | 'shape'
  | 'slicer'
  | 'slideshow'
  | 'table'

export type ApplicationType = 'word' | 'excel' | 'powerpoint' | 'common'

export interface ToolExample {
  description: string
  input: Record<string, any>
  output: Record<string, any>
}

export interface ToolDefinition extends Tool {
  category: ToolCategory
  application?: ApplicationType
  handler: (args: Record<string, any>) => Promise<any>
  metadata?: ToolMetadata
  examples?: ToolExample[]
}

export interface ToolMetadata {
  version?: string
  author?: string
  tags?: string[]
  deprecated?: boolean
  experimental?: boolean
  scenario?: string
  contextTip?: string
  audience?: string
  intentKeywords?: string[]
  applicableFor?: Array<'text' | 'image' | 'table' | 'none'>
  documentTypes?: ToolCategory[]
  priority?: 'P0' | 'P1' | 'P2'
}

export interface ToolExecutionResult {
  success: boolean
  message?: string
  data?: any
  error?: string
  stack?: string
  metadata?: {
    executionTime?: number
    memoryUsage?: number
    timestamp?: number
  }
}

export interface ToolValidationError {
  field: string
  message: string
  value?: any
}

export interface ToolValidationResult {
  valid: boolean
  errors: ToolValidationError[]
}

// ============================================================================
// 工具参数类型定义
// ============================================================================

/**
 * 工具参数基础接口
 * 所有工具参数类型的基础，允许扩展未知属性
 */
export interface BaseToolArgs {
  [key: string]: unknown
}

/**
 * 带有范围的工具参数
 * 适用于需要指定单元格范围的操作
 */
export interface RangeToolArgs extends BaseToolArgs {
  /** 单元格范围，如 "A1:B10" */
  range?: string
  /** 工作表名称 */
  worksheet?: string
}

/**
 * 带有位置的工具参数
 * 适用于需要指定具体位置的操作
 */
export interface PositionToolArgs extends BaseToolArgs {
  /** 行号（从1开始） */
  row?: number
  /** 列号或列名（数字或字母，如 1 或 "A"） */
  column?: number | string
  /** 单元格地址，如 "A1" */
  cell?: string
}

// ============================================================================
// Excel 工具参数类型
// ============================================================================

/**
 * Excel 工作表操作参数
 */
export interface ExcelWorksheetArgs extends BaseToolArgs {
  /** 工作表名称 */
  name: string
  /** 工作表位置（从0开始） */
  position?: number
}

/**
 * Excel 单元格操作参数
 */
export interface ExcelCellArgs extends RangeToolArgs {
  /** 单元格值 */
  value?: string | number | boolean
  /** 单元格公式 */
  formula?: string
}

/**
 * Excel 格式设置参数
 */
export interface ExcelFormatArgs extends RangeToolArgs {
  /** 是否加粗 */
  bold?: boolean
  /** 是否斜体 */
  italic?: boolean
  /** 字体大小 */
  fontSize?: number
  /** 字体颜色（十六进制格式，如 "#FF0000"） */
  fontColor?: string
  /** 背景颜色（十六进制格式，如 "#FFFFFF"） */
  backgroundColor?: string
  /** 对齐方式 */
  alignment?: 'left' | 'center' | 'right'
}

/**
 * Excel 图表操作参数
 */
export interface ExcelChartArgs extends BaseToolArgs {
  /** 图表类型 */
  type: 'line' | 'bar' | 'pie' | 'column' | 'area' | 'scatter'
  /** 数据范围 */
  dataRange: string
  /** 图表标题 */
  title?: string
  /** 图表位置 */
  position?: { row: number; column: number }
}

// ============================================================================
// Word 工具参数类型
// ============================================================================

/**
 * Word 文本操作参数
 */
export interface WordTextArgs extends BaseToolArgs {
  /** 文本内容 */
  text: string
  /** 插入位置 */
  location?: 'end' | 'start' | 'selection' | 'replace'
}

/**
 * Word 格式设置参数
 */
export interface WordFormatArgs extends BaseToolArgs {
  /** 是否加粗 */
  bold?: boolean
  /** 是否斜体 */
  italic?: boolean
  /** 是否下划线 */
  underline?: boolean
  /** 字体大小 */
  fontSize?: number
  /** 字体颜色（十六进制格式） */
  fontColor?: string
  /** 字体名称 */
  fontName?: string
}

/**
 * Word 段落设置参数
 */
export interface WordParagraphArgs extends BaseToolArgs {
  /** 对齐方式 */
  alignment?: 'left' | 'center' | 'right' | 'justify'
  /** 行间距 */
  lineSpacing?: number
  /** 首行缩进（磅值） */
  firstLineIndent?: number
}

// ============================================================================
// PowerPoint 工具参数类型
// ============================================================================

/**
 * PowerPoint 幻灯片操作参数
 */
export interface PowerPointSlideArgs extends BaseToolArgs {
  /** 幻灯片索引（从0开始） */
  slideIndex?: number
  /** 布局名称 */
  layout?: string
}

/**
 * PowerPoint 形状操作参数
 */
export interface PowerPointShapeArgs extends BaseToolArgs {
  /** 形状类型 */
  type: 'rectangle' | 'ellipse' | 'line' | 'textBox' | 'image'
  /** 形状位置和尺寸 */
  position: { left: number; top: number; width: number; height: number }
  /** 文本内容（仅对文本框有效） */
  text?: string
  /** 填充颜色（十六进制格式） */
  fillColor?: string
}

/**
 * PowerPoint 文本操作参数
 */
export interface PowerPointTextArgs extends BaseToolArgs {
  /** 文本内容 */
  text: string
  /** 幻灯片索引 */
  slideIndex: number
  /** 形状索引 */
  shapeIndex?: number
}
