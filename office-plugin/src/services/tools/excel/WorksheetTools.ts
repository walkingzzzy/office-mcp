/**
 * Excel 工作表工具
 * 包含 10 个工作表相关工具
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

/**
 * 添加工作表
 */
async function excelAddWorksheet(args: Record<string, any>): Promise<FunctionResult> {
  const { name } = args

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.add(name)
      sheet.load('name')
      await context.sync()

      resolve({
        success: true,
        message: '工作表添加成功',
        data: { name: sheet.name }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `添加工作表失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 删除工作表
 */
async function excelDeleteWorksheet(args: Record<string, any>): Promise<FunctionResult> {
  const { name } = args

  if (!name) {
    return { success: false, message: 'name 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getItem(name)
      sheet.delete()
      await context.sync()

      resolve({
        success: true,
        message: '工作表已删除',
        data: { name }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `删除工作表失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 重命名工作表
 */
async function excelRenameWorksheet(args: Record<string, any>): Promise<FunctionResult> {
  const { oldName, newName } = args

  if (!oldName || !newName) {
    return { success: false, message: 'oldName 和 newName 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getItem(oldName)
      sheet.name = newName
      await context.sync()

      resolve({
        success: true,
        message: '工作表已重命名',
        data: { oldName, newName }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `重命名工作表失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 复制工作表
 */
async function excelCopyWorksheet(args: Record<string, any>): Promise<FunctionResult> {
  const { sourceName, newName, position = 'end' } = args

  if (!sourceName) {
    return { success: false, message: 'sourceName 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sourceSheet = context.workbook.worksheets.getItem(sourceName)
      
      // Excel API 不直接支持复制工作表，使用替代方案
      const newSheet = context.workbook.worksheets.add(newName || `${sourceName}_Copy`)
      
      // 获取源工作表的数据
      const usedRange = sourceSheet.getUsedRange()
      usedRange.load('values,formulas,address')
      await context.sync()

      // 复制数据到新工作表
      if (usedRange.values) {
        const destRange = newSheet.getRange(usedRange.address.split('!')[1])
        destRange.values = usedRange.values
        destRange.formulas = usedRange.formulas
      }
      
      await context.sync()

      resolve({
        success: true,
        message: '工作表已复制',
        data: { sourceName, newName: newSheet.name }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `复制工作表失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 移动工作表
 */
async function excelMoveWorksheet(args: Record<string, any>): Promise<FunctionResult> {
  const { name, position } = args

  if (!name || position === undefined) {
    return { success: false, message: 'name 和 position 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getItem(name)
      sheet.position = position
      await context.sync()

      resolve({
        success: true,
        message: '工作表位置已更改',
        data: { name, position }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `移动工作表失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 隐藏工作表
 */
async function excelHideWorksheet(args: Record<string, any>): Promise<FunctionResult> {
  const { name } = args

  if (!name) {
    return { success: false, message: 'name 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getItem(name)
      sheet.visibility = Excel.SheetVisibility.hidden
      await context.sync()

      resolve({
        success: true,
        message: '工作表已隐藏',
        data: { name }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `隐藏工作表失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 显示工作表
 */
async function excelUnhideWorksheet(args: Record<string, any>): Promise<FunctionResult> {
  const { name } = args

  if (!name) {
    return { success: false, message: 'name 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getItem(name)
      sheet.visibility = Excel.SheetVisibility.visible
      await context.sync()

      resolve({
        success: true,
        message: '工作表已显示',
        data: { name }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `显示工作表失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 保护工作簿
 */
async function excelProtectWorkbook(args: Record<string, any>): Promise<FunctionResult> {
  const { password } = args

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      context.workbook.protection.protect(password)
      await context.sync()

      resolve({
        success: true,
        message: '工作簿已保护',
        data: { hasPassword: !!password }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `保护工作簿失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 获取工作表名称列表
 */
async function excelGetSheetNames(_args: Record<string, any>): Promise<FunctionResult> {
  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheets = context.workbook.worksheets
      sheets.load('items/name,items/visibility')
      await context.sync()

      const names = sheets.items.map(sheet => ({
        name: sheet.name,
        visible: sheet.visibility === Excel.SheetVisibility.visible
      }))

      resolve({
        success: true,
        message: '获取工作表名称成功',
        data: { sheets: names, count: names.length }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `获取工作表名称失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 激活工作表
 */
async function excelActivateWorksheet(args: Record<string, any>): Promise<FunctionResult> {
  const { name } = args

  if (!name) {
    return { success: false, message: 'name 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getItem(name)
      sheet.activate()
      await context.sync()

      resolve({
        success: true,
        message: '工作表已激活',
        data: { name }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `激活工作表失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出工作表工具定义
 */
export const worksheetTools: ToolDefinition[] = [
  { name: 'excel_add_worksheet', handler: excelAddWorksheet, category: 'worksheet', description: '添加工作表' },
  { name: 'excel_delete_worksheet', handler: excelDeleteWorksheet, category: 'worksheet', description: '删除工作表' },
  { name: 'excel_rename_worksheet', handler: excelRenameWorksheet, category: 'worksheet', description: '重命名工作表' },
  { name: 'excel_copy_worksheet', handler: excelCopyWorksheet, category: 'worksheet', description: '复制工作表' },
  { name: 'excel_move_worksheet', handler: excelMoveWorksheet, category: 'worksheet', description: '移动工作表' },
  { name: 'excel_hide_worksheet', handler: excelHideWorksheet, category: 'worksheet', description: '隐藏工作表' },
  { name: 'excel_unhide_worksheet', handler: excelUnhideWorksheet, category: 'worksheet', description: '显示工作表' },
  { name: 'excel_protect_workbook', handler: excelProtectWorkbook, category: 'worksheet', description: '保护工作簿' },
  { name: 'excel_get_sheet_names', handler: excelGetSheetNames, category: 'worksheet', description: '获取工作表名称' },
  { name: 'excel_activate_worksheet', handler: excelActivateWorksheet, category: 'worksheet', description: '激活工作表' }
]
