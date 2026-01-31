/**
 * excel_format - 格式设置
 * 合并 15 个原工具
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'setCellFormat', 'setFont', 'setFill', 'setBorder',
  'setNumberFormat', 'setDateFormat', 'setAlignment', 'setWrapText',
  'clear', 'copy', 'protect', 'unprotect', 'hideColumns', 'unhideColumns',
  'conditionalFormat'
] as const

export const excelFormatTool = createActionTool({
  name: 'excel_format',
  description: `格式设置工具。支持的操作(action):
- setCellFormat: 设置单元格格式 (需要 range)
- setFont: 设置字体 (需要 range, font)
- setFill: 设置填充色 (需要 range, color)
- setBorder: 设置边框 (需要 range, border)
- setNumberFormat: 设置数字格式 (需要 range, format)
- setDateFormat: 设置日期格式 (需要 range, format)
- setAlignment: 设置对齐 (需要 range, alignment)
- setWrapText: 设置自动换行 (需要 range, wrap)
- clear: 清除格式 (需要 range)
- copy: 复制格式 (需要 sourceRange, targetRange)
- protect: 保护工作表 (可选 password)
- unprotect: 取消保护 (可选 password)
- hideColumns: 隐藏列 (需要 range)
- unhideColumns: 显示列 (需要 range)
- conditionalFormat: 条件格式 (需要 range, rule)`,
  category: 'format',
  application: 'excel',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    setCellFormat: 'excel_set_cell_format',
    setFont: 'excel_set_font',
    setFill: 'excel_set_fill_color',
    setBorder: 'excel_set_border',
    setNumberFormat: 'excel_set_number_format',
    setDateFormat: 'excel_set_date_format',
    setAlignment: 'excel_set_alignment',
    setWrapText: 'excel_set_wrap_text',
    clear: 'excel_clear_format',
    copy: 'excel_copy_format',
    protect: 'excel_protect_sheet',
    unprotect: 'excel_unprotect_sheet',
    hideColumns: 'excel_hide_columns',
    unhideColumns: 'excel_unhide_columns',
    conditionalFormat: 'excel_conditional_format'
  },
  paramRules: {
    setCellFormat: [required('range', 'string')],
    setFont: [required('range', 'string'), required('font', 'object')],
    setFill: [required('range', 'string'), required('color', 'string')],
    setBorder: [required('range', 'string'), required('border', 'object')],
    setNumberFormat: [required('range', 'string'), required('format', 'string')],
    setDateFormat: [required('range', 'string'), required('format', 'string')],
    setAlignment: [required('range', 'string'), required('alignment', 'object')],
    setWrapText: [required('range', 'string'), required('wrap', 'boolean')],
    clear: [required('range', 'string')],
    copy: [required('sourceRange', 'string'), required('targetRange', 'string')],
    protect: [],
    unprotect: [],
    hideColumns: [required('range', 'string')],
    unhideColumns: [required('range', 'string')],
    conditionalFormat: [required('range', 'string'), required('rule', 'object')]
  },
  properties: {
    range: {
      type: 'string',
      description: '[多个操作] 区域地址'
    },
    font: {
      type: 'object',
      description: '[setFont] 字体设置',
      properties: {
        name: { type: 'string', description: '字体名称' },
        size: { type: 'number', description: '字号' },
        color: { type: 'string', description: '颜色 (十六进制)' },
        bold: { type: 'boolean', description: '粗体' },
        italic: { type: 'boolean', description: '斜体' },
        underline: { type: 'boolean', description: '下划线' }
      }
    },
    color: {
      type: 'string',
      description: '[setFill] 填充颜色 (十六进制)'
    },
    pattern: {
      type: 'string',
      description: '[setFill] 填充图案'
    },
    border: {
      type: 'object',
      description: '[setBorder] 边框设置',
      properties: {
        style: { type: 'string', enum: ['thin', 'medium', 'thick', 'double', 'dotted', 'dashed'] },
        color: { type: 'string' },
        edges: { type: 'string', enum: ['all', 'top', 'bottom', 'left', 'right', 'outline'] }
      }
    },
    format: {
      type: 'string',
      description: '[setNumberFormat/setDateFormat] 格式字符串'
    },
    alignment: {
      type: 'object',
      description: '[setAlignment] 对齐设置',
      properties: {
        horizontal: { type: 'string', enum: ['left', 'center', 'right', 'justify'] },
        vertical: { type: 'string', enum: ['top', 'middle', 'bottom'] },
        indent: { type: 'number' }
      }
    },
    wrap: {
      type: 'boolean',
      description: '[setWrapText] 是否自动换行'
    },
    sourceRange: {
      type: 'string',
      description: '[copy] 源区域'
    },
    targetRange: {
      type: 'string',
      description: '[copy] 目标区域'
    },
    password: {
      type: 'string',
      description: '[protect/unprotect] 密码'
    },
    rule: {
      type: 'object',
      description: '[conditionalFormat] 条件格式规则'
    }
  },
  metadata: {
    version: '2.1.0',
    priority: 'P0',
    intentKeywords: [
      '格式', '字体', '填充', '边框', '数字格式',
      '对齐', '换行', '保护', '隐藏列'
    ],
    mergedTools: [
      'excel_set_cell_format', 'excel_set_font', 'excel_set_fill_color',
      'excel_set_border', 'excel_set_number_format', 'excel_set_date_format',
      'excel_set_alignment', 'excel_set_wrap_text', 'excel_clear_format',
      'excel_copy_format', 'excel_protect_sheet', 'excel_unprotect_sheet',
      'excel_hide_columns', 'excel_unhide_columns', 'excel_conditional_format'
    ]
  },
  examples: [
    {
      description: '设置字体',
      input: { action: 'setFont', range: 'A1:B10', font: { name: '微软雅黑', size: 12, bold: true } },
      output: { success: true, message: '成功设置字体', action: 'setFont' }
    }
  ]
})
