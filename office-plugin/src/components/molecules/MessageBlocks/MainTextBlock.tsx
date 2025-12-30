/**
 * MainTextBlock - 主文本消息块组件
 * 已迁移到 Tailwind
 */

import { FC, memo } from 'react'

import { cn } from '@/lib/utils'
import type { MainTextMessageBlock } from '../../../types/messageBlock'
import { MarkdownRenderer } from '../MarkdownRenderer'

export interface MainTextBlockProps {
  block: MainTextMessageBlock
  /**
   * 是否启用 Markdown 渲染
   * @default true
   */
  enableMarkdown?: boolean
}

export const MainTextBlock: FC<MainTextBlockProps> = memo(({ block, enableMarkdown = true }) => {
  const baseClass = 'w-full break-words text-sm leading-relaxed text-foreground'

  // 如果禁用 Markdown 或内容为空，使用纯文本渲染
  if (!enableMarkdown || !block.content) {
    return (
      <div className={cn(baseClass, 'whitespace-pre-wrap')}>
        {block.content}
      </div>
    )
  }

  // 使用 MarkdownRenderer 渲染 Markdown 内容
  return (
    <div className={baseClass}>
      <MarkdownRenderer
        content={block.content}
        enableHighlight={true}
        enableLinks={true}
        enableHtml={false}
      />
    </div>
  )
}, (prevProps, nextProps) => {
  // 只有当 content 或 status 真正变化时才重新渲染
  return prevProps.block.content === nextProps.block.content &&
         prevProps.block.status === nextProps.block.status &&
         prevProps.enableMarkdown === nextProps.enableMarkdown
})
