/**
 * Word 内容相关类型定义（表格、列表、图片等）
 */

/**
 * 列表操作选项
 */
export interface ListOptions {
  /** 列表类型 */
  listType: 'bulleted' | 'numbered' | 'multilevel'
  /** 列表级别 */
  level?: number
  /** 项目符号样式（仅项目符号列表） */
  bulletStyle?: 'solid' | 'square' | 'arrow' | 'checkmark' | 'diamonds' | 'hollow'
  /** 编号样式（仅编号列表） */
  numberingStyle?: 'arabic' | 'upperRoman' | 'lowerRoman' | 'upperLetter' | 'lowerLetter'
  /** 起始编号（仅编号列表） */
  startNumber?: number
  /** 应用范围 */
  scope?: 'selection' | 'paragraphs'
  /** 目标文本（可选） */
  targetText?: string
}

/**
 * 列表级别调整选项
 */
export interface ListLevelOptions {
  /** 当前级别 */
  currentLevel: number
  /** 目标级别 */
  targetLevel: number
  /** 应用范围 */
  scope?: 'selection' | 'paragraph'
  /** 目标文本（可选） */
  targetText?: string
}

/**
 * 表格插入选项
 */
export interface TableInsertOptions {
  /** 行数 */
  rows: number
  /** 列数 */
  columns: number
  /** 插入位置 */
  insertLocation?: 'Before' | 'After' | 'Start' | 'End'
  /** 初始值 */
  values?: string[][]
  /** 表格样式 */
  style?: string
  /** 首选宽度（单位：磅或百分比，Word API 自动转换） */
  preferredWidth?: number
  /** 目标文本（可选） */
  targetText?: string
}

/**
 * 表格更新选项
 */
export interface TableUpdateOptions {
  tableIndex?: number
  targetText?: string
  insertLocation?: 'Start' | 'End' | 'Before' | 'After'
  rowCount?: number
  columnCount?: number
  values?: string[][]
}

/**
 * 表格样式选项
 */
export interface TableStyleOptions {
  tableIndex?: number
  targetText?: string
  style?: string
  bandedRows?: boolean
  bandedColumns?: boolean
  headerRow?: boolean
  totalRow?: boolean
  shadingColor?: string
}

/**
 * 表格单元格位置
 */
export interface TableCellLocation {
  rowIndex: number
  columnIndex: number
}

/**
 * 表格单元格合并选项
 */
export interface TableMergeOptions {
  tableIndex?: number
  targetText?: string
  startCell: TableCellLocation
  endCell: TableCellLocation
}

/**
 * 表格单元格拆分选项
 */
export interface TableSplitOptions {
  tableIndex?: number
  targetText?: string
  cell: TableCellLocation
  rowCount?: number
  columnCount?: number
}

/**
 * 图片插入选项
 */
export interface PictureInsertOptions {
  base64?: string
  url?: string
  description?: string
  width?: number
  height?: number
  targetText?: string
  insertLocation?: 'Before' | 'After' | 'Start' | 'End'
}

/**
 * 图片环绕格式选项
 */
export interface PictureWrapOptions {
  pictureIndex?: number
  wrapType: 'inline' | 'square' | 'tight' | 'through' | 'topBottom' | 'behindText' | 'inFrontOfText'
  convertToFloat?: boolean
  left?: number
  top?: number
  lockAnchor?: boolean
  distanceLeft?: number
  distanceRight?: number
  distanceTop?: number
  distanceBottom?: number
}

/**
 * 页面设置选项
 */
export interface PageSetupOptions {
  orientation?: 'portrait' | 'landscape'
  topMargin?: number
  bottomMargin?: number
  leftMargin?: number
  rightMargin?: number
  pageWidth?: number
  pageHeight?: number
}

/**
 * 内容控件选项
 */
export interface ContentControlOptions {
  tag?: string
  title?: string
  placeholderText?: string
  text?: string
  appearance?: 'boundingBox' | 'tags' | 'hidden'
}

/**
 * 内容控件数据绑定选项
 */
export interface ContentControlBindingOptions {
  tag?: string
  title?: string
  text?: string
  html?: string
  lockContent?: boolean
  lockControl?: boolean
}
