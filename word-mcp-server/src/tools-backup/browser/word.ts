/**
 * Word Browser Tools
 *
 * 这些工具通过 IPC 调用浏览器端的 Office.js API
 * 对应 MCPToolExecutor 中的 Word 工具
 */

import type { ToolDefinition } from '../types.js'
import { getBrowserToolExecutor } from './BrowserToolExecutor.js'

/**
 * Word - 添加段落 (浏览器端)
 */
export const wordAddParagraphBrowserTool: ToolDefinition = {
  name: 'word_add_paragraph_browser',
  description: 'Add a paragraph to Word document at specified location (browser execution)',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text content of the paragraph'
      },
      location: {
        type: 'string',
        enum: ['start', 'end'],
        description: 'Insert location (start or end of document)',
        default: 'end'
      },
      style: {
        type: 'string',
        description: 'Paragraph style name (optional, e.g., "Heading 1", "Normal")'
      }
    },
    required: ['text']
  },
  handler: async (args) => {
    const executor = getBrowserToolExecutor()
    return await executor.executeBrowserTool('word_add_paragraph', args)
  }
}

/**
 * Word - 格式化文本 (浏览器端)
 */
export const wordFormatTextBrowserTool: ToolDefinition = {
  name: 'word_format_text_browser',
  description:
    'Format text in Word document by searching for text and applying formatting (bold, italic, color, fontSize, underline) (browser execution)',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      searchText: {
        type: 'string',
        description: 'Text to search and format in the document'
      },
      bold: {
        type: 'boolean',
        description: 'Apply bold formatting (true/false)'
      },
      italic: {
        type: 'boolean',
        description: 'Apply italic formatting (true/false)'
      },
      fontSize: {
        type: 'number',
        description: 'Font size in points (e.g., 12, 14, 16)'
      },
      color: {
        type: 'string',
        description: 'Font color in hex format (e.g., "#FF0000" for red, "#0000FF" for blue)'
      },
      underline: {
        type: 'boolean',
        description: 'Apply underline formatting (true/false)'
      }
    },
    required: ['searchText']
  },
  handler: async (args) => {
    const executor = getBrowserToolExecutor()
    return await executor.executeBrowserTool('word_format_text', args)
  }
}

/**
 * Word - 插入表格 (浏览器端)
 */
export const wordInsertTableBrowserTool: ToolDefinition = {
  name: 'word_insert_table_browser',
  description: 'Insert a table into Word document with specified rows and columns (browser execution). Supports inputs like "4x3 table" or "4 rows 3 columns".',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      rows: {
        type: 'number',
        description: 'Number of rows (must be >= 1)'
      },
      columns: {
        type: 'number',
        description: 'Number of columns (must be >= 1)'
      },
      location: {
        type: 'string',
        enum: ['start', 'end'],
        description: 'Insert location (start or end of document)',
        default: 'end'
      },
      data: {
        type: 'array',
        description:
          'Table data as 2D array (optional). If provided, must match rows × columns dimensions. Example: [["A1", "B1"], ["A2", "B2"]]',
        items: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      }
    },
    required: ['rows', 'columns']
  },
  handler: async (args) => {
    const executor = getBrowserToolExecutor()
    return await executor.executeBrowserTool('word_insert_table', args)
  }
}

/**
 * 获取所有 Word 浏览器工具
 */
export function getWordBrowserTools(): ToolDefinition[] {
  return [wordAddParagraphBrowserTool, wordFormatTextBrowserTool, wordInsertTableBrowserTool]
}
