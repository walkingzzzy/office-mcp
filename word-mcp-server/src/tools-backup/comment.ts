/**
 * Word 批注工具
 * 使用 WordApi 1.4+ 实现批注操作
 * P1 阶段功能
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 添加批注
 */
export const wordAddCommentTool: ToolDefinition = {
  name: 'word_add_comment',
  description: '在 Word 文档中为选定文本或位置添加批注',
  category: 'comment',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: '要添加批注的文本（如果不提供则在当前选区添加）'
      },
      comment: {
        type: 'string',
        description: '批注内容'
      },
      author: {
        type: 'string',
        description: '批注作者（可选）'
      }
    },
    required: ['comment']
  },
  handler: async (args: any) => sendIPCCommand('word_add_comment', args),
  examples: [
    {
      description: '为选定文本添加批注',
      input: {
        text: '重要段落',
        comment: '这段需要进一步说明',
        author: '审阅者'
      },
      output: { success: true, message: '成功添加批注' }
    }
  ]
}

/**
 * 获取所有批注
 */
export const wordGetCommentsTool: ToolDefinition = {
  name: 'word_get_comments',
  description: '获取 Word 文档中的所有批注',
  category: 'comment',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      includeResolved: {
        type: 'boolean',
        description: '是否包含已解决的批注',
        default: false
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_comments', args),
  examples: [
    {
      description: '获取所有未解决的批注',
      input: { includeResolved: false },
      output: {
        success: true,
        message: '成功获取 3 条批注',
        data: {
          comments: [
            {
              id: 'comment1',
              text: '这段需要进一步说明',
              author: '审阅者',
              date: '2024-01-01',
              resolved: false
            }
          ]
        }
      }
    }
  ]
}

/**
 * 回复批注
 */
export const wordReplyCommentTool: ToolDefinition = {
  name: 'word_reply_comment',
  description: '回复 Word 文档中的批注',
  category: 'comment',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      commentId: {
        type: 'string',
        description: '批注 ID'
      },
      reply: {
        type: 'string',
        description: '回复内容'
      },
      author: {
        type: 'string',
        description: '回复作者（可选）'
      }
    },
    required: ['commentId', 'reply']
  },
  handler: async (args: any) => sendIPCCommand('word_reply_comment', args),
  examples: [
    {
      description: '回复批注',
      input: {
        commentId: 'comment1',
        reply: '已经补充说明',
        author: '作者'
      },
      output: { success: true, message: '成功回复批注' }
    }
  ]
}

/**
 * 解决批注
 */
export const wordResolveCommentTool: ToolDefinition = {
  name: 'word_resolve_comment',
  description: '将 Word 文档中的批注标记为已解决',
  category: 'comment',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      commentId: {
        type: 'string',
        description: '批注 ID'
      }
    },
    required: ['commentId']
  },
  handler: async (args: any) => sendIPCCommand('word_resolve_comment', args),
  examples: [
    {
      description: '解决批注',
      input: { commentId: 'comment1' },
      output: { success: true, message: '成功解决批注' }
    }
  ]
}

/**
 * 删除批注
 */
export const wordDeleteCommentTool: ToolDefinition = {
  name: 'word_delete_comment',
  description: '删除 Word 文档中的批注',
  category: 'comment',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      commentId: {
        type: 'string',
        description: '批注 ID'
      }
    },
    required: ['commentId']
  },
  handler: async (args: any) => sendIPCCommand('word_delete_comment', args),
  examples: [
    {
      description: '删除批注',
      input: { commentId: 'comment1' },
      output: { success: true, message: '成功删除批注' }
    }
  ]
}

/**
 * 获取批注详情
 */
export const wordGetCommentDetailTool: ToolDefinition = {
  name: 'word_get_comment_detail',
  description: '获取 Word 文档中指定批注的详细信息',
  category: 'comment',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      commentId: {
        type: 'string',
        description: '批注 ID'
      }
    },
    required: ['commentId']
  },
  handler: async (args: any) => sendIPCCommand('word_get_comment_detail', args),
  examples: [
    {
      description: '获取批注详情',
      input: { commentId: 'comment1' },
      output: {
        success: true,
        message: '成功获取批注详情',
        data: {
          id: 'comment1',
          text: '这段需要进一步说明',
          author: '审阅者',
          date: '2024-01-01',
          resolved: false,
          replies: [
            {
              text: '已经补充说明',
              author: '作者',
              date: '2024-01-02'
            }
          ]
        }
      }
    }
  ]
}
