/**
 * Excel 公式工具
 * 包含 15 个公式相关工具
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

/**
 * 设置公式
 */
async function excelSetFormula(args: Record<string, any>): Promise<FunctionResult> {
  const { address, formula } = args

  if (!address || !formula) {
    return { success: false, message: 'address 和 formula 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      range.formulas = [[formula]]
      await context.sync()

      resolve({
        success: true,
        message: '公式设置成功',
        data: { address, formula }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置公式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 获取公式
 */
async function excelGetFormula(args: Record<string, any>): Promise<FunctionResult> {
  const { address } = args

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      range.load('formulas,values')
      await context.sync()

      resolve({
        success: true,
        message: '获取公式成功',
        data: { 
          address, 
          formula: range.formulas[0][0],
          value: range.values[0][0]
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `获取公式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 计算
 */
async function excelCalculate(args: Record<string, any>): Promise<FunctionResult> {
  const { type = 'full' } = args

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      if (type === 'full') {
        context.workbook.application.calculate(Excel.CalculationType.full)
      } else if (type === 'recalculate') {
        context.workbook.application.calculate(Excel.CalculationType.recalculate)
      } else {
        context.workbook.application.calculate(Excel.CalculationType.fullRebuild)
      }
      
      await context.sync()

      resolve({
        success: true,
        message: '计算完成',
        data: { type }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `计算失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 插入 SUM 公式
 */
async function excelInsertSum(args: Record<string, any>): Promise<FunctionResult> {
  const { targetAddress, sourceRange } = args

  if (!targetAddress || !sourceRange) {
    return { success: false, message: 'targetAddress 和 sourceRange 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(targetAddress)
      range.formulas = [[`=SUM(${sourceRange})`]]
      await context.sync()

      resolve({
        success: true,
        message: 'SUM 公式已插入',
        data: { targetAddress, formula: `=SUM(${sourceRange})` }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `插入 SUM 公式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 插入 AVERAGE 公式
 */
async function excelInsertAverage(args: Record<string, any>): Promise<FunctionResult> {
  const { targetAddress, sourceRange } = args

  if (!targetAddress || !sourceRange) {
    return { success: false, message: 'targetAddress 和 sourceRange 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(targetAddress)
      range.formulas = [[`=AVERAGE(${sourceRange})`]]
      await context.sync()

      resolve({
        success: true,
        message: 'AVERAGE 公式已插入',
        data: { targetAddress, formula: `=AVERAGE(${sourceRange})` }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `插入 AVERAGE 公式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 插入 COUNT 公式
 */
async function excelInsertCount(args: Record<string, any>): Promise<FunctionResult> {
  const { targetAddress, sourceRange } = args

  if (!targetAddress || !sourceRange) {
    return { success: false, message: 'targetAddress 和 sourceRange 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(targetAddress)
      range.formulas = [[`=COUNT(${sourceRange})`]]
      await context.sync()

      resolve({
        success: true,
        message: 'COUNT 公式已插入',
        data: { targetAddress, formula: `=COUNT(${sourceRange})` }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `插入 COUNT 公式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 插入 IF 公式
 */
async function excelInsertIf(args: Record<string, any>): Promise<FunctionResult> {
  const { targetAddress, condition, trueValue, falseValue } = args

  if (!targetAddress || !condition) {
    return { success: false, message: 'targetAddress 和 condition 参数不能为空' }
  }

  const formula = `=IF(${condition}, ${trueValue || '""'}, ${falseValue || '""'})`

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(targetAddress)
      range.formulas = [[formula]]
      await context.sync()

      resolve({
        success: true,
        message: 'IF 公式已插入',
        data: { targetAddress, formula }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `插入 IF 公式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 插入 VLOOKUP 公式
 */
async function excelInsertVlookup(args: Record<string, any>): Promise<FunctionResult> {
  const { targetAddress, lookupValue, tableArray, colIndex, exactMatch = false } = args

  if (!targetAddress || !lookupValue || !tableArray || !colIndex) {
    return { success: false, message: '请提供 targetAddress、lookupValue、tableArray 和 colIndex 参数' }
  }

  const formula = `=VLOOKUP(${lookupValue}, ${tableArray}, ${colIndex}, ${exactMatch ? 'TRUE' : 'FALSE'})`

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(targetAddress)
      range.formulas = [[formula]]
      await context.sync()

      resolve({
        success: true,
        message: 'VLOOKUP 公式已插入',
        data: { targetAddress, formula }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `插入 VLOOKUP 公式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 插入数据透视表
 */
async function excelInsertPivotTable(args: Record<string, any>): Promise<FunctionResult> {
  const { sourceAddress, destinationAddress, name } = args

  if (!sourceAddress || !destinationAddress) {
    return { success: false, message: 'sourceAddress 和 destinationAddress 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const sourceRange = sheet.getRange(sourceAddress)
      const destRange = sheet.getRange(destinationAddress)
      
      const pivotTable = sheet.pivotTables.add(name || 'PivotTable1', sourceRange, destRange)
      
      await context.sync()

      resolve({
        success: true,
        message: '数据透视表已创建',
        data: { sourceAddress, destinationAddress, name: name || 'PivotTable1' }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `创建数据透视表失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 刷新数据透视表
 */
async function excelRefreshPivot(args: Record<string, any>): Promise<FunctionResult> {
  const { name } = args

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      
      if (name) {
        const pivotTable = sheet.pivotTables.getItem(name)
        pivotTable.refresh()
      } else {
        // 刷新所有数据透视表
        const pivotTables = sheet.pivotTables
        pivotTables.load('items')
        await context.sync()
        
        for (const pivot of pivotTables.items) {
          pivot.refresh()
        }
      }
      
      await context.sync()

      resolve({
        success: true,
        message: '数据透视表已刷新',
        data: { name: name || 'all' }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `刷新数据透视表失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 定义名称
 */
async function excelDefineName(args: Record<string, any>): Promise<FunctionResult> {
  const { name, refersTo, comment } = args

  if (!name || !refersTo) {
    return { success: false, message: 'name 和 refersTo 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      
      // 添加名称定义
      context.workbook.names.add(name, refersTo, comment)
      
      await context.sync()

      resolve({
        success: true,
        message: '名称已定义',
        data: { name, refersTo, comment }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `定义名称失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 使用命名范围
 */
async function excelUseNamedRange(args: Record<string, any>): Promise<FunctionResult> {
  const { name } = args

  if (!name) {
    return { success: false, message: 'name 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const namedItem = context.workbook.names.getItem(name)
      namedItem.load('value,formula')
      await context.sync()

      resolve({
        success: true,
        message: '获取命名范围成功',
        data: { 
          name, 
          value: namedItem.value,
          formula: namedItem.formula
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `获取命名范围失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 数组公式
 */
async function excelArrayFormula(args: Record<string, any>): Promise<FunctionResult> {
  const { address, formula } = args

  if (!address || !formula) {
    return { success: false, message: 'address 和 formula 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      // 使用 formulasR1C1 设置数组公式
      range.formulas = [[formula]]
      
      await context.sync()

      resolve({
        success: true,
        message: '数组公式已设置',
        data: { address, formula }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置数组公式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 数据验证
 */
async function excelDataValidation(args: Record<string, any>): Promise<FunctionResult> {
  const { address, type, formula1, formula2, operator = 'between', showDropdown = true } = args

  if (!address || !type) {
    return { success: false, message: 'address 和 type 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      range.dataValidation.rule = {
        list: type === 'list' ? {
          source: formula1,
          inCellDropDown: showDropdown
        } : undefined,
        decimal: type === 'decimal' ? {
          formula1: formula1,
          formula2: formula2,
          operator: operator as any
        } : undefined,
        wholeNumber: type === 'wholeNumber' ? {
          formula1: formula1,
          formula2: formula2,
          operator: operator as any
        } : undefined,
        date: type === 'date' ? {
          formula1: formula1,
          formula2: formula2,
          operator: operator as any
        } : undefined
      }
      
      await context.sync()

      resolve({
        success: true,
        message: '数据验证已设置',
        data: { address, type }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置数据验证失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 删除重复项
 */
async function excelRemoveDuplicates(args: Record<string, any>): Promise<FunctionResult> {
  const { address, columns } = args

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      // 获取数据并手动删除重复项
      range.load('values')
      await context.sync()

      const values = range.values
      const seen = new Set<string>()
      const uniqueRows: any[][] = []
      
      const columnsToCheck = columns || Array.from({ length: values[0]?.length || 0 }, (_, i) => i)

      for (const row of values) {
        const key = columnsToCheck.map((col: number) => row[col]).join('|')
        if (!seen.has(key)) {
          seen.add(key)
          uniqueRows.push(row)
        }
      }

      // 清除原数据
      range.clear(Excel.ClearApplyTo.contents)
      
      // 写入去重后的数据
      if (uniqueRows.length > 0) {
        const newRange = sheet.getRange(address).getResizedRange(uniqueRows.length - values.length, 0)
        newRange.values = uniqueRows
      }
      
      await context.sync()

      resolve({
        success: true,
        message: `已删除 ${values.length - uniqueRows.length} 个重复行`,
        data: { 
          originalCount: values.length,
          uniqueCount: uniqueRows.length,
          removedCount: values.length - uniqueRows.length
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `删除重复项失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出公式工具定义
 */
export const formulaTools: ToolDefinition[] = [
  { name: 'excel_set_formula', handler: excelSetFormula, category: 'read', description: '设置公式' },
  { name: 'excel_get_formula', handler: excelGetFormula, category: 'read', description: '获取公式' },
  { name: 'excel_calculate', handler: excelCalculate, category: 'read', description: '计算' },
  { name: 'excel_insert_sum', handler: excelInsertSum, category: 'read', description: '插入 SUM 公式' },
  { name: 'excel_insert_average', handler: excelInsertAverage, category: 'read', description: '插入 AVERAGE 公式' },
  { name: 'excel_insert_count', handler: excelInsertCount, category: 'read', description: '插入 COUNT 公式' },
  { name: 'excel_insert_if', handler: excelInsertIf, category: 'read', description: '插入 IF 公式' },
  { name: 'excel_insert_vlookup', handler: excelInsertVlookup, category: 'read', description: '插入 VLOOKUP 公式' },
  { name: 'excel_insert_pivot_table', handler: excelInsertPivotTable, category: 'read', description: '插入数据透视表' },
  { name: 'excel_refresh_pivot', handler: excelRefreshPivot, category: 'read', description: '刷新数据透视表' },
  { name: 'excel_define_name', handler: excelDefineName, category: 'read', description: '定义名称' },
  { name: 'excel_use_named_range', handler: excelUseNamedRange, category: 'read', description: '使用命名范围' },
  { name: 'excel_array_formula', handler: excelArrayFormula, category: 'read', description: '数组公式' },
  { name: 'excel_data_validation', handler: excelDataValidation, category: 'read', description: '数据验证' },
  { name: 'excel_remove_duplicates', handler: excelRemoveDuplicates, category: 'read', description: '删除重复项' }
]
