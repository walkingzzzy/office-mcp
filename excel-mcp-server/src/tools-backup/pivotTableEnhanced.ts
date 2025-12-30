/**
 * Excel 数据透视表增强工具
 * 使用 ExcelApi 1.8+ 实现数据透视表高级操作
 * P1 阶段功能
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 创建数据透视表
 */
export const excelCreatePivotTableTool: ToolDefinition = {
  name: 'excel_create_pivot_table',
  description: '在 Excel 中创建数据透视表，将原始数据转换为交互式汇总报表，支持自定义名称和位置，适用于数据分析、业务报表制作和多维度数据汇总',
  category: 'pivot_table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      sourceRange: {
        type: 'string',
        description: '源数据范围（如 A1:D100）'
      },
      destinationRange: {
        type: 'string',
        description: '目标位置（如 F1）'
      },
      pivotTableName: {
        type: 'string',
        description: '数据透视表名称（可选）'
      }
    },
    required: ['sourceRange', 'destinationRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_create_pivot_table', args),
  examples: [
    {
      description: '创建数据透视表',
      input: {
        sourceRange: 'A1:D100',
        destinationRange: 'F1',
        pivotTableName: 'SalesPivot'
      },
      output: { success: true, message: '成功创建数据透视表' }
    }
  ]
}

/**
 * 添加行字段
 */
export const excelAddPivotRowFieldTool: ToolDefinition = {
  name: 'excel_add_pivot_row_field',
  description: '向数据透视表的行区域添加字段，用于按类别组织数据，适用于产品分类、时间分组或部门划分等维度分析',
  category: 'pivot_table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      pivotTableName: {
        type: 'string',
        description: '数据透视表名称'
      },
      fieldName: {
        type: 'string',
        description: '字段名称'
      }
    },
    required: ['pivotTableName', 'fieldName']
  },
  handler: async (args: any) => sendIPCCommand('excel_add_pivot_row_field', args),
  examples: [
    {
      description: '添加行字段',
      input: {
        pivotTableName: 'SalesPivot',
        fieldName: 'Product'
      },
      output: { success: true, message: '成功添加行字段' }
    }
  ]
}

/**
 * 添加列字段
 */
export const excelAddPivotColumnFieldTool: ToolDefinition = {
  name: 'excel_add_pivot_column_field',
  description: '向数据透视表的列区域添加字段，用于横向对比不同类别的数据，适用于地区对比、月份对比或类别对比分析',
  category: 'pivot_table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      pivotTableName: {
        type: 'string',
        description: '数据透视表名称'
      },
      fieldName: {
        type: 'string',
        description: '字段名称'
      }
    },
    required: ['pivotTableName', 'fieldName']
  },
  handler: async (args: any) => sendIPCCommand('excel_add_pivot_column_field', args),
  examples: [
    {
      description: '添加列字段',
      input: {
        pivotTableName: 'SalesPivot',
        fieldName: 'Region'
      },
      output: { success: true, message: '成功添加列字段' }
    }
  ]
}

/**
 * 添加数据字段
 */
export const excelAddPivotDataFieldTool: ToolDefinition = {
  name: 'excel_add_pivot_data_field',
  description: '向数据透视表的值区域添加数值字段，支持求和、计数、平均值等汇总方式，适用于销售统计、数量统计或绩效指标计算',
  category: 'pivot_table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      pivotTableName: {
        type: 'string',
        description: '数据透视表名称'
      },
      fieldName: {
        type: 'string',
        description: '字段名称'
      },
      summarizeBy: {
        type: 'string',
        description: '汇总方式（如 Sum, Count, Average, Max, Min）',
        default: 'Sum'
      }
    },
    required: ['pivotTableName', 'fieldName']
  },
  handler: async (args: any) => sendIPCCommand('excel_add_pivot_data_field', args),
  examples: [
    {
      description: '添加求和数据字段',
      input: {
        pivotTableName: 'SalesPivot',
        fieldName: 'Sales',
        summarizeBy: 'Sum'
      },
      output: { success: true, message: '成功添加数据字段' }
    }
  ]
}

/**
 * 添加筛选字段
 */
export const excelAddPivotFilterFieldTool: ToolDefinition = {
  name: 'excel_add_pivot_filter_field',
  description: '向数据透视表添加筛选字段，用于整体数据过滤，适用于按年份、季度或地区等维度筛选数据',
  category: 'pivot_table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      pivotTableName: {
        type: 'string',
        description: '数据透视表名称'
      },
      fieldName: {
        type: 'string',
        description: '字段名称'
      }
    },
    required: ['pivotTableName', 'fieldName']
  },
  handler: async (args: any) => sendIPCCommand('excel_add_pivot_filter_field', args),
  examples: [
    {
      description: '添加筛选字段',
      input: {
        pivotTableName: 'SalesPivot',
        fieldName: 'Year'
      },
      output: { success: true, message: '成功添加筛选字段' }
    }
  ]
}

/**
 * 刷新数据透视表
 */
export const excelRefreshPivotTableTool: ToolDefinition = {
  name: 'excel_refresh_pivot_table',
  description: '更新数据透视表以反映源数据的最新变化，适用于数据更新后同步报表、定期刷新或数据修正后的更新',
  category: 'pivot_table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      pivotTableName: {
        type: 'string',
        description: '数据透视表名称'
      }
    },
    required: ['pivotTableName']
  },
  handler: async (args: any) => sendIPCCommand('excel_refresh_pivot_table', args),
  examples: [
    {
      description: '刷新数据透视表',
      input: { pivotTableName: 'SalesPivot' },
      output: { success: true, message: '成功刷新数据透视表' }
    }
  ]
}

/**
 * 删除数据透视表
 */
export const excelDeletePivotTableTool: ToolDefinition = {
  name: 'excel_delete_pivot_table',
  description: '删除指定的数据透视表及其所有数据，适用于清理工作表、重新创建报表或移除临时分析结果',
  category: 'pivot_table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      pivotTableName: {
        type: 'string',
        description: '数据透视表名称'
      }
    },
    required: ['pivotTableName']
  },
  handler: async (args: any) => sendIPCCommand('excel_delete_pivot_table', args),
  examples: [
    {
      description: '删除数据透视表',
      input: { pivotTableName: 'SalesPivot' },
      output: { success: true, message: '成功删除数据透视表' }
    }
  ]
}

/**
 * 获取数据透视表信息
 */
export const excelGetPivotTableInfoTool: ToolDefinition = {
  name: 'excel_get_pivot_table_info',
  description: '获取数据透视表的完整配置信息，包括字段布局、汇总方式和数据源，适用于报表分析、配置检查或结构文档化',
  category: 'pivot_table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      pivotTableName: {
        type: 'string',
        description: '数据透视表名称'
      }
    },
    required: ['pivotTableName']
  },
  handler: async (args: any) => sendIPCCommand('excel_get_pivot_table_info', args),
  examples: [
    {
      description: '获取数据透视表信息',
      input: { pivotTableName: 'SalesPivot' },
      output: {
        success: true,
        message: '成功获取数据透视表信息',
        data: {
          name: 'SalesPivot',
          rowFields: ['Product'],
          columnFields: ['Region'],
          dataFields: ['Sum of Sales']
        }
      }
    }
  ]
}

/**
 * 设置数据透视表样式
 */
export const excelSetPivotTableStyleTool: ToolDefinition = {
  name: 'excel_set_pivot_table_style',
  description: '更改数据透视表的视觉样式，支持多种内置样式模板，适用于美化报表外观、统一企业风格或突出重点数据',
  category: 'pivot_table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      pivotTableName: {
        type: 'string',
        description: '数据透视表名称'
      },
      style: {
        type: 'string',
        description: '样式名称（如 PivotStyleMedium2）'
      }
    },
    required: ['pivotTableName', 'style']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_pivot_table_style', args),
  examples: [
    {
      description: '设置数据透视表样式',
      input: {
        pivotTableName: 'SalesPivot',
        style: 'PivotStyleMedium2'
      },
      output: { success: true, message: '成功设置数据透视表样式' }
    }
  ]
}

/**
 * 移除数据透视表字段
 */
export const excelRemovePivotFieldTool: ToolDefinition = {
  name: 'excel_remove_pivot_field',
  description: '从数据透视表中移除指定字段，支持从行、列、值或筛选区域移除，适用于调整报表结构、简化视图或重新组织数据',
  category: 'pivot_table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      pivotTableName: {
        type: 'string',
        description: '数据透视表名称'
      },
      fieldName: {
        type: 'string',
        description: '字段名称'
      }
    },
    required: ['pivotTableName', 'fieldName']
  },
  handler: async (args: any) => sendIPCCommand('excel_remove_pivot_field', args),
  examples: [
    {
      description: '移除字段',
      input: {
        pivotTableName: 'SalesPivot',
        fieldName: 'Product'
      },
      output: { success: true, message: '成功移除字段' }
    }
  ]
}

/**
 * 获取所有数据透视表
 */
export const excelGetAllPivotTablesTool: ToolDefinition = {
  name: 'excel_get_all_pivot_tables',
  description: '获取当前工作表中所有数据透视表的列表和基本信息，适用于报表管理、批量操作或生成透视表清单',
  category: 'pivot_table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('excel_get_all_pivot_tables', args),
  examples: [
    {
      description: '获取所有数据透视表',
      input: {},
      output: {
        success: true,
        message: '成功获取 2 个数据透视表',
        data: {
          pivotTables: [
            { name: 'SalesPivot', worksheet: 'Sheet1' },
            { name: 'ProductPivot', worksheet: 'Sheet2' }
          ]
        }
      }
    }
  ]
}

/**
 * 设置数据透视表布局
 */
export const excelSetPivotTableLayoutTool: ToolDefinition = {
  name: 'excel_set_pivot_table_layout',
  description: '调整数据透视表的布局格式，支持紧凑、大纲和表格三种布局，可控制标题显示，适用于优化报表展示、满足不同查看需求或适配打印格式',
  category: 'pivot_table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      pivotTableName: {
        type: 'string',
        description: '数据透视表名称'
      },
      layoutType: {
        type: 'string',
        description: '布局类型（Compact, Outline, Tabular）',
        enum: ['Compact', 'Outline', 'Tabular']
      },
      showRowHeaders: {
        type: 'boolean',
        description: '是否显示行标题',
        default: true
      },
      showColumnHeaders: {
        type: 'boolean',
        description: '是否显示列标题',
        default: true
      }
    },
    required: ['pivotTableName', 'layoutType']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_pivot_table_layout', args),
  examples: [
    {
      description: '设置为表格布局',
      input: {
        pivotTableName: 'SalesPivot',
        layoutType: 'Tabular',
        showRowHeaders: true,
        showColumnHeaders: true
      },
      output: { success: true, message: '成功设置数据透视表布局' }
    }
  ]
}
