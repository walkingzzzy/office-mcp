/**
 * word_table - 表格操作
 * 合并 15 个原工具
 * 
 * 使用工具工厂创建，包含参数验证
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'insert', 'delete', 'addRow', 'addColumn',
  'deleteRow', 'deleteColumn', 'mergeCells', 'splitCell',
  'setCellValue', 'getCellValue', 'format', 'setStyle',
  'setCellBorder', 'setCellShading', 'toText'
] as const

export const wordTableTool = createActionTool({
  name: 'word_table',
  description: `表格操作工具。支持的操作(action):
- insert: 插入表格 (需要 rows, columns)
- delete: 删除表格 (需要 tableIndex)
- addRow: 添加行 (需要 tableIndex)
- addColumn: 添加列 (需要 tableIndex)
- deleteRow: 删除行 (需要 tableIndex, rowIndex)
- deleteColumn: 删除列 (需要 tableIndex, columnIndex)
- mergeCells: 合并单元格 (需要 tableIndex, startRow, startColumn, endRow, endColumn)
- splitCell: 拆分单元格 (需要 tableIndex, rowIndex, columnIndex)
- setCellValue: 设置单元格值 (需要 tableIndex, rowIndex, columnIndex, value)
- getCellValue: 获取单元格值 (需要 tableIndex, rowIndex, columnIndex)
- format: 设置表格格式 (需要 tableIndex)
- setStyle: 设置表格样式 (需要 tableIndex, styleName)
- setCellBorder: 设置单元格边框 (需要 tableIndex, rowIndex, columnIndex)
- setCellShading: 设置单元格底纹 (需要 tableIndex, rowIndex, columnIndex, backgroundColor)
- toText: 表格转文本 (需要 tableIndex)`,
  category: 'table',
  application: 'word',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    insert: 'word_insert_table',
    delete: 'word_delete_table',
    addRow: 'word_add_row',
    addColumn: 'word_add_column',
    deleteRow: 'word_delete_row',
    deleteColumn: 'word_delete_column',
    mergeCells: 'word_merge_cells',
    splitCell: 'word_split_cell',
    setCellValue: 'word_set_cell_value',
    getCellValue: 'word_get_cell_value',
    format: 'word_format_table',
    setStyle: 'word_set_table_style',
    setCellBorder: 'word_set_cell_border',
    setCellShading: 'word_set_cell_shading',
    toText: 'word_table_to_text'
  },
  paramRules: {
    insert: [required('rows', 'number'), required('columns', 'number')],
    delete: [required('tableIndex', 'number')],
    addRow: [required('tableIndex', 'number')],
    addColumn: [required('tableIndex', 'number')],
    deleteRow: [required('tableIndex', 'number'), required('rowIndex', 'number')],
    deleteColumn: [required('tableIndex', 'number'), required('columnIndex', 'number')],
    mergeCells: [required('tableIndex', 'number'), required('startRow', 'number'), required('startColumn', 'number'), required('endRow', 'number'), required('endColumn', 'number')],
    splitCell: [required('tableIndex', 'number'), required('rowIndex', 'number'), required('columnIndex', 'number')],
    setCellValue: [required('tableIndex', 'number'), required('rowIndex', 'number'), required('columnIndex', 'number'), required('value', 'string')],
    getCellValue: [required('tableIndex', 'number'), required('rowIndex', 'number'), required('columnIndex', 'number')],
    format: [required('tableIndex', 'number')],
    setStyle: [required('tableIndex', 'number'), required('styleName', 'string')],
    setCellBorder: [required('tableIndex', 'number'), required('rowIndex', 'number'), required('columnIndex', 'number')],
    setCellShading: [required('tableIndex', 'number'), required('rowIndex', 'number'), required('columnIndex', 'number'), required('backgroundColor', 'string')],
    toText: [required('tableIndex', 'number')]
  },
  properties: {
    tableIndex: { type: 'number', description: '表格索引（从0开始）' },
    rows: { type: 'number', description: '[insert] 行数' },
    columns: { type: 'number', description: '[insert] 列数' },
    position: { type: 'string', enum: ['cursor', 'start', 'end', 'above', 'below', 'left', 'right'], description: '[insert/addRow/addColumn] 插入位置' },
    rowIndex: { type: 'number', description: '[多个操作] 行索引（从0开始）' },
    columnIndex: { type: 'number', description: '[多个操作] 列索引（从0开始）' },
    startRow: { type: 'number', description: '[mergeCells] 起始行' },
    startColumn: { type: 'number', description: '[mergeCells] 起始列' },
    endRow: { type: 'number', description: '[mergeCells] 结束行' },
    endColumn: { type: 'number', description: '[mergeCells] 结束列' },
    splitRows: { type: 'number', description: '[splitCell] 拆分为几行' },
    splitColumns: { type: 'number', description: '[splitCell] 拆分为几列' },
    value: { type: 'string', description: '[setCellValue] 单元格内容' },
    headerRow: { type: 'boolean', description: '[format] 首行作为标题行' },
    totalRow: { type: 'boolean', description: '[format] 末行作为汇总行' },
    bandedRows: { type: 'boolean', description: '[format] 隔行变色' },
    styleName: { type: 'string', description: '[setStyle] 表格样式名称' },
    borderType: { type: 'string', enum: ['all', 'top', 'bottom', 'left', 'right'], description: '[setCellBorder] 边框类型' },
    borderStyle: { type: 'string', enum: ['single', 'double', 'dotted', 'dashed', 'none'], description: '[setCellBorder] 边框样式' },
    borderColor: { type: 'string', description: '[setCellBorder] 边框颜色' },
    backgroundColor: { type: 'string', description: '[setCellShading] 背景颜色' },
    separator: { type: 'string', enum: ['tab', 'comma', 'semicolon', 'space'], description: '[toText] 分隔符' }
  },
  metadata: {
    version: '2.1.0',
    priority: 'P0',
    intentKeywords: ['表格', '插入表格', '删除表格', '添加行', '添加列', '合并单元格', '拆分单元格', '单元格', '表格样式', '边框'],
    mergedTools: [
      'word_insert_table', 'word_delete_table', 'word_add_row', 'word_add_column',
      'word_delete_row', 'word_delete_column', 'word_merge_cells', 'word_split_cell',
      'word_set_cell_value', 'word_get_cell_value', 'word_format_table',
      'word_set_table_style', 'word_set_cell_border', 'word_set_cell_shading',
      'word_table_to_text'
    ]
  },
  examples: [
    {
      description: '插入 3x4 表格',
      input: { action: 'insert', rows: 3, columns: 4, position: 'cursor' },
      output: { success: true, message: '成功插入表格', action: 'insert' }
    },
    {
      description: '设置单元格值',
      input: { action: 'setCellValue', tableIndex: 0, rowIndex: 0, columnIndex: 0, value: '标题' },
      output: { success: true, message: '成功设置单元格值', action: 'setCellValue' }
    }
  ]
})
