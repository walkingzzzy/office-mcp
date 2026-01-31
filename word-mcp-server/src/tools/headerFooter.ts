/**
 * word_header_footer - 页眉页脚
 * 合并 6 个原工具：insertHeader, insertFooter, getHeader,
 * getFooter, clearHeader, clearFooter
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'insertHeader', 'insertFooter', 'getHeader',
  'getFooter', 'clearHeader', 'clearFooter'
] as const

export const wordHeaderFooterTool = createActionTool({
  name: 'word_header_footer',
  description: `页眉页脚工具。支持的操作(action):
- insertHeader: 插入页眉 (需要 text, 可选 alignment/type)
- insertFooter: 插入页脚 (需要 text, 可选 alignment/type)
- getHeader: 获取页眉内容 (可选 type)
- getFooter: 获取页脚内容 (可选 type)
- clearHeader: 清除页眉 (可选 type)
- clearFooter: 清除页脚 (可选 type)

type 参数说明：
- primary: 主页眉/页脚（默认）
- firstPage: 首页页眉/页脚
- evenPages: 偶数页页眉/页脚`,
  category: 'page',
  application: 'word',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    insertHeader: 'word_insert_header',
    insertFooter: 'word_insert_footer',
    getHeader: 'word_get_header',
    getFooter: 'word_get_footer',
    clearHeader: 'word_clear_header',
    clearFooter: 'word_clear_footer'
  },
  paramRules: {
    insertHeader: [required('text', 'string')],
    insertFooter: [required('text', 'string')]
  },
  properties: {
    text: {
      type: 'string',
      description: '[insertHeader/insertFooter] 页眉/页脚文本'
    },
    alignment: {
      type: 'string',
      enum: ['left', 'center', 'right'],
      description: '[insertHeader/insertFooter] 对齐方式',
      default: 'center'
    },
    type: {
      type: 'string',
      enum: ['primary', 'firstPage', 'evenPages'],
      description: '页眉/页脚类型',
      default: 'primary'
    },
    includePageNumber: {
      type: 'boolean',
      description: '[insertHeader/insertFooter] 包含页码',
      default: false
    },
    pageNumberFormat: {
      type: 'string',
      enum: ['arabic', 'roman', 'romanUpper', 'letter', 'letterUpper'],
      description: '[insertHeader/insertFooter] 页码格式',
      default: 'arabic'
    },
    differentFirstPage: {
      type: 'boolean',
      description: '首页不同',
      default: false
    },
    differentOddAndEvenPages: {
      type: 'boolean',
      description: '奇偶页不同',
      default: false
    }
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: [
      '页眉', '页脚', '插入页眉', '插入页脚',
      '清除页眉', '清除页脚', '页码'
    ],
    mergedTools: [
      'word_insert_header', 'word_insert_footer',
      'word_get_header', 'word_get_footer',
      'word_clear_header', 'word_clear_footer'
    ]
  },
  examples: [
    {
      description: '插入居中页眉',
      input: { action: 'insertHeader', text: '公司机密文档', alignment: 'center' },
      output: { success: true, message: '成功插入页眉', action: 'insertHeader' }
    },
    {
      description: '插入带页码的页脚',
      input: { action: 'insertFooter', text: '第 {PAGE} 页', alignment: 'center', includePageNumber: true },
      output: { success: true, message: '成功插入页脚', action: 'insertFooter' }
    },
    {
      description: '清除页眉',
      input: { action: 'clearHeader', type: 'primary' },
      output: { success: true, message: '成功清除页眉', action: 'clearHeader' }
    }
  ]
})
