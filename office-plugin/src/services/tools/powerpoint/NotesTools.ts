/**
 * PowerPoint 备注页工具实现
 * 使用 Office.js API (PowerPointApi 1.1+) 实现备注操作
 * P1 阶段功能
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 添加幻灯片备注
 */
export async function pptAddSlideNotes(args: {
  slideIndex: number
  notes: string
}): Promise<ToolResult> {
  const { slideIndex, notes } = args

  try {
    return await PowerPoint.run(async (context) => {
      const presentation = context.presentation
      const slides = presentation.slides
      slides.load('items')
      await context.sync()

      if (slideIndex < 1 || slideIndex > slides.items.length) {
        return {
          success: false,
          message: `幻灯片索引超出范围: ${slideIndex}`
        }
      }

      const slide = slides.items[slideIndex - 1]

      // 注意：Office.js PowerPoint API 不直接支持备注操作
      // 这是一个限制，需要在文档中说明
      return {
        success: false,
        message: 'Office.js PowerPoint API 限制：不支持直接操作幻灯片备注',
        data: {
          note: '备注操作需要在 PowerPoint 桌面版中手动完成',
          slideIndex,
          requestedNotes: notes
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `添加幻灯片备注失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取幻灯片备注
 */
export async function pptGetSlideNotes(args: {
  slideIndex: number
}): Promise<ToolResult> {
  const { slideIndex } = args

  try {
    return await PowerPoint.run(async (context) => {
      const presentation = context.presentation
      const slides = presentation.slides
      slides.load('items')
      await context.sync()

      if (slideIndex < 1 || slideIndex > slides.items.length) {
        return {
          success: false,
          message: `幻灯片索引超出范围: ${slideIndex}`
        }
      }

      return {
        success: false,
        message: 'Office.js PowerPoint API 限制：不支持读取幻灯片备注',
        data: {
          note: '备注读取需要在 PowerPoint 桌面版中完成',
          slideIndex
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取幻灯片备注失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 更新幻灯片备注
 */
export async function pptUpdateSlideNotes(args: {
  slideIndex: number
  notes: string
}): Promise<ToolResult> {
  const { slideIndex, notes } = args

  try {
    return await PowerPoint.run(async (context) => {
      const presentation = context.presentation
      const slides = presentation.slides
      slides.load('items')
      await context.sync()

      if (slideIndex < 1 || slideIndex > slides.items.length) {
        return {
          success: false,
          message: `幻灯片索引超出范围: ${slideIndex}`
        }
      }

      return {
        success: false,
        message: 'Office.js PowerPoint API 限制：不支持更新幻灯片备注',
        data: {
          note: '备注更新需要在 PowerPoint 桌面版中完成',
          slideIndex,
          requestedNotes: notes
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `更新幻灯片备注失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 删除幻灯片备注
 */
export async function pptDeleteSlideNotes(args: {
  slideIndex: number
}): Promise<ToolResult> {
  const { slideIndex } = args

  try {
    return await PowerPoint.run(async (context) => {
      const presentation = context.presentation
      const slides = presentation.slides
      slides.load('items')
      await context.sync()

      if (slideIndex < 1 || slideIndex > slides.items.length) {
        return {
          success: false,
          message: `幻灯片索引超出范围: ${slideIndex}`
        }
      }

      return {
        success: false,
        message: 'Office.js PowerPoint API 限制：不支持删除幻灯片备注',
        data: {
          note: '备注删除需要在 PowerPoint 桌面版中完成',
          slideIndex
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `删除幻灯片备注失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 批量获取所有幻灯片备注
 */
export async function pptGetAllSlideNotes(args: {}): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    return await PowerPoint.run(async (context) => {
      const presentation = context.presentation
      const slides = presentation.slides
      slides.load('items')
      await context.sync()

      return {
        success: false,
        message: 'Office.js PowerPoint API 限制：不支持批量读取幻灯片备注',
        data: {
          note: '备注读取需要在 PowerPoint 桌面版中完成',
          slideCount: slides.items.length
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取所有幻灯片备注失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 导出备注工具定义
 */
export const notesTools: ToolDefinition[] = [
  { name: 'ppt_add_slide_notes', handler: pptAddSlideNotes, category: 'notes', description: '添加幻灯片备注' },
  { name: 'ppt_get_slide_notes', handler: pptGetSlideNotes, category: 'notes', description: '获取幻灯片备注' },
  { name: 'ppt_update_slide_notes', handler: pptUpdateSlideNotes, category: 'notes', description: '更新幻灯片备注' },
  { name: 'ppt_delete_slide_notes', handler: pptDeleteSlideNotes, category: 'notes', description: '删除幻灯片备注' },
  { name: 'ppt_get_all_slide_notes', handler: pptGetAllSlideNotes, category: 'notes', description: '批量获取所有幻灯片备注' }
]
