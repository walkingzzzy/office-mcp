/**
 * PowerPoint 形状和文本工具
 * 包含 12 个形状相关工具
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

/**
 * 添加文本框
 */
async function pptAddTextBox(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex, text, left = 100, top = 100, width = 200, height = 50 } = args

  if (slideIndex === undefined || !text) {
    return { success: false, message: 'slideIndex 和 text 参数不能为空' }
  }

  return new Promise((resolve) => {
    PowerPoint.run(async (context) => {
      const slides = context.presentation.slides
      slides.load('items')
      await context.sync()

      if (slideIndex < 0 || slideIndex >= slides.items.length) {
        resolve({ success: false, message: `幻灯片索引超出范围: ${slideIndex}` })
        return
      }

      const slide = slides.items[slideIndex]
      const shapes = slide.shapes
      
      // 添加文本框
      const textBox = shapes.addTextBox(text, {
        left,
        top,
        width,
        height
      })
      
      await context.sync()

      resolve({
        success: true,
        message: '文本框已添加',
        data: { slideIndex, text, position: { left, top, width, height } }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `添加文本框失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 添加形状
 */
async function pptAddShape(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex, shapeType = 'rectangle', left = 100, top = 100, width = 100, height = 100 } = args

  if (slideIndex === undefined) {
    return { success: false, message: 'slideIndex 参数不能为空' }
  }

  return new Promise((resolve) => {
    PowerPoint.run(async (context) => {
      const slides = context.presentation.slides
      slides.load('items')
      await context.sync()

      if (slideIndex < 0 || slideIndex >= slides.items.length) {
        resolve({ success: false, message: `幻灯片索引超出范围: ${slideIndex}` })
        return
      }

      const slide = slides.items[slideIndex]
      
      // 添加形状
      const shape = slide.shapes.addGeometricShape(shapeType as any, {
        left,
        top,
        width,
        height
      })
      
      await context.sync()

      resolve({
        success: true,
        message: '形状已添加',
        data: { slideIndex, shapeType, position: { left, top, width, height } }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `添加形状失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 删除形状
 */
async function pptDeleteShape(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex, shapeIndex } = args

  if (slideIndex === undefined || shapeIndex === undefined) {
    return { success: false, message: 'slideIndex 和 shapeIndex 参数不能为空' }
  }

  return new Promise((resolve) => {
    PowerPoint.run(async (context) => {
      const slides = context.presentation.slides
      slides.load('items')
      await context.sync()

      if (slideIndex < 0 || slideIndex >= slides.items.length) {
        resolve({ success: false, message: `幻灯片索引超出范围: ${slideIndex}` })
        return
      }

      const slide = slides.items[slideIndex]
      const shapes = slide.shapes
      shapes.load('items')
      await context.sync()

      if (shapeIndex < 0 || shapeIndex >= shapes.items.length) {
        resolve({ success: false, message: `形状索引超出范围: ${shapeIndex}` })
        return
      }

      shapes.items[shapeIndex].delete()
      await context.sync()

      resolve({
        success: true,
        message: '形状已删除',
        data: { slideIndex, shapeIndex }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `删除形状失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 移动形状
 */
async function pptMoveShape(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex, shapeIndex, left, top } = args

  if (slideIndex === undefined || shapeIndex === undefined) {
    return { success: false, message: 'slideIndex 和 shapeIndex 参数不能为空' }
  }

  return new Promise((resolve) => {
    PowerPoint.run(async (context) => {
      const slides = context.presentation.slides
      slides.load('items')
      await context.sync()

      if (slideIndex < 0 || slideIndex >= slides.items.length) {
        resolve({ success: false, message: `幻灯片索引超出范围` })
        return
      }

      const slide = slides.items[slideIndex]
      const shapes = slide.shapes
      shapes.load('items')
      await context.sync()

      if (shapeIndex < 0 || shapeIndex >= shapes.items.length) {
        resolve({ success: false, message: `形状索引超出范围` })
        return
      }

      const shape = shapes.items[shapeIndex]
      if (left !== undefined) shape.left = left
      if (top !== undefined) shape.top = top
      
      await context.sync()

      resolve({
        success: true,
        message: '形状位置已更新',
        data: { slideIndex, shapeIndex, left, top }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `移动形状失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 调整形状大小
 */
async function pptResizeShape(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex, shapeIndex, width, height } = args

  if (slideIndex === undefined || shapeIndex === undefined) {
    return { success: false, message: 'slideIndex 和 shapeIndex 参数不能为空' }
  }

  return new Promise((resolve) => {
    PowerPoint.run(async (context) => {
      const slides = context.presentation.slides
      slides.load('items')
      await context.sync()

      const slide = slides.items[slideIndex]
      const shapes = slide.shapes
      shapes.load('items')
      await context.sync()

      const shape = shapes.items[shapeIndex]
      if (width !== undefined) shape.width = width
      if (height !== undefined) shape.height = height
      
      await context.sync()

      resolve({
        success: true,
        message: '形状大小已调整',
        data: { slideIndex, shapeIndex, width, height }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `调整形状大小失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置形状填充
 */
async function pptSetShapeFill(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex, shapeIndex, color } = args

  if (slideIndex === undefined || shapeIndex === undefined || !color) {
    return { success: false, message: 'slideIndex、shapeIndex 和 color 参数不能为空' }
  }

  return new Promise((resolve) => {
    PowerPoint.run(async (context) => {
      const slides = context.presentation.slides
      slides.load('items')
      await context.sync()

      const slide = slides.items[slideIndex]
      const shapes = slide.shapes
      shapes.load('items')
      await context.sync()

      const shape = shapes.items[shapeIndex]
      shape.fill.setSolidColor(color)
      
      await context.sync()

      resolve({
        success: true,
        message: '形状填充已设置',
        data: { slideIndex, shapeIndex, color }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置形状填充失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置形状轮廓
 */
async function pptSetShapeOutline(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex, shapeIndex, color, weight } = args

  if (slideIndex === undefined || shapeIndex === undefined) {
    return { success: false, message: 'slideIndex 和 shapeIndex 参数不能为空' }
  }

  return new Promise((resolve) => {
    PowerPoint.run(async (context) => {
      const slides = context.presentation.slides
      slides.load('items')
      await context.sync()

      const slide = slides.items[slideIndex]
      const shapes = slide.shapes
      shapes.load('items')
      await context.sync()

      const shape = shapes.items[shapeIndex]
      if (color) shape.lineFormat.color = color
      if (weight) shape.lineFormat.weight = weight
      
      await context.sync()

      resolve({
        success: true,
        message: '形状轮廓已设置',
        data: { slideIndex, shapeIndex, color, weight }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置形状轮廓失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 设置文本格式
 */
async function pptSetTextFormat(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex, shapeIndex, bold, italic, size, fontSize, name, fontName, color } = args
  const actualSize = size || fontSize
  const actualName = name || fontName

  if (slideIndex === undefined || shapeIndex === undefined) {
    return { success: false, message: 'slideIndex 和 shapeIndex 参数不能为空' }
  }

  return new Promise((resolve) => {
    PowerPoint.run(async (context) => {
      const slides = context.presentation.slides
      slides.load('items')
      await context.sync()

      const slide = slides.items[slideIndex]
      const shapes = slide.shapes
      shapes.load('items')
      await context.sync()

      const shape = shapes.items[shapeIndex]
      const textFrame = shape.textFrame
      const textRange = textFrame.textRange

      if (bold !== undefined) textRange.font.bold = bold
      if (italic !== undefined) textRange.font.italic = italic
      if (actualSize !== undefined) textRange.font.size = actualSize
      if (actualName !== undefined) textRange.font.name = actualName
      if (color !== undefined) textRange.font.color = color
      
      await context.sync()

      resolve({
        success: true,
        message: '文本格式已设置',
        data: { slideIndex, shapeIndex }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `设置文本格式失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 对齐形状
 */
async function pptAlignShapes(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex, alignment } = args

  return {
    success: false,
    message: 'ppt_align_shapes: PowerPoint API 对形状对齐的支持有限。请在 PowerPoint 中选择形状后使用"格式-对齐"功能。',
    data: { slideIndex, alignment }
  }
}

/**
 * 组合形状
 */
async function pptGroupShapes(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex, shapeIndices } = args

  return {
    success: false,
    message: 'ppt_group_shapes: PowerPoint API 对形状组合的支持有限。请在 PowerPoint 中选择形状后使用"格式-组合"功能。',
    data: { slideIndex, shapeIndices }
  }
}

/**
 * 取消组合形状
 */
async function pptUngroupShapes(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex, shapeIndex } = args

  return {
    success: false,
    message: 'ppt_ungroup_shapes: PowerPoint API 对取消组合的支持有限。请在 PowerPoint 中选择组合后使用"格式-取消组合"功能。',
    data: { slideIndex, shapeIndex }
  }
}

/**
 * 旋转形状
 */
async function pptRotateShape(args: Record<string, any>): Promise<FunctionResult> {
  const { slideIndex, shapeIndex, rotation } = args

  if (slideIndex === undefined || shapeIndex === undefined || rotation === undefined) {
    return { success: false, message: 'slideIndex、shapeIndex 和 rotation 参数不能为空' }
  }

  return new Promise((resolve) => {
    PowerPoint.run(async (context) => {
      const slides = context.presentation.slides
      slides.load('items')
      await context.sync()

      const slide = slides.items[slideIndex]
      const shapes = slide.shapes
      shapes.load('items')
      await context.sync()

      const shape = shapes.items[shapeIndex]
      // rotation 属性在某些API版本中可能不可用，使用替代方案
      // 直接设置 rotation 可能需要更高版本的 API
      ;(shape as any).rotation = rotation
      
      await context.sync()

      resolve({
        success: true,
        message: '形状已旋转',
        data: { slideIndex, shapeIndex, rotation }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `旋转形状失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出形状工具定义
 */
export const shapeTools: ToolDefinition[] = [
  { name: 'ppt_add_text_box', handler: pptAddTextBox, category: 'shape', description: '添加文本框' },
  { name: 'ppt_add_shape', handler: pptAddShape, category: 'shape', description: '添加形状' },
  { name: 'ppt_delete_shape', handler: pptDeleteShape, category: 'shape', description: '删除形状' },
  { name: 'ppt_move_shape', handler: pptMoveShape, category: 'shape', description: '移动形状' },
  { name: 'ppt_resize_shape', handler: pptResizeShape, category: 'shape', description: '调整形状大小' },
  { name: 'ppt_set_shape_fill', handler: pptSetShapeFill, category: 'shape', description: '设置形状填充' },
  { name: 'ppt_set_shape_outline', handler: pptSetShapeOutline, category: 'shape', description: '设置形状轮廓' },
  { name: 'ppt_set_text_format', handler: pptSetTextFormat, category: 'shape', description: '设置文本格式' },
  { name: 'ppt_align_shapes', handler: pptAlignShapes, category: 'shape', description: '对齐形状' },
  { name: 'ppt_group_shapes', handler: pptGroupShapes, category: 'shape', description: '组合形状' },
  { name: 'ppt_ungroup_shapes', handler: pptUngroupShapes, category: 'shape', description: '取消组合形状' },
  { name: 'ppt_rotate_shape', handler: pptRotateShape, category: 'shape', description: '旋转形状' }
]
