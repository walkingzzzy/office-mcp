/**
 * Excel 工具注册中心
 * 汇总所有 Excel 工具模块并导出统一的工具注册表
 *
 * 对应 MCP 服务器定义的 ~186 个 Excel 工具
 */

import type { ToolDefinition, ToolRegistry } from '../types'
import { cellTools } from './CellTools'
import { formatTools } from './FormatTools'
import { formulaTools } from './FormulaTools'
import { chartTools } from './ChartTools'
import { worksheetTools } from './WorksheetTools'
import { dataTools } from './DataTools'
import { imageTools } from './ImageTools'
import { excelEducationToolDefinitions } from './EducationTools'
import { dataValidationTools } from './DataValidationTools'
// P1 阶段工具导入
import { tableEnhancedTools } from './TableEnhancedTools'
import { excelCommentTools } from './CommentTools'
import { conditionalFormatTools } from './ConditionalFormatTools'
import { pivotTableEnhancedTools } from './PivotTableEnhancedTools'
// P2 阶段工具导入
import { slicerTools } from './SlicerTools'
import { excelShapeTools } from './ShapeTools'
import { pivotHierarchyTools } from './PivotHierarchyTools'

/**
 * 所有 Excel 工具定义
 */
export const allExcelTools: ToolDefinition[] = [
  // 单元格操作 (20)
  ...cellTools,
  // 格式化操作 (15)
  ...formatTools,
  // 公式操作 (15)
  ...formulaTools,
  // 图表操作 (10)
  ...chartTools,
  // 工作表操作 (10)
  ...worksheetTools,
  // 数据分析操作 (15)
  ...dataTools,
  // 图片操作 (6) - P0
  ...imageTools,
  // 教育工具 (3) - P0/P1/P2
  ...excelEducationToolDefinitions,
  // 数据验证工具 (8) - P2
  ...dataValidationTools,
  // 表格增强工具 (10) - P1
  ...tableEnhancedTools,
  // 评论工具 (8) - P1
  ...excelCommentTools,
  // 条件格式工具 (9) - P1
  ...conditionalFormatTools,
  // 数据透视表增强工具 (12) - P1
  ...pivotTableEnhancedTools,
  // 切片器工具 (8) - P2
  ...slicerTools,
  // 形状工具 (8) - P2
  ...excelShapeTools,
  // 透视表层次结构工具 (8) - P2
  ...pivotHierarchyTools
]

/**
 * 创建 Excel 工具注册表
 */
export function createExcelToolRegistry(): ToolRegistry {
  const registry: ToolRegistry = new Map()
  
  for (const tool of allExcelTools) {
    registry.set(tool.name, tool.handler)
  }
  
  return registry
}

/**
 * 获取工具列表（用于调试）
 */
export function getExcelToolNames(): string[] {
  return allExcelTools.map(t => t.name)
}

/**
 * 按类别分组的工具
 */
export const excelToolsByCategory = {
  cell: cellTools,
  format: formatTools,
  formula: formulaTools,
  chart: chartTools,
  worksheet: worksheetTools,
  data: dataTools,
  image: imageTools,
  education: excelEducationToolDefinitions,
  dataValidation: dataValidationTools,
  tableEnhanced: tableEnhancedTools,
  comment: excelCommentTools,
  conditionalFormat: conditionalFormatTools,
  pivotTableEnhanced: pivotTableEnhancedTools,
  // P2 阶段工具
  slicer: slicerTools,
  shape: excelShapeTools,
  pivotHierarchy: pivotHierarchyTools
}

// 导出各模块
export { cellTools } from './CellTools'
export { formatTools } from './FormatTools'
export { formulaTools } from './FormulaTools'
export { chartTools } from './ChartTools'
export { worksheetTools } from './WorksheetTools'
export { dataTools } from './DataTools'
export { imageTools } from './ImageTools'
export { excelEducationToolDefinitions } from './EducationTools'
export { dataValidationTools } from './DataValidationTools'
// P1 阶段工具导出
export { tableEnhancedTools } from './TableEnhancedTools'
export { excelCommentTools } from './CommentTools'
export { conditionalFormatTools } from './ConditionalFormatTools'
export { pivotTableEnhancedTools } from './PivotTableEnhancedTools'
// P2 阶段工具导出
export { slicerTools } from './SlicerTools'
export { excelShapeTools } from './ShapeTools'
export { pivotHierarchyTools } from './PivotHierarchyTools'
