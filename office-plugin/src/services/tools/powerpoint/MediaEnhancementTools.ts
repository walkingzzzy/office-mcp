/**
 * PowerPoint 媒体增强工具实现
 * 使用 Office.js API (PowerPointApi 1.1+) 实现媒体操作
 *
 * ⚠️ 注意：PowerPoint Office.js API 对媒体操作的支持有限
 * 部分功能可能需要使用 OOXML 操作或返回 API 限制提示
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 插入视频
 */
export async function pptInsertVideo(args: {
  slideIndex: number
  videoUrl: string
  left?: number
  top?: number
  width?: number
  height?: number
}): Promise<ToolResult> {
  return {
    success: false,
    message: '⚠️ PowerPoint Office.js API 不支持直接插入视频。建议使用 PowerPoint 桌面应用程序。',
    data: { apiLimitation: true }
  }
}

/**
 * 插入音频
 */
export async function pptInsertAudio(args: {
  slideIndex: number
  audioUrl: string
  left?: number
  top?: number
}): Promise<ToolResult> {
  return {
    success: false,
    message: '⚠️ PowerPoint Office.js API 不支持直接插入音频。建议使用 PowerPoint 桌面应用程序。',
    data: { apiLimitation: true }
  }
}

/**
 * 设置媒体播放选项
 */
export async function pptSetMediaPlayback(args: {
  slideIndex: number
  mediaId: string
  autoPlay?: boolean
  loop?: boolean
  volume?: number
  startTime?: number
  endTime?: number
  hideWhenNotPlaying?: boolean
  playAcrossSlides?: boolean
}): Promise<ToolResult> {
  return {
    success: false,
    message: '⚠️ PowerPoint Office.js API 不支持设置媒体播放选项。',
    data: { apiLimitation: true }
  }
}

/**
 * 获取媒体信息
 */
export async function pptGetMediaInfo(args: {
  slideIndex: number
  mediaId?: string
}): Promise<ToolResult> {
  try {
    return await PowerPoint.run(async (context) => {
      const presentation = context.presentation
      const slides = presentation.slides
      slides.load('items')
      await context.sync()

      if (args.slideIndex < 0 || args.slideIndex >= slides.items.length) {
        return { success: false, message: `幻灯片索引超出范围: ${args.slideIndex}` }
      }

      const slide = slides.items[args.slideIndex]
      const shapes = slide.shapes
      shapes.load('items/id,items/name,items/type')
      await context.sync()

      // 筛选媒体类型的形状（使用字符串比较避免类型错误）
      const mediaShapes = shapes.items.filter(s => {
        const typeStr = String(s.type)
        return typeStr === 'Media' || typeStr === 'Video' || typeStr === 'Audio'
      })

      return {
        success: true,
        message: `成功获取 ${mediaShapes.length} 个媒体`,
        data: {
          mediaList: mediaShapes.map(s => ({ id: s.id, name: s.name, type: s.type })),
          count: mediaShapes.length
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `获取媒体信息失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 删除媒体
 */
export async function pptDeleteMedia(args: {
  slideIndex: number
  mediaId: string
}): Promise<ToolResult> {
  try {
    return await PowerPoint.run(async (context) => {
      const presentation = context.presentation
      const slides = presentation.slides
      slides.load('items')
      await context.sync()

      if (args.slideIndex < 0 || args.slideIndex >= slides.items.length) {
        return { success: false, message: `幻灯片索引超出范围: ${args.slideIndex}` }
      }

      const slide = slides.items[args.slideIndex]
      const shapes = slide.shapes
      shapes.load('items/id')
      await context.sync()

      const mediaShape = shapes.items.find(s => s.id === args.mediaId)
      if (!mediaShape) {
        return { success: false, message: `未找到媒体: ${args.mediaId}` }
      }

      mediaShape.delete()
      await context.sync()

      return { success: true, message: '成功删除媒体' }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `删除媒体失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 设置媒体时间轴
 */
export async function pptSetMediaTimeline(args: {
  slideIndex: number
  mediaId: string
  trimStart?: number
  trimEnd?: number
  fadeInDuration?: number
  fadeOutDuration?: number
}): Promise<ToolResult> {
  return {
    success: false,
    message: '⚠️ PowerPoint Office.js API 不支持设置媒体时间轴。',
    data: { apiLimitation: true }
  }
}

/**
 * 导出媒体增强工具定义
 */
export const mediaEnhancementTools: ToolDefinition[] = [
  { name: 'ppt_insert_video', handler: pptInsertVideo, category: 'media', description: '插入视频（API受限）' },
  { name: 'ppt_insert_audio', handler: pptInsertAudio, category: 'media', description: '插入音频（API受限）' },
  { name: 'ppt_set_media_playback', handler: pptSetMediaPlayback, category: 'media', description: '设置媒体播放选项（API受限）' },
  { name: 'ppt_get_media_info', handler: pptGetMediaInfo, category: 'media', description: '获取媒体信息' },
  { name: 'ppt_delete_media', handler: pptDeleteMedia, category: 'media', description: '删除媒体' },
  { name: 'ppt_set_media_timeline', handler: pptSetMediaTimeline, category: 'media', description: '设置媒体时间轴（API受限）' }
]
