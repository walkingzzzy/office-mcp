/**
 * MessageActions - 气泡悬浮操作
 * 使用玻璃胶囊布局展示复制/编辑/删除等快捷操作
 */

import {
  ArrowResetRegular,
  CopyRegular,
  DeleteRegular,
  EditRegular
} from '@fluentui/react-icons'
import { FC, useMemo } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '../../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip'

export interface MessageActionsProps {
  messageId: string
  role: 'user' | 'assistant' | 'system'
  onCopy: (messageId: string) => void
  onEdit?: (messageId: string) => void
  onDelete: (messageId: string) => void
  onRegenerate?: (messageId: string) => void
  disabled?: boolean
}

export const MessageActions: FC<MessageActionsProps> = ({
  messageId,
  role,
  onCopy,
  onEdit,
  onDelete,
  onRegenerate,
  disabled = false,
}) => {
  const actions = useMemo(() => {
    return [
      {
        key: 'copy',
        label: '复制',
        icon: CopyRegular,
        onClick: () => onCopy(messageId),
        visible: true,
      },
      {
        key: 'edit',
        label: '编辑',
        icon: EditRegular,
        onClick: () => onEdit?.(messageId),
        visible: role === 'user' && !!onEdit,
      },
      {
        key: 'regenerate',
        label: '重新生成',
        icon: ArrowResetRegular,
        onClick: () => onRegenerate?.(messageId),
        visible: role === 'assistant' && !!onRegenerate,
      },
      {
        key: 'delete',
        label: '删除',
        icon: DeleteRegular,
        onClick: () => onDelete(messageId),
        visible: true,
      },
    ].filter((action) => action.visible)
  }, [messageId, role, onCopy, onEdit, onDelete, onRegenerate])

  if (actions.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-border/40 bg-card/80 px-1 py-0.5 shadow-sm shadow-black/5 backdrop-blur-lg">
      {actions.map((action) => {
        const Icon = action.icon
        const handleClick = () => {
          if (!disabled) {
            action.onClick?.()
          }
        }
        return (
          <Tooltip key={action.key}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={disabled}
                onClick={handleClick}
                className={cn(
                  'h-7 w-7 rounded-full text-muted-foreground transition hover:text-foreground',
                  action.key === 'delete' && 'hover:text-destructive',
                )}>
                <Icon className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{action.label}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

export default MessageActions
