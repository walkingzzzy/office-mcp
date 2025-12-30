/**
 * Word 表格操作工具
 * 包含：word_insert_table, word_set_cell_value, word_get_cell_value, word_delete_table
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'
import Logger from '../../../utils/logger'

const logger = new Logger('WordTableTools')

/**
 * 插入表格
 */
async function wordInsertTable(args: Record<string, any>): Promise<FunctionResult> {
  const { rows = 3, columns = 3, data, location = 'end' } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const body = context.document.body
      const insertLocation = location === 'start' ? Word.InsertLocation.start : Word.InsertLocation.end

      const tableData: string[][] = data || Array(rows).fill(null).map(() => Array(columns).fill(''))
      
      const table = body.insertTable(tableData.length, tableData[0]?.length || columns, insertLocation, tableData)
      table.load('rowCount,columnCount')
      await context.sync()

      resolve({
        success: true,
        message: '表格插入成功',
        data: {
          rowCount: table.rowCount,
          columnCount: tableData[0]?.length || columns
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `插入表格失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置表格单元格值
 */
async function wordSetCellValue(args: Record<string, any>): Promise<FunctionResult> {
  const { tableIndex = 0, rowIndex, columnIndex, value } = args

  if (rowIndex === undefined || rowIndex === null) {
    return { success: false, message: 'rowIndex 参数不能为空' }
  }
  if (columnIndex === undefined || columnIndex === null) {
    return { success: false, message: 'columnIndex 参数不能为空' }
  }
  if (value === undefined || value === null) {
    return { success: false, message: 'value 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const tables = context.document.body.tables
      tables.load('items')
      await context.sync()

      if (tables.items.length === 0) {
        resolve({
          success: false,
          message: '文档中没有表格，请先使用 word_insert_table 创建表格'
        })
        return
      }

      if (tableIndex >= tables.items.length) {
        resolve({
          success: false,
          message: `表格索引超出范围，文档中只有 ${tables.items.length} 个表格（索引从 0 开始）`
        })
        return
      }

      const table = tables.items[tableIndex]
      table.load('rowCount')
      await context.sync()

      if (rowIndex >= table.rowCount) {
        resolve({
          success: false,
          message: `行索引超出范围，表格只有 ${table.rowCount} 行（索引从 0 开始）`
        })
        return
      }

      table.rows.load('items')
      await context.sync()

      if (rowIndex >= table.rows.items.length) {
        resolve({
          success: false,
          message: `行索引超出范围，表格只有 ${table.rows.items.length} 行（索引从 0 开始）`
        })
        return
      }

      const row = table.rows.items[rowIndex]
      row.cells.load('items')
      await context.sync()

      if (columnIndex >= row.cells.items.length) {
        resolve({
          success: false,
          message: `列索引超出范围，该行只有 ${row.cells.items.length} 列（索引从 0 开始）`
        })
        return
      }

      const cell = row.cells.items[columnIndex]
      cell.body.clear()
      cell.body.insertText(String(value), Word.InsertLocation.start)
      await context.sync()

      logger.info('[TableTools] 单元格写入成功', {
        tableIndex,
        rowIndex,
        columnIndex,
        value: String(value).substring(0, 50)
      })

      resolve({
        success: true,
        message: `成功在表格第 ${tableIndex + 1} 个表格的第 ${rowIndex + 1} 行第 ${columnIndex + 1} 列写入内容`,
        data: {
          tableIndex,
          rowIndex,
          columnIndex,
          value: String(value)
        }
      })
    }).catch((error) => {
      logger.error('[TableTools] 单元格写入失败', { error: error instanceof Error ? error.message : String(error) })
      resolve({
        success: false,
        message: `写入单元格失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 获取表格单元格值
 */
async function wordGetCellValue(args: Record<string, any>): Promise<FunctionResult> {
  const { tableIndex = 0, rowIndex, columnIndex } = args

  if (rowIndex === undefined || columnIndex === undefined) {
    return { success: false, message: 'rowIndex 和 columnIndex 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const tables = context.document.body.tables
      tables.load('items')
      await context.sync()

      if (tableIndex >= tables.items.length) {
        resolve({
          success: false,
          message: `表格索引超出范围，文档中只有 ${tables.items.length} 个表格`
        })
        return
      }

      const table = tables.items[tableIndex]
      table.rows.load('items')
      await context.sync()

      if (rowIndex >= table.rows.items.length) {
        resolve({
          success: false,
          message: `行索引超出范围，表格只有 ${table.rows.items.length} 行`
        })
        return
      }

      const row = table.rows.items[rowIndex]
      row.cells.load('items')
      await context.sync()

      if (columnIndex >= row.cells.items.length) {
        resolve({
          success: false,
          message: `列索引超出范围，该行只有 ${row.cells.items.length} 列`
        })
        return
      }

      const cell = row.cells.items[columnIndex]
      cell.body.load('text')
      await context.sync()

      resolve({
        success: true,
        message: '获取单元格内容成功',
        data: {
          tableIndex,
          rowIndex,
          columnIndex,
          value: cell.body.text.trim()
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `获取单元格内容失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 删除表格
 */
async function wordDeleteTable(args: Record<string, any>): Promise<FunctionResult> {
  const { tableIndex = 0 } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const tables = context.document.body.tables
      tables.load('items')
      await context.sync()

      if (tables.items.length === 0) {
        resolve({
          success: false,
          message: '文档中没有表格'
        })
        return
      }

      if (tableIndex >= tables.items.length) {
        resolve({
          success: false,
          message: `表格索引超出范围，文档中只有 ${tables.items.length} 个表格`
        })
        return
      }

      const table = tables.items[tableIndex]
      table.delete()
      await context.sync()

      resolve({
        success: true,
        message: `成功删除第 ${tableIndex + 1} 个表格`,
        data: { tableIndex }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `删除表格失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出表格工具定义
 */
export const tableTools: ToolDefinition[] = [
  { name: 'word_insert_table', handler: wordInsertTable, category: 'table', description: '插入表格' },
  { name: 'word_set_cell_value', handler: wordSetCellValue, category: 'table', description: '设置单元格值' },
  { name: 'word_get_cell_value', handler: wordGetCellValue, category: 'table', description: '获取单元格值' },
  { name: 'word_delete_table', handler: wordDeleteTable, category: 'table', description: '删除表格' }
]

