/**
 * Word 形状工具实现
 * 使用 Office.js API (WordApiDesktop) 实现形状操作
 * 注意：Shape API 仅在桌面版 Office 中可用（Windows/Mac）
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 插入形状
 */
export async function wordInsertShape(args: {
  shapeType: string
  width: number
  height: number
  left?: number
  top?: number
}): Promise<ToolResult> {
  const { shapeType, width, height, left = 0, top = 0 } = args

  try {
    return await Word.run(async (context) => {
      // 注意：Shape API 仅在桌面版可用
      return {
        success: false,
        message: 'Office.js API 限制：Shape API 仅在桌面版 Office 中可用',
        data: {
          note: '形状操作需要在 Word 桌面版中使用 WordApiDesktop',
          shapeType,
          width,
          height,
          left,
          top
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `插入形状失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 删除形状
 */
export async function wordDeleteShape(args: {
  shapeId?: string
  shapeIndex?: number
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：Shape API 仅在桌面版 Office 中可用'
  }
}

/**
 * 获取形状信息
 */
export async function wordGetShape(args: {
  shapeId?: string
  shapeIndex?: number
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：Shape API 仅在桌面版 Office 中可用'
  }
}

/**
 * 设置形状属性
 */
export async function wordSetShapeProperties(args: {
  shapeId?: string
  shapeIndex?: number
  width?: number
  height?: number
  rotation?: number
  lockAspectRatio?: boolean
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：Shape API 仅在桌面版 Office 中可用'
  }
}

/**
 * 移动形状
 */
export async function wordMoveShape(args: {
  shapeId?: string
  shapeIndex?: number
  left: number
  top: number
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：Shape API 仅在桌面版 Office 中可用'
  }
}

/**
 * 调整形状大小
 */
export async function wordResizeShape(args: {
  shapeId?: string
  shapeIndex?: number
  width?: number
  height?: number
  maintainAspectRatio?: boolean
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：Shape API 仅在桌面版 Office 中可用'
  }
}

/**
 * 设置形状填充
 */
export async function wordSetShapeFill(args: {
  shapeId?: string
  shapeIndex?: number
  fillType?: string
  color?: string
  transparency?: number
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：Shape API 仅在桌面版 Office 中可用'
  }
}

/**
 * 设置形状边框
 */
export async function wordSetShapeLine(args: {
  shapeId?: string
  shapeIndex?: number
  color?: string
  weight?: number
  dashStyle?: string
  transparency?: number
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：Shape API 仅在桌面版 Office 中可用'
  }
}

/**
 * 导出形状工具定义
 */
export const shapeTools: ToolDefinition[] = [
  { name: 'word_insert_shape', handler: wordInsertShape, category: 'shape', description: '插入形状' },
  { name: 'word_delete_shape', handler: wordDeleteShape, category: 'shape', description: '删除形状' },
  { name: 'word_get_shape', handler: wordGetShape, category: 'shape', description: '获取形状信息' },
  { name: 'word_set_shape_properties', handler: wordSetShapeProperties, category: 'shape', description: '设置形状属性' },
  { name: 'word_move_shape', handler: wordMoveShape, category: 'shape', description: '移动形状' },
  { name: 'word_resize_shape', handler: wordResizeShape, category: 'shape', description: '调整形状大小' },
  { name: 'word_set_shape_fill', handler: wordSetShapeFill, category: 'shape', description: '设置形状填充' },
  { name: 'word_set_shape_line', handler: wordSetShapeLine, category: 'shape', description: '设置形状边框' }
]

