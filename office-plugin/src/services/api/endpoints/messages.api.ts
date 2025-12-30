/**
 * Messages API - 消息管理接口
 * 
 * @updated 2025-12-29 - 添加严格类型定义 (修复 P1)
 */

import { apiClient } from '../client'
import type { ApiMessage, Assistant } from '../../../types/api'

export const messagesApi = {
  /**
   * 获取指定对话的所有消息
   */
  async getMessages(topicId: string): Promise<ApiMessage[]> {
    const response = await apiClient.get<{ messages: ApiMessage[] }>(`/api/messages/${topicId}`)
    return response.messages
  },

  /**
   * 删除消息
   */
  async deleteMessage(topicId: string, messageId: string): Promise<void> {
    await apiClient.post(`/api/messages/${messageId}/delete`, { topicId })
  },

  /**
   * 重新生成 AI 消息
   */
  async regenerateMessage(topicId: string, messageId: string, assistant: Assistant): Promise<void> {
    await apiClient.post(`/api/messages/${messageId}/regenerate`, { topicId, assistant })
  },

  /**
   * 编辑用户消息
   */
  async editMessage(topicId: string, messageId: string, newContent: string): Promise<void> {
    await apiClient.post(`/api/messages/${messageId}/edit`, { topicId, newContent })
  },

  /**
   * 重新发送用户消息
   */
  async resendMessage(topicId: string, messageId: string, assistant: Assistant): Promise<void> {
    await apiClient.post(`/api/messages/${messageId}/resend`, { topicId, assistant })
  },
}
