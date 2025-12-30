/**
 * 骨架屏组件
 * 用于内容加载时的占位显示
 */

import React from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-gray-200'

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  }

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  if (variant === 'text' && !height) {
    style.height = '1em'
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  )
}

/**
 * 聊天消息骨架屏
 */
export const ChatMessageSkeleton: React.FC<{ isUser?: boolean }> = ({
  isUser = false
}) => {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton width={60} height={14} />
        </div>
        <div className="space-y-2">
          <Skeleton width="100%" height={16} />
          <Skeleton width="80%" height={16} />
          <Skeleton width="60%" height={16} />
        </div>
      </div>
    </div>
  )
}

/**
 * 设置项骨架屏
 */
export const SettingsItemSkeleton: React.FC = () => {
  return (
    <div className="p-3 border rounded-md flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton variant="rectangular" width={20} height={20} />
        <div>
          <Skeleton width={120} height={16} className="mb-1" />
          <Skeleton width={80} height={12} />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton width={40} height={20} />
        <Skeleton width={40} height={20} />
      </div>
    </div>
  )
}

/**
 * 列表骨架屏
 */
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SettingsItemSkeleton key={i} />
      ))}
    </div>
  )
}

export default Skeleton
