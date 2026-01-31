/**
 * word_bookmark - 书签管理
 * 合并 6 个原工具：create, delete, get, goTo, update, check
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'create', 'delete', 'list', 'goTo', 'update', 'check'
] as const

export const wordBookmarkTool = createActionTool({
  name: 'word_bookmark',
  description: `书签管理工具。支持的操作(action):
- create: 创建书签 (需要 name)
- delete: 删除书签 (需要 name)
- list: 列出所有书签
- goTo: 跳转到书签 (需要 name)
- update: 更新书签内容 (需要 name, content)
- check: 检查书签是否存在 (需要 name)`,
  category: 'reference',
  application: 'word',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    create: 'word_create_bookmark',
    delete: 'word_delete_bookmark',
    list: 'word_get_bookmarks',
    goTo: 'word_go_to_bookmark',
    update: 'word_update_bookmark',
    check: 'word_check_bookmark'
  },
  paramRules: {
    create: [required('name', 'string')],
    delete: [required('name', 'string')],
    goTo: [required('name', 'string')],
    update: [required('name', 'string'), required('content', 'string')],
    check: [required('name', 'string')]
  },
  properties: {
    name: {
      type: 'string',
      description: '[多个操作] 书签名称'
    },
    content: {
      type: 'string',
      description: '[update] 新内容'
    }
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: ['书签', '创建书签', '删除书签', '跳转书签'],
    mergedTools: [
      'word_create_bookmark', 'word_delete_bookmark', 'word_get_bookmarks',
      'word_go_to_bookmark', 'word_update_bookmark', 'word_check_bookmark'
    ]
  },
  examples: [
    {
      description: '创建书签',
      input: { action: 'create', name: 'chapter1' },
      output: { success: true, message: '成功创建书签', action: 'create' }
    },
    {
      description: '列出所有书签',
      input: { action: 'list' },
      output: { success: true, action: 'list', data: ['chapter1', 'chapter2'] }
    }
  ]
})
