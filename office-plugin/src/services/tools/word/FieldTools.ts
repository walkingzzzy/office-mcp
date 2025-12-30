/**
 * Word 域操作工具实现
 * 使用 Office.js API (WordApi 1.5+) 实现域操作
 * P1 阶段功能
 * 注意：Web 端只读限制
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 插入域
 */
export async function wordInsertField(args: {
  fieldType: string
  text?: string
  preserveFormatting?: boolean
}): Promise<ToolResult> {
  const { fieldType, text, preserveFormatting = true } = args

  try {
    return await Word.run(async (context) => {
      let range: Word.Range

      if (text) {
        // 搜索指定文本并插入域
        const searchResults = context.document.body.search(text, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          return {
            success: false,
            message: `未找到文本: ${text}`
          }
        }

        range = searchResults.items[0]
      } else {
        // 在当前选区插入域
        range = context.document.getSelection()
      }

      // 注意：Office.js WordApi 1.5+ 支持域操作，但 Web 端有限制
      // 使用 insertField 方法插入域
      const field = range.insertField(
        Word.InsertLocation.replace,
        fieldType as Word.FieldType,
        '',
        preserveFormatting
      )

      field.load('result, locked')
      await context.sync()

      return {
        success: true,
        message: `成功插入 ${fieldType} 域`,
        data: {
          type: fieldType,
          result: field.result.text,
          locked: field.locked
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    // 检查是否是 Web 端限制错误
    if (err.message.includes('not supported') || err.message.includes('Web')) {
      return {
        success: false,
        message: 'Office.js Web 端限制：域操作仅在桌面版中完全支持',
        data: {
          note: '域插入需要在 Word 桌面版中使用',
          fieldType
        }
      }
    }

    return {
      success: false,
      message: `插入域失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取所有域
 */
export async function wordGetFields(args: {
  fieldType?: string
}): Promise<ToolResult> {
  const { fieldType } = args

  try {
    return await Word.run(async (context) => {
      const fields = context.document.body.fields
      fields.load('items')
      await context.sync()

      const fieldList: Array<{
        id: string
        type: string
        result: string
        locked: boolean
      }> = []

      for (let i = 0; i < fields.items.length; i++) {
        const field = fields.items[i]
        field.load('type, result, locked')
        await context.sync()

        // 根据 fieldType 参数过滤
        if (fieldType && field.type !== fieldType) {
          continue
        }

        fieldList.push({
          id: `field_${i}`,
          type: field.type,
          result: field.result.text,
          locked: field.locked
        })
      }

      return {
        success: true,
        message: `成功获取 ${fieldList.length} 个域`,
        data: {
          fields: fieldList,
          total: fieldList.length
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    if (err.message.includes('not supported') || err.message.includes('Web')) {
      return {
        success: false,
        message: 'Office.js Web 端限制：域操作仅在桌面版中完全支持',
        data: { note: '域读取需要在 Word 桌面版中使用' }
      }
    }

    return {
      success: false,
      message: `获取域失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 更新域
 */
export async function wordUpdateField(args: {
  fieldId: string
}): Promise<ToolResult> {
  const { fieldId } = args

  try {
    return await Word.run(async (context) => {
      const fields = context.document.body.fields
      fields.load('items')
      await context.sync()

      // 解析 fieldId 获取索引
      const match = fieldId.match(/field_(\d+)/)
      if (!match) {
        return {
          success: false,
          message: `无效的域ID格式: ${fieldId}`
        }
      }
      const index = parseInt(match[1], 10)

      if (index < 0 || index >= fields.items.length) {
        return {
          success: false,
          message: `未找到域: ${fieldId}`
        }
      }

      const targetField = fields.items[index]

      // 注意：Office.js Field 对象没有 update() 方法
      // 域会在文档保存或打印时自动更新
      targetField.load('result')
      await context.sync()

      return {
        success: true,
        message: `域信息已获取（域会在文档保存时自动更新）`,
        data: {
          fieldId,
          result: targetField.result.text,
          note: 'Office.js 不支持手动更新域，域会在文档保存或打印时自动更新'
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    if (err.message.includes('not supported') || err.message.includes('Web')) {
      return {
        success: false,
        message: 'Office.js Web 端限制：域操作仅在桌面版中完全支持',
        data: { note: '域更新需要在 Word 桌面版中使用', fieldId }
      }
    }

    return {
      success: false,
      message: `更新域失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 更新所有域
 */
export async function wordUpdateAllFields(args: {}): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    return await Word.run(async (context) => {
      const fields = context.document.body.fields
      fields.load('items')
      await context.sync()

      // 注意：Office.js Field 对象没有 update() 方法
      // 域会在文档保存或打印时自动更新
      const fieldCount = fields.items.length

      return {
        success: true,
        message: `文档包含 ${fieldCount} 个域（域会在文档保存时自动更新）`,
        data: {
          count: fieldCount,
          note: 'Office.js 不支持手动更新域，域会在文档保存或打印时自动更新'
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    if (err.message.includes('not supported') || err.message.includes('Web')) {
      return {
        success: false,
        message: 'Office.js Web 端限制：域操作仅在桌面版中完全支持',
        data: { note: '域更新需要在 Word 桌面版中使用' }
      }
    }

    return {
      success: false,
      message: `更新所有域失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 删除域
 */
export async function wordDeleteField(args: {
  fieldId: string
  keepResult?: boolean
}): Promise<ToolResult> {
  const { fieldId, keepResult = true } = args

  try {
    return await Word.run(async (context) => {
      const fields = context.document.body.fields
      fields.load('items')
      await context.sync()

      // 解析 fieldId 获取索引
      const match = fieldId.match(/field_(\d+)/)
      if (!match) {
        return {
          success: false,
          message: `无效的域ID格式: ${fieldId}`
        }
      }
      const index = parseInt(match[1], 10)

      if (index < 0 || index >= fields.items.length) {
        return {
          success: false,
          message: `未找到域: ${fieldId}`
        }
      }

      const targetField = fields.items[index]

      // 删除域（Office.js 只支持 delete 方法，不支持 unlink）
      targetField.delete()

      await context.sync()

      return {
        success: true,
        message: `成功删除域`,
        data: { fieldId, note: 'Office.js 不支持保留域结果的 unlink 操作' }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    if (err.message.includes('not supported') || err.message.includes('Web')) {
      return {
        success: false,
        message: 'Office.js Web 端限制：域操作仅在桌面版中完全支持',
        data: { note: '域删除需要在 Word 桌面版中使用', fieldId }
      }
    }

    return {
      success: false,
      message: `删除域失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 锁定域
 */
export async function wordLockField(args: {
  fieldId: string
}): Promise<ToolResult> {
  const { fieldId } = args

  try {
    return await Word.run(async (context) => {
      const fields = context.document.body.fields
      fields.load('items')
      await context.sync()

      // 解析 fieldId 获取索引
      const match = fieldId.match(/field_(\d+)/)
      if (!match) {
        return {
          success: false,
          message: `无效的域ID格式: ${fieldId}`
        }
      }
      const index = parseInt(match[1], 10)

      if (index < 0 || index >= fields.items.length) {
        return {
          success: false,
          message: `未找到域: ${fieldId}`
        }
      }

      const targetField = fields.items[index]

      // 锁定域
      targetField.locked = true
      await context.sync()

      return {
        success: true,
        message: `成功锁定域`,
        data: { fieldId }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    if (err.message.includes('not supported') || err.message.includes('Web')) {
      return {
        success: false,
        message: 'Office.js Web 端限制：域操作仅在桌面版中完全支持',
        data: { note: '域锁定需要在 Word 桌面版中使用', fieldId }
      }
    }

    return {
      success: false,
      message: `锁定域失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 解锁域
 */
export async function wordUnlockField(args: {
  fieldId: string
}): Promise<ToolResult> {
  const { fieldId } = args

  try {
    return await Word.run(async (context) => {
      const fields = context.document.body.fields
      fields.load('items')
      await context.sync()

      // 解析 fieldId 获取索引
      const match = fieldId.match(/field_(\d+)/)
      if (!match) {
        return {
          success: false,
          message: `无效的域ID格式: ${fieldId}`
        }
      }
      const index = parseInt(match[1], 10)

      if (index < 0 || index >= fields.items.length) {
        return {
          success: false,
          message: `未找到域: ${fieldId}`
        }
      }

      const targetField = fields.items[index]

      // 解锁域
      targetField.locked = false
      await context.sync()

      return {
        success: true,
        message: `成功解锁域`,
        data: { fieldId }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    if (err.message.includes('not supported') || err.message.includes('Web')) {
      return {
        success: false,
        message: 'Office.js Web 端限制：域操作仅在桌面版中完全支持',
        data: { note: '域解锁需要在 Word 桌面版中使用', fieldId }
      }
    }

    return {
      success: false,
      message: `解锁域失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取域结果
 */
export async function wordGetFieldResult(args: {
  fieldId: string
}): Promise<ToolResult> {
  const { fieldId } = args

  try {
    return await Word.run(async (context) => {
      const fields = context.document.body.fields
      fields.load('items')
      await context.sync()

      // 解析 fieldId 获取索引
      const match = fieldId.match(/field_(\d+)/)
      if (!match) {
        return {
          success: false,
          message: `无效的域ID格式: ${fieldId}`
        }
      }
      const index = parseInt(match[1], 10)

      if (index < 0 || index >= fields.items.length) {
        return {
          success: false,
          message: `未找到域: ${fieldId}`
        }
      }

      const targetField = fields.items[index]

      // 获取域结果
      targetField.load('result, type')
      await context.sync()

      return {
        success: true,
        message: `成功获取域结果`,
        data: {
          fieldId,
          type: targetField.type,
          result: targetField.result.text
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    if (err.message.includes('not supported') || err.message.includes('Web')) {
      return {
        success: false,
        message: 'Office.js Web 端限制：域操作仅在桌面版中完全支持',
        data: { note: '域读取需要在 Word 桌面版中使用', fieldId }
      }
    }

    return {
      success: false,
      message: `获取域结果失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 导出域工具定义
 */
export const fieldTools: ToolDefinition[] = [
  { name: 'word_insert_field', handler: wordInsertField, category: 'text', description: '插入域' },
  { name: 'word_get_fields', handler: wordGetFields, category: 'text', description: '获取所有域' },
  { name: 'word_update_field', handler: wordUpdateField, category: 'text', description: '更新域' },
  { name: 'word_update_all_fields', handler: wordUpdateAllFields, category: 'text', description: '更新所有域' },
  { name: 'word_delete_field', handler: wordDeleteField, category: 'text', description: '删除域' },
  { name: 'word_lock_field', handler: wordLockField, category: 'text', description: '锁定域' },
  { name: 'word_unlock_field', handler: wordUnlockField, category: 'text', description: '解锁域' },
  { name: 'word_get_field_result', handler: wordGetFieldResult, category: 'text', description: '获取域结果' }
]
