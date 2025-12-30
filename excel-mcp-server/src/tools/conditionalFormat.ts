/**
 * excel_conditional_format - 条件格式
 * 合并 9 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'addRule', 'removeRule', 'clearRules', 'colorScale',
  'dataBar', 'iconSet', 'highlight', 'topBottom', 'duplicates'
] as const

type ConditionalFormatAction = typeof SUPPORTED_ACTIONS[number]

export const excelConditionalFormatTool: ToolDefinition = {
  name: 'excel_conditional_format',
  description: `条件格式工具。支持的操作(action):
- addRule: 添加条件格式规则 (需要 range, rule)
- removeRule: 移除条件格式规则 (需要 range, ruleIndex)
- clearRules: 清除所有条件格式 (需要 range)
- colorScale: 色阶格式 (需要 range, 可选 minColor, midColor, maxColor)
- dataBar: 数据条格式 (需要 range, 可选 color, showValue)
- iconSet: 图标集格式 (需要 range, iconStyle)
- highlight: 突出显示单元格 (需要 range, condition, format)
- topBottom: 项目选取规则 (需要 range, type, value)
- duplicates: 重复值格式 (需要 range, 可选 unique)`,
  category: 'format',
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
        description: '[所有操作] 区域地址'
      },
      rule: {
        type: 'object',
        description: '[addRule] 条件格式规则'
      },
      ruleIndex: {
        type: 'number',
        description: '[removeRule] 规则索引'
      },
      minColor: {
        type: 'string',
        description: '[colorScale] 最小值颜色'
      },
      midColor: {
        type: 'string',
        description: '[colorScale] 中间值颜色'
      },
      maxColor: {
        type: 'string',
        description: '[colorScale] 最大值颜色'
      },
      color: {
        type: 'string',
        description: '[dataBar] 数据条颜色'
      },
      showValue: {
        type: 'boolean',
        description: '[dataBar] 是否显示值'
      },
      iconStyle: {
        type: 'string',
        enum: ['arrows', 'flags', 'traffic', 'ratings', 'symbols'],
        description: '[iconSet] 图标样式'
      },
      condition: {
        type: 'object',
        description: '[highlight] 条件',
        properties: {
          type: { type: 'string', enum: ['greaterThan', 'lessThan', 'between', 'equal', 'text', 'date'] },
          value: { type: ['string', 'number'] },
          value2: { type: ['string', 'number'] }
        }
      },
      format: {
        type: 'object',
        description: '[highlight] 格式设置'
      },
      type: {
        type: 'string',
        enum: ['top', 'bottom', 'topPercent', 'bottomPercent', 'aboveAverage', 'belowAverage'],
        description: '[topBottom] 选取类型'
      },
      value: {
        type: 'number',
        description: '[topBottom] 选取数量或百分比'
      },
      unique: {
        type: 'boolean',
        description: '[duplicates] 是否突出唯一值而非重复值'
      }
    },
    required: ['action', 'range']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: [
      '条件格式', '色阶', '数据条', '图标集',
      '突出显示', '重复值', '项目选取'
    ],
    mergedTools: [
      'excel_add_conditional_format', 'excel_remove_conditional_format',
      'excel_clear_conditional_formats', 'excel_color_scale',
      'excel_data_bar', 'excel_icon_set', 'excel_highlight_cells',
      'excel_top_bottom_rules', 'excel_duplicate_values'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<ConditionalFormatAction, string> = {
      addRule: 'excel_add_conditional_format',
      removeRule: 'excel_remove_conditional_format',
      clearRules: 'excel_clear_conditional_formats',
      colorScale: 'excel_color_scale',
      dataBar: 'excel_data_bar',
      iconSet: 'excel_icon_set',
      highlight: 'excel_highlight_cells',
      topBottom: 'excel_top_bottom_rules',
      duplicates: 'excel_duplicate_values'
    }

    const command = commandMap[action as ConditionalFormatAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '添加色阶格式',
      input: { action: 'colorScale', range: 'A1:A100', minColor: '#FF0000', maxColor: '#00FF00' },
      output: { success: true, message: '成功添加色阶格式', action: 'colorScale' }
    }
  ]
}
