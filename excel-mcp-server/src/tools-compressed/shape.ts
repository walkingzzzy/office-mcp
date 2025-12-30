/**
 * excel_shape - 形状操作
 * 合并 8 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'insert', 'delete', 'move', 'resize',
  'setFill', 'setLine', 'setText', 'group'
] as const

type ShapeAction = typeof SUPPORTED_ACTIONS[number]

export const excelShapeTool: ToolDefinition = {
  name: 'excel_shape',
  description: `形状操作工具。支持的操作(action):
- insert: 插入形状 (需要 shapeType, 可选 position, size)
- delete: 删除形状 (需要 shapeName)
- move: 移动形状 (需要 shapeName, left, top)
- resize: 调整大小 (需要 shapeName, width, height)
- setFill: 设置填充 (需要 shapeName, fill)
- setLine: 设置线条 (需要 shapeName, line)
- setText: 设置文本 (需要 shapeName, text)
- group: 组合形状 (需要 shapeNames)`,
  category: 'shape',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      shapeName: {
        type: 'string',
        description: '[多个操作] 形状名称'
      },
      shapeNames: {
        type: 'array',
        items: { type: 'string' },
        description: '[group] 要组合的形状名称列表'
      },
      shapeType: {
        type: 'string',
        enum: ['rectangle', 'oval', 'triangle', 'arrow', 'line', 'textbox', 'callout'],
        description: '[insert] 形状类型'
      },
      position: {
        type: 'object',
        description: '[insert] 位置',
        properties: {
          left: { type: 'number' },
          top: { type: 'number' }
        }
      },
      size: {
        type: 'object',
        description: '[insert] 大小',
        properties: {
          width: { type: 'number' },
          height: { type: 'number' }
        }
      },
      left: {
        type: 'number',
        description: '[move] 左边距'
      },
      top: {
        type: 'number',
        description: '[move] 上边距'
      },
      width: {
        type: 'number',
        description: '[resize] 宽度'
      },
      height: {
        type: 'number',
        description: '[resize] 高度'
      },
      fill: {
        type: 'object',
        description: '[setFill] 填充设置',
        properties: {
          color: { type: 'string' },
          transparency: { type: 'number' }
        }
      },
      line: {
        type: 'object',
        description: '[setLine] 线条设置',
        properties: {
          color: { type: 'string' },
          weight: { type: 'number' },
          style: { type: 'string' }
        }
      },
      text: {
        type: 'string',
        description: '[setText] 文本内容'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: [
      '形状', '插入形状', '删除形状', '移动形状',
      '形状填充', '形状线条', '组合形状'
    ],
    mergedTools: [
      'excel_insert_shape', 'excel_delete_shape',
      'excel_move_shape', 'excel_resize_shape',
      'excel_set_shape_fill', 'excel_set_shape_line',
      'excel_set_shape_text', 'excel_group_shapes'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<ShapeAction, string> = {
      insert: 'excel_insert_shape',
      delete: 'excel_delete_shape',
      move: 'excel_move_shape',
      resize: 'excel_resize_shape',
      setFill: 'excel_set_shape_fill',
      setLine: 'excel_set_shape_line',
      setText: 'excel_set_shape_text',
      group: 'excel_group_shapes'
    }

    const command = commandMap[action as ShapeAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '插入矩形',
      input: { action: 'insert', shapeType: 'rectangle', position: { left: 100, top: 100 } },
      output: { success: true, message: '成功插入形状', action: 'insert' }
    }
  ]
}
