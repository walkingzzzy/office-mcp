/**
 * ppt_hyperlink - 超链接操作
 * 合并 5 个原工具
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'addToShape', 'addToText', 'getAll', 'remove', 'update'
] as const

export const pptHyperlinkTool = createActionTool({
  name: 'ppt_hyperlink',
  description: `超链接操作工具。支持的操作(action):
- addToShape: 为形状添加超链接 (需要 slideIndex, shapeId, url)
- addToText: 为文本添加超链接 (需要 slideIndex, shapeId, textRange, url)
- getAll: 获取所有超链接 (可选 slideIndex)
- remove: 移除超链接 (需要 slideIndex, hyperlinkId)
- update: 更新超链接 (需要 slideIndex, hyperlinkId, url)`,
  category: 'hyperlink',
  application: 'powerpoint',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    addToShape: 'ppt_add_hyperlink_to_shape',
    addToText: 'ppt_add_hyperlink_to_text',
    getAll: 'ppt_get_hyperlinks',
    remove: 'ppt_remove_hyperlink',
    update: 'ppt_update_hyperlink'
  },
  paramRules: {
    addToShape: [required('slideIndex', 'number'), required('shapeId', 'string'), required('url', 'string')],
    addToText: [required('slideIndex', 'number'), required('shapeId', 'string'), required('textRange', 'object'), required('url', 'string')],
    remove: [required('slideIndex', 'number'), required('hyperlinkId', 'string')],
    update: [required('slideIndex', 'number'), required('hyperlinkId', 'string'), required('url', 'string')]
  },
  properties: {
    slideIndex: {
      type: 'number',
      description: '[多个操作] 幻灯片索引'
    },
    shapeId: {
      type: 'string',
      description: '[addToShape/addToText] 形状ID'
    },
    textRange: {
      type: 'object',
      description: '[addToText] 文本范围',
      properties: {
        start: { type: 'number' },
        end: { type: 'number' }
      }
    },
    url: {
      type: 'string',
      description: '[add*/update] 链接地址'
    },
    hyperlinkId: {
      type: 'string',
      description: '[remove/update] 超链接ID'
    }
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: ['超链接', '链接', '添加链接', '网址'],
    mergedTools: [
      'ppt_add_hyperlink_to_shape', 'ppt_add_hyperlink_to_text',
      'ppt_get_hyperlinks', 'ppt_remove_hyperlink', 'ppt_update_hyperlink'
    ]
  },
  examples: [
    {
      description: '为形状添加超链接',
      input: { action: 'addToShape', slideIndex: 1, shapeId: 'shape1', url: 'https://example.com' },
      output: { success: true, message: '成功添加超链接', action: 'addToShape' }
    }
  ]
})
