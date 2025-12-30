/**
 * Word 文本操作工具
 * 包含：word_insert_text, word_replace_text, word_search_text, word_add_paragraph
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'
import Logger from '../../../utils/logger'

const logger = new Logger('WordTextTools')

/**
 * 插入文本
 * 注意: 默认 location='cursor' 与 MCP Schema 定义一致
 */
async function wordInsertText(args: Record<string, any>): Promise<FunctionResult> {
  const { text, location = 'cursor' } = args
  if (!text || typeof text !== 'string') {
    return { success: false, message: 'text 参数不能为空' }
  }

  // 处理转义的换行符：将 \\n 转换为真正的换行符
  const processedText = text.replace(/\\n/g, '\n')

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const selection = context.document.getSelection()
      selection.load('text')
      await context.sync()

      const loc = (location || 'cursor').toLowerCase()
      const hasSelection = selection.text && selection.text.length > 0

      switch (loc) {
        case 'start':
          context.document.body.insertText(processedText, Word.InsertLocation.start)
          break
        case 'end':
          context.document.body.insertText(processedText, Word.InsertLocation.end)
          break
        case 'before':
          selection.insertText(processedText, Word.InsertLocation.before)
          break
        case 'after':
          selection.insertText(processedText, Word.InsertLocation.after)
          break
        case 'replace':
          selection.insertText(processedText, Word.InsertLocation.replace)
          break
        case 'cursor':
        default:
          // cursor: 在光标位置插入（有选区则替换，无选区则插入）
          if (hasSelection) {
            selection.insertText(processedText, Word.InsertLocation.replace)
          } else {
            selection.insertText(processedText, Word.InsertLocation.after)
          }
      }

      await context.sync()
      resolve({
        success: true,
        message: '文本插入成功',
        data: { insertedLength: processedText.length, location: loc }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `插入文本失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 查找并替换文本
 */
async function wordReplaceText(args: Record<string, any>): Promise<FunctionResult> {
  const { searchText, replaceText, replaceAll = true, matchCase = false } = args

  if (!searchText) {
    return { success: false, message: 'searchText 参数不能为空' }
  }
  if (replaceText === undefined || replaceText === null) {
    return { success: false, message: 'replaceText 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const body = context.document.body
      
      const searchResults = body.search(searchText, {
        ignorePunct: false,
        ignoreSpace: false,
        matchCase: matchCase,
        matchWholeWord: false,
        matchWildcards: false
      })
      
      searchResults.load('items')
      await context.sync()

      if (searchResults.items.length === 0) {
        resolve({
          success: true,
          message: `未找到 "${searchText}"`,
          data: { replacedCount: 0, searchText, replaceText }
        })
        return
      }

      const itemsToReplace = replaceAll ? searchResults.items : [searchResults.items[0]]
      for (const item of itemsToReplace) {
        item.insertText(replaceText, Word.InsertLocation.replace)
      }
      
      await context.sync()

      logger.info('[TextTools] 文本替换成功', {
        searchText,
        replaceText,
        replacedCount: itemsToReplace.length
      })

      resolve({
        success: true,
        message: `成功替换 ${itemsToReplace.length} 处 "${searchText}" 为 "${replaceText}"`,
        data: {
          replacedCount: itemsToReplace.length,
          searchText,
          replaceText,
          replaceAll
        }
      })
    }).catch((error) => {
      logger.error('[TextTools] 文本替换失败', { error: error instanceof Error ? error.message : String(error) })
      resolve({
        success: false,
        message: `替换文本失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 搜索文本
 */
async function wordSearchText(args: Record<string, any>): Promise<FunctionResult> {
  const { searchText, matchCase = false } = args

  if (!searchText) {
    return { success: false, message: 'searchText 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const body = context.document.body
      
      const searchResults = body.search(searchText, {
        ignorePunct: false,
        ignoreSpace: false,
        matchCase: matchCase,
        matchWholeWord: false,
        matchWildcards: false
      })
      
      searchResults.load('items')
      await context.sync()

      const results = searchResults.items.map((item, index) => ({
        index,
        text: item.text
      }))

      resolve({
        success: true,
        message: `找到 ${searchResults.items.length} 处 "${searchText}"`,
        data: {
          searchText,
          matchCount: searchResults.items.length,
          results: results.slice(0, 10)
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `搜索文本失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 添加段落
 */
async function wordAddParagraph(args: Record<string, any>): Promise<FunctionResult> {
  const { text, location = 'end' } = args
  if (!text || typeof text !== 'string') {
    return { success: false, message: 'text 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const loc = (location || 'end').toLowerCase()
      const insertLocation = loc === 'start' ? Word.InsertLocation.start : Word.InsertLocation.end
      
      const lines = text.split(/\\n|\n/)
      
      for (const line of lines) {
        context.document.body.insertParagraph(line, insertLocation)
      }
      
      await context.sync()

      resolve({
        success: true,
        message: '段落添加成功',
        data: { text: text.substring(0, 50), location: loc, paragraphCount: lines.length }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `添加段落失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出文本工具定义
 */
export const textTools: ToolDefinition[] = [
  { name: 'word_insert_text', handler: wordInsertText, category: 'text', description: '插入文本' },
  { name: 'word_replace_text', handler: wordReplaceText, category: 'text', description: '查找并替换文本' },
  { name: 'word_search_text', handler: wordSearchText, category: 'text', description: '搜索文本' },
  { name: 'word_add_paragraph', handler: wordAddParagraph, category: 'text', description: '添加段落' }
]

