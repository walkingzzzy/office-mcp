/**
 * word_read - 文档内容读取
 * 合并 7 个原工具：readDocument, detectSelectionType, checkHasImages,
 * checkHasTables, getImages, formatText, setFontName
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'read', 'detectSelection', 'hasImages',
  'hasTables', 'getImages', 'formatText', 'setFontName'
] as const

type ReadAction = typeof SUPPORTED_ACTIONS[number]

export const wordReadTool: ToolDefinition = {
  name: 'word_read',
  description: `文档内容读取工具。支持的操作(action):
- read: 读取文档内容 (可选 includeFormatting)
- detectSelection: 检测选中内容类型
- hasImages: 检查文档是否包含图片
- hasTables: 检查文档是否包含表格
- getImages: 获取文档中的图片列表
- formatText: 格式化文本 (需要 text, format)
- setFontName: 设置字体名称 (需要 fontName)`,
  category: 'document',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      includeFormatting: {
        type: 'boolean',
        description: '[read] 包含格式信息',
        default: false
      },
      text: {
        type: 'string',
        description: '[formatText] 要格式化的文本'
      },
      format: {
        type: 'object',
        description: '[formatText] 格式设置'
      },
      fontName: {
        type: 'string',
        description: '[setFontName] 字体名称'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: ['读取', '获取内容', '检测', '图片', '表格'],
    mergedTools: [
      'word_read_document', 'word_detect_selection_type',
      'word_check_document_has_images', 'word_check_document_has_tables',
      'word_get_images', 'word_format_text', 'word_set_font_name'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<ReadAction, string> = {
      read: 'word_read_document',
      detectSelection: 'word_detect_selection_type',
      hasImages: 'word_check_document_has_images',
      hasTables: 'word_check_document_has_tables',
      getImages: 'word_get_images',
      formatText: 'word_format_text',
      setFontName: 'word_set_font_name'
    }

    const command = commandMap[action as ReadAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '读取文档内容',
      input: { action: 'read', includeFormatting: false },
      output: { success: true, action: 'read', data: { content: '文档内容...' } }
    },
    {
      description: '检查是否有表格',
      input: { action: 'hasTables' },
      output: { success: true, action: 'hasTables', data: { hasTables: true, count: 2 } }
    }
  ]
}
