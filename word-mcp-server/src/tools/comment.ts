/**
 * word_comment - 批注管理
 * 合并 6 个原工具：add, get, reply, resolve, delete, getDetail
 * 
 * 使用工具工厂创建，包含参数验证
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'add', 'list', 'reply', 'resolve', 'delete', 'getDetail'
] as const

export const wordCommentTool = createActionTool({
  name: 'word_comment',
  description: `批注管理工具。支持的操作(action):
- add: 添加批注 (需要 text, 可选 author)
- list: 列出所有批注
- reply: 回复批注 (需要 commentId, text)
- resolve: 解决批注 (需要 commentId)
- delete: 删除批注 (需要 commentId)
- getDetail: 获取批注详情 (需要 commentId)`,
  category: 'collaboration',
  application: 'word',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    add: 'word_add_comment',
    list: 'word_get_comments',
    reply: 'word_reply_comment',
    resolve: 'word_resolve_comment',
    delete: 'word_delete_comment',
    getDetail: 'word_get_comment_detail'
  },
  paramRules: {
    add: [required('text', 'string')],
    list: [],
    reply: [required('commentId', 'string'), required('text', 'string')],
    resolve: [required('commentId', 'string')],
    delete: [required('commentId', 'string')],
    getDetail: [required('commentId', 'string')]
  },
  properties: {
    commentId: { type: 'string', description: '[reply/resolve/delete/getDetail] 批注 ID' },
    text: { type: 'string', description: '[add/reply] 批注内容' },
    author: { type: 'string', description: '[add] 作者名称' }
  },
  metadata: {
    version: '2.1.0',
    priority: 'P1',
    intentKeywords: ['批注', '评论', '添加批注', '回复批注', '解决批注'],
    mergedTools: [
      'word_add_comment', 'word_get_comments', 'word_reply_comment',
      'word_resolve_comment', 'word_delete_comment', 'word_get_comment_detail'
    ]
  },
  examples: [
    {
      description: '添加批注',
      input: { action: 'add', text: '请检查这段内容', author: '审阅者' },
      output: { success: true, message: '成功添加批注', action: 'add' }
    },
    {
      description: '解决批注',
      input: { action: 'resolve', commentId: 'comment-1' },
      output: { success: true, message: '成功解决批注', action: 'resolve' }
    }
  ]
})
