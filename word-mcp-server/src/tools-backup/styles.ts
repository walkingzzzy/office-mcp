/**
 * Word Style Tools - Phase 3 Implementation
 */

import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '@office-mcp/shared'

// Style Operations (10 tools)

export const wordApplyStyleTool: ToolDefinition = {
  name: 'word_apply_style',
  description: '将预定义样式应用于文本或段落',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      styleName: { type: 'string', description: 'Style name (e.g., "Heading 1", "Normal", "Title")' },
      searchText: { type: 'string', description: 'Text to find and apply style' },
      paragraphIndex: { type: 'number', description: 'Paragraph index to apply style' },
      startPosition: { type: 'number', description: 'Start position' },
      endPosition: { type: 'number', description: 'End position' }
    },
    required: ['styleName']
  },
  handler: async (args: any) => sendIPCCommand('word_apply_style', args)
}

export const wordCreateStyleTool: ToolDefinition = {
  name: 'word_create_style',
  description: '创建新的自定义样式',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      styleName: { type: 'string', description: 'New style name' },
      styleType: { type: 'string', enum: ['paragraph', 'character'], default: 'paragraph' },
      fontName: { type: 'string', description: 'Font family' },
      fontSize: { type: 'number', description: 'Font size in points' },
      bold: { type: 'boolean', description: 'Bold formatting' },
      italic: { type: 'boolean', description: 'Italic formatting' },
      color: { type: 'string', description: 'Font color (hex format)' }
    },
    required: ['styleName']
  },
  handler: async (args: any) => sendIPCCommand('word_create_style', args)
}

export const wordListStylesTool: ToolDefinition = {
  name: 'word_list_styles',
  description: '获取文档中可用样式的列表',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      styleType: { type: 'string', enum: ['all', 'paragraph', 'character'], default: 'all' },
      builtInOnly: { type: 'boolean', default: false, description: 'Show only built-in styles' }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_list_styles', args)
}

export const wordSetHeadingTool: ToolDefinition = {
  name: 'word_set_heading',
  description: '设置标题样式 (H1-H6)。注意：Word 的标题样式是段落级别的，会应用到整个段落而非仅选中的文字。当用户选中文字或说"这段文字"时，直接调用此工具，只需提供 level 参数。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      level: { type: 'number', minimum: 1, maximum: 6, description: '标题级别 (1-6)，1 表示一级标题，2 表示二级标题，以此类推' },
      searchText: { type: 'string', description: '（可选）要转换为标题的文本，如不提供则使用当前选区' },
      paragraphIndex: { type: 'number', description: '（可选）段落索引，如不提供则使用当前选区' },
      fontName: { type: 'string', description: '（可选）设置标题后应用的字体名称' }
    },
    required: ['level']
  },
  handler: async (args: any) => sendIPCCommand('word_set_heading', args)
}

export const wordApplyListStyleTool: ToolDefinition = {
  name: 'word_apply_list_style',
  description: '应用列表格式（项目符号或编号）',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      listType: { type: 'string', enum: ['bullet', 'number', 'none'], description: 'List type' },
      listStyle: { type: 'string', description: 'List style name (e.g., "1. 2. 3.", "• ◦ ▪")' },
      startIndex: { type: 'number', description: 'Start paragraph index' },
      endIndex: { type: 'number', description: 'End paragraph index' }
    },
    required: ['listType']
  },
  handler: async (args: any) => sendIPCCommand('word_apply_list_style', args)
}

export const wordSetLineSpacingTool: ToolDefinition = {
  name: 'word_set_line_spacing',
  description: '设置行距。全文设置行距时，只需提供 spacing 参数即可，不要传其他参数。1.0=单倍行距，1.5=1.5倍行距，2.0=双倍行距。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      spacing: { type: 'number', description: '行距倍数 (1.0=单倍, 1.5=1.5倍, 2.0=双倍)' },
      paragraphIndex: { type: 'number', description: '（可选）单个段落索引。不提供时会应用到选区或全文' },
      startIndex: { type: 'number', description: '（可选）范围起始段落索引' },
      endIndex: { type: 'number', description: '（可选）范围结束段落索引，-1 表示到最后' }
    },
    required: ['spacing']
  },
  handler: async (args: any) => sendIPCCommand('word_set_line_spacing', args)
}

export const wordSetBackgroundColorTool: ToolDefinition = {
  name: 'word_set_background_color',
  description: '设置文本或段落的背景颜色',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      backgroundColor: { type: 'string', description: 'Background color (hex format or "none")' },
      searchText: { type: 'string', description: 'Text to apply background color' },
      paragraphIndex: { type: 'number', description: 'Paragraph index' },
      startPosition: { type: 'number', description: 'Start position' },
      endPosition: { type: 'number', description: 'End position' }
    },
    required: ['backgroundColor']
  },
  handler: async (args: any) => sendIPCCommand('word_set_background_color', args)
}

export const wordApplyThemeTool: ToolDefinition = {
  name: 'word_apply_theme',
  description: '应用文档主题',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      themeName: { type: 'string', description: 'Theme name (e.g., "Office", "Facet", "Ion")' },
      colorScheme: { type: 'string', description: 'Color scheme name' },
      fontScheme: { type: 'string', description: 'Font scheme name' }
    },
    required: ['themeName']
  },
  handler: async (args: any) => sendIPCCommand('word_apply_theme', args)
}

export const wordResetStyleTool: ToolDefinition = {
  name: 'word_reset_style',
  description: '将文本重置为默认样式（正文）',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      searchText: { type: 'string', description: 'Text to reset style' },
      paragraphIndex: { type: 'number', description: 'Paragraph index to reset' },
      startPosition: { type: 'number', description: 'Start position' },
      endPosition: { type: 'number', description: 'End position' },
      resetAll: { type: 'boolean', default: false, description: 'Reset entire document' }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_reset_style', args)
}

export const wordCopyFormatTool: ToolDefinition = {
  name: 'word_copy_format',
  description: '从一个文本复制格式到另一个文本（格式刷）',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      sourceText: { type: 'string', description: 'Source text to copy format from' },
      targetText: { type: 'string', description: 'Target text to apply format to' },
      sourceStart: { type: 'number', description: 'Source start position' },
      sourceEnd: { type: 'number', description: 'Source end position' },
      targetStart: { type: 'number', description: 'Target start position' },
      targetEnd: { type: 'number', description: 'Target end position' }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_copy_format', args)
}