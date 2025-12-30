/**
 * PowerPoint 批注工具
 * 使用 PowerPointApi 1.2+ 实现批注操作
 * P2 阶段功能
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 添加批注
 */
export const pptAddCommentTool: ToolDefinition = {
  name: 'ppt_add_comment',
  description: '在 PowerPoint 幻灯片中添加批注',
  category: 'comment',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: '幻灯片索引（从 1 开始）'
      },
      text: {
        type: 'string',
        description: '批注内容'
      },
      position: {
        type: 'object',
        description: '批注位置（可选）',
        properties: {
          x: {
            type: 'number',
            description: 'X 坐标（像素）'
          },
          y: {
            type: 'number',
            description: 'Y 坐标（像素）'
          }
        }
      },
      author: {
        type: 'string',
        description: '批注作者（可选）'
      }
    },
    required: ['slideIndex', 'text']
  },
  handler: async (args: any) => sendIPCCommand('ppt_add_comment', args),
  examples: [
    {
      description: '在第一张幻灯片添加批注',
      input: {
        slideIndex: 1,
        text: '这里需要添加更多数据',
        position: {
          x: 100,
          y: 100
        },
        author: '审阅者'
      },
      output: {
        success: true,
        message: '成功添加批注',
        data: {
          commentId: 'comment1'
        }
      }
    }
  ]
}

/**
 * 获取所有批注
 */
export const pptGetCommentsTool: ToolDefinition = {
  name: 'ppt_get_comments',
  description: '获取 PowerPoint 演示文稿中的所有批注',
  category: 'comment',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: '幻灯片索引（可选，不提供则获取所有幻灯片的批注）'
      },
      includeResolved: {
        type: 'boolean',
        description: '是否包含已解决的批注',
        default: false
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('ppt_get_comments', args),
  examples: [
    {
      description: '获取第一张幻灯片的所有批注',
      input: {
        slideIndex: 1,
        includeResolved: false
      },
      output: {
        success: true,
        message: '成功获取 2 条批注',
        data: {
          comments: [
            {
              id: 'comment1',
              text: '这里需要添加更多数据',
              author: '审阅者',
              date: '2024-01-01',
              slideIndex: 1,
              position: {
                x: 100,
                y: 100
              },
              resolved: false,
              replyCount: 1
            }
          ]
        }
      }
    }
  ]
}

/**
 * 获取批注详情
 */
export const pptGetCommentDetailTool: ToolDefinition = {
  name: 'ppt_get_comment_detail',
  description: '获取指定批注的详细信息',
  category: 'comment',
  application: 'powerpoint',
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
  handler: async (args: any) => sendIPCCommand('ppt_get_comment_detail', args),
  examples: [
    {
      description: '获取批注详情',
      input: {
        commentId: 'comment1'
      },
      output: {
        success: true,
        message: '成功获取批注详情',
        data: {
          id: 'comment1',
          text: '这里需要添加更多数据',
          author: '审阅者',
          date: '2024-01-01',
          slideIndex: 1,
          position: {
            x: 100,
            y: 100
          },
          resolved: false,
          replies: [
            {
              id: 'reply1',
              text: '已经补充了数据',
              author: '作者',
              date: '2024-01-02'
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
export const pptReplyCommentTool: ToolDefinition = {
  name: 'ppt_reply_comment',
  description: '回复 PowerPoint 批注',
  category: 'comment',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      commentId: {
        type: 'string',
        description: '批注 ID'
      },
      text: {
        type: 'string',
        description: '回复内容'
      },
      author: {
        type: 'string',
        description: '回复作者（可选）'
      }
    },
    required: ['commentId', 'text']
  },
  handler: async (args: any) => sendIPCCommand('ppt_reply_comment', args),
  examples: [
    {
      description: '回复批注',
      input: {
        commentId: 'comment1',
        text: '已经补充了数据',
        author: '作者'
      },
      output: {
        success: true,
        message: '成功回复批注',
        data: {
          replyId: 'reply1'
        }
      }
    }
  ]
}

/**
 * 解决批注
 */
export const pptResolveCommentTool: ToolDefinition = {
  name: 'ppt_resolve_comment',
  description: '将 PowerPoint 批注标记为已解决',
  category: 'comment',
  application: 'powerpoint',
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
  handler: async (args: any) => sendIPCCommand('ppt_resolve_comment', args),
  examples: [
    {
      description: '解决批注',
      input: {
        commentId: 'comment1'
      },
      output: {
        success: true,
        message: '成功解决批注'
      }
    }
  ]
}

/**
 * 重新打开批注
 */
export const pptReopenCommentTool: ToolDefinition = {
  name: 'ppt_reopen_comment',
  description: '重新打开已解决的 PowerPoint 批注',
  category: 'comment',
  application: 'powerpoint',
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
  handler: async (args: any) => sendIPCCommand('ppt_reopen_comment', args),
  examples: [
    {
      description: '重新打开批注',
      input: {
        commentId: 'comment1'
      },
      output: {
        success: true,
        message: '成功重新打开批注'
      }
    }
  ]
}

/**
 * 删除批注
 */
export const pptDeleteCommentTool: ToolDefinition = {
  name: 'ppt_delete_comment',
  description: '删除 PowerPoint 批注',
  category: 'comment',
  application: 'powerpoint',
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
  handler: async (args: any) => sendIPCCommand('ppt_delete_comment', args),
  examples: [
    {
      description: '删除批注',
      input: {
        commentId: 'comment1'
      },
      output: {
        success: true,
        message: '成功删除批注'
      }
    }
  ]
}

/**
 * 删除批注回复
 */
export const pptDeleteCommentReplyTool: ToolDefinition = {
  name: 'ppt_delete_comment_reply',
  description: '删除 PowerPoint 批注的回复',
  category: 'comment',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      commentId: {
        type: 'string',
        description: '批注 ID'
      },
      replyId: {
        type: 'string',
        description: '回复 ID'
      }
    },
    required: ['commentId', 'replyId']
  },
  handler: async (args: any) => sendIPCCommand('ppt_delete_comment_reply', args),
  examples: [
    {
      description: '删除批注回复',
      input: {
        commentId: 'comment1',
        replyId: 'reply1'
      },
      output: {
        success: true,
        message: '成功删除批注回复'
      }
    }
  ]
}

/**
 * 删除所有批注
 */
export const pptDeleteAllCommentsTool: ToolDefinition = {
  name: 'ppt_delete_all_comments',
  description: '删除 PowerPoint 演示文稿中的所有批注',
  category: 'comment',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: '幻灯片索引（可选，不提供则删除所有幻灯片的批注）'
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('ppt_delete_all_comments', args),
  examples: [
    {
      description: '删除第一张幻灯片的所有批注',
      input: {
        slideIndex: 1
      },
      output: {
        success: true,
        message: '成功删除 3 条批注'
      }
    }
  ]
}
