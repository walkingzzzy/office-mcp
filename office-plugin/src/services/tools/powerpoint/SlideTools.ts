/**
 * PowerPoint 幻灯片操作工具
 * 包含 10 个幻灯片相关工具
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

/**
 * 添加幻灯片
 */
async function pptAddSlide(args: Record<string, any>): Promise<FunctionResult> {
  const { layoutId } = args

  return new Promise((resolve) => {
    PowerPoint.run(async (context) => {
      const presentation = context.presentation
      
      if (layoutId) {
        presentation.slides.add({ layoutId })
      } else {
        presentation.slides.add()
      }
      
      await context.sync()

      resolve({
        success: true,
        message: '幻灯片已添加'
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `添加幻灯片失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 删除幻灯片
 */
async function pptDeleteSlide(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex } = args

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

      slides.items[slideIndex].delete()
      await context.sync()

      resolve({
        success: true,
        message: `幻灯片 ${slideIndex + 1} 已删除`,
        data: { slideIndex }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `删除幻灯片失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 复制幻灯片
 */
async function pptDuplicateSlide(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex } = args

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

      // PowerPoint API 复制幻灯片
      const sourceSlide = slides.items[slideIndex]
      sourceSlide.load('id')
      await context.sync()

      // 使用 copyFromSlide 或添加新幻灯片
      // 注意：PowerPoint API 对复制的支持有限
      resolve({
        success: false,
        message: 'ppt_duplicate_slide: PowerPoint API 对幻灯片复制的支持有限。请在 PowerPoint 中手动复制幻灯片。',
        data: { slideIndex }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `复制幻灯片失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 移动幻灯片
 */
async function pptMoveSlide(args: Record<string, any>): Promise<FunctionResult> {
  const { fromIndex, toIndex } = args

  if (fromIndex === undefined || toIndex === undefined) {
    return { success: false, message: 'fromIndex 和 toIndex 参数不能为空' }
  }

  return new Promise((resolve) => {
    PowerPoint.run(async (context) => {
      const slides = context.presentation.slides
      slides.load('items')
      await context.sync()

      if (fromIndex < 0 || fromIndex >= slides.items.length ||
          toIndex < 0 || toIndex >= slides.items.length) {
        resolve({ success: false, message: '幻灯片索引超出范围' })
        return
      }

      // PowerPoint API 不直接支持移动幻灯片
      resolve({
        success: false,
        message: 'ppt_move_slide: PowerPoint API 不直接支持移动幻灯片。请在 PowerPoint 中手动拖动幻灯片。',
        data: { fromIndex, toIndex }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `移动幻灯片失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置幻灯片布局
 */
async function pptSetSlideLayout(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex, layoutId } = args

  if (slideIndex === undefined || !layoutId) {
    return { success: false, message: 'slideIndex 和 layoutId 参数不能为空' }
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

      // PowerPoint API 不直接支持更改幻灯片布局
      resolve({
        success: false,
        message: 'ppt_set_slide_layout: PowerPoint API 不直接支持更改幻灯片布局。请在 PowerPoint 中使用"开始-布局"功能。',
        data: { slideIndex, layoutId }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置幻灯片布局失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 获取幻灯片数量
 */
async function pptGetSlideCount(_args: Record<string, any>): Promise<FunctionResult> {
  return new Promise((resolve) => {
    PowerPoint.run(async (context) => {
      const slides = context.presentation.slides
      slides.load('items')
      await context.sync()

      resolve({
        success: true,
        message: '获取幻灯片数量成功',
        data: { count: slides.items.length }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `获取幻灯片数量失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导航到幻灯片
 */
async function pptNavigateToSlide(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex } = args

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

      // 选择幻灯片
      // PowerPoint API 不直接支持导航
      resolve({
        success: false,
        message: 'ppt_navigate_to_slide: PowerPoint API 不直接支持导航到特定幻灯片。请在 PowerPoint 中手动选择幻灯片。',
        data: { slideIndex }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `导航失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 隐藏幻灯片
 */
async function pptHideSlide(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex } = args

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

      // PowerPoint API 不直接支持隐藏幻灯片
      resolve({
        success: false,
        message: 'ppt_hide_slide: PowerPoint API 不直接支持隐藏幻灯片。请在 PowerPoint 中右键点击幻灯片选择"隐藏幻灯片"。',
        data: { slideIndex }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `隐藏幻灯片失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 显示幻灯片
 */
async function pptUnhideSlide(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex } = args

  if (slideIndex === undefined) {
    return { success: false, message: 'slideIndex 参数不能为空' }
  }

  return {
    success: false,
    message: 'ppt_unhide_slide: PowerPoint API 不直接支持显示隐藏的幻灯片。请在 PowerPoint 中手动操作。',
    data: { slideIndex }
  }
}

/**
 * 设置幻灯片过渡
 */
async function pptSetSlideTransition(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex, transitionType, duration } = args

  if (slideIndex === undefined) {
    return { success: false, message: 'slideIndex 参数不能为空' }
  }

  return {
    success: false,
    message: 'ppt_set_slide_transition: PowerPoint API 不直接支持设置幻灯片过渡效果。请在 PowerPoint 中使用"切换"选项卡。',
    data: { slideIndex, transitionType, duration }
  }
}

/**
 * 导出幻灯片工具定义
 */
export const slideTools: ToolDefinition[] = [
  { name: 'ppt_add_slide', handler: pptAddSlide, category: 'slide', description: '添加幻灯片' },
  { name: 'ppt_delete_slide', handler: pptDeleteSlide, category: 'slide', description: '删除幻灯片' },
  { name: 'ppt_duplicate_slide', handler: pptDuplicateSlide, category: 'slide', description: '复制幻灯片' },
  { name: 'ppt_move_slide', handler: pptMoveSlide, category: 'slide', description: '移动幻灯片' },
  { name: 'ppt_set_slide_layout', handler: pptSetSlideLayout, category: 'slide', description: '设置幻灯片布局' },
  { name: 'ppt_get_slide_count', handler: pptGetSlideCount, category: 'slide', description: '获取幻灯片数量' },
  { name: 'ppt_navigate_to_slide', handler: pptNavigateToSlide, category: 'slide', description: '导航到幻灯片' },
  { name: 'ppt_hide_slide', handler: pptHideSlide, category: 'slide', description: '隐藏幻灯片' },
  { name: 'ppt_unhide_slide', handler: pptUnhideSlide, category: 'slide', description: '显示幻灯片' },
  { name: 'ppt_set_slide_transition', handler: pptSetSlideTransition, category: 'slide', description: '设置幻灯片过渡' }
]
