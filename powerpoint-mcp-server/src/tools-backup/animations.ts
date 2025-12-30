/**
 * PowerPoint Animation Tools - Phase 6 Implementation
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

// Animation and Transition Tools (8 tools)

export const pptAddAnimationTool: ToolDefinition = {
  name: 'ppt_add_animation',
  description: '为形状或文本添加动画',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      shapeId: { type: 'string', description: 'Shape ID to animate' },
      animationType: {
        type: 'string',
        enum: ['entrance', 'emphasis', 'exit', 'motion'],
        description: 'Animation type'
      },
      effect: { type: 'string', description: 'Animation effect name' }
    },
    required: ['shapeId', 'animationType', 'effect']
  },
  handler: async (args: any) => sendIPCCommand('ppt_add_animation', args)
}

export const pptRemoveAnimationTool: ToolDefinition = {
  name: 'ppt_remove_animation',
  description: '从形状中移除动画',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      shapeId: { type: 'string', description: 'Shape ID' },
      animationIndex: { type: 'number', description: 'Animation index to remove' }
    },
    required: ['shapeId']
  },
  handler: async (args: any) => sendIPCCommand('ppt_remove_animation', args)
}

export const pptSetAnimationTimingTool: ToolDefinition = {
  name: 'ppt_set_animation_timing',
  description: '设置动画计时属性',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      shapeId: { type: 'string', description: 'Shape ID' },
      duration: { type: 'number', description: 'Animation duration in seconds' },
      delay: { type: 'number', description: 'Animation delay in seconds' }
    },
    required: ['shapeId']
  },
  handler: async (args: any) => sendIPCCommand('ppt_set_animation_timing', args)
}

export const pptSetAnimationTriggerTool: ToolDefinition = {
  name: 'ppt_set_animation_trigger',
  description: '设置动画触发器',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      shapeId: { type: 'string', description: 'Shape ID' },
      trigger: { type: 'string', enum: ['onClick', 'withPrevious', 'afterPrevious'], description: 'Animation trigger' }
    },
    required: ['shapeId', 'trigger']
  },
  handler: async (args: any) => sendIPCCommand('ppt_set_animation_trigger', args)
}

export const pptPreviewAnimationTool: ToolDefinition = {
  name: 'ppt_preview_animation',
  description: '预览幻灯片动画',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: { type: 'number', description: 'Slide index to preview' }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('ppt_preview_animation', args)
}

export const pptSetSlideTimingTool: ToolDefinition = {
  name: 'ppt_set_slide_timing',
  description: '设置幻灯片自动切换时间',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: { type: 'number', description: 'Slide index' },
      seconds: { type: 'number', description: 'Seconds to display slide' }
    },
    required: ['slideIndex', 'seconds']
  },
  handler: async (args: any) => sendIPCCommand('ppt_set_slide_timing', args)
}

export const pptStartSlideshowTool: ToolDefinition = {
  name: 'ppt_start_slideshow',
  description: '开始幻灯片放映',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      startSlide: { type: 'number', description: 'Starting slide index', default: 0 }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('ppt_start_slideshow', args)
}

export const pptEndSlideshowTool: ToolDefinition = {
  name: 'ppt_end_slideshow',
  description: '结束幻灯片放映',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async (args: any) => sendIPCCommand('ppt_end_slideshow', args)
}
