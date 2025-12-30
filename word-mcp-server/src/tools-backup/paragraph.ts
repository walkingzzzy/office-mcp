/**
 * Word Paragraph Tools - Phase 3 Implementation
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

// Paragraph Operations (10 tools)

export const wordAddParagraphTool: ToolDefinition = {
  name: 'word_add_paragraph',
  description: '向 Word 文档添加段落',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'The text content of the paragraph' },
      location: { type: 'string', enum: ['start', 'end'], default: 'end' }
    },
    required: ['text']
  },
  handler: async (args: any) => sendIPCCommand('word_add_paragraph', args)
}

export const wordInsertParagraphAtTool: ToolDefinition = {
  name: 'word_insert_paragraph_at',
  description: '在指定位置插入段落',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Paragraph text' },
      position: { type: 'number', description: 'Character position' }
    },
    required: ['text', 'position']
  },
  handler: async (args: any) => sendIPCCommand('word_insert_paragraph_at', args)
}

export const wordDeleteParagraphTool: ToolDefinition = {
  name: 'word_delete_paragraph',
  description: '按索引删除段落',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      index: { type: 'number', description: 'Paragraph index (0-based)' }
    },
    required: ['index']
  },
  handler: async (args: any) => sendIPCCommand('word_delete_paragraph', args)
}

export const wordGetParagraphsTool: ToolDefinition = {
  name: 'word_get_paragraphs',
  description: '获取所有段落。不要仅为了识别段落进行格式化而使用此工具。请直接使用格式化工具（如 word_set_font_color）并传入 paragraphIndex 参数。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async (args: any) => sendIPCCommand('word_get_paragraphs', args)
}

export const wordSetParagraphSpacingTool: ToolDefinition = {
  name: 'word_set_paragraph_spacing',
  description: '设置段落间距（段前/段后）',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      index: { type: 'number', description: 'Paragraph index' },
      spaceBefore: { type: 'number', description: 'Space before paragraph (points)' },
      spaceAfter: { type: 'number', description: 'Space after paragraph (points)' }
    },
    required: ['index']
  },
  handler: async (args: any) => sendIPCCommand('word_set_paragraph_spacing', args)
}

export const wordSetParagraphAlignmentTool: ToolDefinition = {
  name: 'word_set_paragraph_alignment',
  description: '设置段落对齐方式',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      index: { type: 'number', description: 'Paragraph index' },
      alignment: { type: 'string', enum: ['left', 'center', 'right', 'justify'] }
    },
    required: ['index', 'alignment']
  },
  handler: async (args: any) => sendIPCCommand('word_set_paragraph_alignment', args)
}

export const wordSetParagraphIndentTool: ToolDefinition = {
  name: 'word_set_paragraph_indent',
  description: '设置段落缩进',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      index: { type: 'number', description: 'Paragraph index' },
      leftIndent: { type: 'number', description: 'Left indent (points)' },
      rightIndent: { type: 'number', description: 'Right indent (points)' },
      firstLineIndent: { type: 'number', description: 'First line indent (points)' }
    },
    required: ['index']
  },
  handler: async (args: any) => sendIPCCommand('word_set_paragraph_indent', args)
}

export const wordMergeParagraphsTool: ToolDefinition = {
  name: 'word_merge_paragraphs',
  description: '将多个段落合并为一个',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      startIndex: { type: 'number', description: 'Start paragraph index' },
      endIndex: { type: 'number', description: 'End paragraph index' },
      separator: { type: 'string', default: ' ', description: 'Text separator between merged paragraphs' }
    },
    required: ['startIndex', 'endIndex']
  },
  handler: async (args: any) => sendIPCCommand('word_merge_paragraphs', args)
}

export const wordSplitParagraphTool: ToolDefinition = {
  name: 'word_split_paragraph',
  description: '在指定位置拆分段落',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      index: { type: 'number', description: 'Paragraph index' },
      position: { type: 'number', description: 'Character position within paragraph to split' }
    },
    required: ['index', 'position']
  },
  handler: async (args: any) => sendIPCCommand('word_split_paragraph', args)
}

export const wordMoveParagraphTool: ToolDefinition = {
  name: 'word_move_paragraph',
  description: '将段落移动到不同位置',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      fromIndex: { type: 'number', description: 'Source paragraph index' },
      toIndex: { type: 'number', description: 'Target paragraph index' }
    },
    required: ['fromIndex', 'toIndex']
  },
  handler: async (args: any) => sendIPCCommand('word_move_paragraph', args)
}
