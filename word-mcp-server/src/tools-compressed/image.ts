/**
 * word_image - 图片操作
 * 合并 10 个原工具：insert, delete, resize, move,
 * rotate, setPosition, wrapText, addCaption, compress, replace
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'insert', 'delete', 'resize', 'move',
  'rotate', 'setPosition', 'wrapText',
  'addCaption', 'compress', 'replace'
] as const

type ImageAction = typeof SUPPORTED_ACTIONS[number]

export const wordImageTool: ToolDefinition = {
  name: 'word_image',
  description: `图片操作工具。支持的操作(action):
- insert: 插入图片 (需要 source)
- delete: 删除图片 (需要 imageIndex)
- resize: 调整大小 (需要 imageIndex, width/height)
- move: 移动图片 (需要 imageIndex, left/top)
- rotate: 旋转图片 (需要 imageIndex, angle)
- setPosition: 设置位置类型 (需要 imageIndex, positionType)
- wrapText: 设置文字环绕 (需要 imageIndex, wrapType)
- addCaption: 添加题注 (需要 imageIndex, caption)
- compress: 压缩图片 (可选 quality)
- replace: 替换图片 (需要 imageIndex, newSource)`,
  category: 'image',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      // 图片标识
      imageIndex: {
        type: 'number',
        description: '[多个操作] 图片索引（从0开始）'
      },
      // insert 参数
      source: {
        type: 'string',
        description: '[insert] 图片路径或 URL'
      },
      position: {
        type: 'string',
        enum: ['cursor', 'start', 'end'],
        description: '[insert] 插入位置',
        default: 'cursor'
      },
      // resize 参数
      width: {
        type: 'number',
        description: '[resize] 宽度（磅）'
      },
      height: {
        type: 'number',
        description: '[resize] 高度（磅）'
      },
      lockAspectRatio: {
        type: 'boolean',
        description: '[resize] 锁定纵横比',
        default: true
      },
      // move 参数
      left: {
        type: 'number',
        description: '[move/setPosition] 左边距（磅）'
      },
      top: {
        type: 'number',
        description: '[move/setPosition] 上边距（磅）'
      },
      // rotate 参数
      angle: {
        type: 'number',
        description: '[rotate] 旋转角度（度）'
      },
      // setPosition 参数
      positionType: {
        type: 'string',
        enum: ['inline', 'absolute', 'relative'],
        description: '[setPosition] 位置类型'
      },
      horizontalAlignment: {
        type: 'string',
        enum: ['left', 'center', 'right'],
        description: '[setPosition] 水平对齐'
      },
      verticalAlignment: {
        type: 'string',
        enum: ['top', 'center', 'bottom'],
        description: '[setPosition] 垂直对齐'
      },
      relativeHorizontalPosition: {
        type: 'string',
        enum: ['page', 'column', 'margin', 'character'],
        description: '[setPosition] 水平相对位置'
      },
      relativeVerticalPosition: {
        type: 'string',
        enum: ['page', 'paragraph', 'margin', 'line'],
        description: '[setPosition] 垂直相对位置'
      },
      // wrapText 参数
      wrapType: {
        type: 'string',
        enum: ['inline', 'square', 'tight', 'through', 'topAndBottom', 'behind', 'inFront'],
        description: '[wrapText] 环绕类型'
      },
      wrapSide: {
        type: 'string',
        enum: ['both', 'left', 'right', 'largest'],
        description: '[wrapText] 环绕侧',
        default: 'both'
      },
      // addCaption 参数
      caption: {
        type: 'string',
        description: '[addCaption] 题注文本'
      },
      captionPosition: {
        type: 'string',
        enum: ['above', 'below'],
        description: '[addCaption] 题注位置',
        default: 'below'
      },
      captionLabel: {
        type: 'string',
        description: '[addCaption] 题注标签（如 "图"）',
        default: '图'
      },
      // compress 参数
      quality: {
        type: 'string',
        enum: ['high', 'medium', 'low', 'email'],
        description: '[compress] 压缩质量',
        default: 'medium'
      },
      deleteEditingData: {
        type: 'boolean',
        description: '[compress] 删除编辑数据',
        default: true
      },
      // replace 参数
      newSource: {
        type: 'string',
        description: '[replace] 新图片路径或 URL'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: [
      '图片', '插入图片', '删除图片', '调整大小', '旋转',
      '文字环绕', '题注', '压缩图片', '替换图片'
    ],
    applicableFor: ['image'],
    mergedTools: [
      'word_insert_image', 'word_delete_image', 'word_resize_image',
      'word_move_image', 'word_rotate_image', 'word_set_image_position',
      'word_wrap_text_around_image', 'word_add_image_caption',
      'word_compress_images', 'word_replace_image'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    // 根据 action 映射到原始命令
    const commandMap: Record<ImageAction, string> = {
      insert: 'word_insert_image',
      delete: 'word_delete_image',
      resize: 'word_resize_image',
      move: 'word_move_image',
      rotate: 'word_rotate_image',
      setPosition: 'word_set_image_position',
      wrapText: 'word_wrap_text_around_image',
      addCaption: 'word_add_image_caption',
      compress: 'word_compress_images',
      replace: 'word_replace_image'
    }

    const command = commandMap[action as ImageAction]
    const result = await sendIPCCommand(command, params)

    return {
      ...result,
      action
    }
  },
  examples: [
    {
      description: '插入图片',
      input: { action: 'insert', source: 'C:\\Images\\photo.jpg', position: 'cursor' },
      output: { success: true, message: '成功插入图片', action: 'insert' }
    },
    {
      description: '设置文字环绕为四周型',
      input: { action: 'wrapText', imageIndex: 0, wrapType: 'square' },
      output: { success: true, message: '成功设置文字环绕', action: 'wrapText' }
    },
    {
      description: '添加图片题注',
      input: { action: 'addCaption', imageIndex: 0, caption: '示例图片', captionLabel: '图' },
      output: { success: true, message: '成功添加题注', action: 'addCaption' }
    }
  ]
}
