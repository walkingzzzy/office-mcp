/**
 * 消息操作按钮组件
 * 已迁移到 Tailwind
 */

import {
  ArrowResetRegular,
  CheckmarkRegular,
  CopyRegular,
  DocumentTextRegular,
  InfoRegular,
  EditRegular,
  ArrowCounterclockwiseRegular,
  SpinnerIosRegular
} from '@fluentui/react-icons'
import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import Logger from '../../../utils/logger'

const logger = new Logger('MessageActionButtons')

interface MessageActionButtonsProps {
  messageId: string
  messageType: 'command' | 'edit' | 'query' | 'chat'
  messageStatus: 'success' | 'error' | 'pending' | 'processing'
  showMoreOptions?: boolean
  onCopy?: (messageId: string) => void
  onEdit?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onRetry?: (messageId: string) => void
  onApply?: (messageId: string) => void
  onUndo?: (messageId: string) => void
  onDetails?: (messageId: string) => void
  className?: string
}

export const MessageActionButtons: React.FC<MessageActionButtonsProps> = ({
  messageId,
  messageType,
  messageStatus,
  showMoreOptions = true,
  onCopy,
  onEdit,
  onRetry,
  onApply,
  onUndo,
  onDetails,
  className
}) => {
  const [copiedState, setCopiedState] = useState(false)
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  const handleCopy = async () => {
    if (processingAction) return
    setProcessingAction('copy')
    try {
      await onCopy?.(messageId)
      setCopiedState(true)
      setTimeout(() => setCopiedState(false), 2000)
      logger.info('Message copied successfully', { messageId })
    } catch (error) {
      logger.error('Failed to copy message', { messageId, error })
    } finally {
      setProcessingAction(null)
    }
  }

  const handleApply = async () => {
    if (processingAction) return
    setProcessingAction('apply')
    try {
      await onApply?.(messageId)
      logger.info('Message applied successfully', { messageId })
    } catch (error) {
      logger.error('Failed to apply message', { messageId, error })
    } finally {
      setProcessingAction(null)
    }
  }

  const handleUndo = async () => {
    if (processingAction) return
    setProcessingAction('undo')
    try {
      await onUndo?.(messageId)
      logger.info('Message undone successfully', { messageId })
    } catch (error) {
      logger.error('Failed to undo message', { messageId, error })
    } finally {
      setProcessingAction(null)
    }
  }

  const handleRetry = async () => {
    if (processingAction) return
    setProcessingAction('retry')
    try {
      await onRetry?.(messageId)
      logger.info('Message retried successfully', { messageId })
    } catch (error) {
      logger.error('Failed to retry message', { messageId, error })
    } finally {
      setProcessingAction(null)
    }
  }

  const renderButtons = () => {
    const commonButtons = [
      <Tooltip key="copy">
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            disabled={processingAction === 'copy'}
            className="h-7"
          >
            {copiedState ? <CheckmarkRegular className="h-3.5 w-3.5 mr-1" /> : <CopyRegular className="h-3.5 w-3.5 mr-1" />}
            {copiedState ? '已复制' : '复制'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>复制内容 (Ctrl+C)</TooltipContent>
      </Tooltip>
    ]

    switch (messageType) {
      case 'command':
        return [
          ...commonButtons,
          onUndo && (
            <Tooltip key="undo">
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" onClick={handleUndo} disabled={processingAction === 'undo'} className="h-7">
                  <ArrowCounterclockwiseRegular className="h-3.5 w-3.5 mr-1" />
                  撤销
                </Button>
              </TooltipTrigger>
              <TooltipContent>撤销操作 (Ctrl+Z)</TooltipContent>
            </Tooltip>
          ),
          onDetails && (
            <Tooltip key="details">
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" onClick={() => onDetails(messageId)} className="h-7">
                  <InfoRegular className="h-3.5 w-3.5 mr-1" />
                  详情
                </Button>
              </TooltipTrigger>
              <TooltipContent>查看详情</TooltipContent>
            </Tooltip>
          )
        ].filter(Boolean)

      case 'edit':
        return [
          ...commonButtons,
          onApply && (
            <Tooltip key="apply">
              <TooltipTrigger asChild>
                <Button size="sm" onClick={handleApply} disabled={processingAction === 'apply'} className="h-7">
                  <CheckmarkRegular className="h-3.5 w-3.5 mr-1" />
                  应用到文档
                </Button>
              </TooltipTrigger>
              <TooltipContent>应用到文档 (Enter)</TooltipContent>
            </Tooltip>
          ),
          onCopy && (
            <Tooltip key="copyOnly">
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" onClick={() => onCopy(messageId)} className="h-7">
                  <DocumentTextRegular className="h-3.5 w-3.5 mr-1" />
                  复制文本
                </Button>
              </TooltipTrigger>
              <TooltipContent>仅复制文本</TooltipContent>
            </Tooltip>
          )
        ].filter(Boolean)

      case 'query':
        return [
          ...commonButtons,
          onEdit && (
            <Tooltip key="edit">
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" onClick={() => onEdit(messageId)} className="h-7">
                  <EditRegular className="h-3.5 w-3.5 mr-1" />
                  编辑
                </Button>
              </TooltipTrigger>
              <TooltipContent>编辑消息</TooltipContent>
            </Tooltip>
          )
        ].filter(Boolean)

      default:
        return commonButtons
    }
  }

  const renderMoreOptions = () => {
    if (!showMoreOptions) return null
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 px-2">…</Button>
        </TooltipTrigger>
        <TooltipContent>更多选项</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className={cn('flex gap-1 items-center flex-wrap mt-2', className)}>
      {renderButtons()}
      {renderMoreOptions()}

      {messageStatus === 'error' && onRetry && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="ghost" onClick={handleRetry} disabled={processingAction === 'retry'} className="h-7">
              <ArrowResetRegular className="h-3.5 w-3.5 mr-1" />
              重试
            </Button>
          </TooltipTrigger>
          <TooltipContent>重试操作</TooltipContent>
        </Tooltip>
      )}

      {messageStatus === 'processing' && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <SpinnerIosRegular className="h-3 w-3 animate-spin" />
          处理中...
        </div>
      )}
    </div>
  )
}

export default MessageActionButtons
