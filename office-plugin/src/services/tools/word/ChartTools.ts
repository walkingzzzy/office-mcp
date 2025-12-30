/**
 * Word 图表操作工具
 * 包含：word_insert_chart, word_get_charts
 * 
 * 注意：Word 中的真正图表需要复杂的 OOXML (DrawingML Chart + 嵌入 Excel)
 * Office.js Web API 对此支持有限，这里使用简化方案
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'
import Logger from '../../../utils/logger'

const logger = new Logger('WordChartTools')

/**
 * 图表类型枚举
 */
type ChartType = 'bar' | 'column' | 'line' | 'pie' | 'area' | 'scatter' | 'doughnut'

/**
 * 图表数据项
 */
interface ChartDataItem {
  label: string
  value: number
  color?: string
}

/**
 * 获取图表类型名称
 */
function getChartTypeName(type: ChartType): string {
  const names: Record<ChartType, string> = {
    bar: '条形图',
    column: '柱状图',
    line: '折线图',
    pie: '饼图',
    area: '面积图',
    scatter: '散点图',
    doughnut: '环形图'
  }
  return names[type] || '图表'
}

/**
 * 插入图表数据表格
 * 
 * 由于 Office.js Web API 限制，无法直接插入 Word 原生图表
 * 此工具插入格式化的数据表格，用户可以：
 * 1. 选中表格
 * 2. 点击 Word 菜单 "插入" > "图表"
 * 3. 选择图表类型后，数据会自动填充
 */
async function wordInsertChart(args: Record<string, any>): Promise<FunctionResult> {
  const { 
    type = 'column',
    data,
    title = '图表数据',
    position = 'cursor'
  } = args

  // 验证图表类型
  const validTypes: ChartType[] = ['bar', 'column', 'line', 'pie', 'area', 'scatter', 'doughnut']
  if (!validTypes.includes(type)) {
    return {
      success: false,
      message: `不支持的图表类型: ${type}。支持的类型: ${validTypes.join(', ')}`
    }
  }

  // 处理数据格式
  let chartData: ChartDataItem[] = []
  
  if (data && Array.isArray(data) && data.length > 0) {
    chartData = data.map((item: any, index: number) => {
      if (typeof item === 'object' && item !== null) {
        return {
          label: item.label || item.name || item.category || `项目${index + 1}`,
          value: Number(item.value) || Number(item.amount) || Number(item.count) || 0,
          color: item.color
        }
      } else if (typeof item === 'number') {
        return { label: `项目${index + 1}`, value: item }
      }
      return { label: String(item), value: 0 }
    })
  } else {
    // 默认示例数据
    logger.info('[ChartTools] 未提供数据，使用示例数据')
    chartData = [
      { label: '一月', value: 120 },
      { label: '二月', value: 150 },
      { label: '三月', value: 180 },
      { label: '四月', value: 140 },
      { label: '五月', value: 200 }
    ]
  }

  logger.info('[ChartTools] 准备插入图表数据', {
    type,
    title,
    dataCount: chartData.length,
    position
  })

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const body = context.document.body
      
      // 确定插入位置
      let insertionPoint: Word.Range
      if (position === 'start') {
        insertionPoint = body.getRange(Word.RangeLocation.start)
      } else if (position === 'cursor') {
        insertionPoint = context.document.getSelection()
      } else {
        insertionPoint = body.getRange(Word.RangeLocation.end)
      }

      // 1. 插入标题
      const titleParagraph = insertionPoint.insertParagraph(title, Word.InsertLocation.after)
      titleParagraph.alignment = Word.Alignment.centered
      titleParagraph.font.bold = true
      titleParagraph.font.size = 14
      
      await context.sync()

      // 2. 获取标题段落后的位置，插入数据表格
      const titleRange = titleParagraph.getRange(Word.RangeLocation.after)
      
      // 简洁的两列表格：类别 | 数值
      const rowCount = chartData.length + 1
      const tableValues: string[][] = [['类别', '数值']]
      
      for (const item of chartData) {
        tableValues.push([item.label, String(item.value)])
      }
      
      // 插入表格
      const table = titleRange.insertTable(rowCount, 2, Word.InsertLocation.after, tableValues)
      
      // 加载表格行以设置样式
      table.load('rows')
      await context.sync()
      
      // 设置表头样式
      const headerRow = table.rows.items[0]
      headerRow.font.bold = true
      headerRow.shadingColor = '#4472C4'
      headerRow.font.color = '#FFFFFF'
      
      await context.sync()

      logger.info('[ChartTools] 图表数据插入成功', {
        type,
        title,
        dataCount: chartData.length
      })

      const chartTypeName = getChartTypeName(type)
      resolve({
        success: true,
        message: `${chartTypeName}数据已插入。\n\n📌 提示：要创建真正的图表，请：\n1. 选中刚插入的数据表格\n2. 点击 Word 菜单「插入」>「图表」\n3. 选择「${chartTypeName}」类型`,
        data: {
          chartType: type,
          title,
          dataCount: chartData.length,
          items: chartData.map(d => `${d.label}: ${d.value}`),
          hint: '选中表格后使用 Word 原生图表功能可创建真正的图表'
        }
      })
    }).catch((error) => {
      logger.error('[ChartTools] 图表数据插入失败', { error: error instanceof Error ? error.message : String(error) })
      resolve({
        success: false,
        message: `插入图表数据失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 获取文档中的图表信息
 * 注意：由于 Word API 限制，只能获取有限的信息
 */
async function wordGetCharts(): Promise<FunctionResult> {
  return new Promise((resolve) => {
    Word.run(async (context) => {
      // Word API 没有直接获取图表的方法
      // 图表作为嵌入对象存在，需要通过 ContentControls 或其他方式查找
      
      const body = context.document.body
      body.load('text')
      await context.sync()

      // 搜索包含图表标记的内容
      const hasChartIndicator = body.text.includes('📊')

      resolve({
        success: true,
        message: hasChartIndicator 
          ? '文档中可能包含图表（检测到图表标记）' 
          : '未检测到图表标记',
        data: {
          hasChartIndicator,
          note: 'Word API 对图表的直接访问支持有限'
        }
      })
    }).catch((error) => {
      logger.error('[ChartTools] 获取图表信息失败', { error: error instanceof Error ? error.message : String(error) })
      resolve({
        success: false,
        message: `获取图表信息失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出图表工具定义
 */
export const chartTools: ToolDefinition[] = [
  { 
    name: 'word_insert_chart', 
    handler: wordInsertChart, 
    category: 'chart', 
    description: '插入图表（柱状图、折线图、饼图等）。参数：type(图表类型: bar/column/line/pie/area/scatter/doughnut), data(数据数组，每项含label和value), title(标题), position(插入位置: cursor/start/end)'
  },
  { 
    name: 'word_get_charts', 
    handler: wordGetCharts, 
    category: 'chart', 
    description: '获取文档中的图表信息' 
  }
]
