/**
 * excel_formula - 公式与计算
 * 合并 15 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'set', 'get', 'calculate', 'insertSum', 'insertAverage',
  'insertCount', 'insertIf', 'insertVlookup', 'insertPivot',
  'refreshPivot', 'defineName', 'useName', 'arrayFormula',
  'dataValidation', 'removeDuplicates'
] as const

type FormulaAction = typeof SUPPORTED_ACTIONS[number]

export const excelFormulaTool: ToolDefinition = {
  name: 'excel_formula',
  description: `公式与计算工具。支持的操作(action):
- set: 设置公式 (需要 cell, formula)
- get: 获取公式 (需要 cell)
- calculate: 计算工作表
- insertSum: 插入求和 (需要 dataRange, resultCell)
- insertAverage: 插入平均值 (需要 dataRange, resultCell)
- insertCount: 插入计数 (需要 dataRange, resultCell)
- insertIf: 插入IF公式 (需要 cell, condition, trueValue, falseValue)
- insertVlookup: 插入VLOOKUP (需要 cell, lookupValue, tableArray, colIndex)
- insertPivot: 插入数据透视表 (需要 sourceRange, destinationCell)
- refreshPivot: 刷新透视表
- defineName: 定义名称 (需要 name, refersTo)
- useName: 使用命名区域 (需要 name)
- arrayFormula: 数组公式 (需要 range, formula)
- dataValidation: 数据验证 (需要 range, rule)
- removeDuplicates: 删除重复项 (需要 range)`,
  category: 'formula',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      cell: {
        type: 'string',
        description: '[多个操作] 单元格地址'
      },
      range: {
        type: 'string',
        description: '[多个操作] 区域地址'
      },
      formula: {
        type: 'string',
        description: '[set/arrayFormula] 公式'
      },
      dataRange: {
        type: 'string',
        description: '[insertSum/insertAverage/insertCount] 数据区域'
      },
      resultCell: {
        type: 'string',
        description: '[insertSum/insertAverage/insertCount] 结果单元格'
      },
      condition: {
        type: 'string',
        description: '[insertIf] 条件'
      },
      trueValue: {
        type: ['string', 'number'],
        description: '[insertIf] 真值'
      },
      falseValue: {
        type: ['string', 'number'],
        description: '[insertIf] 假值'
      },
      lookupValue: {
        type: 'string',
        description: '[insertVlookup] 查找值'
      },
      tableArray: {
        type: 'string',
        description: '[insertVlookup] 表格区域'
      },
      colIndex: {
        type: 'number',
        description: '[insertVlookup] 列索引'
      },
      exactMatch: {
        type: 'boolean',
        description: '[insertVlookup] 精确匹配',
        default: true
      },
      sourceRange: {
        type: 'string',
        description: '[insertPivot] 源数据区域'
      },
      destinationCell: {
        type: 'string',
        description: '[insertPivot] 目标单元格'
      },
      name: {
        type: 'string',
        description: '[defineName/useName] 名称'
      },
      refersTo: {
        type: 'string',
        description: '[defineName] 引用区域'
      },
      rule: {
        type: 'object',
        description: '[dataValidation] 验证规则'
      },
      columns: {
        type: 'array',
        items: { type: 'number' },
        description: '[removeDuplicates] 要检查的列'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: [
      '公式', '求和', '平均值', '计数', 'VLOOKUP',
      '透视表', '命名区域', '数组公式', '数据验证'
    ],
    mergedTools: [
      'excel_set_formula', 'excel_get_formula', 'excel_calculate',
      'excel_insert_sum', 'excel_insert_average', 'excel_insert_count',
      'excel_insert_if', 'excel_insert_vlookup', 'excel_insert_pivot_table',
      'excel_refresh_pivot', 'excel_define_name', 'excel_use_named_range',
      'excel_array_formula', 'excel_data_validation', 'excel_remove_duplicates'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<FormulaAction, string> = {
      set: 'excel_set_formula',
      get: 'excel_get_formula',
      calculate: 'excel_calculate',
      insertSum: 'excel_insert_sum',
      insertAverage: 'excel_insert_average',
      insertCount: 'excel_insert_count',
      insertIf: 'excel_insert_if',
      insertVlookup: 'excel_insert_vlookup',
      insertPivot: 'excel_insert_pivot_table',
      refreshPivot: 'excel_refresh_pivot',
      defineName: 'excel_define_name',
      useName: 'excel_use_named_range',
      arrayFormula: 'excel_array_formula',
      dataValidation: 'excel_data_validation',
      removeDuplicates: 'excel_remove_duplicates'
    }

    const command = commandMap[action as FormulaAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '设置公式',
      input: { action: 'set', cell: 'C1', formula: '=A1+B1' },
      output: { success: true, message: '成功设置公式', action: 'set' }
    },
    {
      description: '插入求和公式',
      input: { action: 'insertSum', dataRange: 'A1:A10', resultCell: 'A11' },
      output: { success: true, message: '成功插入求和公式', action: 'insertSum' }
    }
  ]
}
