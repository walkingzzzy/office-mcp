/**
 * Word 样式操作工具
 * 包含：word_set_heading, word_apply_style
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'
import Logger from '../../../utils/logger'

const logger = new Logger('WordStyleTools')

/**
 * 设置标题
 */
async function wordSetHeading(args: Record<string, any>): Promise<FunctionResult> {
  const { level, searchText, paragraphIndex, fontName } = args
  
  if (!level || level < 1 || level > 6) {
    return { success: false, message: 'level 参数必须是 1-6 之间的数字' }
  }

  const headingStyleMap: Record<number, string> = {
    1: Word.BuiltInStyleName.heading1,
    2: Word.BuiltInStyleName.heading2,
    3: Word.BuiltInStyleName.heading3,
    4: Word.BuiltInStyleName.heading4,
    5: Word.BuiltInStyleName.heading5,
    6: Word.BuiltInStyleName.heading6
  }
  const styleName = headingStyleMap[level]

  return new Promise((resolve) => {
    Word.run(async (context) => {
      let targetParagraph: Word.Paragraph | null = null

      if (paragraphIndex !== undefined && paragraphIndex >= 0) {
        const paragraphs = context.document.body.paragraphs
        paragraphs.load('items')
        await context.sync()

        if (paragraphIndex >= paragraphs.items.length) {
          resolve({ success: false, message: `段落索引 ${paragraphIndex} 超出范围 (0-${paragraphs.items.length - 1})` })
          return
        }

        targetParagraph = paragraphs.items[paragraphIndex]
        targetParagraph.load('text')
        await context.sync()
      } else if (searchText) {
        const searchResults = context.document.body.search(searchText, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          resolve({ success: false, message: `未找到包含 "${searchText}" 的文本` })
          return
        }

        const firstResult = searchResults.items[0]
        const paragraph = firstResult.paragraphs.getFirst()
        paragraph.load('text')
        await context.sync()
        targetParagraph = paragraph
      } else {
        const selection = context.document.getSelection()
        const paragraphs = selection.paragraphs
        paragraphs.load('items')
        await context.sync()

        if (paragraphs.items.length === 0) {
          resolve({ success: false, message: '请先选择要设置为标题的文本' })
          return
        }

        targetParagraph = paragraphs.items[0]
        targetParagraph.load('text')
        await context.sync()
      }

      if (targetParagraph) {
        logger.info('[StyleTools] 设置标题样式', { 
          level, 
          styleName,
          paragraphText: targetParagraph.text?.substring(0, 50)
        })
        
        targetParagraph.styleBuiltIn = styleName as any

        if (fontName) {
          targetParagraph.font.name = fontName
        }

        await context.sync()

        resolve({
          success: true,
          message: `已将段落设置为标题 ${level}（注意：Word 标题样式会应用到整个段落）`,
          data: { level, styleName, text: targetParagraph.text?.substring(0, 50) }
        })
      } else {
        resolve({ success: false, message: '无法找到目标段落' })
      }
    }).catch((error) => {
      logger.error('[StyleTools] 设置标题失败', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      resolve({
        success: false,
        message: `设置标题失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 应用样式
 */
async function wordApplyStyle(args: Record<string, any>): Promise<FunctionResult> {
  const { styleName, searchText, scope = 'selection' } = args

  if (!styleName) {
    return { success: false, message: 'styleName 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      if (searchText) {
        const searchResults = context.document.body.search(searchText, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          resolve({ success: false, message: `未找到包含 "${searchText}" 的文本` })
          return
        }

        for (const result of searchResults.items) {
          const paragraph = result.paragraphs.getFirst()
          paragraph.style = styleName
        }
      } else if (scope === 'selection') {
        const selection = context.document.getSelection()
        const paragraphs = selection.paragraphs
        paragraphs.load('items')
        await context.sync()

        if (paragraphs.items.length === 0) {
          resolve({ success: false, message: '请先选择要应用样式的文本' })
          return
        }

        for (const p of paragraphs.items) {
          p.style = styleName
        }
      } else if (scope === 'document') {
        const paragraphs = context.document.body.paragraphs
        paragraphs.load('items')
        await context.sync()

        for (const p of paragraphs.items) {
          p.style = styleName
        }
      }

      await context.sync()

      resolve({
        success: true,
        message: `已应用样式 ${styleName}`,
        data: { styleName, scope }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `应用样式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出样式工具定义
 */
export const styleTools: ToolDefinition[] = [
  { name: 'word_set_heading', handler: wordSetHeading, category: 'style', description: '设置标题' },
  { name: 'word_apply_style', handler: wordApplyStyle, category: 'style', description: '应用样式' }
]

