/**
 * Word 段落操作工具
 * 包含：word_delete_paragraph, word_insert_paragraph_at, word_merge_paragraphs,
 *       word_split_paragraph, word_move_paragraph
 * 
 * 注意：word_add_paragraph, word_get_paragraphs, word_set_paragraph_alignment,
 *       word_set_paragraph_indent, word_set_paragraph_spacing 已在其他模块实现
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'
import Logger from '../../../utils/logger'

const logger = new Logger('WordParagraphTools')

/**
 * 删除段落
 */
async function wordDeleteParagraph(args: Record<string, any>): Promise<FunctionResult> {
  const { index } = args

  if (index === undefined || index === null) {
    return { success: false, message: 'index 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const paragraphs = context.document.body.paragraphs
      paragraphs.load('items')
      await context.sync()

      if (index < 0 || index >= paragraphs.items.length) {
        resolve({
          success: false,
          message: `段落索引超出范围: ${index}，文档共有 ${paragraphs.items.length} 个段落`
        })
        return
      }

      paragraphs.items[index].delete()
      await context.sync()

      resolve({
        success: true,
        message: `成功删除第 ${index + 1} 个段落`,
        data: { index }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `删除段落失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 在指定位置插入段落
 */
async function wordInsertParagraphAt(args: Record<string, any>): Promise<FunctionResult> {
  const { text, index, insertLocation = 'after' } = args

  if (!text) {
    return { success: false, message: 'text 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      if (index !== undefined && index !== null) {
        const paragraphs = context.document.body.paragraphs
        paragraphs.load('items')
        await context.sync()

        if (index < 0 || index >= paragraphs.items.length) {
          resolve({
            success: false,
            message: `段落索引超出范围: ${index}，文档共有 ${paragraphs.items.length} 个段落`
          })
          return
        }

        const targetParagraph = paragraphs.items[index]
        const location = insertLocation === 'before' ? Word.InsertLocation.before : Word.InsertLocation.after
        targetParagraph.insertParagraph(text, location)
      } else {
        // 默认在文档末尾插入
        context.document.body.insertParagraph(text, Word.InsertLocation.end)
      }

      await context.sync()

      resolve({
        success: true,
        message: '段落插入成功',
        data: { text: text.substring(0, 50), index, insertLocation }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `插入段落失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 合并段落
 */
async function wordMergeParagraphs(args: Record<string, any>): Promise<FunctionResult> {
  const { startIndex, endIndex } = args

  if (startIndex === undefined || endIndex === undefined) {
    return { success: false, message: 'startIndex 和 endIndex 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const paragraphs = context.document.body.paragraphs
      paragraphs.load('items')
      await context.sync()

      if (startIndex < 0 || endIndex >= paragraphs.items.length || startIndex >= endIndex) {
        resolve({
          success: false,
          message: `段落索引无效: startIndex=${startIndex}, endIndex=${endIndex}, 文档共有 ${paragraphs.items.length} 个段落`
        })
        return
      }

      // 收集所有段落文本
      const texts: string[] = []
      for (let i = startIndex; i <= endIndex; i++) {
        paragraphs.items[i].load('text')
      }
      await context.sync()

      for (let i = startIndex; i <= endIndex; i++) {
        texts.push(paragraphs.items[i].text.trim())
      }

      // 删除除第一个以外的所有段落
      for (let i = endIndex; i > startIndex; i--) {
        paragraphs.items[i].delete()
      }

      // 更新第一个段落的内容
      paragraphs.items[startIndex].insertText(texts.join(' '), Word.InsertLocation.replace)
      await context.sync()

      resolve({
        success: true,
        message: `成功合并 ${endIndex - startIndex + 1} 个段落`,
        data: { startIndex, endIndex, mergedCount: endIndex - startIndex + 1 }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `合并段落失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 拆分段落
 */
async function wordSplitParagraph(args: Record<string, any>): Promise<FunctionResult> {
  const { index, position } = args

  if (index === undefined || position === undefined) {
    return { success: false, message: 'index 和 position 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const paragraphs = context.document.body.paragraphs
      paragraphs.load('items')
      await context.sync()

      if (index < 0 || index >= paragraphs.items.length) {
        resolve({
          success: false,
          message: `段落索引超出范围: ${index}`
        })
        return
      }

      const paragraph = paragraphs.items[index]
      paragraph.load('text')
      await context.sync()

      const text = paragraph.text
      if (position < 0 || position >= text.length) {
        resolve({
          success: false,
          message: `拆分位置无效: ${position}，段落长度为 ${text.length}`
        })
        return
      }

      const firstPart = text.substring(0, position)
      const secondPart = text.substring(position)

      // 更新原段落为第一部分
      paragraph.insertText(firstPart, Word.InsertLocation.replace)
      // 在后面插入新段落
      paragraph.insertParagraph(secondPart, Word.InsertLocation.after)
      await context.sync()

      resolve({
        success: true,
        message: '段落拆分成功',
        data: { index, position, firstPartLength: firstPart.length, secondPartLength: secondPart.length }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `拆分段落失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 移动段落
 */
async function wordMoveParagraph(args: Record<string, any>): Promise<FunctionResult> {
  const { fromIndex, toIndex } = args

  if (fromIndex === undefined || toIndex === undefined) {
    return { success: false, message: 'fromIndex 和 toIndex 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const paragraphs = context.document.body.paragraphs
      paragraphs.load('items')
      await context.sync()

      if (fromIndex < 0 || fromIndex >= paragraphs.items.length ||
          toIndex < 0 || toIndex >= paragraphs.items.length) {
        resolve({
          success: false,
          message: `段落索引超出范围，文档共有 ${paragraphs.items.length} 个段落`
        })
        return
      }

      if (fromIndex === toIndex) {
        resolve({
          success: true,
          message: '段落位置未改变',
          data: { fromIndex, toIndex }
        })
        return
      }

      // 获取要移动的段落文本
      const sourceParagraph = paragraphs.items[fromIndex]
      sourceParagraph.load('text')
      await context.sync()

      const text = sourceParagraph.text

      // 在目标位置插入新段落
      const targetParagraph = paragraphs.items[toIndex]
      const insertLocation = fromIndex < toIndex ? Word.InsertLocation.after : Word.InsertLocation.before
      targetParagraph.insertParagraph(text, insertLocation)

      // 删除原段落
      sourceParagraph.delete()
      await context.sync()

      resolve({
        success: true,
        message: '段落移动成功',
        data: { fromIndex, toIndex }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `移动段落失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出段落工具定义
 */
export const paragraphTools: ToolDefinition[] = [
  { name: 'word_delete_paragraph', handler: wordDeleteParagraph, category: 'text', description: '删除段落' },
  { name: 'word_insert_paragraph_at', handler: wordInsertParagraphAt, category: 'text', description: '在指定位置插入段落' },
  { name: 'word_merge_paragraphs', handler: wordMergeParagraphs, category: 'text', description: '合并段落' },
  { name: 'word_split_paragraph', handler: wordSplitParagraph, category: 'text', description: '拆分段落' },
  { name: 'word_move_paragraph', handler: wordMoveParagraph, category: 'text', description: '移动段落' }
]

