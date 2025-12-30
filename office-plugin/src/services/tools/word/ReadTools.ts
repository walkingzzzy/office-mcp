/**
 * Word 读取操作工具
 * 包含：word_read_document, word_get_paragraphs, word_get_selected_text
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

/**
 * 读取文档内容
 */
async function wordReadDocument(): Promise<FunctionResult> {
  return new Promise((resolve) => {
    Word.run(async (context) => {
      const body = context.document.body
      body.load('text')
      
      const paragraphs = body.paragraphs
      paragraphs.load('items')
      
      await context.sync()

      const paragraphTexts = paragraphs.items.map((p, index) => ({
        index,
        text: p.text
      }))

      resolve({
        success: true,
        message: '文档读取成功',
        data: {
          text: body.text,
          paragraphs: paragraphTexts,
          characterCount: body.text.length,
          paragraphCount: paragraphs.items.length
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `读取文档失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 获取段落列表
 */
async function wordGetParagraphs(): Promise<FunctionResult> {
  return new Promise((resolve) => {
    Word.run(async (context) => {
      const paragraphs = context.document.body.paragraphs
      paragraphs.load('items')
      await context.sync()

      const items = paragraphs.items || []
      if (items.length === 0) {
        resolve({
          success: true,
          message: '未找到段落',
          data: { paragraphCount: 0, paragraphs: [] }
        })
        return
      }

      items.forEach((paragraph) => {
        paragraph.load({
          text: true,
          style: true,
          alignment: true,
          leftIndent: true,
          rightIndent: true,
          firstLineIndent: true,
          lineSpacing: true,
          spaceBefore: true,
          spaceAfter: true
        })
        paragraph.font.load({
          name: true,
          size: true,
          bold: true,
          italic: true,
          color: true
        })

        const listItem = paragraph.listItemOrNullObject
        if (listItem && typeof listItem.load === 'function') {
          listItem.load({
            level: true,
            listString: true,
            siblingIndex: true
          })
        }
      })

      await context.sync()

      const paragraphData = items.map((paragraph, index) => {
        const font = paragraph.font
        const listItem = paragraph.listItemOrNullObject
        const text = paragraph.text || ''
        const normalizedAlignment =
          typeof paragraph.alignment === 'string' ? paragraph.alignment.toLowerCase() : null

        return {
          index,
          text,
          length: text.length,
          isEmpty: text.trim().length === 0,
          style: paragraph.style || null,
          alignment: normalizedAlignment,
          indentation: {
            left: typeof paragraph.leftIndent === 'number' ? paragraph.leftIndent : null,
            right: typeof paragraph.rightIndent === 'number' ? paragraph.rightIndent : null,
            firstLine: typeof paragraph.firstLineIndent === 'number' ? paragraph.firstLineIndent : null
          },
          spacing: {
            before: typeof paragraph.spaceBefore === 'number' ? paragraph.spaceBefore : null,
            after: typeof paragraph.spaceAfter === 'number' ? paragraph.spaceAfter : null,
            line: typeof paragraph.lineSpacing === 'number' ? paragraph.lineSpacing : null
          },
          font: {
            name: font?.name || null,
            size: typeof font?.size === 'number' ? font.size : null,
            bold: typeof font?.bold === 'boolean' ? font.bold : null,
            italic: typeof font?.italic === 'boolean' ? font.italic : null,
            color: font?.color || null
          },
          list: listItem && !listItem.isNullObject
            ? {
                level: typeof listItem.level === 'number' ? listItem.level : null,
                label: listItem.listString || null,
                index: typeof listItem.siblingIndex === 'number' ? listItem.siblingIndex : null
              }
            : null
        }
      })

      resolve({
        success: true,
        message: '获取段落列表成功',
        data: {
          paragraphCount: paragraphData.length,
          hasContent: paragraphData.some((item) => !item.isEmpty),
          paragraphs: paragraphData
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `获取段落失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 获取选中文本
 */
async function wordGetSelectedText(): Promise<FunctionResult> {
  return new Promise((resolve) => {
    Word.run(async (context) => {
      const selection = context.document.getSelection()
      selection.load('text')
      await context.sync()

      resolve({
        success: true,
        message: '获取选中文本成功',
        data: {
          text: selection.text,
          length: selection.text?.length || 0
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `获取选中文本失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出读取工具定义
 */
export const readTools: ToolDefinition[] = [
  { name: 'word_read_document', handler: wordReadDocument, category: 'read', description: '读取文档内容' },
  { name: 'word_get_paragraphs', handler: wordGetParagraphs, category: 'read', description: '获取段落列表' },
  { name: 'word_get_selected_text', handler: wordGetSelectedText, category: 'read', description: '获取选中文本' }
]

