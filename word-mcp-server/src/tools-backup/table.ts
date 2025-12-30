/**
 * Word Table Tools - Phase 4 Implementation
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

// Table Operations (15 tools)

export const wordInsertTableTool: ToolDefinition = {
  name: 'word_insert_table',
  description: 'Insert a NEW empty table into Word document. ONLY use this when user explicitly asks to CREATE/INSERT a new table. Do NOT use for writing content to existing table cells - use word_set_cell_value instead.',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      rows: { type: 'number', minimum: 1, description: 'Number of rows' },
      columns: { type: 'number', minimum: 1, description: 'Number of columns' },
      position: { type: 'string', enum: ['cursor', 'start', 'end'], default: 'cursor' }
    },
    required: ['rows', 'columns']
  },
  metadata: {
    version: '1.0.0',
    priority: 'P0',
    intentKeywords: ['插入表格', '创建表格', '新建表格', 'insert table', 'create table', 'new table'],
    applicableFor: ['none'],
    documentTypes: ['word'],
    scenario: 'table-creation',
    contextTip: '仅用于创建新表格，不要用于向已有表格写入内容'
  },
  handler: async (args: any) => sendIPCCommand('word_insert_table', args)
}

export const wordDeleteTableTool: ToolDefinition = {
  name: 'word_delete_table',
  description: '从文档中删除指定表格。通过表格索引（从0开始）指定要删除的表格。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      tableIndex: { type: 'number', description: 'Table index (0-based)' }
    },
    required: ['tableIndex']
  },
  handler: async (args: any) => sendIPCCommand('word_delete_table', args)
}

export const wordAddRowTool: ToolDefinition = {
  name: 'word_add_row',
  description: 'Add row to table. Use position="end" or omit rowIndex to add at the end of the table (在表格末尾添加行). rowIndex=-1 also means the last row.',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      tableIndex: { type: 'number', description: 'Table index (0-based), defaults to 0', default: 0 },
      position: { type: 'string', enum: ['above', 'below', 'end'], default: 'below', description: 'Insert position: above (上方), below (下方), end (末尾)' },
      rowIndex: { type: 'number', description: 'Reference row index (0-based). Use -1 or omit for last row. Not needed if position is "end"' }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_add_row', args)
}

export const wordAddColumnTool: ToolDefinition = {
  name: 'word_add_column',
  description: '在表格中添加新列。可选择在指定列的左侧或右侧插入。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      tableIndex: { type: 'number', description: 'Table index' },
      position: { type: 'string', enum: ['left', 'right'], default: 'right' },
      columnIndex: { type: 'number', description: 'Reference column index' }
    },
    required: ['tableIndex']
  },
  handler: async (args: any) => sendIPCCommand('word_add_column', args)
}

export const wordDeleteRowTool: ToolDefinition = {
  name: 'word_delete_row',
  description: '从表格中删除指定行。通过表格索引和行索引指定要删除的行。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      tableIndex: { type: 'number', description: 'Table index' },
      rowIndex: { type: 'number', description: 'Row index to delete' }
    },
    required: ['tableIndex', 'rowIndex']
  },
  handler: async (args: any) => sendIPCCommand('word_delete_row', args)
}

export const wordDeleteColumnTool: ToolDefinition = {
  name: 'word_delete_column',
  description: '从表格中删除指定列。通过表格索引和列索引指定要删除的列。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      tableIndex: { type: 'number', description: 'Table index' },
      columnIndex: { type: 'number', description: 'Column index to delete' }
    },
    required: ['tableIndex', 'columnIndex']
  },
  handler: async (args: any) => sendIPCCommand('word_delete_column', args)
}

export const wordMergeCellsTool: ToolDefinition = {
  name: 'word_merge_cells',
  description: '合并表格单元格。指定起始行列和结束行列位置，将范围内的单元格合并为一个。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      tableIndex: { type: 'number', description: 'Table index' },
      startRow: { type: 'number', description: 'Start row index' },
      startColumn: { type: 'number', description: 'Start column index' },
      endRow: { type: 'number', description: 'End row index' },
      endColumn: { type: 'number', description: 'End column index' }
    },
    required: ['tableIndex', 'startRow', 'startColumn', 'endRow', 'endColumn']
  },
  handler: async (args: any) => sendIPCCommand('word_merge_cells', args)
}

export const wordSplitCellTool: ToolDefinition = {
  name: 'word_split_cell',
  description: '拆分表格单元格。将指定单元格拆分为多行或多列。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      tableIndex: { type: 'number', description: 'Table index' },
      rowIndex: { type: 'number', description: 'Row index' },
      columnIndex: { type: 'number', description: 'Column index' },
      rows: { type: 'number', minimum: 1, default: 1, description: 'Number of rows to split into' },
      columns: { type: 'number', minimum: 1, default: 2, description: 'Number of columns to split into' }
    },
    required: ['tableIndex', 'rowIndex', 'columnIndex']
  },
  handler: async (args: any) => sendIPCCommand('word_split_cell', args)
}

export const wordSetCellValueTool: ToolDefinition = {
  name: 'word_set_cell_value',
  description: 'Write/fill text content into an existing table cell. Use this tool when user wants to write, fill, or set content in a specific table cell (row and column). DO NOT use word_insert_table for this - that is only for creating new tables.',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      tableIndex: { type: 'number', description: 'Table index (0-based, 0 = first table, 1 = second table)', default: 0 },
      rowIndex: { type: 'number', description: 'Row index (0-based, so "第1行" = rowIndex 0, "第2行" = rowIndex 1)' },
      columnIndex: { type: 'number', description: 'Column index (0-based, so "第1列" = columnIndex 0, "第2列" = columnIndex 1)' },
      value: { type: 'string', description: 'Text content to write into the cell' }
    },
    required: ['tableIndex', 'rowIndex', 'columnIndex', 'value']
  },
  metadata: {
    version: '1.0.0',
    priority: 'P0',
    intentKeywords: ['写入', '填入', '填充', '第', '行', '列', 'cell', 'write', 'fill', '单元格', '表格内容'],
    applicableFor: ['table'],
    documentTypes: ['word'],
    scenario: 'table-cell-editing',
    contextTip: '当用户提到"在表格第X行第X列写入"时使用此工具，而非word_insert_table'
  },
  handler: async (args: any) => sendIPCCommand('word_set_cell_value', args)
}

export const wordGetCellValueTool: ToolDefinition = {
  name: 'word_get_cell_value',
  description: '获取表格单元格的内容。通过表格索引、行索引和列索引指定要获取内容的单元格。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      tableIndex: { type: 'number', description: 'Table index' },
      rowIndex: { type: 'number', description: 'Row index' },
      columnIndex: { type: 'number', description: 'Column index' }
    },
    required: ['tableIndex', 'rowIndex', 'columnIndex']
  },
  handler: async (args: any) => sendIPCCommand('word_get_cell_value', args)
}

export const wordFormatTableTool: ToolDefinition = {
  name: 'word_format_table',
  description: '设置表格外观格式。可配置表头行、汇总行、隔行变色等样式效果。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      tableIndex: { type: 'number', description: 'Table index' },
      headerRow: { type: 'boolean', description: 'Format first row as header' },
      totalRow: { type: 'boolean', description: 'Format last row as total' },
      bandedRows: { type: 'boolean', description: 'Alternate row colors' },
      bandedColumns: { type: 'boolean', description: 'Alternate column colors' }
    },
    required: ['tableIndex']
  },
  handler: async (args: any) => sendIPCCommand('word_format_table', args)
}

export const wordSetTableStyleTool: ToolDefinition = {
  name: 'word_set_table_style',
  description: '设置表格预设样式。应用 Word 内置的表格样式模板。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      tableIndex: { type: 'number', description: 'Table index' },
      styleName: { type: 'string', description: 'Table style name' }
    },
    required: ['tableIndex', 'styleName']
  },
  handler: async (args: any) => sendIPCCommand('word_set_table_style', args)
}

export const wordSetCellBorderTool: ToolDefinition = {
  name: 'word_set_cell_border',
  description: '设置单元格边框属性。可配置边框类型（全部/上/下/左/右）、样式、颜色和粗细。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      tableIndex: { type: 'number', description: 'Table index' },
      rowIndex: { type: 'number', description: 'Row index' },
      columnIndex: { type: 'number', description: 'Column index' },
      borderType: { type: 'string', enum: ['all', 'top', 'bottom', 'left', 'right'], default: 'all' },
      borderStyle: { type: 'string', enum: ['single', 'double', 'dotted', 'dashed'], default: 'single' },
      borderColor: { type: 'string', description: 'Border color (hex format)' },
      borderWidth: { type: 'number', minimum: 0.25, maximum: 6, description: 'Border width in points' }
    },
    required: ['tableIndex', 'rowIndex', 'columnIndex']
  },
  handler: async (args: any) => sendIPCCommand('word_set_cell_border', args)
}

export const wordSetCellShadingTool: ToolDefinition = {
  name: 'word_set_cell_shading',
  description: '设置单元格背景底纹。可配置背景颜色和填充图案。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      tableIndex: { type: 'number', description: 'Table index' },
      rowIndex: { type: 'number', description: 'Row index' },
      columnIndex: { type: 'number', description: 'Column index' },
      backgroundColor: { type: 'string', description: 'Background color (hex format)' },
      pattern: { type: 'string', enum: ['solid', 'clear', 'percent10', 'percent20', 'percent25'], default: 'solid' }
    },
    required: ['tableIndex', 'rowIndex', 'columnIndex', 'backgroundColor']
  },
  handler: async (args: any) => sendIPCCommand('word_set_cell_shading', args)
}

export const wordTableToTextTool: ToolDefinition = {
  name: 'word_table_to_text',
  description: '将表格转换为文本',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      tableIndex: { type: 'number', description: 'Table index' },
      separator: { type: 'string', enum: ['tab', 'comma', 'semicolon', 'space'], default: 'tab' },
      includeHeaders: { type: 'boolean', default: true, description: 'Include header row' }
    },
    required: ['tableIndex']
  },
  handler: async (args: any) => sendIPCCommand('word_table_to_text', args)
}
