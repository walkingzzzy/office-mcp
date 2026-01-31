/**
 * excel_chart - 图表操作
 * 合并 10 个原工具
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'insert', 'update', 'delete', 'setType', 'setTitle',
  'setAxisTitle', 'addSeries', 'format', 'move', 'export'
] as const

export const excelChartTool = createActionTool({
  name: 'excel_chart',
  description: `图表操作工具。支持的操作(action):
- insert: 插入图表 (需要 dataRange, chartType)
- update: 更新图表 (需要 chartName, dataRange)
- delete: 删除图表 (需要 chartName)
- setType: 设置图表类型 (需要 chartName, chartType)
- setTitle: 设置标题 (需要 chartName, title)
- setAxisTitle: 设置轴标题 (需要 chartName, axisTitle)
- addSeries: 添加数据系列 (需要 chartName, seriesName, seriesValues)
- format: 格式化图表 (需要 chartName, 可选 style, colors)
- move: 移动图表 (需要 chartName, position)
- export: 导出图表 (需要 chartName, path, format)`,
  category: 'chart',
  application: 'excel',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    insert: 'excel_insert_chart',
    update: 'excel_update_chart',
    delete: 'excel_delete_chart',
    setType: 'excel_set_chart_type',
    setTitle: 'excel_set_chart_title',
    setAxisTitle: 'excel_set_axis_title',
    addSeries: 'excel_add_chart_series',
    format: 'excel_format_chart',
    move: 'excel_move_chart',
    export: 'excel_export_chart'
  },
  paramRules: {
    insert: [required('dataRange', 'string'), required('chartType', 'string')],
    update: [required('chartName', 'string'), required('dataRange', 'string')],
    delete: [required('chartName', 'string')],
    setType: [required('chartName', 'string'), required('chartType', 'string')],
    setTitle: [required('chartName', 'string'), required('title', 'string')],
    setAxisTitle: [required('chartName', 'string'), required('axisTitle', 'object')],
    addSeries: [required('chartName', 'string'), required('seriesName', 'string'), required('seriesValues', 'string')],
    format: [required('chartName', 'string')],
    move: [required('chartName', 'string'), required('position', 'object')],
    export: [required('chartName', 'string'), required('path', 'string'), required('format', 'string')]
  },
  pathParams: {
    filePath: ['path']
  },
  properties: {
    chartName: {
      type: 'string',
      description: '[多个操作] 图表名称'
    },
    chartIndex: {
      type: 'number',
      description: '[多个操作] 图表索引'
    },
    dataRange: {
      type: 'string',
      description: '[insert/update] 数据区域'
    },
    chartType: {
      type: 'string',
      enum: ['column', 'bar', 'line', 'pie', 'area', 'scatter', 'combo'],
      description: '[insert/setType] 图表类型'
    },
    title: {
      type: 'string',
      description: '[setTitle] 图表标题'
    },
    axisTitle: {
      type: 'object',
      description: '[setAxisTitle] 轴标题',
      properties: {
        x: { type: 'string' },
        y: { type: 'string' }
      }
    },
    seriesName: {
      type: 'string',
      description: '[addSeries] 系列名称'
    },
    seriesValues: {
      type: 'string',
      description: '[addSeries] 系列数据区域'
    },
    style: {
      type: 'string',
      description: '[format] 图表样式'
    },
    colors: {
      type: 'array',
      items: { type: 'string' },
      description: '[format] 颜色数组'
    },
    position: {
      type: 'object',
      description: '[insert/move] 位置',
      properties: {
        left: { type: 'number' },
        top: { type: 'number' },
        width: { type: 'number' },
        height: { type: 'number' }
      }
    },
    path: {
      type: 'string',
      description: '[export] 导出路径'
    },
    format: {
      type: 'string',
      enum: ['png', 'jpg', 'svg'],
      description: '[export] 导出格式'
    }
  },
  metadata: {
    version: '2.1.0',
    priority: 'P0',
    intentKeywords: [
      '图表', '柱状图', '折线图', '饼图', '散点图',
      '标题', '数据系列', '导出图表'
    ],
    mergedTools: [
      'excel_insert_chart', 'excel_update_chart', 'excel_delete_chart',
      'excel_set_chart_type', 'excel_set_chart_title', 'excel_set_axis_title',
      'excel_add_chart_series', 'excel_format_chart', 'excel_move_chart',
      'excel_export_chart'
    ]
  },
  examples: [
    {
      description: '插入柱状图',
      input: { action: 'insert', dataRange: 'A1:B10', chartType: 'column' },
      output: { success: true, message: '成功插入图表', action: 'insert' }
    }
  ]
})
