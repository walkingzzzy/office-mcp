/**
 * Excel 条件格式工具实现
 * 使用 Office.js API (ExcelApi 1.6+) 实现条件格式操作
 * P1 阶段功能
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 添加色阶条件格式
 */
export async function excelAddColorScaleFormat(args: {
  range: string
  minColor?: string
  midColor?: string
  maxColor?: string
}): Promise<ToolResult> {
  const { range, minColor = '#FF0000', midColor, maxColor = '#00FF00' } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const rangeObj = sheet.getRange(range)

      // 添加色阶条件格式
      const conditionalFormat = rangeObj.conditionalFormats.add(
        Excel.ConditionalFormatType.colorScale
      )
      const colorScale = conditionalFormat.colorScale

      // 设置最小值颜色
      colorScale.criteria = {
        minimum: {
          formula: null,
          type: Excel.ConditionalFormatColorCriterionType.lowestValue,
          color: minColor
        },
        maximum: {
          formula: null,
          type: Excel.ConditionalFormatColorCriterionType.highestValue,
          color: maxColor
        }
      }

      // 如果提供了中间值颜色，设置三色阶
      if (midColor) {
        colorScale.criteria = {
          minimum: {
            formula: null,
            type: Excel.ConditionalFormatColorCriterionType.lowestValue,
            color: minColor
          },
          midpoint: {
            formula: null,
            type: Excel.ConditionalFormatColorCriterionType.percentile,
            color: midColor
          },
          maximum: {
            formula: null,
            type: Excel.ConditionalFormatColorCriterionType.highestValue,
            color: maxColor
          }
        }
      }

      conditionalFormat.load('id')
      await context.sync()

      return {
        success: true,
        message: `成功添加色阶条件格式`,
        data: {
          id: conditionalFormat.id,
          range,
          minColor,
          midColor,
          maxColor
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `添加色阶条件格式失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 添加数据条条件格式
 */
export async function excelAddDataBarFormat(args: {
  range: string
  color?: string
  showValue?: boolean
}): Promise<ToolResult> {
  const { range, color = '#0000FF', showValue = true } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const rangeObj = sheet.getRange(range)

      // 添加数据条条件格式
      const conditionalFormat = rangeObj.conditionalFormats.add(
        Excel.ConditionalFormatType.dataBar
      )
      const dataBar = conditionalFormat.dataBar

      // 设置数据条属性
      dataBar.barDirection = Excel.ConditionalDataBarDirection.leftToRight
      dataBar.showDataBarOnly = !showValue
      dataBar.positiveFormat.fillColor = color

      conditionalFormat.load('id')
      await context.sync()

      return {
        success: true,
        message: `成功添加数据条条件格式`,
        data: {
          id: conditionalFormat.id,
          range,
          color,
          showValue
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `添加数据条条件格式失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 添加图标集条件格式
 */
export async function excelAddIconSetFormat(args: {
  range: string
  iconSet?: string
}): Promise<ToolResult> {
  const { range, iconSet = 'ThreeTrafficLights1' } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const rangeObj = sheet.getRange(range)

      // 添加图标集条件格式
      const conditionalFormat = rangeObj.conditionalFormats.add(
        Excel.ConditionalFormatType.iconSet
      )
      const iconSetCF = conditionalFormat.iconSet

      // 设置图标集类型
      const iconSetMap: { [key: string]: Excel.IconSet } = {
        ThreeArrows: Excel.IconSet.threeArrows,
        ThreeArrowsGray: Excel.IconSet.threeArrowsGray,
        ThreeFlags: Excel.IconSet.threeFlags,
        ThreeTrafficLights1: Excel.IconSet.threeTrafficLights1,
        ThreeTrafficLights2: Excel.IconSet.threeTrafficLights2,
        ThreeSigns: Excel.IconSet.threeSigns,
        ThreeSymbols: Excel.IconSet.threeSymbols,
        ThreeSymbols2: Excel.IconSet.threeSymbols2,
        FourArrows: Excel.IconSet.fourArrows,
        FourArrowsGray: Excel.IconSet.fourArrowsGray,
        FourRedToBlack: Excel.IconSet.fourRedToBlack,
        FourRating: Excel.IconSet.fourRating,
        FourTrafficLights: Excel.IconSet.fourTrafficLights,
        FiveArrows: Excel.IconSet.fiveArrows,
        FiveArrowsGray: Excel.IconSet.fiveArrowsGray,
        FiveRating: Excel.IconSet.fiveRating,
        FiveQuarters: Excel.IconSet.fiveQuarters
      }

      if (iconSetMap[iconSet]) {
        iconSetCF.style = iconSetMap[iconSet]
      }

      conditionalFormat.load('id')
      await context.sync()

      return {
        success: true,
        message: `成功添加图标集条件格式`,
        data: {
          id: conditionalFormat.id,
          range,
          iconSet
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `添加图标集条件格式失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 添加单元格值条件格式
 */
export async function excelAddCellValueFormat(args: {
  range: string
  operator: string
  value: string
  format: {
    fillColor?: string
    fontColor?: string
    bold?: boolean
  }
}): Promise<ToolResult> {
  const { range, operator, value, format } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const rangeObj = sheet.getRange(range)

      // 添加单元格值条件格式
      const conditionalFormat = rangeObj.conditionalFormats.add(
        Excel.ConditionalFormatType.cellValue
      )
      const cellValue = conditionalFormat.cellValue

      // 设置运算符
      const operatorMap: { [key: string]: Excel.ConditionalCellValueOperator } = {
        GreaterThan: Excel.ConditionalCellValueOperator.greaterThan,
        LessThan: Excel.ConditionalCellValueOperator.lessThan,
        Between: Excel.ConditionalCellValueOperator.between,
        EqualTo: Excel.ConditionalCellValueOperator.equalTo,
        NotEqualTo: Excel.ConditionalCellValueOperator.notEqualTo,
        GreaterThanOrEqual: Excel.ConditionalCellValueOperator.greaterThanOrEqual,
        LessThanOrEqual: Excel.ConditionalCellValueOperator.lessThanOrEqual
      }

      if (operatorMap[operator]) {
        cellValue.rule = {
          formula1: value,
          operator: operatorMap[operator]
        }
      }

      // 设置格式
      if (format.fillColor) {
        cellValue.format.fill.color = format.fillColor
      }
      if (format.fontColor) {
        cellValue.format.font.color = format.fontColor
      }
      if (format.bold !== undefined) {
        cellValue.format.font.bold = format.bold
      }

      conditionalFormat.load('id')
      await context.sync()

      return {
        success: true,
        message: `成功添加单元格值条件格式`,
        data: {
          id: conditionalFormat.id,
          range,
          operator,
          value,
          format
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `添加单元格值条件格式失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 添加文本包含条件格式
 */
export async function excelAddTextContainsFormat(args: {
  range: string
  text: string
  format: {
    fillColor?: string
    fontColor?: string
    bold?: boolean
  }
}): Promise<ToolResult> {
  const { range, text, format } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const rangeObj = sheet.getRange(range)

      // 添加文本包含条件格式
      const conditionalFormat = rangeObj.conditionalFormats.add(
        Excel.ConditionalFormatType.containsText
      )
      const textFormat = conditionalFormat.textComparison

      // 设置文本规则
      textFormat.rule = {
        operator: Excel.ConditionalTextOperator.contains,
        text: text
      }

      // 设置格式
      if (format.fillColor) {
        textFormat.format.fill.color = format.fillColor
      }
      if (format.fontColor) {
        textFormat.format.font.color = format.fontColor
      }
      if (format.bold !== undefined) {
        textFormat.format.font.bold = format.bold
      }

      conditionalFormat.load('id')
      await context.sync()

      return {
        success: true,
        message: `成功添加文本包含条件格式`,
        data: {
          id: conditionalFormat.id,
          range,
          text,
          format
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `添加文本包含条件格式失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 添加前/后N项条件格式
 */
export async function excelAddTopBottomFormat(args: {
  range: string
  type: string
  rank: number
  format: {
    fillColor?: string
    fontColor?: string
    bold?: boolean
  }
}): Promise<ToolResult> {
  const { range, type, rank, format } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const rangeObj = sheet.getRange(range)

      // 添加前/后N项条件格式
      const conditionalFormat = rangeObj.conditionalFormats.add(
        Excel.ConditionalFormatType.topBottom
      )
      const topBottom = conditionalFormat.topBottom

      // 设置规则
      topBottom.rule = {
        rank: rank,
        type: type === 'Top' ? Excel.ConditionalTopBottomCriterionType.topItems : Excel.ConditionalTopBottomCriterionType.bottomItems
      }

      // 设置格式
      if (format.fillColor) {
        topBottom.format.fill.color = format.fillColor
      }
      if (format.fontColor) {
        topBottom.format.font.color = format.fontColor
      }
      if (format.bold !== undefined) {
        topBottom.format.font.bold = format.bold
      }

      conditionalFormat.load('id')
      await context.sync()

      return {
        success: true,
        message: `成功添加前/后N项条件格式`,
        data: {
          id: conditionalFormat.id,
          range,
          type,
          rank,
          format
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `添加前/后N项条件格式失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取条件格式
 */
export async function excelGetConditionalFormats(args: {
  range: string
}): Promise<ToolResult> {
  const { range } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const rangeObj = sheet.getRange(range)

      // 获取条件格式
      const conditionalFormats = rangeObj.conditionalFormats
      conditionalFormats.load('items/id, items/type, items/priority')
      await context.sync()

      const formatList = conditionalFormats.items.map((cf) => ({
        id: cf.id,
        type: cf.type,
        priority: cf.priority
      }))

      return {
        success: true,
        message: `成功获取 ${formatList.length} 个条件格式`,
        data: {
          range,
          formats: formatList,
          total: formatList.length
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取条件格式失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 删除条件格式
 */
export async function excelDeleteConditionalFormat(args: {
  range: string
  formatId: string
}): Promise<ToolResult> {
  const { range, formatId } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const rangeObj = sheet.getRange(range)

      // 删除指定的条件格式
      const conditionalFormat = rangeObj.conditionalFormats.getItem(formatId)
      conditionalFormat.delete()
      await context.sync()

      return {
        success: true,
        message: `成功删除条件格式`,
        data: {
          range,
          formatId
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `删除条件格式失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 清除所有条件格式
 */
export async function excelClearConditionalFormats(args: {
  range: string
}): Promise<ToolResult> {
  const { range } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const rangeObj = sheet.getRange(range)

      // 清除所有条件格式
      rangeObj.conditionalFormats.clearAll()
      await context.sync()

      return {
        success: true,
        message: `成功清除所有条件格式`,
        data: { range }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `清除条件格式失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 导出条件格式工具定义
 */
export const conditionalFormatTools: ToolDefinition[] = [
  { name: 'excel_add_color_scale_format', handler: excelAddColorScaleFormat, category: 'formatting', description: '添加色阶条件格式' },
  { name: 'excel_add_data_bar_format', handler: excelAddDataBarFormat, category: 'formatting', description: '添加数据条条件格式' },
  { name: 'excel_add_icon_set_format', handler: excelAddIconSetFormat, category: 'formatting', description: '添加图标集条件格式' },
  { name: 'excel_add_cell_value_format', handler: excelAddCellValueFormat, category: 'formatting', description: '添加单元格值条件格式' },
  { name: 'excel_add_text_contains_format', handler: excelAddTextContainsFormat, category: 'formatting', description: '添加文本包含条件格式' },
  { name: 'excel_add_top_bottom_format', handler: excelAddTopBottomFormat, category: 'formatting', description: '添加前/后N项条件格式' },
  { name: 'excel_get_conditional_formats', handler: excelGetConditionalFormats, category: 'formatting', description: '获取条件格式' },
  { name: 'excel_delete_conditional_format', handler: excelDeleteConditionalFormat, category: 'formatting', description: '删除条件格式' },
  { name: 'excel_clear_conditional_formats', handler: excelClearConditionalFormats, category: 'formatting', description: '清除所有条件格式' }
]
