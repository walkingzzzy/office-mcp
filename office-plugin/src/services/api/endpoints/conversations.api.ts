/**
 * Conversations API - 对话管理接口
 * 
 * @updated 2025-12-29 - 添加严格类型定义 (修复 P1)
 */

import { apiClient } from '../client'
import type {
  Conversation,
  ConversationMessage,
  ConversationUpdateParams
} from '../../../types/api'

export const conversationsApi = {
  /**
   * 获取所有对话
   */
  async getConversations(): Promise<Conversation[]> {
    const response = await apiClient.get<{ conversations: Conversation[] }>('/api/conversations')
    return response.conversations
  },

  /**
   * 获取指定对话详情
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await apiClient.get<{ conversation: Conversation }>(`/api/conversations/${conversationId}`)
    return response.conversation
  },

  /**
   * 创建新对话
   */
  async createConversation(name?: string, assistantId?: string): Promise<Conversation> {
    const response = await apiClient.post<{ conversation: Conversation }>('/api/conversations', {
      name,
      assistantId,
    })
    return response.conversation
  },

  /**
   * 更新对话信息
   */
  async updateConversation(conversationId: string, updates: ConversationUpdateParams): Promise<Conversation> {
    const response = await apiClient.put<{ conversation: Conversation }>(
      `/api/conversations/${conversationId}`,
      updates
    )
    return response.conversation
  },

  /**
   * 删除对话
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await apiClient.delete(`/api/conversations/${conversationId}`)
  },

  /**
   * 清空对话消息
   */
  async clearConversation(conversationId: string): Promise<void> {
    await apiClient.post(`/api/conversations/${conversationId}/clear`)
  },

  /**
   * 获取对话的所有消息
   */
  async getConversationMessages(conversationId: string): Promise<ConversationMessage[]> {
    const response = await apiClient.get<{ messages: ConversationMessage[] }>(
      `/api/conversations/${conversationId}/messages`
    )
    return response.messages
  },
}
