/**
 * Word 画布工具实现
 * 使用 Office.js API (WordApi 1.3+) 实现画布和几何图形操作
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 插入画布
 */
export async function wordInsertCanvas(args: {
  width?: number
  height?: number
  position?: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：画布操作需要 WordApiDesktop'
  }
}

/**
 * 插入几何图形
 */
export async function wordInsertGeometricShape(args: {
  shapeType: string
  width: number
  height: number
  position?: string
  fillColor?: string
  lineColor?: string
  lineWeight?: number
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：几何图形操作需要 WordApiDesktop'
  }
}

/**
 * 获取画布列表
 */
export async function wordGetCanvases(args: Record<string, never>): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：画布操作需要 WordApiDesktop'
  }
}

/**
 * 删除画布
 */
export async function wordDeleteCanvas(args: {
  canvasId: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：画布操作需要 WordApiDesktop'
  }
}

/**
 * 在画布中添加图形
 */
export async function wordAddShapeToCanvas(args: {
  canvasId: string
  shapeType: string
  x: number
  y: number
  width: number
  height: number
  fillColor?: string
  lineColor?: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：画布操作需要 WordApiDesktop'
  }
}

/**
 * 获取画布中的图形
 */
export async function wordGetCanvasShapes(args: {
  canvasId: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：画布操作需要 WordApiDesktop'
  }
}

/**
 * 导出画布工具定义
 */
export const canvasTools: ToolDefinition[] = [
  { name: 'word_insert_canvas', handler: wordInsertCanvas, category: 'canvas', description: '插入画布' },
  { name: 'word_insert_geometric_shape', handler: wordInsertGeometricShape, category: 'canvas', description: '插入几何图形' },
  { name: 'word_get_canvases', handler: wordGetCanvases, category: 'canvas', description: '获取画布列表' },
  { name: 'word_delete_canvas', handler: wordDeleteCanvas, category: 'canvas', description: '删除画布' },
  { name: 'word_add_shape_to_canvas', handler: wordAddShapeToCanvas, category: 'canvas', description: '在画布中添加图形' },
  { name: 'word_get_canvas_shapes', handler: wordGetCanvasShapes, category: 'canvas', description: '获取画布中的图形' }
]

