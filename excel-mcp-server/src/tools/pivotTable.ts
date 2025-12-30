/**
 * excel_pivot_table - 数据透视表操作
 * 合并 12 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'create', 'delete', 'refresh', 'addField', 'removeField',
  'moveField', 'setFieldSettings', 'addCalculatedField',
  'setLayout', 'setStyle', 'expandCollapse', 'getFields'
] as const

type PivotTableAction = typeof SUPPORTED_ACTIONS[number]

export const excelPivotTableTool: ToolDefinition = {
  name: 'excel_pivot_table',
  description: `数据透视表操作工具。支持的操作(action):
- create: 创建透视表 (需要 sourceRange, destinationCell)
- delete: 删除透视表 (需要 pivotTableName)
- refresh: 刷新透视表 (需要 pivotTableName)
- addField: 添加字段 (需要 pivotTableName, fieldName, area)
- removeField: 移除字段 (需要 pivotTableName, fieldName)
- moveField: 移动字段 (需要 pivotTableName, fieldName, toArea)
- setFieldSettings: 设置字段属性 (需要 pivotTableName, fieldName, settings)
- addCalculatedField: 添加计算字段 (需要 pivotTableName, name, formula)
- setLayout: 设置布局 (需要 pivotTableName, layout)
- setStyle: 设置样式 (需要 pivotTableName, style)
- expandCollapse: 展开/折叠 (需要 pivotTableName, expand, 可选 fieldName)
- getFields: 获取字段列表 (需要 pivotTableName)`,
  category: 'pivotTable',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      pivotTableName: {
        type: 'string',
        description: '[多个操作] 透视表名称'
      },
      sourceRange: {
        type: 'string',
        description: '[create] 源数据区域'
      },
      destinationCell: {
        type: 'string',
        description: '[create] 目标单元格'
      },
      fieldName: {
        type: 'string',
        description: '[多个操作] 字段名称'
      },
      area: {
        type: 'string',
        enum: ['row', 'column', 'value', 'filter'],
        description: '[addField] 字段区域'
      },
      toArea: {
        type: 'string',
        enum: ['row', 'column', 'value', 'filter'],
        description: '[moveField] 目标区域'
      },
      settings: {
        type: 'object',
        description: '[setFieldSettings] 字段设置',
        properties: {
          summarizeBy: { type: 'string', enum: ['sum', 'count', 'average', 'max', 'min', 'product'] },
          showAs: { type: 'string' },
          numberFormat: { type: 'string' }
        }
      },
      name: {
        type: 'string',
        description: '[addCalculatedField] 计算字段名称'
      },
      formula: {
        type: 'string',
        description: '[addCalculatedField] 计算公式'
      },
      layout: {
        type: 'string',
        enum: ['compact', 'outline', 'tabular'],
        description: '[setLayout] 布局类型'
      },
      style: {
        type: 'string',
        description: '[setStyle] 样式名称'
      },
      expand: {
        type: 'boolean',
        description: '[expandCollapse] 是否展开'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: [
      '透视表', '数据透视', '创建透视表', '刷新透视表',
      '添加字段', '计算字段', '透视表布局'
    ],
    mergedTools: [
      'excel_create_pivot_table', 'excel_delete_pivot_table',
      'excel_refresh_pivot_table', 'excel_add_pivot_field',
      'excel_remove_pivot_field', 'excel_move_pivot_field',
      'excel_set_pivot_field_settings', 'excel_add_calculated_field',
      'excel_set_pivot_layout', 'excel_set_pivot_style',
      'excel_expand_collapse_pivot', 'excel_get_pivot_fields'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<PivotTableAction, string> = {
      create: 'excel_create_pivot_table',
      delete: 'excel_delete_pivot_table',
      refresh: 'excel_refresh_pivot_table',
      addField: 'excel_add_pivot_field',
      removeField: 'excel_remove_pivot_field',
      moveField: 'excel_move_pivot_field',
      setFieldSettings: 'excel_set_pivot_field_settings',
      addCalculatedField: 'excel_add_calculated_field',
      setLayout: 'excel_set_pivot_layout',
      setStyle: 'excel_set_pivot_style',
      expandCollapse: 'excel_expand_collapse_pivot',
      getFields: 'excel_get_pivot_fields'
    }

    const command = commandMap[action as PivotTableAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '创建透视表',
      input: { action: 'create', sourceRange: 'A1:E100', destinationCell: 'G1' },
      output: { success: true, message: '成功创建透视表', action: 'create' }
    }
  ]
}
