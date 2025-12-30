/**
 * Word Read Tools - 读取操作工具
 * 补全插件端独有的工具到 MCP Server
 */

import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '@office-mcp/shared'

/**
 * 读取文档内容
 */
export const wordReadDocumentTool: ToolDefinition = {
  name: 'word_read_document',
  description: '读取整个文档内容，包括文本和段落信息。可选择是否包含格式信息，可限制返回段落数量。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      includeFormatting: { 
        type: 'boolean', 
        default: false, 
        description: 'Include formatting information for each paragraph' 
      },
      maxParagraphs: { 
        type: 'number', 
        description: 'Maximum number of paragraphs to return (default: all)' 
      }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_read_document', args)
}

/**
 * 检测选区类型
 */
export const wordDetectSelectionTypeTool: ToolDefinition = {
  name: 'word_detect_selection_type',
  description: '检测当前选区的类型。返回文本、图片、表格或无选区等类型信息。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async (args: any) => sendIPCCommand('word_detect_selection_type', args)
}

/**
 * 检查文档是否包含图片
 */
export const wordCheckDocumentHasImagesTool: ToolDefinition = {
  name: 'word_check_document_has_images',
  description: '检查文档中是否包含图片。返回图片存在状态。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async (args: any) => sendIPCCommand('word_check_document_has_images', args)
}

/**
 * 检查文档是否包含表格
 */
export const wordCheckDocumentHasTablesTool: ToolDefinition = {
  name: 'word_check_document_has_tables',
  description: '检查文档中是否包含表格。返回表格存在状态。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async (args: any) => sendIPCCommand('word_check_document_has_tables', args)
}

/**
 * 获取文档中的图片列表
 */
export const wordGetImagesTool: ToolDefinition = {
  name: 'word_get_images',
  description: '获取文档中所有图片的列表及其属性。可选择是否包含 Base64 编码的图片数据。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      includeBase64: {
        type: 'boolean',
        default: false,
        description: 'Include base64 encoded image data'
      }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_get_images', args)
}

/**
 * 格式化文本
 */
export const wordFormatTextTool: ToolDefinition = {
  name: 'word_format_text',
  description: '使用指定样式格式化文本。支持加粗、斜体、下划线、颜色、字号、字体名称、高亮等多种格式设置。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      searchText: {
        type: 'string',
        description: 'Text to find and format'
      },
      bold: {
        type: 'boolean',
        description: 'Apply bold formatting'
      },
      italic: {
        type: 'boolean',
        description: 'Apply italic formatting'
      },
      underline: {
        type: 'boolean',
        description: 'Apply underline formatting'
      },
      color: {
        type: 'string',
        description: 'Font color (e.g., "red", "#FF0000")'
      },
      fontSize: {
        type: 'number',
        description: 'Font size in points'
      },
      fontName: {
        type: 'string',
        description: 'Font family name'
      },
      highlight: {
        type: 'string',
        description: 'Highlight color'
      }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_format_text', args)
}

/**
 * 设置字体名称
 */
export const wordSetFontNameTool: ToolDefinition = {
  name: 'word_set_font_name',
  description: '设置选中文本或指定范围的字体名称。如"Arial"、"Times New Roman"、"宋体"等。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      fontName: {
        type: 'string',
        description: 'Font family name (e.g., "Arial", "Times New Roman", "宋体")'
      },
      searchText: {
        type: 'string',
        description: 'Text to find and apply font (optional, uses selection if not provided)'
      }
    },
    required: ['fontName']
  },
  handler: async (args: any) => sendIPCCommand('word_set_font_name', args)
}
