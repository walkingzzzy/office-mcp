/**
 * ppt_slideshow_settings - 放映设置
 * 合并 10 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'get', 'setLoop', 'setRange', 'setAdvanceMode', 'setPresenterView',
  'setKioskMode', 'setAnimationNarration', 'setResolution', 'setDisplay', 'reset'
] as const

type SlideshowSettingsAction = typeof SUPPORTED_ACTIONS[number]

export const pptSlideshowSettingsTool: ToolDefinition = {
  name: 'ppt_slideshow_settings',
  description: `放映设置工具。支持的操作(action):
- get: 获取放映设置
- setLoop: 设置循环播放 (需要 loop)
- setRange: 设置放映范围 (可选 startSlide, endSlide, customSlides)
- setAdvanceMode: 设置换片方式 (需要 advanceMode)
- setPresenterView: 设置演示者视图 (需要 presenterView)
- setKioskMode: 设置展台模式 (需要 kioskMode, 可选 restartAfter)
- setAnimationNarration: 设置动画和旁白 (可选 showAnimations, playNarrations)
- setResolution: 设置分辨率 (需要 resolution)
- setDisplay: 设置显示器 (需要 displayMonitor)
- reset: 重置放映设置`,
  category: 'slideshowSettings',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      loop: {
        type: 'boolean',
        description: '[setLoop] 是否循环'
      },
      startSlide: {
        type: 'number',
        description: '[setRange] 起始幻灯片'
      },
      endSlide: {
        type: 'number',
        description: '[setRange] 结束幻灯片'
      },
      customSlides: {
        type: 'array',
        items: { type: 'number' },
        description: '[setRange] 自定义幻灯片列表'
      },
      advanceMode: {
        type: 'string',
        enum: ['manual', 'automatic', 'rehearsed'],
        description: '[setAdvanceMode] 换片方式'
      },
      presenterView: {
        type: 'boolean',
        description: '[setPresenterView] 是否启用演示者视图'
      },
      kioskMode: {
        type: 'boolean',
        description: '[setKioskMode] 是否启用展台模式'
      },
      restartAfter: {
        type: 'number',
        description: '[setKioskMode] 重新开始时间(秒)'
      },
      showAnimations: {
        type: 'boolean',
        description: '[setAnimationNarration] 是否显示动画'
      },
      playNarrations: {
        type: 'boolean',
        description: '[setAnimationNarration] 是否播放旁白'
      },
      resolution: {
        type: 'string',
        enum: ['640x480', '800x600', '1024x768', '1280x720', '1920x1080'],
        description: '[setResolution] 分辨率'
      },
      displayMonitor: {
        type: ['number', 'string'],
        description: '[setDisplay] 显示器 (数字或 auto)'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: [
      '放映设置', '循环播放', '演示者视图', '展台模式',
      '分辨率', '换片方式'
    ],
    mergedTools: [
      'ppt_get_slideshow_settings', 'ppt_set_slideshow_loop',
      'ppt_set_slideshow_range', 'ppt_set_slide_advance_mode',
      'ppt_set_presenter_view', 'ppt_set_kiosk_mode',
      'ppt_set_animation_and_narration', 'ppt_set_slideshow_resolution',
      'ppt_set_slideshow_display', 'ppt_reset_slideshow_settings'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<SlideshowSettingsAction, string> = {
      get: 'ppt_get_slideshow_settings',
      setLoop: 'ppt_set_slideshow_loop',
      setRange: 'ppt_set_slideshow_range',
      setAdvanceMode: 'ppt_set_slide_advance_mode',
      setPresenterView: 'ppt_set_presenter_view',
      setKioskMode: 'ppt_set_kiosk_mode',
      setAnimationNarration: 'ppt_set_animation_and_narration',
      setResolution: 'ppt_set_slideshow_resolution',
      setDisplay: 'ppt_set_slideshow_display',
      reset: 'ppt_reset_slideshow_settings'
    }

    const command = commandMap[action as SlideshowSettingsAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '设置循环播放',
      input: { action: 'setLoop', loop: true },
      output: { success: true, message: '成功设置循环播放', action: 'setLoop' }
    }
  ]
}
