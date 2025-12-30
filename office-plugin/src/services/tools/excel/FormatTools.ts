/**
 * Excel 格式化工具
 * 包含 15 个格式化相关工具
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

/**
 * 设置单元格格式
 */
async function excelSetCellFormat(args: Record<string, any>): Promise<FunctionResult> {
  const { address, bold, italic, underline, fontSize, fontName, fontColor, backgroundColor } = args

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      if (bold !== undefined) range.format.font.bold = bold
      if (italic !== undefined) range.format.font.italic = italic
      if (underline !== undefined) range.format.font.underline = underline ? 'Single' : 'None'
      if (fontSize !== undefined) range.format.font.size = fontSize
      if (fontName !== undefined) range.format.font.name = fontName
      if (fontColor !== undefined) range.format.font.color = fontColor
      if (backgroundColor !== undefined) range.format.fill.color = backgroundColor
      
      await context.sync()

      resolve({
        success: true,
        message: '单元格格式设置成功',
        data: { address }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置格式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置字体
 */
async function excelSetFont(args: Record<string, any>): Promise<FunctionResult> {
  const { address, fontName, fontSize, bold, italic, color } = args

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      if (fontName) range.format.font.name = fontName
      if (fontSize) range.format.font.size = fontSize
      if (bold !== undefined) range.format.font.bold = bold
      if (italic !== undefined) range.format.font.italic = italic
      if (color) range.format.font.color = color
      
      await context.sync()

      resolve({
        success: true,
        message: '字体设置成功',
        data: { address, fontName, fontSize }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置字体失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置填充颜色
 */
async function excelSetFillColor(args: Record<string, any>): Promise<FunctionResult> {
  const { address, color } = args

  if (!address || !color) {
    return { success: false, message: 'address 和 color 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      range.format.fill.color = color
      
      await context.sync()

      resolve({
        success: true,
        message: '填充颜色设置成功',
        data: { address, color }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置填充颜色失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置边框
 */
async function excelSetBorder(args: Record<string, any>): Promise<FunctionResult> {
  const { address, borderType = 'all', style = 'continuous', color = '#000000', weight = 'thin' } = args

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      const borders = [
        Excel.BorderIndex.edgeTop,
        Excel.BorderIndex.edgeBottom,
        Excel.BorderIndex.edgeLeft,
        Excel.BorderIndex.edgeRight
      ]

      if (borderType === 'all') {
        borders.push(Excel.BorderIndex.insideHorizontal, Excel.BorderIndex.insideVertical)
      }

      for (const border of borders) {
        const borderObj = range.format.borders.getItem(border)
        borderObj.style = style as any
        borderObj.color = color
        borderObj.weight = weight as any
      }
      
      await context.sync()

      resolve({
        success: true,
        message: '边框设置成功',
        data: { address, borderType, style, color }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置边框失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置数字格式
 */
async function excelSetNumberFormat(args: Record<string, any>): Promise<FunctionResult> {
  const { address, format } = args

  if (!address || !format) {
    return { success: false, message: 'address 和 format 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      range.numberFormat = [[format]]
      
      await context.sync()

      resolve({
        success: true,
        message: '数字格式设置成功',
        data: { address, format }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置数字格式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置日期格式
 */
async function excelSetDateFormat(args: Record<string, any>): Promise<FunctionResult> {
  const { address, format = 'yyyy-mm-dd' } = args

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      range.numberFormat = [[format]]
      
      await context.sync()

      resolve({
        success: true,
        message: '日期格式设置成功',
        data: { address, format }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置日期格式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 条件格式
 */
async function excelConditionalFormat(args: Record<string, any>): Promise<FunctionResult> {
  const { address, type, criteria, format } = args

  if (!address || !type) {
    return { success: false, message: 'address 和 type 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      // 根据类型添加条件格式
      if (type === 'colorScale') {
        const conditionalFormat = range.conditionalFormats.add(Excel.ConditionalFormatType.colorScale)
        // 设置颜色刻度
      } else if (type === 'dataBar') {
        const conditionalFormat = range.conditionalFormats.add(Excel.ConditionalFormatType.dataBar)
      } else if (type === 'cellValue') {
        const conditionalFormat = range.conditionalFormats.add(Excel.ConditionalFormatType.cellValue)
        if (criteria) {
          conditionalFormat.cellValue.rule = criteria
        }
        if (format?.backgroundColor) {
          conditionalFormat.cellValue.format.fill.color = format.backgroundColor
        }
      }
      
      await context.sync()

      resolve({
        success: true,
        message: '条件格式已应用',
        data: { address, type }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置条件格式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 清除格式
 */
async function excelClearFormat(args: Record<string, any>): Promise<FunctionResult> {
  const { address } = args

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      range.clear(Excel.ClearApplyTo.formats)
      
      await context.sync()

      resolve({
        success: true,
        message: '格式已清除',
        data: { address }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `清除格式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 复制格式
 */
async function excelCopyFormat(args: Record<string, any>): Promise<FunctionResult> {
  const { sourceAddress, destinationAddress } = args

  if (!sourceAddress || !destinationAddress) {
    return { success: false, message: 'sourceAddress 和 destinationAddress 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const sourceRange = sheet.getRange(sourceAddress)
      const destRange = sheet.getRange(destinationAddress)
      
      destRange.copyFrom(sourceRange, Excel.RangeCopyType.formats, false, false)
      
      await context.sync()

      resolve({
        success: true,
        message: '格式复制成功',
        data: { sourceAddress, destinationAddress }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `复制格式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置对齐方式
 */
async function excelSetAlignment(args: Record<string, any>): Promise<FunctionResult> {
  const { address, horizontalAlignment, verticalAlignment } = args

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      if (horizontalAlignment) {
        range.format.horizontalAlignment = horizontalAlignment as any
      }
      if (verticalAlignment) {
        range.format.verticalAlignment = verticalAlignment as any
      }
      
      await context.sync()

      resolve({
        success: true,
        message: '对齐方式设置成功',
        data: { address, horizontalAlignment, verticalAlignment }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置对齐方式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置自动换行
 */
async function excelSetWrapText(args: Record<string, any>): Promise<FunctionResult> {
  const { address, wrapText = true } = args

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      range.format.wrapText = wrapText
      
      await context.sync()

      resolve({
        success: true,
        message: wrapText ? '自动换行已启用' : '自动换行已禁用',
        data: { address, wrapText }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置自动换行失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 保护工作表
 */
async function excelProtectSheet(args: Record<string, any>): Promise<FunctionResult> {
  const { password, options } = args

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      
      const protectionOptions: Excel.WorksheetProtectionOptions = {
        allowAutoFilter: options?.allowAutoFilter ?? true,
        allowSort: options?.allowSort ?? true,
        allowFormatCells: options?.allowFormatCells ?? false,
        allowInsertRows: options?.allowInsertRows ?? false,
        allowDeleteRows: options?.allowDeleteRows ?? false
      }
      
      sheet.protection.protect(protectionOptions, password)
      
      await context.sync()

      resolve({
        success: true,
        message: '工作表已保护',
        data: { protected: true, hasPassword: !!password }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `保护工作表失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 取消保护工作表
 */
async function excelUnprotectSheet(args: Record<string, any>): Promise<FunctionResult> {
  const { password } = args

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      
      sheet.protection.unprotect(password)
      
      await context.sync()

      resolve({
        success: true,
        message: '工作表保护已取消',
        data: { protected: false }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `取消保护失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 隐藏列
 */
async function excelHideColumns(args: Record<string, any>): Promise<FunctionResult> {
  const { address } = args

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      range.columnHidden = true
      
      await context.sync()

      resolve({
        success: true,
        message: '列已隐藏',
        data: { address }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `隐藏列失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 显示列
 */
async function excelUnhideColumns(args: Record<string, any>): Promise<FunctionResult> {
  const { address } = args

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      range.columnHidden = false
      
      await context.sync()

      resolve({
        success: true,
        message: '列已显示',
        data: { address }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `显示列失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出格式化工具定义
 */
export const formatTools: ToolDefinition[] = [
  { name: 'excel_set_cell_format', handler: excelSetCellFormat, category: 'formatting', description: '设置单元格格式' },
  { name: 'excel_set_font', handler: excelSetFont, category: 'formatting', description: '设置字体' },
  { name: 'excel_set_fill_color', handler: excelSetFillColor, category: 'formatting', description: '设置填充颜色' },
  { name: 'excel_set_border', handler: excelSetBorder, category: 'formatting', description: '设置边框' },
  { name: 'excel_set_number_format', handler: excelSetNumberFormat, category: 'formatting', description: '设置数字格式' },
  { name: 'excel_set_date_format', handler: excelSetDateFormat, category: 'formatting', description: '设置日期格式' },
  { name: 'excel_conditional_format', handler: excelConditionalFormat, category: 'formatting', description: '条件格式' },
  { name: 'excel_clear_format', handler: excelClearFormat, category: 'formatting', description: '清除格式' },
  { name: 'excel_copy_format', handler: excelCopyFormat, category: 'formatting', description: '复制格式' },
  { name: 'excel_set_alignment', handler: excelSetAlignment, category: 'formatting', description: '设置对齐' },
  { name: 'excel_set_wrap_text', handler: excelSetWrapText, category: 'formatting', description: '设置自动换行' },
  { name: 'excel_protect_sheet', handler: excelProtectSheet, category: 'formatting', description: '保护工作表' },
  { name: 'excel_unprotect_sheet', handler: excelUnprotectSheet, category: 'formatting', description: '取消保护工作表' },
  { name: 'excel_hide_columns', handler: excelHideColumns, category: 'formatting', description: '隐藏列' },
  { name: 'excel_unhide_columns', handler: excelUnhideColumns, category: 'formatting', description: '显示列' }
]
