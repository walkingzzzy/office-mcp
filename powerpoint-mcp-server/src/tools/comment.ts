/**
 * ppt_comment - 批注管理
 * 合并 9 个原工具
 * 
 * 使用工具工厂创建，包含参数验证
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'add', 'get', 'getDetail', 'reply', 'resolve',
  'reopen', 'delete', 'deleteReply', 'deleteAll'
] as const

export const pptCommentTool = createActionTool({
  name: 'ppt_comment',
  description: `批注管理工具。支持的操作(action):
- add: 添加批注 (需要 slideIndex, text, 可选 author, position)
- get: 获取批注列表 (需要 slideIndex)
- getDetail: 获取批注详情 (需要 slideIndex, commentId)
- reply: 回复批注 (需要 slideIndex, commentId, text)
- resolve: 解决批注 (需要 slideIndex, commentId)
- reopen: 重新打开批注 (需要 slideIndex, commentId)
- delete: 删除批注 (需要 slideIndex, commentId)
- deleteReply: 删除回复 (需要 slideIndex, commentId, replyId)
- deleteAll: 删除所有批注 (可选 slideIndex)`,
  category: 'comment',
  application: 'powerpoint',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    add: 'ppt_add_comment',
    get: 'ppt_get_comments',
    getDetail: 'ppt_get_comment_detail',
    reply: 'ppt_reply_comment',
    resolve: 'ppt_resolve_comment',
    reopen: 'ppt_reopen_comment',
    delete: 'ppt_delete_comment',
    deleteReply: 'ppt_delete_comment_reply',
    deleteAll: 'ppt_delete_all_comments'
  },
  paramRules: {
    add: [required('slideIndex', 'number'), required('text', 'string')],
    get: [required('slideIndex', 'number')],
    getDetail: [required('slideIndex', 'number'), required('commentId', 'string')],
    reply: [required('slideIndex', 'number'), required('commentId', 'string'), required('text', 'string')],
    resolve: [required('slideIndex', 'number'), required('commentId', 'string')],
    reopen: [required('slideIndex', 'number'), required('commentId', 'string')],
    delete: [required('slideIndex', 'number'), required('commentId', 'string')],
    deleteReply: [required('slideIndex', 'number'), required('commentId', 'string'), required('replyId', 'string')],
    deleteAll: []
  },
  properties: {
    slideIndex: { type: 'number', description: '[多个操作] 幻灯片索引' },
    commentId: { type: 'string', description: '[多个操作] 批注ID' },
    replyId: { type: 'string', description: '[deleteReply] 回复ID' },
    text: { type: 'string', description: '[add/reply] 批注内容' },
    author: { type: 'string', description: '[add] 作者' },
    position: { type: 'object', description: '[add] 位置', properties: { left: { type: 'number' }, top: { type: 'number' } } }
  },
  metadata: {
    version: '2.1.0',
    priority: 'P1',
    intentKeywords: ['批注', '评论', '添加批注', '回复', '解决'],
    mergedTools: [
      'ppt_add_comment', 'ppt_get_comments', 'ppt_get_comment_detail',
      'ppt_reply_comment', 'ppt_resolve_comment', 'ppt_reopen_comment',
      'ppt_delete_comment', 'ppt_delete_comment_reply', 'ppt_delete_all_comments'
    ]
  },
  examples: [
    {
      description: '添加批注',
      input: { action: 'add', slideIndex: 1, text: '请检查此内容', author: '张三' },
      output: { success: true, message: '成功添加批注', action: 'add' }
    }
  ]
})
