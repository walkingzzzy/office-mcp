/**
 * ppt_animation - 动画与放映
 * 合并 8 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'add', 'remove', 'setTiming', 'setTrigger',
  'preview', 'setSlideTiming', 'startShow', 'endShow'
] as const

type AnimationAction = typeof SUPPORTED_ACTIONS[number]

export const pptAnimationTool: ToolDefinition = {
  name: 'ppt_animation',
  description: `动画与放映工具。支持的操作(action):
- add: 添加动画 (需要 slideIndex, shapeId, animationType, effect)
- remove: 移除动画 (需要 slideIndex, animationId)
- setTiming: 设置动画时间 (需要 slideIndex, animationId, timing)
- setTrigger: 设置触发方式 (需要 slideIndex, animationId, trigger)
- preview: 预览动画 (需要 slideIndex)
- setSlideTiming: 设置幻灯片计时 (需要 slideIndex, slideTiming)
- startShow: 开始放映 (可选 startFrom)
- endShow: 结束放映`,
  category: 'animation',
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
      shapeId: {
        type: 'string',
        description: '[add] 形状ID'
      },
      animationId: {
        type: 'string',
        description: '[remove/setTiming/setTrigger] 动画ID'
      },
      animationType: {
        type: 'string',
        enum: ['entrance', 'emphasis', 'exit', 'motionPath'],
        description: '[add] 动画类型'
      },
      effect: {
        type: 'string',
        enum: ['appear', 'fade', 'fly', 'float', 'split', 'wipe', 'zoom', 'bounce'],
        description: '[add] 动画效果'
      },
      timing: {
        type: 'object',
        description: '[setTiming] 时间设置',
        properties: {
          duration: { type: 'number' },
          delay: { type: 'number' },
          repeat: { type: ['number', 'string'] }
        }
      },
      trigger: {
        type: 'string',
        enum: ['onClick', 'withPrevious', 'afterPrevious'],
        description: '[setTrigger] 触发方式'
      },
      slideTiming: {
        type: 'object',
        description: '[setSlideTiming] 幻灯片计时',
        properties: {
          advanceOnClick: { type: 'boolean' },
          advanceAfterTime: { type: 'number' }
        }
      },
      startFrom: {
        type: ['number', 'string'],
        description: '[startShow] 开始位置 (数字或 beginning/current)'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: [
      '动画', '添加动画', '删除动画', '动画效果',
      '放映', '开始放映', '结束放映', '预览'
    ],
    mergedTools: [
      'ppt_add_animation', 'ppt_remove_animation',
      'ppt_set_animation_timing', 'ppt_set_animation_trigger',
      'ppt_preview_animation', 'ppt_set_slide_timing',
      'ppt_start_slideshow', 'ppt_end_slideshow'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<AnimationAction, string> = {
      add: 'ppt_add_animation',
      remove: 'ppt_remove_animation',
      setTiming: 'ppt_set_animation_timing',
      setTrigger: 'ppt_set_animation_trigger',
      preview: 'ppt_preview_animation',
      setSlideTiming: 'ppt_set_slide_timing',
      startShow: 'ppt_start_slideshow',
      endShow: 'ppt_end_slideshow'
    }

    const command = commandMap[action as AnimationAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '添加淡入动画',
      input: { action: 'add', slideIndex: 1, shapeId: 'shape1', animationType: 'entrance', effect: 'fade' },
      output: { success: true, message: '成功添加动画', action: 'add' }
    }
  ]
}
