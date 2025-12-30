/**
 * PowerPoint 备注页工具
 * 使用 PowerPointApi 1.1+ 实现备注操作
 * P1 阶段功能
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 添加幻灯片备注
 */
export const pptAddSlideNotesTool: ToolDefinition = {
  name: 'ppt_add_slide_notes',
  description: '为 PowerPoint 幻灯片添加备注',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: '幻灯片索引（从1开始）'
      },
      notes: {
        type: 'string',
        description: '备注内容'
      }
    },
    required: ['slideIndex', 'notes']
  },
  handler: async (args: any) => sendIPCCommand('ppt_add_slide_notes', args),
  examples: [
    {
      description: '为第一张幻灯片添加备注',
      input: { slideIndex: 1, notes: '这是演讲者备注内容' },
      output: { success: true, message: '成功添加幻灯片备注' }
    }
  ]
}

/**
 * 获取幻灯片备注
 */
export const pptGetSlideNotesTool: ToolDefinition = {
  name: 'ppt_get_slide_notes',
  description: '获取 PowerPoint 幻灯片的备注内容',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: '幻灯片索引（从1开始）'
      }
    },
    required: ['slideIndex']
  },
  handler: async (args: any) => sendIPCCommand('ppt_get_slide_notes', args),
  examples: [
    {
      description: '获取第一张幻灯片的备注',
      input: { slideIndex: 1 },
      output: {
        success: true,
        message: '成功获取幻灯片备注',
        data: { notes: '这是演讲者备注内容' }
      }
    }
  ]
}

/**
 * 更新幻灯片备注
 */
export const pptUpdateSlideNotesTool: ToolDefinition = {
  name: 'ppt_update_slide_notes',
  description: '更新 PowerPoint 幻灯片的备注内容',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: '幻灯片索引（从1开始）'
      },
      notes: {
        type: 'string',
        description: '新的备注内容'
      }
    },
    required: ['slideIndex', 'notes']
  },
  handler: async (args: any) => sendIPCCommand('ppt_update_slide_notes', args),
  examples: [
    {
      description: '更新第一张幻灯片的备注',
      input: { slideIndex: 1, notes: '更新后的备注内容' },
      output: { success: true, message: '成功更新幻灯片备注' }
    }
  ]
}

/**
 * 删除幻灯片备注
 */
export const pptDeleteSlideNotesTool: ToolDefinition = {
  name: 'ppt_delete_slide_notes',
  description: '删除 PowerPoint 幻灯片的备注内容',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: '幻灯片索引（从1开始）'
      }
    },
    required: ['slideIndex']
  },
  handler: async (args: any) => sendIPCCommand('ppt_delete_slide_notes', args),
  examples: [
    {
      description: '删除第一张幻灯片的备注',
      input: { slideIndex: 1 },
      output: { success: true, message: '成功删除幻灯片备注' }
    }
  ]
}

/**
 * 批量获取所有幻灯片备注
 */
export const pptGetAllSlideNotesTool: ToolDefinition = {
  name: 'ppt_get_all_slide_notes',
  description: '获取 PowerPoint 演示文稿中所有幻灯片的备注',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('ppt_get_all_slide_notes', args),
  examples: [
    {
      description: '获取所有幻灯片备注',
      input: {},
      output: {
        success: true,
        message: '成功获取 3 张幻灯片的备注',
        data: {
          notes: [
            { slideIndex: 1, notes: '第一张幻灯片备注' },
            { slideIndex: 2, notes: '第二张幻灯片备注' },
            { slideIndex: 3, notes: '' }
          ]
        }
      }
    }
  ]
}
