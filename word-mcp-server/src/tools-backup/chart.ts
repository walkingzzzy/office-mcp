/**
 * Word Chart Tools - P1 Implementation
 * 在 Word 文档中插入和管理图表
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

// Chart Operations (2 tools)

export const wordInsertChartTool: ToolDefinition = {
  name: 'word_insert_chart',
  description: '在 Word 文档中插入图表（柱状图、折线图、饼图等）。如果未提供数据，将使用示例数据。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['bar', 'column', 'line', 'pie', 'area', 'scatter', 'doughnut'],
        description: '图表类型：bar(条形图), column(柱状图), line(折线图), pie(饼图), area(面积图), scatter(散点图), doughnut(环形图)',
        default: 'column'
      },
      data: {
        type: 'array',
        description: '图表数据数组。每项包含 label(标签) 和 value(数值)。示例: [{"label": "一月", "value": 100}, {"label": "二月", "value": 150}]',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string', description: '数据标签（如月份、类别名称）' },
            value: { type: 'number', description: '数据值' },
            color: { type: 'string', description: '可选：颜色（十六进制如 FF0000）' }
          },
          required: ['label', 'value']
        }
      },
      title: {
        type: 'string',
        description: '图表标题',
        default: '图表'
      },
      position: {
        type: 'string',
        enum: ['cursor', 'start', 'end'],
        description: '插入位置：cursor(光标处), start(文档开头), end(文档末尾)',
        default: 'cursor'
      },
      width: {
        type: 'number',
        description: '图表宽度（像素）',
        default: 400
      },
      height: {
        type: 'number',
        description: '图表高度（像素）',
        default: 300
      }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_insert_chart', args)
}

export const wordGetChartsTool: ToolDefinition = {
  name: 'word_get_charts',
  description: '获取 Word 文档中的图表信息',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async (args: any) => sendIPCCommand('word_get_charts', args)
}
