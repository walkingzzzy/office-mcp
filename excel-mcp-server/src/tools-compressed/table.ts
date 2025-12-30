/**
 * excel_table - 表格操作
 * 合并 14 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'create', 'delete', 'resize', 'rename', 'convertToRange',
  'addRow', 'addColumn', 'deleteRow', 'deleteColumn',
  'setStyle', 'toggleHeader', 'toggleTotal', 'sort', 'filter'
] as const

type TableAction = typeof SUPPORTED_ACTIONS[number]

export const excelTableTool: ToolDefinition = {
  name: 'excel_table',
  description: `表格操作工具。支持的操作(action):
- create: 创建表格 (需要 range, 可选 name, hasHeaders)
- delete: 删除表格 (需要 tableName)
- resize: 调整表格大小 (需要 tableName, newRange)
- rename: 重命名表格 (需要 tableName, newName)
- convertToRange: 转换为普通区域 (需要 tableName)
- addRow: 添加行 (需要 tableName, 可选 position, values)
- addColumn: 添加列 (需要 tableName, 可选 position, name)
- deleteRow: 删除行 (需要 tableName, rowIndex)
- deleteColumn: 删除列 (需要 tableName, columnIndex)
- setStyle: 设置表格样式 (需要 tableName, style)
- toggleHeader: 切换标题行 (需要 tableName, show)
- toggleTotal: 切换汇总行 (需要 tableName, show)
- sort: 排序 (需要 tableName, column, 可选 ascending)
- filter: 筛选 (需要 tableName, column, criteria)`,
  category: 'table',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      tableName: {
        type: 'string',
        description: '[多个操作] 表格名称'
      },
      range: {
        type: 'string',
        description: '[create] 数据区域'
      },
      name: {
        type: 'string',
        description: '[create/addColumn] 名称'
      },
      hasHeaders: {
        type: 'boolean',
        description: '[create] 是否包含标题行',
        default: true
      },
      newRange: {
        type: 'string',
        description: '[resize] 新区域'
      },
      newName: {
        type: 'string',
        description: '[rename] 新名称'
      },
      position: {
        type: 'number',
        description: '[addRow/addColumn] 插入位置'
      },
      values: {
        type: 'array',
        description: '[addRow] 行数据'
      },
      rowIndex: {
        type: 'number',
        description: '[deleteRow] 行索引'
      },
      columnIndex: {
        type: 'number',
        description: '[deleteColumn] 列索引'
      },
      style: {
        type: 'string',
        description: '[setStyle] 表格样式名称'
      },
      show: {
        type: 'boolean',
        description: '[toggleHeader/toggleTotal] 是否显示'
      },
      column: {
        type: ['string', 'number'],
        description: '[sort/filter] 列名或索引'
      },
      ascending: {
        type: 'boolean',
        description: '[sort] 是否升序',
        default: true
      },
      criteria: {
        type: 'object',
        description: '[filter] 筛选条件'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: [
      '表格', '创建表格', '删除表格', '添加行', '添加列',
      '表格样式', '排序', '筛选', '汇总行'
    ],
    mergedTools: [
      'excel_create_table', 'excel_delete_table', 'excel_resize_table',
      'excel_rename_table', 'excel_convert_table_to_range',
      'excel_add_table_row', 'excel_add_table_column',
      'excel_delete_table_row', 'excel_delete_table_column',
      'excel_set_table_style', 'excel_toggle_table_header',
      'excel_toggle_table_total', 'excel_sort_table', 'excel_filter_table'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<TableAction, string> = {
      create: 'excel_create_table',
      delete: 'excel_delete_table',
      resize: 'excel_resize_table',
      rename: 'excel_rename_table',
      convertToRange: 'excel_convert_table_to_range',
      addRow: 'excel_add_table_row',
      addColumn: 'excel_add_table_column',
      deleteRow: 'excel_delete_table_row',
      deleteColumn: 'excel_delete_table_column',
      setStyle: 'excel_set_table_style',
      toggleHeader: 'excel_toggle_table_header',
      toggleTotal: 'excel_toggle_table_total',
      sort: 'excel_sort_table',
      filter: 'excel_filter_table'
    }

    const command = commandMap[action as TableAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '创建表格',
      input: { action: 'create', range: 'A1:D10', name: '销售数据', hasHeaders: true },
      output: { success: true, message: '成功创建表格', action: 'create' }
    }
  ]
}
