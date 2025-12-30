/**
 * ThinkingBlock - 思考过程块组件
 * 已迁移到 Tailwind
 */

import {
  BrainCircuitRegular,
  ChevronDownRegular,
  ChevronUpRegular
} from '@fluentui/react-icons'
import { FC, useState } from 'react'

import { cn } from '@/lib/utils'
import type { ThinkingMessageBlock } from '../../../types/messageBlock'

export interface ThinkingBlockProps {
  block: ThinkingMessageBlock
  defaultExpanded?: boolean
}

export const ThinkingBlock: FC<ThinkingBlockProps> = ({
  block,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const thinkingTime = block.thinking_millsec
    ? `${(block.thinking_millsec / 1000).toFixed(1)}s`
    : ''

  return (
    <div className="my-2 rounded-lg border border-border bg-muted/50">
      <div
        className="flex items-center gap-2 p-2 cursor-pointer select-none hover:bg-muted/80 rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <BrainCircuitRegular className="h-4 w-4 text-primary" />
        <span className="flex-1 font-semibold text-sm">AI 思考过程</span>
        {thinkingTime && (
          <span className="text-xs text-muted-foreground">{thinkingTime}</span>
        )}
        {isExpanded ? (
          <ChevronUpRegular className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDownRegular className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {isExpanded && (
        <div className="px-4 pb-2 border-t border-border whitespace-pre-wrap break-words text-sm">
          {block.content}
        </div>
      )}
    </div>
  )
}
