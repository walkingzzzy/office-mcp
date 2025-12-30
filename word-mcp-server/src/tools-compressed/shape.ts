/**
 * word_shape - 形状操作
 * 合并 8 个原工具：insert, delete, get, setProperties, move, resize, setFill, setLine
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'insert', 'delete', 'get', 'setProperties',
  'move', 'resize', 'setFill', 'setLine'
] as const

type ShapeAction = typeof SUPPORTED_ACTIONS[number]

export const wordShapeTool: ToolDefinition = {
  name: 'word_shape',
  description: `形状操作工具。支持的操作(action):
- insert: 插入形状 (需要 shapeType)
- delete: 删除形状 (需要 shapeId)
- get: 获取形状信息 (需要 shapeId)
- setProperties: 设置形状属性 (需要 shapeId)
- move: 移动形状 (需要 shapeId, left, top)
- resize: 调整大小 (需要 shapeId, width, height)
- setFill: 设置填充 (需要 shapeId)
- setLine: 设置线条 (需要 shapeId)`,
  category: 'shape',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      shapeId: {
        type: 'string',
        description: '[多个操作] 形状 ID'
      },
      shapeType: {
        type: 'string',
        enum: ['rectangle', 'ellipse', 'triangle', 'arrow', 'star', 'line', 'callout'],
        description: '[insert] 形状类型'
      },
      left: { type: 'number', description: '[insert/move] 左边距' },
      top: { type: 'number', description: '[insert/move] 上边距' },
      width: { type: 'number', description: '[insert/resize] 宽度' },
      height: { type: 'number', description: '[insert/resize] 高度' },
      fillColor: { type: 'string', description: '[setFill] 填充颜色' },
      fillTransparency: { type: 'number', description: '[setFill] 透明度 (0-1)' },
      lineColor: { type: 'string', description: '[setLine] 线条颜色' },
      lineWidth: { type: 'number', description: '[setLine] 线条宽度' },
      lineStyle: {
        type: 'string',
        enum: ['solid', 'dash', 'dot', 'dashDot'],
        description: '[setLine] 线条样式'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: ['形状', '插入形状', '矩形', '圆形', '箭头'],
    mergedTools: [
      'word_insert_shape', 'word_delete_shape', 'word_get_shape',
      'word_set_shape_properties', 'word_move_shape', 'word_resize_shape',
      'word_set_shape_fill', 'word_set_shape_line'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<ShapeAction, string> = {
      insert: 'word_insert_shape',
      delete: 'word_delete_shape',
      get: 'word_get_shape',
      setProperties: 'word_set_shape_properties',
      move: 'word_move_shape',
      resize: 'word_resize_shape',
      setFill: 'word_set_shape_fill',
      setLine: 'word_set_shape_line'
    }

    const command = commandMap[action as ShapeAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '插入矩形',
      input: { action: 'insert', shapeType: 'rectangle', left: 100, top: 100, width: 200, height: 100 },
      output: { success: true, message: '成功插入形状', action: 'insert' }
    }
  ]
}
