/**
 * word_annotation - 墨迹注释
 * 合并 6 个原工具：add, list, getDetail, delete, deleteAll, update
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'add', 'list', 'getDetail', 'delete', 'deleteAll', 'update'
] as const

type AnnotationAction = typeof SUPPORTED_ACTIONS[number]

export const wordAnnotationTool: ToolDefinition = {
  name: 'word_annotation',
  description: `墨迹注释工具。支持的操作(action):
- add: 添加墨迹注释 (需要 strokes)
- list: 列出所有墨迹注释
- getDetail: 获取注释详情 (需要 annotationId)
- delete: 删除注释 (需要 annotationId)
- deleteAll: 删除所有注释
- update: 更新注释 (需要 annotationId)`,
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
      annotationId: {
        type: 'string',
        description: '[多个操作] 注释 ID'
      },
      strokes: {
        type: 'array',
        description: '[add] 墨迹笔画数据',
        items: {
          type: 'object',
          properties: {
            points: { type: 'array', items: { type: 'object' } },
            color: { type: 'string' },
            width: { type: 'number' }
          }
        }
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P2',
    intentKeywords: ['墨迹', '注释', '手写', '绘图'],
    mergedTools: [
      'word_add_ink_annotation', 'word_get_ink_annotations',
      'word_get_ink_annotation_detail', 'word_delete_ink_annotation',
      'word_delete_all_ink_annotations', 'word_update_ink_annotation'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<AnnotationAction, string> = {
      add: 'word_add_ink_annotation',
      list: 'word_get_ink_annotations',
      getDetail: 'word_get_ink_annotation_detail',
      delete: 'word_delete_ink_annotation',
      deleteAll: 'word_delete_all_ink_annotations',
      update: 'word_update_ink_annotation'
    }

    const command = commandMap[action as AnnotationAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '列出所有墨迹注释',
      input: { action: 'list' },
      output: { success: true, action: 'list', data: { annotations: [] } }
    }
  ]
}
