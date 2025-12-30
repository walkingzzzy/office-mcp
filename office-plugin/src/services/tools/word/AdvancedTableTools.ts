/**
 * Word 高级表格操作工具
 * 包含：word_add_row, word_add_column, word_delete_row, word_delete_column,
 *       word_merge_cells, word_split_cell, word_format_table, word_set_table_style,
 *       word_set_cell_border, word_set_cell_shading, word_table_to_text
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

/**
 * 获取表格引用的辅助函数
 */
async function getTable(context: Word.RequestContext, tableIndex: number): Promise<Word.Table | null> {
  const tables = context.document.body.tables
  tables.load('items')
  await context.sync()

  if (tables.items.length === 0) {
    return null
  }

  if (tableIndex < 0 || tableIndex >= tables.items.length) {
    return null
  }

  return tables.items[tableIndex]
}

/**
 * 添加行
 * 
 * @param tableIndex - 表格索引（默认 0）
 * @param position - 插入位置：'above' 在指定行上方, 'below' 在指定行下方, 'end' 在表格末尾（默认 'below'）
 * @param rowIndex - 行索引，-1 或不提供表示最后一行
 */
async function wordAddRow(args: Record<string, any>): Promise<FunctionResult> {
  const { tableIndex = 0, position = 'below', rowIndex } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const table = await getTable(context, tableIndex)
      
      if (!table) {
        resolve({ success: false, message: `未找到表格（索引: ${tableIndex}）` })
        return
      }

      table.rows.load('items')
      await context.sync()

      const rowCount = table.rows.items.length
      
      // 计算目标行索引
      // - 如果 position 是 'end' 或 rowIndex 未提供/为 -1，默认操作最后一行
      let targetRowIndex: number
      if (position === 'end' || rowIndex === undefined || rowIndex === -1) {
        targetRowIndex = rowCount - 1  // 最后一行
      } else {
        targetRowIndex = rowIndex
      }
      
      // 验证行索引范围
      if (targetRowIndex < 0 || targetRowIndex >= rowCount) {
        resolve({ 
          success: false, 
          message: `行索引超出范围: ${targetRowIndex}。表格共有 ${rowCount} 行（索引 0-${rowCount - 1}）。` 
        })
        return
      }

      const row = table.rows.items[targetRowIndex]
      // position 为 'end' 时等同于 'below'
      const insertLocation = position === 'above' ? Word.InsertLocation.before : Word.InsertLocation.after
      row.insertRows(insertLocation, 1)

      await context.sync()

      const positionText = position === 'above' ? '上方' : (position === 'end' ? '末尾' : '下方')
      resolve({
        success: true,
        message: `已在第 ${targetRowIndex + 1} 行${positionText}添加新行（表格现有 ${rowCount + 1} 行）`,
        data: { tableIndex, rowIndex: targetRowIndex, position, newRowCount: rowCount + 1 }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `添加行失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 添加列
 */
async function wordAddColumn(args: Record<string, any>): Promise<FunctionResult> {
  const { tableIndex = 0, position = 'right', columnIndex } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const table = await getTable(context, tableIndex)
      
      if (!table) {
        resolve({ success: false, message: `未找到表格（索引: ${tableIndex}）` })
        return
      }

      table.rows.load('items')
      await context.sync()

      if (table.rows.items.length === 0) {
        resolve({ success: false, message: '表格没有行' })
        return
      }

      // 获取第一行来确定列数
      const firstRow = table.rows.items[0]
      firstRow.cells.load('items')
      await context.sync()

      const columnCount = firstRow.cells.items.length
      const targetColumnIndex = columnIndex !== undefined ? columnIndex : columnCount - 1

      if (targetColumnIndex < 0 || targetColumnIndex >= columnCount) {
        resolve({ success: false, message: `列索引超出范围: ${targetColumnIndex}` })
        return
      }

      // 遍历每行添加单元格
      for (const row of table.rows.items) {
        row.cells.load('items')
      }
      await context.sync()

      // Word API 的 addColumns 只支持 start/end，无法在中间插入
      // 返回提示信息说明限制
      resolve({
        success: false,
        message: `Word API 限制：当前不支持在表格中间插入列。请使用 word_insert_table 创建新表格或手动调整。`,
        data: { tableIndex, columnIndex: targetColumnIndex, position }
      })
      return

      await context.sync()

      resolve({
        success: true,
        message: `已在第 ${targetColumnIndex + 1} 列${position === 'left' ? '左侧' : '右侧'}添加新列`,
        data: { tableIndex, columnIndex: targetColumnIndex, position }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `添加列失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 删除行
 */
async function wordDeleteRow(args: Record<string, any>): Promise<FunctionResult> {
  const { tableIndex = 0, rowIndex } = args

  if (rowIndex === undefined) {
    return { success: false, message: 'rowIndex 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const table = await getTable(context, tableIndex)
      
      if (!table) {
        resolve({ success: false, message: `未找到表格（索引: ${tableIndex}）` })
        return
      }

      table.rows.load('items')
      await context.sync()

      if (rowIndex < 0 || rowIndex >= table.rows.items.length) {
        resolve({ success: false, message: `行索引超出范围: ${rowIndex}` })
        return
      }

      table.rows.items[rowIndex].delete()
      await context.sync()

      resolve({
        success: true,
        message: `已删除第 ${rowIndex + 1} 行`,
        data: { tableIndex, rowIndex }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `删除行失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 删除列
 */
async function wordDeleteColumn(args: Record<string, any>): Promise<FunctionResult> {
  const { tableIndex = 0, columnIndex } = args

  if (columnIndex === undefined) {
    return { success: false, message: 'columnIndex 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const table = await getTable(context, tableIndex)
      
      if (!table) {
        resolve({ success: false, message: `未找到表格（索引: ${tableIndex}）` })
        return
      }

      table.rows.load('items')
      await context.sync()

      // 验证列索引
      if (table.rows.items.length > 0) {
        table.rows.items[0].cells.load('items')
        await context.sync()

        if (columnIndex < 0 || columnIndex >= table.rows.items[0].cells.items.length) {
          resolve({ success: false, message: `列索引超出范围: ${columnIndex}` })
          return
        }
      }

      // 删除每行的对应单元格
      for (const row of table.rows.items) {
        row.cells.load('items')
      }
      await context.sync()

      // 从最后一行开始删除，避免索引变化问题
      for (let i = table.rows.items.length - 1; i >= 0; i--) {
        const cells = table.rows.items[i].cells.items
        if (columnIndex < cells.length) {
          cells[columnIndex].deleteColumn()
        }
      }

      await context.sync()

      resolve({
        success: true,
        message: `已删除第 ${columnIndex + 1} 列`,
        data: { tableIndex, columnIndex }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `删除列失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 合并单元格
 */
async function wordMergeCells(args: Record<string, any>): Promise<FunctionResult> {
  const { tableIndex = 0, startRow, startColumn, endRow, endColumn } = args

  if (startRow === undefined || startColumn === undefined || endRow === undefined || endColumn === undefined) {
    return { success: false, message: '请提供 startRow, startColumn, endRow, endColumn 参数' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const table = await getTable(context, tableIndex)
      
      if (!table) {
        resolve({ success: false, message: `未找到表格（索引: ${tableIndex}）` })
        return
      }

      // 获取起始和结束单元格
      table.rows.load('items')
      await context.sync()

      if (startRow < 0 || startRow >= table.rows.items.length ||
          endRow < 0 || endRow >= table.rows.items.length) {
        resolve({ success: false, message: '行索引超出范围' })
        return
      }

      for (const row of table.rows.items) {
        row.cells.load('items')
      }
      await context.sync()

      const startCell = table.rows.items[startRow].cells.items[startColumn]
      const endCell = table.rows.items[endRow].cells.items[endColumn]

      if (!startCell || !endCell) {
        resolve({ success: false, message: '单元格索引超出范围' })
        return
      }

      // 使用 getRange 获取要合并的范围，然后合并
      // 注意：Word API 对单元格合并的支持有限
      try {
        // 尝试使用表格合并功能
        const range = startCell.body.getRange(Word.RangeLocation.whole)
        range.select()
        
        // Word API 目前不直接支持 merge 方法
        // 需要通过选择范围后使用 Word 内置命令
        resolve({
          success: false,
          message: 'word_merge_cells: Office.js 的 Word API 目前不直接支持单元格合并功能。请在 Word 中手动选择单元格后使用"布局-合并单元格"功能。',
          data: { startRow, startColumn, endRow, endColumn }
        })
      } catch {
        resolve({
          success: false,
          message: 'word_merge_cells: Office.js 的 Word API 目前不直接支持单元格合并功能',
          data: { startRow, startColumn, endRow, endColumn }
        })
      }
    }).catch((error) => {
      resolve({
        success: false,
        message: `合并单元格失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 拆分单元格
 */
async function wordSplitCell(args: Record<string, any>): Promise<FunctionResult> {
  const { tableIndex = 0, rowIndex, columnIndex, rows = 1, columns = 2 } = args

  if (rowIndex === undefined || columnIndex === undefined) {
    return { success: false, message: '请提供 rowIndex 和 columnIndex 参数' }
  }

  // Word API 不直接支持单元格拆分
  return {
    success: false,
    message: 'word_split_cell: Office.js 的 Word API 目前不直接支持单元格拆分功能。请在 Word 中手动选择单元格后使用"布局-拆分单元格"功能。',
    data: { tableIndex, rowIndex, columnIndex, rows, columns }
  }
}

/**
 * 格式化表格
 */
async function wordFormatTable(args: Record<string, any>): Promise<FunctionResult> {
  const { tableIndex = 0, headerRow, totalRow, bandedRows, bandedColumns } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const table = await getTable(context, tableIndex)
      
      if (!table) {
        resolve({ success: false, message: `未找到表格（索引: ${tableIndex}）` })
        return
      }

      // 加载表格属性
      table.load('headerRowCount,styleBandedRows,styleBandedColumns,styleFirstColumn,styleLastColumn,styleTotalRow')
      await context.sync()

      // 设置表格格式选项
      if (headerRow !== undefined) {
        table.headerRowCount = headerRow ? 1 : 0
      }
      
      if (bandedRows !== undefined) {
        table.styleBandedRows = bandedRows
      }
      
      if (bandedColumns !== undefined) {
        table.styleBandedColumns = bandedColumns
      }

      if (totalRow !== undefined) {
        table.styleTotalRow = totalRow
      }

      await context.sync()

      resolve({
        success: true,
        message: '表格格式已更新',
        data: { 
          tableIndex, 
          headerRow: table.headerRowCount > 0,
          bandedRows: table.styleBandedRows,
          bandedColumns: table.styleBandedColumns
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `格式化表格失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置表格样式
 */
async function wordSetTableStyle(args: Record<string, any>): Promise<FunctionResult> {
  const { tableIndex = 0, styleName } = args

  if (!styleName) {
    return { success: false, message: 'styleName 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const table = await getTable(context, tableIndex)
      
      if (!table) {
        resolve({ success: false, message: `未找到表格（索引: ${tableIndex}）` })
        return
      }

      // 设置表格样式
      table.style = styleName
      await context.sync()

      resolve({
        success: true,
        message: `表格样式已设置为 "${styleName}"`,
        data: { tableIndex, styleName }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置表格样式失败: ${error instanceof Error ? error.message : String(error)}。可能是样式名称不正确，请使用 Word 内置表格样式名称。`,
        error
      })
    })
  })
}

/**
 * 设置单元格边框
 */
async function wordSetCellBorder(args: Record<string, any>): Promise<FunctionResult> {
  const { tableIndex = 0, rowIndex, columnIndex, borderType = 'all', borderStyle = 'single', borderColor, borderWidth } = args

  if (rowIndex === undefined || columnIndex === undefined) {
    return { success: false, message: '请提供 rowIndex 和 columnIndex 参数' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const table = await getTable(context, tableIndex)
      
      if (!table) {
        resolve({ success: false, message: `未找到表格（索引: ${tableIndex}）` })
        return
      }

      table.rows.load('items')
      await context.sync()

      if (rowIndex < 0 || rowIndex >= table.rows.items.length) {
        resolve({ success: false, message: `行索引超出范围: ${rowIndex}` })
        return
      }

      const row = table.rows.items[rowIndex]
      row.cells.load('items')
      await context.sync()

      if (columnIndex < 0 || columnIndex >= row.cells.items.length) {
        resolve({ success: false, message: `列索引超出范围: ${columnIndex}` })
        return
      }

      const cell = row.cells.items[columnIndex]

      // 设置边框 - Word API 对边框的支持有限
      // 可以通过设置表格样式来间接控制边框
      resolve({
        success: false,
        message: 'word_set_cell_border: Office.js 的 Word API 对单元格边框的细粒度控制有限。建议使用 word_set_table_style 设置整体表格样式，或在 Word 中手动设置边框。',
        data: { tableIndex, rowIndex, columnIndex, borderType, borderStyle, borderColor, borderWidth }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置单元格边框失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置单元格底纹
 */
async function wordSetCellShading(args: Record<string, any>): Promise<FunctionResult> {
  const { tableIndex = 0, rowIndex, columnIndex, backgroundColor, pattern = 'solid' } = args

  if (rowIndex === undefined || columnIndex === undefined || !backgroundColor) {
    return { success: false, message: '请提供 rowIndex、columnIndex 和 backgroundColor 参数' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const table = await getTable(context, tableIndex)
      
      if (!table) {
        resolve({ success: false, message: `未找到表格（索引: ${tableIndex}）` })
        return
      }

      table.rows.load('items')
      await context.sync()

      if (rowIndex < 0 || rowIndex >= table.rows.items.length) {
        resolve({ success: false, message: `行索引超出范围: ${rowIndex}` })
        return
      }

      const row = table.rows.items[rowIndex]
      row.cells.load('items')
      await context.sync()

      if (columnIndex < 0 || columnIndex >= row.cells.items.length) {
        resolve({ success: false, message: `列索引超出范围: ${columnIndex}` })
        return
      }

      const cell = row.cells.items[columnIndex]
      
      // 设置单元格底纹颜色
      cell.shadingColor = backgroundColor
      await context.sync()

      resolve({
        success: true,
        message: '单元格底纹已设置',
        data: { tableIndex, rowIndex, columnIndex, backgroundColor }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置单元格底纹失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 表格转文本
 */
async function wordTableToText(args: Record<string, any>): Promise<FunctionResult> {
  const { tableIndex = 0, separator = 'tab', includeHeaders = true } = args

  const separatorMap: Record<string, string> = {
    tab: '\t',
    comma: ',',
    semicolon: ';',
    space: ' '
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const table = await getTable(context, tableIndex)
      
      if (!table) {
        resolve({ success: false, message: `未找到表格（索引: ${tableIndex}）` })
        return
      }

      table.rows.load('items')
      await context.sync()

      const rows: string[] = []
      const sep = separatorMap[separator] || '\t'

      for (const row of table.rows.items) {
        row.cells.load('items')
      }
      await context.sync()

      for (const row of table.rows.items) {
        const cellTexts: string[] = []
        for (const cell of row.cells.items) {
          cell.body.load('text')
        }
        await context.sync()

        for (const cell of row.cells.items) {
          cellTexts.push(cell.body.text.trim())
        }
        rows.push(cellTexts.join(sep))
      }

      const textContent = rows.join('\n')

      // 获取表格的位置，然后删除表格并插入文本
      const tableRange = table.getRange(Word.RangeLocation.whole)
      tableRange.insertText(textContent, Word.InsertLocation.replace)

      await context.sync()

      resolve({
        success: true,
        message: '表格已转换为文本',
        data: { 
          tableIndex, 
          separator,
          rowCount: rows.length,
          preview: textContent.substring(0, 200)
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `表格转文本失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出高级表格工具定义
 */
export const advancedTableTools: ToolDefinition[] = [
  { name: 'word_add_row', handler: wordAddRow, category: 'table', description: '添加行' },
  { name: 'word_add_column', handler: wordAddColumn, category: 'table', description: '添加列' },
  { name: 'word_delete_row', handler: wordDeleteRow, category: 'table', description: '删除行' },
  { name: 'word_delete_column', handler: wordDeleteColumn, category: 'table', description: '删除列' },
  { name: 'word_merge_cells', handler: wordMergeCells, category: 'table', description: '合并单元格' },
  { name: 'word_split_cell', handler: wordSplitCell, category: 'table', description: '拆分单元格' },
  { name: 'word_format_table', handler: wordFormatTable, category: 'table', description: '格式化表格' },
  { name: 'word_set_table_style', handler: wordSetTableStyle, category: 'table', description: '设置表格样式' },
  { name: 'word_set_cell_border', handler: wordSetCellBorder, category: 'table', description: '设置单元格边框' },
  { name: 'word_set_cell_shading', handler: wordSetCellShading, category: 'table', description: '设置单元格底纹' },
  { name: 'word_table_to_text', handler: wordTableToText, category: 'table', description: '表格转文本' }
]
