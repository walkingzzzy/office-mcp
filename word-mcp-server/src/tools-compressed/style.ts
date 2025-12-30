/**
 * word_style - 样式管理
 * 合并 10 个原工具：apply, create, list, setHeading,
 * applyList, setLineSpacing, setBackgroundColor, applyTheme, reset, copyFormat
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'apply', 'create', 'list', 'setHeading',
  'applyList', 'setLineSpacing', 'setBackgroundColor',
  'applyTheme', 'reset', 'copyFormat'
] as const

type StyleAction = typeof SUPPORTED_ACTIONS[number]

export const wordStyleTool: ToolDefinition = {
  name: 'word_style',
  description: `样式管理工具。支持的操作(action):
- apply: 应用样式 (需要 styleName, 可选 paragraphIndex)
- create: 创建样式 (需要 styleName, 可选 basedOn/font/paragraph)
- list: 列出所有样式
- setHeading: 设置标题级别 (需要 level, 可选 paragraphIndex)
- applyList: 应用列表样式 (需要 listType, 可选 paragraphIndex)
- setLineSpacing: 设置行间距 (需要 spacing, 可选 paragraphIndex)
- setBackgroundColor: 设置背景色 (需要 color)
- applyTheme: 应用主题 (需要 themeName)
- reset: 重置样式 (可选 paragraphIndex)
- copyFormat: 复制格式 (需要 sourceRange, targetRange)`,
  category: 'style',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      // 通用参数
      paragraphIndex: {
        type: 'number',
        description: '[多个操作] 段落索引'
      },
      // apply 参数
      styleName: {
        type: 'string',
        description: '[apply/create] 样式名称'
      },
      // create 参数
      basedOn: {
        type: 'string',
        description: '[create] 基于的样式'
      },
      font: {
        type: 'object',
        description: '[create] 字体设置',
        properties: {
          name: { type: 'string' },
          size: { type: 'number' },
          color: { type: 'string' },
          bold: { type: 'boolean' },
          italic: { type: 'boolean' }
        }
      },
      paragraph: {
        type: 'object',
        description: '[create] 段落设置',
        properties: {
          alignment: { type: 'string', enum: ['left', 'center', 'right', 'justify'] },
          lineSpacing: { type: 'number' },
          spaceBefore: { type: 'number' },
          spaceAfter: { type: 'number' }
        }
      },
      // setHeading 参数
      level: {
        type: 'number',
        description: '[setHeading] 标题级别（1-9）',
        minimum: 1,
        maximum: 9
      },
      // applyList 参数
      listType: {
        type: 'string',
        enum: ['bullet', 'number', 'multilevel'],
        description: '[applyList] 列表类型'
      },
      listStyle: {
        type: 'string',
        description: '[applyList] 列表样式（如 "1.", "a)", "•"）'
      },
      // setLineSpacing 参数
      spacing: {
        type: 'number',
        description: '[setLineSpacing] 行间距（倍数，如 1.5）'
      },
      spacingRule: {
        type: 'string',
        enum: ['auto', 'exactly', 'atLeast'],
        description: '[setLineSpacing] 间距规则',
        default: 'auto'
      },
      // setBackgroundColor 参数
      color: {
        type: 'string',
        description: '[setBackgroundColor] 背景颜色（十六进制）'
      },
      // applyTheme 参数
      themeName: {
        type: 'string',
        description: '[applyTheme] 主题名称'
      },
      // copyFormat 参数
      sourceRange: {
        type: 'object',
        description: '[copyFormat] 源范围',
        properties: {
          start: { type: 'number' },
          end: { type: 'number' }
        }
      },
      targetRange: {
        type: 'object',
        description: '[copyFormat] 目标范围',
        properties: {
          start: { type: 'number' },
          end: { type: 'number' }
        }
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: [
      '样式', '标题', '列表', '项目符号', '编号',
      '行间距', '主题', '格式刷', '背景色'
    ],
    applicableFor: ['text'],
    mergedTools: [
      'word_apply_style', 'word_create_style', 'word_list_styles',
      'word_set_heading', 'word_apply_list_style', 'word_set_line_spacing',
      'word_set_background_color', 'word_apply_theme', 'word_reset_style',
      'word_copy_format'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    // 根据 action 映射到原始命令
    const commandMap: Record<StyleAction, string> = {
      apply: 'word_apply_style',
      create: 'word_create_style',
      list: 'word_list_styles',
      setHeading: 'word_set_heading',
      applyList: 'word_apply_list_style',
      setLineSpacing: 'word_set_line_spacing',
      setBackgroundColor: 'word_set_background_color',
      applyTheme: 'word_apply_theme',
      reset: 'word_reset_style',
      copyFormat: 'word_copy_format'
    }

    const command = commandMap[action as StyleAction]
    const result = await sendIPCCommand(command, params)

    return {
      ...result,
      action
    }
  },
  examples: [
    {
      description: '应用标题1样式',
      input: { action: 'setHeading', level: 1, paragraphIndex: 0 },
      output: { success: true, message: '成功设置标题级别', action: 'setHeading' }
    },
    {
      description: '应用项目符号列表',
      input: { action: 'applyList', listType: 'bullet', paragraphIndex: 0 },
      output: { success: true, message: '成功应用列表样式', action: 'applyList' }
    },
    {
      description: '设置行间距为1.5倍',
      input: { action: 'setLineSpacing', spacing: 1.5 },
      output: { success: true, message: '成功设置行间距', action: 'setLineSpacing' }
    }
  ]
}
