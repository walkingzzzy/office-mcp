/**
 * Word 书签增强工具
 * 使用 WordApi 1.4+ 实现书签操作
 * P1 阶段功能
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 创建书签
 */
export const wordCreateBookmarkTool: ToolDefinition = {
  name: 'word_create_bookmark',
  description: '在 Word 文档中创建书签',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: '书签名称（必须唯一）'
      },
      text: {
        type: 'string',
        description: '要标记为书签的文本（如果不提供，则在当前光标位置创建）'
      }
    },
    required: ['name']
  },
  handler: async (args: any) => sendIPCCommand('word_create_bookmark', args),
  examples: [
    {
      description: '在当前位置创建书签',
      input: { name: 'introduction' },
      output: { success: true, message: '成功创建书签: introduction' }
    },
    {
      description: '为指定文本创建书签',
      input: { name: 'chapter1', text: '第一章' },
      output: { success: true, message: '成功创建书签: chapter1' }
    }
  ]
}

/**
 * 删除书签
 */
export const wordDeleteBookmarkTool: ToolDefinition = {
  name: 'word_delete_bookmark',
  description: '删除 Word 文档中的书签',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: '要删除的书签名称'
      }
    },
    required: ['name']
  },
  handler: async (args: any) => sendIPCCommand('word_delete_bookmark', args),
  examples: [
    {
      description: '删除指定书签',
      input: { name: 'introduction' },
      output: { success: true, message: '成功删除书签: introduction' }
    }
  ]
}

/**
 * 获取所有书签
 */
export const wordGetBookmarksTool: ToolDefinition = {
  name: 'word_get_bookmarks',
  description: '获取 Word 文档中的所有书签列表',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_bookmarks', args),
  examples: [
    {
      description: '获取所有书签',
      input: {},
      output: {
        success: true,
        message: '成功获取 3 个书签',
        data: {
          bookmarks: [
            { name: 'introduction', text: '引言部分' },
            { name: 'chapter1', text: '第一章' },
            { name: 'conclusion', text: '结论' }
          ]
        }
      }
    }
  ]
}

/**
 * 导航到书签
 */
export const wordGoToBookmarkTool: ToolDefinition = {
  name: 'word_goto_bookmark',
  description: '导航到 Word 文档中的指定书签位置',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: '要导航到的书签名称'
      },
      select: {
        type: 'boolean',
        description: '是否选中书签内容',
        default: false
      }
    },
    required: ['name']
  },
  handler: async (args: any) => sendIPCCommand('word_goto_bookmark', args),
  examples: [
    {
      description: '导航到指定书签',
      input: { name: 'chapter1', select: false },
      output: { success: true, message: '成功导航到书签: chapter1' }
    },
    {
      description: '导航并选中书签内容',
      input: { name: 'introduction', select: true },
      output: { success: true, message: '成功导航到书签并选中内容: introduction' }
    }
  ]
}

/**
 * 更新书签内容
 */
export const wordUpdateBookmarkTool: ToolDefinition = {
  name: 'word_update_bookmark',
  description: '更新 Word 文档中书签的内容',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: '要更新的书签名称'
      },
      newText: {
        type: 'string',
        description: '新的文本内容'
      }
    },
    required: ['name', 'newText']
  },
  handler: async (args: any) => sendIPCCommand('word_update_bookmark', args),
  examples: [
    {
      description: '更新书签内容',
      input: { name: 'chapter1', newText: '第一章：新的开始' },
      output: { success: true, message: '成功更新书签内容: chapter1' }
    }
  ]
}

/**
 * 检查书签是否存在
 */
export const wordCheckBookmarkTool: ToolDefinition = {
  name: 'word_check_bookmark',
  description: '检查 Word 文档中是否存在指定书签',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: '要检查的书签名称'
      }
    },
    required: ['name']
  },
  handler: async (args: any) => sendIPCCommand('word_check_bookmark', args),
  examples: [
    {
      description: '检查书签是否存在',
      input: { name: 'chapter1' },
      output: {
        success: true,
        message: '书签存在',
        data: { exists: true, name: 'chapter1' }
      }
    }
  ]
}
