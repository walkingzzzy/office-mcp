/**
 * TypingIndicator - AI 思考/打字指示器
 * 显示 AI 正在思考或生成回复的动画
 */

import React from 'react'

import { cn } from '@/lib/utils'
import { BrandAvatar } from '../../atoms/BrandAvatar'

export interface TypingIndicatorProps {
  /** 自定义样式类名 */
  className?: string
  /** 显示文案 */
  label?: string
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  className,
  label = '正在思考中...'
}) => {
  return (
    <div className={cn('flex items-start gap-3 px-4 py-3', className)}>
      <div className="relative flex-shrink-0">
        <BrandAvatar size={36} isAI showGlow />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">问津AI助手</span>
        <div className="glass flex items-center gap-3 rounded-2xl rounded-tl-md border border-border/40 px-4 py-3 shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary animate-ai-thinking" />
            <span className="h-2 w-2 rounded-full bg-primary animate-ai-thinking" style={{ animationDelay: '150ms' }} />
            <span className="h-2 w-2 rounded-full bg-primary animate-ai-thinking" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
      </div>
    </div>
  )
}

export default TypingIndicator
