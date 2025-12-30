/**
 * Excel 表格增强工具
 * 使用 ExcelApi 1.1+ 实现表格高级操作
 * P1 阶段功能
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 创建表格（增强版）
 */
export const excelCreateTableEnhancedTool: ToolDefinition = {
  name: 'excel_create_table_enhanced',
  description: '在 Excel 工作表中创建专业表格，支持自定义样式、标题行和筛选功能，适用于将数据区域转换为结构化表格，便于数据管理和分析',
  category: 'table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: {
        type: 'string',
        description: '表格范围（如 A1:D10）'
      },
      hasHeaders: {
        type: 'boolean',
        description: '是否包含标题行',
        default: true
      },
      tableName: {
        type: 'string',
        description: '表格名称（可选）'
      },
      tableStyle: {
        type: 'string',
        description: '表格样式（如 TableStyleMedium2）',
        default: 'TableStyleMedium2'
      },
      showFilterButton: {
        type: 'boolean',
        description: '是否显示筛选按钮',
        default: true
      }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_create_table_enhanced', args),
  examples: [
    {
      description: '创建带样式的表格',
      input: {
        range: 'A1:D10',
        hasHeaders: true,
        tableName: 'SalesData',
        tableStyle: 'TableStyleMedium2',
        showFilterButton: true
      },
      output: { success: true, message: '成功创建表格' }
    }
  ]
}

/**
 * 获取表格信息
 */
export const excelGetTableInfoTool: ToolDefinition = {
  name: 'excel_get_table_info',
  description: '获取 Excel 表格的完整信息，包括表格名称、范围、行列数、标题设置等属性，适用于检查表格状态、获取表格元数据或进行表格操作前的验证',
  category: 'table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      tableName: {
        type: 'string',
        description: '表格名称'
      }
    },
    required: ['tableName']
  },
  handler: async (args: any) => sendIPCCommand('excel_get_table_info', args),
  examples: [
    {
      description: '获取表格信息',
      input: { tableName: 'SalesData' },
      output: {
        success: true,
        message: '成功获取表格信息',
        data: {
          name: 'SalesData',
          range: 'A1:D10',
          rowCount: 10,
          columnCount: 4,
          hasHeaders: true
        }
      }
    }
  ]
}

/**
 * 添加表格列
 */
export const excelAddTableColumnTool: ToolDefinition = {
  name: 'excel_add_table_column',
  description: '向 Excel 表格中添加新列，支持指定列名、初始数据和插入位置，适用于扩展表格结构、添加计算字段或补充数据维度',
  category: 'table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      tableName: {
        type: 'string',
        description: '表格名称'
      },
      columnName: {
        type: 'string',
        description: '新列名称'
      },
      values: {
        type: 'array',
        description: '列数据（可选）',
        items: { type: 'string' }
      },
      index: {
        type: 'number',
        description: '插入位置索引（可选，默认在末尾）'
      }
    },
    required: ['tableName', 'columnName']
  },
  handler: async (args: any) => sendIPCCommand('excel_add_table_column', args),
  examples: [
    {
      description: '添加表格列',
      input: {
        tableName: 'SalesData',
        columnName: 'Total',
        values: ['100', '200', '300']
      },
      output: { success: true, message: '成功添加列' }
    }
  ]
}

/**
 * 删除表格列
 */
export const excelDeleteTableColumnTool: ToolDefinition = {
  name: 'excel_delete_table_column',
  description: '从 Excel 表格中删除指定列，支持通过列名精确定位，适用于清理冗余数据、简化表格结构或移除临时计算列',
  category: 'table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      tableName: {
        type: 'string',
        description: '表格名称'
      },
      columnName: {
        type: 'string',
        description: '要删除的列名称'
      }
    },
    required: ['tableName', 'columnName']
  },
  handler: async (args: any) => sendIPCCommand('excel_delete_table_column', args),
  examples: [
    {
      description: '删除表格列',
      input: { tableName: 'SalesData', columnName: 'Total' },
      output: { success: true, message: '成功删除列' }
    }
  ]
}

/**
 * 添加表格行
 */
export const excelAddTableRowTool: ToolDefinition = {
  name: 'excel_add_table_row',
  description: '向 Excel 表格中添加新数据行，支持指定行数据和插入位置，适用于数据录入、批量导入或在特定位置插入记录',
  category: 'table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      tableName: {
        type: 'string',
        description: '表格名称'
      },
      values: {
        type: 'array',
        description: '行数据',
        items: { type: 'string' }
      },
      index: {
        type: 'number',
        description: '插入位置索引（可选，默认在末尾）'
      }
    },
    required: ['tableName', 'values']
  },
  handler: async (args: any) => sendIPCCommand('excel_add_table_row', args),
  examples: [
    {
      description: '添加表格行',
      input: {
        tableName: 'SalesData',
        values: ['Product D', '400', '50', '20000']
      },
      output: { success: true, message: '成功添加行' }
    }
  ]
}

/**
 * 删除表格行
 */
export const excelDeleteTableRowTool: ToolDefinition = {
  name: 'excel_delete_table_row',
  description: '从 Excel 表格中删除指定索引的行，支持精确定位删除，适用于清理无效数据、移除重复记录或维护数据质量',
  category: 'table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      tableName: {
        type: 'string',
        description: '表格名称'
      },
      index: {
        type: 'number',
        description: '要删除的行索引（从0开始）'
      }
    },
    required: ['tableName', 'index']
  },
  handler: async (args: any) => sendIPCCommand('excel_delete_table_row', args),
  examples: [
    {
      description: '删除表格行',
      input: { tableName: 'SalesData', index: 2 },
      output: { success: true, message: '成功删除行' }
    }
  ]
}

/**
 * 设置表格样式
 */
export const excelSetTableStyleTool: ToolDefinition = {
  name: 'excel_set_table_style',
  description: '更改 Excel 表格的视觉样式，支持多种内置样式模板，适用于美化表格外观、统一报表风格或突出显示重要数据',
  category: 'table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      tableName: {
        type: 'string',
        description: '表格名称'
      },
      style: {
        type: 'string',
        description: '表格样式名称（如 TableStyleMedium2）'
      }
    },
    required: ['tableName', 'style']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_table_style', args),
  examples: [
    {
      description: '设置表格样式',
      input: { tableName: 'SalesData', style: 'TableStyleLight1' },
      output: { success: true, message: '成功设置表格样式' }
    }
  ]
}

/**
 * 转换表格为范围
 */
export const excelConvertTableToRangeTool: ToolDefinition = {
  name: 'excel_convert_table_to_range',
  description: '将 Excel 表格转换为普通单元格范围，移除表格特性和格式，适用于需要取消表格结构、保留数据格式或与其他数据区域合并的场景',
  category: 'table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      tableName: {
        type: 'string',
        description: '表格名称'
      }
    },
    required: ['tableName']
  },
  handler: async (args: any) => sendIPCCommand('excel_convert_table_to_range', args),
  examples: [
    {
      description: '转换表格为范围',
      input: { tableName: 'SalesData' },
      output: { success: true, message: '成功转换表格为范围' }
    }
  ]
}

/**
 * 获取表格数据
 */
export const excelGetTableDataTool: ToolDefinition = {
  name: 'excel_get_table_data',
  description: '获取 Excel 表格中的所有数据内容，支持选择是否包含标题行，适用于数据导出、批量处理或与其他系统进行数据交换',
  category: 'table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      tableName: {
        type: 'string',
        description: '表格名称'
      },
      includeHeaders: {
        type: 'boolean',
        description: '是否包含标题行',
        default: true
      }
    },
    required: ['tableName']
  },
  handler: async (args: any) => sendIPCCommand('excel_get_table_data', args),
  examples: [
    {
      description: '获取表格数据',
      input: { tableName: 'SalesData', includeHeaders: true },
      output: {
        success: true,
        message: '成功获取表格数据',
        data: {
          headers: ['Product', 'Quantity', 'Price', 'Total'],
          rows: [
            ['Product A', '100', '50', '5000'],
            ['Product B', '200', '30', '6000']
          ]
        }
      }
    }
  ]
}

/**
 * 清除表格筛选
 */
export const excelClearTableFilterTool: ToolDefinition = {
  name: 'excel_clear_table_filter',
  description: '清除 Excel 表格中所有列的筛选条件，恢复显示全部数据，适用于重置筛选状态、查看完整数据集或准备新的筛选操作',
  category: 'table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      tableName: {
        type: 'string',
        description: '表格名称'
      }
    },
    required: ['tableName']
  },
  handler: async (args: any) => sendIPCCommand('excel_clear_table_filter', args),
  examples: [
    {
      description: '清除表格筛选',
      input: { tableName: 'SalesData' },
      output: { success: true, message: '成功清除表格筛选' }
    }
  ]
}

/**
 * 显示表格汇总行
 */
export const excelShowTableTotalsTool: ToolDefinition = {
  name: 'excel_show_table_totals',
  description: '控制 Excel 表格汇总行的显示或隐藏，汇总行可用于对各列进行统计计算，适用于数据统计、快速汇总或创建报表底部总计',
  category: 'table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      tableName: {
        type: 'string',
        description: '表格名称'
      },
      show: {
        type: 'boolean',
        description: '是否显示汇总行',
        default: true
      }
    },
    required: ['tableName']
  },
  handler: async (args: any) => sendIPCCommand('excel_show_table_totals', args),
  examples: [
    {
      description: '显示表格汇总行',
      input: { tableName: 'SalesData', show: true },
      output: { success: true, message: '成功显示汇总行' }
    }
  ]
}

/**
 * 设置表格汇总行函数
 */
export const excelSetTableTotalFunctionTool: ToolDefinition = {
  name: 'excel_set_table_total_function',
  description: '为 Excel 表格汇总行的指定列设置计算函数，支持求和、平均值、计数、最大值、最小值等，适用于自动化数据统计、创建动态汇总或生成报表摘要',
  category: 'table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      tableName: {
        type: 'string',
        description: '表格名称'
      },
      columnName: {
        type: 'string',
        description: '列名称'
      },
      function: {
        type: 'string',
        description: '汇总函数（sum: 求和，average: 平均值，count: 计数，max: 最大值，min: 最小值，none: 无）',
        enum: ['sum', 'average', 'count', 'max', 'min', 'none']
      }
    },
    required: ['tableName', 'columnName', 'function']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_table_total_function', args),
  examples: [
    {
      description: '设置汇总行为求和',
      input: {
        tableName: 'SalesData',
        columnName: 'Total',
        function: 'sum'
      },
      output: { success: true, message: '成功设置汇总函数' }
    }
  ]
}

/**
 * 获取表格汇总行状态
 */
export const excelGetTableTotalsStatusTool: ToolDefinition = {
  name: 'excel_get_table_totals_status',
  description: '查询 Excel 表格汇总行的当前状态，包括是否显示以及各列的汇总函数设置，适用于检查汇总配置、验证统计设置或获取表格统计信息',
  category: 'table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      tableName: {
        type: 'string',
        description: '表格名称'
      }
    },
    required: ['tableName']
  },
  handler: async (args: any) => sendIPCCommand('excel_get_table_totals_status', args),
  examples: [
    {
      description: '获取汇总行状态',
      input: { tableName: 'SalesData' },
      output: {
        success: true,
        message: '成功获取汇总行状态',
        data: {
          showTotals: true,
          totalFunctions: {
            'Quantity': 'sum',
            'Price': 'average',
            'Total': 'sum'
          }
        }
      }
    }
  ]
}
