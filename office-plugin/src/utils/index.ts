/**
 * 工具函数统一导出入口
 *
 * 整合 src/utils/ 下的所有工具函数
 *
 * @created 2025-12-30 - P2-6 工具函数整合优化
 * @updated 2025-12-31 - 合并 src/lib/utils.ts 中的 cn() 函数
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// === CSS 类名工具 ===
/**
 * 合并 Tailwind CSS 类名
 * 使用 clsx 处理条件类名，使用 tailwind-merge 合并冲突的 Tailwind 类
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// === Logger ===
export { default as Logger, logger } from './logger'
export type { LogLevel, LogData, LogEntry } from './logger'

// === Markdown 渲染 ===
export {
  createMarkdownRenderer,
  markdownRenderer,
  renderMarkdown,
  renderMarkdownInline,
  extractTextFromHTML,
  hasMarkdownSyntax,
  extractCodeBlocks,
  highlightCode,
  getSupportedLanguages,
  detectLanguage,
  sanitizeHTML
} from './markdown'
export type { MarkdownRendererOptions } from './markdown'

// === 消息块解析 ===
export {
  parseMessageBlocks,
  updateMessageBlocksFromChunk,
  finalizeMessageBlocks,
  createErrorBlock,
  getMainTextContent,
  getThinkingContent,
  hasBlockType
} from './messageBlocks'

// === 意图检测 ===
export { 
  UserIntent,
  detectUserIntent,
  shouldIncludeDocumentContext,
  getIntentDisplayText
} from './intentDetection'

// === AI 响应意图检测 ===
export {
  detectResponseIntent,
  isCommandMessage,
  isEditMessage,
  isQueryMessage,
  getIntentAnalysisReport
} from './responseIntentDetection'

// === Diff 工具 ===
export {
  calculateDiff,
  mergeSimilarDiffs,
  filterTinyDiffs,
  groupDiffsByType,
  applyDiffsToText,
  calculateDiffStatistics,
  formatDiffForDisplay
} from './diffUtils'

// === 模型过滤 ===
export {
  isEmbeddingModel,
  isRerankModel,
  isImageGenerationModel,
  isSpeechModel,
  isChatModel,
  filterChatModels,
  validateChatModel
} from './modelFilters'

// === 主题工具 ===
export {
  getOfficeTheme,
  getSystemThemePreference,
  getFluentTheme,
  onThemeChange,
  setDocumentTheme
} from './themeUtils'
export type { ThemeMode, OfficeTheme } from './themeUtils'

// === Office 版本信息 ===
export {
  getOfficeVersionInfo,
  formatOfficeVersionInfo,
  supportsTrackChanges,
  logOfficeVersionInfo
} from './officeVersionInfo'
export type { OfficeVersionInfo } from './officeVersionInfo'

// === 懒加载 ===
export {
  default as lazyLoad,
  withSuspense,
  preloadComponents,
  preloadOnHover
} from './lazyLoad'

