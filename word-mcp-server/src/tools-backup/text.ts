/**
 * Word Text Tools - Phase 3 Implementation
 */

import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '@office-mcp/shared'

// Text Operations (10 tools)

export const wordInsertTextTool: ToolDefinition = {
  name: 'word_insert_text',
  description: '在指定位置插入文本',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Text to insert' },
      location: { type: 'string', enum: ['start', 'end', 'cursor'], default: 'cursor' },
      position: { type: 'number', description: 'Character position (if not using location)' }
    },
    required: ['text']
  },
  handler: async (args: any) => sendIPCCommand('word_insert_text', args)
}

export const wordReplaceTextTool: ToolDefinition = {
  name: 'word_replace_text',
  description: '用新文本替换指定文本',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      searchText: { type: 'string', description: 'Text to find' },
      replaceText: { type: 'string', description: 'Replacement text' },
      replaceAll: { type: 'boolean', default: false, description: 'Replace all occurrences' },
      matchCase: { type: 'boolean', default: false, description: 'Case sensitive search' }
    },
    required: ['searchText', 'replaceText']
  },
  handler: async (args: any) => sendIPCCommand('word_replace_text', args)
}

export const wordDeleteTextTool: ToolDefinition = {
  name: 'word_delete_text',
  description: '删除指定文本或文本范围',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      searchText: { type: 'string', description: 'Text to find and delete' },
      startPosition: { type: 'number', description: 'Start position for range deletion' },
      endPosition: { type: 'number', description: 'End position for range deletion' },
      deleteAll: { type: 'boolean', default: false, description: 'Delete all occurrences' }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_delete_text', args)
}

export const wordSearchTextTool: ToolDefinition = {
  name: 'word_search_text',
  description: '在文档中搜索文本',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      searchText: { type: 'string', description: 'Text to search for' },
      matchCase: { type: 'boolean', default: false, description: 'Case sensitive search' },
      wholeWords: { type: 'boolean', default: false, description: 'Match whole words only' }
    },
    required: ['searchText']
  },
  handler: async (args: any) => sendIPCCommand('word_search_text', args)
}

export const wordGetSelectedTextTool: ToolDefinition = {
  name: 'word_get_selected_text',
  description: '获取当前选中的文本',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      includeFormatting: { type: 'boolean', default: false, description: 'Include formatting info' }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_get_selected_text', args)
}

export const wordSelectTextRangeTool: ToolDefinition = {
  name: 'word_select_text_range',
  description: '通过位置或搜索选择文本范围',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      startPosition: { type: 'number', description: 'Start character position' },
      endPosition: { type: 'number', description: 'End character position' },
      searchText: { type: 'string', description: 'Text to find and select' }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_select_text_range', args)
}

export const wordClearFormattingTool: ToolDefinition = {
  name: 'word_clear_formatting',
  description: '清除选中文本或范围的格式',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      startPosition: { type: 'number', description: 'Start position' },
      endPosition: { type: 'number', description: 'End position' },
      clearAll: { type: 'boolean', default: true, description: 'Clear all formatting' }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_clear_formatting', args)
}

export const wordCopyTextTool: ToolDefinition = {
  name: 'word_copy_text',
  description: '复制文本到剪贴板',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      startPosition: { type: 'number', description: 'Start position' },
      endPosition: { type: 'number', description: 'End position' },
      searchText: { type: 'string', description: 'Text to find and copy' }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_copy_text', args)
}

export const wordCutTextTool: ToolDefinition = {
  name: 'word_cut_text',
  description: '剪切文本到剪贴板',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      startPosition: { type: 'number', description: 'Start position' },
      endPosition: { type: 'number', description: 'End position' },
      searchText: { type: 'string', description: 'Text to find and cut' }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_cut_text', args)
}

export const wordPasteTextTool: ToolDefinition = {
  name: 'word_paste_text',
  description: '从剪贴板粘贴文本',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      location: { type: 'string', enum: ['cursor', 'start', 'end'], default: 'cursor' },
      position: { type: 'number', description: 'Specific position to paste' },
      pasteFormat: { type: 'string', enum: ['keepSource', 'mergeFormatting', 'keepTextOnly'], default: 'keepSource' }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_paste_text', args)
}