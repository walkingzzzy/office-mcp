/**
 * Word 文档生命周期工具
 * 使用 WordApi 1.3+ 实现文档操作功能
 * P1 阶段功能
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 打开文档
 */
export const wordOpenDocumentTool: ToolDefinition = {
  name: 'word_open_document',
  description: '打开指定的 Word 文档',
  category: 'document',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '文档路径（本地路径或 URL）'
      },
      readOnly: {
        type: 'boolean',
        description: '是否以只读模式打开',
        default: false
      }
    },
    required: ['path']
  },
  handler: async (args: any) => sendIPCCommand('word_open_document', args),
  examples: [
    {
      description: '打开本地文档',
      input: {
        path: 'C:\\Documents\\report.docx',
        readOnly: false
      },
      output: {
        success: true,
        message: '成功打开文档'
      }
    }
  ]
}

/**
 * 打印文档
 */
export const wordPrintDocumentTool: ToolDefinition = {
  name: 'word_print_document',
  description: '打印当前 Word 文档',
  category: 'document',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      copies: {
        type: 'number',
        description: '打印份数',
        default: 1
      },
      pageRange: {
        type: 'string',
        description: '页面范围（如 "1-5,8,11-13"）'
      },
      collate: {
        type: 'boolean',
        description: '是否逐份打印',
        default: true
      },
      duplex: {
        type: 'string',
        description: '双面打印模式（none: 单面，vertical: 垂直翻转，horizontal: 水平翻转）',
        enum: ['none', 'vertical', 'horizontal'],
        default: 'none'
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_print_document', args),
  examples: [
    {
      description: '打印文档的第 1-5 页',
      input: {
        copies: 2,
        pageRange: '1-5',
        collate: true,
        duplex: 'vertical'
      },
      output: {
        success: true,
        message: '成功发送打印任务'
      }
    }
  ]
}

/**
 * 打印预览
 */
export const wordPrintPreviewTool: ToolDefinition = {
  name: 'word_print_preview',
  description: '显示 Word 文档的打印预览',
  category: 'document',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_print_preview', args),
  examples: [
    {
      description: '显示打印预览',
      input: {},
      output: {
        success: true,
        message: '成功打开打印预览'
      }
    }
  ]
}

/**
 * 关闭打印预览
 */
export const wordClosePrintPreviewTool: ToolDefinition = {
  name: 'word_close_print_preview',
  description: '关闭 Word 文档的打印预览',
  category: 'document',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_close_print_preview', args),
  examples: [
    {
      description: '关闭打印预览',
      input: {},
      output: {
        success: true,
        message: '成功关闭打印预览'
      }
    }
  ]
}

/**
 * 获取文档属性
 */
export const wordGetDocumentPropertiesTool: ToolDefinition = {
  name: 'word_get_document_properties',
  description: '获取 Word 文档的属性信息',
  category: 'document',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_document_properties', args),
  examples: [
    {
      description: '获取文档属性',
      input: {},
      output: {
        success: true,
        message: '成功获取文档属性',
        data: {
          title: '年度报告',
          author: '张三',
          subject: '财务报告',
          keywords: '财务,年度,报告',
          comments: '这是一份重要的年度财务报告',
          category: '财务',
          manager: '李四',
          company: 'ABC 公司',
          createdDate: '2024-01-01',
          lastModifiedDate: '2024-01-15',
          lastModifiedBy: '王五',
          revisionNumber: 5,
          applicationName: 'Microsoft Word',
          security: 0,
          template: 'Normal.dotm'
        }
      }
    }
  ]
}

/**
 * 设置文档属性
 */
export const wordSetDocumentPropertiesTool: ToolDefinition = {
  name: 'word_set_document_properties',
  description: '设置 Word 文档的属性信息',
  category: 'document',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: '文档标题'
      },
      author: {
        type: 'string',
        description: '作者'
      },
      subject: {
        type: 'string',
        description: '主题'
      },
      keywords: {
        type: 'string',
        description: '关键词（用逗号分隔）'
      },
      comments: {
        type: 'string',
        description: '备注'
      },
      category: {
        type: 'string',
        description: '类别'
      },
      manager: {
        type: 'string',
        description: '管理者'
      },
      company: {
        type: 'string',
        description: '公司'
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_set_document_properties', args),
  examples: [
    {
      description: '设置文档属性',
      input: {
        title: '2024 年度报告',
        author: '张三',
        subject: '财务报告',
        keywords: '财务,年度,报告',
        company: 'ABC 公司'
      },
      output: {
        success: true,
        message: '成功设置文档属性'
      }
    }
  ]
}

/**
 * 获取文档统计信息
 */
export const wordGetDocumentStatisticsTool: ToolDefinition = {
  name: 'word_get_document_statistics',
  description: '获取 Word 文档的统计信息（字数、页数等）',
  category: 'document',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_document_statistics', args),
  examples: [
    {
      description: '获取文档统计信息',
      input: {},
      output: {
        success: true,
        message: '成功获取文档统计信息',
        data: {
          pageCount: 10,
          wordCount: 2500,
          characterCount: 15000,
          characterCountWithSpaces: 17500,
          paragraphCount: 50,
          lineCount: 300
        }
      }
    }
  ]
}

/**
 * 获取文档路径
 */
export const wordGetDocumentPathTool: ToolDefinition = {
  name: 'word_get_document_path',
  description: '获取当前 Word 文档的文件路径',
  category: 'document',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_document_path', args),
  examples: [
    {
      description: '获取文档路径',
      input: {},
      output: {
        success: true,
        message: '成功获取文档路径',
        data: {
          path: 'C:\\Documents\\report.docx',
          name: 'report.docx',
          isNew: false
        }
      }
    }
  ]
}
