/**
 * word_content_control - 内容控件
 * 合并 6 个原工具：insert, get, setValue, getValue, delete, clear
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'insert', 'list', 'setValue', 'getValue', 'delete', 'clear'
] as const

export const wordContentControlTool = createActionTool({
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
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    insert: 'word_insert_content_control',
    list: 'word_get_content_controls',
    setValue: 'word_set_content_control_value',
    getValue: 'word_get_content_control_value',
    delete: 'word_delete_content_control',
    clear: 'word_clear_content_control'
  },
  paramRules: {
    insert: [required('controlType', 'string')],
    setValue: [required('controlId', 'string'), required('value', 'string')],
    getValue: [required('controlId', 'string')],
    delete: [required('controlId', 'string')],
    clear: [required('controlId', 'string')]
  },
  properties: {
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
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: ['内容控件', '表单', '文本框', '下拉列表', '日期选择器'],
    mergedTools: [
      'word_insert_content_control', 'word_get_content_controls',
      'word_set_content_control_value', 'word_get_content_control_value',
      'word_delete_content_control', 'word_clear_content_control'
    ]
  },
  examples: [
    {
      description: '插入文本内容控件',
      input: { action: 'insert', controlType: 'plainText', title: '姓名' },
      output: { success: true, message: '成功插入内容控件', action: 'insert' }
    }
  ]
})
