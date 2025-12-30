/**
 * word_content_control - 内容控件
 * 合并 6 个原工具：insert, get, setValue, getValue, delete, clear
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'insert', 'list', 'setValue', 'getValue', 'delete', 'clear'
] as const

type ContentControlAction = typeof SUPPORTED_ACTIONS[number]

export const wordContentControlTool: ToolDefinition = {
  name: 'word_content_control',
  description: `内容控件工具。支持的操作(action):
- insert: 插入内容控件 (需要 controlType, 可选 title/tag)
- list: 列出所有内容控件
- setValue: 设置控件值 (需要 controlId, value)
- getValue: 获取控件值 (需要 controlId)
- delete: 删除控件 (需要 controlId)
- clear: 清除控件内容 (需要 controlId)`,
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
      controlId: {
        type: 'string',
        description: '[多个操作] 控件 ID'
      },
      controlType: {
        type: 'string',
        enum: ['richText', 'plainText', 'picture', 'comboBox', 'dropDownList', 'datePicker', 'checkBox'],
        description: '[insert] 控件类型'
      },
      title: {
        type: 'string',
        description: '[insert] 控件标题'
      },
      tag: {
        type: 'string',
        description: '[insert] 控件标签'
      },
      value: {
        type: 'string',
        description: '[setValue] 控件值'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: ['内容控件', '表单', '文本框', '下拉列表', '日期选择器'],
    mergedTools: [
      'word_insert_content_control', 'word_get_content_controls',
      'word_set_content_control_value', 'word_get_content_control_value',
      'word_delete_content_control', 'word_clear_content_control'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<ContentControlAction, string> = {
      insert: 'word_insert_content_control',
      list: 'word_get_content_controls',
      setValue: 'word_set_content_control_value',
      getValue: 'word_get_content_control_value',
      delete: 'word_delete_content_control',
      clear: 'word_clear_content_control'
    }

    const command = commandMap[action as ContentControlAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '插入文本内容控件',
      input: { action: 'insert', controlType: 'plainText', title: '姓名' },
      output: { success: true, message: '成功插入内容控件', action: 'insert' }
    }
  ]
}
