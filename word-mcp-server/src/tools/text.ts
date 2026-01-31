/**
 * word_text - 文本编辑操作
 * 合并 10 个原工具：insert, replace, delete, search,
 * getSelected, select, clearFormat, copy, cut, paste
 * 
 * 使用工具工厂创建，包含参数验证
 */

import { createActionTool, required, optional } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'insert', 'replace', 'delete', 'search',
  'getSelected', 'select', 'clearFormat',
  'copy', 'cut', 'paste'
] as const

export const wordTextTool = createActionTool({
  name: 'word_text',
  description: `文本编辑操作工具。支持的操作(action):
- insert: 插入文本 (需要 text, 可选 location/position)
- replace: 替换文本 (需要 searchText, replaceText)
- delete: 删除文本 (需要 searchText 或 startPosition/endPosition)
- search: 搜索文本 (需要 searchText)
- getSelected: 获取选中文本
- select: 选择文本范围 (需要 startPosition/endPosition 或 searchText)
- clearFormat: 清除格式
- copy: 复制文本
- cut: 剪切文本
- paste: 粘贴文本 (可选 pasteFormat)`,
  category: 'text',
  application: 'word',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    insert: 'word_insert_text',
    replace: 'word_replace_text',
    delete: 'word_delete_text',
    search: 'word_search_text',
    getSelected: 'word_get_selected_text',
    select: 'word_select_text_range',
    clearFormat: 'word_clear_formatting',
    copy: 'word_copy_text',
    cut: 'word_cut_text',
    paste: 'word_paste_text'
  },
  paramRules: {
    insert: [required('text', 'string')],
    replace: [required('searchText', 'string'), required('replaceText', 'string')],
    delete: [], // searchText 或 startPosition/endPosition
    search: [required('searchText', 'string')],
    getSelected: [],
    select: [],
    clearFormat: [],
    copy: [],
    cut: [],
    paste: []
  },
  properties: {
    text: { type: 'string', description: '[insert] 要插入的文本' },
    location: { type: 'string', enum: ['start', 'end', 'cursor'], description: '[insert] 插入位置' },
    position: { type: 'number', description: '[insert] 字符位置' },
    searchText: { type: 'string', description: '[replace/search/delete/select] 要查找的文本' },
    replaceText: { type: 'string', description: '[replace] 替换文本' },
    replaceAll: { type: 'boolean', description: '[replace] 是否替换所有' },
    matchCase: { type: 'boolean', description: '[replace/search] 区分大小写' },
    wholeWords: { type: 'boolean', description: '[search] 全字匹配' },
    startPosition: { type: 'number', description: '[select/delete/copy/cut] 起始位置' },
    endPosition: { type: 'number', description: '[select/delete/copy/cut] 结束位置' },
    deleteAll: { type: 'boolean', description: '[delete] 删除所有匹配' },
    includeFormatting: { type: 'boolean', description: '[getSelected] 包含格式信息' },
    clearAll: { type: 'boolean', description: '[clearFormat] 清除所有格式' },
    pasteFormat: { type: 'string', enum: ['keepSource', 'mergeFormatting', 'keepTextOnly'], description: '[paste] 粘贴格式' }
  },
  metadata: {
    version: '2.1.0',
    priority: 'P0',
    intentKeywords: ['插入文本', '替换', '删除文本', '搜索', '查找', '选中', '复制', '剪切', '粘贴', '清除格式'],
    mergedTools: [
      'word_insert_text', 'word_replace_text', 'word_delete_text',
      'word_search_text', 'word_get_selected_text', 'word_select_text_range',
      'word_clear_formatting', 'word_copy_text', 'word_cut_text', 'word_paste_text'
    ]
  },
  examples: [
    {
      description: '在光标处插入文本',
      input: { action: 'insert', text: 'Hello World', location: 'cursor' },
      output: { success: true, message: '成功插入文本', action: 'insert' }
    },
    {
      description: '替换所有匹配文本',
      input: { action: 'replace', searchText: 'old', replaceText: 'new', replaceAll: true },
      output: { success: true, message: '成功替换 5 处', action: 'replace', data: { count: 5 } }
    }
  ]
})
