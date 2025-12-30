/**
 * Excel 表格增强工具实现
 * 使用 Office.js API (ExcelApi 1.1+) 实现表格高级操作
 * P1 阶段功能
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 创建表格（增强版）
 */
export async function excelCreateTableEnhanced(args: {
  range: string
  hasHeaders?: boolean
  tableName?: string
  tableStyle?: string
  showFilterButton?: boolean
}): Promise<ToolResult> {
  const {
    range,
    hasHeaders = true,
    tableName,
    tableStyle = 'TableStyleMedium2',
    showFilterButton = true
  } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const rangeObj = sheet.getRange(range)

      // 创建表格
      const table = sheet.tables.add(rangeObj, hasHeaders)

      // 设置表格名称
      if (tableName) {
        table.name = tableName
      }

      // 设置表格样式
      table.style = tableStyle

      // 设置筛选按钮显示
      table.showFilterButton = showFilterButton

      table.load('name, id')
      await context.sync()

      return {
        success: true,
        message: `成功创建表格: ${table.name}`,
        data: {
          name: table.name,
          id: table.id,
          range,
          style: tableStyle
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `创建表格失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取表格信息
 */
export async function excelGetTableInfo(args: {
  tableName: string
}): Promise<ToolResult> {
  const { tableName } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const table = sheet.tables.getItem(tableName)

      table.load('name, id, style, showHeaders, showTotals, showFilterButton')
      const range = table.getRange()
      range.load('address, rowCount, columnCount')
      const columns = table.columns
      columns.load('count, items/name')

      await context.sync()

      const columnNames = columns.items.map((col) => col.name)

      return {
        success: true,
        message: `成功获取表格信息`,
        data: {
          name: table.name,
          id: table.id,
          range: range.address,
          rowCount: range.rowCount,
          columnCount: range.columnCount,
          hasHeaders: table.showHeaders,
          showTotals: table.showTotals,
          showFilterButton: table.showFilterButton,
          style: table.style,
          columns: columnNames
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取表格信息失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 添加表格列
 */
export async function excelAddTableColumn(args: {
  tableName: string
  columnName: string
  values?: string[]
  index?: number
}): Promise<ToolResult> {
  const { tableName, columnName, values, index } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const table = sheet.tables.getItem(tableName)

      // 添加列
      const column =
        index !== undefined
          ? table.columns.add(index, null, columnName)
          : table.columns.add(null, null, columnName)

      // 如果提供了数据，填充列
      if (values && values.length > 0) {
        const dataRange = column.getDataBodyRange()
        dataRange.load('rowCount')
        await context.sync()

        // 确保数据长度匹配
        const rowCount = dataRange.rowCount
        const paddedValues = values.slice(0, rowCount)
        while (paddedValues.length < rowCount) {
          paddedValues.push('')
        }

        dataRange.values = paddedValues.map((v) => [v])
      }

      column.load('name, index')
      await context.sync()

      return {
        success: true,
        message: `成功添加列: ${columnName}`,
        data: {
          columnName: column.name,
          index: column.index
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `添加表格列失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 删除表格列
 */
export async function excelDeleteTableColumn(args: {
  tableName: string
  columnName: string
}): Promise<ToolResult> {
  const { tableName, columnName } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const table = sheet.tables.getItem(tableName)
      const column = table.columns.getItem(columnName)

      column.delete()
      await context.sync()

      return {
        success: true,
        message: `成功删除列: ${columnName}`,
        data: { columnName }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `删除表格列失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 添加表格行
 */
export async function excelAddTableRow(args: {
  tableName: string
  values: string[]
  index?: number
}): Promise<ToolResult> {
  const { tableName, values, index } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const table = sheet.tables.getItem(tableName)

      // 添加行
      const row =
        index !== undefined ? table.rows.add(index, [values]) : table.rows.add(null, [values])

      row.load('index')
      await context.sync()

      return {
        success: true,
        message: `成功添加行`,
        data: {
          index: row.index,
          values
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `添加表格行失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 删除表格行
 */
export async function excelDeleteTableRow(args: {
  tableName: string
  index: number
}): Promise<ToolResult> {
  const { tableName, index } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const table = sheet.tables.getItem(tableName)
      const row = table.rows.getItemAt(index)

      row.delete()
      await context.sync()

      return {
        success: true,
        message: `成功删除行`,
        data: { index }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `删除表格行失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 设置表格样式
 */
export async function excelSetTableStyle(args: {
  tableName: string
  style: string
}): Promise<ToolResult> {
  const { tableName, style } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const table = sheet.tables.getItem(tableName)

      table.style = style
      await context.sync()

      return {
        success: true,
        message: `成功设置表格样式: ${style}`,
        data: { tableName, style }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `设置表格样式失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 转换表格为范围
 */
export async function excelConvertTableToRange(args: {
  tableName: string
}): Promise<ToolResult> {
  const { tableName } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const table = sheet.tables.getItem(tableName)

      const range = table.getRange()
      range.load('address')
      await context.sync()

      const rangeAddress = range.address

      // 转换为范围
      table.convertToRange()
      await context.sync()

      return {
        success: true,
        message: `成功转换表格为范围`,
        data: {
          tableName,
          range: rangeAddress
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `转换表格为范围失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取表格数据
 */
export async function excelGetTableData(args: {
  tableName: string
  includeHeaders?: boolean
}): Promise<ToolResult> {
  const { tableName, includeHeaders = true } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const table = sheet.tables.getItem(tableName)

      const headerRange = table.getHeaderRowRange()
      const dataRange = table.getDataBodyRange()

      headerRange.load('values')
      dataRange.load('values')
      await context.sync()

      const headers = headerRange.values[0]
      const rows = dataRange.values

      return {
        success: true,
        message: `成功获取表格数据`,
        data: {
          headers: includeHeaders ? headers : undefined,
          rows,
          rowCount: rows.length,
          columnCount: headers.length
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取表格数据失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 清除表格筛选
 */
export async function excelClearTableFilter(args: {
  tableName: string
}): Promise<ToolResult> {
  const { tableName } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const table = sheet.tables.getItem(tableName)

      // 清除所有列的筛选
      table.autoFilter.clearCriteria()
      await context.sync()

      return {
        success: true,
        message: `成功清除表格筛选`,
        data: { tableName }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `清除表格筛选失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 导出表格增强工具定义
 */
export const tableEnhancedTools: ToolDefinition[] = [
  { name: 'excel_create_table_enhanced', handler: excelCreateTableEnhanced, category: 'table', description: '创建表格（增强版）' },
  { name: 'excel_get_table_info', handler: excelGetTableInfo, category: 'table', description: '获取表格信息' },
  { name: 'excel_add_table_column', handler: excelAddTableColumn, category: 'table', description: '添加表格列' },
  { name: 'excel_delete_table_column', handler: excelDeleteTableColumn, category: 'table', description: '删除表格列' },
  { name: 'excel_add_table_row', handler: excelAddTableRow, category: 'table', description: '添加表格行' },
  { name: 'excel_delete_table_row', handler: excelDeleteTableRow, category: 'table', description: '删除表格行' },
  { name: 'excel_set_table_style', handler: excelSetTableStyle, category: 'table', description: '设置表格样式' },
  { name: 'excel_convert_table_to_range', handler: excelConvertTableToRange, category: 'table', description: '转换表格为范围' },
  { name: 'excel_get_table_data', handler: excelGetTableData, category: 'table', description: '获取表格数据' },
  { name: 'excel_clear_table_filter', handler: excelClearTableFilter, category: 'table', description: '清除表格筛选' }
]
