/**
 * excel_image - 图片操作
 * 合并 6 个原工具
 * 
 * 使用工具工厂创建，包含：
 * - 参数验证
 * - 路径安全验证
 */

import { 
  createActionTool, 
  required, 
  optional,
  imagePathParam 
} from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'insert', 'delete', 'resize', 'move', 'crop', 'setProperties'
] as const

export const excelImageTool = createActionTool({
  name: 'excel_image',
  description: `图片操作工具。支持的操作(action):
- insert: 插入图片 (需要 path, 可选 cell, width, height)
- delete: 删除图片 (需要 imageName 或 imageIndex)
- resize: 调整图片大小 (需要 imageName, width, height)
- move: 移动图片 (需要 imageName, cell 或 position)
- crop: 裁剪图片 (需要 imageName, cropArea)
- setProperties: 设置图片属性 (需要 imageName, properties)`,
  category: 'image',
  application: 'excel',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    insert: 'excel_insert_image',
    delete: 'excel_delete_image',
    resize: 'excel_resize_image',
    move: 'excel_move_image',
    crop: 'excel_crop_image',
    setProperties: 'excel_set_image_properties'
  },
  // 参数验证规则
  paramRules: {
    insert: [imagePathParam(true)],
    delete: [], // imageName 或 imageIndex 至少一个
    resize: [
      required('imageName', 'string'),
      required('width', 'number'),
      required('height', 'number')
    ],
    move: [required('imageName', 'string')],
    crop: [required('imageName', 'string'), required('cropArea', 'object')],
    setProperties: [required('imageName', 'string'), required('properties', 'object')]
  },
  // 路径验证
  pathParams: {
    imagePath: ['path']
  },
  properties: {
    path: {
      type: 'string',
      description: '[insert] 图片文件路径'
    },
    imageName: {
      type: 'string',
      description: '[多个操作] 图片名称'
    },
    imageIndex: {
      type: 'number',
      description: '[delete] 图片索引'
    },
    cell: {
      type: 'string',
      description: '[insert/move] 目标单元格'
    },
    width: {
      type: 'number',
      description: '[insert/resize] 宽度'
    },
    height: {
      type: 'number',
      description: '[insert/resize] 高度'
    },
    position: {
      type: 'object',
      description: '[move] 位置坐标',
      properties: {
        left: { type: 'number' },
        top: { type: 'number' }
      }
    },
    cropArea: {
      type: 'object',
      description: '[crop] 裁剪区域',
      properties: {
        left: { type: 'number' },
        top: { type: 'number' },
        right: { type: 'number' },
        bottom: { type: 'number' }
      }
    },
    properties: {
      type: 'object',
      description: '[setProperties] 图片属性',
      properties: {
        brightness: { type: 'number' },
        contrast: { type: 'number' },
        rotation: { type: 'number' },
        transparency: { type: 'number' },
        lockAspectRatio: { type: 'boolean' }
      }
    }
  },
  metadata: {
    version: '2.1.0',
    priority: 'P1',
    intentKeywords: [
      '图片', '插入图片', '删除图片', '调整大小',
      '移动图片', '裁剪', '图片属性'
    ],
    mergedTools: [
      'excel_insert_image', 'excel_delete_image', 'excel_resize_image',
      'excel_move_image', 'excel_crop_image', 'excel_set_image_properties'
    ]
  },
  examples: [
    {
      description: '插入图片',
      input: { action: 'insert', path: 'C:\\images\\logo.png', cell: 'A1' },
      output: { success: true, message: '成功插入图片', action: 'insert' }
    }
  ]
})
