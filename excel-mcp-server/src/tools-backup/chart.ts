/**
 * Excel Chart Tools - Phase 5 Implementation
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

// Chart Operations (10 tools)

export const excelInsertChartTool: ToolDefinition = {
  name: 'excel_insert_chart',
  description: '在Excel工作表中插入图表。支持柱状图、折线图、饼图、条形图、面积图、散点图等多种类型，适用于数据可视化、趋势分析、报表展示等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Data range for chart (e.g., A1:C10)' },
      type: { type: 'string', enum: ['column', 'line', 'pie', 'bar', 'area', 'scatter'], default: 'column' },
      title: { type: 'string', description: 'Chart title' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_chart', args)
}

export const excelUpdateChartTool: ToolDefinition = {
  name: 'excel_update_chart',
  description: '更新现有图表的数据源。动态修改图表引用的数据范围，适用于数据更新、实时报表、动态图表展示等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      chartId: { type: 'string', description: 'Chart identifier' },
      range: { type: 'string', description: 'New data range' }
    },
    required: ['chartId', 'range']
  },
  handler: async (args: any) => sendIPCCommand('excel_update_chart', args)
}

export const excelDeleteChartTool: ToolDefinition = {
  name: 'excel_delete_chart',
  description: '从工作表中删除图表。永久移除指定的图表对象，适用于图表清理、报表重构、删除过期可视化等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      chartId: { type: 'string', description: 'Chart identifier' }
    },
    required: ['chartId']
  },
  handler: async (args: any) => sendIPCCommand('excel_delete_chart', args)
}

export const excelSetChartTypeTool: ToolDefinition = {
  name: 'excel_set_chart_type',
  description: '更改图表类型。在不同图表类型间切换，如柱状图转折线图，适用于数据展示优化、分析角度调整、可视化效果改进等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      chartId: { type: 'string', description: 'Chart identifier' },
      type: { type: 'string', enum: ['column', 'line', 'pie', 'bar', 'area', 'scatter'] }
    },
    required: ['chartId', 'type']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_chart_type', args)
}

export const excelSetChartTitleTool: ToolDefinition = {
  name: 'excel_set_chart_title',
  description: '设置图表标题。为图表添加或修改主标题文字，适用于图表说明、主题标注、报表标识等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      chartId: { type: 'string', description: 'Chart identifier' },
      title: { type: 'string', description: 'Chart title' }
    },
    required: ['chartId', 'title']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_chart_title', args)
}

export const excelSetAxisTitleTool: ToolDefinition = {
  name: 'excel_set_axis_title',
  description: '设置图表坐标轴标题。为X轴或Y轴添加说明文字，适用于数据单位说明、坐标轴标注、图表信息完善等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      chartId: { type: 'string', description: 'Chart identifier' },
      axis: { type: 'string', enum: ['x', 'y'], description: 'Axis type' },
      title: { type: 'string', description: 'Axis title' }
    },
    required: ['chartId', 'axis', 'title']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_axis_title', args)
}

export const excelAddChartSeriesTool: ToolDefinition = {
  name: 'excel_add_chart_series',
  description: '向图表添加数据系列。在现有图表中增加新的数据系列，适用于多组数据对比、复合分析、丰富图表内容等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      chartId: { type: 'string', description: 'Chart identifier' },
      range: { type: 'string', description: 'Data range for new series' },
      name: { type: 'string', description: 'Series name' }
    },
    required: ['chartId', 'range']
  },
  handler: async (args: any) => sendIPCCommand('excel_add_chart_series', args)
}

export const excelFormatChartTool: ToolDefinition = {
  name: 'excel_format_chart',
  description: '格式化图表外观。设置图表样式和配色方案，适用于图表美化、品牌统一、视觉效果优化等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      chartId: { type: 'string', description: 'Chart identifier' },
      style: { type: 'number', description: 'Chart style number' },
      colors: { type: 'array', items: { type: 'string' }, description: 'Color scheme' }
    },
    required: ['chartId']
  },
  handler: async (args: any) => sendIPCCommand('excel_format_chart', args)
}

export const excelMoveChartTool: ToolDefinition = {
  name: 'excel_move_chart',
  description: '移动图表到不同位置。可在当前工作表内移动或移至新工作表，适用于布局调整、报表组织、图表管理等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      chartId: { type: 'string', description: 'Chart identifier' },
      location: { type: 'string', enum: ['new_sheet', 'current_sheet'], default: 'current_sheet' },
      position: { type: 'string', description: 'Position on sheet (e.g., A1)' }
    },
    required: ['chartId']
  },
  handler: async (args: any) => sendIPCCommand('excel_move_chart', args)
}

export const excelExportChartTool: ToolDefinition = {
  name: 'excel_export_chart',
  description: '导出图表为图片。将图表保存为PNG、JPG或GIF格式，适用于报告制作、演示文稿、文档插入等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      chartId: { type: 'string', description: 'Chart identifier' },
      format: { type: 'string', enum: ['png', 'jpg', 'gif'], default: 'png' },
      path: { type: 'string', description: 'Export file path' }
    },
    required: ['chartId', 'path']
  },
  handler: async (args: any) => sendIPCCommand('excel_export_chart', args)
}
