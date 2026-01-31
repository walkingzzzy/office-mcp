/**
 * word_image - 图片操作
 * 合并 10 个原工具：insert, delete, resize, move,
 * rotate, setPosition, wrapText, addCaption, compress, replace
 * 
 * 使用工具工厂创建，包含参数验证和路径验证
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'insert', 'delete', 'resize', 'move',
  'rotate', 'setPosition', 'wrapText',
  'addCaption', 'compress', 'replace'
] as const

export const wordImageTool = createActionTool({
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
  actions: SUPPORTED_ACTIONS,
  commandMap: {
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
  },
  paramRules: {
    insert: [required('source', 'string')],
    delete: [required('imageIndex', 'number')],
    resize: [required('imageIndex', 'number')],
    move: [required('imageIndex', 'number')],
    rotate: [required('imageIndex', 'number'), required('angle', 'number')],
    setPosition: [required('imageIndex', 'number'), required('positionType', 'string')],
    wrapText: [required('imageIndex', 'number'), required('wrapType', 'string')],
    addCaption: [required('imageIndex', 'number'), required('caption', 'string')],
    compress: [],
    replace: [required('imageIndex', 'number'), required('newSource', 'string')]
  },
  pathParams: {
    imagePath: ['source', 'newSource']
  },
  properties: {
    imageIndex: { type: 'number', description: '[多个操作] 图片索引（从0开始）' },
    source: { type: 'string', description: '[insert] 图片路径或 URL' },
    position: { type: 'string', enum: ['cursor', 'start', 'end'], description: '[insert] 插入位置' },
    width: { type: 'number', description: '[resize] 宽度（磅）' },
    height: { type: 'number', description: '[resize] 高度（磅）' },
    lockAspectRatio: { type: 'boolean', description: '[resize] 锁定纵横比' },
    left: { type: 'number', description: '[move/setPosition] 左边距（磅）' },
    top: { type: 'number', description: '[move/setPosition] 上边距（磅）' },
    angle: { type: 'number', description: '[rotate] 旋转角度（度）' },
    positionType: { type: 'string', enum: ['inline', 'absolute', 'relative'], description: '[setPosition] 位置类型' },
    horizontalAlignment: { type: 'string', enum: ['left', 'center', 'right'], description: '[setPosition] 水平对齐' },
    verticalAlignment: { type: 'string', enum: ['top', 'center', 'bottom'], description: '[setPosition] 垂直对齐' },
    wrapType: { type: 'string', enum: ['inline', 'square', 'tight', 'through', 'topAndBottom', 'behind', 'inFront'], description: '[wrapText] 环绕类型' },
    wrapSide: { type: 'string', enum: ['both', 'left', 'right', 'largest'], description: '[wrapText] 环绕侧' },
    caption: { type: 'string', description: '[addCaption] 题注文本' },
    captionPosition: { type: 'string', enum: ['above', 'below'], description: '[addCaption] 题注位置' },
    captionLabel: { type: 'string', description: '[addCaption] 题注标签' },
    quality: { type: 'string', enum: ['high', 'medium', 'low', 'email'], description: '[compress] 压缩质量' },
    newSource: { type: 'string', description: '[replace] 新图片路径或 URL' }
  },
  metadata: {
    version: '2.1.0',
    priority: 'P0',
    intentKeywords: ['图片', '插入图片', '删除图片', '调整大小', '旋转', '文字环绕', '题注', '压缩图片', '替换图片'],
    mergedTools: [
      'word_insert_image', 'word_delete_image', 'word_resize_image',
      'word_move_image', 'word_rotate_image', 'word_set_image_position',
      'word_wrap_text_around_image', 'word_add_image_caption',
      'word_compress_images', 'word_replace_image'
    ]
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
    }
  ]
})
