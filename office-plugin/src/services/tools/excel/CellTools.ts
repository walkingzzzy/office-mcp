/**
 * Excel 单元格操作工具
 * 包含 20 个单元格相关工具
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

/**
 * 设置单元格值
 */
async function excelSetCellValue(args: Record<string, unknown>): Promise<FunctionResult> {
  const address = args.address as string
  const value = args.value

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      range.values = [[value]]
      await context.sync()

      resolve({
        success: true,
        message: '单元格值设置成功',
        data: { address, value }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置单元格值失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 获取单元格值
 */
async function excelGetCellValue(args: Record<string, unknown>): Promise<FunctionResult> {
  const address = args.address as string

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      range.load('values')
      await context.sync()

      resolve({
        success: true,
        message: '获取单元格值成功',
        data: { address, value: range.values[0][0] }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `获取单元格值失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置范围值
 */
async function excelSetRangeValues(args: Record<string, unknown>): Promise<FunctionResult> {
  const address = args.address as string
  const values = args.values as unknown[][]

  if (!address || !values) {
    return { success: false, message: 'address 和 values 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      range.values = values
      await context.sync()

      resolve({
        success: true,
        message: '范围值设置成功',
        data: { address, rowCount: values.length, colCount: (values[0] as unknown[])?.length || 0 }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置范围值失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 获取范围值
 */
async function excelGetRangeValues(args: Record<string, unknown>): Promise<FunctionResult> {
  const address = args.address as string

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      range.load('values')
      await context.sync()

      resolve({
        success: true,
        message: '获取范围值成功',
        data: { address, values: range.values }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `获取范围值失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 清除范围
 */
async function excelClearRange(args: Record<string, unknown>): Promise<FunctionResult> {
  const address = args.address as string
  const clearType = (args.clearType as string) || 'all'

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      switch (clearType) {
        case 'contents':
          range.clear(Excel.ClearApplyTo.contents)
          break
        case 'formats':
          range.clear(Excel.ClearApplyTo.formats)
          break
        case 'hyperlinks':
          range.clear(Excel.ClearApplyTo.hyperlinks)
          break
        default:
          range.clear(Excel.ClearApplyTo.all)
      }
      
      await context.sync()

      resolve({
        success: true,
        message: '范围清除成功',
        data: { address, clearType }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `清除范围失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 插入单元格
 */
async function excelInsertCells(args: Record<string, unknown>): Promise<FunctionResult> {
  const address = args.address as string
  const shift = (args.shift as string) || 'down'

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      const shiftDirection = shift === 'right' ? Excel.InsertShiftDirection.right : Excel.InsertShiftDirection.down
      range.insert(shiftDirection)
      
      await context.sync()

      resolve({
        success: true,
        message: '单元格插入成功',
        data: { address, shift }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `插入单元格失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 删除单元格
 */
async function excelDeleteCells(args: Record<string, unknown>): Promise<FunctionResult> {
  const address = args.address as string
  const shift = (args.shift as string) || 'up'

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      const shiftDirection = shift === 'left' ? Excel.DeleteShiftDirection.left : Excel.DeleteShiftDirection.up
      range.delete(shiftDirection)
      
      await context.sync()

      resolve({
        success: true,
        message: '单元格删除成功',
        data: { address, shift }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `删除单元格失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 合并单元格
 */
async function excelMergeCells(args: Record<string, unknown>): Promise<FunctionResult> {
  const address = args.address as string
  const across = (args.across as boolean) || false

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      if (across) {
        range.merge(true) // across = true 表示跨行合并
      } else {
        range.merge(false)
      }
      
      await context.sync()

      resolve({
        success: true,
        message: '单元格合并成功',
        data: { address, across }
      })
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
 * 取消合并单元格
 */
async function excelUnmergeCells(args: Record<string, unknown>): Promise<FunctionResult> {
  const address = args.address as string

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      range.unmerge()
      
      await context.sync()

      resolve({
        success: true,
        message: '取消合并成功',
        data: { address }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `取消合并失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 复制范围
 */
async function excelCopyRange(args: Record<string, unknown>): Promise<FunctionResult> {
  const sourceAddress = args.sourceAddress as string
  const destinationAddress = args.destinationAddress as string

  if (!sourceAddress || !destinationAddress) {
    return { success: false, message: 'sourceAddress 和 destinationAddress 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const sourceRange = sheet.getRange(sourceAddress)
      const destRange = sheet.getRange(destinationAddress)
      
      destRange.copyFrom(sourceRange, Excel.RangeCopyType.all, false, false)
      
      await context.sync()

      resolve({
        success: true,
        message: '范围复制成功',
        data: { sourceAddress, destinationAddress }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `复制范围失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 剪切范围
 */
async function excelCutRange(args: Record<string, unknown>): Promise<FunctionResult> {
  const sourceAddress = args.sourceAddress as string
  const destinationAddress = args.destinationAddress as string

  if (!sourceAddress || !destinationAddress) {
    return { success: false, message: 'sourceAddress 和 destinationAddress 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const sourceRange = sheet.getRange(sourceAddress)
      const destRange = sheet.getRange(destinationAddress)
      
      // 先复制再清除源
      destRange.copyFrom(sourceRange, Excel.RangeCopyType.all, false, false)
      sourceRange.clear(Excel.ClearApplyTo.all)
      
      await context.sync()

      resolve({
        success: true,
        message: '范围剪切成功',
        data: { sourceAddress, destinationAddress }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `剪切范围失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 粘贴范围
 */
async function excelPasteRange(args: Record<string, unknown>): Promise<FunctionResult> {
  const { destinationAddress, pasteType = 'all' } = args

  if (!destinationAddress) {
    return { success: false, message: 'destinationAddress 参数不能为空' }
  }

  // 粘贴需要先有复制操作，这里返回说明
  return {
    success: false,
    message: 'excel_paste_range: 请使用 excel_copy_range 直接指定源和目标地址进行复制操作。Excel API 不支持独立的粘贴操作。',
    data: { destinationAddress, pasteType }
  }
}

/**
 * 查找单元格
 */
async function excelFindCell(args: Record<string, unknown>): Promise<FunctionResult> {
  const searchText = args.searchText as string
  const searchRange = args.searchRange as string | undefined
  const matchCase = (args.matchCase as boolean) || false
  const matchEntireCell = (args.matchEntireCell as boolean) || false

  if (!searchText) {
    return { success: false, message: 'searchText 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = searchRange ? sheet.getRange(searchRange) : sheet.getUsedRange()

      range.load('values,address')
      await context.sync()

      const values = range.values
      const results: Array<{ address: string; value: unknown }> = []
      
      // 获取范围起始位置
      const addressParts = range.address.split('!')[1].split(':')[0]
      const startCol = addressParts.replace(/[0-9]/g, '').charCodeAt(0) - 65
      const startRow = parseInt(addressParts.replace(/[A-Za-z]/g, ''), 10) - 1

      for (let row = 0; row < values.length; row++) {
        for (let col = 0; col < values[row].length; col++) {
          const cellValue = String(values[row][col])
          const searchValue = matchCase ? searchText : searchText.toLowerCase()
          const compareValue = matchCase ? cellValue : cellValue.toLowerCase()
          
          let isMatch = false
          if (matchEntireCell) {
            isMatch = compareValue === searchValue
          } else {
            isMatch = compareValue.includes(searchValue)
          }
          
          if (isMatch) {
            const colLetter = String.fromCharCode(65 + startCol + col)
            const rowNum = startRow + row + 1
            results.push({
              address: `${colLetter}${rowNum}`,
              value: values[row][col]
            })
          }
        }
      }

      resolve({
        success: true,
        message: `找到 ${results.length} 个匹配项`,
        data: { searchText, results, matchCount: results.length }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `查找失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 替换单元格
 */
async function excelReplaceCell(args: Record<string, unknown>): Promise<FunctionResult> {
  const searchText = args.searchText as string
  const replaceText = args.replaceText as string
  const searchRange = args.searchRange as string | undefined
  const matchCase = (args.matchCase as boolean) || false
  const replaceAll = args.replaceAll !== false

  if (!searchText || replaceText === undefined) {
    return { success: false, message: 'searchText 和 replaceText 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = searchRange ? sheet.getRange(searchRange) : sheet.getUsedRange()
      
      range.load('values')
      await context.sync()

      const values = range.values
      let replaceCount = 0

      for (let row = 0; row < values.length; row++) {
        for (let col = 0; col < values[row].length; col++) {
          const cellValue = String(values[row][col])
          const searchVal = matchCase ? searchText : searchText.toLowerCase()
          const compareVal = matchCase ? cellValue : cellValue.toLowerCase()
          
          if (compareVal.includes(searchVal)) {
            if (matchCase) {
              values[row][col] = cellValue.replace(new RegExp(searchText, replaceAll ? 'g' : ''), replaceText)
            } else {
              values[row][col] = cellValue.replace(new RegExp(searchText, replaceAll ? 'gi' : 'i'), replaceText)
            }
            replaceCount++
            if (!replaceAll) break
          }
        }
        if (!replaceAll && replaceCount > 0) break
      }

      range.values = values
      await context.sync()

      resolve({
        success: true,
        message: `已替换 ${replaceCount} 处`,
        data: { searchText, replaceText, replaceCount }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `替换失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 排序范围
 */
async function excelSortRange(args: Record<string, unknown>): Promise<FunctionResult> {
  const address = args.address as string
  const sortColumn = (args.sortColumn as number) || 0
  const ascending = args.ascending !== false
  const hasHeaders = args.hasHeaders !== false

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      range.sort.apply([{
        key: sortColumn,
        ascending: ascending
      }], false, hasHeaders)
      
      await context.sync()

      resolve({
        success: true,
        message: '排序成功',
        data: { address, sortColumn, ascending, hasHeaders }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `排序失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 筛选范围
 */
async function excelFilterRange(args: Record<string, unknown>): Promise<FunctionResult> {
  const address = args.address as string
  const filterColumn = args.filterColumn as number | undefined
  const criteria = args.criteria as string | undefined

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      // 使用 Worksheet 的 autoFilter 而不是 Range 的
      if (criteria) {
        // 应用筛选条件
        const autoFilter = sheet.autoFilter
        autoFilter.apply(range, filterColumn, { criterion1: criteria } as any)
      } else {
        // 清除筛选
        const autoFilter = sheet.autoFilter
        autoFilter.clearCriteria()
      }
      
      await context.sync()

      resolve({
        success: true,
        message: criteria ? '筛选已应用' : '筛选已清除',
        data: { address, filterColumn, criteria }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `筛选操作失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 自动调整列宽
 */
async function excelAutofitColumns(args: Record<string, any>): Promise<FunctionResult> {
  const { address } = args

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      range.format.autofitColumns()
      
      await context.sync()

      resolve({
        success: true,
        message: '列宽已自动调整',
        data: { address }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `自动调整列宽失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置列宽
 */
async function excelSetColumnWidth(args: Record<string, any>): Promise<FunctionResult> {
  const { address, width } = args

  if (!address || width === undefined) {
    return { success: false, message: 'address 和 width 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      range.format.columnWidth = width
      
      await context.sync()

      resolve({
        success: true,
        message: '列宽设置成功',
        data: { address, width }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置列宽失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置行高
 */
async function excelSetRowHeight(args: Record<string, any>): Promise<FunctionResult> {
  const { address, height } = args

  if (!address || height === undefined) {
    return { success: false, message: 'address 和 height 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      range.format.rowHeight = height
      
      await context.sync()

      resolve({
        success: true,
        message: '行高设置成功',
        data: { address, height }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置行高失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 冻结窗格
 */
async function excelFreezePanes(args: Record<string, any>): Promise<FunctionResult> {
  const { freezeType = 'rows', count = 1 } = args

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      
      // 先取消冻结
      sheet.freezePanes.unfreeze()
      await context.sync()

      if (freezeType === 'rows') {
        sheet.freezePanes.freezeRows(count)
      } else if (freezeType === 'columns') {
        sheet.freezePanes.freezeColumns(count)
      } else if (freezeType === 'both') {
        // 冻结指定行列数
        const range = sheet.getRange(`A1:${String.fromCharCode(64 + count)}${count}`)
        sheet.freezePanes.freezeAt(range)
      } else if (freezeType === 'none') {
        // 已经取消冻结
      }
      
      await context.sync()

      resolve({
        success: true,
        message: freezeType === 'none' ? '窗格冻结已取消' : '窗格已冻结',
        data: { freezeType, count }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `冻结窗格失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出单元格工具定义
 */
export const cellTools: ToolDefinition[] = [
  { name: 'excel_set_cell_value', handler: excelSetCellValue, category: 'read', description: '设置单元格值' },
  { name: 'excel_get_cell_value', handler: excelGetCellValue, category: 'read', description: '获取单元格值' },
  { name: 'excel_set_range_values', handler: excelSetRangeValues, category: 'read', description: '设置范围值' },
  { name: 'excel_get_range_values', handler: excelGetRangeValues, category: 'read', description: '获取范围值' },
  { name: 'excel_clear_range', handler: excelClearRange, category: 'read', description: '清除范围' },
  { name: 'excel_insert_cells', handler: excelInsertCells, category: 'read', description: '插入单元格' },
  { name: 'excel_delete_cells', handler: excelDeleteCells, category: 'read', description: '删除单元格' },
  { name: 'excel_merge_cells', handler: excelMergeCells, category: 'read', description: '合并单元格' },
  { name: 'excel_unmerge_cells', handler: excelUnmergeCells, category: 'read', description: '取消合并单元格' },
  { name: 'excel_copy_range', handler: excelCopyRange, category: 'read', description: '复制范围' },
  { name: 'excel_cut_range', handler: excelCutRange, category: 'read', description: '剪切范围' },
  { name: 'excel_paste_range', handler: excelPasteRange, category: 'read', description: '粘贴范围' },
  { name: 'excel_find_cell', handler: excelFindCell, category: 'read', description: '查找单元格' },
  { name: 'excel_replace_cell', handler: excelReplaceCell, category: 'read', description: '替换单元格' },
  { name: 'excel_sort_range', handler: excelSortRange, category: 'read', description: '排序范围' },
  { name: 'excel_filter_range', handler: excelFilterRange, category: 'read', description: '筛选范围' },
  { name: 'excel_autofit_columns', handler: excelAutofitColumns, category: 'read', description: '自动调整列宽' },
  { name: 'excel_set_column_width', handler: excelSetColumnWidth, category: 'read', description: '设置列宽' },
  { name: 'excel_set_row_height', handler: excelSetRowHeight, category: 'read', description: '设置行高' },
  { name: 'excel_freeze_panes', handler: excelFreezePanes, category: 'read', description: '冻结窗格' }
]

