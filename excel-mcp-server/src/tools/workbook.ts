/**
 * excel_workbook - 工作簿操作
 * 合并 8 个原工具
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'create', 'open', 'save', 'saveAs', 'close',
  'getInfo', 'setProperties', 'protect'
] as const

export const excelWorkbookTool = createActionTool({
  name: 'excel_workbook',
  description: `工作簿操作工具。支持的操作(action):
- create: 创建工作簿 (可选 name)
- open: 打开工作簿 (需要 path)
- save: 保存工作簿
- saveAs: 另存为 (需要 path, 可选 format)
- close: 关闭工作簿 (可选 save)
- getInfo: 获取工作簿信息
- setProperties: 设置属性 (需要 properties)
- protect: 保护工作簿 (可选 password, options)`,
  category: 'workbook',
  application: 'excel',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    create: 'excel_create_workbook',
    open: 'excel_open_workbook',
    save: 'excel_save_workbook',
    saveAs: 'excel_save_workbook_as',
    close: 'excel_close_workbook',
    getInfo: 'excel_get_workbook_info',
    setProperties: 'excel_set_workbook_properties',
    protect: 'excel_protect_workbook'
  },
  paramRules: {
    open: [required('path', 'string')],
    saveAs: [required('path', 'string')],
    setProperties: [required('properties', 'object')]
  },
  pathParams: {
    filePath: ['path']
  },
  properties: {
    name: {
      type: 'string',
      description: '[create] 工作簿名称'
    },
    path: {
      type: 'string',
      description: '[open/saveAs] 文件路径'
    },
    format: {
      type: 'string',
      enum: ['xlsx', 'xlsm', 'xlsb', 'xls', 'csv', 'pdf'],
      description: '[saveAs] 保存格式'
    },
    save: {
      type: 'boolean',
      description: '[close] 关闭前是否保存',
      default: true
    },
    properties: {
      type: 'object',
      description: '[setProperties] 工作簿属性',
      properties: {
        title: { type: 'string' },
        author: { type: 'string' },
        subject: { type: 'string' },
        keywords: { type: 'string' },
        comments: { type: 'string' }
      }
    },
    password: {
      type: 'string',
      description: '[protect] 保护密码'
    },
    options: {
      type: 'object',
      description: '[protect] 保护选项',
      properties: {
        structure: { type: 'boolean' },
        windows: { type: 'boolean' }
      }
    }
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: [
      '工作簿', '创建工作簿', '打开工作簿', '保存工作簿',
      '关闭工作簿', '工作簿属性', '保护工作簿'
    ],
    mergedTools: [
      'excel_create_workbook', 'excel_open_workbook',
      'excel_save_workbook', 'excel_save_workbook_as',
      'excel_close_workbook', 'excel_get_workbook_info',
      'excel_set_workbook_properties', 'excel_protect_workbook'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  examples: [
    {
      description: '创建工作簿',
      input: { action: 'create', name: '销售报表' },
      output: { success: true, message: '成功创建工作簿', action: 'create' }
    }
  ]
})
