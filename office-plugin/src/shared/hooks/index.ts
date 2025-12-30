/**
 * Shared Hooks - 导出所有共享 Hooks
 * 按照重构方案统一从 shared/hooks 导出
 */

// 从原 hooks 目录重新导出
export { useAssistants } from '../../hooks/useAssistants'
export { useConfig } from '../../hooks/useConfig'
export { useConnection } from '../../hooks/useConnection'
export { useConversations } from '../../hooks/useConversations'
export { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
export { useMessageOperations } from '../../hooks/useMessageOperations'
export { useMessages } from '../../hooks/useMessages'
export { useNetworkStatus } from '../../hooks/useNetworkStatus'

// Knowledge hooks
export {
  useAddFileToKnowledgeBase,
  useAddUrlToKnowledgeBase,
  useDeleteKnowledgeBaseItem,
  useKnowledgeBase,
  useKnowledgeBaseItems,
  useKnowledgeBases,
  useKnowledgeSearch,
} from '../../hooks/useKnowledge'

// MCP hooks
export {
  useActivateMCPServer,
  useActiveMCPServers,
  useCallMCPTool,
  useDeactivateMCPServer,
  useMCPServer,
  useMCPServers,
  useMCPServerStatus,
  useMCPServerTools,
} from '../../hooks/useMCP'
