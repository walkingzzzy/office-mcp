/**
 * MessageBubble - 统一消息气泡组件
 * 已迁移到 Tailwind
 * 
 * Phase 3: 更新样式
 * - 用户消息: 渐变背景 + 右对齐
 * - AI 消息: 玻璃拟态 + 左对齐
 * - 消息滑入动画
 */

import React from 'react'

import { cn } from '@/lib/utils'
import { BrandAvatar } from '../../atoms/BrandAvatar'

export type MessageRole = 'user' | 'assistant' | 'system'

export interface MessageBubbleProps {
  /** 消息角色 */
  role: MessageRole
  /** 消息内容 */
  children: React.ReactNode
  /** 用户名 (用于用户头像) */
  userName?: string
  /** 用户头像 URL */
  userAvatar?: string
  /** 时间戳 */
  timestamp?: string
  /** 是否显示头像 */
  showAvatar?: boolean
  /** 消息底部操作区 (如 QuickActions) */
  footer?: React.ReactNode
  /** 悬浮操作区 (如 MessageActions) */
  hoverActions?: React.ReactNode
  /** 是否显示悬浮操作 */
  showHoverActions?: boolean
  /** 自定义样式类名 */
  className?: string
  /** 是否为分组视图 (用于连续消息) */
  grouped?: boolean
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  role,
  children,
  userName,
  userAvatar,
  timestamp,
  showAvatar = true,
  footer,
  hoverActions,
  showHoverActions = true,
  className,
  grouped = false
}) => {
  const isUser = role === 'user'
  const isSystem = role === 'system'

  // 系统消息样式
  if (isSystem) {
    return (
      <div className={cn('flex justify-center py-2 px-4 mb-2', className)}>
        <div className="text-xs text-muted-foreground bg-muted/50 px-4 py-1 rounded-full">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group flex gap-2 mb-1 animate-message-in',
        isUser ? 'flex-row-reverse' : 'flex-row',
        grouped ? 'py-0.5 px-4' : 'py-2 px-4',
        className
      )}
    >
      {/* 头像 */}
      {showAvatar && !grouped && (
        <div className="shrink-0 mt-1">
          <BrandAvatar
            size={32}
            isAI={!isUser}
            name={userName}
            imageUrl={userAvatar}
          />
        </div>
      )}
      {/* 分组模式下的占位 */}
      {grouped && showAvatar && <div className="w-8 shrink-0" />}

      {/* 消息内容 */}
      <div
        className={cn(
          'flex flex-col min-w-0',
          isUser ? 'max-w-[85%] items-end' : 'max-w-full items-start'
        )}
      >
        {/* 时间戳 (仅非分组模式显示) */}
        {timestamp && !grouped && (
          <div
            className={cn(
              'text-[10px] text-muted-foreground mb-1',
              isUser ? 'text-right pr-1' : 'text-left pl-1'
            )}
          >
            {timestamp}
          </div>
        )}

        {/* 消息气泡 */}
        <div
          className={cn(
            'text-sm leading-relaxed break-words',
            isUser
              ? 'bg-gradient-to-r from-primary to-accent text-white px-4 py-3 rounded-2xl rounded-tr-md shadow-md'
              : 'glass px-3 py-1 rounded-2xl rounded-tl-md w-full'
          )}
        >
          {children}
        </div>

        {/* 悬浮操作区 */}
        {showHoverActions && hoverActions && (
          <div
            className={cn(
              'flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            {hoverActions}
          </div>
        )}

        {/* 底部操作区 (如 QuickActions) */}
        {footer && <div className="mt-2">{footer}</div>}
      </div>
    </div>
  )
}

export default MessageBubble
