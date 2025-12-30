/**
 * Excel Formula and Function Operations - Phase 5 Implementation
 */

import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '@office-mcp/shared'

// Formula and Function Operations (15 tools)

export const excelSetFormulaTool: ToolDefinition = {
  name: 'excel_set_formula',
  description: 'Set formula in Excel cell',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Cell address (e.g., "A1")' },
      formula: { type: 'string', description: 'Formula (e.g., "=SUM(A1:A10)")' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['address', 'formula']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_formula', args)
}

export const excelGetFormulaTool: ToolDefinition = {
  name: 'excel_get_formula',
  description: 'Get formula from Excel cell',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Cell address' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['address']
  },
  handler: async (args: any) => sendIPCCommand('excel_get_formula', args)
}

export const excelCalculateFormulaTool: ToolDefinition = {
  name: 'excel_calculate_formula',
  description: 'Force calculation of formulas',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range to calculate (optional, calculates all if not specified)' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    }
  },
  handler: async (args: any) => sendIPCCommand('excel_calculate_formula', args)
}

export const excelInsertSumTool: ToolDefinition = {
  name: 'excel_insert_sum',
  description: 'Insert SUM function',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Cell address for result' },
      range: { type: 'string', description: 'Range to sum (e.g., "A1:A10")' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['address', 'range']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_sum', args)
}

export const excelInsertAverageTool: ToolDefinition = {
  name: 'excel_insert_average',
  description: 'Insert AVERAGE function',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Cell address for result' },
      range: { type: 'string', description: 'Range to average' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['address', 'range']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_average', args)
}

export const excelInsertCountTool: ToolDefinition = {
  name: 'excel_insert_count',
  description: 'Insert COUNT function',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Cell address for result' },
      range: { type: 'string', description: 'Range to count' },
      countType: { type: 'string', enum: ['count', 'counta', 'countblank'], default: 'count' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['address', 'range']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_count', args)
}

export const excelInsertMaxTool: ToolDefinition = {
  name: 'excel_insert_max',
  description: 'Insert MAX function',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Cell address for result' },
      range: { type: 'string', description: 'Range to find maximum' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['address', 'range']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_max', args)
}

export const excelInsertMinTool: ToolDefinition = {
  name: 'excel_insert_min',
  description: 'Insert MIN function',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Cell address for result' },
      range: { type: 'string', description: 'Range to find minimum' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['address', 'range']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_min', args)
}

export const excelInsertVlookupTool: ToolDefinition = {
  name: 'excel_insert_vlookup',
  description: 'Insert VLOOKUP function',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Cell address for result' },
      lookupValue: { type: 'string', description: 'Value to lookup' },
      tableArray: { type: 'string', description: 'Table range (e.g., "A1:D10")' },
      columnIndex: { type: 'number', description: 'Column index to return (1-based)' },
      exactMatch: { type: 'boolean', default: true, description: 'Exact match (FALSE) or approximate (TRUE)' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['address', 'lookupValue', 'tableArray', 'columnIndex']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_vlookup', args)
}

export const excelInsertIfTool: ToolDefinition = {
  name: 'excel_insert_if',
  description: 'Insert IF function',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Cell address for result' },
      condition: { type: 'string', description: 'Logical condition (e.g., "A1>10")' },
      valueIfTrue: { type: 'string', description: 'Value if condition is true' },
      valueIfFalse: { type: 'string', description: 'Value if condition is false' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['address', 'condition', 'valueIfTrue', 'valueIfFalse']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_if', args)
}

export const excelInsertConcatenateTool: ToolDefinition = {
  name: 'excel_insert_concatenate',
  description: 'Insert CONCATENATE function',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Cell address for result' },
      values: { type: 'array', items: { type: 'string' }, description: 'Values to concatenate' },
      separator: { type: 'string', description: 'Separator between values (optional)' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['address', 'values']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_concatenate', args)
}

export const excelInsertDateTool: ToolDefinition = {
  name: 'excel_insert_date',
  description: 'Insert date functions (TODAY, NOW, DATE)',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Cell address for result' },
      dateFunction: { type: 'string', enum: ['today', 'now', 'date'], description: 'Date function type' },
      year: { type: 'number', description: 'Year (for DATE function)' },
      month: { type: 'number', description: 'Month (for DATE function)' },
      day: { type: 'number', description: 'Day (for DATE function)' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['address', 'dateFunction']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_date', args)
}

export const excelInsertRoundTool: ToolDefinition = {
  name: 'excel_insert_round',
  description: 'Insert ROUND function',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Cell address for result' },
      value: { type: 'string', description: 'Value or cell reference to round' },
      digits: { type: 'number', description: 'Number of decimal places' },
      roundType: { type: 'string', enum: ['round', 'roundup', 'rounddown'], default: 'round' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['address', 'value', 'digits']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_round', args)
}

export const excelInsertTextFunctionTool: ToolDefinition = {
  name: 'excel_insert_text_function',
  description: 'Insert text functions (LEFT, RIGHT, MID, LEN, UPPER, LOWER)',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Cell address for result' },
      textFunction: { type: 'string', enum: ['left', 'right', 'mid', 'len', 'upper', 'lower', 'trim'], description: 'Text function type' },
      textValue: { type: 'string', description: 'Text value or cell reference' },
      numChars: { type: 'number', description: 'Number of characters (for LEFT, RIGHT, MID)' },
      startNum: { type: 'number', description: 'Start position (for MID)' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['address', 'textFunction', 'textValue']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_text_function', args)
}

export const excelCreateNamedRangeTool: ToolDefinition = {
  name: 'excel_create_named_range',
  description: 'Create named range for use in formulas',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Name for the range' },
      range: { type: 'string', description: 'Range address (e.g., "A1:A10")' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['name', 'range']
  },
  handler: async (args: any) => sendIPCCommand('excel_create_named_range', args)
}