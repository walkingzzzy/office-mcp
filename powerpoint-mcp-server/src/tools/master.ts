/**
 * ppt_master - 幻灯片母版管理
 * 合并 6 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'getMasters', 'getLayouts', 'apply', 'copy', 'delete', 'rename'
] as const

type MasterAction = typeof SUPPORTED_ACTIONS[number]

export const pptMasterTool: ToolDefinition = {
  name: 'ppt_master',
  description: `幻灯片母版管理工具。支持的操作(action):
- getMasters: 获取所有母版
- getLayouts: 获取母版布局 (需要 masterIndex)
- apply: 应用母版 (需要 slideIndex, masterIndex, layoutName)
- copy: 复制母版 (需要 sourceMasterIndex)
- delete: 删除母版 (需要 masterIndex)
- rename: 重命名母版 (需要 masterIndex, newName)`,
  category: 'master',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      masterIndex: {
        type: 'number',
        description: '[多个操作] 母版索引'
      },
      masterName: {
        type: 'string',
        description: '[多个操作] 母版名称'
      },
      slideIndex: {
        type: 'number',
        description: '[apply] 幻灯片索引'
      },
      layoutName: {
        type: 'string',
        description: '[apply] 布局名称'
      },
      sourceMasterIndex: {
        type: 'number',
        description: '[copy] 源母版索引'
      },
      newName: {
        type: 'string',
        description: '[rename] 新名称'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: [
      '母版', '幻灯片母版', '布局', '应用母版',
      '复制母版', '删除母版'
    ],
    mergedTools: [
      'ppt_get_slide_masters', 'ppt_get_master_layouts',
      'ppt_apply_slide_master', 'ppt_copy_slide_master',
      'ppt_delete_slide_master', 'ppt_rename_slide_master'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<MasterAction, string> = {
      getMasters: 'ppt_get_slide_masters',
      getLayouts: 'ppt_get_master_layouts',
      apply: 'ppt_apply_slide_master',
      copy: 'ppt_copy_slide_master',
      delete: 'ppt_delete_slide_master',
      rename: 'ppt_rename_slide_master'
    }

    const command = commandMap[action as MasterAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '获取所有母版',
      input: { action: 'getMasters' },
      output: { success: true, action: 'getMasters', data: { masters: [] } }
    }
  ]
}
