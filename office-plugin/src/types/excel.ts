/**
 * Excel 类型定义
 * 定义 Excel 相关的数据结构和接口
 */

/**
 * Excel 单元格数据
 */
export interface ExcelCell {
  /** 单元格地址 (例如: "A1") */
  address: string
  /** 单元格值 */
  value: unknown
  /** 单元格公式 (如果有) */
  formula?: string
  /** 单元格格式 */
  format?: string
  /** 数据类型 */
  valueType: 'string' | 'number' | 'boolean' | 'date' | 'formula' | 'empty'
}

/**
 * Excel 单元格范围
 */
export interface ExcelRange {
  /** 范围地址 (例如: "A1:B10") */
  address: string
  /** 行数 */
  rowCount: number
  /** 列数 */
  columnCount: number
  /** 单元格数据 (二维数组) */
  values: unknown[][]
  /** 公式 (二维数组) */
  formulas?: string[][]
}

/**
 * Excel 工作表内容
 */
export interface ExcelWorksheetContent {
  /** 工作表名称 */
  name: string
  /** 已使用的范围 */
  usedRange: ExcelRange
  /** 选中的范围 (如果有) */
  selectedRange?: ExcelRange
  /** 表格列表 */
  tables?: ExcelTable[]
}

/**
 * Excel 表格
 */
export interface ExcelTable {
  /** 表格名称 */
  name: string
  /** 表格范围地址 */
  address: string
  /** 表头 */
  headers: string[]
  /** 数据行数 */
  rowCount: number
}

/**
 * Excel 单元格修改建议
 */
export interface ExcelCellChange {
  /** 唯一标识符 */
  id: string
  /** 单元格地址 */
  address: string
  /** 原始值 */
  oldValue: unknown
  /** 新值 */
  newValue: unknown
  /** 修改类型 */
  changeType: 'value' | 'formula' | 'format'
  /** 公式 (如果是公式修改) */
  formula?: string
  /** 说明 */
  description?: string
  /** 状态 */
  status: 'pending' | 'accepted' | 'rejected'
}

/**
 * Excel 批量修改结果
 */
export interface ExcelBatchChangeResult {
  /** 总数 */
  total: number
  /** 成功数 */
  success: number
  /** 失败数 */
  failed: number
  /** 失败的单元格地址 */
  failedCells: string[]
  /** 错误信息 */
  errors: Array<{
    address: string
    error: string
  }>
}

/**
 * Excel 条件格式选项
 */
export interface ExcelConditionalFormatOptions {
  /** 背景色 */
  backgroundColor?: string
  /** 字体颜色 */
  fontColor?: string
  /** 是否加粗 */
  bold?: boolean
}

/**
 * Excel 批注选项
 */
export interface ExcelCommentOptions {
  /** 批注内容 */
  content: string
  /** 作者 */
  author?: string
}

/**
 * Excel 数据分析结果
 */
export interface ExcelAnalysisResult {
  /** 工作表名称 */
  worksheetName: string
  /** 数据摘要 */
  summary: {
    rowCount: number
    columnCount: number
    hasHeaders: boolean
    dataTypes: Record<string, string>
  }
  /** 数据示例 (前几行) */
  sample: unknown[][]
}
