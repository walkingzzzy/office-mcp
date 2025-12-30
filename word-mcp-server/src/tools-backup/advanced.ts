/**
 * Word Advanced Tools - Phase 4 Implementation
 * 
 * 目录和页码链接功能（根据 Microsoft 官方文档）：
 * 
 * API 版本要求：
 * - insertField: WordApi 1.5+（Windows/Mac 桌面版支持）
 * - Word.FieldType.toc: WordApi 1.5+
 * - TableOfContents.updatePageNumber(): WordApi BETA (Preview Only) - 需要 Office Insider
 * - fields 集合: WordApi 1.4+
 * 
 * 重要说明：
 * - Word on the web 对 field 主要是只读的
 * - TableOfContents API 目前是 Preview 功能，生产环境可能不可用
 * - 在不支持的环境中会降级到 OOXML 方案或提示手动操作
 * 
 * @see https://learn.microsoft.com/en-us/javascript/api/word
 * @see https://learn.microsoft.com/en-us/javascript/api/requirement-sets/word/word-api-requirement-sets
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

// Advanced Operations (4 tools)

export const wordInsertTocTool: ToolDefinition = {
  name: 'word_insert_toc',
  description: `插入目录（Table of Contents）。功能说明：
1. 自动检测文档中使用标题样式（Heading1-6 或 标题1-6）的段落
2. 生成带页码和超链接的目录列表
3. 点击目录条目可跳转到对应章节
4. 如用户要求在"第一页"或"开头"插入，使用 position="start"

API 说明（根据 Microsoft 官方文档）：
- 使用 insertField API（需要 WordApi 1.5+）
- Word 桌面版（Windows/Mac）支持完整功能
- Word Online 对域主要是只读的
- 如页码未自动显示，请按 F9 或右键选择"更新域"

注意：请确保文档中已设置标题样式，否则目录将为空。`,
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      position: { 
        type: 'string', 
        enum: ['cursor', 'start', 'end'], 
        default: 'cursor', 
        description: '插入位置：cursor=当前光标位置，start=文档开头（第一页），end=文档末尾' 
      },
      includePageNumbers: { 
        type: 'boolean', 
        default: true, 
        description: '是否在目录中显示页码' 
      },
      rightAlignPageNumbers: { 
        type: 'boolean', 
        default: true, 
        description: '页码是否右对齐（带前导符）' 
      },
      useHyperlinks: { 
        type: 'boolean', 
        default: true, 
        description: '是否为目录条目添加超链接（点击可跳转）' 
      },
      headingLevels: { 
        type: 'number', 
        minimum: 1, 
        maximum: 9, 
        default: 3, 
        description: '目录包含的标题级别（1-9），如 3 表示包含标题1、标题2、标题3' 
      }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_insert_toc', args)
}

export const wordUpdateTocTool: ToolDefinition = {
  name: 'word_update_toc',
  description: `更新目录的页码和内容。功能说明：
1. 当文档内容或页码发生变化后，需要更新目录
2. 自动刷新目录中的页码和超链接
3. 如有多个目录，可通过 tocIndex 指定更新哪一个

API 限制（根据 Microsoft 官方文档）：
- TableOfContents.updatePageNumber() 目前是 BETA (Preview Only) API
- 需要 Office Insider 版本才能通过 API 更新
- 普通版本请手动右键点击目录选择"更新域"，或按 F9 键`,
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      tocIndex: { 
        type: 'number', 
        description: '目录索引（从 0 开始），0 表示第一个目录', 
        default: 0 
      },
      updatePageNumbers: { 
        type: 'boolean', 
        default: true,
        description: '是否更新页码' 
      },
      updateEntireTable: { 
        type: 'boolean', 
        default: false,
        description: '是否更新整个目录（包括新增/删除的标题）' 
      }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_update_toc', args)
}

export const wordInsertPageBreakTool: ToolDefinition = {
  name: 'word_insert_page_break',
  description: '插入分页符',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      position: { type: 'string', enum: ['cursor', 'before', 'after'], default: 'cursor' }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_insert_page_break', args)
}

export const wordInsertSectionBreakTool: ToolDefinition = {
  name: 'word_insert_section_break',
  description: '插入分节符',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      breakType: { type: 'string', enum: ['nextPage', 'continuous', 'evenPage', 'oddPage'], default: 'nextPage' },
      position: { type: 'string', enum: ['cursor', 'before', 'after'], default: 'cursor' }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_insert_section_break', args)
}
