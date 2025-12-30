/**
 * DocumentStatus - 文档状态指示器
 * 已迁移到 Tailwind
 */

import {
  DocumentRegular,
  DocumentTextRegular
} from '@fluentui/react-icons'
import { FC } from 'react'

import { Badge } from '@/components/ui/badge'

export interface DocumentStatusProps {
  hasDocument: boolean
  isSelection?: boolean
  characterCount?: number
  paragraphCount?: number
  officeApp?: 'word' | 'excel' | 'powerpoint'
}

export const DocumentStatus: FC<DocumentStatusProps> = ({
  hasDocument,
  isSelection = false,
  characterCount,
  paragraphCount,
  officeApp = 'word'
}) => {
  if (!hasDocument) {
    return null
  }

  const appName = officeApp === 'word' ? 'Word' : officeApp === 'excel' ? 'Excel' : 'PowerPoint'
  const statusText = isSelection ? '已读取选中文本' : `已读取${appName}文档`

  return (
    <div className="inline-flex items-center gap-2 px-2 py-1 bg-muted rounded text-xs">
      {isSelection ? (
        <DocumentRegular className="h-3.5 w-3.5 text-primary" />
      ) : (
        <DocumentTextRegular className="h-3.5 w-3.5 text-primary" />
      )}
      <span className="text-muted-foreground">{statusText}</span>
      {characterCount !== undefined && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {characterCount} 字符
        </Badge>
      )}
      {paragraphCount !== undefined && paragraphCount > 0 && (
        <span className="text-[10px] text-muted-foreground/70">
          {paragraphCount} 段
        </span>
      )}
    </div>
  )
}
