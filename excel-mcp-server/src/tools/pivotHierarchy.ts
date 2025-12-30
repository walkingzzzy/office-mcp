/**
 * excel_pivot_hierarchy - 透视表层次结构工具
 * 合并 8 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'getHierarchies', 'getItems', 'add', 'remove',
  'expand', 'collapse', 'move', 'setSort'
] as const

type PivotHierarchyAction = typeof SUPPORTED_ACTIONS[number]

export const excelPivotHierarchyTool: ToolDefinition = {
  name: 'excel_pivot_hierarchy',
  description: `透视表层次结构工具。支持的操作(action):
- getHierarchies: 获取层次结构列表 (需要 pivotTableName)
- getItems: 获取层次结构项目 (需要 pivotTableName, hierarchyName)
- add: 添加层次结构 (需要 pivotTableName, fieldName, area)
- remove: 移除层次结构 (需要 pivotTableName, hierarchyName)
- expand: 展开层次结构 (需要 pivotTableName, hierarchyName, 可选 item)
- collapse: 折叠层次结构 (需要 pivotTableName, hierarchyName, 可选 item)
- move: 移动层次结构 (需要 pivotTableName, hierarchyName, position)
- setSort: 设置排序 (需要 pivotTableName, hierarchyName, order)`,
  category: 'pivotHierarchy',
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
        description: '[所有操作] 透视表名称'
      },
      hierarchyName: {
        type: 'string',
        description: '[多个操作] 层次结构名称'
      },
      fieldName: {
        type: 'string',
        description: '[add] 字段名称'
      },
      area: {
        type: 'string',
        enum: ['row', 'column', 'filter'],
        description: '[add] 目标区域'
      },
      item: {
        type: 'string',
        description: '[expand/collapse] 特定项目'
      },
      position: {
        type: 'number',
        description: '[move] 目标位置'
      },
      order: {
        type: 'string',
        enum: ['ascending', 'descending', 'manual'],
        description: '[setSort] 排序方式'
      }
    },
    required: ['action', 'pivotTableName']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P2',
    intentKeywords: [
      '透视表层次', '层次结构', '展开', '折叠',
      '透视表排序', '透视表字段'
    ],
    mergedTools: [
      'excel_get_pivot_hierarchies', 'excel_get_pivot_hierarchy_items',
      'excel_add_pivot_hierarchy', 'excel_remove_pivot_hierarchy',
      'excel_expand_pivot_hierarchy', 'excel_collapse_pivot_hierarchy',
      'excel_move_pivot_hierarchy', 'excel_set_pivot_hierarchy_sort'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<PivotHierarchyAction, string> = {
      getHierarchies: 'excel_get_pivot_hierarchies',
      getItems: 'excel_get_pivot_hierarchy_items',
      add: 'excel_add_pivot_hierarchy',
      remove: 'excel_remove_pivot_hierarchy',
      expand: 'excel_expand_pivot_hierarchy',
      collapse: 'excel_collapse_pivot_hierarchy',
      move: 'excel_move_pivot_hierarchy',
      setSort: 'excel_set_pivot_hierarchy_sort'
    }

    const command = commandMap[action as PivotHierarchyAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '获取透视表层次结构',
      input: { action: 'getHierarchies', pivotTableName: '透视表1' },
      output: { success: true, action: 'getHierarchies', data: { hierarchies: [] } }
    }
  ]
}
