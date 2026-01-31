/**
 * ppt_notes - 备注管理
 * 合并 5 个原工具
 * 
 * 使用工具工厂创建，包含参数验证
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'add', 'get', 'update', 'delete', 'getAll'
] as const

export const pptNotesTool = createActionTool({
  name: 'ppt_notes',
  description: `备注管理工具。支持的操作(action):
- add: 添加备注 (需要 slideIndex, notes)
- get: 获取备注 (需要 slideIndex)
- update: 更新备注 (需要 slideIndex, notes)
- delete: 删除备注 (需要 slideIndex)
- getAll: 获取所有幻灯片备注`,
  category: 'notes',
  application: 'powerpoint',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    add: 'ppt_add_slide_notes',
    get: 'ppt_get_slide_notes',
    update: 'ppt_update_slide_notes',
    delete: 'ppt_delete_slide_notes',
    getAll: 'ppt_get_all_slide_notes'
  },
  paramRules: {
    add: [required('slideIndex', 'number'), required('notes', 'string')],
    get: [required('slideIndex', 'number')],
    update: [required('slideIndex', 'number'), required('notes', 'string')],
    delete: [required('slideIndex', 'number')],
    getAll: []
  },
  properties: {
    slideIndex: { type: 'number', description: '[add/get/update/delete] 幻灯片索引' },
    notes: { type: 'string', description: '[add/update] 备注内容' }
  },
  metadata: {
    version: '2.1.0',
    priority: 'P1',
    intentKeywords: ['备注', '演讲者备注', '添加备注', '幻灯片备注'],
    mergedTools: [
      'ppt_add_slide_notes', 'ppt_get_slide_notes',
      'ppt_update_slide_notes', 'ppt_delete_slide_notes',
      'ppt_get_all_slide_notes'
    ]
  },
  examples: [
    {
      description: '添加备注',
      input: { action: 'add', slideIndex: 1, notes: '这是演讲者备注' },
      output: { success: true, message: '成功添加备注', action: 'add' }
    }
  ]
})
