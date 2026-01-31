/**
 * word_advanced - 高级页面元素
 * 合并 4 个原工具：insertToc, updateToc, insertPageBreak, insertSectionBreak
 */

import { createActionTool } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'insertToc', 'updateToc', 'insertPageBreak', 'insertSectionBreak'
] as const

export const wordAdvancedTool = createActionTool({
  name: 'word_advanced',
  description: `高级页面元素工具。支持的操作(action):
- insertToc: 插入目录 (可选 levels, useHyperlinks)
- updateToc: 更新目录
- insertPageBreak: 插入分页符
- insertSectionBreak: 插入分节符 (可选 breakType)`,
  category: 'page',
  application: 'word',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    insertToc: 'word_insert_toc',
    updateToc: 'word_update_toc',
    insertPageBreak: 'word_insert_page_break',
    insertSectionBreak: 'word_insert_section_break'
  },
  properties: {
    levels: {
      type: 'number',
      description: '[insertToc] 目录级别数',
      default: 3,
      minimum: 1,
      maximum: 9
    },
    useHyperlinks: {
      type: 'boolean',
      description: '[insertToc] 使用超链接',
      default: true
    },
    breakType: {
      type: 'string',
      enum: ['nextPage', 'continuous', 'evenPage', 'oddPage'],
      description: '[insertSectionBreak] 分节符类型',
      default: 'nextPage'
    }
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: ['目录', '分页符', '分节符', '插入目录', '更新目录'],
    mergedTools: [
      'word_insert_toc', 'word_update_toc',
      'word_insert_page_break', 'word_insert_section_break'
    ]
  },
  examples: [
    {
      description: '插入三级目录',
      input: { action: 'insertToc', levels: 3, useHyperlinks: true },
      output: { success: true, message: '成功插入目录', action: 'insertToc' }
    },
    {
      description: '插入分页符',
      input: { action: 'insertPageBreak' },
      output: { success: true, message: '成功插入分页符', action: 'insertPageBreak' }
    }
  ]
})
