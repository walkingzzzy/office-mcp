/**
 * Word 页眉页脚工具 - Phase 3 Implementation
 * 支持插入和编辑页眉页脚
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

// 页眉页脚操作工具

export const wordInsertHeaderTool: ToolDefinition = {
  name: 'word_insert_header',
  description: '在 Word 文档中插入页眉',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: '页眉文本内容'
      },
      type: {
        type: 'string',
        enum: ['primary', 'firstPage', 'evenPages'],
        default: 'primary',
        description: '页眉类型：primary（主页眉）、firstPage（首页）、evenPages（偶数页）'
      },
      alignment: {
        type: 'string',
        enum: ['left', 'center', 'right'],
        default: 'center',
        description: '对齐方式'
      }
    },
    required: ['text']
  },
  handler: async (args: any) => sendIPCCommand('word_insert_header', args)
}

export const wordInsertFooterTool: ToolDefinition = {
  name: 'word_insert_footer',
  description: '在 Word 文档中插入页脚',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: '页脚文本内容'
      },
      type: {
        type: 'string',
        enum: ['primary', 'firstPage', 'evenPages'],
        default: 'primary',
        description: '页脚类型：primary（主页脚）、firstPage（首页）、evenPages（偶数页）'
      },
      alignment: {
        type: 'string',
        enum: ['left', 'center', 'right'],
        default: 'center',
        description: '对齐方式'
      }
    },
    required: ['text']
  },
  handler: async (args: any) => sendIPCCommand('word_insert_footer', args)
}

export const wordGetHeaderTool: ToolDefinition = {
  name: 'word_get_header',
  description: '获取 Word 文档的页眉内容',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['primary', 'firstPage', 'evenPages'],
        default: 'primary',
        description: '页眉类型'
      }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_get_header', args)
}

export const wordGetFooterTool: ToolDefinition = {
  name: 'word_get_footer',
  description: '获取 Word 文档的页脚内容',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['primary', 'firstPage', 'evenPages'],
        default: 'primary',
        description: '页脚类型'
      }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_get_footer', args)
}

export const wordClearHeaderTool: ToolDefinition = {
  name: 'word_clear_header',
  description: '清除 Word 文档的页眉内容',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['primary', 'firstPage', 'evenPages'],
        default: 'primary',
        description: '页眉类型'
      }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_clear_header', args)
}

export const wordClearFooterTool: ToolDefinition = {
  name: 'word_clear_footer',
  description: '清除 Word 文档的页脚内容',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['primary', 'firstPage', 'evenPages'],
        default: 'primary',
        description: '页脚类型'
      }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_clear_footer', args)
}
