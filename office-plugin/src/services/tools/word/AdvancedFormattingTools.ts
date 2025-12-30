/**
 * Word 高级格式化工具
 * 包含：word_set_highlight, word_set_strikethrough, word_set_subscript, word_set_superscript
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

/**
 * 设置高亮
 */
async function wordSetHighlight(args: Record<string, any>): Promise<FunctionResult> {
  const { color = 'yellow', searchText, paragraphIndex } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      if (paragraphIndex !== undefined && paragraphIndex >= 0) {
        const paragraphs = context.document.body.paragraphs
        paragraphs.load('items')
        await context.sync()

        if (paragraphIndex >= paragraphs.items.length) {
          resolve({ success: false, message: `段落索引 ${paragraphIndex} 超出范围` })
          return
        }

        paragraphs.items[paragraphIndex].font.highlightColor = color as any
      } else if (searchText) {
        const searchResults = context.document.body.search(searchText, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          resolve({ success: false, message: `未找到包含 "${searchText}" 的文本` })
          return
        }

        for (const result of searchResults.items) {
          result.font.highlightColor = color as any
        }
      } else {
        const selection = context.document.getSelection()
        selection.load('text')
        await context.sync()

        if (!selection.text || selection.text.length === 0) {
          resolve({ success: false, message: '请先选择要设置高亮的文本' })
          return
        }

        selection.font.highlightColor = color as any
      }

      await context.sync()

      resolve({
        success: true,
        message: '高亮设置成功',
        data: { color }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置高亮失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置删除线
 */
async function wordSetStrikethrough(args: Record<string, any>): Promise<FunctionResult> {
  const { strikethrough = true, searchText, paragraphIndex } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      if (paragraphIndex !== undefined && paragraphIndex >= 0) {
        const paragraphs = context.document.body.paragraphs
        paragraphs.load('items')
        await context.sync()

        if (paragraphIndex >= paragraphs.items.length) {
          resolve({ success: false, message: `段落索引 ${paragraphIndex} 超出范围` })
          return
        }

        paragraphs.items[paragraphIndex].font.strikeThrough = strikethrough
      } else if (searchText) {
        const searchResults = context.document.body.search(searchText, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          resolve({ success: false, message: `未找到包含 "${searchText}" 的文本` })
          return
        }

        for (const result of searchResults.items) {
          result.font.strikeThrough = strikethrough
        }
      } else {
        const selection = context.document.getSelection()
        selection.load('text')
        await context.sync()

        if (!selection.text || selection.text.length === 0) {
          resolve({ success: false, message: '请先选择要设置删除线的文本' })
          return
        }

        selection.font.strikeThrough = strikethrough
      }

      await context.sync()

      resolve({
        success: true,
        message: strikethrough ? '已添加删除线' : '已移除删除线',
        data: { strikethrough }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置删除线失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置下标
 */
async function wordSetSubscript(args: Record<string, any>): Promise<FunctionResult> {
  const { subscript = true, searchText, paragraphIndex } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      if (paragraphIndex !== undefined && paragraphIndex >= 0) {
        const paragraphs = context.document.body.paragraphs
        paragraphs.load('items')
        await context.sync()

        if (paragraphIndex >= paragraphs.items.length) {
          resolve({ success: false, message: `段落索引 ${paragraphIndex} 超出范围` })
          return
        }

        paragraphs.items[paragraphIndex].font.subscript = subscript
      } else if (searchText) {
        const searchResults = context.document.body.search(searchText, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          resolve({ success: false, message: `未找到包含 "${searchText}" 的文本` })
          return
        }

        for (const result of searchResults.items) {
          result.font.subscript = subscript
        }
      } else {
        const selection = context.document.getSelection()
        selection.load('text')
        await context.sync()

        if (!selection.text || selection.text.length === 0) {
          resolve({ success: false, message: '请先选择要设置下标的文本' })
          return
        }

        selection.font.subscript = subscript
      }

      await context.sync()

      resolve({
        success: true,
        message: subscript ? '已设置下标' : '已取消下标',
        data: { subscript }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置下标失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置上标
 */
async function wordSetSuperscript(args: Record<string, any>): Promise<FunctionResult> {
  const { superscript = true, searchText, paragraphIndex } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      if (paragraphIndex !== undefined && paragraphIndex >= 0) {
        const paragraphs = context.document.body.paragraphs
        paragraphs.load('items')
        await context.sync()

        if (paragraphIndex >= paragraphs.items.length) {
          resolve({ success: false, message: `段落索引 ${paragraphIndex} 超出范围` })
          return
        }

        paragraphs.items[paragraphIndex].font.superscript = superscript
      } else if (searchText) {
        const searchResults = context.document.body.search(searchText, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          resolve({ success: false, message: `未找到包含 "${searchText}" 的文本` })
          return
        }

        for (const result of searchResults.items) {
          result.font.superscript = superscript
        }
      } else {
        const selection = context.document.getSelection()
        selection.load('text')
        await context.sync()

        if (!selection.text || selection.text.length === 0) {
          resolve({ success: false, message: '请先选择要设置上标的文本' })
          return
        }

        selection.font.superscript = superscript
      }

      await context.sync()

      resolve({
        success: true,
        message: superscript ? '已设置上标' : '已取消上标',
        data: { superscript }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置上标失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出高级格式化工具定义
 */
export const advancedFormattingTools: ToolDefinition[] = [
  { name: 'word_set_highlight', handler: wordSetHighlight, category: 'formatting', description: '设置高亮' },
  { name: 'word_set_strikethrough', handler: wordSetStrikethrough, category: 'formatting', description: '设置删除线' },
  { name: 'word_set_subscript', handler: wordSetSubscript, category: 'formatting', description: '设置下标' },
  { name: 'word_set_superscript', handler: wordSetSuperscript, category: 'formatting', description: '设置上标' }
]

