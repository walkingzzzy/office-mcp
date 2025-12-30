/**
 * QuickActions - AI 快捷操作按钮
 * 使用圆角胶囊按钮承载复制/插入/重试等操作
 */

import {
  ArrowDownloadRegular,
  ArrowResetRegular,
  CheckmarkRegular,
  CodeRegular,
  CommentRegular,
  CopyRegular,
  DismissRegular,
  WandRegular
} from '@fluentui/react-icons'
import React from 'react'

import { cn } from '@/lib/utils'
import { Button } from '../../ui/button'

export type QuickActionType =
  | 'copy'
  | 'insert'
  | 'retry'
  | 'rewrite'
  | 'apply'
  | 'dismiss'
  | 'copy-code'
  | 'feedback'

export interface QuickAction {
  type: QuickActionType
  label?: string
  disabled?: boolean
  onClick: () => void
}

export interface QuickActionsProps {
  actions: QuickAction[]
  align?: 'left' | 'center' | 'right'
  className?: string
}

const actionConfig: Record<
  QuickActionType,
  { icon: React.ReactNode; label: string; accent?: 'primary' | 'destructive' }
> = {
  copy: { icon: <CopyRegular className="h-3.5 w-3.5" />, label: '复制' },
  insert: { icon: <ArrowDownloadRegular className="h-3.5 w-3.5" />, label: '插入文档' },
  retry: { icon: <ArrowResetRegular className="h-3.5 w-3.5" />, label: '重试' },
  rewrite: { icon: <WandRegular className="h-3.5 w-3.5" />, label: '重写' },
  apply: { icon: <CheckmarkRegular className="h-3.5 w-3.5" />, label: '应用', accent: 'primary' },
  dismiss: { icon: <DismissRegular className="h-3.5 w-3.5" />, label: '忽略', accent: 'destructive' },
  'copy-code': { icon: <CodeRegular className="h-3.5 w-3.5" />, label: '复制代码' },
  feedback: { icon: <CommentRegular className="h-3.5 w-3.5" />, label: '反馈' },
}

const alignmentMap: Record<'left' | 'center' | 'right', string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions, align = 'left', className }) => {
  if (actions.length === 0) return null

  return (
    <div
      className={cn(
        'flex flex-wrap gap-2 rounded-3xl bg-card/80 px-2 py-1 text-sm text-foreground shadow-inner shadow-black/5',
        alignmentMap[align],
        className,
      )}>
      {actions.map((action, index) => {
        const config = actionConfig[action.type]
        const Icon = () => <>{config.icon}</>
        const accentClasses =
          config.accent === 'primary'
            ? 'bg-primary/10 text-primary hover:bg-primary/20'
            : config.accent === 'destructive'
              ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
              : 'bg-transparent text-muted-foreground hover:text-foreground'

        return (
          <Button
            key={`${action.type}-${index}`}
            type="button"
            disabled={action.disabled}
            onClick={action.onClick}
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 rounded-full border border-border/60 px-3 text-xs font-medium transition-all',
              accentClasses,
            )}>
            <span className="mr-1.5 text-current">{config.icon}</span>
            {action.label || config.label}
          </Button>
        )
      })}
    </div>
  )
}

export const getDefaultQuickActions = (
  messageType: 'text' | 'code' | 'edit-suggestion' | 'error',
  handlers: {
    onCopy?: () => void
    onInsert?: () => void
    onRetry?: () => void
    onRewrite?: () => void
    onApply?: () => void
    onDismiss?: () => void
    onCopyCode?: () => void
    onFeedback?: () => void
  },
): QuickAction[] => {
  const actions: QuickAction[] = []

  switch (messageType) {
    case 'text':
      if (handlers.onCopy) actions.push({ type: 'copy', onClick: handlers.onCopy })
      if (handlers.onInsert) actions.push({ type: 'insert', onClick: handlers.onInsert })
      if (handlers.onRewrite) actions.push({ type: 'rewrite', onClick: handlers.onRewrite })
      break
    case 'code':
      if (handlers.onCopyCode) actions.push({ type: 'copy-code', onClick: handlers.onCopyCode })
      if (handlers.onInsert) actions.push({ type: 'insert', onClick: handlers.onInsert })
      break
    case 'edit-suggestion':
      if (handlers.onApply) actions.push({ type: 'apply', onClick: handlers.onApply })
      if (handlers.onDismiss) actions.push({ type: 'dismiss', onClick: handlers.onDismiss })
      if (handlers.onCopy) actions.push({ type: 'copy', onClick: handlers.onCopy })
      break
    case 'error':
      if (handlers.onRetry) actions.push({ type: 'retry', onClick: handlers.onRetry })
      if (handlers.onFeedback) actions.push({ type: 'feedback', onClick: handlers.onFeedback })
      break
  }

  return actions
}

export default QuickActions
