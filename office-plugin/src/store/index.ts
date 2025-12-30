/**
 * Store 统一导出入口
 * 
 * 管理所有 Zustand Store 的导出
 * 
 * @created 2025-12-30 - P1-3 Store 合并优化
 * 
 * Store 结构:
 * - appStore: 应用状态（文档上下文 + 待执行操作）
 * - configStore: 远程配置状态
 * - localConfigStore: 本地配置状态
 * - themeStore: 主题状态
 * - conversationStore: 对话列表状态
 * - multiTurnStore: 多轮对话会话状态
 */

// === 合并后的 Store ===
export { useAppStore } from './appStore'
export type { TableInfo, PendingOperation, PendingPlan, OperationResult } from './appStore'
export {
  selectTableCount,
  selectHasTables,
  selectTables,
  selectPendingOperationCount,
  selectTotalEstimatedTime,
  selectHighRiskOperationCount,
  selectHasPendingPlans,
  selectAllPendingPlans
} from './appStore'

// === 配置 Store ===
export { useConfigStore } from './configStore'
export { useLocalConfigStore } from './localConfigStore'

// === 主题 Store ===
export { useThemeStore, themeUtils } from './themeStore'
export type { Theme } from './themeStore'

// === 对话 Store ===
export { useConversationStore } from './conversationStore'
export { useMultiTurnStore } from './multiTurnStore'
export {
  selectCurrentSession,
  selectCurrentTaskPlan,
  selectCurrentStep,
  selectMultiTurnEnabled,
  selectLatestReviewResult,
  selectLatestTaskPlan,
  selectContextSnapshots,
  selectLatestReviewContextText
} from './multiTurnStore'
export type { ConversationContextSnapshot } from './multiTurnStore'

// === 兼容性导出已移除 ===
// useDocumentContextStore 和 usePendingOperationsStore 已合并到 useAppStore
// 请使用 useAppStore 替代

