/**
 * FileAttachment - 文件附件组件
 * 已迁移到 Tailwind
 */

import {
  CodeRegular,
  DismissRegular,
  DocumentTextRegular,
  ImageRegular,
  TableRegular
} from '@fluentui/react-icons'
import { FC } from 'react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FilePreview } from '../FilePreview'

export interface FileAttachmentData {
  fileId: string
  fileName: string
  size: number
  type: string
  ext: string
  base64Data?: string
  filePath?: string
  textContent?: string
  pageCount?: number
  wordCount?: number
  sheetCount?: number
  slideCount?: number
}

export interface FileAttachmentProps {
  file: FileAttachmentData
  onRemove?: (fileId: string) => void
}

const getFileIcon = (ext: string) => {
  const lowerExt = ext.toLowerCase()
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(lowerExt)) {
    return ImageRegular
  }
  if (['.xlsx', '.xls', '.csv'].includes(lowerExt)) {
    return TableRegular
  }
  if (['.js', '.ts', '.py', '.java', '.go', '.rs', '.c', '.cpp', '.json', '.md'].includes(lowerExt)) {
    return CodeRegular
  }
  return DocumentTextRegular
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const FileAttachment: FC<FileAttachmentProps> = ({ file, onRemove }) => {
  const Icon = getFileIcon(file.ext)
  const hasPreviewableContent = file.textContent || file.base64Data

  return (
    <div className="inline-flex items-center gap-2 px-2 py-1 bg-muted rounded-md max-w-[300px] border border-border">
      <Icon className="h-5 w-5 text-primary shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col">
        <span className="font-semibold text-xs truncate" title={file.fileName}>
          {file.fileName}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {formatFileSize(file.size)}
          {file.wordCount ? ` · ${file.wordCount} 字` : ''}
        </span>
      </div>
      {hasPreviewableContent && (
        <FilePreview file={file} />
      )}
      {onRemove && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onRemove(file.fileId)}
              aria-label="删除文件"
            >
              <DismissRegular className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>删除文件</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
