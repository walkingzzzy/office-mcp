/**
 * API Service - 导出 API 客户端和所有端点
 *
 * 推荐使用方式:
 * 1. 新代码: 使用专门的端点模块 (configApi, messagesApi, knowledgeApi, mcpApi, assistantsApi, conversationsApi)
 * 2. 现有代码: 使用 apiClient (向后兼容)
 */

// 导出基础 HTTP 客户端
export * from './client'

// 导出所有端点模块
export * from './endpoints'

// 导出向后兼容的 API 客户端 facade
export { ApiClient, apiClient } from './ApiClientFacade'
export { apiClient as default } from './ApiClientFacade'
