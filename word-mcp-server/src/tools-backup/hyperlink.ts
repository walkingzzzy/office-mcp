/**
 * Word Hyperlink and Reference Tools - Phase 4 Implementation
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

// Hyperlink and Reference Operations (8 tools)

export const wordInsertHyperlinkTool: ToolDefinition = {
  name: 'word_insert_hyperlink',
  description: '在文档中插入超链接。设置显示文本和链接地址（URL或文件路径）。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Display text for hyperlink' },
      url: { type: 'string', description: 'URL or file path' },
      position: { type: 'string', enum: ['cursor', 'selection'], default: 'cursor' }
    },
    required: ['text', 'url']
  },
  handler: async (args: any) => sendIPCCommand('word_insert_hyperlink', args)
}

export const wordRemoveHyperlinkTool: ToolDefinition = {
  name: 'word_remove_hyperlink',
  description: '从文本中删除超链接',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      hyperlinkIndex: { type: 'number', description: 'Hyperlink index' },
      searchText: { type: 'string', description: 'Text to find and remove hyperlink from' }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_remove_hyperlink', args)
}

export const wordInsertBookmarkTool: ToolDefinition = {
  name: 'word_insert_bookmark',
  description: '在当前位置插入书签。书签可用于文档内导航或创建交叉引用。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Bookmark name' },
      position: { type: 'string', enum: ['cursor', 'selection'], default: 'cursor' }
    },
    required: ['name']
  },
  handler: async (args: any) => sendIPCCommand('word_insert_bookmark', args)
}

export const wordInsertCrossReferenceTool: ToolDefinition = {
  name: 'word_insert_cross_reference',
  description: '插入交叉引用。可引用书签、标题、图表或表格，实现文档内的智能链接。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      referenceType: {
        type: 'string',
        enum: ['bookmark', 'heading', 'figure', 'table'],
        description: 'Type of reference'
      },
      referenceName: { type: 'string', description: 'Name of item to reference' },
      insertAs: { type: 'string', enum: ['text', 'page_number', 'hyperlink'], default: 'hyperlink' }
    },
    required: ['referenceType', 'referenceName']
  },
  handler: async (args: any) => sendIPCCommand('word_insert_cross_reference', args)
}

export const wordInsertFootnoteTool: ToolDefinition = {
  name: 'word_insert_footnote',
  description: '在当前位置插入脚注。脚注内容显示在当前页面底部。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Footnote text' },
      position: { type: 'string', enum: ['cursor', 'selection'], default: 'cursor' }
    },
    required: ['text']
  },
  handler: async (args: any) => sendIPCCommand('word_insert_footnote', args)
}

export const wordInsertEndnoteTool: ToolDefinition = {
  name: 'word_insert_endnote',
  description: '在当前位置插入尾注。尾注内容显示在文档末尾。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Endnote text' },
      position: { type: 'string', enum: ['cursor', 'selection'], default: 'cursor' }
    },
    required: ['text']
  },
  handler: async (args: any) => sendIPCCommand('word_insert_endnote', args)
}

export const wordInsertCitationTool: ToolDefinition = {
  name: 'word_insert_citation',
  description: '插入引文引用。支持书籍、期刊、网站、会议等多种来源类型。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      sourceType: { type: 'string', enum: ['book', 'journal', 'website', 'conference'], description: 'Type of source' },
      author: { type: 'string', description: 'Author name' },
      title: { type: 'string', description: 'Title of work' },
      year: { type: 'number', description: 'Publication year' },
      publisher: { type: 'string', description: 'Publisher name' },
      url: { type: 'string', description: 'URL for web sources' }
    },
    required: ['sourceType', 'author', 'title']
  },
  handler: async (args: any) => sendIPCCommand('word_insert_citation', args)
}

export const wordInsertBibliographyTool: ToolDefinition = {
  name: 'word_insert_bibliography',
  description: '插入参考文献列表。自动收集文档中的所有引用，支持 APA、MLA、Chicago、Harvard 等格式。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      style: { type: 'string', enum: ['APA', 'MLA', 'Chicago', 'Harvard'], default: 'APA' },
      title: { type: 'string', default: 'References', description: 'Bibliography section title' },
      position: { type: 'string', enum: ['cursor', 'end'], default: 'cursor' }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_insert_bibliography', args)
}
