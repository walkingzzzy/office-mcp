/**
 * Word 选区检测操作工具
 * 包含：word_detect_selection_type, word_check_document_has_images, word_check_document_has_tables
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

/**
 * 检测选区类型
 */
async function wordDetectSelectionType(): Promise<FunctionResult> {
  return new Promise((resolve) => {
    Word.run(async (context) => {
      const selection = context.document.getSelection()
      selection.load('text')

      const tables = selection.tables
      tables.load('items')

      const inlinePictures = selection.inlinePictures
      inlinePictures.load('items')

      await context.sync()

      let selectionType: 'text' | 'image' | 'table' | 'none' = 'none'

      if (inlinePictures.items.length > 0) {
        selectionType = 'image'
      } else if (tables.items.length > 0) {
        selectionType = 'table'
      } else {
        const normalizedText = selection.text.replace(/[\u0000-\u001F]/g, '').trim()
        if (normalizedText.length > 0) {
          selectionType = 'text'
        }
      }

      resolve({
        success: true,
        message: '选区类型检测成功',
        data: { selectionType }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `检测选区类型失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 检查文档是否包含图片
 */
async function wordCheckDocumentHasImages(): Promise<FunctionResult> {
  return new Promise((resolve) => {
    Word.run(async (context) => {
      const body = context.document.body
      const inlinePictures = body.inlinePictures
      inlinePictures.load('items')
      await context.sync()

      const hasImages = inlinePictures.items.length > 0

      resolve({
        success: true,
        message: '文档图片检查成功',
        data: { hasImages, imageCount: inlinePictures.items.length }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `检查文档图片失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 检查文档是否包含表格
 */
async function wordCheckDocumentHasTables(): Promise<FunctionResult> {
  return new Promise((resolve) => {
    Word.run(async (context) => {
      const body = context.document.body
      const tables = body.tables
      tables.load('items')
      await context.sync()

      const hasTables = tables.items.length > 0

      resolve({
        success: true,
        message: '文档表格检查成功',
        data: { hasTables, tableCount: tables.items.length }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `检查文档表格失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出选区工具定义
 */
export const selectionTools: ToolDefinition[] = [
  { name: 'word_detect_selection_type', handler: wordDetectSelectionType, category: 'selection', description: '检测选区类型' },
  { name: 'word_check_document_has_images', handler: wordCheckDocumentHasImages, category: 'selection', description: '检查文档是否包含图片' },
  { name: 'word_check_document_has_tables', handler: wordCheckDocumentHasTables, category: 'selection', description: '检查文档是否包含表格' }
]

