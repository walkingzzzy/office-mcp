/**
 * excel_cell - 单元格与区域操作
 * 合并 20 个原工具
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'setValue', 'getValue', 'setRange', 'getRange',
  'clear', 'insert', 'delete', 'merge', 'unmerge',
  'copy', 'cut', 'paste', 'find', 'replace',
  'sort', 'filter', 'autofit', 'setWidth', 'setHeight', 'freeze'
] as const

export const excelCellTool = createActionTool({
  name: 'excel_cell',
  description: `单元格与区域操作工具。支持的操作(action):
- setValue: 设置单元格值 (需要 cell, value)
- getValue: 获取单元格值 (需要 cell)
- setRange: 设置区域值 (需要 range, values)
- getRange: 获取区域值 (需要 range)
- clear: 清除区域 (需要 range)
- insert: 插入单元格 (需要 range, 可选 shift)
- delete: 删除单元格 (需要 range, 可选 shift)
- merge: 合并单元格 (需要 range)
- unmerge: 取消合并 (需要 range)
- copy: 复制区域 (需要 range)
- cut: 剪切区域 (需要 range)
- paste: 粘贴 (需要 range)
- find: 查找 (需要 searchText)
- replace: 替换 (需要 searchText, replaceText)
- sort: 排序 (需要 range, 可选 sortBy, ascending)
- filter: 筛选 (需要 range, 可选 criteria)
- autofit: 自动调整列宽 (需要 range)
- setWidth: 设置列宽 (需要 range, size)
- setHeight: 设置行高 (需要 range, size)
- freeze: 冻结窗格 (可选 rows, columns)`,
  category: 'cell',
  application: 'excel',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    setValue: 'excel_set_cell_value',
    getValue: 'excel_get_cell_value',
    setRange: 'excel_set_range_values',
    getRange: 'excel_get_range_values',
    clear: 'excel_clear_range',
    insert: 'excel_insert_cells',
    delete: 'excel_delete_cells',
    merge: 'excel_merge_cells',
    unmerge: 'excel_unmerge_cells',
    copy: 'excel_copy_range',
    cut: 'excel_cut_range',
    paste: 'excel_paste_range',
    find: 'excel_find_cell',
    replace: 'excel_replace_cell',
    sort: 'excel_sort_range',
    filter: 'excel_filter_range',
    autofit: 'excel_autofit_columns',
    setWidth: 'excel_set_column_width',
    setHeight: 'excel_set_row_height',
    freeze: 'excel_freeze_panes'
  },
  paramRules: {
    setValue: [required('cell', 'string'), required('value', 'string')],
    getValue: [required('cell', 'string')],
    setRange: [required('range', 'string'), required('values', 'array')],
    getRange: [required('range', 'string')],
    clear: [required('range', 'string')],
    insert: [required('range', 'string')],
    delete: [required('range', 'string')],
    merge: [required('range', 'string')],
    unmerge: [required('range', 'string')],
    copy: [required('range', 'string')],
    cut: [required('range', 'string')],
    paste: [required('range', 'string')],
    find: [required('searchText', 'string')],
    replace: [required('searchText', 'string'), required('replaceText', 'string')],
    sort: [required('range', 'string')],
    filter: [required('range', 'string')],
    autofit: [required('range', 'string')],
    setWidth: [required('range', 'string'), required('size', 'number')],
    setHeight: [required('range', 'string'), required('size', 'number')],
    freeze: []
  },
  properties: {
    cell: {
      type: 'string',
      description: '[setValue/getValue] 单元格地址 (如 "A1")'
    },
    range: {
      type: 'string',
      description: '[多个操作] 区域地址 (如 "A1:B10")'
    },
    value: {
      type: ['string', 'number', 'boolean'],
      description: '[setValue] 单元格值'
    },
    values: {
      type: 'array',
      items: { type: 'array' },
      description: '[setRange] 二维数组值'
    },
    shift: {
      type: 'string',
      enum: ['right', 'down'],
      description: '[insert/delete] 移动方向'
    },
    searchText: {
      type: 'string',
      description: '[find/replace] 搜索文本'
    },
    replaceText: {
      type: 'string',
      description: '[replace] 替换文本'
    },
    matchCase: {
      type: 'boolean',
      description: '[find/replace] 区分大小写',
      default: false
    },
    sortBy: {
      type: 'string',
      description: '[sort] 排序列'
    },
    ascending: {
      type: 'boolean',
      description: '[sort] 升序排列',
      default: true
    },
    criteria: {
      type: 'object',
      description: '[filter] 筛选条件'
    },
    size: {
      type: 'number',
      description: '[setWidth/setHeight] 尺寸'
    },
    rows: {
      type: 'number',
      description: '[freeze] 冻结行数'
    },
    columns: {
      type: 'number',
      description: '[freeze] 冻结列数'
    }
  },
  metadata: {
    version: '2.1.0',
    priority: 'P0',
    intentKeywords: [
      '单元格', '设置值', '获取值', '区域', '合并',
      '复制', '粘贴', '查找', '替换', '排序', '筛选', '冻结'
    ],
    mergedTools: [
      'excel_set_cell_value', 'excel_get_cell_value',
      'excel_set_range_values', 'excel_get_range_values',
      'excel_clear_range', 'excel_insert_cells', 'excel_delete_cells',
      'excel_merge_cells', 'excel_unmerge_cells',
      'excel_copy_range', 'excel_cut_range', 'excel_paste_range',
      'excel_find_cell', 'excel_replace_cell',
      'excel_sort_range', 'excel_filter_range',
      'excel_autofit_columns', 'excel_set_column_width',
      'excel_set_row_height', 'excel_freeze_panes'
    ]
  },
  examples: [
    {
      description: '设置单元格值',
      input: { action: 'setValue', cell: 'A1', value: 'Hello' },
      output: { success: true, message: '成功设置单元格值', action: 'setValue' }
    },
    {
      description: '合并单元格',
      input: { action: 'merge', range: 'A1:C1' },
      output: { success: true, message: '成功合并单元格', action: 'merge' }
    }
  ]
})
