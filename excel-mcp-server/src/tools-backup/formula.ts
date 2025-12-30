/**
 * Excel Formula and Function Tools - Phase 5 Implementation
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

export const excelSetFormulaTool: ToolDefinition = {
  name: 'excel_set_formula',
  description: '在单元格中设置公式。支持Excel所有内置函数和自定义公式，适用于动态计算、数据处理、自动化报表等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      cell: { type: 'string', description: 'Cell address (e.g., A1)' },
      formula: { type: 'string', description: 'Formula to set' }
    },
    required: ['cell', 'formula']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_formula', args)
}

export const excelGetFormulaTool: ToolDefinition = {
  name: 'excel_get_formula',
  description: '获取单元格中的公式。返回单元格的公式表达式而非计算结果，适用于公式审查、模板分析、调试检查等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      cell: { type: 'string', description: 'Cell address (e.g., A1)' }
    },
    required: ['cell']
  },
  handler: async (args: any) => sendIPCCommand('excel_get_formula', args)
}

export const excelCalculateTool: ToolDefinition = {
  name: 'excel_calculate',
  description: '计算工作表或工作簿。强制重新计算所有公式，适用于数据更新后刷新、批量计算、性能优化等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      scope: { type: 'string', enum: ['worksheet', 'workbook'], default: 'worksheet' }
    }
  },
  handler: async (args: any) => sendIPCCommand('excel_calculate', args)
}

export const excelInsertSumTool: ToolDefinition = {
  name: 'excel_insert_sum',
  description: '插入SUM求和函数。快速创建数值求和公式，适用于财务统计、数据汇总、总量计算等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      cell: { type: 'string', description: 'Target cell' },
      range: { type: 'string', description: 'Range to sum' }
    },
    required: ['cell', 'range']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_sum', args)
}

export const excelInsertAverageTool: ToolDefinition = {
  name: 'excel_insert_average',
  description: '插入AVERAGE平均值函数。计算数值的算术平均值，适用于统计分析、绩效评估、趋势分析等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      cell: { type: 'string', description: 'Target cell' },
      range: { type: 'string', description: 'Range to average' }
    },
    required: ['cell', 'range']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_average', args)
}

export const excelInsertCountTool: ToolDefinition = {
  name: 'excel_insert_count',
  description: '插入COUNT计数函数。统计包含数字的单元格数量，适用于数据统计、库存管理、记录计数等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      cell: { type: 'string', description: 'Target cell' },
      range: { type: 'string', description: 'Range to count' }
    },
    required: ['cell', 'range']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_count', args)
}

export const excelInsertIfTool: ToolDefinition = {
  name: 'excel_insert_if',
  description: '插入IF条件函数。根据条件返回不同值，适用于逻辑判断、分类处理、条件计算等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      cell: { type: 'string', description: 'Target cell' },
      condition: { type: 'string', description: 'Condition to test' },
      valueIfTrue: { type: 'string', description: 'Value if true' },
      valueIfFalse: { type: 'string', description: 'Value if false' }
    },
    required: ['cell', 'condition', 'valueIfTrue', 'valueIfFalse']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_if', args)
}

export const excelInsertVlookupTool: ToolDefinition = {
  name: 'excel_insert_vlookup',
  description: '插入VLOOKUP垂直查找函数。在表格首列查找并返回对应值，适用于数据匹配、信息查询、表关联等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      cell: { type: 'string', description: 'Target cell' },
      lookupValue: { type: 'string', description: 'Value to lookup' },
      tableArray: { type: 'string', description: 'Table range' },
      colIndex: { type: 'number', description: 'Column index' },
      exactMatch: { type: 'boolean', default: true }
    },
    required: ['cell', 'lookupValue', 'tableArray', 'colIndex']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_vlookup', args)
}

export const excelInsertPivotTableTool: ToolDefinition = {
  name: 'excel_insert_pivot_table',
  description: '插入数据透视表。创建交互式数据汇总表，适用于大数据分析、多维统计、动态报表等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      sourceRange: { type: 'string', description: 'Source data range' },
      destination: { type: 'string', description: 'Destination cell' }
    },
    required: ['sourceRange', 'destination']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_pivot_table', args)
}

export const excelRefreshPivotTool: ToolDefinition = {
  name: 'excel_refresh_pivot',
  description: '刷新数据透视表。更新透视表的数据源，适用于数据更新、实时报表、定期同步等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      pivotName: { type: 'string', description: 'Pivot table name' }
    },
    required: ['pivotName']
  },
  handler: async (args: any) => sendIPCCommand('excel_refresh_pivot', args)
}

export const excelDefineNameTool: ToolDefinition = {
  name: 'excel_define_name',
  description: '定义命名区域。为单元格区域创建易记的名称，适用于公式简化、模板制作、区域管理等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Name for the range' },
      range: { type: 'string', description: 'Range to name' }
    },
    required: ['name', 'range']
  },
  handler: async (args: any) => sendIPCCommand('excel_define_name', args)
}

export const excelUseNamedRangeTool: ToolDefinition = {
  name: 'excel_use_named_range',
  description: '在公式中使用命名区域。通过名称引用单元格区域，适用于公式可读性提升、模板维护、数据管理等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      cell: { type: 'string', description: 'Target cell' },
      namedRange: { type: 'string', description: 'Named range to use' },
      operation: { type: 'string', enum: ['sum', 'average', 'count'], default: 'sum' }
    },
    required: ['cell', 'namedRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_use_named_range', args)
}

export const excelArrayFormulaTool: ToolDefinition = {
  name: 'excel_array_formula',
  description: '插入数组公式。创建返回多个值的复杂计算，适用于矩阵运算、批量计算、高级分析等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Target range' },
      formula: { type: 'string', description: 'Array formula' }
    },
    required: ['range', 'formula']
  },
  handler: async (args: any) => sendIPCCommand('excel_array_formula', args)
}

export const excelDataValidationTool: ToolDefinition = {
  name: 'excel_data_validation',
  description: '添加数据验证。设置单元格输入规则和限制，适用于数据质量控制、输入规范、错误预防等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range to validate' },
      type: { type: 'string', enum: ['list', 'number', 'date', 'text'] },
      criteria: { type: 'string', description: 'Validation criteria' }
    },
    required: ['range', 'type', 'criteria']
  },
  handler: async (args: any) => sendIPCCommand('excel_data_validation', args)
}

export const excelRemoveDuplicatesTool: ToolDefinition = {
  name: 'excel_remove_duplicates',
  description: '删除重复值。根据指定列移除重复数据，适用于数据清洗、去重处理、数据整理等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Range to process' },
      columns: { type: 'array', items: { type: 'number' }, description: 'Columns to check for duplicates' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_remove_duplicates', args)
}
