/**
 * Excel 压缩工具索引
 * 将 162 个原工具压缩为 19 个统一工具
 *
 * 压缩统计：
 * - 原工具数：162
 * - 压缩后：19
 * - 压缩率：88.3%
 */

import type { ToolDefinition } from './types.js'

// 导入所有压缩工具
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

/**
 * 获取所有 Excel 工具（压缩版）
 * 总计 19 个工具（原 162 个）
 *
 * 注意：这是压缩版工具，使用 action 参数模式
 */
export function getExcelTools(): ToolDefinition[] {
  return [
    // 核心操作工具 (6个) - 合并约 90 个原工具
    excelCellTool,        // 单元格操作 (20 actions)
    excelFormatTool,      // 格式设置 (15 actions)
    excelFormulaTool,     // 公式与计算 (15 actions)
    excelWorksheetTool,   // 工作表管理 (14 actions)
    excelWorkbookTool,    // 工作簿操作 (8 actions)
    excelDataTool,        // 数据导入导出与分析 (15 actions)

    // 图表与可视化 (3个) - 合并约 25 个原工具
    excelChartTool,              // 图表操作 (10 actions)
    excelConditionalFormatTool,  // 条件格式 (9 actions)
    excelImageTool,              // 图片操作 (6 actions)

    // 表格与透视表 (4个) - 合并约 42 个原工具
    excelTableTool,          // 表格操作 (14 actions)
    excelPivotTableTool,     // 数据透视表 (12 actions)
    excelPivotHierarchyTool, // 透视表层次结构 (8 actions)
    excelSlicerTool,         // 切片器 (8 actions)

    // 数据验证与批注 (2个) - 合并约 16 个原工具
    excelDataValidationTool, // 数据验证 (8 actions)
    excelCommentTool,        // 批注操作 (8 actions)

    // 其他功能 (4个) - 合并约 27 个原工具
    excelShapeTool,       // 形状操作 (8 actions)
    excelRangeTool,       // 区域操作 (10 actions)
    excelPrintTool,       // 打印操作 (6 actions)
    excelEducationTool    // 教育场景 (3 actions)
  ]
}

/**
 * 工具压缩映射表
 * 用于向后兼容，将旧工具名映射到新工具
 */
export const toolCompressionMap: Record<string, { newTool: string; action: string }> = {
  // 单元格操作
  'excel_set_cell_value': { newTool: 'excel_cell', action: 'setValue' },
  'excel_get_cell_value': { newTool: 'excel_cell', action: 'getValue' },
  'excel_set_range_values': { newTool: 'excel_cell', action: 'setRangeValues' },
  'excel_get_range_values': { newTool: 'excel_cell', action: 'getRangeValues' },
  'excel_clear_range': { newTool: 'excel_cell', action: 'clearRange' },
  'excel_insert_cells': { newTool: 'excel_cell', action: 'insertCells' },
  'excel_delete_cells': { newTool: 'excel_cell', action: 'deleteCells' },
  'excel_merge_cells': { newTool: 'excel_cell', action: 'mergeCells' },
  'excel_unmerge_cells': { newTool: 'excel_cell', action: 'unmergeCells' },
  'excel_copy_range': { newTool: 'excel_cell', action: 'copyRange' },
  'excel_cut_range': { newTool: 'excel_cell', action: 'cutRange' },
  'excel_paste_range': { newTool: 'excel_cell', action: 'pasteRange' },
  'excel_find_cell': { newTool: 'excel_cell', action: 'findCell' },
  'excel_replace_cell': { newTool: 'excel_cell', action: 'replaceCell' },
  'excel_sort_range': { newTool: 'excel_cell', action: 'sortRange' },
  'excel_filter_range': { newTool: 'excel_cell', action: 'filterRange' },
  'excel_autofit_columns': { newTool: 'excel_cell', action: 'autofitColumns' },
  'excel_set_column_width': { newTool: 'excel_cell', action: 'setColumnWidth' },
  'excel_set_row_height': { newTool: 'excel_cell', action: 'setRowHeight' },
  'excel_freeze_panes': { newTool: 'excel_cell', action: 'freezePanes' },

  // 格式设置
  'excel_set_cell_format': { newTool: 'excel_format', action: 'setCellFormat' },
  'excel_set_font': { newTool: 'excel_format', action: 'setFont' },
  'excel_set_fill_color': { newTool: 'excel_format', action: 'setFillColor' },
  'excel_set_border': { newTool: 'excel_format', action: 'setBorder' },
  'excel_set_number_format': { newTool: 'excel_format', action: 'setNumberFormat' },
  'excel_set_date_format': { newTool: 'excel_format', action: 'setDateFormat' },
  'excel_conditional_format': { newTool: 'excel_format', action: 'conditionalFormat' },
  'excel_clear_format': { newTool: 'excel_format', action: 'clearFormat' },
  'excel_copy_format': { newTool: 'excel_format', action: 'copyFormat' },
  'excel_set_alignment': { newTool: 'excel_format', action: 'setAlignment' },
  'excel_set_wrap_text': { newTool: 'excel_format', action: 'setWrapText' },
  'excel_protect_sheet': { newTool: 'excel_format', action: 'protectSheet' },
  'excel_unprotect_sheet': { newTool: 'excel_format', action: 'unprotectSheet' },
  'excel_hide_columns': { newTool: 'excel_format', action: 'hideColumns' },
  'excel_unhide_columns': { newTool: 'excel_format', action: 'unhideColumns' },

  // 公式操作
  'excel_set_formula': { newTool: 'excel_formula', action: 'setFormula' },
  'excel_get_formula': { newTool: 'excel_formula', action: 'getFormula' },
  'excel_calculate': { newTool: 'excel_formula', action: 'calculate' },
  'excel_insert_sum': { newTool: 'excel_formula', action: 'insertSum' },
  'excel_insert_average': { newTool: 'excel_formula', action: 'insertAverage' },
  'excel_insert_count': { newTool: 'excel_formula', action: 'insertCount' },
  'excel_insert_if': { newTool: 'excel_formula', action: 'insertIf' },
  'excel_insert_vlookup': { newTool: 'excel_formula', action: 'insertVlookup' },
  'excel_insert_pivot_table': { newTool: 'excel_formula', action: 'insertPivotTable' },
  'excel_refresh_pivot': { newTool: 'excel_formula', action: 'refreshPivot' },
  'excel_define_name': { newTool: 'excel_formula', action: 'defineName' },
  'excel_use_named_range': { newTool: 'excel_formula', action: 'useNamedRange' },
  'excel_array_formula': { newTool: 'excel_formula', action: 'arrayFormula' },
  'excel_data_validation': { newTool: 'excel_formula', action: 'dataValidation' },
  'excel_remove_duplicates': { newTool: 'excel_formula', action: 'removeDuplicates' },

  // 工作表操作
  'excel_add_worksheet': { newTool: 'excel_worksheet', action: 'add' },
  'excel_create_worksheet': { newTool: 'excel_worksheet', action: 'create' },
  'excel_delete_worksheet': { newTool: 'excel_worksheet', action: 'delete' },
  'excel_rename_worksheet': { newTool: 'excel_worksheet', action: 'rename' },
  'excel_copy_worksheet': { newTool: 'excel_worksheet', action: 'copy' },
  'excel_move_worksheet': { newTool: 'excel_worksheet', action: 'move' },
  'excel_hide_worksheet': { newTool: 'excel_worksheet', action: 'hide' },
  'excel_unhide_worksheet': { newTool: 'excel_worksheet', action: 'unhide' },
  'excel_show_worksheet': { newTool: 'excel_worksheet', action: 'show' },
  'excel_protect_workbook': { newTool: 'excel_worksheet', action: 'protectWorkbook' },
  'excel_protect_worksheet': { newTool: 'excel_worksheet', action: 'protect' },
  'excel_unprotect_worksheet': { newTool: 'excel_worksheet', action: 'unprotect' },
  'excel_get_sheet_names': { newTool: 'excel_worksheet', action: 'getSheetNames' },
  'excel_activate_worksheet': { newTool: 'excel_worksheet', action: 'activate' },

  // 图表操作
  'excel_insert_chart': { newTool: 'excel_chart', action: 'insert' },
  'excel_update_chart': { newTool: 'excel_chart', action: 'update' },
  'excel_delete_chart': { newTool: 'excel_chart', action: 'delete' },
  'excel_set_chart_type': { newTool: 'excel_chart', action: 'setType' },
  'excel_set_chart_title': { newTool: 'excel_chart', action: 'setTitle' },
  'excel_set_axis_title': { newTool: 'excel_chart', action: 'setAxisTitle' },
  'excel_add_chart_series': { newTool: 'excel_chart', action: 'addSeries' },
  'excel_format_chart': { newTool: 'excel_chart', action: 'format' },
  'excel_move_chart': { newTool: 'excel_chart', action: 'move' },
  'excel_export_chart': { newTool: 'excel_chart', action: 'export' }

  // ... 更多映射可按需添加
}

// 导出所有工具定义
export {
  excelCellTool,
  excelFormatTool,
  excelFormulaTool,
  excelWorksheetTool,
  excelWorkbookTool,
  excelDataTool,
  excelChartTool,
  excelConditionalFormatTool,
  excelImageTool,
  excelTableTool,
  excelPivotTableTool,
  excelPivotHierarchyTool,
  excelSlicerTool,
  excelCommentTool,
  excelShapeTool,
  excelRangeTool,
  excelPrintTool,
  excelDataValidationTool,
  excelEducationTool
}

// 导出类型
export type { ToolDefinition, ToolCategory, ApplicationType } from './types.js'

// 兼容别名：保留原压缩函数名以便向后兼容
export const getExcelToolsCompressed = getExcelTools

/**
 * 所有压缩后的 Excel 工具列表（别名）
 */
export const compressedExcelTools = getExcelTools()

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
  originalToolCount: 162,
  compressedToolCount: compressedExcelTools.length,
  compressionRate: `${Math.round((1 - compressedExcelTools.length / 162) * 100)}%`,
  totalActions: compressedExcelTools.reduce((sum, tool) => {
    const actions = tool.metadata?.supportedActions?.length || 0
    return sum + actions
  }, 0)
}

export default compressedExcelTools
