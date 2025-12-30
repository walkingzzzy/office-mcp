/**
 * Excel 图表工具
 * 包含 10 个图表相关工具
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

/**
 * 插入图表
 */
async function excelInsertChart(args: Record<string, any>): Promise<FunctionResult> {
  const { sourceAddress, chartType = 'columnClustered', name } = args

  if (!sourceAddress) {
    return { success: false, message: 'sourceAddress 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const sourceRange = sheet.getRange(sourceAddress)
      
      const chart = sheet.charts.add(chartType as any, sourceRange, Excel.ChartSeriesBy.auto)
      
      if (name) {
        chart.name = name
      }
      
      chart.setPosition('A15', 'H30')
      
      await context.sync()

      resolve({
        success: true,
        message: '图表已创建',
        data: { sourceAddress, chartType, name }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `创建图表失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 更新图表
 */
async function excelUpdateChart(args: Record<string, any>): Promise<FunctionResult> {
  const { name, sourceAddress } = args

  if (!name) {
    return { success: false, message: 'name 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const chart = sheet.charts.getItem(name)
      
      if (sourceAddress) {
        const sourceRange = sheet.getRange(sourceAddress)
        chart.setData(sourceRange, Excel.ChartSeriesBy.auto)
      }
      
      await context.sync()

      resolve({
        success: true,
        message: '图表已更新',
        data: { name, sourceAddress }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `更新图表失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 删除图表
 */
async function excelDeleteChart(args: Record<string, any>): Promise<FunctionResult> {
  const { name } = args

  if (!name) {
    return { success: false, message: 'name 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const chart = sheet.charts.getItem(name)
      
      chart.delete()
      
      await context.sync()

      resolve({
        success: true,
        message: '图表已删除',
        data: { name }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `删除图表失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置图表类型
 */
async function excelSetChartType(args: Record<string, any>): Promise<FunctionResult> {
  const { name, chartType } = args

  if (!name || !chartType) {
    return { success: false, message: 'name 和 chartType 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const chart = sheet.charts.getItem(name)
      
      chart.chartType = chartType as any
      
      await context.sync()

      resolve({
        success: true,
        message: '图表类型已更改',
        data: { name, chartType }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置图表类型失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置图表标题
 */
async function excelSetChartTitle(args: Record<string, any>): Promise<FunctionResult> {
  const { name, title, visible = true } = args

  if (!name) {
    return { success: false, message: 'name 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const chart = sheet.charts.getItem(name)
      
      chart.title.visible = visible
      if (title) {
        chart.title.text = title
      }
      
      await context.sync()

      resolve({
        success: true,
        message: '图表标题已设置',
        data: { name, title, visible }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置图表标题失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置坐标轴标题
 */
async function excelSetAxisTitle(args: Record<string, any>): Promise<FunctionResult> {
  const { name, axis, title, visible = true } = args

  if (!name || !axis) {
    return { success: false, message: 'name 和 axis 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const chart = sheet.charts.getItem(name)
      
      let axisObj
      if (axis === 'x' || axis === 'category') {
        axisObj = chart.axes.categoryAxis
      } else {
        axisObj = chart.axes.valueAxis
      }
      
      axisObj.title.visible = visible
      if (title) {
        axisObj.title.text = title
      }
      
      await context.sync()

      resolve({
        success: true,
        message: '坐标轴标题已设置',
        data: { name, axis, title }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置坐标轴标题失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 添加图表系列
 */
async function excelAddChartSeries(args: Record<string, any>): Promise<FunctionResult> {
  const { name, sourceAddress, seriesName } = args

  if (!name || !sourceAddress) {
    return { success: false, message: 'name 和 sourceAddress 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const chart = sheet.charts.getItem(name)
      const sourceRange = sheet.getRange(sourceAddress)
      
      const series = chart.series.add(seriesName)
      series.setValues(sourceRange)
      
      await context.sync()

      resolve({
        success: true,
        message: '图表系列已添加',
        data: { name, sourceAddress, seriesName }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `添加图表系列失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 格式化图表
 */
async function excelFormatChart(args: Record<string, any>): Promise<FunctionResult> {
  const { name, width, height, top, left } = args

  if (!name) {
    return { success: false, message: 'name 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const chart = sheet.charts.getItem(name)
      
      if (width !== undefined) chart.width = width
      if (height !== undefined) chart.height = height
      if (top !== undefined) chart.top = top
      if (left !== undefined) chart.left = left
      
      await context.sync()

      resolve({
        success: true,
        message: '图表格式已设置',
        data: { name, width, height, top, left }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `格式化图表失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 移动图表
 */
async function excelMoveChart(args: Record<string, any>): Promise<FunctionResult> {
  const { name, startCell, endCell } = args

  if (!name) {
    return { success: false, message: 'name 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const chart = sheet.charts.getItem(name)
      
      chart.setPosition(startCell, endCell)
      
      await context.sync()

      resolve({
        success: true,
        message: '图表位置已更新',
        data: { name, startCell, endCell }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `移动图表失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出图表
 */
async function excelExportChart(args: Record<string, any>): Promise<FunctionResult> {
  const { name } = args

  if (!name) {
    return { success: false, message: 'name 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const chart = sheet.charts.getItem(name)
      
      const imageBase64 = chart.getImage(undefined, undefined, Excel.ImageFittingMode.fit)
      
      await context.sync()

      resolve({
        success: true,
        message: '图表已导出为图像',
        data: { 
          name, 
          imageBase64: imageBase64.value,
          format: 'PNG'
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `导出图表失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出图表工具定义
 */
export const chartTools: ToolDefinition[] = [
  { name: 'excel_insert_chart', handler: excelInsertChart, category: 'chart', description: '插入图表' },
  { name: 'excel_update_chart', handler: excelUpdateChart, category: 'chart', description: '更新图表' },
  { name: 'excel_delete_chart', handler: excelDeleteChart, category: 'chart', description: '删除图表' },
  { name: 'excel_set_chart_type', handler: excelSetChartType, category: 'chart', description: '设置图表类型' },
  { name: 'excel_set_chart_title', handler: excelSetChartTitle, category: 'chart', description: '设置图表标题' },
  { name: 'excel_set_axis_title', handler: excelSetAxisTitle, category: 'chart', description: '设置坐标轴标题' },
  { name: 'excel_add_chart_series', handler: excelAddChartSeries, category: 'chart', description: '添加图表系列' },
  { name: 'excel_format_chart', handler: excelFormatChart, category: 'chart', description: '格式化图表' },
  { name: 'excel_move_chart', handler: excelMoveChart, category: 'chart', description: '移动图表' },
  { name: 'excel_export_chart', handler: excelExportChart, category: 'chart', description: '导出图表' }
]
