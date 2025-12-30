/**
 * Word 协作工具
 * 使用 WordApi 1.4+ 实现协作编辑功能
 * P1 阶段功能 (BETA)
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 获取协作状态
 */
export const wordGetCoauthoringStatusTool: ToolDefinition = {
  name: 'word_get_coauthoring_status',
  description: '获取 Word 文档的协作编辑状态',
  category: 'coauthoring',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_coauthoring_status', args),
  examples: [
    {
      description: '获取协作状态',
      input: {},
      output: {
        success: true,
        message: '成功获取协作状态',
        data: {
          isCoauthoring: true,
          authors: ['用户1', '用户2'],
          locks: []
        }
      }
    }
  ]
}

/**
 * 获取协作者列表
 */
export const wordGetCoauthorsTool: ToolDefinition = {
  name: 'word_get_coauthors',
  description: '获取当前正在协作编辑文档的用户列表',
  category: 'coauthoring',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_coauthors', args),
  examples: [
    {
      description: '获取协作者列表',
      input: {},
      output: {
        success: true,
        message: '成功获取协作者列表',
        data: {
          coauthors: [
            {
              id: 'user1',
              name: '张三',
              email: 'zhangsan@example.com',
              isActive: true
            },
            {
              id: 'user2',
              name: '李四',
              email: 'lisi@example.com',
              isActive: true
            }
          ]
        }
      }
    }
  ]
}

/**
 * 获取协作锁定区域
 */
export const wordGetCoauthoringLocksTool: ToolDefinition = {
  name: 'word_get_coauthoring_locks',
  description: '获取文档中被其他用户锁定的区域',
  category: 'coauthoring',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_coauthoring_locks', args),
  examples: [
    {
      description: '获取锁定区域',
      input: {},
      output: {
        success: true,
        message: '成功获取锁定区域',
        data: {
          locks: [
            {
              id: 'lock1',
              userId: 'user1',
              userName: '张三',
              rangeStart: 0,
              rangeEnd: 100,
              lockType: 'exclusive'
            }
          ]
        }
      }
    }
  ]
}

/**
 * 请求锁定区域
 */
export const wordRequestCoauthoringLockTool: ToolDefinition = {
  name: 'word_request_coauthoring_lock',
  description: '请求锁定文档中的指定区域以进行编辑',
  category: 'coauthoring',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      rangeStart: {
        type: 'number',
        description: '锁定区域起始位置'
      },
      rangeEnd: {
        type: 'number',
        description: '锁定区域结束位置'
      },
      lockType: {
        type: 'string',
        description: '锁定类型（exclusive: 独占锁，shared: 共享锁）',
        enum: ['exclusive', 'shared'],
        default: 'exclusive'
      }
    },
    required: ['rangeStart', 'rangeEnd']
  },
  handler: async (args: any) => sendIPCCommand('word_request_coauthoring_lock', args),
  examples: [
    {
      description: '请求锁定区域',
      input: {
        rangeStart: 0,
        rangeEnd: 100,
        lockType: 'exclusive'
      },
      output: {
        success: true,
        message: '成功锁定区域',
        data: {
          lockId: 'lock1'
        }
      }
    }
  ]
}

/**
 * 释放锁定区域
 */
export const wordReleaseCoauthoringLockTool: ToolDefinition = {
  name: 'word_release_coauthoring_lock',
  description: '释放之前锁定的文档区域',
  category: 'coauthoring',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      lockId: {
        type: 'string',
        description: '锁定 ID'
      }
    },
    required: ['lockId']
  },
  handler: async (args: any) => sendIPCCommand('word_release_coauthoring_lock', args),
  examples: [
    {
      description: '释放锁定',
      input: {
        lockId: 'lock1'
      },
      output: {
        success: true,
        message: '成功释放锁定'
      }
    }
  ]
}

/**
 * 同步协作更改
 */
export const wordSyncCoauthoringChangesTool: ToolDefinition = {
  name: 'word_sync_coauthoring_changes',
  description: '同步其他协作者的更改到本地文档',
  category: 'coauthoring',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_sync_coauthoring_changes', args),
  examples: [
    {
      description: '同步协作更改',
      input: {},
      output: {
        success: true,
        message: '成功同步协作更改',
        data: {
          changesCount: 5
        }
      }
    }
  ]
}
