/**
 * Word 注释工具
 * 使用 WordApi 1.7+ 实现墨迹注释功能
 * P2 阶段功能 (BETA)
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 添加墨迹注释
 */
export const wordAddInkAnnotationTool: ToolDefinition = {
  name: 'word_add_ink_annotation',
  description: '在 Word 文档中添加墨迹注释（手写标注）',
  category: 'annotation',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      rangeStart: {
        type: 'number',
        description: '注释区域起始位置'
      },
      rangeEnd: {
        type: 'number',
        description: '注释区域结束位置'
      },
      inkData: {
        type: 'string',
        description: '墨迹数据（Base64 编码）'
      },
      color: {
        type: 'string',
        description: '墨迹颜色（十六进制格式，如 #FF0000）',
        default: '#000000'
      },
      thickness: {
        type: 'number',
        description: '墨迹粗细（像素）',
        default: 2
      }
    },
    required: ['rangeStart', 'rangeEnd', 'inkData']
  },
  handler: async (args: any) => sendIPCCommand('word_add_ink_annotation', args),
  examples: [
    {
      description: '添加红色墨迹注释',
      input: {
        rangeStart: 0,
        rangeEnd: 50,
        inkData: 'base64_encoded_ink_data',
        color: '#FF0000',
        thickness: 3
      },
      output: {
        success: true,
        message: '成功添加墨迹注释',
        data: {
          annotationId: 'annotation1'
        }
      }
    }
  ]
}

/**
 * 获取所有墨迹注释
 */
export const wordGetInkAnnotationsTool: ToolDefinition = {
  name: 'word_get_ink_annotations',
  description: '获取 Word 文档中的所有墨迹注释',
  category: 'annotation',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_ink_annotations', args),
  examples: [
    {
      description: '获取所有墨迹注释',
      input: {},
      output: {
        success: true,
        message: '成功获取 2 个墨迹注释',
        data: {
          annotations: [
            {
              id: 'annotation1',
              rangeStart: 0,
              rangeEnd: 50,
              color: '#FF0000',
              thickness: 3,
              author: '张三',
              date: '2024-01-01'
            }
          ]
        }
      }
    }
  ]
}

/**
 * 获取墨迹注释详情
 */
export const wordGetInkAnnotationDetailTool: ToolDefinition = {
  name: 'word_get_ink_annotation_detail',
  description: '获取指定墨迹注释的详细信息',
  category: 'annotation',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      annotationId: {
        type: 'string',
        description: '注释 ID'
      }
    },
    required: ['annotationId']
  },
  handler: async (args: any) => sendIPCCommand('word_get_ink_annotation_detail', args),
  examples: [
    {
      description: '获取墨迹注释详情',
      input: {
        annotationId: 'annotation1'
      },
      output: {
        success: true,
        message: '成功获取墨迹注释详情',
        data: {
          id: 'annotation1',
          rangeStart: 0,
          rangeEnd: 50,
          inkData: 'base64_encoded_ink_data',
          color: '#FF0000',
          thickness: 3,
          author: '张三',
          date: '2024-01-01'
        }
      }
    }
  ]
}

/**
 * 删除墨迹注释
 */
export const wordDeleteInkAnnotationTool: ToolDefinition = {
  name: 'word_delete_ink_annotation',
  description: '删除 Word 文档中的墨迹注释',
  category: 'annotation',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      annotationId: {
        type: 'string',
        description: '注释 ID'
      }
    },
    required: ['annotationId']
  },
  handler: async (args: any) => sendIPCCommand('word_delete_ink_annotation', args),
  examples: [
    {
      description: '删除墨迹注释',
      input: {
        annotationId: 'annotation1'
      },
      output: {
        success: true,
        message: '成功删除墨迹注释'
      }
    }
  ]
}

/**
 * 删除所有墨迹注释
 */
export const wordDeleteAllInkAnnotationsTool: ToolDefinition = {
  name: 'word_delete_all_ink_annotations',
  description: '删除 Word 文档中的所有墨迹注释',
  category: 'annotation',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_delete_all_ink_annotations', args),
  examples: [
    {
      description: '删除所有墨迹注释',
      input: {},
      output: {
        success: true,
        message: '成功删除所有墨迹注释',
        data: {
          deletedCount: 5
        }
      }
    }
  ]
}

/**
 * 更新墨迹注释
 */
export const wordUpdateInkAnnotationTool: ToolDefinition = {
  name: 'word_update_ink_annotation',
  description: '更新 Word 文档中的墨迹注释属性',
  category: 'annotation',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      annotationId: {
        type: 'string',
        description: '注释 ID'
      },
      color: {
        type: 'string',
        description: '墨迹颜色（十六进制格式）'
      },
      thickness: {
        type: 'number',
        description: '墨迹粗细（像素）'
      }
    },
    required: ['annotationId']
  },
  handler: async (args: any) => sendIPCCommand('word_update_ink_annotation', args),
  examples: [
    {
      description: '更新墨迹注释颜色',
      input: {
        annotationId: 'annotation1',
        color: '#0000FF',
        thickness: 4
      },
      output: {
        success: true,
        message: '成功更新墨迹注释'
      }
    }
  ]
}
