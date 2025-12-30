/**
 * ScrollArea 组件
 * 
 * @migrated 2025-12-30 - 从 Radix UI 迁移到原生 CSS 实现
 */
import * as React from 'react'

import { cn } from '@/lib/utils'

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal' | 'both'
}

function ScrollArea({
  className,
  children,
  orientation = 'vertical',
  ...props
}: ScrollAreaProps) {
  return (
    <div
      data-slot="scroll-area"
      className={cn('relative', className)}
      {...props}
    >
      <div
        data-slot="scroll-area-viewport"
        className={cn(
          'size-full rounded-[inherit] focus-visible:ring-ring/50 transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1',
          orientation === 'vertical' && 'overflow-y-auto overflow-x-hidden',
          orientation === 'horizontal' && 'overflow-x-auto overflow-y-hidden',
          orientation === 'both' && 'overflow-auto'
        )}
        style={{
          // 自定义滚动条样式
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--border) transparent',
        }}
      >
        {children}
      </div>
    </div>
  )
}

interface ScrollBarProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal'
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: ScrollBarProps): React.ReactNode {
  // 纯 CSS 实现的滚动条样式已在 viewport 中应用
  // 此组件仅用于兼容性，不渲染任何内容
  return null
}

export { ScrollArea, ScrollBar }
export type { ScrollAreaProps, ScrollBarProps }
