/**
 * Word Formatting Tools - Phase 3 Implementation
 */

import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '@office-mcp/shared'

// Formatting Operations (10 tools)

export const wordSetFontTool: ToolDefinition = {
  name: 'word_set_font',
  description: '设置选中文本或范围的字体',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      fontName: { type: 'string', description: 'Font family name (e.g., "Arial", "Times New Roman")' },
      searchText: { type: 'string', description: 'Text to find and format' },
      paragraphIndex: { type: 'number', description: 'Zero-based index of paragraph to format' },
      startPosition: { type: 'number', description: 'Start position' },
      endPosition: { type: 'number', description: 'End position' }
    },
    required: ['fontName']
  },
  handler: async (args: any) => sendIPCCommand('word_set_font', args)
}

export const wordSetFontSizeTool: ToolDefinition = {
  name: 'word_set_font_size',
  description: '设置选中文本或范围的字号',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      fontSize: { type: 'number', minimum: 1, maximum: 1638, description: 'Font size in points' },
      searchText: { type: 'string', description: 'Text to find and format' },
      paragraphIndex: { type: 'number', description: 'Zero-based index of paragraph to format' },
      startPosition: { type: 'number', description: 'Start position' },
      endPosition: { type: 'number', description: 'End position' }
    },
    required: ['fontSize']
  },
  handler: async (args: any) => sendIPCCommand('word_set_font_size', args)
}

export const wordSetFontColorTool: ToolDefinition = {
  name: 'word_set_font_color',
  description: '设置选中文本或范围的字体颜色',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      color: { type: 'string', description: 'Font color (hex format, e.g., "#FF0000")' },
      searchText: { type: 'string', description: 'Text to find and format' },
      paragraphIndex: { type: 'number', description: 'Zero-based index of paragraph to format' },
      startPosition: { type: 'number', description: 'Start position' },
      endPosition: { type: 'number', description: 'End position' }
    },
    required: ['color']
  },
  handler: async (args: any) => sendIPCCommand('word_set_font_color', args)
}

export const wordSetBoldTool: ToolDefinition = {
  name: 'word_set_bold',
  description: '设置或取消文本加粗格式。可对选中文本、指定段落或搜索到的文本应用加粗效果。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      bold: { type: 'boolean', description: 'Apply (true) or remove (false) bold' },
      searchText: { type: 'string', description: 'Text to find and format' },
      paragraphIndex: { type: 'number', description: 'Zero-based index of paragraph to format' },
      startPosition: { type: 'number', description: 'Start position' },
      endPosition: { type: 'number', description: 'End position' }
    },
    required: ['bold']
  },
  handler: async (args: any) => sendIPCCommand('word_set_bold', args)
}

export const wordSetItalicTool: ToolDefinition = {
  name: 'word_set_italic',
  description: '设置或取消文本斜体格式。可对选中文本、指定段落或搜索到的文本应用斜体效果。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      italic: { type: 'boolean', description: 'Apply (true) or remove (false) italic' },
      searchText: { type: 'string', description: 'Text to find and format' },
      paragraphIndex: { type: 'number', description: 'Zero-based index of paragraph to format' },
      startPosition: { type: 'number', description: 'Start position' },
      endPosition: { type: 'number', description: 'End position' }
    },
    required: ['italic']
  },
  handler: async (args: any) => sendIPCCommand('word_set_italic', args)
}

export const wordSetUnderlineTool: ToolDefinition = {
  name: 'word_set_underline',
  description: '设置或取消文本下划线格式。支持单线、双线、点线、虚线等多种下划线样式。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      underline: { type: 'boolean', description: 'Apply (true) or remove (false) underline' },
      underlineType: { type: 'string', enum: ['single', 'double', 'dotted', 'dashed'], default: 'single' },
      searchText: { type: 'string', description: 'Text to find and format' },
      paragraphIndex: { type: 'number', description: 'Zero-based index of paragraph to format' },
      startPosition: { type: 'number', description: 'Start position' },
      endPosition: { type: 'number', description: 'End position' }
    },
    required: ['underline']
  },
  handler: async (args: any) => sendIPCCommand('word_set_underline', args)
}

export const wordSetHighlightTool: ToolDefinition = {
  name: 'word_set_highlight',
  description: '设置或取消文本高亮显示。可使用黄色、绿色等多种颜色高亮标记重要内容。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      highlightColor: { type: 'string', description: 'Highlight color (e.g., "yellow", "green", "none")' },
      searchText: { type: 'string', description: 'Text to find and highlight' },
      paragraphIndex: { type: 'number', description: 'Zero-based index of paragraph to format' },
      startPosition: { type: 'number', description: 'Start position' },
      endPosition: { type: 'number', description: 'End position' }
    },
    required: ['highlightColor']
  },
  handler: async (args: any) => sendIPCCommand('word_set_highlight', args)
}

export const wordSetStrikethroughTool: ToolDefinition = {
  name: 'word_set_strikethrough',
  description: '设置或取消文本删除线格式。常用于标记已删除或需要修改的内容。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      strikethrough: { type: 'boolean', description: 'Apply (true) or remove (false) strikethrough' },
      searchText: { type: 'string', description: 'Text to find and format' },
      paragraphIndex: { type: 'number', description: 'Zero-based index of paragraph to format' },
      startPosition: { type: 'number', description: 'Start position' },
      endPosition: { type: 'number', description: 'End position' }
    },
    required: ['strikethrough']
  },
  handler: async (args: any) => sendIPCCommand('word_set_strikethrough', args)
}

export const wordSetSubscriptTool: ToolDefinition = {
  name: 'word_set_subscript',
  description: '设置或取消下标格式。常用于化学式（如 H₂O）、数学公式等场景。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      subscript: { type: 'boolean', description: 'Apply (true) or remove (false) subscript' },
      searchText: { type: 'string', description: 'Text to find and format' },
      paragraphIndex: { type: 'number', description: 'Zero-based index of paragraph to format' },
      startPosition: { type: 'number', description: 'Start position' },
      endPosition: { type: 'number', description: 'End position' }
    },
    required: ['subscript']
  },
  handler: async (args: any) => sendIPCCommand('word_set_subscript', args)
}

export const wordSetSuperscriptTool: ToolDefinition = {
  name: 'word_set_superscript',
  description: '设置或取消上标格式。常用于数学幂次（如 x²）、脚注引用等场景。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      superscript: { type: 'boolean', description: 'Apply (true) or remove (false) superscript' },
      searchText: { type: 'string', description: 'Text to find and format' },
      paragraphIndex: { type: 'number', description: 'Zero-based index of paragraph to format' },
      startPosition: { type: 'number', description: 'Start position' },
      endPosition: { type: 'number', description: 'End position' }
    },
    required: ['superscript']
  },
  handler: async (args: any) => sendIPCCommand('word_set_superscript', args)
}
