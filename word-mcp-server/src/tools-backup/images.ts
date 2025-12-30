/**
 * Word Image Tools - Phase 4 Implementation
 */

import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '@office-mcp/shared'

// Image Operations (10 tools)

export const wordInsertImageTool: ToolDefinition = {
  name: 'word_insert_image',
  description: 'Insert image into Word document',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      imageData: { type: 'string', description: 'Base64 encoded image data or file path' },
      location: { type: 'string', enum: ['cursor', 'start', 'end'], default: 'cursor' },
      width: { type: 'number', description: 'Image width in points' },
      height: { type: 'number', description: 'Image height in points' },
      altText: { type: 'string', description: 'Alternative text for accessibility' }
    },
    required: ['imageData']
  },
  handler: async (args: any) => sendIPCCommand('word_insert_image', args)
}

export const wordDeleteImageTool: ToolDefinition = {
  name: 'word_delete_image',
  description: 'Delete image from document',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      imageIndex: { type: 'number', description: 'Image index (0-based)' },
      deleteSelected: { type: 'boolean', default: false, description: 'Delete currently selected image' }
    }
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
  description: 'Move image to different position',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      imageIndex: { type: 'number', description: 'Image index' },
      position: { type: 'string', enum: ['start', 'end', 'before', 'after'], description: 'New position' },
      targetParagraph: { type: 'number', description: 'Target paragraph index for before/after' }
    },
    required: ['imageIndex', 'position']
  },
  handler: async (args: any) => sendIPCCommand('word_move_image', args)
}

export const wordRotateImageTool: ToolDefinition = {
  name: 'word_rotate_image',
  description: 'Rotate image by specified angle',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      imageIndex: { type: 'number', description: 'Image index' },
      angle: { type: 'number', description: 'Rotation angle in degrees (0-360)' }
    },
    required: ['imageIndex', 'angle']
  },
  handler: async (args: any) => sendIPCCommand('word_rotate_image', args)
}

export const wordSetImagePositionTool: ToolDefinition = {
  name: 'word_set_image_position',
  description: 'Set image positioning and layout',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      imageIndex: { type: 'number', description: 'Image index' },
      positioning: { type: 'string', enum: ['inline', 'square', 'tight', 'through', 'topBottom', 'behindText', 'inFrontOfText'], description: 'Text wrapping style' },
      horizontalAlignment: { type: 'string', enum: ['left', 'center', 'right'], description: 'Horizontal alignment' },
      verticalAlignment: { type: 'string', enum: ['top', 'middle', 'bottom'], description: 'Vertical alignment' }
    },
    required: ['imageIndex']
  },
  handler: async (args: any) => sendIPCCommand('word_set_image_position', args)
}

export const wordWrapTextAroundImageTool: ToolDefinition = {
  name: 'word_wrap_text_around_image',
  description: 'Set text wrapping around image. Wrap types: square (四周型环绕), tight (紧密型环绕), through (穿越型环绕), topBottom (上下型环绕), behindText (衬于文字下方), inFrontOfText (浮于文字上方). If imageIndex is not provided, defaults to the first image (index 0).',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      imageIndex: { type: 'number', description: 'Image index (0-based), defaults to 0 (first image) if not provided', default: 0 },
      wrapStyle: { type: 'string', enum: ['square', 'tight', 'through', 'topBottom', 'behindText', 'inFrontOfText'], description: 'Text wrapping style: square (四周型), tight (紧密型), through (穿越型), topBottom (上下型), behindText (衬于文字下方), inFrontOfText (浮于文字上方)' },
      wrapSide: { type: 'string', enum: ['both', 'left', 'right', 'largest'], default: 'both', description: 'Which side to wrap text' }
    },
    required: ['wrapStyle']
  },
  handler: async (args: any) => sendIPCCommand('word_wrap_text_around_image', args)
}

export const wordAddImageCaptionTool: ToolDefinition = {
  name: 'word_add_image_caption',
  description: 'Add caption to image',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      imageIndex: { type: 'number', description: 'Image index' },
      caption: { type: 'string', description: 'Caption text' },
      position: { type: 'string', enum: ['above', 'below'], default: 'below', description: 'Caption position' },
      includeLabel: { type: 'boolean', default: true, description: 'Include "Figure" label' }
    },
    required: ['imageIndex', 'caption']
  },
  handler: async (args: any) => sendIPCCommand('word_add_image_caption', args)
}

export const wordCompressImagesTool: ToolDefinition = {
  name: 'word_compress_images',
  description: 'Compress images to reduce file size',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      imageIndex: { type: 'number', description: 'Specific image index (optional, compresses all if not specified)' },
      quality: { type: 'string', enum: ['high', 'medium', 'low'], default: 'medium', description: 'Compression quality' },
      resolution: { type: 'number', description: 'Target resolution in DPI' }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_compress_images', args)
}

export const wordReplaceImageTool: ToolDefinition = {
  name: 'word_replace_image',
  description: 'Replace existing image with new one',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      imageIndex: { type: 'number', description: 'Image index to replace' },
      newImageData: { type: 'string', description: 'Base64 encoded new image data or file path' },
      maintainSize: { type: 'boolean', default: true, description: 'Maintain original image size' },
      maintainPosition: { type: 'boolean', default: true, description: 'Maintain original position' }
    },
    required: ['imageIndex', 'newImageData']
  },
  handler: async (args: any) => sendIPCCommand('word_replace_image', args)
}