/**
 * Chat Hooks 导出
 */

export type { TrimContextResult,UseChatContextReturn } from './useChatContext'
export { useChatContext } from './useChatContext'
export type { UseChatMessagesReturn } from './useChatMessages'
export { useChatMessages } from './useChatMessages'
export type { UseChatPanelsReturn } from './useChatPanels'
export { useChatPanels } from './useChatPanels'
export type { UseChatStateReturn } from './useChatState'
export { useChatState } from './useChatState'
export type {
  DocumentContextResult,
  PromptBuildResult,
  UseDocumentContextOptions,
  UseDocumentContextReturn} from './useDocumentContext'
export { useDocumentContext } from './useDocumentContext'
export type {
  StreamingCallbacks as FunctionCallingCallbacks,
  StreamingConfig as FunctionCallingConfig,
  SendMessageOptions as FunctionCallingSendOptions,
  UseFunctionCallingReturn} from './useFunctionCalling'
export { useFunctionCalling } from './useFunctionCalling'
export type { OfficeApp,UseOfficeContextReturn } from './useOfficeContext'
export { useOfficeContext } from './useOfficeContext'
export type {
  SendMessageOptions,
  StreamingCallbacks,
  StreamingConfig,
  UseStreamingResponseReturn} from './useStreamingResponse'
export { useStreamingResponse } from './useStreamingResponse'

// P6 修复：新增状态管理 Hooks
export type { ChatMultiTurnStateReturn, TaskPlanExecutionState, PreviewState } from './useChatMultiTurnState'
export { useChatMultiTurnState } from './useChatMultiTurnState'
export type { ChatInputStateReturn } from './useChatInputState'
export { useChatInputState } from './useChatInputState'
export type { ChatUIStateReturn } from './useChatUIState'
export { useChatUIState } from './useChatUIState'
