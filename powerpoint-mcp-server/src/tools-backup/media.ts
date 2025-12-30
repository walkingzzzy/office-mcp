/**
 * PowerPoint 视频和音频增强工具
 * 使用 Office.js API (PowerPointApi 1.1+) 实现媒体操作
 *
 * 媒体功能：
 * - 插入视频
 * - 插入音频
 * - 设置媒体播放选项
 * - 获取媒体信息
 * - 删除媒体
 * - 设置媒体时间轴
 *
 * 错误处理：
 * - 使用统一的错误码体系
 * - 提供友好的错误提示和恢复建议
 * - 支持参数验证
 */

import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '@office-mcp/shared'
import { ToolErrorHandler } from '../utils/ToolErrorHandler.js'

/**
 * 插入视频
 */
export const pptInsertVideoTool: ToolDefinition = {
  name: 'ppt_insert_video',
  description: '在 PowerPoint 幻灯片中插入视频',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: '幻灯片索引（从 0 开始）'
      },
      videoUrl: {
        type: 'string',
        description: '视频 URL（支持 YouTube、Vimeo 等在线视频，或本地文件路径）'
      },
      left: {
        type: 'number',
        description: '左侧位置（磅）',
        default: 100
      },
      top: {
        type: 'number',
        description: '顶部位置（磅）',
        default: 100
      },
      width: {
        type: 'number',
        description: '宽度（磅）',
        default: 400
      },
      height: {
        type: 'number',
        description: '高度（磅）',
        default: 300
      }
    },
    required: ['slideIndex', 'videoUrl']
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    const paramError = ToolErrorHandler.validateRequiredParams(args, ['slideIndex', 'videoUrl'])
    if (paramError) return paramError

    try {
      const result = await sendIPCCommand('ppt_insert_video', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '插入 YouTube 视频',
      input: {
        slideIndex: 0,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        left: 100,
        top: 100,
        width: 640,
        height: 360
      },
      output: { success: true, message: '成功插入视频' }
    },
    {
      description: '插入本地视频文件',
      input: {
        slideIndex: 1,
        videoUrl: 'C:\\Videos\\presentation.mp4',
        left: 50,
        top: 50,
        width: 800,
        height: 450
      },
      output: { success: true, message: '成功插入视频' }
    }
  ]
}

/**
 * 插入音频
 */
export const pptInsertAudioTool: ToolDefinition = {
  name: 'ppt_insert_audio',
  description: '在 PowerPoint 幻灯片中插入音频',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: '幻灯片索引（从 0 开始）'
      },
      audioUrl: {
        type: 'string',
        description: '音频 URL 或本地文件路径'
      },
      left: {
        type: 'number',
        description: '左侧位置（磅）',
        default: 100
      },
      top: {
        type: 'number',
        description: '顶部位置（磅）',
        default: 100
      }
    },
    required: ['slideIndex', 'audioUrl']
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    const paramError = ToolErrorHandler.validateRequiredParams(args, ['slideIndex', 'audioUrl'])
    if (paramError) return paramError

    try {
      const result = await sendIPCCommand('ppt_insert_audio', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '插入背景音乐',
      input: {
        slideIndex: 0,
        audioUrl: 'C:\\Music\\background.mp3',
        left: 10,
        top: 10
      },
      output: { success: true, message: '成功插入音频' }
    }
  ]
}

/**
 * 设置媒体播放选项
 */
export const pptSetMediaPlaybackTool: ToolDefinition = {
  name: 'ppt_set_media_playback',
  description: '设置 PowerPoint 媒体（视频/音频）的播放选项',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: '幻灯片索引（从 0 开始）'
      },
      mediaId: {
        type: 'string',
        description: '媒体 ID 或名称'
      },
      autoPlay: {
        type: 'boolean',
        description: '是否自动播放',
        default: false
      },
      loop: {
        type: 'boolean',
        description: '是否循环播放',
        default: false
      },
      volume: {
        type: 'number',
        description: '音量（0-100）',
        default: 100
      },
      startTime: {
        type: 'number',
        description: '开始时间（秒）',
        default: 0
      },
      endTime: {
        type: 'number',
        description: '结束时间（秒，0 表示播放到结尾）',
        default: 0
      },
      hideWhenNotPlaying: {
        type: 'boolean',
        description: '不播放时隐藏',
        default: false
      },
      playAcrossSlides: {
        type: 'boolean',
        description: '跨幻灯片播放',
        default: false
      }
    },
    required: ['slideIndex', 'mediaId']
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    const paramError = ToolErrorHandler.validateRequiredParams(args, ['slideIndex', 'mediaId'])
    if (paramError) return paramError

    // 验证音量范围
    if (args.volume !== undefined) {
      const rangeError = ToolErrorHandler.validateParamRanges(args, {
        volume: { min: 0, max: 100 }
      })
      if (rangeError) return rangeError
    }

    try {
      const result = await sendIPCCommand('ppt_set_media_playback', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '设置视频自动播放并循环',
      input: {
        slideIndex: 0,
        mediaId: 'Video1',
        autoPlay: true,
        loop: true,
        volume: 80
      },
      output: { success: true, message: '成功设置媒体播放选项' }
    },
    {
      description: '设置音频跨幻灯片播放',
      input: {
        slideIndex: 0,
        mediaId: 'Audio1',
        autoPlay: true,
        playAcrossSlides: true,
        hideWhenNotPlaying: true
      },
      output: { success: true, message: '成功设置媒体播放选项' }
    }
  ]
}

/**
 * 获取媒体信息
 */
export const pptGetMediaInfoTool: ToolDefinition = {
  name: 'ppt_get_media_info',
  description: '获取 PowerPoint 幻灯片中媒体的信息',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: '幻灯片索引（从 0 开始）'
      },
      mediaId: {
        type: 'string',
        description: '媒体 ID 或名称（可选，不提供则返回所有媒体）'
      }
    },
    required: ['slideIndex']
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    const paramError = ToolErrorHandler.validateRequiredParams(args, ['slideIndex'])
    if (paramError) return paramError

    try {
      const result = await sendIPCCommand('ppt_get_media_info', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '获取特定媒体信息',
      input: {
        slideIndex: 0,
        mediaId: 'Video1'
      },
      output: {
        success: true,
        data: {
          id: 'Video1',
          type: 'video',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          duration: 212,
          autoPlay: true,
          loop: false,
          volume: 80
        }
      }
    },
    {
      description: '获取幻灯片所有媒体',
      input: {
        slideIndex: 0
      },
      output: {
        success: true,
        data: {
          mediaList: [
            { id: 'Video1', type: 'video', url: '...' },
            { id: 'Audio1', type: 'audio', url: '...' }
          ],
          count: 2
        }
      }
    }
  ]
}

/**
 * 删除媒体
 */
export const pptDeleteMediaTool: ToolDefinition = {
  name: 'ppt_delete_media',
  description: '从 PowerPoint 幻灯片中删除媒体',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: '幻灯片索引（从 0 开始）'
      },
      mediaId: {
        type: 'string',
        description: '媒体 ID 或名称'
      }
    },
    required: ['slideIndex', 'mediaId']
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    const paramError = ToolErrorHandler.validateRequiredParams(args, ['slideIndex', 'mediaId'])
    if (paramError) return paramError

    try {
      const result = await sendIPCCommand('ppt_delete_media', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '删除视频',
      input: {
        slideIndex: 0,
        mediaId: 'Video1'
      },
      output: { success: true, message: '成功删除媒体' }
    }
  ]
}

/**
 * 设置媒体时间轴
 */
export const pptSetMediaTimelineTool: ToolDefinition = {
  name: 'ppt_set_media_timeline',
  description: '设置 PowerPoint 媒体的播放时间轴（裁剪、淡入淡出）',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: '幻灯片索引（从 0 开始）'
      },
      mediaId: {
        type: 'string',
        description: '媒体 ID 或名称'
      },
      trimStart: {
        type: 'number',
        description: '裁剪开始时间（秒）',
        default: 0
      },
      trimEnd: {
        type: 'number',
        description: '裁剪结束时间（秒，0 表示不裁剪）',
        default: 0
      },
      fadeInDuration: {
        type: 'number',
        description: '淡入时长（秒）',
        default: 0
      },
      fadeOutDuration: {
        type: 'number',
        description: '淡出时长（秒）',
        default: 0
      }
    },
    required: ['slideIndex', 'mediaId']
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    const paramError = ToolErrorHandler.validateRequiredParams(args, ['slideIndex', 'mediaId'])
    if (paramError) return paramError

    try {
      const result = await sendIPCCommand('ppt_set_media_timeline', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '裁剪视频并添加淡入淡出效果',
      input: {
        slideIndex: 0,
        mediaId: 'Video1',
        trimStart: 5,
        trimEnd: 60,
        fadeInDuration: 2,
        fadeOutDuration: 2
      },
      output: { success: true, message: '成功设置媒体时间轴' }
    },
    {
      description: '仅添加淡入效果',
      input: {
        slideIndex: 0,
        mediaId: 'Audio1',
        fadeInDuration: 3
      },
      output: { success: true, message: '成功设置媒体时间轴' }
    }
  ]
}
