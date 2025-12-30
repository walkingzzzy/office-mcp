/**
 * useMessageOperations Hook
 * 提供消息操作功能（复制、重新生成、删除等）
 * 
 * @updated 2025-12-29 - 统一错误处理 (修复 P2)
 */

import { useCallback } from 'react'

import type { Message } from '../types/messageBlock'
import Logger from '../utils/logger'
import { getMainTextContent } from '../utils/messageBlocks'

const logger = new Logger('useMessageOperations')

export interface MessageOperationsHandlers {
  /**
   * 复制消息内容
   */
  copyMessage: (message: Message) => Promise<void>

  /**
   * 删除消息
   */
  deleteMessage: (messageId: string) => void

  /**
   * 重新生成用户消息（重新发送）
   */
  regenerateUserMessage: (message: Message) => Promise<void>

  /**
   * 重新生成助手消息
   */
  regenerateAssistantMessage: (message: Message) => Promise<void>
}

interface UseMessageOperationsOptions {
  /**
   * 消息列表
   */
  messages: Message[]

  /**
   * 设置消息列表
   */
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>

  /**
   * 发送消息回调
   */
  onSendMessage?: (content: string) => Promise<void>

  /**
   * 当前对话 ID（用于同步到 Store）
   */
  currentConversationId?: string | null

  /**
   * Store 操作方法（用于同步状态）
   */
  storeOperations?: {
    deleteMessage?: (conversationId: string, messageId: string) => void
    updateMessage?: (conversationId: string, messageId: string, updates: Partial<Message>) => void
    addMessage?: (conversationId: string, message: Message) => void
  }
}

/**
 * 消息操作 Hook
 */
export const useMessageOperations = (options: UseMessageOperationsOptions): MessageOperationsHandlers => {
  const { messages, setMessages, onSendMessage, currentConversationId, storeOperations } = options

  /**
   * 复制消息内容
   */
  const copyMessage = useCallback(async (message: Message) => {
    const operationId = `copy-${Date.now()}`
    logger.info(`[${operationId}] Starting copy message operation`, {
      messageId: message.id,
      role: message.role,
      blocksCount: message.blocks.length
    })

    try {
      const content = getMainTextContent(message.blocks)
      logger.debug(`[${operationId}] Extracted text content`, {
        contentLength: content.length,
        contentPreview: content.substring(0, 100)
      })

      await navigator.clipboard.writeText(content)

      logger.info(`[${operationId}] Message copied successfully`, {
        messageId: message.id,
        contentLength: content.length
      })
    } catch (error) {
      logger.error(`[${operationId}] Failed to copy message`, {
        messageId: message.id,
        error: (error as Error).message,
        stack: (error as Error).stack
      })
      throw error
    }
  }, [])

  /**
   * 删除消息
   */
  const deleteMessage = useCallback(
    (messageId: string) => {
      const operationId = `delete-${Date.now()}`
      logger.info(`[${operationId}] Starting delete message operation`, {
        messageId,
        totalMessages: messages.length,
        hasStore: !!storeOperations?.deleteMessage,
        conversationId: currentConversationId
      })

      const messageIndex = messages.findIndex(m => m.id === messageId)
      const message = messages.find(m => m.id === messageId)

      if (!message) {
        logger.warn(`[${operationId}] Message not found for deletion`, { messageId })
        return
      }

      logger.debug(`[${operationId}] Message found for deletion`, {
        messageId,
        messageIndex,
        role: message.role,
        blocksCount: message.blocks.length
      })

      // 1. 更新本地 state
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))

      // 2. 同步到 Store（如果有当前对话）
      if (currentConversationId && storeOperations?.deleteMessage) {
        try {
          storeOperations.deleteMessage(currentConversationId, messageId)
          logger.debug(`[${operationId}] Message deleted from store`, {
            conversationId: currentConversationId,
            messageId
          })
        } catch (error) {
          logger.error(`[${operationId}] Failed to delete message from store`, {
            conversationId: currentConversationId,
            messageId,
            error
          })
        }
      }

      logger.info(`[${operationId}] Message deleted successfully`, {
        messageId,
        messageIndex,
        remainingMessages: messages.length - 1,
        syncedToStore: !!(currentConversationId && storeOperations?.deleteMessage)
      })
    },
    [setMessages, messages, currentConversationId, storeOperations]
  )

  /**
   * 重新生成用户消息（重新发送）
   */
  const regenerateUserMessage = useCallback(
    async (message: Message) => {
      const operationId = `regen-user-${Date.now()}`
      logger.info(`[${operationId}] Starting regenerate user message operation`, {
        messageId: message.id,
        role: message.role
      })

      if (message.role !== 'user') {
        logger.warn(`[${operationId}] Cannot regenerate non-user message`, {
          messageId: message.id,
          actualRole: message.role
        })
        return
      }

      try {
        // 找到该消息及其后续的所有消息
        const messageIndex = messages.findIndex((msg) => msg.id === message.id)
        if (messageIndex === -1) {
          logger.warn(`[${operationId}] Message not found in messages array`, {
            messageId: message.id,
            totalMessages: messages.length
          })
          return
        }

        const messagesToDelete = messages.slice(messageIndex)
        logger.debug(`[${operationId}] Preparing to delete messages`, {
          messageIndex,
          messagesToDeleteCount: messagesToDelete.length,
          totalMessages: messages.length
        })

        // 1. 删除该消息及其后续的所有消息（本地 state）
        setMessages((prev) => prev.slice(0, messageIndex))

        // 2. 同步到 Store（删除所有相关消息）
        if (currentConversationId && storeOperations?.deleteMessage) {
          try {
            for (const msg of messagesToDelete) {
              storeOperations.deleteMessage(currentConversationId, msg.id)
            }
            logger.debug(`[${operationId}] Messages deleted from store`, {
              conversationId: currentConversationId,
              deletedCount: messagesToDelete.length
            })
          } catch (error) {
            logger.error(`[${operationId}] Failed to delete messages from store`, {
              conversationId: currentConversationId,
              error
            })
          }
        }

        // 重新发送消息
        if (onSendMessage) {
          const content = getMainTextContent(message.blocks)
          logger.debug(`[${operationId}] Resending user message`, {
            contentLength: content.length,
            contentPreview: content.substring(0, 100)
          })
          await onSendMessage(content)
        }

        logger.info(`[${operationId}] User message regenerated successfully`, {
          messageId: message.id,
          deletedCount: messagesToDelete.length,
          syncedToStore: !!(currentConversationId && storeOperations?.deleteMessage)
        })
      } catch (error) {
        logger.error(`[${operationId}] Failed to regenerate user message`, {
          messageId: message.id,
          error: (error as Error).message,
          stack: (error as Error).stack
        })
        throw error
      }
    },
    [messages, setMessages, onSendMessage, currentConversationId, storeOperations]
  )

  /**
   * 重新生成助手消息
   */
  const regenerateAssistantMessage = useCallback(
    async (message: Message) => {
      const operationId = `regen-assistant-${Date.now()}`
      
      if (message.role !== 'assistant') {
        logger.warn(`[${operationId}] Cannot regenerate non-assistant message`, {
          messageId: message.id,
          actualRole: message.role
        })
        return
      }

      try {
        // 找到该消息的索引
        const messageIndex = messages.findIndex((msg) => msg.id === message.id)
        if (messageIndex === -1) {
          logger.warn(`[${operationId}] Message not found`, { messageId: message.id })
          return
        }

        // 找到前一条用户消息
        const previousUserMessage = messages
          .slice(0, messageIndex)
          .reverse()
          .find((msg) => msg.role === 'user')

        if (!previousUserMessage) {
          logger.warn(`[${operationId}] No previous user message found`)
          return
        }

        // 删除该助手消息及其后续的所有消息
        setMessages((prev) => prev.slice(0, messageIndex))

        // 重新发送前一条用户消息
        if (onSendMessage) {
          const content = getMainTextContent(previousUserMessage.blocks)
          await onSendMessage(content)
        }

        logger.info(`[${operationId}] Assistant message regenerated`, { messageId: message.id })
      } catch (error) {
        logger.error(`[${operationId}] Failed to regenerate assistant message`, {
          messageId: message.id,
          error: (error as Error).message
        })
        throw error
      }
    },
    [messages, setMessages, onSendMessage]
  )

  return {
    copyMessage,
    deleteMessage,
    regenerateUserMessage,
    regenerateAssistantMessage
  }
}
