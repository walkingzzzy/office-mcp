/**
 * Word 页眉页脚工具实现
 * 使用 Office.js API (WordApi 1.1) 实现页眉页脚操作
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 插入页眉
 */
export async function wordInsertHeader(args: {
  text: string
  type?: 'primary' | 'firstPage' | 'evenPages'
  alignment?: 'left' | 'center' | 'right'
}): Promise<ToolResult> {
  const { text, type = 'primary', alignment = 'center' } = args

  try {
    return await Word.run(async (context) => {
      // 获取文档的第一个节
      const sections = context.document.sections
      sections.load('items')
      await context.sync()

      if (sections.items.length === 0) {
        return {
          success: false,
          message: '文档中没有节，无法插入页眉'
        }
      }

      const section = sections.items[0]

      // 根据类型获取对应的页眉
      let headerType: Word.HeaderFooterType
      switch (type) {
        case 'firstPage':
          headerType = Word.HeaderFooterType.firstPage
          break
        case 'evenPages':
          headerType = Word.HeaderFooterType.evenPages
          break
        case 'primary':
        default:
          headerType = Word.HeaderFooterType.primary
          break
      }

      const header = section.getHeader(headerType)

      // 插入文本
      const paragraph = header.insertParagraph(text, Word.InsertLocation.end)

      // 设置对齐方式
      switch (alignment) {
        case 'left':
          paragraph.alignment = Word.Alignment.left
          break
        case 'right':
          paragraph.alignment = Word.Alignment.right
          break
        case 'center':
        default:
          paragraph.alignment = Word.Alignment.centered
          break
      }

      await context.sync()

      return {
        success: true,
        message: `成功插入${type === 'firstPage' ? '首页' : type === 'evenPages' ? '偶数页' : ''}页眉：${text}`,
        data: {
          type,
          alignment,
          textLength: text.length
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `插入页眉失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 插入页脚
 */
export async function wordInsertFooter(args: {
  text: string
  type?: 'primary' | 'firstPage' | 'evenPages'
  alignment?: 'left' | 'center' | 'right'
}): Promise<ToolResult> {
  const { text, type = 'primary', alignment = 'center' } = args

  try {
    return await Word.run(async (context) => {
      // 获取文档的第一个节
      const sections = context.document.sections
      sections.load('items')
      await context.sync()

      if (sections.items.length === 0) {
        return {
          success: false,
          message: '文档中没有节，无法插入页脚'
        }
      }

      const section = sections.items[0]

      // 根据类型获取对应的页脚
      let footerType: Word.HeaderFooterType
      switch (type) {
        case 'firstPage':
          footerType = Word.HeaderFooterType.firstPage
          break
        case 'evenPages':
          footerType = Word.HeaderFooterType.evenPages
          break
        case 'primary':
        default:
          footerType = Word.HeaderFooterType.primary
          break
      }

      const footer = section.getFooter(footerType)

      // 插入文本
      const paragraph = footer.insertParagraph(text, Word.InsertLocation.end)

      // 设置对齐方式
      switch (alignment) {
        case 'left':
          paragraph.alignment = Word.Alignment.left
          break
        case 'right':
          paragraph.alignment = Word.Alignment.right
          break
        case 'center':
        default:
          paragraph.alignment = Word.Alignment.centered
          break
      }

      await context.sync()

      return {
        success: true,
        message: `成功插入${type === 'firstPage' ? '首页' : type === 'evenPages' ? '偶数页' : ''}页脚：${text}`,
        data: {
          type,
          alignment,
          textLength: text.length
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `插入页脚失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取页眉内容
 */
export async function wordGetHeader(args: {
  type?: 'primary' | 'firstPage' | 'evenPages'
}): Promise<ToolResult> {
  const { type = 'primary' } = args

  try {
    return await Word.run(async (context) => {
      // 获取文档的第一个节
      const sections = context.document.sections
      sections.load('items')
      await context.sync()

      if (sections.items.length === 0) {
        return {
          success: false,
          message: '文档中没有节，无法获取页眉'
        }
      }

      const section = sections.items[0]

      // 根据类型获取对应的页眉
      let headerType: Word.HeaderFooterType
      switch (type) {
        case 'firstPage':
          headerType = Word.HeaderFooterType.firstPage
          break
        case 'evenPages':
          headerType = Word.HeaderFooterType.evenPages
          break
        case 'primary':
        default:
          headerType = Word.HeaderFooterType.primary
          break
      }

      const header = section.getHeader(headerType)
      header.load('text')
      await context.sync()

      return {
        success: true,
        message: `成功获取${type === 'firstPage' ? '首页' : type === 'evenPages' ? '偶数页' : ''}页眉内容`,
        data: {
          type,
          text: header.text,
          textLength: header.text.length
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取页眉失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取页脚内容
 */
export async function wordGetFooter(args: {
  type?: 'primary' | 'firstPage' | 'evenPages'
}): Promise<ToolResult> {
  const { type = 'primary' } = args

  try {
    return await Word.run(async (context) => {
      // 获取文档的第一个节
      const sections = context.document.sections
      sections.load('items')
      await context.sync()

      if (sections.items.length === 0) {
        return {
          success: false,
          message: '文档中没有节，无法获取页脚'
        }
      }

      const section = sections.items[0]

      // 根据类型获取对应的页脚
      let footerType: Word.HeaderFooterType
      switch (type) {
        case 'firstPage':
          footerType = Word.HeaderFooterType.firstPage
          break
        case 'evenPages':
          footerType = Word.HeaderFooterType.evenPages
          break
        case 'primary':
        default:
          footerType = Word.HeaderFooterType.primary
          break
      }

      const footer = section.getFooter(footerType)
      footer.load('text')
      await context.sync()

      return {
        success: true,
        message: `成功获取${type === 'firstPage' ? '首页' : type === 'evenPages' ? '偶数页' : ''}页脚内容`,
        data: {
          type,
          text: footer.text,
          textLength: footer.text.length
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取页脚失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 清除页眉内容
 */
export async function wordClearHeader(args: {
  type?: 'primary' | 'firstPage' | 'evenPages'
}): Promise<ToolResult> {
  const { type = 'primary' } = args

  try {
    return await Word.run(async (context) => {
      // 获取文档的第一个节
      const sections = context.document.sections
      sections.load('items')
      await context.sync()

      if (sections.items.length === 0) {
        return {
          success: false,
          message: '文档中没有节，无法清除页眉'
        }
      }

      const section = sections.items[0]

      // 根据类型获取对应的页眉
      let headerType: Word.HeaderFooterType
      switch (type) {
        case 'firstPage':
          headerType = Word.HeaderFooterType.firstPage
          break
        case 'evenPages':
          headerType = Word.HeaderFooterType.evenPages
          break
        case 'primary':
        default:
          headerType = Word.HeaderFooterType.primary
          break
      }

      const header = section.getHeader(headerType)
      header.clear()
      await context.sync()

      return {
        success: true,
        message: `成功清除${type === 'firstPage' ? '首页' : type === 'evenPages' ? '偶数页' : ''}页眉内容`,
        data: {
          type
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `清除页眉失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 清除页脚内容
 */
export async function wordClearFooter(args: {
  type?: 'primary' | 'firstPage' | 'evenPages'
}): Promise<ToolResult> {
  const { type = 'primary' } = args

  try {
    return await Word.run(async (context) => {
      // 获取文档的第一个节
      const sections = context.document.sections
      sections.load('items')
      await context.sync()

      if (sections.items.length === 0) {
        return {
          success: false,
          message: '文档中没有节，无法清除页脚'
        }
      }

      const section = sections.items[0]

      // 根据类型获取对应的页脚
      let footerType: Word.HeaderFooterType
      switch (type) {
        case 'firstPage':
          footerType = Word.HeaderFooterType.firstPage
          break
        case 'evenPages':
          footerType = Word.HeaderFooterType.evenPages
          break
        case 'primary':
        default:
          footerType = Word.HeaderFooterType.primary
          break
      }

      const footer = section.getFooter(footerType)
      footer.clear()
      await context.sync()

      return {
        success: true,
        message: `成功清除${type === 'firstPage' ? '首页' : type === 'evenPages' ? '偶数页' : ''}页脚内容`,
        data: {
          type
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `清除页脚失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 页眉页脚工具定义数组
 */
export const headerFooterTools: ToolDefinition[] = [
  {
    name: 'word_insert_header',
    description: '在 Word 文档中插入页眉',
    category: 'word',
    handler: wordInsertHeader
  },
  {
    name: 'word_insert_footer',
    description: '在 Word 文档中插入页脚',
    category: 'word',
    handler: wordInsertFooter
  },
  {
    name: 'word_get_header',
    description: '获取 Word 文档的页眉内容',
    category: 'word',
    handler: wordGetHeader
  },
  {
    name: 'word_get_footer',
    description: '获取 Word 文档的页脚内容',
    category: 'word',
    handler: wordGetFooter
  },
  {
    name: 'word_clear_header',
    description: '清除 Word 文档的页眉内容',
    category: 'word',
    handler: wordClearHeader
  },
  {
    name: 'word_clear_footer',
    description: '清除 Word 文档的页脚内容',
    category: 'word',
    handler: wordClearFooter
  }
]
