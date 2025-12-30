/**
 * Word 文档保存工具实现
 * 使用 Office.js API (WordApi 1.1) 实现文档保存操作
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 保存文档
 */
export async function wordSaveDocument(args: {}): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    return await Word.run(async (context) => {
      // 保存文档
      context.document.save()
      await context.sync()

      return {
        success: true,
        message: '成功保存文档'
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `保存文档失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 另存为
 * 注意：Office.js API 不直接支持另存为操作
 * 这个功能需要通过其他方式实现（如文件系统API或服务器端处理）
 */
export async function wordSaveAsDocument(args: {
  filePath: string
  format?: 'docx' | 'doc' | 'pdf' | 'txt' | 'html'
}): Promise<ToolResult> {
  const { filePath, format = 'docx' } = args

  try {
    // Office.js API 限制：Web端不支持直接另存为
    // 这里返回提示信息，实际实现需要在主应用端处理
    return {
      success: false,
      message: '另存为功能需要在桌面版Office中使用，或通过主应用的文件系统API实现',
      data: {
        filePath,
        format,
        note: '请使用 Office 桌面版的"文件 > 另存为"功能'
      }
    }
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `另存为失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取文档保存状态
 */
export async function wordGetSaveStatus(args: {}): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    return await Word.run(async (context) => {
      const doc = context.document
      const props = doc.properties
      props.load('lastSavedTime')
      await context.sync()

      // Office.js API 限制：无法直接获取isDirty状态
      // 只能获取最后保存时间
      return {
        success: true,
        message: '成功获取保存状态',
        data: {
          lastSaved: props.lastSaveTime,
          note: 'Office.js API 不支持直接获取未保存更改状态'
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取保存状态失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 关闭文档
 * 注意：Office.js API 不支持关闭文档操作
 */
export async function wordCloseDocument(args: {
  saveChanges?: boolean
}): Promise<ToolResult> {
  const { saveChanges = true } = args

  try {
    if (saveChanges) {
      // 先保存文档
      await Word.run(async (context) => {
        context.document.save()
        await context.sync()
      })
    }

    return {
      success: false,
      message: 'Office.js API 不支持关闭文档操作，请手动关闭文档',
      data: {
        saveChanges,
        note: '文档已保存（如果选择保存），但无法通过API关闭'
      }
    }
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `关闭文档失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 导出保存工具定义
 */
export const saveTools: ToolDefinition[] = [
  { name: 'word_save_document', handler: wordSaveDocument, category: 'text', description: '保存文档' },
  { name: 'word_save_as_document', handler: wordSaveAsDocument, category: 'text', description: '另存为' },
  { name: 'word_get_save_status', handler: wordGetSaveStatus, category: 'text', description: '获取保存状态' },
  { name: 'word_close_document', handler: wordCloseDocument, category: 'text', description: '关闭文档' }
]
