/**
 * Excel 数据验证工具
 * 包含 8 个数据验证相关工具
 * 使用 Office.js API (ExcelApi 1.8+) 实现数据验证操作
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

/**
 * 添加数据验证规则
 */
async function excelAddDataValidation(args: Record<string, any>): Promise<FunctionResult> {
  const {
    range,
    type,
    operator,
    formula1,
    formula2,
    source,
    allowBlank = true,
    showInputMessage = false,
    inputTitle,
    inputMessage,
    showErrorAlert = true,
    errorStyle = 'stop',
    errorTitle,
    errorMessage
  } = args

  if (!range || !type) {
    return { success: false, message: 'range 和 type 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const targetRange = sheet.getRange(range)
      const validation = targetRange.dataValidation

      // 清除现有验证规则
      validation.clear()

      // 根据类型设置验证规则
      let rule: Excel.DataValidationRule = {} as Excel.DataValidationRule

      switch (type) {
        case 'wholeNumber':
          rule = {
            wholeNumber: {
              formula1: formula1,
              formula2: formula2,
              operator: operator || 'between'
            }
          }
          break

        case 'decimal':
          rule = {
            decimal: {
              formula1: formula1,
              formula2: formula2,
              operator: operator || 'between'
            }
          }
          break

        case 'list':
          rule = {
            list: {
              inCellDropDown: true,
              source: source || formula1
            }
          }
          break

        case 'date':
          rule = {
            date: {
              formula1: formula1,
              formula2: formula2,
              operator: operator || 'between'
            }
          }
          break

        case 'textLength':
          rule = {
            textLength: {
              formula1: formula1,
              formula2: formula2,
              operator: operator || 'between'
            }
          }
          break

        case 'custom':
          rule = {
            custom: {
              formula: formula1
            }
          }
          break

        default:
          resolve({ success: false, message: `不支持的验证类型: ${type}` })
          return
      }

      validation.rule = rule
      validation.ignoreBlanks = allowBlank

      // 设置输入提示
      if (showInputMessage && inputTitle && inputMessage) {
        validation.prompt = {
          showPrompt: true,
          title: inputTitle,
          message: inputMessage
        }
      }

      // 设置错误警告
      if (showErrorAlert && errorTitle && errorMessage) {
        validation.errorAlert = {
          showAlert: true,
          style: errorStyle as Excel.DataValidationAlertStyle,
          title: errorTitle,
          message: errorMessage
        }
      }

      await context.sync()

      resolve({
        success: true,
        message: '成功添加数据验证规则',
        data: { range, type }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `添加数据验证规则失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 获取数据验证规则
 */
async function excelGetDataValidation(args: Record<string, any>): Promise<FunctionResult> {
  const { range } = args

  if (!range) {
    return { success: false, message: 'range 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const targetRange = sheet.getRange(range)
      const validation = targetRange.dataValidation

      validation.load('rule,ignoreBlanks,prompt,errorAlert,valid')
      await context.sync()

      const data: Record<string, unknown> = {
        valid: validation.valid,
        allowBlank: validation.ignoreBlanks
      }

      // 获取验证规则
      if (validation.rule) {
        const rule = validation.rule as Excel.DataValidationRule
        if (rule.wholeNumber) {
          data.type = 'wholeNumber'
          data.operator = rule.wholeNumber.operator
          data.formula1 = rule.wholeNumber.formula1
          data.formula2 = rule.wholeNumber.formula2
        } else if (rule.decimal) {
          data.type = 'decimal'
          data.operator = rule.decimal.operator
          data.formula1 = rule.decimal.formula1
          data.formula2 = rule.decimal.formula2
        } else if (rule.list) {
          data.type = 'list'
          data.source = rule.list.source
          data.inCellDropDown = rule.list.inCellDropDown
        } else if (rule.date) {
          data.type = 'date'
          data.operator = rule.date.operator
          data.formula1 = rule.date.formula1
          data.formula2 = rule.date.formula2
        } else if (rule.textLength) {
          data.type = 'textLength'
          data.operator = rule.textLength.operator
          data.formula1 = rule.textLength.formula1
          data.formula2 = rule.textLength.formula2
        } else if (rule.custom) {
          data.type = 'custom'
          data.formula = rule.custom.formula
        }
      }

      // 获取输入提示
      if (validation.prompt) {
        const prompt = validation.prompt as Excel.DataValidationPrompt
        data.showInputMessage = prompt.showPrompt
        data.inputTitle = prompt.title
        data.inputMessage = prompt.message
      }

      // 获取错误警告
      if (validation.errorAlert) {
        const errorAlert = validation.errorAlert as Excel.DataValidationErrorAlert
        data.showErrorAlert = errorAlert.showAlert
        data.errorStyle = errorAlert.style
        data.errorTitle = errorAlert.title
        data.errorMessage = errorAlert.message
      }

      resolve({
        success: true,
        message: '成功获取数据验证规则',
        data
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `获取数据验证规则失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 删除数据验证规则
 */
async function excelRemoveDataValidation(args: Record<string, any>): Promise<FunctionResult> {
  const { range } = args

  if (!range) {
    return { success: false, message: 'range 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const targetRange = sheet.getRange(range)
      const validation = targetRange.dataValidation

      validation.clear()
      await context.sync()

      resolve({
        success: true,
        message: '成功删除数据验证规则',
        data: { range }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `删除数据验证规则失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 清除无效数据
 */
async function excelClearInvalidData(args: Record<string, any>): Promise<FunctionResult> {
  const { range } = args

  if (!range) {
    return { success: false, message: 'range 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const targetRange = sheet.getRange(range)

      // 加载区域的值和验证状态
      targetRange.load('values,rowCount,columnCount')
      const validation = targetRange.dataValidation
      validation.load('valid')
      await context.sync()

      let clearedCount = 0

      // 遍历每个单元格，检查验证状态
      const values = targetRange.values
      for (let i = 0; i < targetRange.rowCount; i++) {
        for (let j = 0; j < targetRange.columnCount; j++) {
          const cellAddress = targetRange.getCell(i, j).address
          const cell = sheet.getRange(cellAddress)
          const cellValidation = cell.dataValidation
          cellValidation.load('valid')
          await context.sync()

          // 如果单元格数据无效，清除内容
          if (!cellValidation.valid) {
            cell.clear(Excel.ClearApplyTo.contents)
            clearedCount++
          }
        }
      }

      await context.sync()

      resolve({
        success: true,
        message: `成功清除${clearedCount}个无效单元格的数据`,
        data: { range, clearedCount }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `清除无效数据失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置输入提示
 */
async function excelSetInputMessage(args: Record<string, any>): Promise<FunctionResult> {
  const { range, title, message, show = true } = args

  if (!range || !title || !message) {
    return { success: false, message: 'range、title 和 message 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const targetRange = sheet.getRange(range)
      const validation = targetRange.dataValidation

      validation.prompt = {
        showPrompt: show,
        title: title,
        message: message
      }

      await context.sync()

      resolve({
        success: true,
        message: '成功设置输入提示',
        data: { range, title }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置输入提示失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置错误警告
 */
async function excelSetErrorAlert(args: Record<string, any>): Promise<FunctionResult> {
  const { range, title, message, style = 'stop', show = true } = args

  if (!range || !title || !message) {
    return { success: false, message: 'range、title 和 message 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const targetRange = sheet.getRange(range)
      const validation = targetRange.dataValidation

      validation.errorAlert = {
        showAlert: show,
        style: style as Excel.DataValidationAlertStyle,
        title: title,
        message: message
      }

      await context.sync()

      resolve({
        success: true,
        message: '成功设置错误警告',
        data: { range, title, style }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置错误警告失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 获取无效单元格
 */
async function excelGetInvalidCells(args: Record<string, any>): Promise<FunctionResult> {
  const { range } = args

  if (!range) {
    return { success: false, message: 'range 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const targetRange = sheet.getRange(range)

      targetRange.load('values,rowCount,columnCount,address')
      await context.sync()

      const invalidCells: Array<{ address: string; value: unknown; reason: string }> = []

      // 遍历每个单元格，检查验证状态
      for (let i = 0; i < targetRange.rowCount; i++) {
        for (let j = 0; j < targetRange.columnCount; j++) {
          const cell = targetRange.getCell(i, j)
          cell.load('address,values')
          const cellValidation = cell.dataValidation
          cellValidation.load('valid')
          await context.sync()

          // 如果单元格数据无效，记录信息
          if (!cellValidation.valid) {
            invalidCells.push({
              address: cell.address,
              value: cell.values[0][0],
              reason: '不符合验证规则'
            })
          }
        }
      }

      resolve({
        success: true,
        message: `找到${invalidCells.length}个无效单元格`,
        data: {
          invalidCells,
          count: invalidCells.length
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `获取无效单元格失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 批量设置验证规则
 */
async function excelBatchSetValidation(args: Record<string, any>): Promise<FunctionResult> {
  const { validations } = args

  if (!validations || !Array.isArray(validations)) {
    return { success: false, message: 'validations 参数必须是数组' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      let successCount = 0
      const errors: Array<{ range: string; error: string }> = []

      for (const validation of validations) {
        try {
          // 调用 excelAddDataValidation 处理每个验证规则
          const result = await excelAddDataValidation(validation)
          if (result.success) {
            successCount++
          } else {
            errors.push({
              range: validation.range,
              error: result.message
            })
          }
        } catch (error: unknown) {
          errors.push({
            range: validation.range,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }

      resolve({
        success: errors.length === 0,
        message: `成功设置${successCount}个验证规则${errors.length > 0 ? `，${errors.length}个失败` : ''}`,
        data: {
          successCount,
          failedCount: errors.length,
          errors: errors.length > 0 ? errors : undefined
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `批量设置验证规则失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出数据验证工具定义
 */
export const dataValidationTools: ToolDefinition[] = [
  {
    name: 'excel_add_data_validation',
    handler: excelAddDataValidation,
    category: 'excel',
    description: '添加数据验证规则'
  },
  {
    name: 'excel_get_data_validation',
    handler: excelGetDataValidation,
    category: 'excel',
    description: '获取数据验证规则'
  },
  {
    name: 'excel_remove_data_validation',
    handler: excelRemoveDataValidation,
    category: 'excel',
    description: '删除数据验证规则'
  },
  {
    name: 'excel_clear_invalid_data',
    handler: excelClearInvalidData,
    category: 'excel',
    description: '清除无效数据'
  },
  {
    name: 'excel_set_input_message',
    handler: excelSetInputMessage,
    category: 'excel',
    description: '设置输入提示'
  },
  {
    name: 'excel_set_error_alert',
    handler: excelSetErrorAlert,
    category: 'excel',
    description: '设置错误警告'
  },
  {
    name: 'excel_get_invalid_cells',
    handler: excelGetInvalidCells,
    category: 'excel',
    description: '获取无效单元格'
  },
  {
    name: 'excel_batch_set_validation',
    handler: excelBatchSetValidation,
    category: 'excel',
    description: '批量设置验证规则'
  }
]
