/**
 * Word 超链接和引用操作工具
 * 包含：word_insert_hyperlink, word_remove_hyperlink, word_insert_bookmark,
 *       word_insert_cross_reference, word_insert_footnote, word_insert_endnote,
 *       word_insert_citation, word_insert_bibliography
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

/**
 * 插入超链接
 */
async function wordInsertHyperlink(args: Record<string, any>): Promise<FunctionResult> {
  const { text, url, position = 'cursor' } = args

  if (!url) {
    return { success: false, message: 'url 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      let targetRange: Word.Range

      if (position === 'selection') {
        targetRange = context.document.getSelection()
        targetRange.load('text')
        await context.sync()

        if (targetRange.text && targetRange.text.length > 0) {
          // 为选中的文本添加超链接
          targetRange.hyperlink = url
          await context.sync()

          resolve({
            success: true,
            message: '已为选中文本添加超链接',
            data: { text: targetRange.text, url }
          })
          return
        }
      }

      // 在光标位置插入带超链接的文本
      const selection = context.document.getSelection()
      const displayText = text || url
      
      // 先插入文本
      const insertedRange = selection.insertText(displayText, Word.InsertLocation.replace)
      // 然后添加超链接
      insertedRange.hyperlink = url
      
      await context.sync()

      resolve({
        success: true,
        message: '超链接插入成功',
        data: { text: displayText, url }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `插入超链接失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 移除超链接
 */
async function wordRemoveHyperlink(args: Record<string, any>): Promise<FunctionResult> {
  const { hyperlinkIndex, searchText } = args

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

        let removedCount = 0
        for (const range of searchResults.items) {
          range.load('hyperlink')
          await context.sync()

          if (range.hyperlink) {
            range.hyperlink = ''
            removedCount++
          }
        }
        await context.sync()

        resolve({
          success: true,
          message: `已移除 ${removedCount} 处超链接`,
          data: { searchText, removedCount }
        })
      } else {
        // 移除选中文本的超链接
        const selection = context.document.getSelection()
        selection.load('text,hyperlink')
        await context.sync()

        if (!selection.text || selection.text.length === 0) {
          resolve({ success: false, message: '请先选择包含超链接的文本或提供 searchText 参数' })
          return
        }

        selection.hyperlink = ''
        await context.sync()

        resolve({
          success: true,
          message: '超链接已移除',
          data: { text: selection.text }
        })
      }
    }).catch((error) => {
      resolve({
        success: false,
        message: `移除超链接失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 插入书签
 */
async function wordInsertBookmark(args: Record<string, any>): Promise<FunctionResult> {
  const { name, position = 'cursor' } = args

  if (!name) {
    return { success: false, message: 'name 书签名称参数不能为空' }
  }

  // 验证书签名称格式（只能包含字母、数字和下划线，必须以字母开头）
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
    return { 
      success: false, 
      message: '书签名称格式无效。书签名称必须以字母开头，只能包含字母、数字和下划线。' 
    }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      let targetRange: Word.Range

      if (position === 'selection') {
        targetRange = context.document.getSelection()
      } else {
        targetRange = context.document.getSelection()
      }

      targetRange.load('text')
      await context.sync()

      // 使用 contentControls 作为书签的替代方案
      // Word API 不直接支持书签，但 contentControl 可以实现类似功能
      const contentControl = targetRange.insertContentControl()
      contentControl.tag = `bookmark_${name}`
      contentControl.title = name
      contentControl.appearance = Word.ContentControlAppearance.hidden as any

      await context.sync()

      resolve({
        success: true,
        message: `书签 "${name}" 已创建`,
        data: { 
          name, 
          note: '使用 ContentControl 实现书签功能，tag 为 bookmark_' + name
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `插入书签失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 插入交叉引用
 */
async function wordInsertCrossReference(args: Record<string, any>): Promise<FunctionResult> {
  const { referenceType, referenceName, insertAs = 'hyperlink' } = args

  if (!referenceType || !referenceName) {
    return { success: false, message: '请提供 referenceType 和 referenceName 参数' }
  }

  // Office.js 不直接支持交叉引用
  return {
    success: false,
    message: 'word_insert_cross_reference: Office.js 的 Word API 不支持直接插入交叉引用。请在 Word 中使用"引用-交叉引用"功能。',
    data: { 
      referenceType, 
      referenceName, 
      insertAs,
      suggestion: '可以使用 word_insert_hyperlink 创建指向书签的链接作为替代'
    }
  }
}

/**
 * 插入脚注
 */
async function wordInsertFootnote(args: Record<string, any>): Promise<FunctionResult> {
  const { text, position = 'cursor' } = args

  if (!text) {
    return { success: false, message: 'text 脚注文本参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const selection = context.document.getSelection()
      
      // 使用 insertFootnote 方法
      const footnote = selection.insertFootnote(text)
      
      await context.sync()

      resolve({
        success: true,
        message: '脚注已插入',
        data: { text }
      })
    }).catch((error) => {
      // 如果 API 不支持，返回提示信息
      if ((error instanceof Error ? error.message : String(error)).includes('insertFootnote')) {
        resolve({
          success: false,
          message: 'word_insert_footnote: 当前 Word API 版本不支持 insertFootnote 方法。请在 Word 中使用"引用-插入脚注"功能。',
          data: { text }
        })
      } else {
        resolve({
          success: false,
          message: `插入脚注失败: ${error instanceof Error ? error.message : String(error)}`,
          error
        })
      }
    })
  })
}

/**
 * 插入尾注
 */
async function wordInsertEndnote(args: Record<string, any>): Promise<FunctionResult> {
  const { text, position = 'cursor' } = args

  if (!text) {
    return { success: false, message: 'text 尾注文本参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const selection = context.document.getSelection()
      
      // 使用 insertEndnote 方法
      const endnote = selection.insertEndnote(text)
      
      await context.sync()

      resolve({
        success: true,
        message: '尾注已插入',
        data: { text }
      })
    }).catch((error) => {
      // 如果 API 不支持，返回提示信息
      if ((error instanceof Error ? error.message : String(error)).includes('insertEndnote')) {
        resolve({
          success: false,
          message: 'word_insert_endnote: 当前 Word API 版本不支持 insertEndnote 方法。请在 Word 中使用"引用-插入尾注"功能。',
          data: { text }
        })
      } else {
        resolve({
          success: false,
          message: `插入尾注失败: ${error instanceof Error ? error.message : String(error)}`,
          error
        })
      }
    })
  })
}

/**
 * 插入引用
 */
async function wordInsertCitation(args: Record<string, any>): Promise<FunctionResult> {
  const { sourceType, author, title, year, publisher, url } = args

  if (!sourceType || !author || !title) {
    return { success: false, message: '请提供 sourceType、author 和 title 参数' }
  }

  // Office.js 不支持直接管理引用/参考文献
  // 可以插入格式化的文本作为替代
  return new Promise((resolve) => {
    Word.run(async (context) => {
      const selection = context.document.getSelection()
      
      // 构建引用文本（简化的 APA 格式）
      let citationText = `(${author}`
      if (year) {
        citationText += `, ${year}`
      }
      citationText += ')'

      selection.insertText(citationText, Word.InsertLocation.replace)
      await context.sync()

      resolve({
        success: true,
        message: '引用已插入（文本格式）',
        data: { 
          citationText,
          fullReference: {
            sourceType,
            author,
            title,
            year,
            publisher,
            url
          },
          note: 'Office.js 不支持引用管理功能，已插入文本格式的引用。完整的参考文献管理请使用 Word 的"引用"功能。'
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `插入引用失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 插入参考文献
 */
async function wordInsertBibliography(args: Record<string, any>): Promise<FunctionResult> {
  const { style = 'APA', title = 'References', position = 'cursor' } = args

  // Office.js 不支持直接插入参考文献
  return new Promise((resolve) => {
    Word.run(async (context) => {
      let insertLocation: Word.Range

      if (position === 'end') {
        insertLocation = context.document.body.getRange(Word.RangeLocation.end)
      } else {
        insertLocation = context.document.getSelection()
      }

      // 插入标题
      const titleParagraph = insertLocation.insertParagraph(title, Word.InsertLocation.after)
      titleParagraph.styleBuiltIn = Word.BuiltInStyleName.heading1
      
      // 插入占位符文本
      const placeholderText = '[参考文献列表将显示在这里。请使用 Word 的"引用-参考文献"功能来管理和插入参考文献。]'
      titleParagraph.insertParagraph(placeholderText, Word.InsertLocation.after)

      await context.sync()

      resolve({
        success: true,
        message: '参考文献标题已插入',
        data: { 
          title, 
          style,
          note: 'Office.js 不支持自动生成参考文献列表。请使用 Word 的"引用-参考文献"功能来管理引用源并插入参考文献。'
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `插入参考文献失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出超链接工具定义
 */
export const hyperlinkTools: ToolDefinition[] = [
  { name: 'word_insert_hyperlink', handler: wordInsertHyperlink, category: 'text', description: '插入超链接' },
  { name: 'word_remove_hyperlink', handler: wordRemoveHyperlink, category: 'text', description: '移除超链接' },
  { name: 'word_insert_bookmark', handler: wordInsertBookmark, category: 'text', description: '插入书签' },
  { name: 'word_insert_cross_reference', handler: wordInsertCrossReference, category: 'text', description: '插入交叉引用' },
  { name: 'word_insert_footnote', handler: wordInsertFootnote, category: 'text', description: '插入脚注' },
  { name: 'word_insert_endnote', handler: wordInsertEndnote, category: 'text', description: '插入尾注' },
  { name: 'word_insert_citation', handler: wordInsertCitation, category: 'text', description: '插入引用' },
  { name: 'word_insert_bibliography', handler: wordInsertBibliography, category: 'text', description: '插入参考文献' }
]
