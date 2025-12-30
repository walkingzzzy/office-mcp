/**
 * word_paragraph - 段落管理
 * 合并 10 个原工具：add, insertAt, delete, get,
 * setSpacing, setAlignment, setIndent, merge, split, move
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'add', 'insertAt', 'delete', 'get',
  'setSpacing', 'setAlignment', 'setIndent',
  'merge', 'split', 'move'
] as const

type ParagraphAction = typeof SUPPORTED_ACTIONS[number]

export const wordParagraphTool: ToolDefinition = {
  name: 'word_paragraph',
  description: `段落管理工具。支持的操作(action):
- add: 添加段落 (需要 text)
- insertAt: 在指定位置插入段落 (需要 index, text)
- delete: 删除段落 (需要 index)
- get: 获取段落列表
- setSpacing: 设置段落间距 (需要 index, 可选 spaceBefore/spaceAfter/lineSpacing)
- setAlignment: 设置对齐方式 (需要 index, alignment)
- setIndent: 设置缩进 (需要 index, 可选 leftIndent/rightIndent/firstLineIndent)
- merge: 合并段落 (需要 startIndex, endIndex)
- split: 拆分段落 (需要 index, position)
- move: 移动段落 (需要 fromIndex, toIndex)`,
  category: 'paragraph',
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
      index: {
        type: 'number',
        description: '[多个操作] 段落索引（从0开始）'
      },
      text: {
        type: 'string',
        description: '[add/insertAt] 段落文本'
      },
      // setSpacing 参数
      spaceBefore: {
        type: 'number',
        description: '[setSpacing] 段前间距（磅）'
      },
      spaceAfter: {
        type: 'number',
        description: '[setSpacing] 段后间距（磅）'
      },
      lineSpacing: {
        type: 'number',
        description: '[setSpacing] 行间距（倍数，如 1.5）'
      },
      // setAlignment 参数
      alignment: {
        type: 'string',
        enum: ['left', 'center', 'right', 'justify'],
        description: '[setAlignment] 对齐方式'
      },
      // setIndent 参数
      leftIndent: {
        type: 'number',
        description: '[setIndent] 左缩进（磅）'
      },
      rightIndent: {
        type: 'number',
        description: '[setIndent] 右缩进（磅）'
      },
      firstLineIndent: {
        type: 'number',
        description: '[setIndent] 首行缩进（磅）'
      },
      // merge 参数
      startIndex: {
        type: 'number',
        description: '[merge] 起始段落索引'
      },
      endIndex: {
        type: 'number',
        description: '[merge] 结束段落索引'
      },
      // split 参数
      position: {
        type: 'number',
        description: '[split] 拆分位置（字符位置）'
      },
      // move 参数
      fromIndex: {
        type: 'number',
        description: '[move] 源段落索引'
      },
      toIndex: {
        type: 'number',
        description: '[move] 目标位置索引'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: [
      '段落', '添加段落', '删除段落', '段落间距',
      '对齐', '缩进', '首行缩进', '合并段落', '拆分段落'
    ],
    applicableFor: ['text'],
    mergedTools: [
      'word_add_paragraph', 'word_insert_paragraph_at', 'word_delete_paragraph',
      'word_get_paragraphs', 'word_set_paragraph_spacing', 'word_set_paragraph_alignment',
      'word_set_paragraph_indent', 'word_merge_paragraphs', 'word_split_paragraph',
      'word_move_paragraph'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    // 根据 action 映射到原始命令
    const commandMap: Record<ParagraphAction, string> = {
      add: 'word_add_paragraph',
      insertAt: 'word_insert_paragraph_at',
      delete: 'word_delete_paragraph',
      get: 'word_get_paragraphs',
      setSpacing: 'word_set_paragraph_spacing',
      setAlignment: 'word_set_paragraph_alignment',
      setIndent: 'word_set_paragraph_indent',
      merge: 'word_merge_paragraphs',
      split: 'word_split_paragraph',
      move: 'word_move_paragraph'
    }

    const command = commandMap[action as ParagraphAction]
    const result = await sendIPCCommand(command, params)

    return {
      ...result,
      action
    }
  },
  examples: [
    {
      description: '添加新段落',
      input: { action: 'add', text: '这是一个新段落。' },
      output: { success: true, message: '成功添加段落', action: 'add' }
    },
    {
      description: '设置段落居中对齐',
      input: { action: 'setAlignment', index: 0, alignment: 'center' },
      output: { success: true, message: '成功设置对齐方式', action: 'setAlignment' }
    },
    {
      description: '设置首行缩进',
      input: { action: 'setIndent', index: 0, firstLineIndent: 24 },
      output: { success: true, message: '成功设置缩进', action: 'setIndent' }
    }
  ]
}
