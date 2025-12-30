/**
 * Excel 切片器工具实现
 * 使用 Office.js API (ExcelApi 1.10+) 实现切片器操作
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 添加切片器
 */
export async function excelAddSlicer(args: {
  tableName: string
  fieldName: string
  position?: { left: number; top: number }
  style?: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const workbook = context.workbook
      const table = workbook.tables.getItem(args.tableName)
      const column = table.columns.getItem(args.fieldName)

      const slicer = workbook.slicers.add(table, column, args.fieldName)
      if (args.position) {
        slicer.left = args.position.left
        slicer.top = args.position.top
      }
      if (args.style) {
        slicer.style = args.style
      }
      slicer.load('id,name')
      await context.sync()

      return {
        success: true,
        message: '成功添加切片器',
        data: { slicerId: slicer.id, slicerName: slicer.name }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `添加切片器失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 获取所有切片器
 */
export async function excelGetSlicers(args: {
  worksheetName?: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const slicers = context.workbook.slicers
      slicers.load('items/id,items/name,items/caption,items/left,items/top,items/width,items/height,items/style')
      await context.sync()

      const slicerList = slicers.items.map(s => ({
        id: s.id, name: s.name, caption: s.caption,
        left: s.left, top: s.top, width: s.width, height: s.height, style: s.style
      }))

      return {
        success: true,
        message: `成功获取 ${slicerList.length} 个切片器`,
        data: { slicers: slicerList }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `获取切片器失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 获取切片器详情
 */
export async function excelGetSlicerDetail(args: {
  slicerName: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const slicer = context.workbook.slicers.getItem(args.slicerName)
      slicer.load('id,name,caption,left,top,width,height,style,sortBy')
      const items = slicer.slicerItems
      items.load('items/name,items/isSelected,items/hasData')
      await context.sync()

      return {
        success: true,
        message: '成功获取切片器详情',
        data: {
          id: slicer.id, name: slicer.name, caption: slicer.caption,
          left: slicer.left, top: slicer.top, width: slicer.width, height: slicer.height,
          style: slicer.style, sortOrder: slicer.sortBy,
          items: items.items.map(i => ({ name: i.name, selected: i.isSelected, hasData: i.hasData }))
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `获取切片器详情失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 更新切片器
 */
export async function excelUpdateSlicer(args: {
  slicerName: string
  caption?: string
  position?: { left: number; top: number }
  size?: { width: number; height: number }
  style?: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const slicer = context.workbook.slicers.getItem(args.slicerName)
      if (args.caption) slicer.caption = args.caption
      if (args.position) { slicer.left = args.position.left; slicer.top = args.position.top }
      if (args.size) { slicer.width = args.size.width; slicer.height = args.size.height }
      if (args.style) slicer.style = args.style
      await context.sync()
      return { success: true, message: '成功更新切片器' }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `更新切片器失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 设置切片器选择项
 */
export async function excelSetSlicerSelection(args: {
  slicerName: string
  selectedItems: string[]
  clearOthers?: boolean
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const slicer = context.workbook.slicers.getItem(args.slicerName)
      if (args.clearOthers !== false) slicer.clearFilters()
      slicer.selectItems(args.selectedItems)
      await context.sync()
      return { success: true, message: '成功设置切片器选择' }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `设置切片器选择失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}


/**
 * 清除切片器选择
 */
export async function excelClearSlicerSelection(args: {
  slicerName: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const slicer = context.workbook.slicers.getItem(args.slicerName)
      slicer.clearFilters()
      await context.sync()
      return { success: true, message: '成功清除切片器选择' }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `清除切片器选择失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 删除切片器
 */
export async function excelDeleteSlicer(args: {
  slicerName: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const slicer = context.workbook.slicers.getItem(args.slicerName)
      slicer.delete()
      await context.sync()
      return { success: true, message: '成功删除切片器' }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `删除切片器失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 获取切片器项目
 */
export async function excelGetSlicerItems(args: {
  slicerName: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const slicer = context.workbook.slicers.getItem(args.slicerName)
      const items = slicer.slicerItems
      items.load('items/name,items/isSelected,items/hasData')
      await context.sync()

      return {
        success: true,
        message: `成功获取 ${items.items.length} 个切片器项目`,
        data: {
          items: items.items.map(i => ({ name: i.name, selected: i.isSelected, hasData: i.hasData }))
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `获取切片器项目失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 导出切片器工具定义
 */
export const slicerTools: ToolDefinition[] = [
  { name: 'excel_add_slicer', handler: excelAddSlicer, category: 'slicer', description: '添加切片器' },
  { name: 'excel_get_slicers', handler: excelGetSlicers, category: 'slicer', description: '获取所有切片器' },
  { name: 'excel_get_slicer_detail', handler: excelGetSlicerDetail, category: 'slicer', description: '获取切片器详情' },
  { name: 'excel_update_slicer', handler: excelUpdateSlicer, category: 'slicer', description: '更新切片器' },
  { name: 'excel_set_slicer_selection', handler: excelSetSlicerSelection, category: 'slicer', description: '设置切片器选择项' },
  { name: 'excel_clear_slicer_selection', handler: excelClearSlicerSelection, category: 'slicer', description: '清除切片器选择' },
  { name: 'excel_delete_slicer', handler: excelDeleteSlicer, category: 'slicer', description: '删除切片器' },
  { name: 'excel_get_slicer_items', handler: excelGetSlicerItems, category: 'slicer', description: '获取切片器项目' }
]
