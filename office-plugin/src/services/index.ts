/**
 * Services 统一导出入口
 * 
 * 提供所有服务模块的统一访问点
 * 
 * @created 2025-12-30 - P1-4 Services 目录优化
 * 
 * 服务分类:
 * - API: 网络请求和 API 调用
 * - AI: AI 对话和工具执行
 * - Office: Office 文档操作
 * - Storage: 数据存储和缓存
 * - Config: 配置管理
 */

// ==================== API 服务 ====================
export * from './api'
export { default as apiClient } from './api'

// ==================== AI 服务 ====================
export { aiService } from './ai'
export { default as LocalAIClient } from './ai/LocalAIClient'
export { RAGEnhancedAIClient } from './ai/RAGEnhancedAIClient'
export { FunctionCallHandler } from './ai/FunctionCallHandler'
export { McpToolExecutor } from './ai/McpToolExecutor'
export { OrchestrationEngine } from './ai/OrchestrationEngine'
export { ResponseAnalyzer } from './ai/ResponseAnalyzer'
export { DynamicSystemPromptGenerator } from './ai/DynamicSystemPromptGenerator'
export { DocumentContextExtractor } from './ai/DocumentContextExtractor'
export { DocumentContextProvider } from './ai/DocumentContextProvider'
export { streamHandler, StreamHandler } from './ai/streamHandler'

// ==================== 对话服务 ====================
export { conversationService } from './conversation'
export type { Conversation } from './conversation'

// AI 对话子模块
export {
  ConversationPhase,
  createConversationState,
  canTransitionTo
} from './ai/conversation'
export type {
  MultiTurnConversationState,
  TaskPlan,
  TaskStep,
  ClarificationQuestion,
  UserPreferences
} from './ai/conversation'

// ==================== Office 服务 ====================
// 适配器
export { adapterRegistry } from './adapters'
export { WordAdapter } from './adapters/WordAdapter'
export { ExcelAdapter } from './adapters/ExcelAdapter'
export { PowerPointAdapter } from './adapters/PowerPointAdapter'

// Word 服务
export { WordService, wordService } from './WordService'

// 文档解析
export { DocumentParser } from './DocumentParser'
export { BinaryDocumentAdapter } from './BinaryDocumentAdapter'

// 工具执行
export { OfficeToolExecutor } from './OfficeToolExecutor'
export { UndoManager } from './UndoManager'

// ==================== 工具服务 ====================
export * from './tools'

// ==================== 存储服务 ====================
export { secureStorage } from './storage'

// ==================== 缓存服务 ====================
export { configCache } from './cache/ConfigCache'

// ==================== 配置服务 ====================
export { configManager } from './config'
export { localConfigManager } from './config/LocalConfigManager'
export type { AIProviderConfig, ModelConfig, LocalConfig } from './config/LocalConfigManager'

// ==================== 知识库服务 ====================
export { knowledgeManager } from './knowledge'
export { ragService } from './knowledge/RAGService'
export { HttpConnector } from './knowledge/HttpConnector'

// ==================== 错误处理 ====================
export { globalErrorHandler } from './errors/GlobalErrorHandler'

// ==================== MCP 服务 ====================
export { mcpCommandPoller } from './McpCommandPoller'

// ==================== 附件服务 ====================
export { AttachmentStore } from './AttachmentStore'
