/**
 * FileUploadButton - 文件上传按钮组件
 * 已迁移到 Tailwind
 */

import {
  AttachRegular,
  SpinnerIosRegular
} from '@fluentui/react-icons'
import { FC, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { FileAttachmentData } from '../FileAttachment'
import Logger from '../../../utils/logger'

const logger = new Logger('FileUploadButton')

export interface FileUploadButtonProps {
  onFileUploaded?: (file: FileAttachmentData) => void
  onError?: (error: Error) => void
  disabled?: boolean
  accept?: string
  maxSize?: number
  apiBaseUrl?: string
  apiKey?: string
}

export const FileUploadButton: FC<FileUploadButtonProps> = ({
  onFileUploaded,
  onError,
  disabled = false,
  accept = '.jpg,.jpeg,.png,.gif,.webp,.pdf,.docx,.xlsx,.pptx,.txt,.csv,.json',
  maxSize = 50 * 1024 * 1024,
  apiBaseUrl = 'http://localhost:3001',
  apiKey = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleButtonClick = () => {
    if (!uploading && !disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    event.target.value = ''

    if (file.size > maxSize) {
      const error = new Error(`文件大小超过限制（最大 ${maxSize / (1024 * 1024)} MB）`)
      onError?.(error)
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${apiBaseUrl}/v1/office/upload`, {
        method: 'POST',
        headers: {
          ...(apiKey && { Authorization: `Bearer ${apiKey}` })
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: { message: '上传失败' }
        }))
        throw new Error(errorData.error?.message || '上传失败')
      }

      const result = await response.json()

      if (result.success && result.data) {
        const fileData: FileAttachmentData = {
          fileId: result.data.fileId,
          fileName: result.data.fileName,
          size: result.data.size,
          type: result.data.type,
          ext: result.data.ext
        }
        onFileUploaded?.(fileData)
      } else {
        throw new Error(result.error?.message || '上传失败')
      }
    } catch (error) {
      logger.error('File upload error', { error })
      onError?.(error instanceof Error ? error : new Error('上传失败'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleButtonClick}
            disabled={disabled || uploading}
            aria-label="上传文件"
          >
            {uploading ? (
              <SpinnerIosRegular className="h-4 w-4 animate-spin" />
            ) : (
              <AttachRegular className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>上传文件</TooltipContent>
      </Tooltip>
    </div>
  )
}
