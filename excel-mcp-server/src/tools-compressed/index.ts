/**
 * Excel MCP Server 压缩工具索引
 * 将 140+ 个原工具压缩为 19 个统一工具
 */

// 导出类型定义
export * from './types.js'

// 导出所有压缩工具
export { excelCellTool } from './cell.js'
export { excelFormatTool } from './format.js'
export { excelFormulaTool } from './formula.js'
export { excelWorksheetTool } from './worksheet.js'
export { excelWorkbookTool } from './workbook.js'
export { excelDataTool } from './data.js'
export { excelChartTool } from './chart.js'
export { excelConditionalFormatTool } from './conditionalFormat.js'
export { excelImageTool } from './image.js'
export { excelTableTool } from './table.js'
export { excelPivotTableTool } from './pivotTable.js'
export { excelPivotHierarchyTool } from './pivotHierarchy.js'
export { excelSlicerTool } from './slicer.js'
export { excelCommentTool } from './comment.js'
export { excelShapeTool } from './shape.js'
export { excelRangeTool } from './range.js'
export { excelPrintTool } from './print.js'
export { excelDataValidationTool } from './dataValidation.js'
export { excelEducationTool } from './education.js'

// 导入所有工具用于统一导出
import { excelCellTool } from './cell.js'
import { excelFormatTool } from './format.js'
import { excelFormulaTool } from './formula.js'
import { excelWorksheetTool } from './worksheet.js'
import { excelWorkbookTool } from './workbook.js'
import { excelDataTool } from './data.js'
import { excelChartTool } from './chart.js'
import { excelConditionalFormatTool } from './conditionalFormat.js'
import { excelImageTool } from './image.js'
import { excelTableTool } from './table.js'
import { excelPivotTableTool } from './pivotTable.js'
import { excelPivotHierarchyTool } from './pivotHierarchy.js'
import { excelSlicerTool } from './slicer.js'
import { excelCommentTool } from './comment.js'
import { excelShapeTool } from './shape.js'
import { excelRangeTool } from './range.js'
import { excelPrintTool } from './print.js'
import { excelDataValidationTool } from './dataValidation.js'
import { excelEducationTool } from './education.js'
import type { ToolDefinition } from './types.js'

/**
 * 所有压缩后的 Excel 工具列表
 */
export const compressedExcelTools: ToolDefinition[] = [
  // 核心操作工具
  excelCellTool,        // 单元格操作 (20 actions)
  excelFormatTool,      // 格式设置 (15 actions)
  excelFormulaTool,     // 公式与计算 (15 actions)
  excelWorksheetTool,   // 工作表管理 (14 actions)
  excelWorkbookTool,    // 工作簿操作 (8 actions)
  excelDataTool,        // 数据导入导出与分析 (15 actions)

  // 图表与可视化
  excelChartTool,              // 图表操作 (10 actions)
  excelConditionalFormatTool,  // 条件格式 (9 actions)
  excelImageTool,              // 图片操作 (6 actions)

  // 表格与透视表
  excelTableTool,          // 表格操作 (14 actions)
  excelPivotTableTool,     // 数据透视表 (12 actions)
  excelPivotHierarchyTool, // 透视表层次结构 (8 actions)
  excelSlicerTool,         // 切片器 (8 actions)

  // 数据验证与批注
  excelDataValidationTool, // 数据验证 (8 actions)
  excelCommentTool,        // 批注操作 (8 actions)

  // 其他功能
  excelShapeTool,       // 形状操作 (8 actions)
  excelRangeTool,       // 区域操作 (10 actions)
  excelPrintTool,       // 打印操作 (6 actions)
  excelEducationTool    // 教育场景 (3 actions)
]

/**
 * 工具名称到工具定义的映射
 */
export const toolMap: Record<string, ToolDefinition> = Object.fromEntries(
  compressedExcelTools.map(tool => [tool.name, tool])
)

/**
 * 获取工具定义
 */
export function getTool(name: string): ToolDefinition | undefined {
  return toolMap[name]
}

/**
 * 获取所有工具名称
 */
export function getToolNames(): string[] {
  return compressedExcelTools.map(tool => tool.name)
}

/**
 * 压缩统计信息
 */
export const compressionStats = {
  originalToolCount: 140,
  compressedToolCount: compressedExcelTools.length,
  compressionRate: `${Math.round((1 - compressedExcelTools.length / 140) * 100)}%`,
  totalActions: compressedExcelTools.reduce((sum, tool) => {
    const actions = tool.metadata?.supportedActions?.length || 0
    return sum + actions
  }, 0)
}

export default compressedExcelTools
