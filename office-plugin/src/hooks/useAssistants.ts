/**
 * Assistants Hooks - 助手配置相关 Hooks
 * 使用 React Query 管理助手配置
 * 
 * @updated 2025-12-29 - 添加严格类型定义 (修复 P1)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../services/api/ApiClientFacade'
import type { AssistantUpdateParams } from '../types/api'
import Logger from '../utils/logger'

const logger = new Logger('useAssistants')

/**
 * 查询键工厂
 */
const assistantsKeys = {
  all: ['assistants'] as const,
  list: () => [...assistantsKeys.all, 'list'] as const,
  default: () => [...assistantsKeys.all, 'default'] as const,
  detail: (assistantId: string) => [...assistantsKeys.all, 'detail', assistantId] as const,
  model: (assistantId: string) => [...assistantsKeys.all, 'model', assistantId] as const,
  settings: (assistantId: string) => [...assistantsKeys.all, 'settings', assistantId] as const,
  knowledgeBases: (assistantId: string) => [...assistantsKeys.all, 'knowledge-bases', assistantId] as const,
  mcpTools: (assistantId: string) => [...assistantsKeys.all, 'mcp-tools', assistantId] as const
}

/**
 * 获取所有助手
 */
export function useAssistants() {
  return useQuery({
    queryKey: assistantsKeys.list(),
    queryFn: () => apiClient.getAssistants(),
    staleTime: 5 * 60 * 1000 // 5 分钟后视为过时
  })
}

/**
 * 获取单个助手详情
 */
export function useAssistant(assistantId: string, enabled = true) {
  return useQuery({
    queryKey: assistantsKeys.detail(assistantId),
    queryFn: () => apiClient.getAssistant(assistantId),
    enabled: !!assistantId && enabled,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * 获取默认助手
 */
export function useDefaultAssistant() {
  return useQuery({
    queryKey: assistantsKeys.default(),
    queryFn: () => apiClient.getDefaultAssistant(),
    staleTime: 5 * 60 * 1000
  })
}

/**
 * 获取助手模型配置
 */
export function useAssistantModel(assistantId: string, enabled = true) {
  return useQuery({
    queryKey: assistantsKeys.model(assistantId),
    queryFn: () => apiClient.getAssistantModel(assistantId),
    enabled: !!assistantId && enabled,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * 获取助手设置
 */
export function useAssistantSettings(assistantId: string, enabled = true) {
  return useQuery({
    queryKey: assistantsKeys.settings(assistantId),
    queryFn: () => apiClient.getAssistantSettings(assistantId),
    enabled: !!assistantId && enabled,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * 获取助手关联的知识库
 */
export function useAssistantKnowledgeBases(assistantId: string, enabled = true) {
  return useQuery({
    queryKey: assistantsKeys.knowledgeBases(assistantId),
    queryFn: () => apiClient.getAssistantKnowledgeBases(assistantId),
    enabled: !!assistantId && enabled,
    staleTime: 2 * 60 * 1000 // 2 分钟后视为过时
  })
}

/**
 * 获取助手关联的 MCP 工具
 */
export function useAssistantMCPTools(assistantId: string, enabled = true) {
  return useQuery({
    queryKey: assistantsKeys.mcpTools(assistantId),
    queryFn: () => apiClient.getAssistantMCPTools(assistantId),
    enabled: !!assistantId && enabled,
    staleTime: 2 * 60 * 1000
  })
}

/**
 * 更新助手配置
 */
export function useUpdateAssistant(assistantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: AssistantUpdateParams) => apiClient.updateAssistant(assistantId, updates),
    onSuccess: () => {
      // 重新获取助手相关数据
      queryClient.invalidateQueries({ queryKey: assistantsKeys.list() })
      queryClient.invalidateQueries({ queryKey: assistantsKeys.detail(assistantId) })
      queryClient.invalidateQueries({ queryKey: assistantsKeys.model(assistantId) })
      queryClient.invalidateQueries({ queryKey: assistantsKeys.settings(assistantId) })
      queryClient.invalidateQueries({ queryKey: assistantsKeys.knowledgeBases(assistantId) })
      queryClient.invalidateQueries({ queryKey: assistantsKeys.mcpTools(assistantId) })
    },
    onError: (error) => {
      logger.error('Failed to update assistant', error)
    }
  })
}
