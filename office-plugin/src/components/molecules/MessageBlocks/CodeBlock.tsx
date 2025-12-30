/**
 * CodeBlock - 代码块组件
 * 已迁移到 Tailwind
 */

import {
  CheckmarkRegular,
  CodeRegular,
  CopyRegular
} from '@fluentui/react-icons'
import { FC, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CodeMessageBlock } from '../../../types/messageBlock'

export interface CodeBlockProps {
  block: CodeMessageBlock
}

export const CodeBlock: FC<CodeBlockProps> = ({ block }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(block.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-2 rounded-xl overflow-hidden glass border border-border/50">
      {/* 头部 */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-muted/30">
        <CodeRegular className="h-4 w-4 text-primary" />
        <span className="flex-1 text-sm font-semibold text-muted-foreground">
          {block.language || 'code'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className={cn('h-7 px-2', copied && 'text-green-500')}
        >
          {copied ? <CheckmarkRegular className="h-3.5 w-3.5" /> : <CopyRegular className="h-3.5 w-3.5" />}
          <span className="ml-1">{copied ? '已复制' : '复制'}</span>
        </Button>
      </div>
      
      {/* 代码区域 */}
      <pre className="p-4 m-0 overflow-x-auto text-sm leading-relaxed bg-muted/20 custom-scrollbar">
        <code className="font-mono text-foreground">{block.content}</code>
      </pre>
    </div>
  )
}
