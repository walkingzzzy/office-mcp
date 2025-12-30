/**
 * Excel 形状工具实现
 * 使用 Office.js API (ExcelApi 1.9+) 实现形状操作
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 添加形状
 */
export async function excelAddShape(args: {
  shapeType: string
  position: { left: number; top: number }
  size: { width: number; height: number }
  worksheetName?: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const sheet = args.worksheetName
        ? context.workbook.worksheets.getItem(args.worksheetName)
        : context.workbook.worksheets.getActiveWorksheet()

      const shapeTypeMap: Record<string, Excel.GeometricShapeType> = {
        rectangle: Excel.GeometricShapeType.rectangle,
        oval: Excel.GeometricShapeType.ellipse,
        triangle: Excel.GeometricShapeType.triangle,
        diamond: Excel.GeometricShapeType.diamond,
        pentagon: Excel.GeometricShapeType.pentagon,
        hexagon: Excel.GeometricShapeType.hexagon
      }

      const geometricType = shapeTypeMap[args.shapeType] || Excel.GeometricShapeType.rectangle
      const shape = sheet.shapes.addGeometricShape(geometricType)
      shape.left = args.position.left
      shape.top = args.position.top
      shape.width = args.size.width
      shape.height = args.size.height
      shape.load('id,name')
      await context.sync()

      return {
        success: true,
        message: '成功添加形状',
        data: { shapeId: shape.id, shapeName: shape.name }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `添加形状失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 获取所有形状
 */
export async function excelGetShapes(args: {
  worksheetName?: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const sheet = args.worksheetName
        ? context.workbook.worksheets.getItem(args.worksheetName)
        : context.workbook.worksheets.getActiveWorksheet()

      const shapes = sheet.shapes
      shapes.load('items/id,items/name,items/geometricShapeType,items/left,items/top,items/width,items/height')
      await context.sync()

      const shapeList = shapes.items.map(s => ({
        id: s.id, name: s.name, type: s.geometricShapeType,
        left: s.left, top: s.top, width: s.width, height: s.height
      }))

      return {
        success: true,
        message: `成功获取 ${shapeList.length} 个形状`,
        data: { shapes: shapeList }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `获取形状失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 获取形状详情
 */
export async function excelGetShapeDetail(args: {
  shapeName: string
  worksheetName?: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const sheet = args.worksheetName
        ? context.workbook.worksheets.getItem(args.worksheetName)
        : context.workbook.worksheets.getActiveWorksheet()

      const shape = sheet.shapes.getItem(args.shapeName)
      shape.load('id,name,geometricShapeType,left,top,width,height,rotation,visible,zOrderPosition')
      await context.sync()

      return {
        success: true,
        message: '成功获取形状详情',
        data: {
          id: shape.id, name: shape.name, type: shape.geometricShapeType,
          left: shape.left, top: shape.top, width: shape.width, height: shape.height,
          rotation: shape.rotation, visible: shape.visible, zOrderPosition: shape.zOrderPosition
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `获取形状详情失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 更新形状
 */
export async function excelUpdateShape(args: {
  shapeName: string
  position?: { left: number; top: number }
  size?: { width: number; height: number }
  rotation?: number
  visible?: boolean
  worksheetName?: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const sheet = args.worksheetName
        ? context.workbook.worksheets.getItem(args.worksheetName)
        : context.workbook.worksheets.getActiveWorksheet()

      const shape = sheet.shapes.getItem(args.shapeName)
      if (args.position) { shape.left = args.position.left; shape.top = args.position.top }
      if (args.size) { shape.width = args.size.width; shape.height = args.size.height }
      if (args.rotation !== undefined) shape.rotation = args.rotation
      if (args.visible !== undefined) shape.visible = args.visible
      await context.sync()

      return { success: true, message: '成功更新形状' }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `更新形状失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 设置形状填充
 */
export async function excelSetShapeFill(args: {
  shapeName: string
  fillType: string
  color?: string
  transparency?: number
  worksheetName?: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const sheet = args.worksheetName
        ? context.workbook.worksheets.getItem(args.worksheetName)
        : context.workbook.worksheets.getActiveWorksheet()

      const shape = sheet.shapes.getItem(args.shapeName)
      const fill = shape.fill
      if (args.fillType === 'solid' && args.color) {
        fill.setSolidColor(args.color)
      } else if (args.fillType === 'none') {
        fill.clear()
      }
      if (args.transparency !== undefined) fill.transparency = args.transparency
      await context.sync()

      return { success: true, message: '成功设置形状填充' }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `设置形状填充失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 设置形状边框
 */
export async function excelSetShapeLine(args: {
  shapeName: string
  color?: string
  weight?: number
  style?: string
  transparency?: number
  worksheetName?: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const sheet = args.worksheetName
        ? context.workbook.worksheets.getItem(args.worksheetName)
        : context.workbook.worksheets.getActiveWorksheet()

      const shape = sheet.shapes.getItem(args.shapeName)
      const line = shape.lineFormat
      if (args.color) line.color = args.color
      if (args.weight !== undefined) line.weight = args.weight
      if (args.transparency !== undefined) line.transparency = args.transparency
      await context.sync()

      return { success: true, message: '成功设置形状边框' }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `设置形状边框失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 添加形状文本
 */
export async function excelAddShapeText(args: {
  shapeName: string
  text: string
  fontSize?: number
  fontColor?: string
  bold?: boolean
  italic?: boolean
  worksheetName?: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const sheet = args.worksheetName
        ? context.workbook.worksheets.getItem(args.worksheetName)
        : context.workbook.worksheets.getActiveWorksheet()

      const shape = sheet.shapes.getItem(args.shapeName)
      const textFrame = shape.textFrame
      textFrame.textRange.text = args.text
      const font = textFrame.textRange.font
      if (args.fontSize) font.size = args.fontSize
      if (args.fontColor) font.color = args.fontColor
      if (args.bold !== undefined) font.bold = args.bold
      if (args.italic !== undefined) font.italic = args.italic
      await context.sync()

      return { success: true, message: '成功添加形状文本' }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `添加形状文本失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 删除形状
 */
export async function excelDeleteShape(args: {
  shapeName: string
  worksheetName?: string
}): Promise<ToolResult> {
  try {
    return await Excel.run(async (context) => {
      const sheet = args.worksheetName
        ? context.workbook.worksheets.getItem(args.worksheetName)
        : context.workbook.worksheets.getActiveWorksheet()

      const shape = sheet.shapes.getItem(args.shapeName)
      shape.delete()
      await context.sync()

      return { success: true, message: '成功删除形状' }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `删除形状失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 导出形状工具定义
 */
export const excelShapeTools: ToolDefinition[] = [
  { name: 'excel_add_shape', handler: excelAddShape, category: 'shape', description: '添加形状' },
  { name: 'excel_get_shapes', handler: excelGetShapes, category: 'shape', description: '获取所有形状' },
  { name: 'excel_get_shape_detail', handler: excelGetShapeDetail, category: 'shape', description: '获取形状详情' },
  { name: 'excel_update_shape', handler: excelUpdateShape, category: 'shape', description: '更新形状' },
  { name: 'excel_set_shape_fill', handler: excelSetShapeFill, category: 'shape', description: '设置形状填充' },
  { name: 'excel_set_shape_line', handler: excelSetShapeLine, category: 'shape', description: '设置形状边框' },
  { name: 'excel_add_shape_text', handler: excelAddShapeText, category: 'shape', description: '添加形状文本' },
  { name: 'excel_delete_shape', handler: excelDeleteShape, category: 'shape', description: '删除形状' }
]
