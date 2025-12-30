/**
 * Word 文档生命周期工具实现
 * 使用 Office.js API (WordApi 1.3+) 实现文档操作功能
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 打开文档
 */
export async function wordOpenDocument(args: {
  path: string
  readOnly?: boolean
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：无法通过 API 打开新文档，请使用 Office 应用程序打开'
  }
}

/**
 * 打印文档
 */
export async function wordPrintDocument(args: {
  copies?: number
  pageRange?: string
  collate?: boolean
  duplex?: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：打印功能需要用户手动操作'
  }
}

/**
 * 打印预览
 */
export async function wordPrintPreview(args: Record<string, never>): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：打印预览需要用户手动操作'
  }
}

/**
 * 关闭打印预览
 */
export async function wordClosePrintPreview(args: Record<string, never>): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：关闭打印预览需要用户手动操作'
  }
}

/**
 * 获取文档属性
 */
export async function wordGetDocumentProperties(args: Record<string, never>): Promise<ToolResult> {
  try {
    return await Word.run(async (context) => {
      const properties = context.document.properties
      properties.load('title,author,subject,keywords,comments,category,manager,company,creationDate,lastSaveTime,lastAuthor,revisionNumber,applicationName,template')
      await context.sync()

      return {
        success: true,
        message: '成功获取文档属性',
        data: {
          title: properties.title,
          author: properties.author,
          subject: properties.subject,
          keywords: properties.keywords,
          comments: properties.comments,
          category: properties.category,
          manager: properties.manager,
          company: properties.company,
          createdDate: properties.creationDate,
          lastModifiedDate: properties.lastSaveTime,
          lastModifiedBy: properties.lastAuthor,
          revisionNumber: properties.revisionNumber,
          applicationName: properties.applicationName,
          template: properties.template
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取文档属性失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 设置文档属性
 */
export async function wordSetDocumentProperties(args: {
  title?: string
  author?: string
  subject?: string
  keywords?: string
  comments?: string
  category?: string
  manager?: string
  company?: string
}): Promise<ToolResult> {
  try {
    return await Word.run(async (context) => {
      const properties = context.document.properties
      if (args.title !== undefined) properties.title = args.title
      if (args.author !== undefined) properties.author = args.author
      if (args.subject !== undefined) properties.subject = args.subject
      if (args.keywords !== undefined) properties.keywords = args.keywords
      if (args.comments !== undefined) properties.comments = args.comments
      if (args.category !== undefined) properties.category = args.category
      if (args.manager !== undefined) properties.manager = args.manager
      if (args.company !== undefined) properties.company = args.company
      await context.sync()

      return {
        success: true,
        message: '成功设置文档属性'
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `设置文档属性失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取文档统计信息
 */
export async function wordGetDocumentStatistics(args: Record<string, never>): Promise<ToolResult> {
  try {
    return await Word.run(async (context) => {
      const body = context.document.body
      body.load('text')
      await context.sync()

      const text = body.text
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length
      const characterCount = text.replace(/\s/g, '').length
      const characterCountWithSpaces = text.length
      const paragraphCount = text.split(/\n+/).filter(p => p.trim().length > 0).length

      return {
        success: true,
        message: '成功获取文档统计信息',
        data: {
          wordCount,
          characterCount,
          characterCountWithSpaces,
          paragraphCount,
          note: 'Office.js API 限制：页数和行数需要其他方式获取'
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取文档统计信息失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取文档路径
 */
export async function wordGetDocumentPath(args: Record<string, never>): Promise<ToolResult> {
  try {
    return await Word.run(async (context) => {
      const document = context.document
      document.load('saved')
      await context.sync()

      return {
        success: true,
        message: '成功获取文档路径',
        data: {
          isNew: !document.saved,
          note: 'Office.js API 限制：无法获取完整文件路径'
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取文档路径失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 导出文档工具定义
 */
export const documentTools: ToolDefinition[] = [
  { name: 'word_open_document', handler: wordOpenDocument, category: 'document', description: '打开文档' },
  { name: 'word_print_document', handler: wordPrintDocument, category: 'document', description: '打印文档' },
  { name: 'word_print_preview', handler: wordPrintPreview, category: 'document', description: '打印预览' },
  { name: 'word_close_print_preview', handler: wordClosePrintPreview, category: 'document', description: '关闭打印预览' },
  { name: 'word_get_document_properties', handler: wordGetDocumentProperties, category: 'document', description: '获取文档属性' },
  { name: 'word_set_document_properties', handler: wordSetDocumentProperties, category: 'document', description: '设置文档属性' },
  { name: 'word_get_document_statistics', handler: wordGetDocumentStatistics, category: 'document', description: '获取文档统计信息' },
  { name: 'word_get_document_path', handler: wordGetDocumentPath, category: 'document', description: '获取文档路径' }
]

