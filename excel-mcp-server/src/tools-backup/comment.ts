/**
 * Excel 评论工具
 * 使用 ExcelApi 1.4+ 实现评论操作
 * P1 阶段功能
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 添加评论
 */
export const excelAddCommentTool: ToolDefinition = {
  name: 'excel_add_comment',
  description: '在 Excel 单元格中添加评论，支持指定评论内容和作者，适用于数据审核、问题标记、协作说明或添加补充信息的场景',
  category: 'comment',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      cellAddress: {
        type: 'string',
        description: '单元格地址（如 A1）'
      },
      content: {
        type: 'string',
        description: '评论内容'
      },
      author: {
        type: 'string',
        description: '评论作者（可选）'
      }
    },
    required: ['cellAddress', 'content']
  },
  handler: async (args: any) => sendIPCCommand('excel_add_comment', args),
  examples: [
    {
      description: '添加评论',
      input: {
        cellAddress: 'A1',
        content: '这个数据需要核实',
        author: '审核员'
      },
      output: { success: true, message: '成功添加评论' }
    }
  ]
}

/**
 * 获取所有评论
 */
export const excelGetCommentsTool: ToolDefinition = {
  name: 'excel_get_comments',
  description: '获取 Excel 工作表中所有评论的列表，支持筛选已解决或未解决的评论，适用于批量查看评论、生成审核报告或跟踪问题处理状态',
  category: 'comment',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      includeResolved: {
        type: 'boolean',
        description: '是否包含已解决的评论',
        default: false
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('excel_get_comments', args),
  examples: [
    {
      description: '获取所有未解决的评论',
      input: { includeResolved: false },
      output: {
        success: true,
        message: '成功获取 3 条评论',
        data: {
          comments: [
            {
              id: 'comment1',
              cellAddress: 'A1',
              content: '这个数据需要核实',
              author: '审核员',
              resolved: false
            }
          ]
        }
      }
    }
  ]
}

/**
 * 回复评论
 */
export const excelReplyCommentTool: ToolDefinition = {
  name: 'excel_reply_comment',
  description: '对 Excel 中的现有评论进行回复，支持多轮对话，适用于团队协作、问题澄清、提供补充说明或记录处理过程',
  category: 'comment',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      commentId: {
        type: 'string',
        description: '评论 ID'
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
  handler: async (args: any) => sendIPCCommand('excel_reply_comment', args),
  examples: [
    {
      description: '回复评论',
      input: {
        commentId: 'comment1',
        reply: '已经核实，数据正确',
        author: '数据员'
      },
      output: { success: true, message: '成功回复评论' }
    }
  ]
}

/**
 * 解决评论
 */
export const excelResolveCommentTool: ToolDefinition = {
  name: 'excel_resolve_comment',
  description: '将 Excel 评论标记为已解决状态，表示问题已处理或意见已采纳，适用于关闭讨论、标记完成状态或清理待办事项',
  category: 'comment',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      commentId: {
        type: 'string',
        description: '评论 ID'
      }
    },
    required: ['commentId']
  },
  handler: async (args: any) => sendIPCCommand('excel_resolve_comment', args),
  examples: [
    {
      description: '解决评论',
      input: { commentId: 'comment1' },
      output: { success: true, message: '成功解决评论' }
    }
  ]
}

/**
 * 删除评论
 */
export const excelDeleteCommentTool: ToolDefinition = {
  name: 'excel_delete_comment',
  description: '删除 Excel 中的指定评论及其所有回复，适用于清理无效评论、删除敏感信息或维护工作表整洁',
  category: 'comment',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      commentId: {
        type: 'string',
        description: '评论 ID'
      }
    },
    required: ['commentId']
  },
  handler: async (args: any) => sendIPCCommand('excel_delete_comment', args),
  examples: [
    {
      description: '删除评论',
      input: { commentId: 'comment1' },
      output: { success: true, message: '成功删除评论' }
    }
  ]
}

/**
 * 获取评论详情
 */
export const excelGetCommentDetailTool: ToolDefinition = {
  name: 'excel_get_comment_detail',
  description: '获取 Excel 评论的完整详情，包括评论内容、作者、状态及所有回复，适用于查看完整讨论历史、了解问题背景或准备回复',
  category: 'comment',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      commentId: {
        type: 'string',
        description: '评论 ID'
      }
    },
    required: ['commentId']
  },
  handler: async (args: any) => sendIPCCommand('excel_get_comment_detail', args),
  examples: [
    {
      description: '获取评论详情',
      input: { commentId: 'comment1' },
      output: {
        success: true,
        message: '成功获取评论详情',
        data: {
          id: 'comment1',
          cellAddress: 'A1',
          content: '这个数据需要核实',
          author: '审核员',
          resolved: false,
          replies: [
            {
              content: '已经核实，数据正确',
              author: '数据员'
            }
          ]
        }
      }
    }
  ]
}

/**
 * 编辑评论
 */
export const excelEditCommentTool: ToolDefinition = {
  name: 'excel_edit_comment',
  description: '修改 Excel 评论的原始内容，适用于更正错误、补充信息、更新状态或优化评论表述，保持讨论的准确性',
  category: 'comment',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      commentId: {
        type: 'string',
        description: '评论 ID'
      },
      newContent: {
        type: 'string',
        description: '新的评论内容'
      }
    },
    required: ['commentId', 'newContent']
  },
  handler: async (args: any) => sendIPCCommand('excel_edit_comment', args),
  examples: [
    {
      description: '编辑评论',
      input: {
        commentId: 'comment1',
        newContent: '这个数据已经核实过了'
      },
      output: { success: true, message: '成功编辑评论' }
    }
  ]
}

/**
 * 获取单元格评论
 */
export const excelGetCellCommentTool: ToolDefinition = {
  name: 'excel_get_cell_comment',
  description: '获取 Excel 中指定单元格的评论信息，包括评论内容、作者和回复情况，适用于快速查看单元格备注、了解数据说明或检查审核意见',
  category: 'comment',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      cellAddress: {
        type: 'string',
        description: '单元格地址（如 A1）'
      }
    },
    required: ['cellAddress']
  },
  handler: async (args: any) => sendIPCCommand('excel_get_cell_comment', args),
  examples: [
    {
      description: '获取单元格评论',
      input: { cellAddress: 'A1' },
      output: {
        success: true,
        message: '成功获取单元格评论',
        data: {
          cellAddress: 'A1',
          content: '这个数据需要核实',
          author: '审核员',
          hasReplies: true
        }
      }
    }
  ]
}
