/**
 * Word 高级图片操作工具
 * 包含：word_move_image, word_rotate_image, word_set_image_position,
 *       word_wrap_text_around_image, word_add_image_caption, word_compress_images, word_replace_image
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'
import { AttachmentStore } from '../../AttachmentStore'

/**
 * 获取图片的辅助函数
 */
async function getInlinePicture(context: Word.RequestContext, imageIndex: number): Promise<Word.InlinePicture | null> {
  const body = context.document.body
  const inlinePictures = body.inlinePictures
  inlinePictures.load('items')
  await context.sync()

  if (inlinePictures.items.length === 0) {
    return null
  }

  if (imageIndex < 0 || imageIndex >= inlinePictures.items.length) {
    return null
  }

  return inlinePictures.items[imageIndex]
}

/**
 * 移动图片
 */
async function wordMoveImage(args: Record<string, any>): Promise<FunctionResult> {
  const { imageIndex = 0, x, y } = args

  if (x === undefined || y === undefined) {
    return { success: false, message: '请提供 x 和 y 坐标参数' }
  }

  // Office.js 的 InlinePicture 不支持精确的位置控制
  // 内联图片的位置由文本流决定
  return {
    success: false,
    message: 'word_move_image: 内联图片(InlinePicture)的位置由文本流决定，不支持精确的 x/y 坐标移动。如需移动图片，请在 Word 中将图片设置为"浮动"模式后手动拖动。',
    data: { 
      imageIndex, 
      requestedPosition: { x, y },
      suggestion: '可以使用 word_delete_image 删除图片，然后在新位置使用 word_insert_image 重新插入'
    }
  }
}

/**
 * 旋转图片
 */
async function wordRotateImage(args: Record<string, any>): Promise<FunctionResult> {
  const { imageIndex = 0, degrees } = args

  if (degrees === undefined) {
    return { success: false, message: '请提供 degrees 旋转角度参数' }
  }

  // Office.js 的 InlinePicture 不支持旋转
  return {
    success: false,
    message: 'word_rotate_image: Office.js 的 Word API 不支持图片旋转功能。请在 Word 中手动选择图片后使用"图片格式-旋转"功能。',
    data: { imageIndex, degrees }
  }
}

/**
 * 设置图片位置类型
 */
async function wordSetImagePosition(args: Record<string, any>): Promise<FunctionResult> {
  const { imageIndex = 0, positionType, alignment } = args

  if (!positionType) {
    return { success: false, message: '请提供 positionType 参数' }
  }

  // Office.js 不支持将内联图片转换为浮动图片
  return {
    success: false,
    message: 'word_set_image_position: Office.js 的 Word API 不支持更改图片的定位类型（内联/浮动）。请在 Word 中手动设置图片的"文字环绕"选项。',
    data: { imageIndex, positionType, alignment }
  }
}

/**
 * 设置文字环绕
 */
async function wordWrapTextAroundImage(args: Record<string, any>): Promise<FunctionResult> {
  const { imageIndex = 0, wrapType, wrapSide = 'both' } = args

  if (!wrapType) {
    return { success: false, message: '请提供 wrapType 参数' }
  }

  // Office.js 不支持设置文字环绕
  return {
    success: false,
    message: 'word_wrap_text_around_image: Office.js 的 Word API 不支持设置文字环绕。请在 Word 中手动选择图片后使用"图片格式-文字环绕"功能。',
    data: { 
      imageIndex, 
      wrapType, 
      wrapSide,
      availableWrapTypes: ['square', 'tight', 'through', 'topBottom', 'behind', 'inFront']
    }
  }
}

/**
 * 添加图片标题
 */
async function wordAddImageCaption(args: Record<string, any>): Promise<FunctionResult> {
  const { imageIndex = 0, caption, position = 'below', includeLabel = true } = args

  if (!caption) {
    return { success: false, message: '请提供 caption 标题文本参数' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const picture = await getInlinePicture(context, imageIndex)
      
      if (!picture) {
        resolve({ success: false, message: `未找到图片（索引: ${imageIndex}）` })
        return
      }

      // 获取图片所在的段落
      const paragraph = picture.paragraph
      paragraph.load('text')
      await context.sync()

      // 构建标题文本
      const labelText = includeLabel ? `图 ${imageIndex + 1}: ` : ''
      const captionText = labelText + caption

      // 在图片后面插入新段落作为标题
      const insertLocation = position === 'above' ? Word.InsertLocation.before : Word.InsertLocation.after
      const captionParagraph = paragraph.insertParagraph(captionText, insertLocation)
      
      // 设置标题样式（居中、斜体）
      captionParagraph.alignment = Word.Alignment.centered
      captionParagraph.font.italic = true
      captionParagraph.font.size = 10

      await context.sync()

      resolve({
        success: true,
        message: '图片标题已添加',
        data: { imageIndex, caption: captionText, position }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `添加图片标题失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 压缩图片
 */
async function wordCompressImages(args: Record<string, any>): Promise<FunctionResult> {
  const { quality = 'medium', deleteEditingData = true, targetImageIndex } = args

  // Office.js 不支持图片压缩
  return {
    success: false,
    message: 'word_compress_images: Office.js 的 Word API 不支持图片压缩功能。请在 Word 中使用"文件-信息-压缩媒体"功能，或选择图片后使用"图片格式-压缩图片"。',
    data: { 
      quality, 
      deleteEditingData,
      targetImageIndex,
      suggestion: '建议在插入图片前先使用图像编辑软件压缩图片'
    }
  }
}

/**
 * 替换图片
 */
async function wordReplaceImage(args: Record<string, any>): Promise<FunctionResult> {
  const { imageIndex = 0, newImagePath, maintainSize = true } = args

  if (!newImagePath) {
    return { success: false, message: '请提供 newImagePath 新图片路径参数' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const picture = await getInlinePicture(context, imageIndex)
      
      if (!picture) {
        resolve({ success: false, message: `未找到图片（索引: ${imageIndex}）` })
        return
      }

      // 加载原图片尺寸
      picture.load('width,height')
      await context.sync()

      const originalWidth = picture.width
      const originalHeight = picture.height

      // 尝试解析图片路径（可能是占位符或 base64）
      let base64Image: string | null = null

      // 检查是否是占位符引用
      if (newImagePath.startsWith('attachment:') || newImagePath.includes('placeholder')) {
        // AttachmentStore 可能没有 getInstance 方法，直接使用导入的实例
        const placeholderId = newImagePath.replace('attachment:', '')
        base64Image = await AttachmentStore.resolveImagePlaceholder(placeholderId)
      }

      if (!base64Image) {
        // 如果不是占位符，可能是直接的 base64 数据
        if (newImagePath.startsWith('data:image')) {
          base64Image = newImagePath.split(',')[1]
        } else {
          resolve({
            success: false,
            message: '无法加载新图片。请提供有效的图片路径、占位符或 base64 数据。',
            data: { newImagePath }
          })
          return
        }
      }

      // 获取图片所在的段落位置
      const paragraph = picture.paragraph

      // 删除原图片
      picture.delete()
      await context.sync()

      // 在同一位置插入新图片
      const newPicture = paragraph.insertInlinePictureFromBase64(base64Image, Word.InsertLocation.start)

      // 如果需要保持原尺寸
      if (maintainSize && originalWidth && originalHeight) {
        newPicture.width = originalWidth
        newPicture.height = originalHeight
      }

      await context.sync()

      resolve({
        success: true,
        message: '图片已替换',
        data: { 
          imageIndex, 
          maintainSize,
          size: maintainSize ? { width: originalWidth, height: originalHeight } : 'auto'
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `替换图片失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出高级图片工具定义
 */
export const advancedImageTools: ToolDefinition[] = [
  { name: 'word_move_image', handler: wordMoveImage, category: 'image', description: '移动图片' },
  { name: 'word_rotate_image', handler: wordRotateImage, category: 'image', description: '旋转图片' },
  { name: 'word_set_image_position', handler: wordSetImagePosition, category: 'image', description: '设置图片位置' },
  { name: 'word_wrap_text_around_image', handler: wordWrapTextAroundImage, category: 'image', description: '设置文字环绕' },
  { name: 'word_add_image_caption', handler: wordAddImageCaption, category: 'image', description: '添加图片标题' },
  { name: 'word_compress_images', handler: wordCompressImages, category: 'image', description: '压缩图片' },
  { name: 'word_replace_image', handler: wordReplaceImage, category: 'image', description: '替换图片' }
]
