/**
 * Messages Hooks - 消息管理相关 Hooks
 * 使用 React Query 管理消息数据
 * 
 * @updated 2025-12-29 - 添加严格类型定义 (修复 P1)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../services/api/ApiClientFacade'
import type { Assistant } from '../types/api'
import Logger from '../utils/logger'

const logger = new Logger('useMessages')

/**
 * 查询键工厂
 */
const messagesKeys = {
  all: ['messages'] as const,
  list: (topicId: string) => [...messagesKeys.all, 'list', topicId] as const
}

/**
 * 获取对话消息列表
 */
export function useMessages(topicId: string, enabled = true) {
  return useQuery({
    queryKey: messagesKeys.list(topicId),
    queryFn: () => apiClient.getMessages(topicId),
    enabled: !!topicId && enabled,
    staleTime: 1000, // 1 秒后视为过时
    refetchOnWindowFocus: true
  })
}

/**
 * 删除消息
 */
export function useDeleteMessage(topicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (messageId: string) => apiClient.deleteMessage(topicId, messageId),
    onSuccess: () => {
      // 重新获取消息列表
      queryClient.invalidateQueries({ queryKey: messagesKeys.list(topicId) })
    },
    onError: (error) => {
      logger.error('Failed to delete message', error)
    }
  })
}

/**
 * 重新生成 AI 消息
 */
export function useRegenerateMessage(topicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId, assistant }: { messageId: string; assistant: Assistant }) =>
      apiClient.regenerateMessage(topicId, messageId, assistant),
    onSuccess: () => {
      // 重新获取消息列表
      queryClient.invalidateQueries({ queryKey: messagesKeys.list(topicId) })
    },
    onError: (error) => {
      logger.error('Failed to regenerate message', error)
    }
  })
}

/**
 * 编辑用户消息
 */
export function useEditMessage(topicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId, newContent }: { messageId: string; newContent: string }) =>
      apiClient.editMessage(topicId, messageId, newContent),
    onSuccess: () => {
      // 重新获取消息列表
      queryClient.invalidateQueries({ queryKey: messagesKeys.list(topicId) })
    },
    onError: (error) => {
      logger.error('Failed to edit message', error)
    }
  })
}

/**
 * 重新发送用户消息
 */
export function useResendMessage(topicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId, assistant }: { messageId: string; assistant: Assistant }) =>
      apiClient.resendMessage(topicId, messageId, assistant),
    onSuccess: () => {
      // 重新获取消息列表
      queryClient.invalidateQueries({ queryKey: messagesKeys.list(topicId) })
    },
    onError: (error) => {
      logger.error('Failed to resend message', error)
    }
  })
}
