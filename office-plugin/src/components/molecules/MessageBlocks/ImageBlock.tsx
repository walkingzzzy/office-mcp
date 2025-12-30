/**
 * ImageBlock - 图像消息块组件
 * 已迁移到 Tailwind
 */

import {
  ErrorCircleRegular,
  ImageRegular,
  SpinnerIosRegular
} from '@fluentui/react-icons'
import React, { useState } from 'react'

export interface ImageMessageBlock {
  id: string
  type: 'image'
  url?: string
  alt?: string
  caption?: string
  status?: 'pending' | 'loading' | 'success' | 'error'
  error?: {
    message: string
  }
  metadata?: {
    width?: number
    height?: number
    format?: string
    model?: string
    prompt?: string
  }
}

export interface ImageBlockProps {
  block: ImageMessageBlock
}

/**
 * ImageBlock 组件
 */
export const ImageBlock: React.FC<ImageBlockProps> = ({ block }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleImageLoad = () => setImageLoaded(true)
  const handleImageError = () => setImageError(true)

  const isLoading = block.status === 'loading' || block.status === 'pending'
  const hasError = block.status === 'error' || imageError || !block.url

  return (
    <div className="mb-4 p-4 bg-background rounded-lg border border-border">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        <ImageRegular className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">图像</span>
      </div>

      <div className="relative w-full max-w-[600px] rounded-lg overflow-hidden bg-muted">
        {isLoading && !hasError && (
          <div className="flex flex-col items-center justify-center p-8 gap-4">
            <SpinnerIosRegular className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm">正在生成图像...</span>
          </div>
        )}

        {hasError && (
          <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-lg">
            <ErrorCircleRegular className="h-4 w-4" />
            <span>{block.error?.message || '图像加载失败'}</span>
          </div>
        )}

        {!isLoading && !hasError && block.url && (
          <>
            {!imageLoaded && (
              <div className="flex items-center justify-center p-8">
                <SpinnerIosRegular className="h-6 w-6 animate-spin" />
              </div>
            )}
            <img
              src={block.url}
              alt={block.alt || '生成的图像'}
              className="w-full h-auto block"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: imageLoaded ? 'block' : 'none' }}
            />
          </>
        )}
      </div>

      {block.caption && (
        <p className="mt-2 text-xs text-muted-foreground italic">{block.caption}</p>
      )}

      {block.metadata && (
        <p className="mt-1 text-xs text-muted-foreground">
          {block.metadata.width && block.metadata.height && (
            <span>尺寸: {block.metadata.width} × {block.metadata.height}</span>
          )}
          {block.metadata.format && <span> · 格式: {block.metadata.format.toUpperCase()}</span>}
          {block.metadata.model && <span> · 模型: {block.metadata.model}</span>}
        </p>
      )}

      {block.metadata?.prompt && (
        <p className="mt-2 text-xs text-muted-foreground italic">
          <span className="font-semibold">提示词: </span>
          {block.metadata.prompt}
        </p>
      )}
    </div>
  )
}
