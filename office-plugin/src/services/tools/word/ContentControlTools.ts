/**
 * Word 内容控件工具实现
 * 使用 Office.js API (WordApi 1.1) 实现内容控件操作
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 插入内容控件
 */
export async function wordInsertContentControl(args: {
  type?: 'richText' | 'plainText' | 'picture' | 'comboBox' | 'dropDownList' | 'datePicker' | 'checkBox'
  tag?: string
  title?: string
  placeholderText?: string
  text?: string
  appearance?: 'boundingBox' | 'tags' | 'hidden'
  cannotDelete?: boolean
  cannotEdit?: boolean
}): Promise<ToolResult> {
  const {
    type = 'richText',
    tag,
    title,
    placeholderText,
    text,
    appearance = 'boundingBox',
    cannotDelete = false,
    cannotEdit = false
  } = args

  try {
    return await Word.run(async (context) => {
      const selection = context.document.getSelection()

      // 将选区包装为内容控件
      const contentControl = selection.insertContentControl()

      // 设置基本属性
      if (tag) contentControl.tag = tag
      if (title) contentControl.title = title
      if (placeholderText) contentControl.placeholderText = placeholderText

      // 设置外观
      switch (appearance) {
        case 'tags':
          contentControl.appearance = Word.ContentControlAppearance.tags
          break
        case 'hidden':
          contentControl.appearance = Word.ContentControlAppearance.hidden
          break
        case 'boundingBox':
        default:
          contentControl.appearance = Word.ContentControlAppearance.boundingBox
          break
      }

      // 设置锁定属性
      contentControl.cannotDelete = cannotDelete
      contentControl.cannotEdit = cannotEdit

      // 如果提供了初始文本，插入文本
      if (text) {
        contentControl.insertText(text, Word.InsertLocation.replace)
      }

      await context.sync()

      return {
        success: true,
        message: `成功插入${type}类型的内容控件`,
        data: {
          type,
          tag,
          title,
          cannotDelete,
          cannotEdit
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `插入内容控件失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取所有内容控件
 */
export async function wordGetContentControls(args: {
  tag?: string
  title?: string
}): Promise<ToolResult> {
  const { tag, title } = args

  try {
    return await Word.run(async (context) => {
      let contentControls: Word.ContentControlCollection

      // 根据筛选条件获取内容控件
      if (tag) {
        contentControls = context.document.contentControls.getByTag(tag)
      } else if (title) {
        contentControls = context.document.contentControls.getByTitle(title)
      } else {
        contentControls = context.document.contentControls
      }

      contentControls.load('items')
      await context.sync()

      // 加载每个控件的详细信息
      const controls = contentControls.items
      for (const control of controls) {
        control.load(['tag', 'title', 'text', 'type', 'cannotDelete', 'cannotEdit', 'appearance'])
      }
      await context.sync()

      // 构建返回数据
      const controlsData = controls.map(control => ({
        tag: control.tag,
        title: control.title,
        text: control.text,
        type: control.type,
        cannotDelete: control.cannotDelete,
        cannotEdit: control.cannotEdit,
        appearance: control.appearance
      }))

      return {
        success: true,
        message: `成功获取 ${controlsData.length} 个内容控件`,
        data: {
          count: controlsData.length,
          controls: controlsData
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取内容控件失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 设置内容控件的值
 */
export async function wordSetContentControlValue(args: {
  tag?: string
  title?: string
  text?: string
  html?: string
}): Promise<ToolResult> {
  const { tag, title, text, html } = args

  if (!tag && !title) {
    return {
      success: false,
      message: '必须提供 tag 或 title 参数来定位内容控件'
    }
  }

  if (!text && !html) {
    return {
      success: false,
      message: '必须提供 text 或 html 参数来设置内容'
    }
  }

  try {
    return await Word.run(async (context) => {
      let contentControls: Word.ContentControlCollection

      // 根据筛选条件获取内容控件
      if (tag) {
        contentControls = context.document.contentControls.getByTag(tag)
      } else if (title) {
        contentControls = context.document.contentControls.getByTitle(title)
      } else {
        return {
          success: false,
          message: '必须提供 tag 或 title 参数'
        }
      }

      contentControls.load('items')
      await context.sync()

      if (contentControls.items.length === 0) {
        return {
          success: false,
          message: `未找到匹配的内容控件 (tag: ${tag}, title: ${title})`
        }
      }

      // 设置第一个匹配的控件的值
      const control = contentControls.items[0]

      if (html) {
        control.insertHtml(html, Word.InsertLocation.replace)
      } else if (text) {
        control.insertText(text, Word.InsertLocation.replace)
      }

      await context.sync()

      return {
        success: true,
        message: `成功设置内容控件的值`,
        data: {
          tag,
          title,
          updatedCount: 1
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `设置内容控件值失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取内容控件的值
 */
export async function wordGetContentControlValue(args: {
  tag?: string
  title?: string
}): Promise<ToolResult> {
  const { tag, title } = args

  if (!tag && !title) {
    return {
      success: false,
      message: '必须提供 tag 或 title 参数来定位内容控件'
    }
  }

  try {
    return await Word.run(async (context) => {
      let contentControls: Word.ContentControlCollection

      // 根据筛选条件获取内容控件
      if (tag) {
        contentControls = context.document.contentControls.getByTag(tag)
      } else if (title) {
        contentControls = context.document.contentControls.getByTitle(title)
      } else {
        return {
          success: false,
          message: '必须提供 tag 或 title 参数'
        }
      }

      contentControls.load('items')
      await context.sync()

      if (contentControls.items.length === 0) {
        return {
          success: false,
          message: `未找到匹配的内容控件 (tag: ${tag}, title: ${title})`
        }
      }

      // 获取第一个匹配的控件的值
      const control = contentControls.items[0]
      control.load(['text', 'tag', 'title'])
      await context.sync()

      return {
        success: true,
        message: '成功获取内容控件的值',
        data: {
          tag: control.tag,
          title: control.title,
          text: control.text
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取内容控件值失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 删除内容控件
 */
export async function wordDeleteContentControl(args: {
  tag?: string
  title?: string
  keepContent?: boolean
}): Promise<ToolResult> {
  const { tag, title, keepContent = true } = args

  if (!tag && !title) {
    return {
      success: false,
      message: '必须提供 tag 或 title 参数来定位内容控件'
    }
  }

  try {
    return await Word.run(async (context) => {
      let contentControls: Word.ContentControlCollection

      // 根据筛选条件获取内容控件
      if (tag) {
        contentControls = context.document.contentControls.getByTag(tag)
      } else if (title) {
        contentControls = context.document.contentControls.getByTitle(title)
      } else {
        return {
          success: false,
          message: '必须提供 tag 或 title 参数'
        }
      }

      contentControls.load('items')
      await context.sync()

      if (contentControls.items.length === 0) {
        return {
          success: false,
          message: `未找到匹配的内容控件 (tag: ${tag}, title: ${title})`
        }
      }

      // 删除所有匹配的控件
      const deleteCount = contentControls.items.length
      for (const control of contentControls.items) {
        control.delete(keepContent)
      }

      await context.sync()

      return {
        success: true,
        message: `成功删除 ${deleteCount} 个内容控件${keepContent ? '（保留内容）' : '（删除内容）'}`,
        data: {
          tag,
          title,
          deletedCount: deleteCount,
          keepContent
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `删除内容控件失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 清除内容控件的内容
 */
export async function wordClearContentControl(args: {
  tag?: string
  title?: string
}): Promise<ToolResult> {
  const { tag, title } = args

  if (!tag && !title) {
    return {
      success: false,
      message: '必须提供 tag 或 title 参数来定位内容控件'
    }
  }

  try {
    return await Word.run(async (context) => {
      let contentControls: Word.ContentControlCollection

      // 根据筛选条件获取内容控件
      if (tag) {
        contentControls = context.document.contentControls.getByTag(tag)
      } else if (title) {
        contentControls = context.document.contentControls.getByTitle(title)
      } else {
        return {
          success: false,
          message: '必须提供 tag 或 title 参数'
        }
      }

      contentControls.load('items')
      await context.sync()

      if (contentControls.items.length === 0) {
        return {
          success: false,
          message: `未找到匹配的内容控件 (tag: ${tag}, title: ${title})`
        }
      }

      // 清除所有匹配的控件的内容
      const clearCount = contentControls.items.length
      for (const control of contentControls.items) {
        control.clear()
      }

      await context.sync()

      return {
        success: true,
        message: `成功清除 ${clearCount} 个内容控件的内容`,
        data: {
          tag,
          title,
          clearedCount: clearCount
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `清除内容控件内容失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 内容控件工具定义数组
 */
export const contentControlTools: ToolDefinition[] = [
  {
    name: 'word_insert_content_control',
    description: '在 Word 文档中插入内容控件',
    category: 'word',
    handler: wordInsertContentControl
  },
  {
    name: 'word_get_content_controls',
    description: '获取 Word 文档中的所有内容控件',
    category: 'word',
    handler: wordGetContentControls
  },
  {
    name: 'word_set_content_control_value',
    description: '设置 Word 文档中内容控件的值',
    category: 'word',
    handler: wordSetContentControlValue
  },
  {
    name: 'word_get_content_control_value',
    description: '获取 Word 文档中内容控件的值',
    category: 'word',
    handler: wordGetContentControlValue
  },
  {
    name: 'word_delete_content_control',
    description: '删除 Word 文档中的内容控件',
    category: 'word',
    handler: wordDeleteContentControl
  },
  {
    name: 'word_clear_content_control',
    description: '清除 Word 文档中内容控件的内容',
    category: 'word',
    handler: wordClearContentControl
  }
]
