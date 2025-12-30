/**
 * word_canvas - 画布操作
 * 合并 6 个原工具：insert, list, delete, insertGeometricShape, addShapeToCanvas, getCanvasShapes
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'insert', 'list', 'delete', 'insertShape', 'addShape', 'getShapes'
] as const

type CanvasAction = typeof SUPPORTED_ACTIONS[number]

export const wordCanvasTool: ToolDefinition = {
  name: 'word_canvas',
  description: `画布操作工具。支持的操作(action):
- insert: 插入画布 (可选 width, height)
- list: 列出所有画布
- delete: 删除画布 (需要 canvasId)
- insertShape: 在画布中插入几何形状 (需要 canvasId, shapeType)
- addShape: 添加形状到画布 (需要 canvasId, shapeId)
- getShapes: 获取画布中的形状 (需要 canvasId)`,
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
      canvasId: {
        type: 'string',
        description: '[多个操作] 画布 ID'
      },
      width: {
        type: 'number',
        description: '[insert] 画布宽度'
      },
      height: {
        type: 'number',
        description: '[insert] 画布高度'
      },
      shapeType: {
        type: 'string',
        enum: ['rectangle', 'ellipse', 'triangle', 'line', 'arrow'],
        description: '[insertShape] 形状类型'
      },
      shapeId: {
        type: 'string',
        description: '[addShape] 形状 ID'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P2',
    intentKeywords: ['画布', '绘图区', '图形'],
    mergedTools: [
      'word_insert_canvas', 'word_get_canvases', 'word_delete_canvas',
      'word_insert_geometric_shape', 'word_add_shape_to_canvas', 'word_get_canvas_shapes'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<CanvasAction, string> = {
      insert: 'word_insert_canvas',
      list: 'word_get_canvases',
      delete: 'word_delete_canvas',
      insertShape: 'word_insert_geometric_shape',
      addShape: 'word_add_shape_to_canvas',
      getShapes: 'word_get_canvas_shapes'
    }

    const command = commandMap[action as CanvasAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '插入画布',
      input: { action: 'insert', width: 400, height: 300 },
      output: { success: true, message: '成功插入画布', action: 'insert' }
    }
  ]
}
