/**
 * excel_range - 区域操作
 * 合并 10 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'select', 'getName', 'getAddress', 'getUsedRange',
  'offset', 'resize', 'union', 'intersect', 'specialCells', 'goto'
] as const

type RangeAction = typeof SUPPORTED_ACTIONS[number]

export const excelRangeTool: ToolDefinition = {
  name: 'excel_range',
  description: `区域操作工具。支持的操作(action):
- select: 选择区域 (需要 range)
- getName: 获取命名区域 (需要 name)
- getAddress: 获取区域地址 (需要 range)
- getUsedRange: 获取已使用区域
- offset: 偏移区域 (需要 range, rowOffset, colOffset)
- resize: 调整区域大小 (需要 range, rows, cols)
- union: 合并区域 (需要 ranges)
- intersect: 交集区域 (需要 ranges)
- specialCells: 特殊单元格 (需要 range, type)
- goto: 跳转到区域 (需要 range)`,
  category: 'range',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      range: {
        type: 'string',
        description: '[多个操作] 区域地址'
      },
      ranges: {
        type: 'array',
        items: { type: 'string' },
        description: '[union/intersect] 区域列表'
      },
      name: {
        type: 'string',
        description: '[getName] 命名区域名称'
      },
      rowOffset: {
        type: 'number',
        description: '[offset] 行偏移量'
      },
      colOffset: {
        type: 'number',
        description: '[offset] 列偏移量'
      },
      rows: {
        type: 'number',
        description: '[resize] 行数'
      },
      cols: {
        type: 'number',
        description: '[resize] 列数'
      },
      type: {
        type: 'string',
        enum: ['blanks', 'constants', 'formulas', 'comments', 'visible', 'lastCell'],
        description: '[specialCells] 特殊单元格类型'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: [
      '区域', '选择区域', '命名区域', '已使用区域',
      '偏移', '合并区域', '特殊单元格'
    ],
    mergedTools: [
      'excel_select_range', 'excel_get_named_range',
      'excel_get_range_address', 'excel_get_used_range',
      'excel_offset_range', 'excel_resize_range',
      'excel_union_ranges', 'excel_intersect_ranges',
      'excel_special_cells', 'excel_goto_range'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<RangeAction, string> = {
      select: 'excel_select_range',
      getName: 'excel_get_named_range',
      getAddress: 'excel_get_range_address',
      getUsedRange: 'excel_get_used_range',
      offset: 'excel_offset_range',
      resize: 'excel_resize_range',
      union: 'excel_union_ranges',
      intersect: 'excel_intersect_ranges',
      specialCells: 'excel_special_cells',
      goto: 'excel_goto_range'
    }

    const command = commandMap[action as RangeAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '获取已使用区域',
      input: { action: 'getUsedRange' },
      output: { success: true, action: 'getUsedRange', data: { range: 'A1:G100' } }
    }
  ]
}
