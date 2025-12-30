/**
 * Word 高级文本操作工具
 * 包含：word_delete_text, word_select_text_range, word_clear_formatting,
 *       word_copy_text, word_cut_text, word_paste_text
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

/**
 * 删除文本
 */
async function wordDeleteText(args: Record<string, any>): Promise<FunctionResult> {
  const { searchText, startPosition, endPosition, deleteAll = false } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      if (searchText) {
        const searchResults = context.document.body.search(searchText, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          resolve({ success: false, message: `未找到 "${searchText}"` })
          return
        }

        if (deleteAll) {
          for (const item of searchResults.items) {
            item.delete()
          }
          await context.sync()
          resolve({
            success: true,
            message: `已删除 ${searchResults.items.length} 处 "${searchText}"`,
            data: { deletedCount: searchResults.items.length, searchText }
          })
        } else {
          searchResults.items[0].delete()
          await context.sync()
          resolve({
            success: true,
            message: `已删除第一处 "${searchText}"`,
            data: { deletedCount: 1, searchText }
          })
        }
      } else if (startPosition !== undefined && endPosition !== undefined) {
        // 按位置删除 - 需要通过段落和字符偏移实现
        const body = context.document.body
        body.load('text')
        await context.sync()

        // Office.js 不直接支持按字符位置删除，使用替代方案
        resolve({
          success: false,
          message: '按位置删除功能需要通过搜索文本实现，请提供 searchText 参数'
        })
      } else {
        // 删除选中内容
        const selection = context.document.getSelection()
        selection.load('text')
        await context.sync()

        if (!selection.text || selection.text.length === 0) {
          resolve({ success: false, message: '请先选择要删除的文本或提供 searchText 参数' })
          return
        }

        const deletedLength = selection.text.length
        selection.delete()
        await context.sync()

        resolve({
          success: true,
          message: '已删除选中的文本',
          data: { deletedLength }
        })
      }
    }).catch((error) => {
      resolve({
        success: false,
        message: `删除文本失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 选择文本范围
 */
async function wordSelectTextRange(args: Record<string, any>): Promise<FunctionResult> {
  const { searchText, startPosition, endPosition, paragraphIndex } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      if (searchText) {
        const searchResults = context.document.body.search(searchText, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          resolve({ success: false, message: `未找到 "${searchText}"` })
          return
        }

        searchResults.items[0].select()
        await context.sync()

        resolve({
          success: true,
          message: `已选中 "${searchText}"`,
          data: { searchText, matchCount: searchResults.items.length }
        })
      } else if (paragraphIndex !== undefined) {
        const paragraphs = context.document.body.paragraphs
        paragraphs.load('items')
        await context.sync()

        if (paragraphIndex < 0 || paragraphIndex >= paragraphs.items.length) {
          resolve({ success: false, message: `段落索引超出范围: ${paragraphIndex}` })
          return
        }

        paragraphs.items[paragraphIndex].select()
        await context.sync()

        resolve({
          success: true,
          message: `已选中第 ${paragraphIndex + 1} 个段落`,
          data: { paragraphIndex }
        })
      } else if (startPosition !== undefined && endPosition !== undefined) {
        // Office.js 不直接支持按字符位置选择
        resolve({
          success: false,
          message: '按字符位置选择功能暂不支持，请使用 searchText 或 paragraphIndex 参数'
        })
      } else {
        resolve({ success: false, message: '请提供 searchText、paragraphIndex 或位置参数' })
      }
    }).catch((error) => {
      resolve({
        success: false,
        message: `选择文本失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 清除格式
 */
async function wordClearFormatting(args: Record<string, any>): Promise<FunctionResult> {
  const { searchText, startPosition, endPosition, clearAll = true } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      let targetRange: Word.Range

      if (searchText) {
        const searchResults = context.document.body.search(searchText, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          resolve({ success: false, message: `未找到 "${searchText}"` })
          return
        }

        // 清除所有匹配的格式
        for (const item of searchResults.items) {
          item.font.bold = false
          item.font.italic = false
          item.font.underline = 'None' as any
          item.font.strikeThrough = false
          item.font.subscript = false
          item.font.superscript = false
          item.font.color = 'black'
          item.font.highlightColor = 'None' as any
        }
        await context.sync()

        resolve({
          success: true,
          message: `已清除 ${searchResults.items.length} 处文本的格式`,
          data: { clearedCount: searchResults.items.length }
        })
      } else {
        // 清除选中内容的格式
        const selection = context.document.getSelection()
        selection.load('text')
        await context.sync()

        if (!selection.text || selection.text.length === 0) {
          resolve({ success: false, message: '请先选择要清除格式的文本或提供 searchText 参数' })
          return
        }

        selection.font.bold = false
        selection.font.italic = false
        selection.font.underline = 'None' as any
        selection.font.strikeThrough = false
        selection.font.subscript = false
        selection.font.superscript = false
        selection.font.color = 'black'
        selection.font.highlightColor = 'None' as any
        await context.sync()

        resolve({
          success: true,
          message: '已清除选中文本的格式',
          data: { clearedLength: selection.text.length }
        })
      }
    }).catch((error) => {
      resolve({
        success: false,
        message: `清除格式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 复制文本 - 使用内部缓存实现
 */
let internalClipboard: { text: string; html?: string } | null = null

async function wordCopyText(args: Record<string, any>): Promise<FunctionResult> {
  const { searchText, startPosition, endPosition } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      let textToCopy: string = ''

      if (searchText) {
        const searchResults = context.document.body.search(searchText, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          resolve({ success: false, message: `未找到 "${searchText}"` })
          return
        }

        searchResults.items[0].load('text')
        await context.sync()
        textToCopy = searchResults.items[0].text
      } else {
        // 复制选中内容
        const selection = context.document.getSelection()
        selection.load('text')
        await context.sync()

        if (!selection.text || selection.text.length === 0) {
          resolve({ success: false, message: '请先选择要复制的文本或提供 searchText 参数' })
          return
        }

        textToCopy = selection.text
      }

      // 保存到内部剪贴板
      internalClipboard = { text: textToCopy }

      resolve({
        success: true,
        message: '文本已复制',
        data: { copiedLength: textToCopy.length, preview: textToCopy.substring(0, 50) }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `复制文本失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 剪切文本 - 使用内部缓存实现
 */
async function wordCutText(args: Record<string, any>): Promise<FunctionResult> {
  const { searchText, startPosition, endPosition } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      let textToCut: string = ''

      if (searchText) {
        const searchResults = context.document.body.search(searchText, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          resolve({ success: false, message: `未找到 "${searchText}"` })
          return
        }

        searchResults.items[0].load('text')
        await context.sync()
        textToCut = searchResults.items[0].text

        // 删除文本
        searchResults.items[0].delete()
        await context.sync()
      } else {
        // 剪切选中内容
        const selection = context.document.getSelection()
        selection.load('text')
        await context.sync()

        if (!selection.text || selection.text.length === 0) {
          resolve({ success: false, message: '请先选择要剪切的文本或提供 searchText 参数' })
          return
        }

        textToCut = selection.text
        selection.delete()
        await context.sync()
      }

      // 保存到内部剪贴板
      internalClipboard = { text: textToCut }

      resolve({
        success: true,
        message: '文本已剪切',
        data: { cutLength: textToCut.length, preview: textToCut.substring(0, 50) }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `剪切文本失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 粘贴文本 - 使用内部缓存实现
 */
async function wordPasteText(args: Record<string, any>): Promise<FunctionResult> {
  const { location = 'cursor', position, pasteFormat = 'keepSource' } = args

  if (!internalClipboard || !internalClipboard.text) {
    return { success: false, message: '剪贴板为空，请先使用 word_copy_text 或 word_cut_text' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const textToPaste = internalClipboard!.text
      let insertLocation: Word.InsertLocation

      switch (location) {
        case 'start':
          context.document.body.insertText(textToPaste, Word.InsertLocation.start)
          break
        case 'end':
          context.document.body.insertText(textToPaste, Word.InsertLocation.end)
          break
        case 'cursor':
        default:
          const selection = context.document.getSelection()
          selection.insertText(textToPaste, Word.InsertLocation.replace)
          break
      }

      await context.sync()

      resolve({
        success: true,
        message: '文本已粘贴',
        data: { pastedLength: textToPaste.length, location }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `粘贴文本失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出高级文本工具定义
 */
export const advancedTextTools: ToolDefinition[] = [
  { name: 'word_delete_text', handler: wordDeleteText, category: 'text', description: '删除文本' },
  { name: 'word_select_text_range', handler: wordSelectTextRange, category: 'text', description: '选择文本范围' },
  { name: 'word_clear_formatting', handler: wordClearFormatting, category: 'formatting', description: '清除格式' },
  { name: 'word_copy_text', handler: wordCopyText, category: 'text', description: '复制文本' },
  { name: 'word_cut_text', handler: wordCutText, category: 'text', description: '剪切文本' },
  { name: 'word_paste_text', handler: wordPasteText, category: 'text', description: '粘贴文本' }
]
