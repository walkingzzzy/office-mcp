/**
 * PowerPoint 媒体工具
 * 包含视频和音频增强功能
 *
 * 注意：PowerPoint Office.js API 对媒体操作的支持有限
 * 某些功能可能需要桌面版 PowerPoint 或通过其他方式实现
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

/**
 * 插入视频
 * 注意：PowerPoint API 对视频插入的直接支持有限
 */
async function pptInsertVideo(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex, videoUrl, left = 100, top = 100, width = 400, height = 300 } = args

  if (slideIndex === undefined || !videoUrl) {
    return { success: false, message: 'slideIndex 和 videoUrl 参数不能为空' }
  }

  return new Promise((resolve) => {
    PowerPoint.run(async (context) => {
      const slides = context.presentation.slides
      slides.load('items')
      await context.sync()

      if (slideIndex < 0 || slideIndex >= slides.items.length) {
        resolve({ success: false, message: `幻灯片索引超出范围: ${slideIndex}` })
        return
      }

      const slide = slides.items[slideIndex]

      // PowerPoint API 不直接支持视频插入
      // 作为替代方案，我们创建一个占位符形状并记录视频信息
      const shape = slide.shapes.addGeometricShape(PowerPoint.GeometricShapeType.rectangle)
      shape.left = left
      shape.top = top
      shape.width = width
      shape.height = height
      shape.name = `Video_${Date.now()}`

      // 设置形状填充为黑色，模拟视频占位符
      shape.fill.setSolidColor('black')

      // 添加文本提示
      shape.textFrame.textRange.text = '视频占位符\n' + videoUrl
      shape.textFrame.textRange.font.color = 'white'
      shape.textFrame.textRange.font.size = 12

      await context.sync()

      resolve({
        success: true,
        message: '已创建视频占位符。注意：PowerPoint API 不直接支持视频插入，请在 PowerPoint 中手动插入视频。',
        data: {
          slideIndex,
          videoUrl,
          shapeName: shape.name,
          note: '这是一个占位符，需要在 PowerPoint 中手动替换为实际视频'
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `插入视频失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 插入音频
 * 注意：PowerPoint API 对音频插入的直接支持有限
 */
async function pptInsertAudio(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex, audioUrl, left = 100, top = 100 } = args

  if (slideIndex === undefined || !audioUrl) {
    return { success: false, message: 'slideIndex 和 audioUrl 参数不能为空' }
  }

  return new Promise((resolve) => {
    PowerPoint.run(async (context) => {
      const slides = context.presentation.slides
      slides.load('items')
      await context.sync()

      if (slideIndex < 0 || slideIndex >= slides.items.length) {
        resolve({ success: false, message: `幻灯片索引超出范围: ${slideIndex}` })
        return
      }

      const slide = slides.items[slideIndex]

      // 创建音频占位符图标
      const shape = slide.shapes.addGeometricShape(PowerPoint.GeometricShapeType.ellipse)
      shape.left = left
      shape.top = top
      shape.width = 50
      shape.height = 50
      shape.name = `Audio_${Date.now()}`

      // 设置为音频图标样式
      shape.fill.setSolidColor('#1E90FF')
      shape.textFrame.textRange.text = '🔊'
      shape.textFrame.textRange.font.size = 24

      await context.sync()

      resolve({
        success: true,
        message: '已创建音频占位符。注意：PowerPoint API 不直接支持音频插入，请在 PowerPoint 中手动插入音频。',
        data: {
          slideIndex,
          audioUrl,
          shapeName: shape.name,
          note: '这是一个占位符，需要在 PowerPoint 中手动替换为实际音频'
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `插入音频失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置媒体播放选项
 * 注意：PowerPoint API 对媒体播放控制的支持有限
 */
async function pptSetMediaPlayback(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex, mediaId, autoPlay, loop, volume, startTime, endTime, hideWhenNotPlaying, playAcrossSlides } = args

  if (slideIndex === undefined || !mediaId) {
    return { success: false, message: 'slideIndex 和 mediaId 参数不能为空' }
  }

  return {
    success: false,
    message: 'ppt_set_media_playback: PowerPoint API 不支持媒体播放选项设置。请在 PowerPoint 中选择媒体后使用\"播放\"选项卡进行设置。',
    data: {
      slideIndex,
      mediaId,
      requestedOptions: { autoPlay, loop, volume, startTime, endTime, hideWhenNotPlaying, playAcrossSlides },
      suggestion: '在 PowerPoint 中：选择媒体 → 播放选项卡 → 设置播放选项'
    }
  }
}

/**
 * 获取媒体信息
 */
async function pptGetMediaInfo(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex, mediaId } = args

  if (slideIndex === undefined) {
    return { success: false, message: 'slideIndex 参数不能为空' }
  }

  return new Promise((resolve) => {
    PowerPoint.run(async (context) => {
      const slides = context.presentation.slides
      slides.load('items')
      await context.sync()

      if (slideIndex < 0 || slideIndex >= slides.items.length) {
        resolve({ success: false, message: `幻灯片索引超出范围: ${slideIndex}` })
        return
      }

      const slide = slides.items[slideIndex]
      const shapes = slide.shapes
      shapes.load('items')
      await context.sync()

      const mediaShapes: any[] = []

      // 查找媒体相关的形状（通过名称识别）
      for (const shape of shapes.items) {
        shape.load('name,left,top,width,height')
        await context.sync()

        if (shape.name.startsWith('Video_') || shape.name.startsWith('Audio_')) {
          const mediaInfo = {
            id: shape.name,
            type: shape.name.startsWith('Video_') ? 'video' : 'audio',
            position: {
              left: shape.left,
              top: shape.top,
              width: shape.width,
              height: shape.height
            }
          }

          if (mediaId && shape.name === mediaId) {
            resolve({
              success: true,
              message: '成功获取媒体信息',
              data: mediaInfo
            })
            return
          }

          mediaShapes.push(mediaInfo)
        }
      }

      if (mediaId) {
        resolve({
          success: false,
          message: `未找到媒体: ${mediaId}`
        })
      } else {
        resolve({
          success: true,
          message: '成功获取媒体列表',
          data: {
            mediaList: mediaShapes,
            count: mediaShapes.length
          }
        })
      }
    }).catch((error) => {
      resolve({
        success: false,
        message: `获取媒体信息失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 删除媒体
 */
async function pptDeleteMedia(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex, mediaId } = args

  if (slideIndex === undefined || !mediaId) {
    return { success: false, message: 'slideIndex 和 mediaId 参数不能为空' }
  }

  return new Promise((resolve) => {
    PowerPoint.run(async (context) => {
      const slides = context.presentation.slides
      slides.load('items')
      await context.sync()

      if (slideIndex < 0 || slideIndex >= slides.items.length) {
        resolve({ success: false, message: `幻灯片索引超出范围: ${slideIndex}` })
        return
      }

      const slide = slides.items[slideIndex]
      const shapes = slide.shapes
      shapes.load('items')
      await context.sync()

      // 查找并删除指定媒体
      for (const shape of shapes.items) {
        shape.load('name')
        await context.sync()

        if (shape.name === mediaId) {
          shape.delete()
          await context.sync()

          resolve({
            success: true,
            message: '成功删除媒体',
            data: { slideIndex, mediaId }
          })
          return
        }
      }

      resolve({
        success: false,
        message: `未找到媒体: ${mediaId}`
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `删除媒体失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置媒体时间轴
 * 注意：PowerPoint API 不支持媒体时间轴设置
 */
async function pptSetMediaTimeline(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex, mediaId, trimStart, trimEnd, fadeInDuration, fadeOutDuration } = args

  if (slideIndex === undefined || !mediaId) {
    return { success: false, message: 'slideIndex 和 mediaId 参数不能为空' }
  }

  return {
    success: false,
    message: 'ppt_set_media_timeline: PowerPoint API 不支持媒体时间轴设置。请在 PowerPoint 中选择媒体后使用\"播放\"选项卡进行裁剪和淡入淡出设置。',
    data: {
      slideIndex,
      mediaId,
      requestedSettings: { trimStart, trimEnd, fadeInDuration, fadeOutDuration },
      suggestion: '在 PowerPoint 中：选择媒体 → 播放选项卡 → 裁剪媒体 / 淡入淡出'
    }
  }
}

/**
 * 导出媒体工具定义
 */
export const mediaTools: ToolDefinition[] = [
  {
    name: 'ppt_insert_video',
    handler: pptInsertVideo,
    category: 'media',
    description: '插入视频（创建占位符）'
  },
  {
    name: 'ppt_insert_audio',
    handler: pptInsertAudio,
    category: 'media',
    description: '插入音频（创建占位符）'
  },
  {
    name: 'ppt_set_media_playback',
    handler: pptSetMediaPlayback,
    category: 'media',
    description: '设置媒体播放选项'
  },
  {
    name: 'ppt_get_media_info',
    handler: pptGetMediaInfo,
    category: 'media',
    description: '获取媒体信息'
  },
  {
    name: 'ppt_delete_media',
    handler: pptDeleteMedia,
    category: 'media',
    description: '删除媒体'
  },
  {
    name: 'ppt_set_media_timeline',
    handler: pptSetMediaTimeline,
    category: 'media',
    description: '设置媒体时间轴'
  }
]
