/**
 * word_chart - 图表操作
 * 合并 2 个原工具：insert, list
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = ['insert', 'list'] as const

type ChartAction = typeof SUPPORTED_ACTIONS[number]

export const wordChartTool: ToolDefinition = {
  name: 'word_chart',
  description: `图表操作工具。支持的操作(action):
- insert: 插入图表 (需要 chartType, 可选 data)
- list: 列出所有图表`,
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
      chartType: {
        type: 'string',
        enum: ['column', 'bar', 'line', 'pie', 'area', 'scatter'],
        description: '[insert] 图表类型'
      },
      data: {
        type: 'object',
        description: '[insert] 图表数据',
        properties: {
          categories: { type: 'array', items: { type: 'string' } },
          series: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                values: { type: 'array', items: { type: 'number' } }
              }
            }
          }
        }
      },
      title: {
        type: 'string',
        description: '[insert] 图表标题'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: ['图表', '柱状图', '饼图', '折线图'],
    mergedTools: ['word_insert_chart', 'word_get_charts'],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<ChartAction, string> = {
      insert: 'word_insert_chart',
      list: 'word_get_charts'
    }

    const command = commandMap[action as ChartAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '插入柱状图',
      input: {
        action: 'insert',
        chartType: 'column',
        title: '销售数据',
        data: {
          categories: ['Q1', 'Q2', 'Q3', 'Q4'],
          series: [{ name: '销售额', values: [100, 150, 120, 180] }]
        }
      },
      output: { success: true, message: '成功插入图表', action: 'insert' }
    }
  ]
}
