/**
 * word_annotation - 墨迹注释
 * 合并 6 个原工具：add, list, getDetail, delete, deleteAll, update
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'add', 'list', 'getDetail', 'delete', 'deleteAll', 'update'
] as const

export const wordAnnotationTool = createActionTool({
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
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    add: 'word_add_ink_annotation',
    list: 'word_get_ink_annotations',
    getDetail: 'word_get_ink_annotation_detail',
    delete: 'word_delete_ink_annotation',
    deleteAll: 'word_delete_all_ink_annotations',
    update: 'word_update_ink_annotation'
  },
  paramRules: {
    add: [required('strokes', 'array')],
    getDetail: [required('annotationId', 'string')],
    delete: [required('annotationId', 'string')],
    update: [required('annotationId', 'string')]
  },
  properties: {
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
  metadata: {
    version: '2.0.0',
    priority: 'P2',
    intentKeywords: ['墨迹', '注释', '手写', '绘图'],
    mergedTools: [
      'word_add_ink_annotation', 'word_get_ink_annotations',
      'word_get_ink_annotation_detail', 'word_delete_ink_annotation',
      'word_delete_all_ink_annotations', 'word_update_ink_annotation'
    ]
  },
  examples: [
    {
      description: '列出所有墨迹注释',
      input: { action: 'list' },
      output: { success: true, action: 'list', data: { annotations: [] } }
    }
  ]
})
