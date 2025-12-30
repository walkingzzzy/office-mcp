/**
 * useLocalConversations Hook
 * 管理基于 LocalStorage 的对话
 */

import { useCallback,useEffect, useState } from 'react'

import { type Conversation,conversationService } from '../services/conversation'
import type { Message } from '../types/messageBlock'

export function useLocalConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [currentMessages, setCurrentMessages] = useState<Message[]>([])

  // 加载所有对话
  const loadConversations = useCallback(() => {
    const allConversations = conversationService.getAllConversations()
    setConversations(allConversations)

    // 如果有当前对话 ID，加载它
    const currentId = conversationService.getCurrentConversationId()
    if (currentId) {
      setCurrentConversationId(currentId)
      const conversation = conversationService.getConversation(currentId)
      if (conversation) {
        // 转换 ConversationMessage 到 Message 类型
        const messages: Message[] = conversation.messages.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          blocks: msg.blocks || [],
          createdAt: msg.timestamp,
          error: false
        }))
        setCurrentMessages(messages)
      }
    }
  }, [])

  // 初始化时加载对话
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // 创建新对话
  const createConversation = useCallback(() => {
    const newConversation = conversationService.createConversation('新对话')
    conversationService.setCurrentConversationId(newConversation.id)
    setCurrentConversationId(newConversation.id)
    setCurrentMessages([])
    loadConversations()
    return newConversation
  }, [loadConversations])

  // 切换对话
  const switchConversation = useCallback((conversationId: string) => {
    conversationService.setCurrentConversationId(conversationId)
    setCurrentConversationId(conversationId)

    const conversation = conversationService.getConversation(conversationId)
    if (conversation) {
      const messages: Message[] = conversation.messages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        blocks: msg.blocks || [],
        createdAt: msg.timestamp,
        error: false
      }))
      setCurrentMessages(messages)
    }
  }, [])

  // 保存当前对话
  const saveCurrentConversation = useCallback((messages: Message[]) => {
    if (!currentConversationId) return

    const conversation = conversationService.getConversation(currentConversationId)
    if (conversation) {
      // 转换 Message 到 ConversationMessage，过滤掉 system 消息
      const conversationMessages = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.blocks
            .filter(b => b.type === 'main_text')
            .map(b => (b as any).content)
            .join('\n'),
          timestamp: msg.createdAt,
          blocks: msg.blocks
        }))

      conversationService.updateConversation(currentConversationId, {
        messages: conversationMessages
      })

      loadConversations()
    }
  }, [currentConversationId, loadConversations])

  // 删除对话
  const deleteConversation = useCallback((conversationId: string) => {
    conversationService.deleteConversation(conversationId)

    // 如果删除的是当前对话，清空消息
    if (conversationId === currentConversationId) {
      setCurrentConversationId(null)
      setCurrentMessages([])
    }

    loadConversations()
  }, [currentConversationId, loadConversations])

  // 重命名对话
  const renameConversation = useCallback((conversationId: string, newTitle: string) => {
    conversationService.updateConversation(conversationId, { title: newTitle })
    loadConversations()
  }, [loadConversations])

  return {
    conversations,
    currentConversationId,
    currentMessages,
    setCurrentMessages,
    createConversation,
    switchConversation,
    saveCurrentConversation,
    deleteConversation,
    renameConversation,
    loadConversations
  }
}
