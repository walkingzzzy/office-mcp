/**
 * ppt_media - 图片与媒体操作
 * 合并 10 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'insertImage', 'insertVideo', 'insertAudio', 'crop',
  'compress', 'setEffects', 'setPlayback', 'getInfo',
  'delete', 'setTimeline'
] as const

type MediaAction = typeof SUPPORTED_ACTIONS[number]

export const pptMediaTool: ToolDefinition = {
  name: 'ppt_media',
  description: `图片与媒体操作工具。支持的操作(action):
- insertImage: 插入图片 (需要 slideIndex, source, position)
- insertVideo: 插入视频 (需要 slideIndex, source, position)
- insertAudio: 插入音频 (需要 slideIndex, source)
- crop: 裁剪图片 (需要 slideIndex, mediaId, cropArea)
- compress: 压缩媒体 (需要 slideIndex, mediaId)
- setEffects: 设置图片效果 (需要 slideIndex, mediaId, effects)
- setPlayback: 设置播放选项 (需要 slideIndex, mediaId, playback)
- getInfo: 获取媒体信息 (需要 slideIndex, mediaId)
- delete: 删除媒体 (需要 slideIndex, mediaId)
- setTimeline: 设置时间线 (需要 slideIndex, mediaId, timeline)`,
  category: 'media',
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
        description: '[所有操作] 幻灯片索引'
      },
      mediaId: {
        type: 'string',
        description: '[多个操作] 媒体ID'
      },
      source: {
        type: 'string',
        description: '[insert*] 文件路径或URL'
      },
      position: {
        type: 'object',
        description: '[insert*] 位置和大小',
        properties: {
          left: { type: 'number' },
          top: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' }
        }
      },
      cropArea: {
        type: 'object',
        description: '[crop] 裁剪区域',
        properties: {
          left: { type: 'number' },
          top: { type: 'number' },
          right: { type: 'number' },
          bottom: { type: 'number' }
        }
      },
      effects: {
        type: 'object',
        description: '[setEffects] 图片效果',
        properties: {
          brightness: { type: 'number' },
          contrast: { type: 'number' },
          saturation: { type: 'number' },
          blur: { type: 'number' },
          shadow: { type: 'boolean' }
        }
      },
      playback: {
        type: 'object',
        description: '[setPlayback] 播放设置',
        properties: {
          autoPlay: { type: 'boolean' },
          loop: { type: 'boolean' },
          hideWhenNotPlaying: { type: 'boolean' },
          startTime: { type: 'number' },
          endTime: { type: 'number' },
          volume: { type: 'number' }
        }
      },
      timeline: {
        type: 'object',
        description: '[setTimeline] 时间线设置',
        properties: {
          startOnClick: { type: 'boolean' },
          startAfterPrevious: { type: 'boolean' },
          delay: { type: 'number' }
        }
      }
    },
    required: ['action', 'slideIndex']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: [
      '图片', '视频', '音频', '媒体', '插入图片',
      '裁剪', '压缩', '播放', '效果'
    ],
    mergedTools: [
      'ppt_insert_image', 'ppt_insert_video', 'ppt_insert_audio',
      'ppt_crop_image', 'ppt_compress_media', 'ppt_set_image_effects',
      'ppt_set_media_playback', 'ppt_get_media_info',
      'ppt_delete_media', 'ppt_set_media_timeline'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<MediaAction, string> = {
      insertImage: 'ppt_insert_image',
      insertVideo: 'ppt_insert_video',
      insertAudio: 'ppt_insert_audio',
      crop: 'ppt_crop_image',
      compress: 'ppt_compress_media',
      setEffects: 'ppt_set_image_effects',
      setPlayback: 'ppt_set_media_playback',
      getInfo: 'ppt_get_media_info',
      delete: 'ppt_delete_media',
      setTimeline: 'ppt_set_media_timeline'
    }

    const command = commandMap[action as MediaAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '插入图片',
      input: { action: 'insertImage', slideIndex: 1, source: 'C:\\images\\logo.png', position: { left: 100, top: 100 } },
      output: { success: true, message: '成功插入图片', action: 'insertImage' }
    }
  ]
}
