/**
 * Excel Formatting Operations - Phase 5 Implementation
 */

import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '@office-mcp/shared'

// Formatting Operations (15 tools)

export const excelSetFontTool: ToolDefinition = {
  name: 'excel_set_font',
  description: 'Set font family for Excel range',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell or range address' },
      fontName: { type: 'string', description: 'Font family name' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['range', 'fontName']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_font', args)
}

export const excelSetFontSizeTool: ToolDefinition = {
  name: 'excel_set_font_size',
  description: 'Set font size for Excel range',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell or range address' },
      fontSize: { type: 'number', minimum: 1, maximum: 409, description: 'Font size in points' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['range', 'fontSize']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_font_size', args)
}

export const excelSetFontColorTool: ToolDefinition = {
  name: 'excel_set_font_color',
  description: 'Set font color for Excel range',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell or range address' },
      color: { type: 'string', description: 'Color in hex format (e.g., "#FF0000")' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['range', 'color']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_font_color', args)
}

export const excelSetBoldTool: ToolDefinition = {
  name: 'excel_set_bold',
  description: 'Set bold formatting for Excel range',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell or range address' },
      bold: { type: 'boolean', default: true, description: 'Apply or remove bold' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_bold', args)
}

export const excelSetItalicTool: ToolDefinition = {
  name: 'excel_set_italic',
  description: 'Set italic formatting for Excel range',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell or range address' },
      italic: { type: 'boolean', default: true, description: 'Apply or remove italic' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_italic', args)
}

export const excelSetUnderlineTool: ToolDefinition = {
  name: 'excel_set_underline',
  description: 'Set underline formatting for Excel range',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell or range address' },
      underline: { type: 'string', enum: ['none', 'single', 'double'], default: 'single' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_underline', args)
}

export const excelSetCellBackgroundTool: ToolDefinition = {
  name: 'excel_set_cell_background',
  description: 'Set background color for Excel range',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell or range address' },
      color: { type: 'string', description: 'Background color in hex format' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['range', 'color']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_cell_background', args)
}

export const excelSetBorderTool: ToolDefinition = {
  name: 'excel_set_border',
  description: 'Set border for Excel range',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell or range address' },
      borderType: { type: 'string', enum: ['all', 'outline', 'inside', 'top', 'bottom', 'left', 'right'], default: 'all' },
      borderStyle: { type: 'string', enum: ['none', 'thin', 'medium', 'thick', 'double'], default: 'thin' },
      borderColor: { type: 'string', description: 'Border color in hex format (optional)' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_border', args)
}

export const excelSetAlignmentTool: ToolDefinition = {
  name: 'excel_set_alignment',
  description: 'Set text alignment for Excel range',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell or range address' },
      horizontal: { type: 'string', enum: ['left', 'center', 'right', 'justify'], description: 'Horizontal alignment' },
      vertical: { type: 'string', enum: ['top', 'middle', 'bottom'], description: 'Vertical alignment' },
      wrapText: { type: 'boolean', description: 'Wrap text in cells' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_alignment', args)
}

export const excelSetNumberFormatTool: ToolDefinition = {
  name: 'excel_set_number_format',
  description: 'Set number format for Excel range',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell or range address' },
      format: { type: 'string', description: 'Number format code (e.g., "0.00", "$#,##0.00", "mm/dd/yyyy")' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['range', 'format']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_number_format', args)
}

export const excelSetColumnWidthTool: ToolDefinition = {
  name: 'excel_set_column_width',
  description: 'Set column width in Excel',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      column: { type: 'string', description: 'Column letter or range (e.g., "A", "A:C")' },
      width: { type: 'number', description: 'Column width in characters' },
      autoFit: { type: 'boolean', default: false, description: 'Auto-fit column width' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['column']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_column_width', args)
}

export const excelSetRowHeightTool: ToolDefinition = {
  name: 'excel_set_row_height',
  description: 'Set row height in Excel',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      row: { type: 'number', description: 'Row number or range (e.g., 1, "1:3")' },
      height: { type: 'number', description: 'Row height in points' },
      autoFit: { type: 'boolean', default: false, description: 'Auto-fit row height' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['row']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_row_height', args)
}

export const excelApplyStyleTool: ToolDefinition = {
  name: 'excel_apply_style',
  description: 'Apply predefined style to Excel range',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell or range address' },
      styleName: { type: 'string', description: 'Style name (e.g., "Heading 1", "Currency", "Percent")' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['range', 'styleName']
  },
  handler: async (args: any) => sendIPCCommand('excel_apply_style', args)
}

export const excelCopyFormatTool: ToolDefinition = {
  name: 'excel_copy_format',
  description: 'Copy formatting from one range to another',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      sourceRange: { type: 'string', description: 'Source range address' },
      destinationRange: { type: 'string', description: 'Destination range address' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['sourceRange', 'destinationRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_copy_format', args)
}

export const excelClearFormatTool: ToolDefinition = {
  name: 'excel_clear_format',
  description: 'Clear formatting from Excel range',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell or range address' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_clear_format', args)
}