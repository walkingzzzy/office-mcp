/**
 * Chat Utilities 导出
 */

export type { TrimContextResult } from './contextTrimmer'
export { trimContext } from './contextTrimmer'
export {
  buildAssistantMessage,
  buildErrorMessage,
  buildUserMessage} from './messageBuilder'

// P7 修复：从 ChatInterface.tsx 提取的工具函数
export {
  trimContext as trimContextV2,
  isAskingAboutUploadedFile,
  isSimpleGreetingOrChat,
  extractTextFromBlocks
} from './messageUtils'
export type { TrimContextResult as TrimContextResultV2 } from './messageUtils'
