/**
 * Excel Cell Operations - Phase 5 Implementation
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

// Cell Operations (20 tools)

export const excelSetCellValueTool: ToolDefinition = {
  name: 'excel_set_cell_value',
  description: '在Excel单元格中设置值。支持文本、数字、布尔值等多种数据类型，适用于数据录入、公式结果写入、批量数据更新等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Cell address (e.g., A1)' },
      value: { description: 'Cell value (string, number, or boolean)' }
    },
    required: ['address', 'value']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_cell_value', args)
}

export const excelGetCellValueTool: ToolDefinition = {
  name: 'excel_get_cell_value',
  description: '获取Excel单元格中的值。可以读取文本、数字、日期、布尔值等各种类型的数据，常用于数据读取、验证和后续处理',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Cell address (e.g., A1)' }
    },
    required: ['address']
  },
  handler: async (args: any) => sendIPCCommand('excel_get_cell_value', args)
}

export const excelSetRangeValuesTool: ToolDefinition = {
  name: 'excel_set_range_values',
  description: '在Excel区域中批量设置值。支持二维数组数据的高效写入，适用于批量数据导入、表格填充、报表生成等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range address (e.g., A1:C3)' },
      values: { type: 'array', description: '2D array of values' }
    },
    required: ['range', 'values']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_range_values', args)
}

export const excelGetRangeValuesTool: ToolDefinition = {
  name: 'excel_get_range_values',
  description: '从Excel区域中批量获取值。返回二维数组格式的所有单元格数据，适用于数据读取、批量处理、数据分析等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range address (e.g., A1:C3)' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_get_range_values', args)
}

export const excelClearRangeTool: ToolDefinition = {
  name: 'excel_clear_range',
  description: '清除Excel区域内容。可选择清除内容、格式或全部，适用于数据清理、重置表格、删除临时数据等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range address' },
      clearType: { type: 'string', enum: ['contents', 'formats', 'all'], default: 'contents' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_clear_range', args)
}

export const excelInsertCellsTool: ToolDefinition = {
  name: 'excel_insert_cells',
  description: '在Excel中插入单元格。可选择向下或向右移动现有单元格，适用于添加新数据、调整表格结构、插入空白行等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range to insert' },
      shift: { type: 'string', enum: ['down', 'right'], default: 'down' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_cells', args)
}

export const excelDeleteCellsTool: ToolDefinition = {
  name: 'excel_delete_cells',
  description: '删除Excel中的单元格。可选择向上或向左移动剩余单元格，适用于数据清理、删除冗余信息、调整表格布局等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range to delete' },
      shift: { type: 'string', enum: ['up', 'left'], default: 'up' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_delete_cells', args)
}

export const excelMergeCellsTool: ToolDefinition = {
  name: 'excel_merge_cells',
  description: '合并Excel单元格。将多个单元格合并为一个大单元格，常用于创建标题行、表头设计、美化报表布局等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range to merge' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_merge_cells', args)
}

export const excelUnmergeCellsTool: ToolDefinition = {
  name: 'excel_unmerge_cells',
  description: '取消合并Excel单元格。将已合并的单元格拆分为原始的独立单元格，适用于数据调整、格式重置、表格重构等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range to unmerge' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_unmerge_cells', args)
}

export const excelCopyRangeTool: ToolDefinition = {
  name: 'excel_copy_range',
  description: '复制Excel区域。将指定区域的数据和格式复制到剪贴板，适用于数据备份、快速复制、模板制作等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range to copy' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_copy_range', args)
}

export const excelCutRangeTool: ToolDefinition = {
  name: 'excel_cut_range',
  description: '剪切Excel区域。将指定区域的数据和格式剪切到剪贴板，原位置清空，适用于数据移动、结构调整、重新布局等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range to cut' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_cut_range', args)
}

export const excelPasteRangeTool: ToolDefinition = {
  name: 'excel_paste_range',
  description: '粘贴到Excel区域。可选择粘贴全部、仅值或仅格式，适用于数据复制、格式应用、选择性粘贴等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Target range' },
      pasteType: { type: 'string', enum: ['all', 'values', 'formats'], default: 'all' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_paste_range', args)
}

export const excelFindCellTool: ToolDefinition = {
  name: 'excel_find_cell',
  description: '查找包含特定值的单元格。支持大小写敏感选项，适用于数据定位、信息检索、错误查找等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      searchValue: { description: 'Value to search for' },
      range: { type: 'string', description: 'Search range (optional)' },
      matchCase: { type: 'boolean', default: false }
    },
    required: ['searchValue']
  },
  handler: async (args: any) => sendIPCCommand('excel_find_cell', args)
}

export const excelReplaceCellTool: ToolDefinition = {
  name: 'excel_replace_cell',
  description: '替换单元格值。批量查找并替换指定值，支持大小写敏感选项，适用于数据更新、批量修正、文本替换等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      findValue: { description: 'Value to find' },
      replaceValue: { description: 'Replacement value' },
      range: { type: 'string', description: 'Search range (optional)' },
      matchCase: { type: 'boolean', default: false }
    },
    required: ['findValue', 'replaceValue']
  },
  handler: async (args: any) => sendIPCCommand('excel_replace_cell', args)
}

export const excelSortRangeTool: ToolDefinition = {
  name: 'excel_sort_range',
  description: '对Excel区域进行排序。支持按指定列升序或降序排列，适用于数据整理、报表排序、统计分析等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range to sort' },
      sortColumn: { type: 'string', description: 'Column to sort by' },
      ascending: { type: 'boolean', default: true }
    },
    required: ['range', 'sortColumn']
  },
  handler: async (args: any) => sendIPCCommand('excel_sort_range', args)
}

export const excelFilterRangeTool: ToolDefinition = {
  name: 'excel_filter_range',
  description: '对Excel区域应用筛选。根据指定列和条件筛选数据，适用于数据筛选、信息过滤、报表分析等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range to filter' },
      column: { type: 'string', description: 'Filter column' },
      criteria: { description: 'Filter criteria' }
    },
    required: ['range', 'column', 'criteria']
  },
  handler: async (args: any) => sendIPCCommand('excel_filter_range', args)
}

export const excelAutofitColumnsTool: ToolDefinition = {
  name: 'excel_autofit_columns',
  description: '自动调整列宽。根据单元格内容自动调整列宽度，适用于格式美化、数据展示、报表优化等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Column range (e.g., A:C)' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_autofit_columns', args)
}

export const excelSetColumnWidthTool: ToolDefinition = {
  name: 'excel_set_column_width',
  description: '设置列宽。以磅为单位精确设置列宽度，适用于格式控制、布局设计、打印准备等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      column: { type: 'string', description: 'Column letter (e.g., A)' },
      width: { type: 'number', description: 'Width in points' }
    },
    required: ['column', 'width']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_column_width', args)
}

export const excelSetRowHeightTool: ToolDefinition = {
  name: 'excel_set_row_height',
  description: '设置行高。以磅为单位精确设置行高度，适用于格式控制、内容布局、打印设置等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      row: { type: 'number', description: 'Row number' },
      height: { type: 'number', description: 'Height in points' }
    },
    required: ['row', 'height']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_row_height', args)
}

export const excelFreezePanesTool: ToolDefinition = {
  name: 'excel_freeze_panes',
  description: '在指定单元格冻结窗格。冻结该单元格上方和左侧的区域，适用于大数据表格浏览、报表查看、数据对比等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      cell: { type: 'string', description: 'Cell to freeze at (e.g., B2)' }
    },
    required: ['cell']
  },
  handler: async (args: any) => sendIPCCommand('excel_freeze_panes', args)
}
