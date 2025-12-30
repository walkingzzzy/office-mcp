/**
 * Word 高级样式工具
 * 包含：word_create_style, word_list_styles, word_apply_list_style, word_set_line_spacing,
 *       word_set_background_color, word_apply_theme, word_reset_style, word_copy_format
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

/**
 * 创建样式
 * 注意：Office.js 目前不支持直接创建自定义样式，使用替代方案
 */
async function wordCreateStyle(args: Record<string, any>): Promise<FunctionResult> {
  const { styleName, styleType = 'paragraph', fontName, fontSize, bold, italic, color } = args

  if (!styleName) {
    return { success: false, message: 'styleName 参数不能为空' }
  }

  // Office.js 不支持创建自定义样式，但可以通过应用格式来模拟
  return {
    success: false,
    message: `word_create_style: Office.js API 不支持创建自定义样式。建议使用 word_apply_style 应用内置样式，或使用格式化工具直接设置文本格式。`,
    data: {
      suggestion: '可使用以下替代方案：',
      alternatives: [
        '使用 word_set_font 设置字体',
        '使用 word_set_font_size 设置字号',
        '使用 word_set_bold/italic 设置粗体/斜体',
        '使用 word_apply_style 应用内置样式如 "Heading 1"'
      ]
    }
  }
}

/**
 * 列出样式
 */
async function wordListStyles(args: Record<string, any>): Promise<FunctionResult> {
  const { styleType = 'all', builtInOnly = false } = args

  // Office.js 内置样式列表
  const builtInStyles = {
    paragraph: [
      'Normal', 'Title', 'Subtitle', 
      'Heading 1', 'Heading 2', 'Heading 3', 'Heading 4', 'Heading 5', 'Heading 6',
      'Quote', 'Intense Quote', 'List Paragraph', 'No Spacing',
      'TOC Heading', 'Header', 'Footer'
    ],
    character: [
      'Strong', 'Emphasis', 'Subtle Emphasis', 'Intense Emphasis',
      'Subtle Reference', 'Intense Reference', 'Book Title'
    ]
  }

  let styles: string[] = []

  if (styleType === 'all' || styleType === 'paragraph') {
    styles = styles.concat(builtInStyles.paragraph)
  }
  if (styleType === 'all' || styleType === 'character') {
    styles = styles.concat(builtInStyles.character)
  }

  return {
    success: true,
    message: '返回可用样式列表',
    data: {
      styles,
      count: styles.length,
      styleType,
      note: 'Office.js API 不支持获取文档自定义样式，此处返回内置样式列表'
    }
  }
}

/**
 * 应用列表样式
 */
async function wordApplyListStyle(args: Record<string, any>): Promise<FunctionResult> {
  const { listType, listStyle, startIndex, endIndex, paragraphIndex } = args

  if (!listType) {
    return { success: false, message: 'listType 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      let targetParagraphs: Word.Paragraph[] = []

      if (startIndex !== undefined && endIndex !== undefined) {
        const paragraphs = context.document.body.paragraphs
        paragraphs.load('items')
        await context.sync()

        for (let i = startIndex; i <= endIndex && i < paragraphs.items.length; i++) {
          if (i >= 0) {
            targetParagraphs.push(paragraphs.items[i])
          }
        }
      } else if (paragraphIndex !== undefined) {
        const paragraphs = context.document.body.paragraphs
        paragraphs.load('items')
        await context.sync()

        if (paragraphIndex >= 0 && paragraphIndex < paragraphs.items.length) {
          targetParagraphs = [paragraphs.items[paragraphIndex]]
        }
      } else {
        const selection = context.document.getSelection()
        const paragraphs = selection.paragraphs
        paragraphs.load('items')
        await context.sync()
        targetParagraphs = paragraphs.items
      }

      if (targetParagraphs.length === 0) {
        resolve({ success: false, message: '未找到目标段落' })
        return
      }

      // 根据列表类型设置样式
      for (const paragraph of targetParagraphs) {
        if (listType === 'bullet') {
          paragraph.style = 'List Paragraph'
          // 设置项目符号列表
          paragraph.listItem?.load()
        } else if (listType === 'number') {
          paragraph.style = 'List Paragraph'
        } else if (listType === 'none') {
          paragraph.style = 'Normal'
        }
      }

      await context.sync()

      resolve({
        success: true,
        message: `已应用 ${listType} 列表样式到 ${targetParagraphs.length} 个段落`,
        data: { listType, affectedParagraphs: targetParagraphs.length }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `应用列表样式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置行距
 */
async function wordSetLineSpacing(args: Record<string, any>): Promise<FunctionResult> {
  const { spacing, paragraphIndex, startIndex, endIndex } = args

  if (spacing === undefined) {
    return { success: false, message: 'spacing 参数不能为空' }
  }

  // 转换行距倍数到磅值 (单倍行距约 12 磅)
  const lineSpacingInPoints = spacing * 12

  return new Promise((resolve) => {
    Word.run(async (context) => {
      let targetParagraphs: Word.Paragraph[] = []
      const paragraphs = context.document.body.paragraphs
      paragraphs.load('items')
      await context.sync()

      // 🆕 处理 endIndex: -1 表示"到最后"的情况
      const effectiveEndIndex = endIndex === -1 ? paragraphs.items.length - 1 : endIndex

      if (startIndex !== undefined && endIndex !== undefined) {
        for (let i = startIndex; i <= effectiveEndIndex && i < paragraphs.items.length; i++) {
          if (i >= 0) {
            targetParagraphs.push(paragraphs.items[i])
          }
        }
      } else if (paragraphIndex !== undefined) {
        if (paragraphIndex >= 0 && paragraphIndex < paragraphs.items.length) {
          targetParagraphs = [paragraphs.items[paragraphIndex]]
        }
      } else {
        // 应用到选中的段落或全部段落
        const selection = context.document.getSelection()
        const selectionParagraphs = selection.paragraphs
        selectionParagraphs.load('items')
        await context.sync()
        
        if (selectionParagraphs.items.length > 0) {
          targetParagraphs = selectionParagraphs.items
        } else {
          // 应用到全文
          targetParagraphs = paragraphs.items
        }
      }

      if (targetParagraphs.length === 0) {
        resolve({ success: false, message: '未找到目标段落' })
        return
      }

      for (const paragraph of targetParagraphs) {
        paragraph.lineSpacing = lineSpacingInPoints
      }

      await context.sync()

      resolve({
        success: true,
        message: `行距已设置为 ${spacing} 倍`,
        data: { spacing, lineSpacingInPoints, affectedParagraphs: targetParagraphs.length }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置行距失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置背景色 (文本高亮)
 */
async function wordSetBackgroundColor(args: Record<string, any>): Promise<FunctionResult> {
  const { backgroundColor, searchText, paragraphIndex, startPosition, endPosition } = args

  if (!backgroundColor) {
    return { success: false, message: 'backgroundColor 参数不能为空' }
  }

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

        for (const result of searchResults.items) {
          if (backgroundColor === 'none' || backgroundColor === 'None') {
            result.font.highlightColor = 'None' as any
          } else {
            result.font.highlightColor = backgroundColor as any
          }
        }
        await context.sync()

        resolve({
          success: true,
          message: `已设置 ${searchResults.items.length} 处文本的背景色`,
          data: { backgroundColor, count: searchResults.items.length }
        })
      } else if (paragraphIndex !== undefined) {
        const paragraphs = context.document.body.paragraphs
        paragraphs.load('items')
        await context.sync()

        if (paragraphIndex < 0 || paragraphIndex >= paragraphs.items.length) {
          resolve({ success: false, message: `段落索引超出范围: ${paragraphIndex}` })
          return
        }

        const paragraph = paragraphs.items[paragraphIndex]
        if (backgroundColor === 'none' || backgroundColor === 'None') {
          paragraph.font.highlightColor = 'None' as any
        } else {
          paragraph.font.highlightColor = backgroundColor as any
        }
        await context.sync()

        resolve({
          success: true,
          message: '段落背景色已设置',
          data: { backgroundColor, paragraphIndex }
        })
      } else {
        // 设置选中文本的背景色
        const selection = context.document.getSelection()
        selection.load('text')
        await context.sync()

        if (!selection.text || selection.text.length === 0) {
          resolve({ success: false, message: '请先选择文本或提供 searchText/paragraphIndex 参数' })
          return
        }

        if (backgroundColor === 'none' || backgroundColor === 'None') {
          selection.font.highlightColor = 'None' as any
        } else {
          selection.font.highlightColor = backgroundColor as any
        }
        await context.sync()

        resolve({
          success: true,
          message: '选中文本背景色已设置',
          data: { backgroundColor }
        })
      }
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置背景色失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 应用主题
 */
async function wordApplyTheme(args: Record<string, any>): Promise<FunctionResult> {
  const { themeName, colorScheme, fontScheme } = args

  if (!themeName) {
    return { success: false, message: 'themeName 参数不能为空' }
  }

  // Office.js 不支持直接设置文档主题
  return {
    success: false,
    message: `word_apply_theme: Office.js API 不支持直接应用文档主题。请在 Word 中使用"设计"选项卡手动设置主题。`,
    data: {
      requestedTheme: themeName,
      colorScheme,
      fontScheme,
      suggestion: '您可以使用格式化工具（如 word_set_font、word_set_font_color）来手动应用类似的格式效果'
    }
  }
}

/**
 * 重置样式
 */
async function wordResetStyle(args: Record<string, any>): Promise<FunctionResult> {
  const { searchText, paragraphIndex, startPosition, endPosition, resetAll = false } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      let targetItems: (Word.Paragraph | Word.Range)[] = []

      if (resetAll) {
        const paragraphs = context.document.body.paragraphs
        paragraphs.load('items')
        await context.sync()
        targetItems = paragraphs.items
      } else if (searchText) {
        const searchResults = context.document.body.search(searchText, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          resolve({ success: false, message: `未找到 "${searchText}"` })
          return
        }

        // 获取包含搜索结果的段落
        for (const result of searchResults.items) {
          const paragraph = result.paragraphs.getFirst()
          targetItems.push(paragraph)
        }
      } else if (paragraphIndex !== undefined) {
        const paragraphs = context.document.body.paragraphs
        paragraphs.load('items')
        await context.sync()

        if (paragraphIndex < 0 || paragraphIndex >= paragraphs.items.length) {
          resolve({ success: false, message: `段落索引超出范围: ${paragraphIndex}` })
          return
        }

        targetItems = [paragraphs.items[paragraphIndex]]
      } else {
        const selection = context.document.getSelection()
        const paragraphs = selection.paragraphs
        paragraphs.load('items')
        await context.sync()

        if (paragraphs.items.length === 0) {
          resolve({ success: false, message: '请先选择文本或提供参数' })
          return
        }

        targetItems = paragraphs.items
      }

      // 重置为 Normal 样式
      for (const item of targetItems) {
        if ('style' in item) {
          (item as Word.Paragraph).style = 'Normal'
        }
      }

      await context.sync()

      resolve({
        success: true,
        message: `已将 ${targetItems.length} 个段落重置为 Normal 样式`,
        data: { resetCount: targetItems.length }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `重置样式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 复制格式 (格式刷)
 */
async function wordCopyFormat(args: Record<string, any>): Promise<FunctionResult> {
  const { sourceText, targetText, sourceStart, sourceEnd, targetStart, targetEnd } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      // 查找源文本
      let sourceRange: Word.Range | null = null
      let targetRanges: Word.Range[] = []

      if (sourceText) {
        const sourceResults = context.document.body.search(sourceText, { matchCase: false })
        sourceResults.load('items')
        await context.sync()

        if (sourceResults.items.length === 0) {
          resolve({ success: false, message: `未找到源文本 "${sourceText}"` })
          return
        }

        sourceRange = sourceResults.items[0]
      } else {
        // 使用选中文本作为源
        sourceRange = context.document.getSelection()
      }

      // 加载源格式
      sourceRange.font.load('bold,italic,underline,strikeThrough,subscript,superscript,size,name,color,highlightColor')
      await context.sync()

      // 查找目标文本
      if (targetText) {
        const targetResults = context.document.body.search(targetText, { matchCase: false })
        targetResults.load('items')
        await context.sync()

        if (targetResults.items.length === 0) {
          resolve({ success: false, message: `未找到目标文本 "${targetText}"` })
          return
        }

        targetRanges = targetResults.items
      } else {
        resolve({ success: false, message: '请提供 targetText 参数指定要应用格式的文本' })
        return
      }

      // 复制格式到目标
      const sourceFont = sourceRange.font
      for (const target of targetRanges) {
        target.font.bold = sourceFont.bold
        target.font.italic = sourceFont.italic
        target.font.underline = sourceFont.underline
        target.font.strikeThrough = sourceFont.strikeThrough
        target.font.subscript = sourceFont.subscript
        target.font.superscript = sourceFont.superscript
        target.font.size = sourceFont.size
        target.font.name = sourceFont.name
        target.font.color = sourceFont.color
        target.font.highlightColor = sourceFont.highlightColor
      }

      await context.sync()

      resolve({
        success: true,
        message: `已将格式从 "${sourceText}" 复制到 ${targetRanges.length} 处 "${targetText}"`,
        data: { 
          sourceText, 
          targetText, 
          affectedCount: targetRanges.length,
          copiedFormat: {
            bold: sourceFont.bold,
            italic: sourceFont.italic,
            fontSize: sourceFont.size,
            fontName: sourceFont.name
          }
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `复制格式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出高级样式工具定义
 */
export const advancedStyleTools: ToolDefinition[] = [
  { name: 'word_create_style', handler: wordCreateStyle, category: 'style', description: '创建样式' },
  { name: 'word_list_styles', handler: wordListStyles, category: 'style', description: '列出样式' },
  { name: 'word_apply_list_style', handler: wordApplyListStyle, category: 'style', description: '应用列表样式' },
  { name: 'word_set_line_spacing', handler: wordSetLineSpacing, category: 'style', description: '设置行距' },
  { name: 'word_set_background_color', handler: wordSetBackgroundColor, category: 'style', description: '设置背景色' },
  { name: 'word_apply_theme', handler: wordApplyTheme, category: 'style', description: '应用主题' },
  { name: 'word_reset_style', handler: wordResetStyle, category: 'style', description: '重置样式' },
  { name: 'word_copy_format', handler: wordCopyFormat, category: 'style', description: '复制格式' }
]
