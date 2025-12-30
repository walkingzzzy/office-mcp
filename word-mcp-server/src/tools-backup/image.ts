/**
 * Word Image Tools - Phase 4 Implementation
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

// Image Operations (10 tools)

export const wordInsertImageTool: ToolDefinition = {
  name: 'word_insert_image',
  description: '在 Word 文档中插入图片。支持指定图片路径、插入位置和初始尺寸。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      imagePath: { type: 'string', description: 'Path to image file' },
      position: { type: 'string', enum: ['cursor', 'start', 'end'], default: 'cursor' },
      width: { type: 'number', description: 'Image width in points' },
      height: { type: 'number', description: 'Image height in points' }
    },
    required: ['imagePath']
  },
  handler: async (args: any) => sendIPCCommand('word_insert_image', args)
}

export const wordDeleteImageTool: ToolDefinition = {
  name: 'word_delete_image',
  description: '从文档中删除指定图片。通过图片索引（从0开始）指定要删除的图片。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      imageIndex: { type: 'number', description: 'Image index (0-based)' }
    },
    required: ['imageIndex']
  },
  handler: async (args: any) => sendIPCCommand('word_delete_image', args)
}

export const wordResizeImageTool: ToolDefinition = {
  name: 'word_resize_image',
  description: 'Resize image dimensions. Set width or height in points (1 inch = 72 points, 1 cm ≈ 28.35 points). If imageIndex is not provided, defaults to the first image (index 0).',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      imageIndex: { type: 'number', description: 'Image index (0-based), defaults to 0 (first image) if not provided', default: 0 },
      width: { type: 'number', description: 'New width in points (1 inch = 72 points, 1 cm ≈ 28.35 points)' },
      height: { type: 'number', description: 'New height in points (1 inch = 72 points, 1 cm ≈ 28.35 points)' },
      maintainAspectRatio: { type: 'boolean', default: true, description: 'Whether to maintain aspect ratio when resizing' }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_resize_image', args)
}

export const wordMoveImageTool: ToolDefinition = {
  name: 'word_move_image',
  description: '移动图片到新位置。通过 X 和 Y 坐标（单位：磅）指定新的图片位置。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      imageIndex: { type: 'number', description: 'Image index' },
      x: { type: 'number', description: 'X position in points' },
      y: { type: 'number', description: 'Y position in points' }
    },
    required: ['imageIndex', 'x', 'y']
  },
  handler: async (args: any) => sendIPCCommand('word_move_image', args)
}

export const wordRotateImageTool: ToolDefinition = {
  name: 'word_rotate_image',
  description: '按角度旋转图片。支持 -360 到 360 度范围内的任意角度旋转。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      imageIndex: { type: 'number', description: 'Image index' },
      degrees: { type: 'number', minimum: -360, maximum: 360, description: 'Rotation degrees' }
    },
    required: ['imageIndex', 'degrees']
  },
  handler: async (args: any) => sendIPCCommand('word_rotate_image', args)
}

export const wordSetImagePositionTool: ToolDefinition = {
  name: 'word_set_image_position',
  description: '设置图片定位类型。可选择嵌入式或浮动式，浮动式可设置对齐方式。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      imageIndex: { type: 'number', description: 'Image index' },
      positionType: { type: 'string', enum: ['inline', 'floating'], description: 'Position type' },
      alignment: { type: 'string', enum: ['left', 'center', 'right'], description: 'Alignment for inline images' }
    },
    required: ['imageIndex', 'positionType']
  },
  handler: async (args: any) => sendIPCCommand('word_set_image_position', args)
}

export const wordWrapTextAroundImageTool: ToolDefinition = {
  name: 'word_wrap_text_around_image',
  description: '设置图片的文字环绕方式。支持四周型、紧密型、穿越型、上下型、衬于文字下方、浮于文字上方等多种环绕方式。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      imageIndex: { type: 'number', description: 'Image index (0-based), defaults to 0 (first image) if not provided', default: 0 },
      wrapType: {
        type: 'string',
        enum: ['square', 'tight', 'through', 'topBottom', 'behind', 'inFront'],
        description: 'Text wrap type: square (四周型), tight (紧密型), through (穿越型), topBottom (上下型), behind (衬于文字下方), inFront (浮于文字上方)'
      },
      wrapSide: { type: 'string', enum: ['both', 'left', 'right', 'largest'], default: 'both', description: 'Which side to wrap text' }
    },
    required: ['wrapType']
  },
  handler: async (args: any) => sendIPCCommand('word_wrap_text_around_image', args)
}

export const wordAddImageCaptionTool: ToolDefinition = {
  name: 'word_add_image_caption',
  description: '为图片添加标题',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      imageIndex: { type: 'number', description: 'Image index' },
      caption: { type: 'string', description: 'Caption text' },
      position: { type: 'string', enum: ['above', 'below'], default: 'below' },
      includeLabel: { type: 'boolean', default: true, description: 'Include "Figure" label' }
    },
    required: ['imageIndex', 'caption']
  },
  handler: async (args: any) => sendIPCCommand('word_add_image_caption', args)
}

export const wordCompressImagesTool: ToolDefinition = {
  name: 'word_compress_images',
  description: '压缩文档中的图片',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      quality: { type: 'string', enum: ['high', 'medium', 'low'], default: 'medium' },
      deleteEditingData: { type: 'boolean', default: true },
      targetImageIndex: {
        type: 'number',
        description: 'Specific image index (optional, compresses all if not specified)'
      }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_compress_images', args)
}

export const wordReplaceImageTool: ToolDefinition = {
  name: 'word_replace_image',
  description: '替换现有图片。用新图片替换指定索引的图片，可选择是否保持原图尺寸。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      imageIndex: { type: 'number', description: 'Image index to replace' },
      newImagePath: { type: 'string', description: 'Path to new image file' },
      maintainSize: { type: 'boolean', default: true, description: 'Keep original image size' }
    },
    required: ['imageIndex', 'newImagePath']
  },
  handler: async (args: any) => sendIPCCommand('word_replace_image', args)
}
