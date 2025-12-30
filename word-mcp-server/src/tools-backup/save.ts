/**
 * Word 文档保存工具
 * 使用 Office.js API (WordApi 1.1) 实现文档保存操作
 *
 * 错误处理：
 * - 使用统一的错误码体系
 * - 提供友好的错误提示和恢复建议
 * - 支持参数验证和错误重试
 */

import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '@office-mcp/shared'
import { ToolErrorHandler } from '../utils/ToolErrorHandler.js'

/**
 * 保存文档
 */
export const wordSaveDocumentTool: ToolDefinition = {
  name: 'word_save_document',
  description: '保存 Word 文档到当前位置',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_save_document', args),
  examples: [
    {
      description: '保存当前文档',
      input: {},
      output: { success: true, message: '成功保存文档' }
    }
  ]
}

/**
 * 另存为（带参数验证的示例）
 */
export const wordSaveAsDocumentTool: ToolDefinition = {
  name: 'word_save_as_document',
  description: '将 Word 文档另存为新文件',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: '保存的文件路径（包含文件名）'
      },
      format: {
        type: 'string',
        enum: ['docx', 'doc', 'pdf', 'txt', 'html'],
        description: '保存的文件格式',
        default: 'docx'
      }
    },
    required: ['filePath']
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    // 参数验证
    const paramError = ToolErrorHandler.validateRequiredParams(args, ['filePath'])
    if (paramError) {
      return paramError
    }

    const typeError = ToolErrorHandler.validateParamTypes(args, {
      filePath: 'string',
      format: 'string'
    })
    if (typeError) {
      return typeError
    }

    // 调用 IPC 命令
    try {
      const result = await sendIPCCommand('word_save_as_document', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '另存为新的docx文件',
      input: { filePath: 'C:\\Documents\\新文档.docx', format: 'docx' },
      output: { success: true, message: '成功另存为文档' }
    },
    {
      description: '导出为PDF',
      input: { filePath: 'C:\\Documents\\文档.pdf', format: 'pdf' },
      output: { success: true, message: '成功导出为PDF' }
    }
  ]
}

/**
 * 获取文档保存状态
 */
export const wordGetSaveStatusTool: ToolDefinition = {
  name: 'word_get_save_status',
  description: '获取 Word 文档的保存状态（是否有未保存的更改）',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_save_status', args),
  examples: [
    {
      description: '获取保存状态',
      input: {},
      output: { success: true, data: { isDirty: false, lastSaved: '2025-12-01T10:30:00Z' } }
    }
  ]
}

/**
 * 关闭文档
 */
export const wordCloseDocumentTool: ToolDefinition = {
  name: 'word_close_document',
  description: '关闭 Word 文档',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      saveChanges: {
        type: 'boolean',
        description: '是否保存更改',
        default: true
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_close_document', args),
  examples: [
    {
      description: '保存并关闭文档',
      input: { saveChanges: true },
      output: { success: true, message: '成功关闭文档' }
    },
    {
      description: '不保存直接关闭',
      input: { saveChanges: false },
      output: { success: true, message: '成功关闭文档（未保存更改）' }
    }
  ]
}
