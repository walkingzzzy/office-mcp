/**
 * Excel 透视表层次结构工具实现
 * 使用 Office.js API (ExcelApi 1.8+) 实现透视表层次结构操作
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 获取透视表层次结构
 */
export async function excelGetPivotHierarchies(args: {
  pivotTableName: string
  worksheetName?: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const sheet = args.worksheetName
        ? context.workbook.worksheets.getItem(args.worksheetName)
        : context.workbook.worksheets.getActiveWorksheet()

      const pivotTable = sheet.pivotTables.getItem(args.pivotTableName)
      const hierarchies = pivotTable.hierarchies
      hierarchies.load('items/id,items/name')
      await context.sync()

      const hierarchyList = hierarchies.items.map(h => ({ id: h.id, name: h.name }))

      return {
        success: true,
        message: `成功获取 ${hierarchyList.length} 个层次结构`,
        data: { hierarchies: hierarchyList }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `获取透视表层次结构失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 添加透视表层次结构到行/列/值/筛选区域
 */
export async function excelAddPivotHierarchy(args: {
  pivotTableName: string
  hierarchyName: string
  area: 'row' | 'column' | 'data' | 'filter'
  worksheetName?: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const sheet = args.worksheetName
        ? context.workbook.worksheets.getItem(args.worksheetName)
        : context.workbook.worksheets.getActiveWorksheet()

      const pivotTable = sheet.pivotTables.getItem(args.pivotTableName)
      const hierarchy = pivotTable.hierarchies.getItem(args.hierarchyName)

      switch (args.area) {
        case 'row':
          pivotTable.rowHierarchies.add(hierarchy)
          break
        case 'column':
          pivotTable.columnHierarchies.add(hierarchy)
          break
        case 'data':
          pivotTable.dataHierarchies.add(hierarchy)
          break
        case 'filter':
          pivotTable.filterHierarchies.add(hierarchy)
          break
      }
      await context.sync()

      return { success: true, message: `成功将层次结构添加到 ${args.area} 区域` }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `添加透视表层次结构失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 移除透视表层次结构
 */
export async function excelRemovePivotHierarchy(args: {
  pivotTableName: string
  hierarchyName: string
  area: 'row' | 'column' | 'data' | 'filter'
  worksheetName?: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const sheet = args.worksheetName
        ? context.workbook.worksheets.getItem(args.worksheetName)
        : context.workbook.worksheets.getActiveWorksheet()

      const pivotTable = sheet.pivotTables.getItem(args.pivotTableName)

      switch (args.area) {
        case 'row':
          pivotTable.rowHierarchies.getItem(args.hierarchyName).setToDefault()
          break
        case 'column':
          pivotTable.columnHierarchies.getItem(args.hierarchyName).setToDefault()
          break
        case 'data':
          pivotTable.dataHierarchies.getItem(args.hierarchyName).setToDefault()
          break
        case 'filter':
          pivotTable.filterHierarchies.getItem(args.hierarchyName).setToDefault()
          break
      }
      await context.sync()

      return { success: true, message: `成功从 ${args.area} 区域移除层次结构` }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `移除透视表层次结构失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 展开透视表层次结构
 */
export async function excelExpandPivotHierarchy(args: {
  pivotTableName: string
  hierarchyName: string
  worksheetName?: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const sheet = args.worksheetName
        ? context.workbook.worksheets.getItem(args.worksheetName)
        : context.workbook.worksheets.getActiveWorksheet()

      const pivotTable = sheet.pivotTables.getItem(args.pivotTableName)
      const rowHierarchy = pivotTable.rowHierarchies.getItemOrNullObject(args.hierarchyName)
      await context.sync()

      if (rowHierarchy.isNullObject) {
        return { success: false, message: '未找到指定的行层次结构' }
      }

      // 展开所有项目
      pivotTable.refresh()
      await context.sync()

      return { success: true, message: '成功展开透视表层次结构' }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `展开透视表层次结构失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 折叠透视表层次结构
 */
export async function excelCollapsePivotHierarchy(args: {
  pivotTableName: string
  hierarchyName: string
  worksheetName?: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const sheet = args.worksheetName
        ? context.workbook.worksheets.getItem(args.worksheetName)
        : context.workbook.worksheets.getActiveWorksheet()

      const pivotTable = sheet.pivotTables.getItem(args.pivotTableName)
      pivotTable.refresh()
      await context.sync()

      return { success: true, message: '成功折叠透视表层次结构' }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `折叠透视表层次结构失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 移动透视表层次结构位置
 */
export async function excelMovePivotHierarchy(args: {
  pivotTableName: string
  hierarchyName: string
  area: 'row' | 'column'
  position: number
  worksheetName?: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const sheet = args.worksheetName
        ? context.workbook.worksheets.getItem(args.worksheetName)
        : context.workbook.worksheets.getActiveWorksheet()

      const pivotTable = sheet.pivotTables.getItem(args.pivotTableName)
      const hierarchies = args.area === 'row'
        ? pivotTable.rowHierarchies
        : pivotTable.columnHierarchies

      const hierarchy = hierarchies.getItem(args.hierarchyName)
      hierarchy.position = args.position
      await context.sync()

      return { success: true, message: `成功移动层次结构到位置 ${args.position}` }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `移动透视表层次结构失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 设置透视表层次结构排序
 */
export async function excelSetPivotHierarchySort(args: {
  pivotTableName: string
  hierarchyName: string
  sortOrder: 'ascending' | 'descending'
  worksheetName?: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const sheet = args.worksheetName
        ? context.workbook.worksheets.getItem(args.worksheetName)
        : context.workbook.worksheets.getActiveWorksheet()

      const pivotTable = sheet.pivotTables.getItem(args.pivotTableName)
      const rowHierarchy = pivotTable.rowHierarchies.getItemOrNullObject(args.hierarchyName)
      await context.sync()

      if (!rowHierarchy.isNullObject) {
        rowHierarchy.load('fields')
        await context.sync()
        const field = rowHierarchy.fields.items[0]
        if (field) {
          field.sortByLabels(args.sortOrder === 'ascending'
            ? Excel.SortBy.ascending
            : Excel.SortBy.descending)
          await context.sync()
        }
      }

      return { success: true, message: `成功设置层次结构排序为 ${args.sortOrder}` }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `设置透视表层次结构排序失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 获取透视表层次结构项目
 */
export async function excelGetPivotHierarchyItems(args: {
  pivotTableName: string
  hierarchyName: string
  worksheetName?: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const sheet = args.worksheetName
        ? context.workbook.worksheets.getItem(args.worksheetName)
        : context.workbook.worksheets.getActiveWorksheet()

      const pivotTable = sheet.pivotTables.getItem(args.pivotTableName)
      const rowHierarchy = pivotTable.rowHierarchies.getItemOrNullObject(args.hierarchyName)
      await context.sync()

      if (rowHierarchy.isNullObject) {
        return { success: false, message: '未找到指定的行层次结构' }
      }

      rowHierarchy.load('fields')
      await context.sync()
      const field = rowHierarchy.fields.items[0]
      if (!field) {
        return { success: false, message: '层次结构中没有字段' }
      }
      const items = field.items
      items.load('items/id,items/name,items/isExpanded,items/visible')
      await context.sync()

      const itemList = items.items.map((i: any) => ({
        id: i.id, name: i.name, isExpanded: i.isExpanded, visible: i.visible
      }))

      return {
        success: true,
        message: `成功获取 ${itemList.length} 个层次结构项目`,
        data: { items: itemList }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `获取透视表层次结构项目失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 导出透视表层次结构工具定义
 */
export const pivotHierarchyTools: ToolDefinition[] = [
  { name: 'excel_get_pivot_hierarchies', handler: excelGetPivotHierarchies, category: 'pivotHierarchy', description: '获取透视表层次结构' },
  { name: 'excel_add_pivot_hierarchy', handler: excelAddPivotHierarchy, category: 'pivotHierarchy', description: '添加透视表层次结构' },
  { name: 'excel_remove_pivot_hierarchy', handler: excelRemovePivotHierarchy, category: 'pivotHierarchy', description: '移除透视表层次结构' },
  { name: 'excel_expand_pivot_hierarchy', handler: excelExpandPivotHierarchy, category: 'pivotHierarchy', description: '展开透视表层次结构' },
  { name: 'excel_collapse_pivot_hierarchy', handler: excelCollapsePivotHierarchy, category: 'pivotHierarchy', description: '折叠透视表层次结构' },
  { name: 'excel_move_pivot_hierarchy', handler: excelMovePivotHierarchy, category: 'pivotHierarchy', description: '移动透视表层次结构位置' },
  { name: 'excel_set_pivot_hierarchy_sort', handler: excelSetPivotHierarchySort, category: 'pivotHierarchy', description: '设置透视表层次结构排序' },
  { name: 'excel_get_pivot_hierarchy_items', handler: excelGetPivotHierarchyItems, category: 'pivotHierarchy', description: '获取透视表层次结构项目' }
]
