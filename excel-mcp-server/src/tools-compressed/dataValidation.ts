/**
 * excel_data_validation - 数据验证工具
 * 合并 8 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'add', 'get', 'remove', 'clearInvalid',
  'setInputMessage', 'setErrorAlert', 'getInvalidCells', 'batchSet'
] as const

type DataValidationAction = typeof SUPPORTED_ACTIONS[number]

export const excelDataValidationTool: ToolDefinition = {
  name: 'excel_data_validation',
  description: `数据验证工具。支持的操作(action):
- add: 添加数据验证 (需要 range, rule)
- get: 获取数据验证 (需要 range)
- remove: 移除数据验证 (需要 range)
- clearInvalid: 清除无效数据 (需要 range)
- setInputMessage: 设置输入提示 (需要 range, title, message)
- setErrorAlert: 设置错误提示 (需要 range, style, title, message)
- getInvalidCells: 获取无效单元格 (需要 range)
- batchSet: 批量设置验证 (需要 validations)`,
  category: 'dataValidation',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      range: {
        type: 'string',
        description: '[多个操作] 区域地址'
      },
      rule: {
        type: 'object',
        description: '[add] 验证规则',
        properties: {
          type: {
            type: 'string',
            enum: ['whole', 'decimal', 'list', 'date', 'time', 'textLength', 'custom']
          },
          operator: {
            type: 'string',
            enum: ['between', 'notBetween', 'equal', 'notEqual', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual']
          },
          formula1: { type: ['string', 'number'] },
          formula2: { type: ['string', 'number'] },
          values: { type: 'array', items: { type: 'string' } }
        }
      },
      title: {
        type: 'string',
        description: '[setInputMessage/setErrorAlert] 标题'
      },
      message: {
        type: 'string',
        description: '[setInputMessage/setErrorAlert] 消息内容'
      },
      style: {
        type: 'string',
        enum: ['stop', 'warning', 'information'],
        description: '[setErrorAlert] 错误样式'
      },
      validations: {
        type: 'array',
        description: '[batchSet] 批量验证配置',
        items: {
          type: 'object',
          properties: {
            range: { type: 'string' },
            rule: { type: 'object' }
          }
        }
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: [
      '数据验证', '输入限制', '下拉列表', '数据有效性',
      '输入提示', '错误提示', '无效数据'
    ],
    mergedTools: [
      'excel_add_data_validation', 'excel_get_data_validation',
      'excel_remove_data_validation', 'excel_clear_invalid_data',
      'excel_set_input_message', 'excel_set_error_alert',
      'excel_get_invalid_cells', 'excel_batch_set_validation'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<DataValidationAction, string> = {
      add: 'excel_add_data_validation',
      get: 'excel_get_data_validation',
      remove: 'excel_remove_data_validation',
      clearInvalid: 'excel_clear_invalid_data',
      setInputMessage: 'excel_set_input_message',
      setErrorAlert: 'excel_set_error_alert',
      getInvalidCells: 'excel_get_invalid_cells',
      batchSet: 'excel_batch_set_validation'
    }

    const command = commandMap[action as DataValidationAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '添加下拉列表验证',
      input: { action: 'add', range: 'A1:A10', rule: { type: 'list', values: ['是', '否'] } },
      output: { success: true, message: '成功添加数据验证', action: 'add' }
    }
  ]
}
