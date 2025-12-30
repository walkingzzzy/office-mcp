/**
 * Excel Cell Operations - Phase 5 Implementation
 */

import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '@office-mcp/shared'

// Cell Operations (20 tools)

export const excelSetCellValueTool: ToolDefinition = {
  name: 'excel_set_cell_value',
  description: 'Set value in Excel cell',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Cell address (e.g., "A1", "B2")' },
      value: { type: ['string', 'number', 'boolean'], description: 'Cell value' },
      worksheet: { type: 'string', description: 'Worksheet name (optional, uses active sheet)' }
    },
    required: ['address', 'value']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_cell_value', args)
}

export const excelGetCellValueTool: ToolDefinition = {
  name: 'excel_get_cell_value',
  description: 'Get value from Excel cell',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Cell address (e.g., "A1", "B2")' },
      worksheet: { type: 'string', description: 'Worksheet name (optional, uses active sheet)' }
    },
    required: ['address']
  },
  handler: async (args: any) => sendIPCCommand('excel_get_cell_value', args)
}

export const excelSetRangeValuesTool: ToolDefinition = {
  name: 'excel_set_range_values',
  description: 'Set values in Excel range',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range address (e.g., "A1:C3")' },
      values: { type: 'array', description: '2D array of values' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['range', 'values']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_range_values', args)
}

export const excelGetRangeValuesTool: ToolDefinition = {
  name: 'excel_get_range_values',
  description: 'Get values from Excel range',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range address (e.g., "A1:C3")' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_get_range_values', args)
}

export const excelClearCellTool: ToolDefinition = {
  name: 'excel_clear_cell',
  description: 'Clear Excel cell content',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Cell address' },
      clearType: { type: 'string', enum: ['contents', 'formats', 'all'], default: 'contents' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['address']
  },
  handler: async (args: any) => sendIPCCommand('excel_clear_cell', args)
}

export const excelClearRangeTool: ToolDefinition = {
  name: 'excel_clear_range',
  description: 'Clear Excel range content',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range address' },
      clearType: { type: 'string', enum: ['contents', 'formats', 'all'], default: 'contents' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_clear_range', args)
}

export const excelCopyCellTool: ToolDefinition = {
  name: 'excel_copy_cell',
  description: 'Copy Excel cell',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      sourceAddress: { type: 'string', description: 'Source cell address' },
      destinationAddress: { type: 'string', description: 'Destination cell address' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['sourceAddress', 'destinationAddress']
  },
  handler: async (args: any) => sendIPCCommand('excel_copy_cell', args)
}

export const excelCopyRangeTool: ToolDefinition = {
  name: 'excel_copy_range',
  description: 'Copy Excel range',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      sourceRange: { type: 'string', description: 'Source range address' },
      destinationAddress: { type: 'string', description: 'Destination start address' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['sourceRange', 'destinationAddress']
  },
  handler: async (args: any) => sendIPCCommand('excel_copy_range', args)
}

export const excelMoveCellTool: ToolDefinition = {
  name: 'excel_move_cell',
  description: 'Move Excel cell',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      sourceAddress: { type: 'string', description: 'Source cell address' },
      destinationAddress: { type: 'string', description: 'Destination cell address' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['sourceAddress', 'destinationAddress']
  },
  handler: async (args: any) => sendIPCCommand('excel_move_cell', args)
}

export const excelMoveRangeTool: ToolDefinition = {
  name: 'excel_move_range',
  description: 'Move Excel range',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      sourceRange: { type: 'string', description: 'Source range address' },
      destinationAddress: { type: 'string', description: 'Destination start address' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['sourceRange', 'destinationAddress']
  },
  handler: async (args: any) => sendIPCCommand('excel_move_range', args)
}

export const excelInsertRowTool: ToolDefinition = {
  name: 'excel_insert_row',
  description: 'Insert row in Excel worksheet',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      rowIndex: { type: 'number', description: 'Row index (1-based)' },
      count: { type: 'number', default: 1, description: 'Number of rows to insert' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['rowIndex']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_row', args)
}

export const excelInsertColumnTool: ToolDefinition = {
  name: 'excel_insert_column',
  description: 'Insert column in Excel worksheet',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      columnIndex: { type: 'number', description: 'Column index (1-based)' },
      count: { type: 'number', default: 1, description: 'Number of columns to insert' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['columnIndex']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_column', args)
}

export const excelDeleteRowTool: ToolDefinition = {
  name: 'excel_delete_row',
  description: 'Delete row from Excel worksheet',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      rowIndex: { type: 'number', description: 'Row index (1-based)' },
      count: { type: 'number', default: 1, description: 'Number of rows to delete' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['rowIndex']
  },
  handler: async (args: any) => sendIPCCommand('excel_delete_row', args)
}

export const excelDeleteColumnTool: ToolDefinition = {
  name: 'excel_delete_column',
  description: 'Delete column from Excel worksheet',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      columnIndex: { type: 'number', description: 'Column index (1-based)' },
      count: { type: 'number', default: 1, description: 'Number of columns to delete' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['columnIndex']
  },
  handler: async (args: any) => sendIPCCommand('excel_delete_column', args)
}

export const excelMergeCellsTool: ToolDefinition = {
  name: 'excel_merge_cells',
  description: 'Merge Excel cells',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range to merge (e.g., "A1:C3")' },
      across: { type: 'boolean', default: false, description: 'Merge across columns only' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_merge_cells', args)
}

export const excelUnmergeCellsTool: ToolDefinition = {
  name: 'excel_unmerge_cells',
  description: 'Unmerge Excel cells',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range to unmerge' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_unmerge_cells', args)
}

export const excelFindCellTool: ToolDefinition = {
  name: 'excel_find_cell',
  description: 'Find cell with specific value',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      searchValue: { type: 'string', description: 'Value to search for' },
      searchRange: { type: 'string', description: 'Range to search in (optional)' },
      matchCase: { type: 'boolean', default: false, description: 'Case sensitive search' },
      matchEntireCell: { type: 'boolean', default: false, description: 'Match entire cell content' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['searchValue']
  },
  handler: async (args: any) => sendIPCCommand('excel_find_cell', args)
}

export const excelReplaceCellTool: ToolDefinition = {
  name: 'excel_replace_cell',
  description: 'Replace cell values',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      searchValue: { type: 'string', description: 'Value to search for' },
      replaceValue: { type: 'string', description: 'Replacement value' },
      searchRange: { type: 'string', description: 'Range to search in (optional)' },
      replaceAll: { type: 'boolean', default: false, description: 'Replace all occurrences' },
      matchCase: { type: 'boolean', default: false, description: 'Case sensitive search' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['searchValue', 'replaceValue']
  },
  handler: async (args: any) => sendIPCCommand('excel_replace_cell', args)
}

export const excelSortRangeTool: ToolDefinition = {
  name: 'excel_sort_range',
  description: 'Sort Excel range',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range to sort' },
      sortColumn: { type: 'number', description: 'Column index to sort by (1-based)' },
      ascending: { type: 'boolean', default: true, description: 'Sort in ascending order' },
      hasHeaders: { type: 'boolean', default: false, description: 'Range has header row' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['range', 'sortColumn']
  },
  handler: async (args: any) => sendIPCCommand('excel_sort_range', args)
}

export const excelFilterRangeTool: ToolDefinition = {
  name: 'excel_filter_range',
  description: 'Apply filter to Excel range',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range to filter' },
      columnIndex: { type: 'number', description: 'Column to filter by (1-based)' },
      criteria: { type: 'string', description: 'Filter criteria' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['range', 'columnIndex', 'criteria']
  },
  handler: async (args: any) => sendIPCCommand('excel_filter_range', args)
}