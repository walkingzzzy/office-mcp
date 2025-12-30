/**
 * MessageList - 消息列表组件
 * 已迁移到 Tailwind
 */

import {
  CheckmarkRegular
} from '@fluentui/react-icons'
import { FC, memo, useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import { type MessageBlock, MessageBlockType, type ToolMessageBlock, type TaskPlanMessageBlock, MessageBlockStatus, type MainTextMessageBlock, type ThinkingMessageBlock, type CitationMessageBlock, type ErrorMessageBlock, type CodeMessageBlock } from '../../../types/messageBlock'
import { isCommandMessage, isQueryMessage } from '../../../utils/responseIntentDetection'
import { Text } from '../../atoms'
import { CommandSuccessMessage } from '../../molecules/CommandSuccessMessage'
// import { EditSuggestionMessage } from '../../molecules/EditSuggestionMessage' // 已禁用
import { EmptyState, type SuggestionCard } from '../../molecules/EmptyState'
import { MessageActions } from '../../molecules/MessageActions'
import { MessageBubble } from '../../molecules/MessageBubble'
import {
  CitationBlock,
  CodeBlock,
  ErrorBlock,
  ImageBlock,
  MainTextBlock,
  ThinkingBlock,
  type ImageMessageBlock as ImageBlockType
} from '../../molecules/MessageBlocks'
import { QueryResultMessage } from '../../molecules/QueryResultMessage'
import { QuickActions, getDefaultQuickActions } from '../../molecules/QuickActions'
import { TaskPlanView } from '../../molecules/TaskPlanView'
import { ToolCallCard, type ToolCallStatus } from '../../molecules/ToolCallCard'
import { TypingIndicator } from '../../molecules/TypingIndicator'
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  blocks: MessageBlock[]
  createdAt: string
  error?: boolean
}

export interface MessageListProps {
  messages: Message[]
  loading?: boolean
  onRetry?: (messageId: string) => void
  onCopy?: (messageId: string) => void
  onEdit?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onRegenerate?: (messageId: string) => void
  onApplyToWord?: (messageId: string) => void
  onUndoCommand?: (messageId: string) => Promise<boolean> | boolean
  /** 建议卡片点击回调 */
  onSuggestionClick?: (suggestion: SuggestionCard) => void
  /** 任务计划：开始执行 */
  onStartTaskExecution?: (planId: string) => void
  /** 任务计划：暂停执行 */
  onPauseTaskExecution?: (planId: string) => void
  /** 任务计划：跳过步骤 */
  onSkipTaskStep?: (planId: string, stepId: string) => void
  /** 任务计划：取消任务 */
  onCancelTask?: (planId: string) => void
  className?: string
}

/**
 * 获取消息中的工具调用块
 */
const getToolBlocks = (message: Message): ToolMessageBlock[] => {
  return message.blocks.filter((block) => block.type === MessageBlockType.TOOL) as ToolMessageBlock[]
}

/**
 * 检查消息是否有实际可显示的内容
 * 用于决定是否显示 QuickActions
 */
const hasDisplayableContent = (message: Message): boolean => {
  if (!message.blocks || message.blocks.length === 0) {
    return false
  }

  // 检查是否有任何块包含实际内容
  return message.blocks.some((block) => {
    // MainTextBlock 需要有非空内容
    if (block.type === MessageBlockType.MAIN_TEXT) {
      const content = (block as MainTextMessageBlock).content
      return typeof content === 'string' && content.trim().length > 0
    }
    // 其他类型的块（如 TOOL、CODE、IMAGE 等）认为有内容
    if (block.type === MessageBlockType.TOOL ||
        block.type === MessageBlockType.CODE ||
        block.type === MessageBlockType.IMAGE ||
        block.type === MessageBlockType.CITATION ||
        block.type === MessageBlockType.THINKING) {
      return true
    }
    return false
  })
}

/**
 * 将 MessageBlockStatus 映射到 ToolCallStatus
 */
const mapBlockStatusToToolStatus = (status: MessageBlockStatus): ToolCallStatus => {
  switch (status) {
    case MessageBlockStatus.PENDING:
      return 'pending'
    case MessageBlockStatus.PROCESSING:
    case MessageBlockStatus.STREAMING:
      return 'running'
    case MessageBlockStatus.SUCCESS:
      return 'success'
    case MessageBlockStatus.ERROR:
      return 'error'
    default:
      return 'pending'
  }
}

/**
 * 任务计划块回调接口
 */
interface TaskPlanCallbacks {
  onStartExecution?: () => void
  onPauseExecution?: () => void
  onSkipStep?: (stepId: string) => void
  onCancelTask?: () => void
}

/**
 * 渲染单个消息块
 */
const renderMessageBlock = (
  block: MessageBlock, 
  onRetry?: () => void,
  taskPlanCallbacks?: TaskPlanCallbacks
) => {
  switch (block.type) {
    case MessageBlockType.MAIN_TEXT:
      return <MainTextBlock key={block.id} block={block as MainTextMessageBlock} />
    case MessageBlockType.THINKING:
      return <ThinkingBlock key={block.id} block={block as ThinkingMessageBlock} />
    case MessageBlockType.TOOL: {
      const toolBlock = block as ToolMessageBlock
      return (
        <ToolCallCard
          key={block.id}
          toolName={toolBlock.toolId}
          description={toolBlock.toolName || toolBlock.toolId}
          status={mapBlockStatusToToolStatus(toolBlock.status)}
          resultSummary={
            typeof toolBlock.content === 'string' 
              ? toolBlock.content.slice(0, 100) 
              : toolBlock.content ? JSON.stringify(toolBlock.content).slice(0, 100) : undefined
          }
          resultDetails={
            typeof toolBlock.content === 'string' 
              ? toolBlock.content 
              : toolBlock.content ? JSON.stringify(toolBlock.content, null, 2) : undefined
          }
          errorMessage={toolBlock.error?.message}
          onRetry={onRetry}
        />
      )
    }
    case MessageBlockType.TASK_PLAN: {
      const taskPlanBlock = block as TaskPlanMessageBlock
      return (
        <TaskPlanView
          key={block.id}
          block={taskPlanBlock}
          onStartExecution={taskPlanCallbacks?.onStartExecution}
          onPauseExecution={taskPlanCallbacks?.onPauseExecution}
          onSkipStep={taskPlanCallbacks?.onSkipStep}
          onCancelTask={taskPlanCallbacks?.onCancelTask}
          isLoading={taskPlanBlock.planStatus === 'executing'}
        />
      )
    }
    case MessageBlockType.CITATION:
      return <CitationBlock key={block.id} block={block as CitationMessageBlock} />
    case MessageBlockType.ERROR:
      return <ErrorBlock key={block.id} block={block as ErrorMessageBlock} onRetry={onRetry} />
    case MessageBlockType.CODE:
      return <CodeBlock key={block.id} block={block as CodeMessageBlock} />
    case MessageBlockType.IMAGE:
      return <ImageBlock key={block.id} block={block as ImageBlockType} />
    default:
      return <MainTextBlock key={block.id} block={block as MainTextMessageBlock} />
  }
}

const MessageListComponent: FC<MessageListProps> = ({
  messages,
  loading = false,
  onRetry,
  onCopy,
  onEdit,
  onDelete,
  onRegenerate,
  onApplyToWord,
  onUndoCommand,
  onSuggestionClick,
  onStartTaskExecution,
  onPauseTaskExecution,
  onSkipTaskStep,
  onCancelTask,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [undoStatuses, setUndoStatuses] = useState<
    Record<
      string,
      {
        status: 'pending' | 'success' | 'error'
        message: string
      }
    >
  >({})

  const handleUndo = useCallback(
    async (messageId: string) => {
      if (!onUndoCommand) {
        return
      }

      setUndoStatuses((prev) => ({
        ...prev,
        [messageId]: { status: 'pending', message: '正在撤销...' }
      }))

      try {
        const result = await onUndoCommand(messageId)
        const success = result !== false
        setUndoStatuses((prev) => ({
          ...prev,
          [messageId]: {
            status: success ? 'success' : 'error',
            message: success ? '撤销成功' : '未能撤销操作'
          }
        }))
      } catch (error) {
        setUndoStatuses((prev) => ({
          ...prev,
          [messageId]: { status: 'error', message: '撤销失败，请重试' }
        }))
      }
    },
    [onUndoCommand]
  )

  const renderUndoFeedback = useCallback(
    (messageId: string) => {
      const feedback = undoStatuses[messageId]
      if (!feedback) {
        return null
      }

      const colorClass =
        feedback.status === 'success'
          ? 'text-green-600'
          : feedback.status === 'error'
            ? 'text-red-600'
            : 'text-muted-foreground'

      return (
        <span className={cn('text-xs mt-1', colorClass)}>
          {feedback.message}
        </span>
      )
    },
    [undoStatuses]
  )

  // 自动滚动到底部 - 当消息变化时（包括内容变化）
  useEffect(() => {
    if (messagesEndRef.current) {
      // 使用 smooth 滚动，提供更好的视觉体验
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages]) // 监听整个 messages 数组，而不仅是长度

  // 当正在加载时，也保持滚动到底部
  useEffect(() => {
    if (loading && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [loading])

  const showConversationComplete = !loading && messages.length > 0

  return (
    <div
      ref={containerRef}
      className={cn('flex-1 overflow-y-auto scroll-smooth', className)}
    >
      <div className={cn(
        'mx-auto flex w-full max-w-3xl flex-col',
        messages.length === 0 ? 'min-h-full' : 'gap-6 pt-6 px-4 pb-24'
      )}>
        {messages.length === 0 && !loading && (
          <EmptyState onSuggestionClick={onSuggestionClick} />
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role}
            userName={message.role === 'user' ? '用户' : undefined}
            timestamp={new Date(message.createdAt).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
            showHoverActions={!message.error}
            hoverActions={
              onCopy && onDelete ? (
                <div className="origin-left scale-90">
                  <MessageActions
                    messageId={message.id}
                    role={message.role}
                    onCopy={onCopy}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onRegenerate={message.role === 'assistant' ? onRegenerate : undefined}
                  />
                </div>
              ) : undefined
            }
            footer={
              message.role === 'assistant' && !message.error && hasDisplayableContent(message) ? (
                <QuickActions
                  actions={getDefaultQuickActions(
                    isCommandMessage(message) ? 'text' : 'text', // 已禁用 edit-suggestion 类型
                    {
                      onCopy: onCopy ? () => onCopy(message.id) : undefined,
                      onInsert: onApplyToWord ? () => onApplyToWord(message.id) : undefined,
                      onRewrite: onRegenerate ? () => onRegenerate(message.id) : undefined
                    }
                  )}
                />
              ) : undefined
            }
          >
            <div className="flex flex-col gap-4 text-sm leading-relaxed text-foreground">
              {message.blocks.map((block) => {
                // 为 TASK_PLAN 类型的块构建回调
                const taskPlanCallbacks: TaskPlanCallbacks | undefined = 
                  block.type === MessageBlockType.TASK_PLAN 
                    ? {
                        onStartExecution: onStartTaskExecution 
                          ? () => onStartTaskExecution((block as TaskPlanMessageBlock).planId) 
                          : undefined,
                        onPauseExecution: onPauseTaskExecution 
                          ? () => onPauseTaskExecution((block as TaskPlanMessageBlock).planId) 
                          : undefined,
                        onSkipStep: onSkipTaskStep 
                          ? (stepId: string) => onSkipTaskStep((block as TaskPlanMessageBlock).planId, stepId) 
                          : undefined,
                        onCancelTask: onCancelTask 
                          ? () => onCancelTask((block as TaskPlanMessageBlock).planId) 
                          : undefined,
                      }
                    : undefined
                
                return renderMessageBlock(block, () => onRetry?.(message.id), taskPlanCallbacks)
              })}
            </div>

            {message.role === 'assistant' && isCommandMessage(message) && (
              <div className="mt-2">
                <CommandSuccessMessage
                  toolBlocks={getToolBlocks(message)}
                  onUndo={() => onUndoCommand?.(message.id)}
                  onViewDetails={() => console.log('View command details:', message.id)}
                />
              </div>
            )}

            {/* 已禁用：EditSuggestionMessage 改写建议功能 - 避免对查询响应误判为编辑建议 */}
            {/* {message.role === 'assistant' && isEditMessage(message) && (
              <div className="mt-2">
                <EditSuggestionMessage
                  message={message}
                  onApplyToDocument={onApplyToWord}
                  onCopyText={(text) => navigator.clipboard.writeText(text)}
                />
              </div>
            )} */}

            {message.role === 'assistant' && isQueryMessage(message) && (() => {
              const mainBlock = message.blocks?.find((b: MessageBlock) => b.type === MessageBlockType.MAIN_TEXT) as MainTextMessageBlock | undefined
              const contentLength = mainBlock?.content?.length || 0
              return contentLength > 200
            })() && (
              <div className="mt-2">
                <QueryResultMessage message={message} onCopyText={(text) => navigator.clipboard.writeText(text)} />
              </div>
            )}

            {renderUndoFeedback(message.id)}
          </MessageBubble>
        ))}

        {loading && <TypingIndicator label="正在思考..." />}

        {showConversationComplete && (
          <div className="flex justify-center pt-2 animate-fade-up">
            <div className="glass flex items-center gap-2 rounded-full border border-border/30 px-4 py-2 text-xs text-muted-foreground shadow-sm">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                <CheckmarkRegular className="h-3 w-3 text-green-600" />
              </div>
              <span>对话已完成，可继续提问</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  )
}

// 使用 memo 优化性能，避免不必要的重新渲染
export const MessageList = memo(MessageListComponent)
