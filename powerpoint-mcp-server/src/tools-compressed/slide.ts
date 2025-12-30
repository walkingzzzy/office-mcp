/**
 * ppt_slide - 幻灯片管理
 * 合并 10 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'add', 'delete', 'duplicate', 'move', 'setLayout',
  'getCount', 'navigate', 'hide', 'unhide', 'setTransition'
] as const

type SlideAction = typeof SUPPORTED_ACTIONS[number]

export const pptSlideTool: ToolDefinition = {
  name: 'ppt_slide',
  description: `幻灯片管理工具。支持的操作(action):
- add: 添加幻灯片 (可选 layout, position)
- delete: 删除幻灯片 (需要 slideIndex)
- duplicate: 复制幻灯片 (需要 slideIndex)
- move: 移动幻灯片 (需要 fromIndex, toIndex)
- setLayout: 设置布局 (需要 slideIndex, layoutName)
- getCount: 获取幻灯片数量
- navigate: 导航到幻灯片 (需要 slideIndex)
- hide: 隐藏幻灯片 (需要 slideIndex)
- unhide: 显示幻灯片 (需要 slideIndex)
- setTransition: 设置切换效果 (需要 slideIndex, transition)`,
  category: 'slide',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      slideIndex: {
        type: 'number',
        description: '[多个操作] 幻灯片索引'
      },
      layout: {
        type: 'string',
        description: '[add] 布局类型'
      },
      position: {
        type: 'number',
        description: '[add] 插入位置'
      },
      fromIndex: {
        type: 'number',
        description: '[move] 源位置'
      },
      toIndex: {
        type: 'number',
        description: '[move] 目标位置'
      },
      layoutName: {
        type: 'string',
        description: '[setLayout] 布局名称'
      },
      transition: {
        type: 'object',
        description: '[setTransition] 切换效果设置',
        properties: {
          type: { type: 'string', enum: ['none', 'fade', 'push', 'wipe', 'split', 'reveal', 'random'] },
          duration: { type: 'number' },
          advanceOnClick: { type: 'boolean' },
          advanceAfterTime: { type: 'number' }
        }
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: [
      '幻灯片', '添加幻灯片', '删除幻灯片', '复制幻灯片',
      '移动幻灯片', '布局', '切换效果', '隐藏'
    ],
    mergedTools: [
      'ppt_add_slide', 'ppt_delete_slide', 'ppt_duplicate_slide',
      'ppt_move_slide', 'ppt_set_slide_layout', 'ppt_get_slide_count',
      'ppt_navigate_to_slide', 'ppt_hide_slide', 'ppt_unhide_slide',
      'ppt_set_slide_transition'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<SlideAction, string> = {
      add: 'ppt_add_slide',
      delete: 'ppt_delete_slide',
      duplicate: 'ppt_duplicate_slide',
      move: 'ppt_move_slide',
      setLayout: 'ppt_set_slide_layout',
      getCount: 'ppt_get_slide_count',
      navigate: 'ppt_navigate_to_slide',
      hide: 'ppt_hide_slide',
      unhide: 'ppt_unhide_slide',
      setTransition: 'ppt_set_slide_transition'
    }

    const command = commandMap[action as SlideAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '添加幻灯片',
      input: { action: 'add', layout: 'Title and Content', position: 2 },
      output: { success: true, message: '成功添加幻灯片', action: 'add' }
    }
  ]
}
