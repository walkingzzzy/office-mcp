/**
 * FilePreview - 文件预览组件
 * 已迁移到 Tailwind + Radix Dialog
 */

import {
  CheckmarkRegular,
  CodeRegular,
  CopyRegular,
  DismissRegular,
  DocumentTextRegular,
  EyeRegular,
  ImageRegular,
  TableRegular
} from '@fluentui/react-icons'
import { FC, useState, useCallback } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { FileAttachmentData } from '../FileAttachment'
import Logger from '../../../utils/logger'

const logger = new Logger('FilePreview')

interface FilePreviewProps {
  file: FileAttachmentData
}

const getFileIcon = (ext: string) => {
  const lowerExt = ext.toLowerCase()
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(lowerExt)) {
    return ImageRegular
  }
  if (['.xlsx', '.xls', '.csv'].includes(lowerExt)) {
    return TableRegular
  }
  if (['.js', '.ts', '.py', '.java', '.go', '.rs', '.c', '.cpp'].includes(lowerExt)) {
    return CodeRegular
  }
  return DocumentTextRegular
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const FilePreview: FC<FilePreviewProps> = ({ file }) => {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const Icon = getFileIcon(file.ext)

  const handleCopy = useCallback(async () => {
    if (file.textContent) {
      try {
        await navigator.clipboard.writeText(file.textContent)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        logger.error('复制失败', { error: err })
      }
    }
  }, [file.textContent])

  const isImage = file.type?.startsWith('image/')
  const hasContent = file.textContent || file.base64Data

  if (!hasContent) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="预览">
              <EyeRegular className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>预览文件内容</TooltipContent>
        </Tooltip>
      </DialogTrigger>

      <DialogContent className="max-w-[800px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <div className="font-semibold">{file.fileName}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="outline" className="text-[10px]">
                  {formatFileSize(file.size)}
                </Badge>
                {file.wordCount && (
                  <Badge variant="outline" className="text-[10px]">
                    {file.wordCount} 字
                  </Badge>
                )}
                {file.pageCount && (
                  <Badge variant="outline" className="text-[10px]">
                    {file.pageCount} 页
                  </Badge>
                )}
                {file.sheetCount && (
                  <Badge variant="outline" className="text-[10px]">
                    {file.sheetCount} 工作表
                  </Badge>
                )}
                {file.slideCount && (
                  <Badge variant="outline" className="text-[10px]">
                    {file.slideCount} 幻灯片
                  </Badge>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-auto">
          {isImage && file.base64Data ? (
            <img 
              src={file.base64Data} 
              alt={file.fileName}
              className="max-w-full max-h-[50vh] object-contain rounded-lg"
            />
          ) : file.textContent ? (
            <pre className="bg-muted rounded-lg p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
              {file.textContent.length > 5000 
                ? file.textContent.slice(0, 5000) + '\n\n[内容过长，仅显示前 5000 字符...]'
                : file.textContent
              }
            </pre>
          ) : (
            <p className="text-muted-foreground">无法预览此文件</p>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {file.textContent && (
            <Button variant="outline" onClick={handleCopy}>
              {copied ? <CheckmarkRegular className="h-4 w-4 mr-1" /> : <CopyRegular className="h-4 w-4 mr-1" />}
              {copied ? '已复制' : '复制内容'}
            </Button>
          )}
          <Button onClick={() => setOpen(false)}>
            <DismissRegular className="h-4 w-4 mr-1" />
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default FilePreview
