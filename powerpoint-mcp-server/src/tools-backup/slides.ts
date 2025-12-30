/**
 * PowerPoint Slide Operations Tools - Phase 6 Implementation
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

// Slide Operations (10 tools)

export const pptAddSlideTool: ToolDefinition = {
  name: 'ppt_add_slide',
  description: '向 PowerPoint 演示文稿添加新幻灯片',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      layoutName: {
        type: 'string',
        enum: ['blank', 'title', 'titleOnly', 'titleAndBody', 'twoColumns'],
        default: 'blank'
      },
      index: { type: 'number', description: 'Position to insert slide (0-based)' }
    }
  },
  handler: async (args: any) => sendIPCCommand('ppt_add_slide', args)
}

export const pptDeleteSlideTool: ToolDefinition = {
  name: 'ppt_delete_slide',
  description: '从 PowerPoint 演示文稿中删除幻灯片',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      index: { type: 'number', description: 'Slide index to delete (0-based)' }
    },
    required: ['index']
  },
  handler: async (args: any) => sendIPCCommand('ppt_delete_slide', args)
}

export const pptDuplicateSlideTool: ToolDefinition = {
  name: 'ppt_duplicate_slide',
  description: '在 PowerPoint 演示文稿中复制幻灯片',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      index: { type: 'number', description: 'Slide index to duplicate (0-based)' },
      targetIndex: { type: 'number', description: 'Position to insert duplicated slide' }
    },
    required: ['index']
  },
  handler: async (args: any) => sendIPCCommand('ppt_duplicate_slide', args)
}

export const pptMoveSlideTool: ToolDefinition = {
  name: 'ppt_move_slide',
  description: '将幻灯片移动到不同位置',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      fromIndex: { type: 'number', description: 'Source slide index (0-based)' },
      toIndex: { type: 'number', description: 'Target slide index (0-based)' }
    },
    required: ['fromIndex', 'toIndex']
  },
  handler: async (args: any) => sendIPCCommand('ppt_move_slide', args)
}

export const pptSetSlideLayoutTool: ToolDefinition = {
  name: 'ppt_set_slide_layout',
  description: '设置幻灯片布局',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      index: { type: 'number', description: 'Slide index (0-based)' },
      layoutName: { type: 'string', enum: ['blank', 'title', 'titleOnly', 'titleAndBody', 'twoColumns'] }
    },
    required: ['index', 'layoutName']
  },
  handler: async (args: any) => sendIPCCommand('ppt_set_slide_layout', args)
}

export const pptGetSlideCountTool: ToolDefinition = {
  name: 'ppt_get_slide_count',
  description: '获取幻灯片总数',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async (args: any) => sendIPCCommand('ppt_get_slide_count', args)
}

export const pptNavigateToSlideTool: ToolDefinition = {
  name: 'ppt_navigate_to_slide',
  description: '导航到指定幻灯片',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      index: { type: 'number', description: 'Slide index to navigate to (0-based)' }
    },
    required: ['index']
  },
  handler: async (args: any) => sendIPCCommand('ppt_navigate_to_slide', args)
}

export const pptHideSlideTool: ToolDefinition = {
  name: 'ppt_hide_slide',
  description: '在幻灯片放映中隐藏幻灯片',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      index: { type: 'number', description: 'Slide index to hide (0-based)' }
    },
    required: ['index']
  },
  handler: async (args: any) => sendIPCCommand('ppt_hide_slide', args)
}

export const pptUnhideSlideTool: ToolDefinition = {
  name: 'ppt_unhide_slide',
  description: '在幻灯片放映中取消隐藏幻灯片',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      index: { type: 'number', description: 'Slide index to unhide (0-based)' }
    },
    required: ['index']
  },
  handler: async (args: any) => sendIPCCommand('ppt_unhide_slide', args)
}

export const pptSetSlideTransitionTool: ToolDefinition = {
  name: 'ppt_set_slide_transition',
  description: '设置幻灯片切换效果',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      index: { type: 'number', description: 'Slide index (0-based)' },
      transitionType: { type: 'string', enum: ['none', 'fade', 'push', 'wipe', 'split', 'reveal', 'cut'] },
      duration: { type: 'number', description: 'Transition duration in seconds', default: 1 }
    },
    required: ['index', 'transitionType']
  },
  handler: async (args: any) => sendIPCCommand('ppt_set_slide_transition', args)
}
