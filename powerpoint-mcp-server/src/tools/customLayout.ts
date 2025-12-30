/**
 * ppt_custom_layout - 自定义布局
 * 合并 7 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'create', 'getAll', 'getDetail', 'addPlaceholder',
  'delete', 'rename', 'apply'
] as const

type CustomLayoutAction = typeof SUPPORTED_ACTIONS[number]

export const pptCustomLayoutTool: ToolDefinition = {
  name: 'ppt_custom_layout',
  description: `自定义布局工具。支持的操作(action):
- create: 创建自定义布局 (需要 layoutName, 可选 basedOn)
- getAll: 获取所有自定义布局
- getDetail: 获取布局详情 (需要 layoutName 或 layoutIndex)
- addPlaceholder: 添加占位符 (需要 layoutName, placeholder)
- delete: 删除布局 (需要 layoutName 或 layoutIndex)
- rename: 重命名布局 (需要 layoutName, newName)
- apply: 应用布局 (需要 slideIndex, layoutName)`,
  category: 'customLayout',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      layoutName: {
        type: 'string',
        description: '[多个操作] 布局名称'
      },
      layoutIndex: {
        type: 'number',
        description: '[getDetail/delete] 布局索引'
      },
      basedOn: {
        type: 'string',
        description: '[create] 基于的布局'
      },
      placeholder: {
        type: 'object',
        description: '[addPlaceholder] 占位符设置',
        properties: {
          type: { type: 'string', enum: ['title', 'body', 'picture', 'chart', 'table', 'media'] },
          position: {
            type: 'object',
            properties: {
              left: { type: 'number' },
              top: { type: 'number' },
              width: { type: 'number' },
              height: { type: 'number' }
            }
          }
        }
      },
      newName: {
        type: 'string',
        description: '[rename] 新名称'
      },
      slideIndex: {
        type: 'number',
        description: '[apply] 幻灯片索引'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: [
      '自定义布局', '创建布局', '占位符', '布局模板'
    ],
    mergedTools: [
      'ppt_create_custom_layout', 'ppt_get_custom_layouts',
      'ppt_get_custom_layout_detail', 'ppt_add_placeholder_to_layout',
      'ppt_delete_custom_layout', 'ppt_rename_custom_layout',
      'ppt_apply_custom_layout'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<CustomLayoutAction, string> = {
      create: 'ppt_create_custom_layout',
      getAll: 'ppt_get_custom_layouts',
      getDetail: 'ppt_get_custom_layout_detail',
      addPlaceholder: 'ppt_add_placeholder_to_layout',
      delete: 'ppt_delete_custom_layout',
      rename: 'ppt_rename_custom_layout',
      apply: 'ppt_apply_custom_layout'
    }

    const command = commandMap[action as CustomLayoutAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '创建自定义布局',
      input: { action: 'create', layoutName: '我的布局', basedOn: 'Title and Content' },
      output: { success: true, message: '成功创建布局', action: 'create' }
    }
  ]
}
