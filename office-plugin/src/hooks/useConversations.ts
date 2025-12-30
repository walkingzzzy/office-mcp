/**
 * Conversations Hooks - 对话管理相关 Hooks
 * 使用 React Query 管理对话数据
 * 
 * @updated 2025-12-29 - 添加严格类型定义 (修复 P1)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../services/api/ApiClientFacade'
import type { ConversationUpdateParams } from '../types/api'
import Logger from '../utils/logger'

const logger = new Logger('useConversations')

/**
 * 查询键工厂
 */
const conversationsKeys = {
  all: ['conversations'] as const,
  list: () => [...conversationsKeys.all, 'list'] as const,
  detail: (conversationId: string) => [...conversationsKeys.all, 'detail', conversationId] as const,
  messages: (conversationId: string) => [...conversationsKeys.all, 'messages', conversationId] as const
}

/**
 * 获取所有对话
 */
export function useConversations() {
  return useQuery({
    queryKey: conversationsKeys.list(),
    queryFn: () => apiClient.getConversations(),
    staleTime: 1 * 60 * 1000 // 1 分钟后视为过时
  })
}

/**
 * 获取单个对话详情
 */
export function useConversation(conversationId: string, enabled = true) {
  return useQuery({
    queryKey: conversationsKeys.detail(conversationId),
    queryFn: () => apiClient.getConversation(conversationId),
    enabled: !!conversationId && enabled,
    staleTime: 1 * 60 * 1000
  })
}

/**
 * 获取对话消息
 */
export function useConversationMessages(conversationId: string, enabled = true) {
  return useQuery({
    queryKey: conversationsKeys.messages(conversationId),
    queryFn: () => apiClient.getConversationMessages(conversationId),
    enabled: !!conversationId && enabled,
    staleTime: 30 * 1000 // 30 秒后视为过时
  })
}

/**
 * 创建新对话
 */
export function useCreateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, assistantId }: { name?: string; assistantId?: string }) =>
      apiClient.createConversation(name, assistantId),
    onSuccess: () => {
      // 重新获取对话列表
      queryClient.invalidateQueries({ queryKey: conversationsKeys.list() })
    },
    onError: (error) => {
      logger.error('Failed to create conversation', error)
    }
  })
}

/**
 * 更新对话信息
 */
export function useUpdateConversation(conversationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: ConversationUpdateParams) => apiClient.updateConversation(conversationId, updates),
    onSuccess: () => {
      // 重新获取对话列表和详情
      queryClient.invalidateQueries({ queryKey: conversationsKeys.list() })
      queryClient.invalidateQueries({ queryKey: conversationsKeys.detail(conversationId) })
    },
    onError: (error) => {
      logger.error('Failed to update conversation', error)
    }
  })
}

/**
 * 删除对话
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversationId: string) => apiClient.deleteConversation(conversationId),
    onSuccess: () => {
      // 重新获取对话列表
      queryClient.invalidateQueries({ queryKey: conversationsKeys.list() })
    },
    onError: (error) => {
      logger.error('Failed to delete conversation', error)
    }
  })
}

/**
 * 清空对话消息
 */
export function useClearConversation(conversationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiClient.clearConversation(conversationId),
    onSuccess: () => {
      // 重新获取对话消息
      queryClient.invalidateQueries({ queryKey: conversationsKeys.messages(conversationId) })
      queryClient.invalidateQueries({ queryKey: conversationsKeys.detail(conversationId) })
    },
    onError: (error) => {
      logger.error('Failed to clear conversation', error)
    }
  })
}
