/**
 * 对话服务
 * 处理对话的 LocalStorage 存储和读取
 */

import Logger from '../utils/logger'
import type { MessageBlock } from '../types/messageBlock'

const logger = new Logger('ConversationService')

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  blocks?: MessageBlock[]
  knowledgeBaseIds?: string[]
  mcpServerIds?: string[]
}

export interface Conversation {
  id: string
  title: string
  messages: ConversationMessage[]
  createdAt: string
  updatedAt: string
  modelId?: string
  favorite?: boolean
}

const STORAGE_KEY = 'office-plugin-conversations'
const CURRENT_CONVERSATION_KEY = 'office-plugin-current-conversation-id'

/**
 * 对话服务类
 */
class ConversationService {
  /**
   * 获取所有对话
   */
  getAllConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) {
        return []
      }
      return JSON.parse(data)
    } catch (error) {
      logger.error('获取对话列表失败', error)
      return []
    }
  }

  /**
   * 获取单个对话
   */
  getConversation(id: string): Conversation | null {
    try {
      const conversations = this.getAllConversations()
      return conversations.find((conv) => conv.id === id) || null
    } catch (error) {
      logger.error('获取对话失败', error)
      return null
    }
  }

  /**
   * 创建新对话
   */
  createConversation(title?: string, modelId?: string): Conversation {
    try {
      const conversation: Conversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        title: title || this.generateTitle(),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        modelId,
        favorite: false
      }

      const conversations = this.getAllConversations()
      conversations.unshift(conversation)
      this.saveConversations(conversations)

      logger.debug('对话已创建', { id: conversation.id })
      return conversation
    } catch (error) {
      logger.error('创建对话失败', error)
      throw error
    }
  }

  /**
   * 更新对话
   */
  updateConversation(id: string, updates: Partial<Conversation>): void {
    try {
      const conversations = this.getAllConversations()
      const index = conversations.findIndex((conv) => conv.id === id)

      if (index === -1) {
        logger.warn('对话不存在', { id })
        return
      }

      conversations[index] = {
        ...conversations[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }

      this.saveConversations(conversations)
      logger.debug('对话已更新', { id })
    } catch (error) {
      logger.error('更新对话失败', error)
      throw error
    }
  }

  /**
   * 删除对话
   */
  deleteConversation(id: string): void {
    try {
      const conversations = this.getAllConversations()
      const filtered = conversations.filter((conv) => conv.id !== id)
      this.saveConversations(filtered)
      logger.debug('对话已删除', { id })
    } catch (error) {
      logger.error('删除对话失败', error)
      throw error
    }
  }

  /**
   * 添加消息到对话
   */
  addMessage(conversationId: string, message: ConversationMessage): void {
    try {
      const conversation = this.getConversation(conversationId)
      if (!conversation) {
        logger.warn('对话不存在', { conversationId })
        return
      }

      conversation.messages.push(message)

      // 如果是第一条用户消息，自动生成标题
      if (conversation.messages.length === 1 && message.role === 'user') {
        conversation.title = this.generateTitleFromMessage(message.content)
      }

      this.updateConversation(conversationId, conversation)
    } catch (error) {
      logger.error('添加消息失败', error)
      throw error
    }
  }

  /**
   * 更新对话中的消息
   */
  updateMessage(conversationId: string, messageId: string, updates: Partial<ConversationMessage>): void {
    try {
      const conversation = this.getConversation(conversationId)
      if (!conversation) {
        logger.warn('对话不存在', { conversationId })
        return
      }

      const messageIndex = conversation.messages.findIndex((msg) => msg.id === messageId)
      if (messageIndex === -1) {
        logger.warn('消息不存在', { messageId })
        return
      }

      conversation.messages[messageIndex] = {
        ...conversation.messages[messageIndex],
        ...updates
      }

      this.updateConversation(conversationId, conversation)
    } catch (error) {
      logger.error('更新消息失败', error)
      throw error
    }
  }

  /**
   * 删除对话中的消息
   */
  deleteMessage(conversationId: string, messageId: string): void {
    try {
      const conversation = this.getConversation(conversationId)
      if (!conversation) {
        logger.warn('对话不存在', { conversationId })
        return
      }

      conversation.messages = conversation.messages.filter((msg) => msg.id !== messageId)
      this.updateConversation(conversationId, conversation)
    } catch (error) {
      logger.error('删除消息失败', error)
      throw error
    }
  }

  /**
   * 获取当前对话 ID
   */
  getCurrentConversationId(): string | null {
    try {
      return localStorage.getItem(CURRENT_CONVERSATION_KEY)
    } catch (error) {
      logger.error('获取当前对话ID失败', error)
      return null
    }
  }

  /**
   * 设置当前对话 ID
   */
  setCurrentConversationId(id: string): void {
    try {
      localStorage.setItem(CURRENT_CONVERSATION_KEY, id)
    } catch (error) {
      logger.error('设置当前对话ID失败', error)
    }
  }

  /**
   * 保存对话列表到 LocalStorage
   */
  private saveConversations(conversations: Conversation[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
    } catch (error) {
      logger.error('保存对话列表失败', error)
      throw error
    }
  }

  /**
   * 生成默认标题
   */
  private generateTitle(): string {
    const now = new Date()
    return `对话 ${now.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`
  }

  /**
   * 从消息内容生成标题
   */
  private generateTitleFromMessage(content: string): string {
    const maxLength = 30
    const trimmed = content.trim()
    if (trimmed.length <= maxLength) {
      return trimmed
    }
    return trimmed.substring(0, maxLength) + '...'
  }

  /**
   * 清空所有对话
   */
  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(CURRENT_CONVERSATION_KEY)
      logger.info('所有对话已清除')
    } catch (error) {
      logger.error('清除对话失败', error)
      throw error
    }
  }
}

/**
 * 导出对话服务单例
 */
export const conversationService = new ConversationService()
