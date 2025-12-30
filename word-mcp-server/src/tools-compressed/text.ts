/**
 * word_text - 文本编辑操作
 * 合并 10 个原工具：insert, replace, delete, search,
 * getSelected, select, clearFormat, copy, cut, paste
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'insert', 'replace', 'delete', 'search',
  'getSelected', 'select', 'clearFormat',
  'copy', 'cut', 'paste'
] as const

type TextAction = typeof SUPPORTED_ACTIONS[number]

export const wordTextTool: ToolDefinition = {
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
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      // insert 参数
      text: {
        type: 'string',
        description: '[insert] 要插入的文本'
      },
      location: {
        type: 'string',
        enum: ['start', 'end', 'cursor'],
        description: '[insert] 插入位置',
        default: 'cursor'
      },
      position: {
        type: 'number',
        description: '[insert] 字符位置（如果不使用 location）'
      },
      // replace/search/delete 参数
      searchText: {
        type: 'string',
        description: '[replace/search/delete/select] 要查找的文本'
      },
      replaceText: {
        type: 'string',
        description: '[replace] 替换文本'
      },
      replaceAll: {
        type: 'boolean',
        description: '[replace] 是否替换所有',
        default: false
      },
      matchCase: {
        type: 'boolean',
        description: '[replace/search] 区分大小写',
        default: false
      },
      wholeWords: {
        type: 'boolean',
        description: '[search] 全字匹配',
        default: false
      },
      // select/delete/copy/cut 参数
      startPosition: {
        type: 'number',
        description: '[select/delete/copy/cut] 起始位置'
      },
      endPosition: {
        type: 'number',
        description: '[select/delete/copy/cut] 结束位置'
      },
      deleteAll: {
        type: 'boolean',
        description: '[delete] 删除所有匹配',
        default: false
      },
      // getSelected 参数
      includeFormatting: {
        type: 'boolean',
        description: '[getSelected] 包含格式信息',
        default: false
      },
      // clearFormat 参数
      clearAll: {
        type: 'boolean',
        description: '[clearFormat] 清除所有格式',
        default: true
      },
      // paste 参数
      pasteFormat: {
        type: 'string',
        enum: ['keepSource', 'mergeFormatting', 'keepTextOnly'],
        description: '[paste] 粘贴格式',
        default: 'keepSource'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: [
      '插入文本', '替换', '删除文本', '搜索', '查找',
      '选中', '复制', '剪切', '粘贴', '清除格式'
    ],
    applicableFor: ['text'],
    mergedTools: [
      'word_insert_text', 'word_replace_text', 'word_delete_text',
      'word_search_text', 'word_get_selected_text', 'word_select_text_range',
      'word_clear_formatting', 'word_copy_text', 'word_cut_text', 'word_paste_text'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    // 根据 action 映射到原始命令
    const commandMap: Record<TextAction, string> = {
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
    }

    const command = commandMap[action as TextAction]
    const result = await sendIPCCommand(command, params)

    return {
      ...result,
      action
    }
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
    },
    {
      description: '搜索文本',
      input: { action: 'search', searchText: 'keyword', matchCase: false },
      output: { success: true, action: 'search', data: { found: true, count: 3 } }
    }
  ]
}
