/**
 * Word 书签工具实现
 * 使用 Office.js API (WordApi 1.4+) 实现书签操作
 * P1 阶段功能
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 创建书签
 */
export async function wordCreateBookmark(args: {
  name: string
  text?: string
}): Promise<ToolResult> {
  const { name, text } = args

  try {
    return await Word.run(async (context) => {
      let range: Word.Range

      if (text) {
        // 搜索指定文本并创建书签
        const searchResults = context.document.body.search(text, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          return {
            success: false,
            message: `未找到文本: ${text}`
          }
        }

        range = searchResults.items[0]
      } else {
        // 在当前选区或光标位置创建书签
        range = context.document.getSelection()
      }

      // 创建书签（注意：Office.js 不直接支持书签创建，使用内容控件模拟）
      const contentControl = range.insertContentControl()
      contentControl.tag = `bookmark:${name}`
      contentControl.title = name
      contentControl.appearance = 'BoundingBox'
      contentControl.color = '#FFFF00'

      await context.sync()

      return {
        success: true,
        message: `成功创建书签: ${name}`,
        data: { name, hasText: !!text }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `创建书签失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 删除书签
 */
export async function wordDeleteBookmark(args: {
  name: string
}): Promise<ToolResult> {
  const { name } = args

  try {
    return await Word.run(async (context) => {
      const contentControls = context.document.contentControls
      contentControls.load('items')
      await context.sync()

      let found = false
      for (const cc of contentControls.items) {
        cc.load('tag, title')
        await context.sync()

        if (cc.tag === `bookmark:${name}` || cc.title === name) {
          cc.delete(false) // 保留内容，只删除控件
          found = true
          break
        }
      }

      if (!found) {
        return {
          success: false,
          message: `未找到书签: ${name}`
        }
      }

      await context.sync()

      return {
        success: true,
        message: `成功删除书签: ${name}`,
        data: { name }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `删除书签失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取所有书签
 */
export async function wordGetBookmarks(args: {}): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    return await Word.run(async (context) => {
      const contentControls = context.document.contentControls
      contentControls.load('items')
      await context.sync()

      const bookmarks: Array<{ name: string; text: string }> = []

      for (const cc of contentControls.items) {
        cc.load('tag, title, text')
        await context.sync()

        if (cc.tag && cc.tag.startsWith('bookmark:')) {
          const name = cc.tag.replace('bookmark:', '')
          bookmarks.push({
            name: name || cc.title,
            text: cc.text.substring(0, 50) + (cc.text.length > 50 ? '...' : '')
          })
        }
      }

      return {
        success: true,
        message: `成功获取 ${bookmarks.length} 个书签`,
        data: { bookmarks, count: bookmarks.length }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取书签列表失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 导航到书签
 */
export async function wordGoToBookmark(args: {
  name: string
  select?: boolean
}): Promise<ToolResult> {
  const { name, select = false } = args

  try {
    return await Word.run(async (context) => {
      const contentControls = context.document.contentControls
      contentControls.load('items')
      await context.sync()

      let targetControl: Word.ContentControl | null = null

      for (const cc of contentControls.items) {
        cc.load('tag, title')
        await context.sync()

        if (cc.tag === `bookmark:${name}` || cc.title === name) {
          targetControl = cc
          break
        }
      }

      if (!targetControl) {
        return {
          success: false,
          message: `未找到书签: ${name}`
        }
      }

      if (select) {
        targetControl.select(Word.SelectionMode.select)
      } else {
        targetControl.select(Word.SelectionMode.start)
      }

      await context.sync()

      return {
        success: true,
        message: `成功导航到书签: ${name}`,
        data: { name, selected: select }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `导航到书签失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 更新书签内容
 */
export async function wordUpdateBookmark(args: {
  name: string
  newText: string
}): Promise<ToolResult> {
  const { name, newText } = args

  try {
    return await Word.run(async (context) => {
      const contentControls = context.document.contentControls
      contentControls.load('items')
      await context.sync()

      let targetControl: Word.ContentControl | null = null

      for (const cc of contentControls.items) {
        cc.load('tag, title')
        await context.sync()

        if (cc.tag === `bookmark:${name}` || cc.title === name) {
          targetControl = cc
          break
        }
      }

      if (!targetControl) {
        return {
          success: false,
          message: `未找到书签: ${name}`
        }
      }

      targetControl.insertText(newText, 'Replace')
      await context.sync()

      return {
        success: true,
        message: `成功更新书签内容: ${name}`,
        data: { name, newText: newText.substring(0, 50) }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `更新书签内容失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 检查书签是否存在
 */
export async function wordCheckBookmark(args: {
  name: string
}): Promise<ToolResult> {
  const { name } = args

  try {
    return await Word.run(async (context) => {
      const contentControls = context.document.contentControls
      contentControls.load('items')
      await context.sync()

      let exists = false

      for (const cc of contentControls.items) {
        cc.load('tag, title')
        await context.sync()

        if (cc.tag === `bookmark:${name}` || cc.title === name) {
          exists = true
          break
        }
      }

      return {
        success: true,
        message: exists ? '书签存在' : '书签不存在',
        data: { exists, name }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `检查书签失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 导出书签工具定义
 */
export const bookmarkTools: ToolDefinition[] = [
  { name: 'word_create_bookmark', handler: wordCreateBookmark, category: 'text', description: '创建书签' },
  { name: 'word_delete_bookmark', handler: wordDeleteBookmark, category: 'text', description: '删除书签' },
  { name: 'word_get_bookmarks', handler: wordGetBookmarks, category: 'text', description: '获取所有书签' },
  { name: 'word_goto_bookmark', handler: wordGoToBookmark, category: 'text', description: '导航到书签' },
  { name: 'word_update_bookmark', handler: wordUpdateBookmark, category: 'text', description: '更新书签内容' },
  { name: 'word_check_bookmark', handler: wordCheckBookmark, category: 'text', description: '检查书签是否存在' }
]
