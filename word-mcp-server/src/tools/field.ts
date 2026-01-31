/**
 * word_field - 域操作
 * 合并 8 个原工具：insert, get, update, updateAll, delete, lock, unlock, getResult
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'insert', 'list', 'update', 'updateAll',
  'delete', 'lock', 'unlock', 'getResult'
] as const

export const wordFieldTool = createActionTool({
  name: 'word_field',
  description: `域操作工具。支持的操作(action):
- insert: 插入域 (需要 fieldType, 可选 fieldCode)
- list: 列出所有域
- update: 更新单个域 (需要 fieldIndex)
- updateAll: 更新所有域
- delete: 删除域 (需要 fieldIndex)
- lock: 锁定域 (需要 fieldIndex)
- unlock: 解锁域 (需要 fieldIndex)
- getResult: 获取域结果 (需要 fieldIndex)`,
  category: 'reference',
  application: 'word',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    insert: 'word_insert_field',
    list: 'word_get_fields',
    update: 'word_update_field',
    updateAll: 'word_update_all_fields',
    delete: 'word_delete_field',
    lock: 'word_lock_field',
    unlock: 'word_unlock_field',
    getResult: 'word_get_field_result'
  },
  paramRules: {
    insert: [required('fieldType', 'string')],
    update: [required('fieldIndex', 'number')],
    delete: [required('fieldIndex', 'number')],
    lock: [required('fieldIndex', 'number')],
    unlock: [required('fieldIndex', 'number')],
    getResult: [required('fieldIndex', 'number')]
  },
  properties: {
    fieldIndex: {
      type: 'number',
      description: '[多个操作] 域索引'
    },
    fieldType: {
      type: 'string',
      enum: ['DATE', 'TIME', 'PAGE', 'NUMPAGES', 'AUTHOR', 'TITLE', 'FILENAME', 'TOC', 'REF', 'SEQ'],
      description: '[insert] 域类型'
    },
    fieldCode: {
      type: 'string',
      description: '[insert] 域代码'
    }
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: ['域', '插入域', '更新域', '日期域', '页码域'],
    mergedTools: [
      'word_insert_field', 'word_get_fields', 'word_update_field',
      'word_update_all_fields', 'word_delete_field', 'word_lock_field',
      'word_unlock_field', 'word_get_field_result'
    ]
  },
  examples: [
    {
      description: '插入日期域',
      input: { action: 'insert', fieldType: 'DATE' },
      output: { success: true, message: '成功插入域', action: 'insert' }
    },
    {
      description: '更新所有域',
      input: { action: 'updateAll' },
      output: { success: true, message: '成功更新所有域', action: 'updateAll' }
    }
  ]
})
