/**
 * word_coauthoring - 协作编辑
 * 合并 6 个原工具：getStatus, getCoauthors, getLocks, requestLock, releaseLock, syncChanges
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'getStatus', 'getCoauthors', 'getLocks',
  'requestLock', 'releaseLock', 'syncChanges'
] as const

type CoauthoringAction = typeof SUPPORTED_ACTIONS[number]

export const wordCoauthoringTool: ToolDefinition = {
  name: 'word_coauthoring',
  description: `协作编辑工具。支持的操作(action):
- getStatus: 获取协作状态
- getCoauthors: 获取协作者列表
- getLocks: 获取锁定区域
- requestLock: 请求锁定区域 (需要 range)
- releaseLock: 释放锁定 (需要 lockId)
- syncChanges: 同步更改`,
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
      range: {
        type: 'object',
        description: '[requestLock] 要锁定的范围',
        properties: {
          start: { type: 'number' },
          end: { type: 'number' }
        }
      },
      lockId: {
        type: 'string',
        description: '[releaseLock] 锁定 ID'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P2',
    intentKeywords: ['协作', '共同编辑', '锁定', '同步'],
    mergedTools: [
      'word_get_coauthoring_status', 'word_get_coauthors',
      'word_get_coauthoring_locks', 'word_request_coauthoring_lock',
      'word_release_coauthoring_lock', 'word_sync_coauthoring_changes'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<CoauthoringAction, string> = {
      getStatus: 'word_get_coauthoring_status',
      getCoauthors: 'word_get_coauthors',
      getLocks: 'word_get_coauthoring_locks',
      requestLock: 'word_request_coauthoring_lock',
      releaseLock: 'word_release_coauthoring_lock',
      syncChanges: 'word_sync_coauthoring_changes'
    }

    const command = commandMap[action as CoauthoringAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '获取协作状态',
      input: { action: 'getStatus' },
      output: { success: true, action: 'getStatus', data: { isCoauthoring: true, coauthorCount: 2 } }
    }
  ]
}
