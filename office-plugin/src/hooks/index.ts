/**
 * Office 插件 React Hooks 导出
 */

// 配置和连接相关
export { useConfig } from './useConfig'
export { useConnection } from './useConnection'

// 主题管理
export type { UseThemeReturn } from './useTheme'
export { useTheme } from './useTheme'

// 消息管理
export {
  useDeleteMessage,
  useEditMessage,
  useMessages,
  useRegenerateMessage,
  useResendMessage
} from './useMessages'

// 知识库管理
export {
  useAddFileToKnowledgeBase,
  useAddUrlToKnowledgeBase,
  useDeleteKnowledgeBaseItem,
  useKnowledgeBase,
  useKnowledgeBaseItems,
  useKnowledgeBases,
  useKnowledgeSearch} from './useKnowledge'

// MCP 工具管理
export {
  useActivateMCPServer,
  useActiveMCPServers,
  useCallMCPTool,
  useDeactivateMCPServer,
  useMCPServer,
  useMCPServers,
  useMCPServerStatus,
  useMCPServerTools} from './useMCP'

// 助手配置管理
export {
  useAssistant,
  useAssistantKnowledgeBases,
  useAssistantMCPTools,
  useAssistantModel,
  useAssistants,
  useAssistantSettings,
  useDefaultAssistant,
  useUpdateAssistant
} from './useAssistants'

// 对话管理
export {
  useClearConversation,
  useConversation,
  useConversationMessages,
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useUpdateConversation} from './useConversations'

// 本地配置和连接状态
export { useConnectionStatus } from './useConnectionStatus'
export type { ConnectionStatus, UseConnectionStatusOptions } from './useConnectionStatus'

export { useFirstTimeSetup } from './useFirstTimeSetup'
export type { UseFirstTimeSetupReturn } from './useFirstTimeSetup'

export { useRAGChat } from './useRAGChat'
export type { ChatState, UseRAGChatReturn, UseRAGChatOptions } from './useRAGChat'

export { useUnifiedConfig } from './useUnifiedConfig'
