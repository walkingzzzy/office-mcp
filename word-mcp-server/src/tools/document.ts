/**
 * word_document - 文档生命周期管理
 * 合并 12 个原工具：open, close, save, saveAs, getSaveStatus,
 * print, printPreview, closePrintPreview, getProperties, setProperties,
 * getStatistics, getPath
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'open', 'close', 'save', 'saveAs', 'getSaveStatus',
  'print', 'printPreview', 'closePrintPreview',
  'getProperties', 'setProperties', 'getStatistics', 'getPath'
] as const

export const wordDocumentTool = createActionTool({
  name: 'word_document',
  description: `文档生命周期管理工具。支持的操作(action):
- open: 打开文档 (需要 path)
- close: 关闭文档
- save: 保存文档
- saveAs: 另存为 (需要 fileName, 可选 format)
- getSaveStatus: 获取保存状态
- print: 打印文档 (可选 copies, pageRange, duplex)
- printPreview: 打印预览
- closePrintPreview: 关闭打印预览
- getProperties: 获取文档属性
- setProperties: 设置文档属性 (需要 properties)
- getStatistics: 获取文档统计信息
- getPath: 获取文档路径`,
  category: 'document',
  application: 'word',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    open: 'word_open_document',
    close: 'word_close_document',
    save: 'word_save_document',
    saveAs: 'word_save_as_document',
    getSaveStatus: 'word_get_save_status',
    print: 'word_print_document',
    printPreview: 'word_print_preview',
    closePrintPreview: 'word_close_print_preview',
    getProperties: 'word_get_document_properties',
    setProperties: 'word_set_document_properties',
    getStatistics: 'word_get_document_statistics',
    getPath: 'word_get_document_path'
  },
  paramRules: {
    open: [required('path', 'string')],
    saveAs: [required('fileName', 'string')],
    setProperties: [required('properties', 'object')]
  },
  pathParams: {
    filePath: ['path']
  },
  properties: {
    path: {
      type: 'string',
      description: '[open] 文档路径（本地路径或 URL）'
    },
    readOnly: {
      type: 'boolean',
      description: '[open] 是否以只读模式打开',
      default: false
    },
    fileName: {
      type: 'string',
      description: '[saveAs] 新文件名'
    },
    format: {
      type: 'string',
      enum: ['docx', 'pdf', 'html', 'rtf', 'txt'],
      description: '[saveAs] 保存格式'
    },
    copies: {
      type: 'number',
      description: '[print] 打印份数',
      default: 1
    },
    pageRange: {
      type: 'string',
      description: '[print] 页面范围（如 "1-5,8,11-13"）'
    },
    collate: {
      type: 'boolean',
      description: '[print] 是否逐份打印',
      default: true
    },
    duplex: {
      type: 'string',
      enum: ['none', 'vertical', 'horizontal'],
      description: '[print] 双面打印模式',
      default: 'none'
    },
    properties: {
      type: 'object',
      description: '[setProperties] 文档属性',
      properties: {
        title: { type: 'string', description: '文档标题' },
        author: { type: 'string', description: '作者' },
        subject: { type: 'string', description: '主题' },
        keywords: { type: 'string', description: '关键词（用逗号分隔）' },
        comments: { type: 'string', description: '备注' },
        category: { type: 'string', description: '类别' },
        manager: { type: 'string', description: '管理者' },
        company: { type: 'string', description: '公司' }
      }
    }
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: [
      '打开文档', '关闭文档', '保存', '另存为', '打印',
      '文档属性', '统计', '字数', '页数'
    ],
    mergedTools: [
      'word_open_document', 'word_close_document', 'word_save_document',
      'word_save_as_document', 'word_get_save_status', 'word_print_document',
      'word_print_preview', 'word_close_print_preview', 'word_get_document_properties',
      'word_set_document_properties', 'word_get_document_statistics', 'word_get_document_path'
    ]
  },
  examples: [
    {
      description: '打开文档',
      input: { action: 'open', path: 'C:\\Documents\\report.docx' },
      output: { success: true, message: '成功打开文档', action: 'open' }
    },
    {
      description: '另存为 PDF',
      input: { action: 'saveAs', fileName: 'report.pdf', format: 'pdf' },
      output: { success: true, message: '成功另存为', action: 'saveAs' }
    },
    {
      description: '获取文档统计',
      input: { action: 'getStatistics' },
      output: {
        success: true,
        action: 'getStatistics',
        data: { pageCount: 10, wordCount: 2500, characterCount: 15000 }
      }
    }
  ]
})
