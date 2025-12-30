/**
 * 对话状态管理 Store
 * 使用 Zustand 管理对话列表和当前对话状态
 * 
 * @updated 2025-12-29 - 统一使用 Logger 替代 console.log (修复 P14)
 * @updated 2025-12-29 - 统一错误处理策略 (修复 P2)
 */

import { create } from 'zustand'

import { type Conversation,conversationService } from '../services/conversation'
import type { Message } from '../types/messageBlock'
import Logger from '../utils/logger'
import { ErrorHandler, ErrorCode, OfficePluginError, ErrorSeverity } from '../shared/errors'

const logger = new Logger('ConversationStore')

/**
 * 创建存储错误
 */
function createStorageError(message: string, originalError?: Error): OfficePluginError {
  return new OfficePluginError(
    message,
    ErrorCode.STORAGE_ERROR,
    ErrorSeverity.ERROR,
    originalError
  )
}

/**
 * 对话 Store 状态接口
 */
interface ConversationState {
  // 状态
  conversations: Conversation[]
  currentConversationId: string | null
  loading: boolean
  error: string | null

  // 操作
  loadConversations: () => void
  createConversation: (title?: string, modelId?: string) => Conversation
  selectConversation: (id: string) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void
  deleteConversation: (id: string) => void
  clearAllConversations: () => void

  // 消息操作
  addMessage: (conversationId: string, message: Message) => void
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void
  deleteMessage: (conversationId: string, messageId: string) => void

  // 辅助方法
  getCurrentConversation: () => Conversation | null
  getConversationMessages: (id: string) => Message[]
}

/**
 * 创建对话 Store
 */
export const useConversationStore = create<ConversationState>((set, get) => ({
  // 初始状态
  conversations: [],
  currentConversationId: null,
  loading: false,
  error: null,

  /**
   * 加载所有对话
   */
  loadConversations: () => {
    try {
      set({ loading: true, error: null })
      const conversations = conversationService.getAllConversations()
      const currentId = conversationService.getCurrentConversationId()

      set({
        conversations,
        currentConversationId: currentId,
        loading: false
      })

      logger.info('Loaded conversations', { count: conversations.length })
    } catch (error) {
      logger.error('Failed to load conversations', { error })
      set({
        error: (error as Error).message,
        loading: false
      })
    }
  },

  /**
   * 创建新对话
   */
  createConversation: (title?: string, modelId?: string) => {
    try {
      const conversation = conversationService.createConversation(title, modelId)

      set((state) => ({
        conversations: [conversation, ...state.conversations],
        currentConversationId: conversation.id
      }))

      conversationService.setCurrentConversationId(conversation.id)
      logger.info('Created conversation', { id: conversation.id })

      return conversation
    } catch (error) {
      logger.error('Failed to create conversation', { error })
      set({ error: (error as Error).message })
      throw error
    }
  },

  /**
   * 选择对话
   */
  selectConversation: (id: string) => {
    try {
      const conversation = conversationService.getConversation(id)
      if (!conversation) {
        logger.warn('Conversation not found', { id })
        return
      }

      set({ currentConversationId: id })
      conversationService.setCurrentConversationId(id)
      logger.debug('Selected conversation', { id })
    } catch (error) {
      logger.error('Failed to select conversation', { error })
      set({ error: (error as Error).message })
    }
  },

  /**
   * 更新对话
   */
  updateConversation: (id: string, updates: Partial<Conversation>) => {
    try {
      conversationService.updateConversation(id, updates)

      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === id ? { ...conv, ...updates, updatedAt: new Date().toISOString() } : conv
        )
      }))

      logger.debug('Updated conversation', { id })
    } catch (error) {
      logger.error('Failed to update conversation', { error })
      set({ error: (error as Error).message })
    }
  },

  /**
   * 删除对话
   */
  deleteConversation: (id: string) => {
    try {
      conversationService.deleteConversation(id)

      set((state) => {
        const filteredConversations = state.conversations.filter((conv) => conv.id !== id)
        const newCurrentId = state.currentConversationId === id
          ? (filteredConversations[0]?.id || null)
          : state.currentConversationId

        if (newCurrentId) {
          conversationService.setCurrentConversationId(newCurrentId)
        }

        return {
          conversations: filteredConversations,
          currentConversationId: newCurrentId
        }
      })

      logger.info('Deleted conversation', { id })
    } catch (error) {
      logger.error('Failed to delete conversation', { error })
      set({ error: (error as Error).message })
    }
  },

  /**
   * 清空所有对话
   */
  clearAllConversations: () => {
    try {
      conversationService.clearAll()
      set({
        conversations: [],
        currentConversationId: null
      })
      logger.info('Cleared all conversations')
    } catch (error) {
      logger.error('Failed to clear conversations', { error })
      set({ error: (error as Error).message })
    }
  },

  /**
   * 添加消息到对话
   * 
   * @updated 2025-12-29 - 改进消息转换，保留更多语义信息 (修复 P3)
   */
  addMessage: (conversationId: string, message: Message) => {
    try {
      // 跳过 system 消息
      if (message.role === 'system') {
        return
      }

      // 转换 Message 为 ConversationMessage
      // 改进：保留所有块类型的内容，不仅仅是 main_text
      const contentParts: string[] = []
      
      for (const block of message.blocks) {
        // 使用 block.type 字符串值进行比较
        const blockType = block.type as string
        
        switch (blockType) {
          case 'main_text':
            if ('content' in block && block.content) {
              contentParts.push(String(block.content))
            }
            break
          case 'tool':
            // 保留工具调用的语义信息
            if ('toolName' in block) {
              contentParts.push(`[工具调用: ${block.toolName}]`)
            }
            break
          case 'task_plan':
            // 保留任务计划的摘要
            if ('title' in block) {
              contentParts.push(`[任务计划: ${block.title}]`)
            }
            break
          case 'thinking':
            // 思考过程可选保留
            if ('content' in block && block.content) {
              contentParts.push(`[思考: ${String(block.content).substring(0, 100)}...]`)
            }
            break
          case 'error':
            // 保留错误信息
            if ('message' in block) {
              contentParts.push(`[错误: ${block.message}]`)
            }
            break
          // 其他类型保留原始内容（如果有）
          default:
            if ('content' in block && typeof block.content === 'string') {
              contentParts.push(block.content)
            }
        }
      }

      const conversationMessage = {
        id: message.id,
        role: message.role,
        content: contentParts.join('\n'),
        timestamp: message.createdAt,
        blocks: message.blocks  // 保留完整的 blocks 用于恢复
      }

      conversationService.addMessage(conversationId, conversationMessage)

      // 重新加载对话以获取最新状态
      const updatedConversation = conversationService.getConversation(conversationId)
      if (updatedConversation) {
        set((state) => {
          // 查找对话索引，避免不必要的数组重建
          const index = state.conversations.findIndex((conv) => conv.id === conversationId)
          if (index === -1) return state

          // 使用 slice 创建新数组，只替换变化的元素
          const newConversations = state.conversations.slice()
          newConversations[index] = updatedConversation
          return { conversations: newConversations }
        })
      }

      logger.debug('Added message to conversation', { conversationId })
    } catch (error) {
      logger.error('Failed to add message', { error })
      set({ error: (error as Error).message })
    }
  },

  /**
   * 更新对话中的消息
   */
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => {
    try {
      // 转换更新为 ConversationMessage 格式
      const conversationUpdates: Record<string, unknown> = {}
      if (updates.blocks) {
        conversationUpdates.content = updates.blocks
          .filter(b => b.type === 'main_text')
          .map(b => ('content' in b ? b.content : ''))
          .join('\n')
        conversationUpdates.blocks = updates.blocks
      }

      conversationService.updateMessage(conversationId, messageId, conversationUpdates)

      // 重新加载对话
      const updatedConversation = conversationService.getConversation(conversationId)
      if (updatedConversation) {
        set((state) => {
          // 查找对话索引，避免不必要的数组重建
          const index = state.conversations.findIndex((conv) => conv.id === conversationId)
          if (index === -1) return state

          // 使用 slice 创建新数组，只替换变化的元素
          const newConversations = state.conversations.slice()
          newConversations[index] = updatedConversation
          return { conversations: newConversations }
        })
      }

      logger.debug('Updated message', { messageId })
    } catch (error) {
      logger.error('Failed to update message', { error })
      set({ error: (error as Error).message })
    }
  },

  /**
   * 删除对话中的消息
   */
  deleteMessage: (conversationId: string, messageId: string) => {
    try {
      conversationService.deleteMessage(conversationId, messageId)

      // 重新加载对话
      const updatedConversation = conversationService.getConversation(conversationId)
      if (updatedConversation) {
        set((state) => {
          // 查找对话索引，避免不必要的数组重建
          const index = state.conversations.findIndex((conv) => conv.id === conversationId)
          if (index === -1) return state

          // 使用 slice 创建新数组，只替换变化的元素
          const newConversations = state.conversations.slice()
          newConversations[index] = updatedConversation
          return { conversations: newConversations }
        })
      }

      logger.debug('Deleted message', { messageId })
    } catch (error) {
      logger.error('Failed to delete message', { error })
      set({ error: (error as Error).message })
    }
  },

  /**
   * 获取当前对话
   */
  getCurrentConversation: () => {
    const { conversations, currentConversationId } = get()
    if (!currentConversationId) return null
    return conversations.find((conv) => conv.id === currentConversationId) || null
  },

  /**
   * 获取对话的消息列表
   */
  getConversationMessages: (id: string) => {
    const { conversations } = get()
    const conversation = conversations.find((conv) => conv.id === id)
    if (!conversation) return []

    // 转换 ConversationMessage 为 Message
    return conversation.messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      blocks: msg.blocks || [],
      createdAt: msg.timestamp,
      updatedAt: msg.timestamp
    })) as Message[]
  }
}))

