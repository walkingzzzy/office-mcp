/**
 * API Client Facade - 向后兼容的 API 客户端
 *
 * 此类提供与旧 API 客户端相同的接口，但内部委托给专门的端点模块
 * 
 * @updated 2025-12-29 - 添加严格类型定义 (修复 P1)
 *
 * @deprecated 推荐直接使用专门的 API 模块：
 * - configApi - 配置和健康检查
 * - messagesApi - 消息管理
 * - knowledgeApi - 知识库管理
 * - mcpApi - MCP 服务器和工具
 * - assistantsApi - 助手配置
 * - conversationsApi - 对话管理
 */

import type {
  HealthCheckResponse,
  OfficePluginConfigResponse,
  ApiMessage,
  Assistant,
  AssistantModel,
  AssistantSettings,
  AssistantUpdateParams,
  Conversation,
  ConversationMessage,
  ConversationUpdateParams,
  KnowledgeBase,
  KnowledgeBaseItem,
  KnowledgeSearchResult,
  McpServer,
  McpTool,
  McpToolArgs,
  McpToolResult,
  McpServerStatusDetail
} from '../../types/api'
import { apiClient as baseClient } from './client'
import { assistantsApi } from './endpoints/assistants.api'
import { configApi } from './endpoints/config.api'
import { conversationsApi } from './endpoints/conversations.api'
import { knowledgeApi } from './endpoints/knowledge.api'
import { mcpApi } from './endpoints/mcp.api'
import { messagesApi } from './endpoints/messages.api'
import Logger from '../../utils/logger'

const logger = new Logger('ApiClientFacade')

/**
 * API Client Facade 类
 * 保持与旧 API 客户端的接口兼容性
 */
export class ApiClient {
  // ==================== 配置和健康检查 ====================

  /**
   * 获取 Office 插件配置
   * @deprecated 推荐使用 configApi.getConfig()
   */
  async getConfig(): Promise<OfficePluginConfigResponse> {
    return configApi.getConfig()
  }

  /**
   * 健康检查
   * @deprecated 推荐使用 configApi.healthCheck()
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    const result = await configApi.healthCheck()
    // 转换为 HealthCheckResponse 格式
    return {
      status: result.status as 'ok' | 'error' | 'degraded',
      timestamp: typeof result.timestamp === 'string' ? parseInt(result.timestamp, 10) : Date.now(),
      version: '1.0.0'
    }
  }

  /**
   * 检查连接状态（简化版健康检查）
   */
  async checkConnection(): Promise<boolean> {
    try {
      const health = await this.checkHealth()
      return health.status === 'ok'
    } catch (error) {
      logger.warn('Connection check failed', { error })
      return false
    }
  }

  /**
   * 更新 API 基础 URL
   */
  setBaseUrl(baseUrl: string): void {
    baseClient.setConfig({ baseUrl })
  }

  /**
   * 获取当前配置
   */
  getConfig_() {
    return baseClient
  }

  // ==================== 消息管理 API ====================

  /**
   * 获取指定对话的所有消息
   * @deprecated 推荐使用 messagesApi.getMessages()
   */
  async getMessages(topicId: string): Promise<ApiMessage[]> {
    return messagesApi.getMessages(topicId)
  }

  /**
   * 删除消息
   * @deprecated 推荐使用 messagesApi.deleteMessage()
   */
  async deleteMessage(topicId: string, messageId: string): Promise<void> {
    return messagesApi.deleteMessage(topicId, messageId)
  }

  /**
   * 重新生成 AI 消息
   * @deprecated 推荐使用 messagesApi.regenerateMessage()
   */
  async regenerateMessage(topicId: string, messageId: string, assistant: Assistant): Promise<void> {
    return messagesApi.regenerateMessage(topicId, messageId, assistant)
  }

  /**
   * 编辑用户消息
   * @deprecated 推荐使用 messagesApi.editMessage()
   */
  async editMessage(topicId: string, messageId: string, newContent: string): Promise<void> {
    return messagesApi.editMessage(topicId, messageId, newContent)
  }

  /**
   * 重新发送用户消息
   * @deprecated 推荐使用 messagesApi.resendMessage()
   */
  async resendMessage(topicId: string, messageId: string, assistant: Assistant): Promise<void> {
    return messagesApi.resendMessage(topicId, messageId, assistant)
  }

  // ==================== 知识库 API ====================

  /**
   * 获取所有知识库
   * @deprecated 推荐使用 knowledgeApi.getKnowledgeBases()
   */
  async getKnowledgeBases(): Promise<KnowledgeBase[]> {
    return knowledgeApi.getKnowledgeBases()
  }

  /**
   * 获取指定知识库详情
   * @deprecated 推荐使用 knowledgeApi.getKnowledgeBase()
   */
  async getKnowledgeBase(baseId: string): Promise<KnowledgeBase> {
    return knowledgeApi.getKnowledgeBase(baseId)
  }

  /**
   * 获取知识库的所有项目
   * @deprecated 推荐使用 knowledgeApi.getKnowledgeBaseItems()
   */
  async getKnowledgeBaseItems(baseId: string): Promise<KnowledgeBaseItem[]> {
    return knowledgeApi.getKnowledgeBaseItems(baseId)
  }

  /**
   * 搜索知识库
   * @deprecated 推荐使用 knowledgeApi.searchKnowledge()
   */
  async searchKnowledge(query: string, baseIds: string[], limit = 10): Promise<KnowledgeSearchResult[]> {
    return knowledgeApi.searchKnowledge(query, baseIds, limit)
  }

  /**
   * 向知识库添加文件
   * @deprecated 推荐使用 knowledgeApi.addFileToKnowledgeBase()
   */
  async addFileToKnowledgeBase(baseId: string, filePath: string): Promise<KnowledgeBaseItem> {
    return knowledgeApi.addFileToKnowledgeBase(baseId, filePath)
  }

  /**
   * 向知识库添加 URL
   * @deprecated 推荐使用 knowledgeApi.addUrlToKnowledgeBase()
   */
  async addUrlToKnowledgeBase(baseId: string, url: string): Promise<void> {
    return knowledgeApi.addUrlToKnowledgeBase(baseId, url)
  }

  /**
   * 从知识库删除项目
   * @deprecated 推荐使用 knowledgeApi.deleteKnowledgeBaseItem()
   */
  async deleteKnowledgeBaseItem(baseId: string, itemId: string): Promise<void> {
    return knowledgeApi.deleteKnowledgeBaseItem(baseId, itemId)
  }

  // ==================== MCP API ====================

  /**
   * 获取所有 MCP 服务器
   * @deprecated 推荐使用 mcpApi.getMCPServers()
   */
  async getMCPServers(): Promise<McpServer[]> {
    return mcpApi.getMCPServers()
  }

  /**
   * 获取激活的 MCP 服务器
   * @deprecated 推荐使用 mcpApi.getActiveMCPServers()
   */
  async getActiveMCPServers(): Promise<McpServer[]> {
    return mcpApi.getActiveMCPServers()
  }

  /**
   * 获取指定 MCP 服务器详情
   * @deprecated 推荐使用 mcpApi.getMCPServer()
   */
  async getMCPServer(serverId: string): Promise<McpServer> {
    return mcpApi.getMCPServer(serverId)
  }

  /**
   * 获取 MCP 服务器的所有工具
   * @deprecated 推荐使用 mcpApi.getMCPServerTools()
   */
  async getMCPServerTools(serverId: string): Promise<McpTool[]> {
    return mcpApi.getMCPServerTools(serverId)
  }

  /**
   * 调用 MCP 工具
   * @deprecated 推荐使用 mcpApi.callMCPTool()
   */
  async callMCPTool(serverId: string, toolName: string, params: McpToolArgs): Promise<McpToolResult> {
    return mcpApi.callMCPTool(serverId, toolName, params)
  }

  /**
   * 激活 MCP 服务器
   * @deprecated 推荐使用 mcpApi.activateMCPServer()
   */
  async activateMCPServer(serverId: string): Promise<void> {
    return mcpApi.activateMCPServer(serverId)
  }

  /**
   * 停用 MCP 服务器
   * @deprecated 推荐使用 mcpApi.deactivateMCPServer()
   */
  async deactivateMCPServer(serverId: string): Promise<void> {
    return mcpApi.deactivateMCPServer(serverId)
  }

  /**
   * 获取 MCP 服务器状态
   * @deprecated 推荐使用 mcpApi.getMCPServerStatus()
   */
  async getMCPServerStatus(serverId: string): Promise<McpServerStatusDetail> {
    return mcpApi.getMCPServerStatus(serverId)
  }

  // ==================== 助手配置 API ====================

  /**
   * 获取所有助手
   * @deprecated 推荐使用 assistantsApi.getAssistants()
   */
  async getAssistants(): Promise<Assistant[]> {
    return assistantsApi.getAssistants()
  }

  /**
   * 获取指定助手详情
   * @deprecated 推荐使用 assistantsApi.getAssistant()
   */
  async getAssistant(assistantId: string): Promise<Assistant> {
    return assistantsApi.getAssistant(assistantId)
  }

  /**
   * 获取默认助手
   * @deprecated 推荐使用 assistantsApi.getDefaultAssistant()
   */
  async getDefaultAssistant(): Promise<Assistant> {
    return assistantsApi.getDefaultAssistant()
  }

  /**
   * 获取助手的模型配置
   * @deprecated 推荐使用 assistantsApi.getAssistantModel()
   */
  async getAssistantModel(assistantId: string): Promise<AssistantModel> {
    return assistantsApi.getAssistantModel(assistantId)
  }

  /**
   * 获取助手的设置
   * @deprecated 推荐使用 assistantsApi.getAssistantSettings()
   */
  async getAssistantSettings(assistantId: string): Promise<AssistantSettings> {
    return assistantsApi.getAssistantSettings(assistantId)
  }

  /**
   * 获取助手关联的知识库
   * @deprecated 推荐使用 assistantsApi.getAssistantKnowledgeBases()
   */
  async getAssistantKnowledgeBases(assistantId: string): Promise<string[]> {
    return assistantsApi.getAssistantKnowledgeBases(assistantId)
  }

  /**
   * 获取助手关联的 MCP 工具
   * @deprecated 推荐使用 assistantsApi.getAssistantMCPTools()
   */
  async getAssistantMCPTools(assistantId: string): Promise<string[]> {
    return assistantsApi.getAssistantMCPTools(assistantId)
  }

  /**
   * 更新助手配置
   * @deprecated 推荐使用 assistantsApi.updateAssistant()
   */
  async updateAssistant(assistantId: string, updates: AssistantUpdateParams): Promise<Assistant> {
    return assistantsApi.updateAssistant(assistantId, updates)
  }

  // ==================== 对话管理 API ====================

  /**
   * 获取所有对话
   * @deprecated 推荐使用 conversationsApi.getConversations()
   */
  async getConversations(): Promise<Conversation[]> {
    return conversationsApi.getConversations()
  }

  /**
   * 获取指定对话详情
   * @deprecated 推荐使用 conversationsApi.getConversation()
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    return conversationsApi.getConversation(conversationId)
  }

  /**
   * 创建新对话
   * @deprecated 推荐使用 conversationsApi.createConversation()
   */
  async createConversation(name?: string, assistantId?: string): Promise<Conversation> {
    return conversationsApi.createConversation(name, assistantId)
  }

  /**
   * 更新对话信息
   * @deprecated 推荐使用 conversationsApi.updateConversation()
   */
  async updateConversation(conversationId: string, updates: ConversationUpdateParams): Promise<Conversation> {
    return conversationsApi.updateConversation(conversationId, updates)
  }

  /**
   * 删除对话
   * @deprecated 推荐使用 conversationsApi.deleteConversation()
   */
  async deleteConversation(conversationId: string): Promise<void> {
    return conversationsApi.deleteConversation(conversationId)
  }

  /**
   * 清空对话消息
   * @deprecated 推荐使用 conversationsApi.clearConversation()
   */
  async clearConversation(conversationId: string): Promise<void> {
    return conversationsApi.clearConversation(conversationId)
  }

  /**
   * 获取对话的所有消息
   * @deprecated 推荐使用 conversationsApi.getConversationMessages()
   */
  async getConversationMessages(conversationId: string): Promise<ConversationMessage[]> {
    return conversationsApi.getConversationMessages(conversationId)
  }
}

/**
 * 导出单例实例（用于向后兼容）
 */
export const apiClient = new ApiClient()

/**
 * 导出默认实例
 */
export default apiClient
