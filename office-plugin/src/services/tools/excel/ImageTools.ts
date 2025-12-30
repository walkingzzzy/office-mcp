/**
 * Excel 图片工具实现
 * 使用 Office.js API (ExcelApi 1.2+) 实现图片操作
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 插入图片
 */
export async function excelInsertImage(args: {
  base64?: string
  url?: string
  name?: string
  left?: number
  top?: number
  width?: number
  height?: number
}): Promise<ToolResult> {
  const { base64, url, name, left = 0, top = 0, width, height } = args

  if (!base64 && !url) {
    return {
      success: false,
      message: '必须提供 base64 或 url 参数'
    }
  }

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()

      // 插入图片
      let image: Excel.Shape
      if (base64) {
        image = sheet.shapes.addImage(base64)
      } else if (url) {
        // Office.js 不直接支持 URL，需要先转换为 base64
        return {
          success: false,
          message: 'URL 图片插入暂不支持，请使用 base64 格式'
        }
      } else {
        return {
          success: false,
          message: '必须提供 base64 或 url 参数'
        }
      }

      // 设置图片名称
      if (name) {
        image.name = name
      }

      // 设置图片位置
      image.left = left
      image.top = top

      // 设置图片大小
      if (width !== undefined) {
        image.width = width
      }
      if (height !== undefined) {
        image.height = height
      }

      await context.sync()

      return {
        success: true,
        message: '成功插入图片',
        data: {
          name: image.name,
          left: image.left,
          top: image.top,
          width: image.width,
          height: image.height
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `插入图片失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 删除图片
 */
export async function excelDeleteImage(args: {
  name?: string
  index?: number
}): Promise<ToolResult> {
  const { name, index } = args

  if (!name && index === undefined) {
    return {
      success: false,
      message: '必须提供 name 或 index 参数'
    }
  }

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const shapes = sheet.shapes

      shapes.load('items')
      await context.sync()

      let targetShape: Excel.Shape | undefined

      if (name) {
        // 通过名称查找图片
        targetShape = shapes.items.find(shape => shape.name === name)
      } else if (index !== undefined) {
        // 通过索引查找图片
        if (index >= 0 && index < shapes.items.length) {
          targetShape = shapes.items[index]
        }
      }

      if (!targetShape) {
        return {
          success: false,
          message: `未找到匹配的图片 (name: ${name}, index: ${index})`
        }
      }

      targetShape.delete()
      await context.sync()

      return {
        success: true,
        message: '成功删除图片',
        data: {
          name,
          index
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `删除图片失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 调整图片大小
 */
export async function excelResizeImage(args: {
  name?: string
  index?: number
  width?: number
  height?: number
  scaleWidth?: number
  scaleHeight?: number
}): Promise<ToolResult> {
  const { name, index, width, height, scaleWidth, scaleHeight } = args

  if (!name && index === undefined) {
    return {
      success: false,
      message: '必须提供 name 或 index 参数'
    }
  }

  if (!width && !height && !scaleWidth && !scaleHeight) {
    return {
      success: false,
      message: '必须提供 width、height、scaleWidth 或 scaleHeight 参数'
    }
  }

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const shapes = sheet.shapes

      shapes.load('items')
      await context.sync()

      let targetShape: Excel.Shape | undefined

      if (name) {
        targetShape = shapes.items.find(shape => shape.name === name)
      } else if (index !== undefined) {
        if (index >= 0 && index < shapes.items.length) {
          targetShape = shapes.items[index]
        }
      }

      if (!targetShape) {
        return {
          success: false,
          message: `未找到匹配的图片 (name: ${name}, index: ${index})`
        }
      }

      // 加载当前尺寸
      targetShape.load(['width', 'height'])
      await context.sync()

      // 设置新尺寸
      if (width !== undefined) {
        targetShape.width = width
      } else if (scaleWidth !== undefined) {
        targetShape.width = targetShape.width * scaleWidth
      }

      if (height !== undefined) {
        targetShape.height = height
      } else if (scaleHeight !== undefined) {
        targetShape.height = targetShape.height * scaleHeight
      }

      await context.sync()

      return {
        success: true,
        message: '成功调整图片大小',
        data: {
          name: targetShape.name,
          width: targetShape.width,
          height: targetShape.height
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `调整图片大小失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 移动图片
 */
export async function excelMoveImage(args: {
  name?: string
  index?: number
  left?: number
  top?: number
}): Promise<ToolResult> {
  const { name, index, left, top } = args

  if (!name && index === undefined) {
    return {
      success: false,
      message: '必须提供 name 或 index 参数'
    }
  }

  if (left === undefined && top === undefined) {
    return {
      success: false,
      message: '必须提供 left 或 top 参数'
    }
  }

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const shapes = sheet.shapes

      shapes.load('items')
      await context.sync()

      let targetShape: Excel.Shape | undefined

      if (name) {
        targetShape = shapes.items.find(shape => shape.name === name)
      } else if (index !== undefined) {
        if (index >= 0 && index < shapes.items.length) {
          targetShape = shapes.items[index]
        }
      }

      if (!targetShape) {
        return {
          success: false,
          message: `未找到匹配的图片 (name: ${name}, index: ${index})`
        }
      }

      // 设置新位置
      if (left !== undefined) {
        targetShape.left = left
      }
      if (top !== undefined) {
        targetShape.top = top
      }

      await context.sync()

      return {
        success: true,
        message: '成功移动图片',
        data: {
          name: targetShape.name,
          left: targetShape.left,
          top: targetShape.top
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `移动图片失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取所有图片
 */
export async function excelGetImages(): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const shapes = sheet.shapes

      shapes.load('items')
      await context.sync()

      // 加载每个图片的详细信息
      for (const shape of shapes.items) {
        shape.load(['name', 'type', 'left', 'top', 'width', 'height', 'rotation', 'visible'])
      }
      await context.sync()

      // 构建返回数据
      const imagesData = shapes.items.map((shape, index) => ({
        index,
        name: shape.name,
        type: shape.type,
        left: shape.left,
        top: shape.top,
        width: shape.width,
        height: shape.height,
        rotation: shape.rotation,
        visible: shape.visible
      }))

      return {
        success: true,
        message: `成功获取 ${imagesData.length} 个图片`,
        data: {
          count: imagesData.length,
          images: imagesData
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取图片失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 设置图片属性
 */
export async function excelSetImageProperties(args: {
  name?: string
  index?: number
  lockAspectRatio?: boolean
  rotation?: number
  transparency?: number
}): Promise<ToolResult> {
  const { name, index, lockAspectRatio, rotation, transparency } = args

  if (!name && index === undefined) {
    return {
      success: false,
      message: '必须提供 name 或 index 参数'
    }
  }

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const shapes = sheet.shapes

      shapes.load('items')
      await context.sync()

      let targetShape: Excel.Shape | undefined

      if (name) {
        targetShape = shapes.items.find(shape => shape.name === name)
      } else if (index !== undefined) {
        if (index >= 0 && index < shapes.items.length) {
          targetShape = shapes.items[index]
        }
      }

      if (!targetShape) {
        return {
          success: false,
          message: `未找到匹配的图片 (name: ${name}, index: ${index})`
        }
      }

      // 设置属性
      if (lockAspectRatio !== undefined) {
        targetShape.lockAspectRatio = lockAspectRatio
      }
      if (rotation !== undefined) {
        targetShape.rotation = rotation
      }
      // 注意：Office.js 的 Shape 对象没有直接的 transparency 属性
      // 透明度通常通过 fill 或其他方式设置，这里暂不实现

      await context.sync()

      return {
        success: true,
        message: '成功设置图片属性',
        data: {
          name: targetShape.name,
          lockAspectRatio: targetShape.lockAspectRatio,
          rotation: targetShape.rotation
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `设置图片属性失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Excel 图片工具定义数组
 */
export const imageTools: ToolDefinition[] = [
  {
    name: 'excel_insert_image',
    description: '在 Excel 工作表中插入图片',
    category: 'excel',
    handler: excelInsertImage
  },
  {
    name: 'excel_delete_image',
    description: '删除 Excel 工作表中的图片',
    category: 'excel',
    handler: excelDeleteImage
  },
  {
    name: 'excel_resize_image',
    description: '调整 Excel 工作表中图片的大小',
    category: 'excel',
    handler: excelResizeImage
  },
  {
    name: 'excel_move_image',
    description: '移动 Excel 工作表中的图片位置',
    category: 'excel',
    handler: excelMoveImage
  },
  {
    name: 'excel_get_images',
    description: '获取 Excel 工作表中的所有图片信息',
    category: 'excel',
    handler: excelGetImages
  },
  {
    name: 'excel_set_image_properties',
    description: '设置 Excel 工作表中图片的属性',
    category: 'excel',
    handler: excelSetImageProperties
  }
]
