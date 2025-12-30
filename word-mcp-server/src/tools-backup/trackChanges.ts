/**
 * Word 修订跟踪工具
 * 使用 WordApi 1.4+ 实现修订跟踪操作
 * P1 阶段功能
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 启用修订跟踪
 */
export const wordEnableTrackChangesTool: ToolDefinition = {
  name: 'word_enable_track_changes',
  description: '启用 Word 文档的修订跟踪功能',
  category: 'track_changes',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_enable_track_changes', args),
  examples: [
    {
      description: '启用修订跟踪',
      input: {},
      output: { success: true, message: '成功启用修订跟踪' }
    }
  ]
}

/**
 * 禁用修订跟踪
 */
export const wordDisableTrackChangesTool: ToolDefinition = {
  name: 'word_disable_track_changes',
  description: '禁用 Word 文档的修订跟踪功能',
  category: 'track_changes',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_disable_track_changes', args),
  examples: [
    {
      description: '禁用修订跟踪',
      input: {},
      output: { success: true, message: '成功禁用修订跟踪' }
    }
  ]
}

/**
 * 获取修订跟踪状态
 */
export const wordGetTrackChangesStatusTool: ToolDefinition = {
  name: 'word_get_track_changes_status',
  description: '获取 Word 文档的修订跟踪状态',
  category: 'track_changes',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_track_changes_status', args),
  examples: [
    {
      description: '获取修订跟踪状态',
      input: {},
      output: {
        success: true,
        message: '修订跟踪已启用',
        data: { enabled: true }
      }
    }
  ]
}

/**
 * 获取所有修订
 */
export const wordGetTrackChangesTool: ToolDefinition = {
  name: 'word_get_track_changes',
  description: '获取 Word 文档中的所有修订',
  category: 'track_changes',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      includeAccepted: {
        type: 'boolean',
        description: '是否包含已接受的修订',
        default: false
      },
      includeRejected: {
        type: 'boolean',
        description: '是否包含已拒绝的修订',
        default: false
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_track_changes', args),
  examples: [
    {
      description: '获取所有待处理的修订',
      input: { includeAccepted: false, includeRejected: false },
      output: {
        success: true,
        message: '成功获取 5 条修订',
        data: {
          changes: [
            {
              id: 'change1',
              type: 'insert',
              text: '新增文本',
              author: '编辑者',
              date: '2024-01-01'
            }
          ]
        }
      }
    }
  ]
}

/**
 * 接受修订
 */
export const wordAcceptTrackChangeTool: ToolDefinition = {
  name: 'word_accept_track_change',
  description: '接受 Word 文档中的指定修订',
  category: 'track_changes',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      changeId: {
        type: 'string',
        description: '修订 ID'
      }
    },
    required: ['changeId']
  },
  handler: async (args: any) => sendIPCCommand('word_accept_track_change', args),
  examples: [
    {
      description: '接受修订',
      input: { changeId: 'change1' },
      output: { success: true, message: '成功接受修订' }
    }
  ]
}

/**
 * 拒绝修订
 */
export const wordRejectTrackChangeTool: ToolDefinition = {
  name: 'word_reject_track_change',
  description: '拒绝 Word 文档中的指定修订',
  category: 'track_changes',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      changeId: {
        type: 'string',
        description: '修订 ID'
      }
    },
    required: ['changeId']
  },
  handler: async (args: any) => sendIPCCommand('word_reject_track_change', args),
  examples: [
    {
      description: '拒绝修订',
      input: { changeId: 'change1' },
      output: { success: true, message: '成功拒绝修订' }
    }
  ]
}

/**
 * 接受所有修订
 */
export const wordAcceptAllTrackChangesTool: ToolDefinition = {
  name: 'word_accept_all_track_changes',
  description: '接受 Word 文档中的所有修订',
  category: 'track_changes',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_accept_all_track_changes', args),
  examples: [
    {
      description: '接受所有修订',
      input: {},
      output: { success: true, message: '成功接受 5 条修订' }
    }
  ]
}

/**
 * 拒绝所有修订
 */
export const wordRejectAllTrackChangesTool: ToolDefinition = {
  name: 'word_reject_all_track_changes',
  description: '拒绝 Word 文档中的所有修订',
  category: 'track_changes',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_reject_all_track_changes', args),
  examples: [
    {
      description: '拒绝所有修订',
      input: {},
      output: { success: true, message: '成功拒绝 5 条修订' }
    }
  ]
}
