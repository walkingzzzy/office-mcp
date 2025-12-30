/**
 * PowerPoint Content Tools - 图片和媒体工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

export const pptInsertImageTool: ToolDefinition = {
  name: 'ppt_insert_image',
  description: '向 PowerPoint 幻灯片插入图片',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: { type: 'number', description: 'Slide index (0-based)' },
      imagePath: { type: 'string', description: 'Path to image file' },
      x: { type: 'number', description: 'X position' },
      y: { type: 'number', description: 'Y position' },
      width: { type: 'number', description: 'Image width' },
      height: { type: 'number', description: 'Image height' }
    },
    required: ['slideIndex', 'imagePath']
  },
  handler: async (args: any) => sendIPCCommand('ppt_insert_image', args)
}

export const pptInsertVideoTool: ToolDefinition = {
  name: 'ppt_insert_video',
  description: '向 PowerPoint 幻灯片插入视频',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: { type: 'number', description: 'Slide index (0-based)' },
      videoPath: { type: 'string', description: 'Path to video file' },
      x: { type: 'number', description: 'X position' },
      y: { type: 'number', description: 'Y position' }
    },
    required: ['slideIndex', 'videoPath']
  },
  handler: async (args: any) => sendIPCCommand('ppt_insert_video', args)
}

export const pptInsertAudioTool: ToolDefinition = {
  name: 'ppt_insert_audio',
  description: '向 PowerPoint 幻灯片插入音频',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: { type: 'number', description: 'Slide index (0-based)' },
      audioPath: { type: 'string', description: 'Path to audio file' }
    },
    required: ['slideIndex', 'audioPath']
  },
  handler: async (args: any) => sendIPCCommand('ppt_insert_audio', args)
}

export const pptCropImageTool: ToolDefinition = {
  name: 'ppt_crop_image',
  description: '裁剪 PowerPoint 幻灯片中的图片',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: { type: 'number', description: 'Slide index (0-based)' },
      shapeId: { type: 'string', description: 'Image shape ID' },
      left: { type: 'number', description: 'Left crop amount' },
      top: { type: 'number', description: 'Top crop amount' },
      right: { type: 'number', description: 'Right crop amount' },
      bottom: { type: 'number', description: 'Bottom crop amount' }
    },
    required: ['slideIndex', 'shapeId']
  },
  handler: async (args: any) => sendIPCCommand('ppt_crop_image', args)
}

export const pptCompressMediaTool: ToolDefinition = {
  name: 'ppt_compress_media',
  description: '压缩 PowerPoint 演示文稿中的媒体文件',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      quality: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' }
    }
  },
  handler: async (args: any) => sendIPCCommand('ppt_compress_media', args)
}

export const pptSetImageEffectsTool: ToolDefinition = {
  name: 'ppt_set_image_effects',
  description: '设置 PowerPoint 幻灯片中的图片效果',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: { type: 'number', description: 'Slide index (0-based)' },
      shapeId: { type: 'string', description: 'Image shape ID' },
      brightness: { type: 'number', description: 'Brightness (-100 to 100)' },
      contrast: { type: 'number', description: 'Contrast (-100 to 100)' },
      transparency: { type: 'number', description: 'Transparency (0 to 100)' }
    },
    required: ['slideIndex', 'shapeId']
  },
  handler: async (args: any) => sendIPCCommand('ppt_set_image_effects', args)
}
