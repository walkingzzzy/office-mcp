/**
 * PowerPoint 超链接工具实现
 * 使用 Office.js API (PowerPointApi 1.1+) 实现超链接操作
 * P1 阶段功能
 *
 * 注意：Office.js PowerPoint API 对超链接的支持有限
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 为形状添加超链接
 */
export async function pptAddHyperlinkToShape(args: {
  slideIndex: number
  shapeId: string
  url: string
  screenTip?: string
}): Promise<ToolResult> {
  const { slideIndex, shapeId, url, screenTip } = args

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
      const shapes = slide.shapes
      shapes.load('items')
      await context.sync()

      const shape = shapes.items.find((s: any) => {
        s.load('id')
        return s.id === shapeId
      })

      if (!shape) {
        await context.sync()
        return {
          success: false,
          message: `未找到形状: ${shapeId}`
        }
      }

      // Office.js PowerPoint API 限制：不支持直接添加超链接
      return {
        success: false,
        message: 'Office.js PowerPoint API 限制：不支持直接为形状添加超链接',
        data: {
          note: '超链接添加需要在 PowerPoint 桌面版中完成',
          slideIndex,
          shapeId,
          requestedUrl: url
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `添加超链接失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

// 其他超链接函数实现类似，都受到 Office.js API 限制
export async function pptAddHyperlinkToText(args: any) {
  return {
    success: false,
    message: 'Office.js PowerPoint API 限制：不支持为文本添加超链接'
  }
}

export async function pptGetHyperlinks(args: any) {
  return {
    success: false,
    message: 'Office.js PowerPoint API 限制：不支持读取超链接'
  }
}

export async function pptRemoveHyperlink(args: any) {
  return {
    success: false,
    message: 'Office.js PowerPoint API 限制：不支持删除超链接'
  }
}

export async function pptUpdateHyperlink(args: any) {
  return {
    success: false,
    message: 'Office.js PowerPoint API 限制：不支持更新超链接'
  }
}

/**
 * 导出超链接工具定义
 */
export const hyperlinkTools: ToolDefinition[] = [
  { name: 'ppt_add_hyperlink_to_shape', handler: pptAddHyperlinkToShape, category: 'hyperlink', description: '为形状添加超链接' },
  { name: 'ppt_add_hyperlink_to_text', handler: pptAddHyperlinkToText, category: 'hyperlink', description: '为文本添加超链接' },
  { name: 'ppt_get_hyperlinks', handler: pptGetHyperlinks, category: 'hyperlink', description: '获取超链接' },
  { name: 'ppt_remove_hyperlink', handler: pptRemoveHyperlink, category: 'hyperlink', description: '删除超链接' },
  { name: 'ppt_update_hyperlink', handler: pptUpdateHyperlink, category: 'hyperlink', description: '更新超链接' }
]
