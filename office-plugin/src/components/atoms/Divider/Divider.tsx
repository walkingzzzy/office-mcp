/**
 * Divider 分割线组件
 * 已迁移到 Tailwind - 使用 Separator
 */

import { Separator } from '@/components/ui/separator'
import { FC, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface DividerProps {
  /** 是否垂直 */
  vertical?: boolean
  /** 内嵌内容 */
  children?: ReactNode
  /** 内容位置 */
  inset?: boolean
  /** 自定义类名 */
  className?: string
}

export const Divider: FC<DividerProps> = ({ 
  vertical = false, 
  children, 
  inset = false,
  className 
}) => {
  if (children) {
    return (
      <div className={cn(
        'flex items-center gap-2',
        vertical ? 'flex-col' : 'flex-row',
        className
      )}>
        <Separator className="flex-1" orientation={vertical ? 'vertical' : 'horizontal'} />
        <span className="text-xs text-muted-foreground px-2">{children}</span>
        <Separator className="flex-1" orientation={vertical ? 'vertical' : 'horizontal'} />
      </div>
    )
  }

  return (
    <Separator 
      orientation={vertical ? 'vertical' : 'horizontal'} 
      className={cn(inset && 'mx-4', className)}
    />
  )
}
