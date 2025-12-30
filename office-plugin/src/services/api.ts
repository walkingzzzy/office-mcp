/**
 * Office 插件 API 客户端
 *
 * @deprecated 此文件已拆分为多个专门模块，建议直接从 './api' 导入
 *
 * 新的模块结构:
 * - `./api/client` - HTTP 客户端基础设施
 * - `./api/endpoints/config.api` - 配置和健康检查 API
 * - `./api/endpoints/chat.api` - 聊天流式 API
 * - `./api/endpoints/messages.api` - 消息管理 API
 * - `./api/endpoints/knowledge.api` - 知识库 API
 * - `./api/endpoints/mcp.api` - MCP 服务器和工具 API
 * - `./api/endpoints/assistants.api` - 助手配置 API
 * - `./api/endpoints/conversations.api` - 对话管理 API
 *
 * 示例:
 * ```typescript
 * // 旧方式（仍然有效）
 * import { apiClient } from './services/api'
 * const messages = await apiClient.getMessages(topicId)
 *
 * // 新方式（推荐）- 使用专门的端点模块
 * import { messagesApi } from './services/api'
 * const messages = await messagesApi.getMessages(topicId)
 *
 * // 或导入所有端点
 * import { configApi, messagesApi, knowledgeApi, mcpApi, assistantsApi, conversationsApi } from './services/api'
 * ```
 */

// 为了保持向后兼容性，重导出所有内容
export * from './api'
export { apiClient as default } from './api/index'
