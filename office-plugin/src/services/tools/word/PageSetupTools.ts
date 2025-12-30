/**
 * Word 页面设置工具实现
 * 使用 Office.js API (WordApi 1.1) 实现页面设置操作
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 设置页边距
 */
export async function wordSetPageMargins(args: {
  top?: number
  bottom?: number
  left?: number
  right?: number
}): Promise<ToolResult> {
  const { top, bottom, left, right } = args

  try {
    return await Word.run(async (context) => {
      // 获取文档的第一个节
      const sections = context.document.sections
      sections.load('items')
      await context.sync()

      if (sections.items.length === 0) {
        return {
          success: false,
          message: '文档中没有节，无法设置页边距'
        }
      }

      const section = sections.items[0]
      const pageSetup = section.pageSetup

      // 设置页边距
      if (top !== undefined) {
        pageSetup.topMargin = top
      }
      if (bottom !== undefined) {
        pageSetup.bottomMargin = bottom
      }
      if (left !== undefined) {
        pageSetup.leftMargin = left
      }
      if (right !== undefined) {
        pageSetup.rightMargin = right
      }

      await context.sync()

      const changedMargins: string[] = []
      if (top !== undefined) changedMargins.push(`上边距: ${top}磅`)
      if (bottom !== undefined) changedMargins.push(`下边距: ${bottom}磅`)
      if (left !== undefined) changedMargins.push(`左边距: ${left}磅`)
      if (right !== undefined) changedMargins.push(`右边距: ${right}磅`)

      return {
        success: true,
        message: `成功设置页边距：${changedMargins.join('，')}`,
        data: { top, bottom, left, right }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `设置页边距失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取页边距
 */
export async function wordGetPageMargins(): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    return await Word.run(async (context) => {
      // 获取文档的第一个节
      const sections = context.document.sections
      sections.load('items')
      await context.sync()

      if (sections.items.length === 0) {
        return {
          success: false,
          message: '文档中没有节，无法获取页边距'
        }
      }

      const section = sections.items[0]
      const pageSetup = section.pageSetup
      pageSetup.load(['topMargin', 'bottomMargin', 'leftMargin', 'rightMargin'])
      await context.sync()

      return {
        success: true,
        message: '成功获取页边距',
        data: {
          top: pageSetup.topMargin,
          bottom: pageSetup.bottomMargin,
          left: pageSetup.leftMargin,
          right: pageSetup.rightMargin
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取页边距失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 设置页面方向
 */
export async function wordSetPageOrientation(args: {
  orientation: 'portrait' | 'landscape'
}): Promise<ToolResult> {
  const { orientation } = args

  try {
    return await Word.run(async (context) => {
      // 获取文档的第一个节
      const sections = context.document.sections
      sections.load('items')
      await context.sync()

      if (sections.items.length === 0) {
        return {
          success: false,
          message: '文档中没有节，无法设置页面方向'
        }
      }

      const section = sections.items[0]
      const pageSetup = section.pageSetup

      // 设置页面方向
      if (orientation === 'landscape') {
        pageSetup.orientation = Word.PageOrientation.landscape
      } else {
        pageSetup.orientation = Word.PageOrientation.portrait
      }

      await context.sync()

      return {
        success: true,
        message: `成功设置页面方向为${orientation === 'landscape' ? '横向' : '纵向'}`,
        data: { orientation }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `设置页面方向失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取页面方向
 */
export async function wordGetPageOrientation(): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    return await Word.run(async (context) => {
      // 获取文档的第一个节
      const sections = context.document.sections
      sections.load('items')
      await context.sync()

      if (sections.items.length === 0) {
        return {
          success: false,
          message: '文档中没有节，无法获取页面方向'
        }
      }

      const section = sections.items[0]
      const pageSetup = section.pageSetup
      pageSetup.load('orientation')
      await context.sync()

      const orientation =
        pageSetup.orientation === Word.PageOrientation.landscape ? 'landscape' : 'portrait'

      return {
        success: true,
        message: `当前页面方向为${orientation === 'landscape' ? '横向' : '纵向'}`,
        data: { orientation }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取页面方向失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 设置页面大小
 */
export async function wordSetPageSize(args: {
  width?: number
  height?: number
}): Promise<ToolResult> {
  const { width, height } = args

  try {
    return await Word.run(async (context) => {
      // 获取文档的第一个节
      const sections = context.document.sections
      sections.load('items')
      await context.sync()

      if (sections.items.length === 0) {
        return {
          success: false,
          message: '文档中没有节，无法设置页面大小'
        }
      }

      const section = sections.items[0]
      const pageSetup = section.pageSetup

      // 设置页面大小
      if (width !== undefined) {
        pageSetup.pageWidth = width
      }
      if (height !== undefined) {
        pageSetup.pageHeight = height
      }

      await context.sync()

      const changedSize: string[] = []
      if (width !== undefined) changedSize.push(`宽度: ${width}磅`)
      if (height !== undefined) changedSize.push(`高度: ${height}磅`)

      return {
        success: true,
        message: `成功设置页面大小：${changedSize.join('，')}`,
        data: { width, height }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `设置页面大小失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取页面大小
 */
export async function wordGetPageSize(): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    return await Word.run(async (context) => {
      // 获取文档的第一个节
      const sections = context.document.sections
      sections.load('items')
      await context.sync()

      if (sections.items.length === 0) {
        return {
          success: false,
          message: '文档中没有节，无法获取页面大小'
        }
      }

      const section = sections.items[0]
      const pageSetup = section.pageSetup
      pageSetup.load(['pageWidth', 'pageHeight'])
      await context.sync()

      return {
        success: true,
        message: '成功获取页面大小',
        data: {
          width: pageSetup.pageWidth,
          height: pageSetup.pageHeight
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取页面大小失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 页面设置工具定义数组
 */
export const pageSetupTools: ToolDefinition[] = [
  {
    name: 'word_set_page_margins',
    description: '设置 Word 文档的页边距',
    category: 'word',
    handler: wordSetPageMargins
  },
  {
    name: 'word_get_page_margins',
    description: '获取 Word 文档的页边距',
    category: 'word',
    handler: wordGetPageMargins
  },
  {
    name: 'word_set_page_orientation',
    description: '设置 Word 文档的页面方向',
    category: 'word',
    handler: wordSetPageOrientation
  },
  {
    name: 'word_get_page_orientation',
    description: '获取 Word 文档的页面方向',
    category: 'word',
    handler: wordGetPageOrientation
  },
  {
    name: 'word_set_page_size',
    description: '设置 Word 文档的页面大小',
    category: 'word',
    handler: wordSetPageSize
  },
  {
    name: 'word_get_page_size',
    description: '获取 Word 文档的页面大小',
    category: 'word',
    handler: wordGetPageSize
  }
]
