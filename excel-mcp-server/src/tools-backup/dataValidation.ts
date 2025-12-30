/**
 * Excel 数据验证工具
 * 使用 Office.js API (ExcelApi 1.8+) 实现数据验证操作
 *
 * 数据验证功能：
 * - 添加数据验证规则
 * - 获取数据验证规则
 * - 删除数据验证规则
 * - 清除无效数据
 * - 设置输入提示
 * - 设置错误警告
 * - 获取无效单元格
 * - 批量设置验证规则
 *
 * 错误处理：
 * - 使用统一的错误码体系
 * - 提供友好的错误提示和恢复建议
 * - 支持参数验证
 */

import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '@office-mcp/shared'
import { ToolErrorHandler } from '../utils/ToolErrorHandler.js'

/**
 * 添加数据验证规则
 */
export const excelAddDataValidationTool: ToolDefinition = {
  name: 'excel_add_data_validation',
  description: '为 Excel 单元格或区域添加数据验证规则，支持整数、小数、列表、日期、文本长度和自定义公式验证，适用于数据录入控制、输入限制和保证数据质量',
  category: 'excel',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: {
        type: 'string',
        description: '单元格区域（如 "A1:A10"）'
      },
      type: {
        type: 'string',
        enum: ['wholeNumber', 'decimal', 'list', 'date', 'textLength', 'custom'],
        description: '验证类型'
      },
      operator: {
        type: 'string',
        enum: ['between', 'notBetween', 'equalTo', 'notEqualTo', 'greaterThan', 'lessThan', 'greaterThanOrEqualTo', 'lessThanOrEqualTo'],
        description: '比较运算符（对于 wholeNumber, decimal, date, textLength 类型）'
      },
      formula1: {
        type: 'string',
        description: '第一个公式或值'
      },
      formula2: {
        type: 'string',
        description: '第二个公式或值（用于 between 和 notBetween）'
      },
      source: {
        type: 'string',
        description: '列表来源（用于 list 类型，如 "选项1,选项2,选项3" 或 "=Sheet1!$A$1:$A$10"）'
      },
      allowBlank: {
        type: 'boolean',
        description: '是否允许空白',
        default: true
      },
      showInputMessage: {
        type: 'boolean',
        description: '是否显示输入提示',
        default: false
      },
      inputTitle: {
        type: 'string',
        description: '输入提示标题'
      },
      inputMessage: {
        type: 'string',
        description: '输入提示内容'
      },
      showErrorAlert: {
        type: 'boolean',
        description: '是否显示错误警告',
        default: true
      },
      errorStyle: {
        type: 'string',
        enum: ['stop', 'warning', 'information'],
        description: '错误警告样式',
        default: 'stop'
      },
      errorTitle: {
        type: 'string',
        description: '错误警告标题'
      },
      errorMessage: {
        type: 'string',
        description: '错误警告内容'
      }
    },
    required: ['range', 'type']
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    const paramError = ToolErrorHandler.validateRequiredParams(args, ['range', 'type'])
    if (paramError) return paramError

    try {
      const result = await sendIPCCommand('excel_add_data_validation', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '添加整数验证（1-100之间）',
      input: {
        range: 'A1:A10',
        type: 'wholeNumber',
        operator: 'between',
        formula1: '1',
        formula2: '100',
        errorTitle: '无效输入',
        errorMessage: '请输入1到100之间的整数'
      },
      output: { success: true, message: '成功添加数据验证规则' }
    },
    {
      description: '添加下拉列表验证',
      input: {
        range: 'B1:B10',
        type: 'list',
        source: '优秀,良好,及格,不及格',
        errorTitle: '无效选项',
        errorMessage: '请从列表中选择'
      },
      output: { success: true, message: '成功添加数据验证规则' }
    },
    {
      description: '添加日期验证（今天之后）',
      input: {
        range: 'C1:C10',
        type: 'date',
        operator: 'greaterThan',
        formula1: '=TODAY()',
        errorTitle: '无效日期',
        errorMessage: '请输入今天之后的日期'
      },
      output: { success: true, message: '成功添加数据验证规则' }
    }
  ]
}

/**
 * 获取数据验证规则
 */
export const excelGetDataValidationTool: ToolDefinition = {
  name: 'excel_get_data_validation',
  description: '查询指定 Excel 单元格或区域的数据验证规则配置，包括验证类型、条件、错误提示等，适用于规则检查、配置分析或规则复制前的查看',
  category: 'excel',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: {
        type: 'string',
        description: '单元格区域（如 "A1:A10"）'
      }
    },
    required: ['range']
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    const paramError = ToolErrorHandler.validateRequiredParams(args, ['range'])
    if (paramError) return paramError

    try {
      const result = await sendIPCCommand('excel_get_data_validation', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '获取数据验证规则',
      input: { range: 'A1:A10' },
      output: {
        success: true,
        data: {
          type: 'wholeNumber',
          operator: 'between',
          formula1: '1',
          formula2: '100',
          allowBlank: true,
          showErrorAlert: true
        }
      }
    }
  ]
}

/**
 * 删除数据验证规则
 */
export const excelRemoveDataValidationTool: ToolDefinition = {
  name: 'excel_remove_data_validation',
  description: '移除指定 Excel 单元格或区域的所有数据验证规则，适用于清理验证、重新设置规则或取消输入限制',
  category: 'excel',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: {
        type: 'string',
        description: '单元格区域（如 "A1:A10"）'
      }
    },
    required: ['range']
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    const paramError = ToolErrorHandler.validateRequiredParams(args, ['range'])
    if (paramError) return paramError

    try {
      const result = await sendIPCCommand('excel_remove_data_validation', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '删除数据验证规则',
      input: { range: 'A1:A10' },
      output: { success: true, message: '成功删除数据验证规则' }
    }
  ]
}

/**
 * 清除无效数据
 */
export const excelClearInvalidDataTool: ToolDefinition = {
  name: 'excel_clear_invalid_data',
  description: '清理 Excel 区域中所有不符合验证规则的单元格数据，适用于批量清理无效数据、数据修正后的清理或准备合规数据',
  category: 'excel',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: {
        type: 'string',
        description: '单元格区域（如 "A1:A10"）'
      }
    },
    required: ['range']
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    const paramError = ToolErrorHandler.validateRequiredParams(args, ['range'])
    if (paramError) return paramError

    try {
      const result = await sendIPCCommand('excel_clear_invalid_data', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '清除无效数据',
      input: { range: 'A1:A10' },
      output: { success: true, message: '成功清除3个无效单元格的数据', data: { clearedCount: 3 } }
    }
  ]
}

/**
 * 设置输入提示
 */
export const excelSetInputMessageTool: ToolDefinition = {
  name: 'excel_set_input_message',
  description: '为 Excel 单元格或区域配置输入时显示的提示信息，指导用户正确输入，适用于数据录入说明、格式要求提示或操作指导',
  category: 'excel',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: {
        type: 'string',
        description: '单元格区域（如 "A1:A10"）'
      },
      title: {
        type: 'string',
        description: '提示标题'
      },
      message: {
        type: 'string',
        description: '提示内容'
      },
      show: {
        type: 'boolean',
        description: '是否显示提示',
        default: true
      }
    },
    required: ['range', 'title', 'message']
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    const paramError = ToolErrorHandler.validateRequiredParams(args, ['range', 'title', 'message'])
    if (paramError) return paramError

    try {
      const result = await sendIPCCommand('excel_set_input_message', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '设置输入提示',
      input: {
        range: 'A1:A10',
        title: '输入说明',
        message: '请输入1到100之间的整数'
      },
      output: { success: true, message: '成功设置输入提示' }
    }
  ]
}

/**
 * 设置错误警告
 */
export const excelSetErrorAlertTool: ToolDefinition = {
  name: 'excel_set_error_alert',
  description: '配置 Excel 单元格或区域在输入无效数据时显示的错误警告，支持停止、警告和信息三种样式，适用于输入错误提示、数据保护或用户反馈',
  category: 'excel',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: {
        type: 'string',
        description: '单元格区域（如 "A1:A10"）'
      },
      title: {
        type: 'string',
        description: '警告标题'
      },
      message: {
        type: 'string',
        description: '警告内容'
      },
      style: {
        type: 'string',
        enum: ['stop', 'warning', 'information'],
        description: '警告样式',
        default: 'stop'
      },
      show: {
        type: 'boolean',
        description: '是否显示警告',
        default: true
      }
    },
    required: ['range', 'title', 'message']
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    const paramError = ToolErrorHandler.validateRequiredParams(args, ['range', 'title', 'message'])
    if (paramError) return paramError

    try {
      const result = await sendIPCCommand('excel_set_error_alert', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '设置错误警告',
      input: {
        range: 'A1:A10',
        title: '无效输入',
        message: '输入的值不在允许的范围内',
        style: 'stop'
      },
      output: { success: true, message: '成功设置错误警告' }
    }
  ]
}

/**
 * 获取无效单元格
 */
export const excelGetInvalidCellsTool: ToolDefinition = {
  name: 'excel_get_invalid_cells',
  description: '扫描并返回 Excel 区域中所有不符合验证规则的单元格，包括地址、值和原因，适用于数据质量检查、错误定位或批量修正前的分析',
  category: 'excel',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: {
        type: 'string',
        description: '单元格区域（如 "A1:A10"）'
      }
    },
    required: ['range']
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    const paramError = ToolErrorHandler.validateRequiredParams(args, ['range'])
    if (paramError) return paramError

    try {
      const result = await sendIPCCommand('excel_get_invalid_cells', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '获取无效单元格',
      input: { range: 'A1:A10' },
      output: {
        success: true,
        data: {
          invalidCells: [
            { address: 'A3', value: '150', reason: '超出范围（1-100）' },
            { address: 'A7', value: '-5', reason: '超出范围（1-100）' }
          ],
          count: 2
        }
      }
    }
  ]
}

/**
 * 批量设置验证规则
 */
export const excelBatchSetValidationTool: ToolDefinition = {
  name: 'excel_batch_set_validation',
  description: '一次性为多个 Excel 区域设置不同的数据验证规则，提高效率，适用于表单初始化、批量配置或标准化设置',
  category: 'excel',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      validations: {
        type: 'array',
        description: '验证规则数组',
        items: {
          type: 'object',
          properties: {
            range: { type: 'string' },
            type: { type: 'string' },
            operator: { type: 'string' },
            formula1: { type: 'string' },
            formula2: { type: 'string' },
            source: { type: 'string' },
            errorTitle: { type: 'string' },
            errorMessage: { type: 'string' }
          },
          required: ['range', 'type']
        }
      }
    },
    required: ['validations']
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    const paramError = ToolErrorHandler.validateRequiredParams(args, ['validations'])
    if (paramError) return paramError

    if (!Array.isArray(args.validations)) {
      return ToolErrorHandler.handleInvalidParamType('validations', 'array', typeof args.validations)
    }

    try {
      const result = await sendIPCCommand('excel_batch_set_validation', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '批量设置验证规则',
      input: {
        validations: [
          {
            range: 'A1:A10',
            type: 'wholeNumber',
            operator: 'between',
            formula1: '1',
            formula2: '100',
            errorTitle: '无效分数',
            errorMessage: '分数必须在1-100之间'
          },
          {
            range: 'B1:B10',
            type: 'list',
            source: '优秀,良好,及格,不及格',
            errorTitle: '无效等级',
            errorMessage: '请从列表中选择等级'
          }
        ]
      },
      output: { success: true, message: '成功设置2个验证规则', data: { successCount: 2 } }
    }
  ]
}
