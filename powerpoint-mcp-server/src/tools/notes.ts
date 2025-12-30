/**
 * ppt_notes - 备注管理
 * 合并 5 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'add', 'get', 'update', 'delete', 'getAll'
] as const

type NotesAction = typeof SUPPORTED_ACTIONS[number]

export const pptNotesTool: ToolDefinition = {
  name: 'ppt_notes',
  description: `备注管理工具。支持的操作(action):
- add: 添加备注 (需要 slideIndex, notes)
- get: 获取备注 (需要 slideIndex)
- update: 更新备注 (需要 slideIndex, notes)
- delete: 删除备注 (需要 slideIndex)
- getAll: 获取所有幻灯片备注`,
  category: 'notes',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      slideIndex: {
        type: 'number',
        description: '[add/get/update/delete] 幻灯片索引'
      },
      notes: {
        type: 'string',
        description: '[add/update] 备注内容'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: ['备注', '演讲者备注', '添加备注', '幻灯片备注'],
    mergedTools: [
      'ppt_add_slide_notes', 'ppt_get_slide_notes',
      'ppt_update_slide_notes', 'ppt_delete_slide_notes',
      'ppt_get_all_slide_notes'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<NotesAction, string> = {
      add: 'ppt_add_slide_notes',
      get: 'ppt_get_slide_notes',
      update: 'ppt_update_slide_notes',
      delete: 'ppt_delete_slide_notes',
      getAll: 'ppt_get_all_slide_notes'
    }

    const command = commandMap[action as NotesAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '添加备注',
      input: { action: 'add', slideIndex: 1, notes: '这是演讲者备注' },
      output: { success: true, message: '成功添加备注', action: 'add' }
    }
  ]
}
