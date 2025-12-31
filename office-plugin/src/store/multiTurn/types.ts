/**
 * multiTurn Store 类型定义
 */

import type {
    ConversationPhase,
    MultiTurnConversationState,
    TaskPlan,
    TaskStep,
    TaskStepStatus,
    ClarificationQuestion,
    UserPreferences
} from '../../services/ai/conversation/ConversationState'
import type { ReviewResult } from '../../services/ai/conversation/ReviewContextExtractor'

// 重导出常用类型
export type {
    ConversationPhase,
    MultiTurnConversationState,
    TaskPlan,
    TaskStep,
    TaskStepStatus,
    ClarificationQuestion,
    UserPreferences,
    ReviewResult
}

/**
 * 上下文快照类型
 * 用于持久化审查结果和任务计划摘要，避免每次扫描消息历史
 */
export interface ConversationContextSnapshot {
    /** 唯一 ID */
    id: string
    /** 来源消息 ID */
    sourceMessageId: string
    /** 快照类型 */
    type: 'review' | 'task_plan' | 'suggestion'
    /** 格式化的上下文文本（用于 prompt 注入） */
    formattedContext: string
    /** 问题数量（审查类型）或步骤数量（任务类型） */
    itemCount: number
    /** 创建时间 */
    createdAt: Date
    /** 原始数据（可选） */
    rawData?: ReviewResult | TaskPlan
}

/**
 * Store 状态接口
 */
export interface MultiTurnStoreState {
    // ==================== 状态 ====================
    sessions: Record<string, MultiTurnConversationState>
    currentSessionId: string | null
    multiTurnEnabled: boolean
    globalPreferences: UserPreferences
    contextSnapshots: ConversationContextSnapshot[]
    latestReviewResult: ReviewResult | null
    latestTaskPlan: TaskPlan | null

    // ==================== 会话管理 ====================
    createSession: (intent: string) => string
    getSession: (sessionId: string) => MultiTurnConversationState | undefined
    getCurrentSession: () => MultiTurnConversationState | undefined
    setCurrentSession: (sessionId: string) => void
    deleteSession: (sessionId: string) => void
    clearAllSessions: () => void

    // ==================== 阶段管理 ====================
    updatePhase: (sessionId: string, phase: ConversationPhase) => boolean
    canTransition: (sessionId: string, targetPhase: ConversationPhase) => boolean

    // ==================== 澄清对话 ====================
    addClarification: (sessionId: string, question: ClarificationQuestion) => void
    answerClarification: (sessionId: string, questionId: string, answer: string, selectedOptionId?: string) => void
    getPendingClarifications: (sessionId: string) => ClarificationQuestion[]

    // ==================== 任务计划 ====================
    setTaskPlan: (sessionId: string, plan: TaskPlan) => void
    updateTaskPlan: (sessionId: string, updates: Partial<TaskPlan>) => void
    confirmTaskPlan: (sessionId: string) => void
    cancelTaskPlan: (sessionId: string) => void

    // ==================== 步骤执行 ====================
    updateStepStatus: (sessionId: string, stepId: string, status: TaskStepStatus, result?: TaskStep['result']) => void
    getCurrentStep: (sessionId: string) => TaskStep | undefined
    moveToNextStep: (sessionId: string) => TaskStep | undefined
    skipCurrentStep: (sessionId: string) => void
    completeStep: (sessionId: string, stepId: string, result: TaskStep['result']) => void

    // ==================== 偏好管理 ====================
    updatePreferences: (sessionId: string, preferences: Partial<UserPreferences>) => void
    updateGlobalPreferences: (preferences: Partial<UserPreferences>) => void
    learnPreference: (key: string, value: unknown) => void

    // ==================== 工具方法 ====================
    updateContextSummary: (sessionId: string, summary: string) => void
    setError: (sessionId: string, error: MultiTurnConversationState['error']) => void
    clearError: (sessionId: string) => void
    setMultiTurnEnabled: (enabled: boolean) => void

    // ==================== 上下文快照管理 ====================
    saveReviewContext: (reviewResult: ReviewResult, formattedContext: string, sourceMessageId: string) => void
    saveTaskPlanContext: (taskPlan: TaskPlan, formattedContext: string, sourceMessageId: string) => void
    pushContextSnapshot: (snapshot: Omit<ConversationContextSnapshot, 'id' | 'createdAt'>) => void
    getLatestReviewContext: () => { reviewResult: ReviewResult | null; formattedContext: string | null }
    getLatestTaskPlanContext: () => { taskPlan: TaskPlan | null; formattedContext: string | null }
    clearContextSnapshots: () => void
    attachReviewResult: (sessionId: string, reviewResult: ReviewResult) => void
}

/**
 * Slice 创建函数类型
 */
export type SliceCreator<T> = (
    set: (partial: Partial<MultiTurnStoreState> | ((state: MultiTurnStoreState) => Partial<MultiTurnStoreState>)) => void,
    get: () => MultiTurnStoreState
) => T
