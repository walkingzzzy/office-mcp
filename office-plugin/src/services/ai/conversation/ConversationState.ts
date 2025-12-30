/**
 * 多轮对话状态管理
 * 
 * 支持对话阶段流转、任务分解、澄清对话等核心能力
 * 参考 LangGraph Plan-and-Execute 模式设计
 * 
 * @see https://langchain-ai.github.io/langgraph/tutorials/plan-and-execute/plan-and-execute/
 */

// 从统一的类型定义文件导入 TaskPlan 相关类型
export {
  type TaskStep,
  type TaskStepStatus,
  type TaskPlan,
  type TaskPlanStatus,
  type TaskToolCall,
  type TaskStepResult,
  type RiskLevel,
  type TaskPlanUpdateEvent,
  createTaskPlan as createUnifiedTaskPlan,
  startTaskPlan,
  completeCurrentStep,
  failCurrentStep,
  getTaskPlanProgress,
  getCurrentStep
} from '../../../types/taskPlan'

/**
 * 对话阶段枚举
 * 
 * 状态流转图:
 * INITIAL -> CLARIFYING -> PLANNING -> AWAITING_CONFIRMATION -> EXECUTING -> COMPLETED
 *    |           |            |                |                    |
 *    v           v            v                v                    v
 * (直接执行)  (用户回答)   (用户确认)      (用户取消)          (执行完成)
 */
export enum ConversationPhase {
  /** 初始状态 - 分析用户意图 */
  INITIAL = 'initial',
  /** 意图澄清中 - 等待用户提供更多信息 */
  CLARIFYING = 'clarifying',
  /** 任务规划中 - 分解复杂任务 */
  PLANNING = 'planning',
  /** 等待确认 - 用户确认执行计划 */
  AWAITING_CONFIRMATION = 'awaiting_confirmation',
  /** 执行中 - 逐步执行任务 */
  EXECUTING = 'executing',
  /** 已完成 - 任务完成 */
  COMPLETED = 'completed',
  /** 已暂停 - 用户暂停执行 */
  PAUSED = 'paused',
  /** 已取消 - 用户取消任务 */
  CANCELLED = 'cancelled'
}

// TaskStep, TaskStepStatus, TaskPlan, TaskPlanStatus 现在从 types/taskPlan.ts 导入
// 保留向后兼容的类型别名
import type { TaskStep, TaskPlan } from '../../../types/taskPlan'

/**
 * 澄清问题接口
 */
export interface ClarificationQuestion {
  /** 问题 ID */
  id: string
  /** 问题内容 */
  question: string
  /** 预定义选项 (可选) */
  options?: ClarificationOption[]
  /** 是否必须回答 */
  required: boolean
  /** 是否已回答 */
  answered: boolean
  /** 用户回答 */
  answer?: string
  /** 选择的选项 ID (如果有选项) */
  selectedOptionId?: string
  /** 问题类型 */
  type: 'single_choice' | 'multiple_choice' | 'free_text' | 'yes_no'
  /** 创建时间 */
  createdAt: Date
}

/**
 * 澄清选项
 */
export interface ClarificationOption {
  /** 选项 ID */
  id: string
  /** 选项文本 */
  text: string
  /** 选项图标 (emoji) */
  icon?: string
  /** 选择此选项后推荐的工具 */
  suggestedTools?: string[]
}

/**
 * 用户偏好 (从对话中学习)
 */
export interface UserPreferences {
  /** 整理文档时的默认操作 */
  organizePreference?: 'sort' | 'format' | 'clean' | 'all'
  /** 美化文档时的默认样式 */
  beautifyPreference?: 'professional' | 'casual' | 'academic'
  /** 是否跳过确认步骤 */
  skipConfirmation?: boolean
  /** 偏好的执行模式 */
  executionMode?: 'step_by_step' | 'batch' | 'auto'
  /** 最近使用的工具 */
  recentTools?: string[]
  /** 自定义偏好 */
  custom?: Record<string, any>
}

/**
 * 多轮对话状态接口
 * 
 * 核心状态管理，支持:
 * - 对话阶段流转
 * - 任务分解与执行
 * - 澄清对话
 * - 用户偏好学习
 */
export interface MultiTurnConversationState {
  /** 会话 ID */
  sessionId: string
  /** 当前对话阶段 */
  phase: ConversationPhase
  /** 原始用户意图 (第一条消息) */
  originalIntent: string
  /** 澄清问题列表 */
  clarifications: ClarificationQuestion[]
  /** 任务计划 */
  taskPlan?: TaskPlan
  /** 已执行的步骤 ID 列表 */
  executedSteps: string[]
  /** 对话历史摘要 (用于上下文压缩) */
  contextSummary: string
  /** 用户偏好 */
  userPreferences: UserPreferences
  /** 创建时间 */
  createdAt: Date
  /** 最后更新时间 */
  lastUpdatedAt: Date
  /** 错误信息 (如果有) */
  error?: {
    code: string
    message: string
    recoverable: boolean
  }
}

/**
 * 创建新的对话状态
 */
export function createConversationState(
  sessionId: string,
  originalIntent: string
): MultiTurnConversationState {
  const now = new Date()
  return {
    sessionId,
    phase: ConversationPhase.INITIAL,
    originalIntent,
    clarifications: [],
    executedSteps: [],
    contextSummary: '',
    userPreferences: {},
    createdAt: now,
    lastUpdatedAt: now
  }
}

/**
 * 创建任务步骤
 */
export function createTaskStep(
  index: number,
  description: string,
  toolName: string,
  toolArgs: Record<string, any>,
  options?: Partial<TaskStep>
): TaskStep {
  return {
    id: `step-${Date.now()}-${index}`,
    index,
    description,
    toolName,
    toolArgs,
    status: 'pending',
    canUndo: true,
    ...options
  }
}

/**
 * 创建任务计划（本地版本，使用 ConversationState 特有的参数格式）
 * 注意：推荐使用 createUnifiedTaskPlan 从 types/taskPlan.ts 导入
 * @deprecated 请使用 createUnifiedTaskPlan
 */
export function createTaskPlan(
  title: string,
  description: string,
  steps: Omit<TaskStep, 'id' | 'index' | 'status' | 'canUndo'>[]
): TaskPlan {
  const now = new Date().toISOString()
  return {
    id: `plan-${Date.now()}`,
    title,
    description,
    steps: steps.map((step, index) => {
      const {
        description: stepDescription,
        toolName,
        toolArgs,
        ...restFields
      } = step as typeof step & Record<string, any>

      return createTaskStep(
        index + 1,
        stepDescription,
        toolName || '',
        toolArgs || {},
        {
          ...restFields,
          estimatedTime: step.estimatedTime,
          riskLevel: step.riskLevel,
          needsConfirmation: step.needsConfirmation
        }
      )
    }),
    currentStepIndex: 0,
    createdAt: now,
    updatedAt: now,
    status: 'draft'
  }
}

/**
 * 创建澄清问题
 */
export function createClarificationQuestion(
  question: string,
  type: ClarificationQuestion['type'] = 'free_text',
  options?: ClarificationOption[]
): ClarificationQuestion {
  return {
    id: `clarify-${Date.now()}`,
    question,
    type,
    options,
    required: true,
    answered: false,
    createdAt: new Date()
  }
}

/**
 * 检查是否可以进入下一阶段
 */
export function canTransitionTo(
  currentPhase: ConversationPhase,
  targetPhase: ConversationPhase
): boolean {
  const validTransitions: Record<ConversationPhase, ConversationPhase[]> = {
    [ConversationPhase.INITIAL]: [
      ConversationPhase.CLARIFYING,
      ConversationPhase.PLANNING,
      ConversationPhase.EXECUTING,
      ConversationPhase.COMPLETED
    ],
    [ConversationPhase.CLARIFYING]: [
      ConversationPhase.INITIAL,
      ConversationPhase.PLANNING,
      ConversationPhase.EXECUTING,
      ConversationPhase.CANCELLED
    ],
    [ConversationPhase.PLANNING]: [
      ConversationPhase.AWAITING_CONFIRMATION,
      ConversationPhase.CANCELLED
    ],
    [ConversationPhase.AWAITING_CONFIRMATION]: [
      ConversationPhase.EXECUTING,
      ConversationPhase.PLANNING,
      ConversationPhase.CANCELLED
    ],
    [ConversationPhase.EXECUTING]: [
      ConversationPhase.COMPLETED,
      ConversationPhase.PAUSED,
      ConversationPhase.CANCELLED,
      ConversationPhase.PLANNING  // Re-plan
    ],
    [ConversationPhase.PAUSED]: [
      ConversationPhase.EXECUTING,
      ConversationPhase.CANCELLED
    ],
    [ConversationPhase.COMPLETED]: [],
    [ConversationPhase.CANCELLED]: []
  }

  return validTransitions[currentPhase]?.includes(targetPhase) ?? false
}

/**
 * 获取阶段的中文名称
 */
export function getPhaseName(phase: ConversationPhase): string {
  const names: Record<ConversationPhase, string> = {
    [ConversationPhase.INITIAL]: '分析中',
    [ConversationPhase.CLARIFYING]: '等待确认',
    [ConversationPhase.PLANNING]: '规划中',
    [ConversationPhase.AWAITING_CONFIRMATION]: '待确认',
    [ConversationPhase.EXECUTING]: '执行中',
    [ConversationPhase.COMPLETED]: '已完成',
    [ConversationPhase.PAUSED]: '已暂停',
    [ConversationPhase.CANCELLED]: '已取消'
  }
  return names[phase] || phase
}
