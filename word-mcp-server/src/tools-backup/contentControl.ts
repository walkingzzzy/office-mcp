/**
 * Word 内容控件工具
 * 使用 Office.js API (WordApi 1.1) 实现内容控件操作
 */

import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '@office-mcp/shared'

/**
 * 插入内容控件
 */
export const wordInsertContentControlTool: ToolDefinition = {
  name: 'word_insert_content_control',
  description: '在 Word 文档中插入内容控件',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['richText', 'plainText', 'picture', 'comboBox', 'dropDownList', 'datePicker', 'checkBox'],
        description: '内容控件类型',
        default: 'richText'
      },
      tag: {
        type: 'string',
        description: '内容控件标签（用于标识）'
      },
      title: {
        type: 'string',
        description: '内容控件标题'
      },
      placeholderText: {
        type: 'string',
        description: '占位符文本'
      },
      text: {
        type: 'string',
        description: '初始文本内容'
      },
      appearance: {
        type: 'string',
        enum: ['boundingBox', 'tags', 'hidden'],
        description: '外观样式',
        default: 'boundingBox'
      },
      cannotDelete: {
        type: 'boolean',
        description: '是否禁止删除',
        default: false
      },
      cannotEdit: {
        type: 'boolean',
        description: '是否禁止编辑',
        default: false
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_insert_content_control', args),
  examples: [
    {
      description: '插入富文本内容控件',
      input: { type: 'richText', tag: 'author', title: '作者', placeholderText: '请输入作者姓名' },
      output: { success: true, message: '成功插入内容控件' }
    }
  ]
}

/**
 * 获取所有内容控件
 */
export const wordGetContentControlsTool: ToolDefinition = {
  name: 'word_get_content_controls',
  description: '获取 Word 文档中的所有内容控件',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      tag: {
        type: 'string',
        description: '按标签筛选（可选）'
      },
      title: {
        type: 'string',
        description: '按标题筛选（可选）'
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_content_controls', args),
  examples: [
    {
      description: '获取所有内容控件',
      input: {},
      output: { success: true, data: { controls: [] } }
    },
    {
      description: '按标签获取内容控件',
      input: { tag: 'author' },
      output: { success: true, data: { controls: [] } }
    }
  ]
}

/**
 * 设置内容控件的值
 */
export const wordSetContentControlValueTool: ToolDefinition = {
  name: 'word_set_content_control_value',
  description: '设置 Word 文档中内容控件的值',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      tag: {
        type: 'string',
        description: '内容控件标签'
      },
      title: {
        type: 'string',
        description: '内容控件标题'
      },
      text: {
        type: 'string',
        description: '要设置的文本内容'
      },
      html: {
        type: 'string',
        description: '要设置的 HTML 内容（仅富文本控件）'
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_set_content_control_value', args),
  examples: [
    {
      description: '通过标签设置内容控件的值',
      input: { tag: 'author', text: '张三' },
      output: { success: true, message: '成功设置内容控件的值' }
    }
  ]
}

/**
 * 获取内容控件的值
 */
export const wordGetContentControlValueTool: ToolDefinition = {
  name: 'word_get_content_control_value',
  description: '获取 Word 文档中内容控件的值',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      tag: {
        type: 'string',
        description: '内容控件标签'
      },
      title: {
        type: 'string',
        description: '内容控件标题'
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_content_control_value', args),
  examples: [
    {
      description: '通过标签获取内容控件的值',
      input: { tag: 'author' },
      output: { success: true, data: { text: '张三' } }
    }
  ]
}

/**
 * 删除内容控件
 */
export const wordDeleteContentControlTool: ToolDefinition = {
  name: 'word_delete_content_control',
  description: '删除 Word 文档中的内容控件',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      tag: {
        type: 'string',
        description: '内容控件标签'
      },
      title: {
        type: 'string',
        description: '内容控件标题'
      },
      keepContent: {
        type: 'boolean',
        description: '是否保留内容（仅删除控件）',
        default: true
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_delete_content_control', args),
  examples: [
    {
      description: '删除内容控件但保留内容',
      input: { tag: 'author', keepContent: true },
      output: { success: true, message: '成功删除内容控件' }
    }
  ]
}

/**
 * 清除内容控件的内容
 */
export const wordClearContentControlTool: ToolDefinition = {
  name: 'word_clear_content_control',
  description: '清除 Word 文档中内容控件的内容',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      tag: {
        type: 'string',
        description: '内容控件标签'
      },
      title: {
        type: 'string',
        description: '内容控件标题'
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_clear_content_control', args),
  examples: [
    {
      description: '清除内容控件的内容',
      input: { tag: 'author' },
      output: { success: true, message: '成功清除内容控件的内容' }
    }
  ]
}
