/**
 * ConversationSidebar - 对话历史侧边栏
 * 使用 Fluent UI Drawer 实现
 * 
 * Phase 3: 更新抽屉样式和对话列表项
 * 
 * @updated 2025-12-30 - 移除 framer-motion，使用 CSS 动画替代
 * @updated 2025-12-30 - 迁移到 @fluentui/react-icons
 */

import {
  ChatRegular,
  AddRegular,
  DeleteRegular,
  DismissRegular,
  EditRegular,
  SparkleRegular,
  StarRegular,
} from '@fluentui/react-icons'
import { FC, useState, useEffect } from 'react'

import { cn } from '@/lib/utils'
import type { Conversation } from '../../../services/conversation'
import { Button } from '../../ui/button'
import { ScrollArea, ScrollBar } from '../../ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip'

export interface ConversationSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversations: Conversation[]
  currentConversationId?: string
  onSelectConversation: (conversationId: string) => void
  onCreateConversation: () => void
  onRenameConversation?: (conversationId: string) => void
  onDeleteConversation: (conversationId: string) => void
  onToggleFavorite?: (conversationId: string, nextValue: boolean) => void
  inline?: boolean
  className?: string
}

export const ConversationSidebar: FC<ConversationSidebarProps> = ({
  open,
  onOpenChange,
  conversations,
  currentConversationId,
  onSelectConversation,
  onCreateConversation,
  onRenameConversation,
  onDeleteConversation,
  onToggleFavorite,
  inline = false,
  className,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins} 分钟前`
    if (diffHours < 24) return `${diffHours} 小时前`
    if (diffDays < 7) return `${diffDays} 天前`

    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    })
  }

  const panelContent = (
    <>
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-4">
        <div>
          <div className="text-sm font-medium text-primary/80">问津 AI</div>
          <div className="text-lg font-semibold text-foreground">对话历史</div>
        </div>
        {!inline && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={() => onOpenChange(false)}>
            <DismissRegular className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="p-4 pb-2">
        <Button
          type="button"
          className="w-full justify-start gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40"
          onClick={() => {
            onCreateConversation()
            if (!inline) {
              onOpenChange(false)
            }
          }}>
          <AddRegular className="h-4 w-4" />
          开始新对话
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-2 pb-8 pt-2">
          {conversations.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <SparkleRegular className="h-6 w-6" />
              </div>
              <div className="text-sm text-center leading-relaxed">
                还没有对话记录
                <br />
                点击上方按钮开始
              </div>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === currentConversationId
              const isFavorite = !!conv.favorite
              const messageCount = conv.messages?.length ?? 0

              return (
                <div
                  key={conv.id}
                  role="button"
                  tabIndex={0}
                  data-testid={`conversation-item-${conv.id}`}
                  data-favorite={isFavorite ? 'true' : 'false'}
                  className={cn(
                    'group relative flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left cursor-pointer',
                    isActive
                      ? 'border-primary/50 bg-gradient-to-r from-primary/15 to-accent/10 text-primary shadow-sm'
                      : 'border-transparent card-hover-enhanced hover:border-border/50 hover:bg-muted/50',
                  )}
                  onClick={() => {
                    onSelectConversation(conv.id)
                    if (!inline) {
                      onOpenChange(false)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectConversation(conv.id)
                      if (!inline) {
                        onOpenChange(false)
                      }
                    }
                  }}>
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ChatRegular className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-medium text-foreground">{conv.title}</div>
                      {isFavorite && (
                        <span className="rounded-full bg-primary/10 px-2 text-[11px] font-medium text-primary">收藏</span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(conv.updatedAt)} · {messageCount} 条消息
                    </div>
                  </div>

                  <div className="absolute right-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          data-testid={`conversation-star-${conv.id}`}
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleFavorite?.(conv.id, !isFavorite)
                          }}
                          aria-label={isFavorite ? '取消收藏' : '收藏对话'}>
                          <StarRegular className={cn('h-4 w-4', isFavorite && 'fill-current text-primary')} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">{isFavorite ? '取消收藏' : '收藏对话'}</TooltipContent>
                    </Tooltip>

                    {onRenameConversation && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              onRenameConversation(conv.id)
                            }}
                            aria-label="重命名对话">
                            <EditRegular className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">重命名</TooltipContent>
                      </Tooltip>
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteConversation(conv.id)
                          }}
                          aria-label="删除对话">
                          <DeleteRegular className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">删除</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </>
  )

  if (inline) {
    return (
      <div
        className={cn(
          'flex w-[300px] flex-col rounded-2xl border border-border/40 bg-background/95 shadow-2xl',
          className,
        )}
        data-testid="conversation-sidebar-inline">
        {panelContent}
      </div>
    )
  }

  // CSS 动画状态管理
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (open) {
      setIsVisible(true)
      // 触发进入动画
      requestAnimationFrame(() => setIsAnimating(true))
    } else if (isVisible) {
      // 触发退出动画
      setIsAnimating(false)
      const timer = setTimeout(() => setIsVisible(false), 200)
      return () => clearTimeout(timer)
    }
  }, [open, isVisible])

  if (!isVisible) return null

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className={cn(
          'fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm transition-opacity duration-200',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
        onClick={() => onOpenChange(false)}
      />
      {/* 侧边栏面板 */}
      <div
        className={cn(
          'fixed top-0 left-0 bottom-0 z-[101] flex w-[calc(100vw-48px)] max-w-[300px] flex-col',
          'border-r border-border/40 bg-background/95 dark:bg-background/98 backdrop-blur-xl shadow-2xl',
          'transition-transform duration-200 ease-out',
          isAnimating ? 'translate-x-0' : '-translate-x-full'
        )}>
        {panelContent}
      </div>
    </>
  )
}
