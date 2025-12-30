/**
 * Excel Chart Operations - Phase 5 Implementation
 */

import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '@office-mcp/shared'

// Chart Operations (10 tools)

export const excelCreateChartTool: ToolDefinition = {
  name: 'excel_create_chart',
  description: 'Create chart from Excel data',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      dataRange: { type: 'string', description: 'Data range for chart (e.g., "A1:B10")' },
      chartType: { type: 'string', enum: ['column', 'bar', 'line', 'pie', 'area', 'scatter', 'doughnut'], description: 'Chart type' },
      title: { type: 'string', description: 'Chart title (optional)' },
      position: { type: 'string', description: 'Chart position (e.g., "D1")' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['dataRange', 'chartType']
  },
  handler: async (args: any) => sendIPCCommand('excel_create_chart', args)
}

export const excelDeleteChartTool: ToolDefinition = {
  name: 'excel_delete_chart',
  description: 'Delete chart from worksheet',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      chartIndex: { type: 'number', description: 'Chart index (0-based)' },
      chartName: { type: 'string', description: 'Chart name (alternative to index)' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    }
  },
  handler: async (args: any) => sendIPCCommand('excel_delete_chart', args)
}

export const excelUpdateChartDataTool: ToolDefinition = {
  name: 'excel_update_chart_data',
  description: 'Update chart data range',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      chartIndex: { type: 'number', description: 'Chart index' },
      newDataRange: { type: 'string', description: 'New data range' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['chartIndex', 'newDataRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_update_chart_data', args)
}

export const excelSetChartTitleTool: ToolDefinition = {
  name: 'excel_set_chart_title',
  description: 'Set or update chart title',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      chartIndex: { type: 'number', description: 'Chart index' },
      title: { type: 'string', description: 'Chart title' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['chartIndex', 'title']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_chart_title', args)
}

export const excelSetChartAxisTitleTool: ToolDefinition = {
  name: 'excel_set_chart_axis_title',
  description: 'Set chart axis titles',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      chartIndex: { type: 'number', description: 'Chart index' },
      axis: { type: 'string', enum: ['x', 'y'], description: 'Axis (x or y)' },
      title: { type: 'string', description: 'Axis title' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['chartIndex', 'axis', 'title']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_chart_axis_title', args)
}

export const excelChangeChartTypeTool: ToolDefinition = {
  name: 'excel_change_chart_type',
  description: 'Change chart type',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      chartIndex: { type: 'number', description: 'Chart index' },
      newChartType: { type: 'string', enum: ['column', 'bar', 'line', 'pie', 'area', 'scatter', 'doughnut'], description: 'New chart type' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['chartIndex', 'newChartType']
  },
  handler: async (args: any) => sendIPCCommand('excel_change_chart_type', args)
}

export const excelMoveChartTool: ToolDefinition = {
  name: 'excel_move_chart',
  description: 'Move chart to different position',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      chartIndex: { type: 'number', description: 'Chart index' },
      newPosition: { type: 'string', description: 'New position (e.g., "F1")' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['chartIndex', 'newPosition']
  },
  handler: async (args: any) => sendIPCCommand('excel_move_chart', args)
}

export const excelResizeChartTool: ToolDefinition = {
  name: 'excel_resize_chart',
  description: 'Resize chart dimensions',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      chartIndex: { type: 'number', description: 'Chart index' },
      width: { type: 'number', description: 'Chart width in points' },
      height: { type: 'number', description: 'Chart height in points' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['chartIndex']
  },
  handler: async (args: any) => sendIPCCommand('excel_resize_chart', args)
}

export const excelFormatChartTool: ToolDefinition = {
  name: 'excel_format_chart',
  description: 'Format chart appearance',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      chartIndex: { type: 'number', description: 'Chart index' },
      showLegend: { type: 'boolean', description: 'Show chart legend' },
      legendPosition: { type: 'string', enum: ['top', 'bottom', 'left', 'right'], description: 'Legend position' },
      showDataLabels: { type: 'boolean', description: 'Show data labels' },
      showGridlines: { type: 'boolean', description: 'Show gridlines' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['chartIndex']
  },
  handler: async (args: any) => sendIPCCommand('excel_format_chart', args)
}

export const excelExportChartTool: ToolDefinition = {
  name: 'excel_export_chart',
  description: 'Export chart as image',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      chartIndex: { type: 'number', description: 'Chart index' },
      format: { type: 'string', enum: ['png', 'jpg', 'gif'], default: 'png', description: 'Image format' },
      filePath: { type: 'string', description: 'Export file path' },
      worksheet: { type: 'string', description: 'Worksheet name (optional)' }
    },
    required: ['chartIndex', 'filePath']
  },
  handler: async (args: any) => sendIPCCommand('excel_export_chart', args)
}