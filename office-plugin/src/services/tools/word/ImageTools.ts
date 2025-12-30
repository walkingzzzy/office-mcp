/**
 * Word 图片操作工具
 * 包含：word_insert_image, word_resize_image, word_delete_image, word_get_images
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'
import { AttachmentStore } from '../../AttachmentStore'
import Logger from '../../../utils/logger'

const logger = new Logger('WordImageTools')

/**
 * 插入图片
 */
async function wordInsertImage(args: Record<string, any>): Promise<FunctionResult> {
  let { imageData, imagePath, base64Data, location = 'end', width, height } = args

  // 支持从附件存储获取图片
  let resolvedFromAttachment = false
  for (const source of [imageData, base64Data, imagePath]) {
    if (source && typeof source === 'string') {
      const resolved = AttachmentStore.resolveImagePlaceholder(source)
      if (resolved) {
        base64Data = resolved
        resolvedFromAttachment = true
        logger.info('[ImageTools] 从附件存储解析图片', { 
          originalPlaceholder: source.substring(0, 50) 
        })
        break
      }
    }
  }

  // 如果没有显式提供图片，尝试使用最近上传的图片
  if (!base64Data && !imageData && !imagePath) {
    const imageAttachments = AttachmentStore.getImageAttachments()
    if (imageAttachments.length > 0) {
      const latestImage = imageAttachments[imageAttachments.length - 1]
      if (latestImage.base64Data) {
        base64Data = latestImage.base64Data
        resolvedFromAttachment = true
        logger.info('[ImageTools] 使用最近上传的图片', {
          fileName: latestImage.fileName,
          fileId: latestImage.fileId
        })
      }
    }
  }

  const imageSource = imageData || base64Data || imagePath

  if (!imageSource) {
    return {
      success: false,
      message: '请提供图片数据 (imageData/base64Data) 或图片路径 (imagePath)，或先上传一张图片'
    }
  }

  // 🔧 输入验证：确保是有效的 base64 数据
  let base64String = imageSource
  
  if (base64String.startsWith('data:image')) {
    base64String = base64String.split(',')[1]
  }

  // 验证是否是有效的 base64 字符串（至少应该足够长且只包含有效字符）
  const isValidBase64 = /^[A-Za-z0-9+/=]{100,}$/.test(base64String)
  if (!isValidBase64) {
    logger.warn('[ImageTools] 无效的图片数据', { 
      inputLength: base64String.length,
      inputPreview: base64String.substring(0, 50)
    })
    return {
      success: false,
      message: `无效的图片数据。请注意：
1. 需要提供 base64 格式的图片数据，而不是文件路径
2. 请先上传一张图片，然后再请求插入
3. 输入 "${base64String.substring(0, 30)}..." 不是有效的图片数据`
    }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const body = context.document.body
      
      let insertionPoint: Word.Range
      if (location === 'start') {
        insertionPoint = body.getRange(Word.RangeLocation.start)
      } else if (location === 'cursor') {
        insertionPoint = context.document.getSelection()
      } else {
        insertionPoint = body.getRange(Word.RangeLocation.end)
      }

      const inlinePicture = insertionPoint.insertInlinePictureFromBase64(base64String, Word.InsertLocation.after)
      
      if (width || height) {
        inlinePicture.load('width,height')
        await context.sync()
        
        if (width) {
          inlinePicture.width = width
        }
        if (height) {
          inlinePicture.height = height
        }
      }
      
      await context.sync()

      logger.info('[ImageTools] 图片插入成功', {
        location,
        width,
        height,
        hasCustomSize: !!(width || height)
      })

      resolve({
        success: true,
        message: '图片插入成功',
        data: {
          location,
          width: width || 'auto',
          height: height || 'auto'
        }
      })
    }).catch((error) => {
      logger.error('[ImageTools] 图片插入失败', { error: error instanceof Error ? error.message : String(error) })
      resolve({
        success: false,
        message: `插入图片失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 调整图片尺寸
 */
async function wordResizeImage(args: Record<string, any>): Promise<FunctionResult> {
  const { imageIndex = 0, width, height, maintainAspectRatio = true } = args

  if (width === undefined && height === undefined) {
    return { success: false, message: '请提供 width 或 height 参数' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const body = context.document.body
      const inlinePictures = body.inlinePictures
      inlinePictures.load('items')
      await context.sync()

      if (inlinePictures.items.length === 0) {
        resolve({
          success: false,
          message: '文档中没有图片'
        })
        return
      }

      if (imageIndex >= inlinePictures.items.length) {
        resolve({
          success: false,
          message: `图片索引超出范围，文档中只有 ${inlinePictures.items.length} 张图片（索引从 0 开始）`
        })
        return
      }

      const picture = inlinePictures.items[imageIndex]
      picture.load('width,height')
      await context.sync()

      const originalWidth = picture.width
      const originalHeight = picture.height
      const aspectRatio = originalWidth / originalHeight

      if (maintainAspectRatio) {
        if (width !== undefined && width !== null) {
          picture.width = width
          picture.height = width / aspectRatio
        } else if (height !== undefined && height !== null) {
          picture.height = height
          picture.width = height * aspectRatio
        }
      } else {
        if (width !== undefined && width !== null) {
          picture.width = width
        }
        if (height !== undefined && height !== null) {
          picture.height = height
        }
      }

      await context.sync()

      logger.info('[ImageTools] 图片尺寸调整成功', {
        imageIndex,
        originalSize: { width: originalWidth, height: originalHeight },
        newSize: { width: picture.width, height: picture.height }
      })

      resolve({
        success: true,
        message: '图片尺寸调整成功',
        data: {
          imageIndex,
          originalWidth,
          originalHeight,
          newWidth: picture.width,
          newHeight: picture.height
        }
      })
    }).catch((error) => {
      logger.error('[ImageTools] 图片尺寸调整失败', { error: error instanceof Error ? error.message : String(error) })
      resolve({
        success: false,
        message: `调整图片尺寸失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 删除图片
 */
async function wordDeleteImage(args: Record<string, any>): Promise<FunctionResult> {
  const { imageIndex = 0, deleteSelected = false } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      if (deleteSelected) {
        const selection = context.document.getSelection()
        const pictures = selection.inlinePictures
        pictures.load('items')
        await context.sync()

        if (pictures.items.length === 0) {
          resolve({
            success: false,
            message: '请先选择要删除的图片'
          })
          return
        }

        for (const picture of pictures.items) {
          picture.delete()
        }
        await context.sync()

        resolve({
          success: true,
          message: `成功删除 ${pictures.items.length} 张选中的图片`,
          data: { deletedCount: pictures.items.length }
        })
      } else {
        const body = context.document.body
        const inlinePictures = body.inlinePictures
        inlinePictures.load('items')
        await context.sync()

        if (inlinePictures.items.length === 0) {
          resolve({
            success: false,
            message: '文档中没有图片'
          })
          return
        }

        if (imageIndex >= inlinePictures.items.length) {
          resolve({
            success: false,
            message: `图片索引超出范围，文档中只有 ${inlinePictures.items.length} 张图片（索引从 0 开始）`
          })
          return
        }

        inlinePictures.items[imageIndex].delete()
        await context.sync()

        logger.info('[ImageTools] 图片删除成功', { imageIndex })

        resolve({
          success: true,
          message: `成功删除第 ${imageIndex + 1} 张图片`,
          data: { imageIndex }
        })
      }
    }).catch((error) => {
      logger.error('[ImageTools] 图片删除失败', { error: error instanceof Error ? error.message : String(error) })
      resolve({
        success: false,
        message: `删除图片失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 获取文档中的图片列表
 */
async function wordGetImages(): Promise<FunctionResult> {
  return new Promise((resolve) => {
    Word.run(async (context) => {
      const body = context.document.body
      const inlinePictures = body.inlinePictures
      inlinePictures.load('items')
      await context.sync()

      const images = inlinePictures.items.map((picture, index) => {
        picture.load('width,height,altTextTitle,altTextDescription')
        return { index, picture }
      })

      await context.sync()

      const imageData = images.map(({ index, picture }) => ({
        index,
        width: picture.width,
        height: picture.height,
        altText: picture.altTextTitle || picture.altTextDescription || ''
      }))

      resolve({
        success: true,
        message: `文档中共有 ${imageData.length} 张图片`,
        data: {
          imageCount: imageData.length,
          images: imageData
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `获取图片列表失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出图片工具定义
 */
export const imageTools: ToolDefinition[] = [
  { name: 'word_insert_image', handler: wordInsertImage, category: 'image', description: '插入图片' },
  { name: 'word_resize_image', handler: wordResizeImage, category: 'image', description: '调整图片尺寸' },
  { name: 'word_delete_image', handler: wordDeleteImage, category: 'image', description: '删除图片' },
  { name: 'word_get_images', handler: wordGetImages, category: 'image', description: '获取图片列表' }
]

