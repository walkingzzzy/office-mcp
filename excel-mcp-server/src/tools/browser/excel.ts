/**
 * Excel Browser Tools
 *
 * 这些工具通过 IPC 调用浏览器端的 Office.js API
 * 对应 MCPToolExecutor 中的 Excel 工具
 */

import type { ToolDefinition } from '../types.js'
import { getBrowserToolExecutor } from './BrowserToolExecutor.js'

/**
 * Excel - 设置单元格值 (浏览器端)
 */
export const excelSetCellValueBrowserTool: ToolDefinition = {
  name: 'excel_set_cell_value_browser',
  description: 'Set value of a cell in Excel worksheet (browser execution)',
  category: 'excel',
  metadata: {
    documentTypes: ['excel'],
    intentKeywords: ['单元格', '写入', '设置值', 'cell', 'value', '填入', '输入'],
    applicableFor: ['table', 'none'],
    priority: 'P0',
    scenario: '在 Excel 中设置单元格的值'
  },
  inputSchema: {
    type: 'object',
    properties: {
      cell: {
        type: 'string',
        description: 'Cell address in A1 notation (e.g., "A1", "B5", "AA10")'
      },
      value: {
        type: ['string', 'number'],
        description: 'Value to set (text, number, or formula starting with "=")'
      },
      sheet: {
        type: 'string',
        description: 'Sheet name (optional, uses active sheet if not specified)'
      }
    },
    required: ['cell', 'value']
  },
  handler: async (args) => {
    const executor = getBrowserToolExecutor()
    return await executor.executeBrowserTool('excel_set_cell_value', args)
  }
}

/**
 * Excel - 插入图表 (浏览器端)
 */
export const excelInsertChartBrowserTool: ToolDefinition = {
  name: 'excel_insert_chart_browser',
  description: 'Insert a chart into Excel worksheet based on data range (browser execution)',
  category: 'excel',
  metadata: {
    documentTypes: ['excel'],
    intentKeywords: ['图表', '柱状图', '折线图', '饼图', 'chart', 'graph', '可视化'],
    applicableFor: ['table', 'none'],
    priority: 'P1',
    scenario: '在 Excel 中插入图表'
  },
  inputSchema: {
    type: 'object',
    properties: {
      dataRange: {
        type: 'string',
        description: 'Data range for chart in A1 notation (e.g., "A1:B10", "Sheet1!A1:C5")'
      },
      chartType: {
        type: 'string',
        enum: ['ColumnClustered', 'Line', 'Pie', 'BarClustered', 'Area'],
        description:
          'Chart type: ColumnClustered (vertical bars), Line (line chart), Pie (pie chart), BarClustered (horizontal bars), Area (area chart)'
      },
      title: {
        type: 'string',
        description: 'Chart title (optional)'
      },
      sheet: {
        type: 'string',
        description: 'Sheet name (optional, uses active sheet if not specified)'
      }
    },
    required: ['dataRange', 'chartType']
  },
  handler: async (args) => {
    const executor = getBrowserToolExecutor()
    return await executor.executeBrowserTool('excel_insert_chart', args)
  }
}

/**
 * 获取所有 Excel 浏览器工具
 */
export function getExcelBrowserTools(): ToolDefinition[] {
  return [excelSetCellValueBrowserTool, excelInsertChartBrowserTool]
}
