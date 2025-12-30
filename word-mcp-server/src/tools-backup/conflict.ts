/**
 * Word 冲突解决工具
 * 使用 WordApi 1.4+ 实现协作冲突管理
 * P3 阶段功能
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 获取冲突列表
 */
export const wordGetConflictsTool: ToolDefinition = {
  name: 'word_get_conflicts',
  description: '获取 Word 文档中的所有编辑冲突',
  category: 'conflict',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      includeResolved: {
        type: 'boolean',
        description: '是否包含已解决的冲突',
        default: false
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_conflicts', args),
  examples: [
    {
      description: '获取所有未解决的冲突',
      input: { includeResolved: false },
      output: {
        success: true,
        message: '成功获取 2 个冲突',
        data: {
          conflicts: [
            {
              id: 'conflict1',
              type: 'content',
              rangeStart: 100,
              rangeEnd: 150,
              localVersion: '本地修改内容',
              serverVersion: '服务器修改内容',
              author: '张三',
              date: '2024-01-01',
              resolved: false
            }
          ]
        }
      }
    }
  ]
}

/**
 * 获取冲突详情
 */
export const wordGetConflictDetailTool: ToolDefinition = {
  name: 'word_get_conflict_detail',
  description: '获取指定冲突的详细信息',
  category: 'conflict',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      conflictId: {
        type: 'string',
        description: '冲突 ID'
      }
    },
    required: ['conflictId']
  },
  handler: async (args: any) => sendIPCCommand('word_get_conflict_detail', args),
  examples: [
    {
      description: '获取冲突详情',
      input: { conflictId: 'conflict1' },
      output: {
        success: true,
        message: '成功获取冲突详情',
        data: {
          id: 'conflict1',
          type: 'content',
          rangeStart: 100,
          rangeEnd: 150,
          localVersion: '本地修改内容',
          serverVersion: '服务器修改内容',
          author: '张三',
          date: '2024-01-01',
          resolved: false,
          conflictReason: '同时编辑同一段落'
        }
      }
    }
  ]
}

/**
 * 接受本地版本
 */
export const wordAcceptLocalVersionTool: ToolDefinition = {
  name: 'word_accept_local_version',
  description: '接受本地版本以解决冲突',
  category: 'conflict',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      conflictId: {
        type: 'string',
        description: '冲突 ID'
      }
    },
    required: ['conflictId']
  },
  handler: async (args: any) => sendIPCCommand('word_accept_local_version', args),
  examples: [
    {
      description: '接受本地版本',
      input: { conflictId: 'conflict1' },
      output: {
        success: true,
        message: '成功接受本地版本'
      }
    }
  ]
}

/**
 * 接受服务器版本
 */
export const wordAcceptServerVersionTool: ToolDefinition = {
  name: 'word_accept_server_version',
  description: '接受服务器版本以解决冲突',
  category: 'conflict',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      conflictId: {
        type: 'string',
        description: '冲突 ID'
      }
    },
    required: ['conflictId']
  },
  handler: async (args: any) => sendIPCCommand('word_accept_server_version', args),
  examples: [
    {
      description: '接受服务器版本',
      input: { conflictId: 'conflict1' },
      output: {
        success: true,
        message: '成功接受服务器版本'
      }
    }
  ]
}

/**
 * 合并冲突
 */
export const wordMergeConflictTool: ToolDefinition = {
  name: 'word_merge_conflict',
  description: '手动合并冲突内容',
  category: 'conflict',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      conflictId: {
        type: 'string',
        description: '冲突 ID'
      },
      mergedContent: {
        type: 'string',
        description: '合并后的内容'
      }
    },
    required: ['conflictId', 'mergedContent']
  },
  handler: async (args: any) => sendIPCCommand('word_merge_conflict', args),
  examples: [
    {
      description: '手动合并冲突',
      input: {
        conflictId: 'conflict1',
        mergedContent: '合并后的最终内容'
      },
      output: {
        success: true,
        message: '成功合并冲突'
      }
    }
  ]
}

/**
 * 接受所有本地版本
 */
export const wordAcceptAllLocalVersionsTool: ToolDefinition = {
  name: 'word_accept_all_local_versions',
  description: '接受所有本地版本以批量解决冲突',
  category: 'conflict',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_accept_all_local_versions', args),
  examples: [
    {
      description: '接受所有本地版本',
      input: {},
      output: {
        success: true,
        message: '成功接受所有本地版本',
        data: {
          resolvedCount: 5
        }
      }
    }
  ]
}

/**
 * 接受所有服务器版本
 */
export const wordAcceptAllServerVersionsTool: ToolDefinition = {
  name: 'word_accept_all_server_versions',
  description: '接受所有服务器版本以批量解决冲突',
  category: 'conflict',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_accept_all_server_versions', args),
  examples: [
    {
      description: '接受所有服务器版本',
      input: {},
      output: {
        success: true,
        message: '成功接受所有服务器版本',
        data: {
          resolvedCount: 5
        }
      }
    }
  ]
}
