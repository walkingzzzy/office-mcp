/**
 * Tooltip 组件
 * 
 * @migrated 2025-12-30 - 从 Radix UI 迁移到 Fluent UI 实现
 */
import * as React from 'react'
import {
  Tooltip as FluentTooltip,
  TooltipProps as FluentTooltipProps,
} from '@fluentui/react-components'

import { cn } from '@/lib/utils'

// Provider - 简化为无操作包装器（Fluent UI 不需要显式 Provider）
function TooltipProvider({ children }: { children: React.ReactNode; delayDuration?: number }) {
  return <>{children}</>
}

// Tooltip Root - 包装 Fluent UI Tooltip
interface TooltipRootProps {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  delayDuration?: number
}

function Tooltip({ children }: TooltipRootProps) {
  // 收集 trigger 和 content 子元素
  let triggerElement: React.ReactElement | null = null
  let contentElement: React.ReactNode = null

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    
    const displayName = (child.type as { displayName?: string })?.displayName || ''
    
    if (displayName === 'TooltipTrigger' || child.props?.['data-slot'] === 'tooltip-trigger') {
      // 获取 trigger 的子元素
      const triggerChildren = child.props.children
      if (React.isValidElement(triggerChildren)) {
        triggerElement = triggerChildren
      }
    } else if (displayName === 'TooltipContent' || child.props?.['data-slot'] === 'tooltip-content') {
      contentElement = child.props.children
    }
  })

  // 如果没有正确解析，直接返回 children
  if (!triggerElement || !contentElement) {
    return <>{children}</>
  }

  // 提取内容属性
  let contentProps: { side?: 'top' | 'bottom' | 'left' | 'right'; className?: string } = {}
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const displayName = (child.type as { displayName?: string })?.displayName || ''
      if (displayName === 'TooltipContent' || child.props?.['data-slot'] === 'tooltip-content') {
        contentProps = child.props as typeof contentProps
      }
    }
  })

  // 映射 side 到 Fluent UI positioning
  const positioningMap: Record<string, FluentTooltipProps['positioning']> = {
    top: 'above',
    bottom: 'below',
    left: 'before',
    right: 'after',
  }
  const positioning = positioningMap[contentProps.side || 'top'] || 'above'

  // 将内容转换为字符串或 JSX 元素
  const tooltipContent = typeof contentElement === 'string' 
    ? contentElement 
    : <>{contentElement}</>

  return (
    <FluentTooltip
      content={tooltipContent}
      relationship="description"
      positioning={positioning}
      withArrow
      appearance="inverted"
    >
      {triggerElement}
    </FluentTooltip>
  )
}

// TooltipTrigger - 标记 trigger 元素
interface TooltipTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

function TooltipTrigger({ children, asChild }: TooltipTriggerProps) {
  // 在新实现中，TooltipTrigger 仅作为标记使用
  // 实际的 trigger 逻辑由 Tooltip 组件处理
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ 'data-slot'?: string }>, {
      'data-slot': 'tooltip-trigger',
    })
  }
  return <span data-slot="tooltip-trigger">{children}</span>
}
TooltipTrigger.displayName = 'TooltipTrigger'

// TooltipContent - 标记 content 元素
interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'bottom' | 'left' | 'right'
  sideOffset?: number
}

function TooltipContent({
  className,
  children,
  side = 'top',
  sideOffset = 0,
  ...props
}: TooltipContentProps) {
  // 在新实现中，TooltipContent 仅作为标记和内容容器使用
  // 实际渲染由 Fluent UI Tooltip 处理
  return (
    <div
      data-slot="tooltip-content"
      data-side={side}
      className={cn(
        'z-50 w-fit rounded-md px-3 py-1.5 text-xs',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
TooltipContent.displayName = 'TooltipContent'

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
