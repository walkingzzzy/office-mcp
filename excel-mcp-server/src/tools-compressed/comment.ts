/**
 * excel_comment - 批注操作
 * 合并 8 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'add', 'edit', 'delete', 'show', 'hide',
  'reply', 'resolve', 'getAll'
] as const

type CommentAction = typeof SUPPORTED_ACTIONS[number]

export const excelCommentTool: ToolDefinition = {
  name: 'excel_comment',
  description: `批注操作工具。支持的操作(action):
- add: 添加批注 (需要 cell, text, 可选 author)
- edit: 编辑批注 (需要 cell, text)
- delete: 删除批注 (需要 cell)
- show: 显示批注 (需要 cell)
- hide: 隐藏批注 (需要 cell)
- reply: 回复批注 (需要 cell, text)
- resolve: 解决批注 (需要 cell, resolved)
- getAll: 获取所有批注 (可选 range)`,
  category: 'comment',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      cell: {
        type: 'string',
        description: '[多个操作] 单元格地址'
      },
      text: {
        type: 'string',
        description: '[add/edit/reply] 批注内容'
      },
      author: {
        type: 'string',
        description: '[add] 作者名称'
      },
      resolved: {
        type: 'boolean',
        description: '[resolve] 是否已解决'
      },
      range: {
        type: 'string',
        description: '[getAll] 区域范围'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: [
      '批注', '添加批注', '删除批注', '编辑批注',
      '回复批注', '显示批注', '隐藏批注'
    ],
    mergedTools: [
      'excel_add_comment', 'excel_edit_comment', 'excel_delete_comment',
      'excel_show_comment', 'excel_hide_comment', 'excel_reply_comment',
      'excel_resolve_comment', 'excel_get_all_comments'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<CommentAction, string> = {
      add: 'excel_add_comment',
      edit: 'excel_edit_comment',
      delete: 'excel_delete_comment',
      show: 'excel_show_comment',
      hide: 'excel_hide_comment',
      reply: 'excel_reply_comment',
      resolve: 'excel_resolve_comment',
      getAll: 'excel_get_all_comments'
    }

    const command = commandMap[action as CommentAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '添加批注',
      input: { action: 'add', cell: 'A1', text: '请检查此数据', author: '张三' },
      output: { success: true, message: '成功添加批注', action: 'add' }
    }
  ]
}
