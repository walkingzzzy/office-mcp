/**
 * Word 格式化操作工具
 * 包含：word_format_text, word_set_paragraph_alignment, word_set_paragraph_indent,
 *       word_set_paragraph_spacing, word_set_font, word_set_font_color,
 *       word_set_bold, word_set_italic, word_set_underline, word_set_font_size, word_set_font_name
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

/**
 * 格式化文本
 */
async function wordFormatText(args: Record<string, any>): Promise<FunctionResult> {
  const { bold, italic, underline, size, fontSize, name, fontName, color } = args
  const actualSize = size || fontSize
  const actualName = name || fontName

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const selection = context.document.getSelection()
      selection.load('text')
      await context.sync()

      if (!selection.text || selection.text.length === 0) {
        resolve({ success: false, message: '请先选择要格式化的文本' })
        return
      }

      const font = selection.font
      if (bold !== undefined) font.bold = bold
      if (italic !== undefined) font.italic = italic
      if (underline !== undefined) font.underline = underline ? 'Single' : 'None'
      if (actualSize !== undefined) font.size = actualSize
      if (actualName !== undefined) font.name = actualName
      if (color !== undefined) font.color = color

      await context.sync()

      resolve({
        success: true,
        message: '文本格式化成功',
        data: { formattedLength: selection.text.length }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `格式化文本失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置段落对齐
 */
async function wordSetParagraphAlignment(args: Record<string, any>): Promise<FunctionResult> {
  const { alignment, index } = args
  if (!alignment) {
    return { success: false, message: 'alignment 参数不能为空' }
  }

  const alignmentMap: Record<string, Word.Alignment> = {
    left: Word.Alignment.left,
    center: Word.Alignment.centered,
    right: Word.Alignment.right,
    justify: Word.Alignment.justified
  }

  const wordAlignment = alignmentMap[alignment.toLowerCase()]
  if (!wordAlignment) {
    return { success: false, message: `不支持的对齐方式: ${alignment}` }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      if (typeof index === 'number') {
        const allParagraphs = context.document.body.paragraphs
        allParagraphs.load('items')
        await context.sync()

        if (index < 0 || index >= allParagraphs.items.length) {
          resolve({
            success: false,
            message: `段落索引超出范围: ${index}，文档共有 ${allParagraphs.items.length} 个段落`
          })
          return
        }

        allParagraphs.items[index].alignment = wordAlignment
        await context.sync()

        resolve({
          success: true,
          message: '段落对齐设置成功',
          data: { alignment, index, affectedParagraphs: 1 }
        })
      } else {
        const selection = context.document.getSelection()
        const paragraphs = selection.paragraphs
        paragraphs.load('items')
        await context.sync()

        paragraphs.items.forEach((p) => {
          p.alignment = wordAlignment
        })
        await context.sync()

        resolve({
          success: true,
          message: '段落对齐设置成功',
          data: { alignment, affectedParagraphs: paragraphs.items.length }
        })
      }
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置段落对齐失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置段落缩进
 */
async function wordSetParagraphIndent(args: Record<string, any>): Promise<FunctionResult> {
  const { index, leftIndent, rightIndent, firstLineIndent } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const allParagraphs = context.document.body.paragraphs
      allParagraphs.load('items')
      await context.sync()

      let targetParagraphs: Word.Paragraph[] = []
      
      if (typeof index === 'number') {
        if (index < 0 || index >= allParagraphs.items.length) {
          resolve({
            success: false,
            message: `段落索引超出范围: ${index}，文档共有 ${allParagraphs.items.length} 个段落`
          })
          return
        }
        targetParagraphs = [allParagraphs.items[index]]
      } else {
        targetParagraphs = allParagraphs.items
      }

      targetParagraphs.forEach((p) => {
        if (typeof leftIndent === 'number') {
          p.leftIndent = leftIndent
        }
        if (typeof rightIndent === 'number') {
          p.rightIndent = rightIndent
        }
        if (typeof firstLineIndent === 'number') {
          p.firstLineIndent = firstLineIndent
        }
      })
      await context.sync()

      resolve({
        success: true,
        message: '段落缩进设置成功',
        data: {
          affectedParagraphs: targetParagraphs.length,
          leftIndent,
          rightIndent,
          firstLineIndent,
          index: typeof index === 'number' ? index : 'all'
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置段落缩进失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置段落间距
 */
async function wordSetParagraphSpacing(args: Record<string, any>): Promise<FunctionResult> {
  const { index, spaceBefore, spaceAfter, lineSpacing } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const allParagraphs = context.document.body.paragraphs
      allParagraphs.load('items')
      await context.sync()

      let targetParagraphs: Word.Paragraph[] = []
      
      if (typeof index === 'number') {
        if (index < 0 || index >= allParagraphs.items.length) {
          resolve({
            success: false,
            message: `段落索引超出范围: ${index}，文档共有 ${allParagraphs.items.length} 个段落`
          })
          return
        }
        targetParagraphs = [allParagraphs.items[index]]
      } else {
        targetParagraphs = allParagraphs.items
      }

      targetParagraphs.forEach((p) => {
        if (typeof spaceBefore === 'number') {
          p.spaceBefore = spaceBefore
        }
        if (typeof spaceAfter === 'number') {
          p.spaceAfter = spaceAfter
        }
        if (typeof lineSpacing === 'number') {
          p.lineSpacing = lineSpacing
        }
      })
      await context.sync()

      resolve({
        success: true,
        message: '段落间距设置成功',
        data: {
          affectedParagraphs: targetParagraphs.length,
          spaceBefore,
          spaceAfter,
          lineSpacing,
          index: typeof index === 'number' ? index : 'all'
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置段落间距失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置字体
 */
async function wordSetFont(args: Record<string, any>): Promise<FunctionResult> {
  const { name, fontName, size, fontSize, bold, italic, underline, color, searchText } = args
  const actualFontName = name || fontName
  const actualSize = size || fontSize

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
          const font = result.font
          if (actualFontName) font.name = actualFontName
          if (actualSize) font.size = actualSize
          if (bold !== undefined) font.bold = bold
          if (italic !== undefined) font.italic = italic
          if (underline !== undefined) font.underline = underline ? 'Single' : 'None'
          if (color) font.color = color
        }
      } else {
        const targetRange = context.document.getSelection()
        targetRange.load('text')
        await context.sync()

        if (!targetRange.text || targetRange.text.length === 0) {
          resolve({ success: false, message: '请先选择要设置字体的文本' })
          return
        }

        const font = targetRange.font
        if (actualFontName) font.name = actualFontName
        if (actualSize) font.size = actualSize
        if (bold !== undefined) font.bold = bold
        if (italic !== undefined) font.italic = italic
        if (underline !== undefined) font.underline = underline ? 'Single' : 'None'
        if (color) font.color = color
      }

      await context.sync()

      resolve({
        success: true,
        message: '字体设置成功',
        data: { name: actualFontName, size: actualSize, bold, italic, underline, color }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置字体失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置字体颜色
 */
async function wordSetFontColor(args: Record<string, any>): Promise<FunctionResult> {
  const { color, searchText, paragraphIndex } = args

  if (!color) {
    return { success: false, message: 'color 参数不能为空' }
  }

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

        const targetRange = paragraphs.items[paragraphIndex].getRange()
        targetRange.font.color = color
        await context.sync()

        resolve({
          success: true,
          message: '字体颜色设置成功',
          data: { color }
        })
      } else if (searchText) {
        const searchResults = context.document.body.search(searchText, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          resolve({ success: false, message: `未找到包含 "${searchText}" 的文本` })
          return
        }

        for (const result of searchResults.items) {
          result.font.color = color
        }
        await context.sync()

        resolve({
          success: true,
          message: '字体颜色设置成功',
          data: { color, matchCount: searchResults.items.length }
        })
      } else {
        const targetRange = context.document.getSelection()
        targetRange.load('text')
        await context.sync()

        if (!targetRange.text || targetRange.text.length === 0) {
          resolve({ success: false, message: '请先选择要设置颜色的文本，或提供 searchText/paragraphIndex 参数' })
          return
        }

        targetRange.font.color = color
        await context.sync()

        resolve({
          success: true,
          message: '字体颜色设置成功',
          data: { color }
        })
      }
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置字体颜色失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置加粗
 */
async function wordSetBold(args: Record<string, any>): Promise<FunctionResult> {
  const { bold = true, searchText, paragraphIndex } = args

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

        paragraphs.items[paragraphIndex].font.bold = bold
      } else if (searchText) {
        const searchResults = context.document.body.search(searchText, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          resolve({ success: false, message: `未找到包含 "${searchText}" 的文本` })
          return
        }

        for (const result of searchResults.items) {
          result.font.bold = bold
        }
      } else {
        const selection = context.document.getSelection()
        selection.load('text')
        await context.sync()

        if (!selection.text || selection.text.length === 0) {
          resolve({ success: false, message: '请先选择要加粗的文本' })
          return
        }

        selection.font.bold = bold
      }

      await context.sync()

      resolve({
        success: true,
        message: bold ? '已设置加粗' : '已取消加粗',
        data: { bold }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置加粗失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置斜体
 */
async function wordSetItalic(args: Record<string, any>): Promise<FunctionResult> {
  const { italic = true, searchText, paragraphIndex } = args

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

        paragraphs.items[paragraphIndex].font.italic = italic
      } else if (searchText) {
        const searchResults = context.document.body.search(searchText, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          resolve({ success: false, message: `未找到包含 "${searchText}" 的文本` })
          return
        }

        for (const result of searchResults.items) {
          result.font.italic = italic
        }
      } else {
        const selection = context.document.getSelection()
        selection.load('text')
        await context.sync()

        if (!selection.text || selection.text.length === 0) {
          resolve({ success: false, message: '请先选择要设置斜体的文本' })
          return
        }

        selection.font.italic = italic
      }

      await context.sync()

      resolve({
        success: true,
        message: italic ? '已设置斜体' : '已取消斜体',
        data: { italic }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置斜体失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置下划线
 */
async function wordSetUnderline(args: Record<string, any>): Promise<FunctionResult> {
  const { underline = true, searchText, paragraphIndex } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const underlineStyle = underline ? 'Single' : 'None'

      if (paragraphIndex !== undefined && paragraphIndex >= 0) {
        const paragraphs = context.document.body.paragraphs
        paragraphs.load('items')
        await context.sync()

        if (paragraphIndex >= paragraphs.items.length) {
          resolve({ success: false, message: `段落索引 ${paragraphIndex} 超出范围` })
          return
        }

        paragraphs.items[paragraphIndex].font.underline = underlineStyle as any
      } else if (searchText) {
        const searchResults = context.document.body.search(searchText, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          resolve({ success: false, message: `未找到包含 "${searchText}" 的文本` })
          return
        }

        for (const result of searchResults.items) {
          result.font.underline = underlineStyle as any
        }
      } else {
        const selection = context.document.getSelection()
        selection.load('text')
        await context.sync()

        if (!selection.text || selection.text.length === 0) {
          resolve({ success: false, message: '请先选择要设置下划线的文本' })
          return
        }

        selection.font.underline = underlineStyle as any
      }

      await context.sync()

      resolve({
        success: true,
        message: underline ? '已添加下划线' : '已移除下划线',
        data: { underline }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置下划线失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置字号
 */
async function wordSetFontSize(args: Record<string, any>): Promise<FunctionResult> {
  const { fontSize, size, searchText, paragraphIndex } = args
  const actualSize = fontSize || size

  if (!actualSize || typeof actualSize !== 'number') {
    return { success: false, message: 'fontSize 参数不能为空且必须是数字' }
  }

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

        paragraphs.items[paragraphIndex].font.size = actualSize
      } else if (searchText) {
        const searchResults = context.document.body.search(searchText, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          resolve({ success: false, message: `未找到包含 "${searchText}" 的文本` })
          return
        }

        for (const result of searchResults.items) {
          result.font.size = actualSize
        }
      } else {
        const selection = context.document.getSelection()
        selection.load('text')
        await context.sync()

        if (!selection.text || selection.text.length === 0) {
          resolve({ success: false, message: '请先选择要设置字号的文本' })
          return
        }

        selection.font.size = actualSize
      }

      await context.sync()

      resolve({
        success: true,
        message: '字号设置成功',
        data: { fontSize: actualSize }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置字号失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置字体名称
 */
async function wordSetFontName(args: Record<string, any>): Promise<FunctionResult> {
  const { fontName, name, searchText, paragraphIndex } = args
  const actualFontName = fontName || name

  if (!actualFontName) {
    return { success: false, message: 'fontName 参数不能为空' }
  }

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

        paragraphs.items[paragraphIndex].font.name = actualFontName
      } else if (searchText) {
        const searchResults = context.document.body.search(searchText, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          resolve({ success: false, message: `未找到包含 "${searchText}" 的文本` })
          return
        }

        for (const result of searchResults.items) {
          result.font.name = actualFontName
        }
      } else {
        const selection = context.document.getSelection()
        selection.load('text')
        await context.sync()

        if (!selection.text || selection.text.length === 0) {
          resolve({ success: false, message: '请先选择要设置字体的文本' })
          return
        }

        selection.font.name = actualFontName
      }

      await context.sync()

      resolve({
        success: true,
        message: '字体设置成功',
        data: { fontName: actualFontName }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置字体失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出格式化工具定义
 */
export const formattingTools: ToolDefinition[] = [
  { name: 'word_format_text', handler: wordFormatText, category: 'formatting', description: '格式化文本' },
  { name: 'word_set_paragraph_alignment', handler: wordSetParagraphAlignment, category: 'formatting', description: '设置段落对齐' },
  { name: 'word_set_paragraph_indent', handler: wordSetParagraphIndent, category: 'formatting', description: '设置段落缩进' },
  { name: 'word_set_paragraph_spacing', handler: wordSetParagraphSpacing, category: 'formatting', description: '设置段落间距' },
  { name: 'word_set_font', handler: wordSetFont, category: 'formatting', description: '设置字体' },
  { name: 'word_set_font_color', handler: wordSetFontColor, category: 'formatting', description: '设置字体颜色' },
  { name: 'word_set_bold', handler: wordSetBold, category: 'formatting', description: '设置加粗' },
  { name: 'word_set_italic', handler: wordSetItalic, category: 'formatting', description: '设置斜体' },
  { name: 'word_set_underline', handler: wordSetUnderline, category: 'formatting', description: '设置下划线' },
  { name: 'word_set_font_size', handler: wordSetFontSize, category: 'formatting', description: '设置字号' },
  { name: 'word_set_font_name', handler: wordSetFontName, category: 'formatting', description: '设置字体名称' }
]

