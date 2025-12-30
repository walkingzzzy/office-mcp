/**
 * PowerPoint Shapes and Text Tools - Phase 6 Implementation
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

// Shape and Text Operations (12 tools)

export const pptAddTextBoxTool: ToolDefinition = {
  name: 'ppt_add_text_box',
  description: '向 PowerPoint 幻灯片添加文本框',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: { type: 'number', description: 'Slide index (0-based)' },
      text: { type: 'string', description: 'Text content' },
      left: { type: 'number', description: 'Left position in points' },
      top: { type: 'number', description: 'Top position in points' },
      width: { type: 'number', description: 'Width in points' },
      height: { type: 'number', description: 'Height in points' }
    },
    required: ['slideIndex', 'text', 'left', 'top', 'width', 'height']
  },
  handler: async (args: any) => sendIPCCommand('ppt_add_text_box', args)
}

export const pptAddShapeTool: ToolDefinition = {
  name: 'ppt_add_shape',
  description: '向 PowerPoint 幻灯片添加形状',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: { type: 'number', description: 'Slide index (0-based)' },
      shapeType: {
        type: 'string',
        enum: ['rectangle', 'circle', 'triangle', 'arrow', 'star'],
        description: 'Shape type'
      },
      left: { type: 'number', description: 'Left position in points' },
      top: { type: 'number', description: 'Top position in points' },
      width: { type: 'number', description: 'Width in points' },
      height: { type: 'number', description: 'Height in points' }
    },
    required: ['slideIndex', 'shapeType', 'left', 'top', 'width', 'height']
  },
  handler: async (args: any) => sendIPCCommand('ppt_add_shape', args)
}

export const pptDeleteShapeTool: ToolDefinition = {
  name: 'ppt_delete_shape',
  description: '从 PowerPoint 幻灯片中删除形状',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: { type: 'number', description: 'Slide index (0-based)' },
      shapeId: { type: 'string', description: 'Shape ID or name' }
    },
    required: ['slideIndex', 'shapeId']
  },
  handler: async (args: any) => sendIPCCommand('ppt_delete_shape', args)
}

export const pptMoveShapeTool: ToolDefinition = {
  name: 'ppt_move_shape',
  description: '将形状移动到新位置',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: { type: 'number', description: 'Slide index (0-based)' },
      shapeId: { type: 'string', description: 'Shape ID or name' },
      left: { type: 'number', description: 'New left position in points' },
      top: { type: 'number', description: 'New top position in points' }
    },
    required: ['slideIndex', 'shapeId', 'left', 'top']
  },
  handler: async (args: any) => sendIPCCommand('ppt_move_shape', args)
}

export const pptResizeShapeTool: ToolDefinition = {
  name: 'ppt_resize_shape',
  description: '调整形状大小',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: { type: 'number', description: 'Slide index (0-based)' },
      shapeId: { type: 'string', description: 'Shape ID or name' },
      width: { type: 'number', description: 'New width in points' },
      height: { type: 'number', description: 'New height in points' }
    },
    required: ['slideIndex', 'shapeId', 'width', 'height']
  },
  handler: async (args: any) => sendIPCCommand('ppt_resize_shape', args)
}

export const pptSetShapeFillTool: ToolDefinition = {
  name: 'ppt_set_shape_fill',
  description: '设置形状填充颜色',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: { type: 'number', description: 'Slide index (0-based)' },
      shapeId: { type: 'string', description: 'Shape ID or name' },
      color: { type: 'string', description: 'Fill color (hex format #RRGGBB)' }
    },
    required: ['slideIndex', 'shapeId', 'color']
  },
  handler: async (args: any) => sendIPCCommand('ppt_set_shape_fill', args)
}

export const pptSetShapeOutlineTool: ToolDefinition = {
  name: 'ppt_set_shape_outline',
  description: '设置形状轮廓属性',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: { type: 'number', description: 'Slide index (0-based)' },
      shapeId: { type: 'string', description: 'Shape ID or name' },
      color: { type: 'string', description: 'Outline color (hex format #RRGGBB)' },
      width: { type: 'number', description: 'Outline width in points' }
    },
    required: ['slideIndex', 'shapeId']
  },
  handler: async (args: any) => sendIPCCommand('ppt_set_shape_outline', args)
}

export const pptSetTextFormatTool: ToolDefinition = {
  name: 'ppt_set_text_format',
  description: '设置形状中的文本格式',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: { type: 'number', description: 'Slide index (0-based)' },
      shapeId: { type: 'string', description: 'Shape ID or name' },
      fontName: { type: 'string', description: 'Font name' },
      fontSize: { type: 'number', description: 'Font size in points' },
      fontColor: { type: 'string', description: 'Font color (hex format #RRGGBB)' },
      bold: { type: 'boolean', description: 'Bold formatting' },
      italic: { type: 'boolean', description: 'Italic formatting' }
    },
    required: ['slideIndex', 'shapeId']
  },
  handler: async (args: any) => sendIPCCommand('ppt_set_text_format', args)
}

export const pptAlignShapesTool: ToolDefinition = {
  name: 'ppt_align_shapes',
  description: '对齐多个形状',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: { type: 'number', description: 'Slide index (0-based)' },
      shapeIds: { type: 'array', items: { type: 'string' }, description: 'Array of shape IDs' },
      alignment: {
        type: 'string',
        enum: ['left', 'center', 'right', 'top', 'middle', 'bottom'],
        description: 'Alignment type'
      }
    },
    required: ['slideIndex', 'shapeIds', 'alignment']
  },
  handler: async (args: any) => sendIPCCommand('ppt_align_shapes', args)
}

export const pptGroupShapesTool: ToolDefinition = {
  name: 'ppt_group_shapes',
  description: '将多个形状组合在一起',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: { type: 'number', description: 'Slide index (0-based)' },
      shapeIds: { type: 'array', items: { type: 'string' }, description: 'Array of shape IDs to group' }
    },
    required: ['slideIndex', 'shapeIds']
  },
  handler: async (args: any) => sendIPCCommand('ppt_group_shapes', args)
}

export const pptUngroupShapesTool: ToolDefinition = {
  name: 'ppt_ungroup_shapes',
  description: '取消形状组合',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: { type: 'number', description: 'Slide index (0-based)' },
      groupId: { type: 'string', description: 'Group ID to ungroup' }
    },
    required: ['slideIndex', 'groupId']
  },
  handler: async (args: any) => sendIPCCommand('ppt_ungroup_shapes', args)
}

export const pptRotateShapeTool: ToolDefinition = {
  name: 'ppt_rotate_shape',
  description: '按指定度数旋转形状',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: { type: 'number', description: 'Slide index (0-based)' },
      shapeId: { type: 'string', description: 'Shape ID or name' },
      degrees: { type: 'number', description: 'Rotation degrees (positive = clockwise)' }
    },
    required: ['slideIndex', 'shapeId', 'degrees']
  },
  handler: async (args: any) => sendIPCCommand('ppt_rotate_shape', args)
}
