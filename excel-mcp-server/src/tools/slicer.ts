/**
 * excel_slicer - 切片器操作
 * 合并 8 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'add', 'delete', 'setPosition', 'setSize',
  'setStyle', 'selectItems', 'clearFilter', 'getItems'
] as const

type SlicerAction = typeof SUPPORTED_ACTIONS[number]

export const excelSlicerTool: ToolDefinition = {
  name: 'excel_slicer',
  description: `切片器操作工具。支持的操作(action):
- add: 添加切片器 (需要 pivotTableName, fieldName, 可选 position)
- delete: 删除切片器 (需要 slicerName)
- setPosition: 设置位置 (需要 slicerName, left, top)
- setSize: 设置大小 (需要 slicerName, width, height)
- setStyle: 设置样式 (需要 slicerName, style)
- selectItems: 选择项目 (需要 slicerName, items)
- clearFilter: 清除筛选 (需要 slicerName)
- getItems: 获取项目列表 (需要 slicerName)`,
  category: 'slicer',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      slicerName: {
        type: 'string',
        description: '[多个操作] 切片器名称'
      },
      pivotTableName: {
        type: 'string',
        description: '[add] 透视表名称'
      },
      fieldName: {
        type: 'string',
        description: '[add] 字段名称'
      },
      position: {
        type: 'object',
        description: '[add/setPosition] 位置',
        properties: {
          left: { type: 'number' },
          top: { type: 'number' }
        }
      },
      left: {
        type: 'number',
        description: '[setPosition] 左边距'
      },
      top: {
        type: 'number',
        description: '[setPosition] 上边距'
      },
      width: {
        type: 'number',
        description: '[setSize] 宽度'
      },
      height: {
        type: 'number',
        description: '[setSize] 高度'
      },
      style: {
        type: 'string',
        description: '[setStyle] 样式名称'
      },
      items: {
        type: 'array',
        items: { type: 'string' },
        description: '[selectItems] 要选择的项目'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: [
      '切片器', '添加切片器', '删除切片器',
      '切片器筛选', '切片器样式'
    ],
    mergedTools: [
      'excel_add_slicer', 'excel_delete_slicer',
      'excel_set_slicer_position', 'excel_set_slicer_size',
      'excel_set_slicer_style', 'excel_select_slicer_items',
      'excel_clear_slicer_filter', 'excel_get_slicer_items'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<SlicerAction, string> = {
      add: 'excel_add_slicer',
      delete: 'excel_delete_slicer',
      setPosition: 'excel_set_slicer_position',
      setSize: 'excel_set_slicer_size',
      setStyle: 'excel_set_slicer_style',
      selectItems: 'excel_select_slicer_items',
      clearFilter: 'excel_clear_slicer_filter',
      getItems: 'excel_get_slicer_items'
    }

    const command = commandMap[action as SlicerAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '添加切片器',
      input: { action: 'add', pivotTableName: '透视表1', fieldName: '产品类别' },
      output: { success: true, message: '成功添加切片器', action: 'add' }
    }
  ]
}
