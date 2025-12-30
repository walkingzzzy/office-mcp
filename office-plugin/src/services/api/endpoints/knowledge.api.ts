/**
 * Knowledge API - 知识库管理接口
 * 
 * @updated 2025-12-29 - 添加严格类型定义 (修复 P1)
 */

import { apiClient } from '../client'
import type {
  KnowledgeBase,
  KnowledgeBaseItem,
  KnowledgeSearchResult
} from '../../../types/api'

export const knowledgeApi = {
  /**
   * 获取所有知识库
   */
  async getKnowledgeBases(): Promise<KnowledgeBase[]> {
    const response = await apiClient.get<{ bases: KnowledgeBase[] }>('/api/knowledge/bases')
    return response.bases
  },

  /**
   * 获取指定知识库详情
   */
  async getKnowledgeBase(baseId: string): Promise<KnowledgeBase> {
    const response = await apiClient.get<{ base: KnowledgeBase }>(`/api/knowledge/bases/${baseId}`)
    return response.base
  },

  /**
   * 获取知识库的所有项目
   */
  async getKnowledgeBaseItems(baseId: string): Promise<KnowledgeBaseItem[]> {
    const response = await apiClient.get<{ items: KnowledgeBaseItem[] }>(`/api/knowledge/bases/${baseId}/items`)
    return response.items
  },

  /**
   * 搜索知识库
   */
  async searchKnowledge(query: string, baseIds: string[], limit = 10): Promise<KnowledgeSearchResult[]> {
    const response = await apiClient.post<{ results: KnowledgeSearchResult[] }>('/api/knowledge/search', {
      query,
      baseIds,
      limit,
    })
    return response.results
  },

  /**
   * 向知识库添加文件
   */
  async addFileToKnowledgeBase(baseId: string, filePath: string): Promise<KnowledgeBaseItem> {
    const response = await apiClient.post<{ file: KnowledgeBaseItem }>(`/api/knowledge/bases/${baseId}/add-file`, {
      filePath,
    })
    return response.file
  },

  /**
   * 向知识库添加 URL
   */
  async addUrlToKnowledgeBase(baseId: string, url: string): Promise<void> {
    await apiClient.post(`/api/knowledge/bases/${baseId}/add-url`, { url })
  },

  /**
   * 从知识库删除项目
   */
  async deleteKnowledgeBaseItem(baseId: string, itemId: string): Promise<void> {
    await apiClient.delete(`/api/knowledge/bases/${baseId}/items/${itemId}`)
  },
}
