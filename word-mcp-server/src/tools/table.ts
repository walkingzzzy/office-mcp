/**
 * word_table - 表格操作
 * 合并 15 个原工具：insert, delete, addRow, addColumn,
 * deleteRow, deleteColumn, mergeCells, splitCell, setCellValue,
 * getCellValue, format, setStyle, setCellBorder, setCellShading, toText
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'insert', 'delete', 'addRow', 'addColumn',
  'deleteRow', 'deleteColumn', 'mergeCells', 'splitCell',
  'setCellValue', 'getCellValue', 'format', 'setStyle',
  'setCellBorder', 'setCellShading', 'toText'
] as const

type TableAction = typeof SUPPORTED_ACTIONS[number]

export const wordTableTool: ToolDefinition = {
  name: 'word_table',
  description: `表格操作工具。支持的操作(action):
- insert: 插入表格 (需要 rows, columns)
- delete: 删除表格 (需要 tableIndex)
- addRow: 添加行 (需要 tableIndex, 可选 position/rowIndex)
- addColumn: 添加列 (需要 tableIndex, 可选 position/columnIndex)
- deleteRow: 删除行 (需要 tableIndex, rowIndex)
- deleteColumn: 删除列 (需要 tableIndex, columnIndex)
- mergeCells: 合并单元格 (需要 tableIndex, startRow, startColumn, endRow, endColumn)
- splitCell: 拆分单元格 (需要 tableIndex, rowIndex, columnIndex)
- setCellValue: 设置单元格值 (需要 tableIndex, rowIndex, columnIndex, value)
- getCellValue: 获取单元格值 (需要 tableIndex, rowIndex, columnIndex)
- format: 设置表格格式 (需要 tableIndex, 可选 headerRow/totalRow/bandedRows)
- setStyle: 设置表格样式 (需要 tableIndex, styleName)
- setCellBorder: 设置单元格边框 (需要 tableIndex, rowIndex, columnIndex)
- setCellShading: 设置单元格底纹 (需要 tableIndex, rowIndex, columnIndex, backgroundColor)
- toText: 表格转文本 (需要 tableIndex)`,
  category: 'table',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      // 表格标识
      tableIndex: {
        type: 'number',
        description: '表格索引（从0开始）',
        default: 0
      },
      // insert 参数
      rows: {
        type: 'number',
        description: '[insert] 行数',
        minimum: 1
      },
      columns: {
        type: 'number',
        description: '[insert] 列数',
        minimum: 1
      },
      position: {
        type: 'string',
        enum: ['cursor', 'start', 'end', 'above', 'below', 'left', 'right'],
        description: '[insert/addRow/addColumn] 插入位置'
      },
      // 行列操作参数
      rowIndex: {
        type: 'number',
        description: '[多个操作] 行索引（从0开始）'
      },
      columnIndex: {
        type: 'number',
        description: '[多个操作] 列索引（从0开始）'
      },
      // mergeCells 参数
      startRow: {
        type: 'number',
        description: '[mergeCells] 起始行'
      },
      startColumn: {
        type: 'number',
        description: '[mergeCells] 起始列'
      },
      endRow: {
        type: 'number',
        description: '[mergeCells] 结束行'
      },
      endColumn: {
        type: 'number',
        description: '[mergeCells] 结束列'
      },
      // splitCell 参数
      splitRows: {
        type: 'number',
        description: '[splitCell] 拆分为几行',
        default: 1
      },
      splitColumns: {
        type: 'number',
        description: '[splitCell] 拆分为几列',
        default: 2
      },
      // setCellValue 参数
      value: {
        type: 'string',
        description: '[setCellValue] 单元格内容'
      },
      // format 参数
      headerRow: {
        type: 'boolean',
        description: '[format] 首行作为标题行'
      },
      totalRow: {
        type: 'boolean',
        description: '[format] 末行作为汇总行'
      },
      bandedRows: {
        type: 'boolean',
        description: '[format] 隔行变色'
      },
      bandedColumns: {
        type: 'boolean',
        description: '[format] 隔列变色'
      },
      // setStyle 参数
      styleName: {
        type: 'string',
        description: '[setStyle] 表格样式名称'
      },
      // setCellBorder 参数
      borderType: {
        type: 'string',
        enum: ['all', 'top', 'bottom', 'left', 'right'],
        description: '[setCellBorder] 边框类型',
        default: 'all'
      },
      borderStyle: {
        type: 'string',
        enum: ['single', 'double', 'dotted', 'dashed', 'none'],
        description: '[setCellBorder] 边框样式',
        default: 'single'
      },
      borderColor: {
        type: 'string',
        description: '[setCellBorder] 边框颜色（十六进制）'
      },
      borderWidth: {
        type: 'number',
        description: '[setCellBorder] 边框宽度（磅）',
        minimum: 0.25,
        maximum: 6
      },
      // setCellShading 参数
      backgroundColor: {
        type: 'string',
        description: '[setCellShading] 背景颜色（十六进制）'
      },
      pattern: {
        type: 'string',
        enum: ['solid', 'clear', 'percent10', 'percent20', 'percent25'],
        description: '[setCellShading] 填充图案',
        default: 'solid'
      },
      // toText 参数
      separator: {
        type: 'string',
        enum: ['tab', 'comma', 'semicolon', 'space'],
        description: '[toText] 分隔符',
        default: 'tab'
      },
      includeHeaders: {
        type: 'boolean',
        description: '[toText] 包含标题行',
        default: true
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: [
      '表格', '插入表格', '删除表格', '添加行', '添加列',
      '合并单元格', '拆分单元格', '单元格', '表格样式', '边框'
    ],
    applicableFor: ['table'],
    mergedTools: [
      'word_insert_table', 'word_delete_table', 'word_add_row', 'word_add_column',
      'word_delete_row', 'word_delete_column', 'word_merge_cells', 'word_split_cell',
      'word_set_cell_value', 'word_get_cell_value', 'word_format_table',
      'word_set_table_style', 'word_set_cell_border', 'word_set_cell_shading',
      'word_table_to_text'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    // 根据 action 映射到原始命令
    const commandMap: Record<TableAction, string> = {
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
    }

    const command = commandMap[action as TableAction]
    const result = await sendIPCCommand(command, params)

    return {
      ...result,
      action
    }
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
    },
    {
      description: '合并单元格',
      input: { action: 'mergeCells', tableIndex: 0, startRow: 0, startColumn: 0, endRow: 0, endColumn: 2 },
      output: { success: true, message: '成功合并单元格', action: 'mergeCells' }
    }
  ]
}
