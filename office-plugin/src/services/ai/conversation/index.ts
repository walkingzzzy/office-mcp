/**
 * 多轮对话模块统一导出
 * 
 * 提供对话状态管理、澄清引擎、任务分解、分步执行等核心能力
 */

// ==================== 对话状态 ====================
export {
  // 枚举
  ConversationPhase,
  // 类型
  type TaskStep,
  type TaskStepStatus,
  type TaskPlan,
  type TaskPlanStatus,
  type ClarificationQuestion,
  type ClarificationOption,
  type UserPreferences,
  type MultiTurnConversationState,
  // 工厂函数
  createConversationState,
  createTaskStep,
  createTaskPlan,
  createClarificationQuestion,
  // 工具函数
  canTransitionTo,
  getPhaseName
} from './ConversationState'

// ==================== 澄清引擎 ====================
export {
  ClarificationEngine,
  clarificationEngine
} from './ClarificationEngine'

// ==================== 任务分解器 ====================
export {
  TaskDecomposer,
  taskDecomposer
} from './TaskDecomposer'

// ==================== 分步执行器 ====================
export {
  StepExecutor,
  createStepExecutor,
  type StepExecutionResult,
  type ExecutionProgressCallback,
  type ToolExecutor,
  type RecordedOperation,
  type StepExecutorOptions
} from './StepExecutor'

// ==================== 预览生成器 ====================
export {
  PreviewGenerator,
  previewGenerator,
  type PreviewType,
  type RiskLevel,
  type TextDiff,
  type FormatChange,
  type OperationPreview,
  type PlanPreview
} from './PreviewGenerator'

// ==================== 🆕 审查上下文提取器 ====================
export {
  ReviewContextExtractor,
  reviewContextExtractor,
  type ReviewIssue,
  type ReviewResult,
  type ContextExtractionResult
} from './ReviewContextExtractor'
