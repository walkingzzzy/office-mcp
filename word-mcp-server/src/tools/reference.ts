/**
 * word_reference - 超链接与引用
 * 合并 8 个原工具：insertHyperlink, removeHyperlink, insertBookmark,
 * insertCrossReference, insertFootnote, insertEndnote, insertCitation, insertBibliography
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'insertLink', 'removeLink', 'insertBookmark',
  'insertCrossRef', 'insertFootnote', 'insertEndnote',
  'insertCitation', 'insertBibliography'
] as const

type ReferenceAction = typeof SUPPORTED_ACTIONS[number]

export const wordReferenceTool: ToolDefinition = {
  name: 'word_reference',
  description: `超链接与引用工具。支持的操作(action):
- insertLink: 插入超链接 (需要 url, 可选 text/tooltip)
- removeLink: 移除超链接
- insertBookmark: 插入书签 (需要 name)
- insertCrossRef: 插入交叉引用 (需要 referenceType, referenceItem)
- insertFootnote: 插入脚注 (需要 text)
- insertEndnote: 插入尾注 (需要 text)
- insertCitation: 插入引文 (需要 source)
- insertBibliography: 插入参考文献`,
  category: 'reference',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      // insertLink 参数
      url: {
        type: 'string',
        description: '[insertLink] 链接地址'
      },
      text: {
        type: 'string',
        description: '[insertLink/insertFootnote/insertEndnote] 显示文本或注释内容'
      },
      tooltip: {
        type: 'string',
        description: '[insertLink] 提示文本'
      },
      // insertBookmark 参数
      name: {
        type: 'string',
        description: '[insertBookmark] 书签名称'
      },
      // insertCrossRef 参数
      referenceType: {
        type: 'string',
        enum: ['heading', 'bookmark', 'footnote', 'endnote', 'figure', 'table', 'equation'],
        description: '[insertCrossRef] 引用类型'
      },
      referenceItem: {
        type: 'string',
        description: '[insertCrossRef] 引用项目'
      },
      insertAsHyperlink: {
        type: 'boolean',
        description: '[insertCrossRef] 作为超链接插入',
        default: true
      },
      // insertCitation 参数
      source: {
        type: 'object',
        description: '[insertCitation] 引文来源',
        properties: {
          type: { type: 'string', enum: ['book', 'article', 'website', 'journal'] },
          author: { type: 'string' },
          title: { type: 'string' },
          year: { type: 'number' },
          publisher: { type: 'string' },
          url: { type: 'string' }
        }
      },
      // insertBibliography 参数
      style: {
        type: 'string',
        enum: ['APA', 'MLA', 'Chicago', 'Harvard', 'IEEE'],
        description: '[insertBibliography] 参考文献样式',
        default: 'APA'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: [
      '超链接', '链接', '书签', '交叉引用', '脚注',
      '尾注', '引文', '参考文献', '引用'
    ],
    mergedTools: [
      'word_insert_hyperlink', 'word_remove_hyperlink', 'word_insert_bookmark',
      'word_insert_cross_reference', 'word_insert_footnote', 'word_insert_endnote',
      'word_insert_citation', 'word_insert_bibliography'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<ReferenceAction, string> = {
      insertLink: 'word_insert_hyperlink',
      removeLink: 'word_remove_hyperlink',
      insertBookmark: 'word_insert_bookmark',
      insertCrossRef: 'word_insert_cross_reference',
      insertFootnote: 'word_insert_footnote',
      insertEndnote: 'word_insert_endnote',
      insertCitation: 'word_insert_citation',
      insertBibliography: 'word_insert_bibliography'
    }

    const command = commandMap[action as ReferenceAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '插入超链接',
      input: { action: 'insertLink', url: 'https://example.com', text: '示例网站' },
      output: { success: true, message: '成功插入超链接', action: 'insertLink' }
    },
    {
      description: '插入脚注',
      input: { action: 'insertFootnote', text: '这是一个脚注说明。' },
      output: { success: true, message: '成功插入脚注', action: 'insertFootnote' }
    }
  ]
}
