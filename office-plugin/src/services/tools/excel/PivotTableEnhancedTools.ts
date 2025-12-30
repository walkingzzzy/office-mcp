/**
 * Excel 数据透视表增强工具实现
 * 使用 Office.js API (ExcelApi 1.8+) 实现数据透视表高级操作
 * P1 阶段功能
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 创建数据透视表
 */
export async function excelCreatePivotTable(args: {
  sourceRange: string
  destinationRange: string
  pivotTableName?: string
}): Promise<ToolResult> {
  const { sourceRange, destinationRange, pivotTableName } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const sourceRangeObj = sheet.getRange(sourceRange)
      const destinationRangeObj = sheet.getRange(destinationRange)

      // 创建数据透视表
      const pivotTable = sheet.pivotTables.add(
        pivotTableName || 'PivotTable',
        sourceRangeObj,
        destinationRangeObj
      )

      pivotTable.load('name, id')
      await context.sync()

      return {
        success: true,
        message: `成功创建数据透视表: ${pivotTable.name}`,
        data: {
          name: pivotTable.name,
          id: pivotTable.id,
          sourceRange,
          destinationRange
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `创建数据透视表失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 添加行字段
 */
export async function excelAddPivotRowField(args: {
  pivotTableName: string
  fieldName: string
}): Promise<ToolResult> {
  const { pivotTableName, fieldName } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const pivotTable = sheet.pivotTables.getItem(pivotTableName)

      // 添加行字段
      const rowHierarchy = pivotTable.rowHierarchies.add(
        pivotTable.hierarchies.getItem(fieldName)
      )

      rowHierarchy.load('name')
      await context.sync()

      return {
        success: true,
        message: `成功添加行字段: ${fieldName}`,
        data: {
          pivotTableName,
          fieldName
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `添加行字段失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 添加列字段
 */
export async function excelAddPivotColumnField(args: {
  pivotTableName: string
  fieldName: string
}): Promise<ToolResult> {
  const { pivotTableName, fieldName } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const pivotTable = sheet.pivotTables.getItem(pivotTableName)

      // 添加列字段
      const columnHierarchy = pivotTable.columnHierarchies.add(
        pivotTable.hierarchies.getItem(fieldName)
      )

      columnHierarchy.load('name')
      await context.sync()

      return {
        success: true,
        message: `成功添加列字段: ${fieldName}`,
        data: {
          pivotTableName,
          fieldName
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `添加列字段失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 添加数据字段
 */
export async function excelAddPivotDataField(args: {
  pivotTableName: string
  fieldName: string
  summarizeBy?: string
}): Promise<ToolResult> {
  const { pivotTableName, fieldName, summarizeBy = 'Sum' } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const pivotTable = sheet.pivotTables.getItem(pivotTableName)

      // 添加数据字段
      const dataHierarchy = pivotTable.dataHierarchies.add(
        pivotTable.hierarchies.getItem(fieldName)
      )

      // 设置汇总方式
      const summarizeFunctionMap: { [key: string]: Excel.AggregationFunction } = {
        Sum: Excel.AggregationFunction.sum,
        Count: Excel.AggregationFunction.count,
        Average: Excel.AggregationFunction.average,
        Max: Excel.AggregationFunction.max,
        Min: Excel.AggregationFunction.min
      }

      if (summarizeFunctionMap[summarizeBy]) {
        dataHierarchy.summarizeBy = summarizeFunctionMap[summarizeBy]
      }

      dataHierarchy.load('name, summarizeBy')
      await context.sync()

      return {
        success: true,
        message: `成功添加数据字段: ${fieldName}`,
        data: {
          pivotTableName,
          fieldName,
          summarizeBy
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `添加数据字段失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 添加筛选字段
 */
export async function excelAddPivotFilterField(args: {
  pivotTableName: string
  fieldName: string
}): Promise<ToolResult> {
  const { pivotTableName, fieldName } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const pivotTable = sheet.pivotTables.getItem(pivotTableName)

      // 添加筛选字段
      const filterHierarchy = pivotTable.filterHierarchies.add(
        pivotTable.hierarchies.getItem(fieldName)
      )

      filterHierarchy.load('name')
      await context.sync()

      return {
        success: true,
        message: `成功添加筛选字段: ${fieldName}`,
        data: {
          pivotTableName,
          fieldName
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `添加筛选字段失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 刷新数据透视表
 */
export async function excelRefreshPivotTable(args: {
  pivotTableName: string
}): Promise<ToolResult> {
  const { pivotTableName } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const pivotTable = sheet.pivotTables.getItem(pivotTableName)

      // 刷新数据透视表
      pivotTable.refresh()
      await context.sync()

      return {
        success: true,
        message: `成功刷新数据透视表: ${pivotTableName}`,
        data: { pivotTableName }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `刷新数据透视表失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 删除数据透视表
 */
export async function excelDeletePivotTable(args: {
  pivotTableName: string
}): Promise<ToolResult> {
  const { pivotTableName } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const pivotTable = sheet.pivotTables.getItem(pivotTableName)

      // 删除数据透视表
      pivotTable.delete()
      await context.sync()

      return {
        success: true,
        message: `成功删除数据透视表: ${pivotTableName}`,
        data: { pivotTableName }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `删除数据透视表失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取数据透视表信息
 */
export async function excelGetPivotTableInfo(args: {
  pivotTableName: string
}): Promise<ToolResult> {
  const { pivotTableName } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const pivotTable = sheet.pivotTables.getItem(pivotTableName)

      // 加载数据透视表信息
      pivotTable.load('name, id')
      const rowHierarchies = pivotTable.rowHierarchies
      const columnHierarchies = pivotTable.columnHierarchies
      const dataHierarchies = pivotTable.dataHierarchies
      const filterHierarchies = pivotTable.filterHierarchies

      rowHierarchies.load('items/name')
      columnHierarchies.load('items/name')
      dataHierarchies.load('items/name')
      filterHierarchies.load('items/name')

      await context.sync()

      const rowFields = rowHierarchies.items.map((h) => h.name)
      const columnFields = columnHierarchies.items.map((h) => h.name)
      const dataFields = dataHierarchies.items.map((h) => h.name)
      const filterFields = filterHierarchies.items.map((h) => h.name)

      return {
        success: true,
        message: `成功获取数据透视表信息`,
        data: {
          name: pivotTable.name,
          id: pivotTable.id,
          rowFields,
          columnFields,
          dataFields,
          filterFields
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取数据透视表信息失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 设置数据透视表样式
 */
export async function excelSetPivotTableStyle(args: {
  pivotTableName: string
  style: string
}): Promise<ToolResult> {
  const { pivotTableName, style } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const pivotTable = sheet.pivotTables.getItem(pivotTableName)

      // 使用 pivotTable.style 设置样式（而非 layout.style）
      // 注意: style 属性在运行时可用但类型定义中未声明
      ;(pivotTable as any).style = style
      await context.sync()

      return {
        success: true,
        message: `成功设置数据透视表样式: ${style}`,
        data: {
          pivotTableName,
          style
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `设置数据透视表样式失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 移除数据透视表字段
 */
export async function excelRemovePivotField(args: {
  pivotTableName: string
  fieldName: string
}): Promise<ToolResult> {
  const { pivotTableName, fieldName } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const pivotTable = sheet.pivotTables.getItem(pivotTableName)

      // 尝试从各个层次结构中移除字段
      let removed = false

      // 尝试从行字段移除（使用 remove 方法而非 delete）
      try {
        const rowHierarchy = pivotTable.rowHierarchies.getItemOrNullObject(fieldName)
        await context.sync()
        if (!rowHierarchy.isNullObject) {
          pivotTable.rowHierarchies.remove(rowHierarchy)
          removed = true
        }
      } catch (e) {
        // 不在行字段中
      }

      // 尝试从列字段移除
      if (!removed) {
        try {
          const columnHierarchy = pivotTable.columnHierarchies.getItemOrNullObject(fieldName)
          await context.sync()
          if (!columnHierarchy.isNullObject) {
            pivotTable.columnHierarchies.remove(columnHierarchy)
            removed = true
          }
        } catch (e) {
          // 不在列字段中
        }
      }

      // 尝试从数据字段移除
      if (!removed) {
        try {
          const dataHierarchy = pivotTable.dataHierarchies.getItemOrNullObject(fieldName)
          await context.sync()
          if (!dataHierarchy.isNullObject) {
            pivotTable.dataHierarchies.remove(dataHierarchy)
            removed = true
          }
        } catch (e) {
          // 不在数据字段中
        }
      }

      // 尝试从筛选字段移除
      if (!removed) {
        try {
          const filterHierarchy = pivotTable.filterHierarchies.getItemOrNullObject(fieldName)
          await context.sync()
          if (!filterHierarchy.isNullObject) {
            pivotTable.filterHierarchies.remove(filterHierarchy)
            removed = true
          }
        } catch (e) {
          // 不在筛选字段中
        }
      }

      await context.sync()

      if (removed) {
        return {
          success: true,
          message: `成功移除字段: ${fieldName}`,
          data: {
            pivotTableName,
            fieldName
          }
        }
      } else {
        return {
          success: false,
          message: `未找到字段: ${fieldName}`
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `移除字段失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取所有数据透视表
 */
export async function excelGetAllPivotTables(args: {}): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const pivotTables = sheet.pivotTables

      pivotTables.load('items/name, items/id')
      await context.sync()

      const pivotTableList = pivotTables.items.map((pt) => ({
        name: pt.name,
        id: pt.id,
        worksheet: sheet.name
      }))

      return {
        success: true,
        message: `成功获取 ${pivotTableList.length} 个数据透视表`,
        data: {
          pivotTables: pivotTableList,
          total: pivotTableList.length
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取所有数据透视表失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 设置数据透视表布局
 */
export async function excelSetPivotTableLayout(args: {
  pivotTableName: string
  layoutType: string
  showRowHeaders?: boolean
  showColumnHeaders?: boolean
}): Promise<ToolResult> {
  const { pivotTableName, layoutType, showRowHeaders = true, showColumnHeaders = true } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const pivotTable = sheet.pivotTables.getItem(pivotTableName)

      // 设置布局类型
      const layoutTypeMap: { [key: string]: Excel.PivotLayoutType } = {
        Compact: Excel.PivotLayoutType.compact,
        Outline: Excel.PivotLayoutType.outline,
        Tabular: Excel.PivotLayoutType.tabular
      }

      if (layoutTypeMap[layoutType]) {
        pivotTable.layout.layoutType = layoutTypeMap[layoutType]
      }

      // 设置标题显示
      pivotTable.layout.showRowGrandTotals = showRowHeaders
      pivotTable.layout.showColumnGrandTotals = showColumnHeaders

      await context.sync()

      return {
        success: true,
        message: `成功设置数据透视表布局`,
        data: {
          pivotTableName,
          layoutType,
          showRowHeaders,
          showColumnHeaders
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `设置数据透视表布局失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 导出数据透视表增强工具定义
 */
export const pivotTableEnhancedTools: ToolDefinition[] = [
  { name: 'excel_create_pivot_table', handler: excelCreatePivotTable, category: 'pivot', description: '创建数据透视表' },
  { name: 'excel_add_pivot_row_field', handler: excelAddPivotRowField, category: 'pivot', description: '添加行字段' },
  { name: 'excel_add_pivot_column_field', handler: excelAddPivotColumnField, category: 'pivot', description: '添加列字段' },
  { name: 'excel_add_pivot_data_field', handler: excelAddPivotDataField, category: 'pivot', description: '添加数据字段' },
  { name: 'excel_add_pivot_filter_field', handler: excelAddPivotFilterField, category: 'pivot', description: '添加筛选字段' },
  { name: 'excel_refresh_pivot_table', handler: excelRefreshPivotTable, category: 'pivot', description: '刷新数据透视表' },
  { name: 'excel_delete_pivot_table', handler: excelDeletePivotTable, category: 'pivot', description: '删除数据透视表' },
  { name: 'excel_get_pivot_table_info', handler: excelGetPivotTableInfo, category: 'pivot', description: '获取数据透视表信息' },
  { name: 'excel_set_pivot_table_style', handler: excelSetPivotTableStyle, category: 'pivot', description: '设置数据透视表样式' },
  { name: 'excel_remove_pivot_field', handler: excelRemovePivotField, category: 'pivot', description: '移除数据透视表字段' },
  { name: 'excel_get_all_pivot_tables', handler: excelGetAllPivotTables, category: 'pivot', description: '获取所有数据透视表' },
  { name: 'excel_set_pivot_table_layout', handler: excelSetPivotTableLayout, category: 'pivot', description: '设置数据透视表布局' }
]
