/**
 * useMessageHandlers - 消息操作处理 Hook
 * 从 ChatInterface.tsx 提取的消息操作相关逻辑
 */

import { useCallback } from 'react'
import type { Message, MessageBlock, MainTextMessageBlock, ToolMessageBlock } from '../../../../types/messageBlock'
import { MessageBlockType, MessageBlockStatus } from '../../../../types/messageBlock'
import { wordService } from '../../../../services/WordService'
import { UndoManager } from '../../../../services/UndoManager'
import Logger from '../../../../utils/logger'

const logger = new Logger('useMessageHandlers')

export interface UseMessageHandlersOptions {
  messages: Message[]
  currentOfficeApp: string
  undoManagerRef: React.MutableRefObject<UndoManager | null>
  messageOperations: {
    copyMessage: (message: Message) => Promise<void>
    deleteMessage: (messageId: string) => void
    regenerateAssistantMessage: (message: Message) => Promise<void>
    regenerateUserMessage: (message: Message) => Promise<void>
  }
}

export interface UseMessageHandlersReturn {
  handleCopyMessage: (messageId: string) => Promise<void>
  handleDeleteMessage: (messageId: string) => void
  handleRegenerateMessage: (messageId: string) => Promise<void>
  handleUndoCommand: (messageId: string) => Promise<boolean>
  getMessageTextContent: (messageId: string) => string
}

export function useMessageHandlers({
  messages,
  currentOfficeApp,
  undoManagerRef,
  messageOperations
}: UseMessageHandlersOptions): UseMessageHandlersReturn {
  
  const handleCopyMessage = useCallback(
    async (messageId: string) => {
      const message = messages.find((m) => m.id === messageId)
      if (message) {
        await messageOperations.copyMessage(message)
        logger.debug('Message copied', { messageId })
      }
    },
    [messages, messageOperations]
  )

  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      messageOperations.deleteMessage(messageId)
      logger.debug('Message deleted', { messageId })
    },
    [messageOperations]
  )

  const handleRegenerateMessage = useCallback(
    async (messageId: string) => {
      const message = messages.find((m) => m.id === messageId)
      if (message) {
        if (message.role === 'assistant') {
          await messageOperations.regenerateAssistantMessage(message)
        } else {
          await messageOperations.regenerateUserMessage(message)
        }
        logger.debug('Message regenerated', { messageId })
      }
    },
    [messages, messageOperations]
  )

  const handleUndoCommand = useCallback(
    async (messageId: string): Promise<boolean> => {
      const targetMessage = messages.find((m) => m.id === messageId)
      if (!targetMessage) {
        logger.warn('Cannot undo: message not found', { messageId })
        return false
      }

      if (currentOfficeApp !== 'word') {
        logger.warn('Undo is only supported for Word documents', {
          messageId,
          currentOfficeApp
        })
        return false
      }

      try {
        if (undoManagerRef.current) {
          const undoCount = await undoManagerRef.current.undoMessageOperations(messageId)
          if (undoCount > 0) {
            logger.info('Undo manager reverted operations', { messageId, undoCount })
            return true
          }
        }

        const toolBlocks = targetMessage.blocks.filter(
          (block): block is ToolMessageBlock => block.type === MessageBlockType.TOOL
        )
        const successfulToolCalls = toolBlocks.filter((block) => block.status === MessageBlockStatus.SUCCESS)
        const undoCount = successfulToolCalls.length

        if (undoCount === 0) {
          logger.warn('No successful tool operations to undo', {
            messageId,
            toolBlockCount: toolBlocks.length
          })
          return false
        }

        await wordService.undo()
        logger.info('Word undo executed successfully', {
          messageId,
          undoCount,
          toolNames: successfulToolCalls.map((b) => (b as any).toolName)
        })
        return true
      } catch (error) {
        logger.error('Failed to undo command operations', {
          messageId,
          error
        })
        return false
      }
    },
    [messages, currentOfficeApp, undoManagerRef]
  )

  const getMessageTextContent = useCallback((messageId: string): string => {
    const message = messages.find((m) => m.id === messageId)
    if (!message) return ''

    return message.blocks
      .filter((b) => b.type === MessageBlockType.MAIN_TEXT)
      .map((b) => (b as MainTextMessageBlock).content)
      .join('\n')
  }, [messages])

  return {
    handleCopyMessage,
    handleDeleteMessage,
    handleRegenerateMessage,
    handleUndoCommand,
    getMessageTextContent
  }
}
