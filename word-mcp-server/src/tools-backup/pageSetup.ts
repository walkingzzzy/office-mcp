/**
 * Word 页面设置工具
 * 使用 Office.js API (WordApi 1.1) 实现页面设置操作
 */

import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '@office-mcp/shared'

/**
 * 设置页边距
 */
export const wordSetPageMarginsTool: ToolDefinition = {
  name: 'word_set_page_margins',
  description: '设置 Word 文档的页边距（上、下、左、右）',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      top: {
        type: 'number',
        description: '上边距（磅）',
        minimum: 0
      },
      bottom: {
        type: 'number',
        description: '下边距（磅）',
        minimum: 0
      },
      left: {
        type: 'number',
        description: '左边距（磅）',
        minimum: 0
      },
      right: {
        type: 'number',
        description: '右边距（磅）',
        minimum: 0
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_set_page_margins', args),
  examples: [
    {
      description: '设置标准页边距（上下2.54cm，左右3.18cm）',
      input: { top: 72, bottom: 72, left: 90, right: 90 },
      output: { success: true, message: '成功设置页边距' }
    }
  ]
}

/**
 * 获取页边距
 */
export const wordGetPageMarginsTool: ToolDefinition = {
  name: 'word_get_page_margins',
  description: '获取 Word 文档的页边距设置',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_page_margins', args),
  examples: [
    {
      description: '获取当前页边距',
      input: {},
      output: { success: true, data: { top: 72, bottom: 72, left: 90, right: 90 } }
    }
  ]
}

/**
 * 设置页面方向
 */
export const wordSetPageOrientationTool: ToolDefinition = {
  name: 'word_set_page_orientation',
  description: '设置 Word 文档的页面方向（横向或纵向）',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      orientation: {
        type: 'string',
        enum: ['portrait', 'landscape'],
        description: '页面方向：portrait（纵向）或 landscape（横向）'
      }
    },
    required: ['orientation']
  },
  handler: async (args: any) => sendIPCCommand('word_set_page_orientation', args),
  examples: [
    {
      description: '设置为横向',
      input: { orientation: 'landscape' },
      output: { success: true, message: '成功设置页面方向为横向' }
    }
  ]
}

/**
 * 获取页面方向
 */
export const wordGetPageOrientationTool: ToolDefinition = {
  name: 'word_get_page_orientation',
  description: '获取 Word 文档的页面方向',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_page_orientation', args),
  examples: [
    {
      description: '获取当前页面方向',
      input: {},
      output: { success: true, data: { orientation: 'portrait' } }
    }
  ]
}

/**
 * 设置页面大小
 */
export const wordSetPageSizeTool: ToolDefinition = {
  name: 'word_set_page_size',
  description: '设置 Word 文档的页面大小（宽度和高度）',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      width: {
        type: 'number',
        description: '页面宽度（磅）',
        minimum: 0
      },
      height: {
        type: 'number',
        description: '页面高度（磅）',
        minimum: 0
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_set_page_size', args),
  examples: [
    {
      description: '设置为 A4 纸张大小（210mm x 297mm）',
      input: { width: 595, height: 842 },
      output: { success: true, message: '成功设置页面大小' }
    }
  ]
}

/**
 * 获取页面大小
 */
export const wordGetPageSizeTool: ToolDefinition = {
  name: 'word_get_page_size',
  description: '获取 Word 文档的页面大小',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_page_size', args),
  examples: [
    {
      description: '获取当前页面大小',
      input: {},
      output: { success: true, data: { width: 595, height: 842 } }
    }
  ]
}
