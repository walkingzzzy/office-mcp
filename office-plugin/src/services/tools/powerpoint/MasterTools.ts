/**
 * PowerPoint 幻灯片母版工具实现
 * 使用 Office.js API (PowerPointApi 1.1+) 实现母版操作
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 获取所有幻灯片母版
 */
export async function pptGetSlideMasters(args: {}): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    return await PowerPoint.run(async (context) => {
      const presentation = context.presentation
      const slideMasters = presentation.slideMasters
      slideMasters.load('items')
      await context.sync()

      const masters = slideMasters.items.map((master, index) => {
        master.load('id, name, layouts')
        return master
      })
      await context.sync()

      const masterData = masters.map((master, index) => ({
        id: master.id,
        name: master.name || `母版 ${index + 1}`,
        layoutCount: master.layouts.items.length
      }))

      return {
        success: true,
        message: `成功获取 ${masterData.length} 个幻灯片母版`,
        data: { masters: masterData }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取幻灯片母版失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取母版的布局列表
 */
export async function pptGetMasterLayouts(args: {
  masterId?: string
  masterIndex?: number
}): Promise<ToolResult> {
  const { masterId, masterIndex = 0 } = args

  try {
    return await PowerPoint.run(async (context) => {
      const presentation = context.presentation
      const slideMasters = presentation.slideMasters
      slideMasters.load('items')
      await context.sync()

      let master: PowerPoint.SlideMaster
      if (masterId) {
        master = slideMasters.getItem(masterId)
      } else {
        master = slideMasters.items[masterIndex]
      }

      if (!master) {
        return {
          success: false,
          message: '未找到指定的母版'
        }
      }

      master.load('name, layouts')
      await context.sync()

      const layouts = master.layouts
      layouts.load('items')
      await context.sync()

      const layoutData = layouts.items.map((layout, index) => {
        layout.load('id, name')
        return layout
      })
      await context.sync()

      const layoutList = layoutData.map((layout, index) => ({
        id: layout.id,
        name: layout.name || `布局 ${index + 1}`
      }))

      return {
        success: true,
        message: `成功获取 ${layoutList.length} 个布局`,
        data: {
          masterName: master.name,
          layouts: layoutList
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取母版布局失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 应用母版到幻灯片
 */
export async function pptApplySlideMaster(args: {
  slideIndex?: number
  masterId?: string
  masterIndex?: number
  layoutId?: string
  layoutIndex?: number
}): Promise<ToolResult> {
  const { slideIndex = 1, masterId, masterIndex = 0, layoutId, layoutIndex = 0 } = args

  try {
    return await PowerPoint.run(async (context) => {
      const presentation = context.presentation
      const slides = presentation.slides
      slides.load('items')
      await context.sync()

      const slide = slides.items[slideIndex - 1]
      if (!slide) {
        return {
          success: false,
          message: `未找到索引为 ${slideIndex} 的幻灯片`
        }
      }

      // 获取母版
      const slideMasters = presentation.slideMasters
      slideMasters.load('items')
      await context.sync()

      let master: PowerPoint.SlideMaster
      if (masterId) {
        master = slideMasters.getItem(masterId)
      } else {
        master = slideMasters.items[masterIndex]
      }

      if (!master) {
        return {
          success: false,
          message: '未找到指定的母版'
        }
      }

      master.load('layouts')
      await context.sync()

      // 获取布局
      let layout: PowerPoint.SlideLayout
      if (layoutId) {
        layout = master.layouts.getItem(layoutId)
      } else {
        layout = master.layouts.items[layoutIndex]
      }

      if (!layout) {
        return {
          success: false,
          message: '未找到指定的布局'
        }
      }

      // 应用布局到幻灯片
      // 注意：Office.js API 可能不支持直接更改幻灯片的母版
      // 这里提供一个替代方案的提示
      return {
        success: false,
        message: 'Office.js API 限制：无法直接更改幻灯片的母版，建议在创建幻灯片时指定布局',
        data: {
          note: '请使用 ppt_add_slide 工具并指定 layoutId 参数来创建使用特定布局的幻灯片',
          masterId: master.id,
          layoutId: layout.id
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `应用母版失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 复制母版
 * 注意：Office.js API 不支持复制母版操作
 */
export async function pptCopySlideMaster(args: {
  masterId?: string
  masterIndex?: number
  newName?: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 不支持复制幻灯片母版操作',
    data: {
      note: '母版复制需要在 PowerPoint 桌面版中手动操作'
    }
  }
}

/**
 * 删除母版
 * 注意：Office.js API 不支持删除母版操作
 */
export async function pptDeleteSlideMaster(args: {
  masterId?: string
  masterIndex?: number
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 不支持删除幻灯片母版操作',
    data: {
      note: '母版删除需要在 PowerPoint 桌面版中手动操作'
    }
  }
}

/**
 * 重命名母版
 * 注意：Office.js API 不支持重命名母版操作
 */
export async function pptRenameSlideMaster(args: {
  masterId?: string
  masterIndex?: number
  newName: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 不支持重命名幻灯片母版操作',
    data: {
      note: '母版重命名需要在 PowerPoint 桌面版中手动操作'
    }
  }
}

/**
 * 导出母版工具定义
 */
export const masterTools: ToolDefinition[] = [
  { name: 'ppt_get_slide_masters', handler: pptGetSlideMasters, category: 'master', description: '获取所有幻灯片母版' },
  { name: 'ppt_get_master_layouts', handler: pptGetMasterLayouts, category: 'master', description: '获取母版的布局列表' },
  { name: 'ppt_apply_slide_master', handler: pptApplySlideMaster, category: 'master', description: '应用母版到幻灯片' },
  { name: 'ppt_copy_slide_master', handler: pptCopySlideMaster, category: 'master', description: '复制母版' },
  { name: 'ppt_delete_slide_master', handler: pptDeleteSlideMaster, category: 'master', description: '删除母版' },
  { name: 'ppt_rename_slide_master', handler: pptRenameSlideMaster, category: 'master', description: '重命名母版' }
]
