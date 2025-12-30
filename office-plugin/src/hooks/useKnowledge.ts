/**
 * Knowledge Base Hooks - 知识库相关 Hooks
 * 使用 React Query 管理知识库数据
 * 
 * @updated 2025-12-29 - 统一错误处理 (修复 P2)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../services/api/ApiClientFacade'
import { ErrorHandler, ErrorCode, OfficePluginError, ErrorSeverity } from '../shared/errors'
import Logger from '../utils/logger'

const logger = new Logger('useKnowledge')

/**
 * 查询键工厂
 */
const knowledgeKeys = {
  all: ['knowledge'] as const,
  bases: () => [...knowledgeKeys.all, 'bases'] as const,
  base: (baseId: string) => [...knowledgeKeys.all, 'base', baseId] as const,
  items: (baseId: string) => [...knowledgeKeys.all, 'items', baseId] as const,
  search: (query: string, baseIds: string[]) => [...knowledgeKeys.all, 'search', query, baseIds] as const
}

/**
 * 获取所有知识库
 */
export function useKnowledgeBases() {
  return useQuery({
    queryKey: knowledgeKeys.bases(),
    queryFn: () => apiClient.getKnowledgeBases(),
    staleTime: 5 * 60 * 1000 // 5 分钟后视为过时
  })
}

/**
 * 获取单个知识库详情
 */
export function useKnowledgeBase(baseId: string, enabled = true) {
  return useQuery({
    queryKey: knowledgeKeys.base(baseId),
    queryFn: () => apiClient.getKnowledgeBase(baseId),
    enabled: !!baseId && enabled,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * 获取知识库项目
 */
export function useKnowledgeBaseItems(baseId: string, enabled = true) {
  return useQuery({
    queryKey: knowledgeKeys.items(baseId),
    queryFn: () => apiClient.getKnowledgeBaseItems(baseId),
    enabled: !!baseId && enabled,
    staleTime: 2 * 60 * 1000 // 2 分钟后视为过时
  })
}

/**
 * 搜索知识库
 */
export function useKnowledgeSearch() {
  return useMutation({
    mutationFn: ({ query, baseIds, limit = 10 }: { query: string; baseIds: string[]; limit?: number }) =>
      apiClient.searchKnowledge(query, baseIds, limit),
    onError: (error) => {
      const pluginError = new OfficePluginError(
        '搜索知识库失败',
        ErrorCode.API_ERROR,
        ErrorSeverity.WARNING,
        error instanceof Error ? error : undefined
      )
      ErrorHandler.log(pluginError)
    }
  })
}

/**
 * 添加文件到知识库
 */
export function useAddFileToKnowledgeBase(baseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (filePath: string) => apiClient.addFileToKnowledgeBase(baseId, filePath),
    onSuccess: () => {
      // 重新获取知识库项目
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.items(baseId) })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.base(baseId) })
    },
    onError: (error) => {
      const pluginError = new OfficePluginError(
        '添加文件到知识库失败',
        ErrorCode.OPERATION_FAILED,
        ErrorSeverity.ERROR,
        error instanceof Error ? error : undefined
      )
      ErrorHandler.showUserError(pluginError)
    }
  })
}

/**
 * 添加 URL 到知识库
 */
export function useAddUrlToKnowledgeBase(baseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (url: string) => apiClient.addUrlToKnowledgeBase(baseId, url),
    onSuccess: () => {
      // 重新获取知识库项目
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.items(baseId) })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.base(baseId) })
    },
    onError: (error) => {
      const pluginError = new OfficePluginError(
        '添加 URL 到知识库失败',
        ErrorCode.OPERATION_FAILED,
        ErrorSeverity.ERROR,
        error instanceof Error ? error : undefined
      )
      ErrorHandler.showUserError(pluginError)
    }
  })
}

/**
 * 从知识库删除项目
 */
export function useDeleteKnowledgeBaseItem(baseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: string) => apiClient.deleteKnowledgeBaseItem(baseId, itemId),
    onSuccess: () => {
      // 重新获取知识库项目
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.items(baseId) })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.base(baseId) })
    },
    onError: (error) => {
      const pluginError = new OfficePluginError(
        '删除知识库项目失败',
        ErrorCode.OPERATION_FAILED,
        ErrorSeverity.ERROR,
        error instanceof Error ? error : undefined
      )
      ErrorHandler.showUserError(pluginError)
    }
  })
}
