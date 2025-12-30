/**
 * Assistants API - 助手配置管理接口
 * 
 * @updated 2025-12-29 - 添加严格类型定义 (修复 P1)
 */

import { apiClient } from '../client'
import type {
  Assistant,
  AssistantModel,
  AssistantSettings,
  AssistantUpdateParams
} from '../../../types/api'

export const assistantsApi = {
  /**
   * 获取所有助手
   */
  async getAssistants(): Promise<Assistant[]> {
    const response = await apiClient.get<{ assistants: Assistant[] }>('/api/assistants')
    return response.assistants
  },

  /**
   * 获取指定助手详情
   */
  async getAssistant(assistantId: string): Promise<Assistant> {
    const response = await apiClient.get<{ assistant: Assistant }>(`/api/assistants/${assistantId}`)
    return response.assistant
  },

  /**
   * 获取默认助手
   */
  async getDefaultAssistant(): Promise<Assistant> {
    const response = await apiClient.get<{ assistant: Assistant }>('/api/assistants/default/info')
    return response.assistant
  },

  /**
   * 获取助手的模型配置
   */
  async getAssistantModel(assistantId: string): Promise<AssistantModel> {
    const response = await apiClient.get<{ model: AssistantModel }>(`/api/assistants/${assistantId}/model`)
    return response.model
  },

  /**
   * 获取助手的设置
   */
  async getAssistantSettings(assistantId: string): Promise<AssistantSettings> {
    const response = await apiClient.get<{ settings: AssistantSettings }>(`/api/assistants/${assistantId}/settings`)
    return response.settings
  },

  /**
   * 获取助手关联的知识库
   */
  async getAssistantKnowledgeBases(assistantId: string): Promise<string[]> {
    const response = await apiClient.get<{ knowledgeBases: string[] }>(
      `/api/assistants/${assistantId}/knowledge-bases`
    )
    return response.knowledgeBases
  },

  /**
   * 获取助手关联的 MCP 工具
   */
  async getAssistantMCPTools(assistantId: string): Promise<string[]> {
    const response = await apiClient.get<{ mcpTools: string[] }>(
      `/api/assistants/${assistantId}/mcp-tools`
    )
    return response.mcpTools
  },

  /**
   * 更新助手配置
   */
  async updateAssistant(assistantId: string, updates: AssistantUpdateParams): Promise<Assistant> {
    const response = await apiClient.post<{ assistant: Assistant }>(
      `/api/assistants/${assistantId}/update`,
      updates
    )
    return response.assistant
  },
}
