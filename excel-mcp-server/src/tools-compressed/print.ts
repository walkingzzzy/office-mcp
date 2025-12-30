/**
 * excel_print - 打印操作
 * 合并 6 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'print', 'preview', 'setArea', 'setPageSetup',
  'setMargins', 'setHeaderFooter'
] as const

type PrintAction = typeof SUPPORTED_ACTIONS[number]

export const excelPrintTool: ToolDefinition = {
  name: 'excel_print',
  description: `打印操作工具。支持的操作(action):
- print: 打印 (可选 copies, printer)
- preview: 打印预览
- setArea: 设置打印区域 (需要 range)
- setPageSetup: 设置页面 (可选 orientation, paperSize, scale)
- setMargins: 设置边距 (需要 margins)
- setHeaderFooter: 设置页眉页脚 (可选 header, footer)`,
  category: 'print',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      copies: {
        type: 'number',
        description: '[print] 打印份数',
        default: 1
      },
      printer: {
        type: 'string',
        description: '[print] 打印机名称'
      },
      range: {
        type: 'string',
        description: '[setArea] 打印区域'
      },
      orientation: {
        type: 'string',
        enum: ['portrait', 'landscape'],
        description: '[setPageSetup] 页面方向'
      },
      paperSize: {
        type: 'string',
        enum: ['A4', 'A3', 'Letter', 'Legal'],
        description: '[setPageSetup] 纸张大小'
      },
      scale: {
        type: 'number',
        description: '[setPageSetup] 缩放比例 (10-400)'
      },
      margins: {
        type: 'object',
        description: '[setMargins] 边距设置',
        properties: {
          top: { type: 'number' },
          bottom: { type: 'number' },
          left: { type: 'number' },
          right: { type: 'number' },
          header: { type: 'number' },
          footer: { type: 'number' }
        }
      },
      header: {
        type: 'object',
        description: '[setHeaderFooter] 页眉',
        properties: {
          left: { type: 'string' },
          center: { type: 'string' },
          right: { type: 'string' }
        }
      },
      footer: {
        type: 'object',
        description: '[setHeaderFooter] 页脚',
        properties: {
          left: { type: 'string' },
          center: { type: 'string' },
          right: { type: 'string' }
        }
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: [
      '打印', '打印预览', '打印区域', '页面设置',
      '边距', '页眉', '页脚'
    ],
    mergedTools: [
      'excel_print', 'excel_print_preview',
      'excel_set_print_area', 'excel_set_page_setup',
      'excel_set_margins', 'excel_set_header_footer'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<PrintAction, string> = {
      print: 'excel_print',
      preview: 'excel_print_preview',
      setArea: 'excel_set_print_area',
      setPageSetup: 'excel_set_page_setup',
      setMargins: 'excel_set_margins',
      setHeaderFooter: 'excel_set_header_footer'
    }

    const command = commandMap[action as PrintAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '设置打印区域',
      input: { action: 'setArea', range: 'A1:G20' },
      output: { success: true, message: '成功设置打印区域', action: 'setArea' }
    }
  ]
}
