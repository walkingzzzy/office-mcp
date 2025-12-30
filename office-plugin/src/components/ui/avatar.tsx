/**
 * Avatar 组件
 * 
 * @migrated 2025-12-30 - 从 Radix UI 迁移到原生 HTML 实现
 */
import * as React from 'react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {}

function Avatar({ className, ...props }: AvatarProps) {
  return (
    <span
      data-slot="avatar"
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  )
}

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

function AvatarImage({ className, src, alt, onError, ...props }: AvatarImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true)
    setIsLoading(false)
    onError?.(e)
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  if (hasError || !src) {
    return null
  }

  return (
    <img
      data-slot="avatar-image"
      src={src}
      alt={alt}
      onError={handleError}
      onLoad={handleLoad}
      className={cn(
        'aspect-square size-full object-cover',
        isLoading && 'invisible',
        className
      )}
      {...props}
    />
  )
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {
  delayMs?: number
}

function AvatarFallback({ className, delayMs = 0, children, ...props }: AvatarFallbackProps) {
  const [isVisible, setIsVisible] = useState(delayMs === 0)

  React.useEffect(() => {
    if (delayMs > 0) {
      const timer = setTimeout(() => setIsVisible(true), delayMs)
      return () => clearTimeout(timer)
    }
  }, [delayMs])

  if (!isVisible) {
    return null
  }

  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        'bg-muted flex size-full items-center justify-center rounded-full',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { Avatar, AvatarImage, AvatarFallback }
export type { AvatarProps, AvatarImageProps, AvatarFallbackProps }
