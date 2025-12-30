/**
 * word_conflict - 冲突解决
 * 合并 7 个原工具：getConflicts, getDetail, acceptLocal, acceptServer, merge, acceptAllLocal, acceptAllServer
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'list', 'getDetail', 'acceptLocal', 'acceptServer',
  'merge', 'acceptAllLocal', 'acceptAllServer'
] as const

type ConflictAction = typeof SUPPORTED_ACTIONS[number]

export const wordConflictTool: ToolDefinition = {
  name: 'word_conflict',
  description: `冲突解决工具。支持的操作(action):
- list: 列出所有冲突
- getDetail: 获取冲突详情 (需要 conflictId)
- acceptLocal: 接受本地版本 (需要 conflictId)
- acceptServer: 接受服务器版本 (需要 conflictId)
- merge: 合并冲突 (需要 conflictId, mergedContent)
- acceptAllLocal: 接受所有本地版本
- acceptAllServer: 接受所有服务器版本`,
  category: 'collaboration',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      conflictId: {
        type: 'string',
        description: '[多个操作] 冲突 ID'
      },
      mergedContent: {
        type: 'string',
        description: '[merge] 合并后的内容'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P2',
    intentKeywords: ['冲突', '解决冲突', '合并', '版本'],
    mergedTools: [
      'word_get_conflicts', 'word_get_conflict_detail',
      'word_accept_local_version', 'word_accept_server_version',
      'word_merge_conflict', 'word_accept_all_local_versions',
      'word_accept_all_server_versions'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<ConflictAction, string> = {
      list: 'word_get_conflicts',
      getDetail: 'word_get_conflict_detail',
      acceptLocal: 'word_accept_local_version',
      acceptServer: 'word_accept_server_version',
      merge: 'word_merge_conflict',
      acceptAllLocal: 'word_accept_all_local_versions',
      acceptAllServer: 'word_accept_all_server_versions'
    }

    const command = commandMap[action as ConflictAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '列出所有冲突',
      input: { action: 'list' },
      output: { success: true, action: 'list', data: { conflicts: [] } }
    }
  ]
}
