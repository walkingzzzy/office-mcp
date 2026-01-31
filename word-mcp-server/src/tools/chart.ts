/**
 * word_chart - 图表操作
 * 合并 2 个原工具：insert, list
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = ['insert', 'list'] as const

export const wordChartTool = createActionTool({
  name: 'word_chart',
  description: `图表操作工具。支持的操作(action):
- insert: 插入图表 (需要 chartType, 可选 data)
- list: 列出所有图表`,
  category: 'image',
  application: 'word',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    insert: 'word_insert_chart',
    list: 'word_get_charts'
  },
  paramRules: {
    insert: [required('chartType', 'string')]
  },
  properties: {
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
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: ['图表', '柱状图', '饼图', '折线图'],
    mergedTools: ['word_insert_chart', 'word_get_charts']
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
})
