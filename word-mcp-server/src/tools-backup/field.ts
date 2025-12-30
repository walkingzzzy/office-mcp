/**
 * Word 域操作工具
 * 使用 WordApi 1.5+ 实现域操作
 * P1 阶段功能
 * 注意：Web 端只读限制
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 插入域
 */
export const wordInsertFieldTool: ToolDefinition = {
  name: 'word_insert_field',
  description: '在 Word 文档中插入域（如日期、页码等）',
  category: 'field',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      fieldType: {
        type: 'string',
        description: '域类型（如 DATE, PAGE, NUMPAGES, TIME 等）',
        enum: ['DATE', 'PAGE', 'NUMPAGES', 'TIME', 'AUTHOR', 'TITLE', 'FILENAME']
      },
      text: {
        type: 'string',
        description: '要在其位置插入域的文本（可选）'
      },
      preserveFormatting: {
        type: 'boolean',
        description: '是否保留格式',
        default: true
      }
    },
    required: ['fieldType']
  },
  handler: async (args: any) => sendIPCCommand('word_insert_field', args),
  examples: [
    {
      description: '插入日期域',
      input: { fieldType: 'DATE', preserveFormatting: true },
      output: { success: true, message: '成功插入日期域' }
    }
  ]
}

/**
 * 获取所有域
 */
export const wordGetFieldsTool: ToolDefinition = {
  name: 'word_get_fields',
  description: '获取 Word 文档中的所有域',
  category: 'field',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      fieldType: {
        type: 'string',
        description: '筛选特定类型的域（可选）'
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_fields', args),
  examples: [
    {
      description: '获取所有域',
      input: {},
      output: {
        success: true,
        message: '成功获取 5 个域',
        data: {
          fields: [
            { id: 'field1', type: 'DATE', result: '2024-01-01' },
            { id: 'field2', type: 'PAGE', result: '1' }
          ]
        }
      }
    }
  ]
}

/**
 * 更新域
 */
export const wordUpdateFieldTool: ToolDefinition = {
  name: 'word_update_field',
  description: '更新 Word 文档中的指定域',
  category: 'field',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      fieldId: {
        type: 'string',
        description: '域 ID'
      }
    },
    required: ['fieldId']
  },
  handler: async (args: any) => sendIPCCommand('word_update_field', args),
  examples: [
    {
      description: '更新域',
      input: { fieldId: 'field1' },
      output: { success: true, message: '成功更新域' }
    }
  ]
}

/**
 * 更新所有域
 */
export const wordUpdateAllFieldsTool: ToolDefinition = {
  name: 'word_update_all_fields',
  description: '更新 Word 文档中的所有域',
  category: 'field',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_update_all_fields', args),
  examples: [
    {
      description: '更新所有域',
      input: {},
      output: { success: true, message: '成功更新 5 个域' }
    }
  ]
}

/**
 * 删除域
 */
export const wordDeleteFieldTool: ToolDefinition = {
  name: 'word_delete_field',
  description: '删除 Word 文档中的指定域',
  category: 'field',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      fieldId: {
        type: 'string',
        description: '域 ID'
      },
      keepResult: {
        type: 'boolean',
        description: '是否保留域结果文本',
        default: true
      }
    },
    required: ['fieldId']
  },
  handler: async (args: any) => sendIPCCommand('word_delete_field', args),
  examples: [
    {
      description: '删除域但保留结果',
      input: { fieldId: 'field1', keepResult: true },
      output: { success: true, message: '成功删除域' }
    }
  ]
}

/**
 * 锁定域
 */
export const wordLockFieldTool: ToolDefinition = {
  name: 'word_lock_field',
  description: '锁定 Word 文档中的指定域，防止更新',
  category: 'field',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      fieldId: {
        type: 'string',
        description: '域 ID'
      }
    },
    required: ['fieldId']
  },
  handler: async (args: any) => sendIPCCommand('word_lock_field', args),
  examples: [
    {
      description: '锁定域',
      input: { fieldId: 'field1' },
      output: { success: true, message: '成功锁定域' }
    }
  ]
}

/**
 * 解锁域
 */
export const wordUnlockFieldTool: ToolDefinition = {
  name: 'word_unlock_field',
  description: '解锁 Word 文档中的指定域，允许更新',
  category: 'field',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      fieldId: {
        type: 'string',
        description: '域 ID'
      }
    },
    required: ['fieldId']
  },
  handler: async (args: any) => sendIPCCommand('word_unlock_field', args),
  examples: [
    {
      description: '解锁域',
      input: { fieldId: 'field1' },
      output: { success: true, message: '成功解锁域' }
    }
  ]
}

/**
 * 获取域结果
 */
export const wordGetFieldResultTool: ToolDefinition = {
  name: 'word_get_field_result',
  description: '获取 Word 文档中指定域的结果文本',
  category: 'field',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      fieldId: {
        type: 'string',
        description: '域 ID'
      }
    },
    required: ['fieldId']
  },
  handler: async (args: any) => sendIPCCommand('word_get_field_result', args),
  examples: [
    {
      description: '获取域结果',
      input: { fieldId: 'field1' },
      output: {
        success: true,
        message: '成功获取域结果',
        data: { result: '2024-01-01' }
      }
    }
  ]
}
