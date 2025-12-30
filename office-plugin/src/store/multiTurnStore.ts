/**
 * 多轮对话状态管理 Store
 * 
 * 使用 Zustand 管理多轮对话的全局状态
 * 支持状态持久化、会话管理、任务执行跟踪
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import Logger from '../utils/logger'
import {
  ConversationPhase,
  MultiTurnConversationState,
  TaskPlan,
  TaskStep,
  TaskStepStatus,
  ClarificationQuestion,
  UserPreferences,
  createConversationState,
  canTransitionTo
} from '../services/ai/conversation/ConversationState'
import type { ReviewResult } from '../services/ai/conversation/ReviewContextExtractor'

const logger = new Logger('MultiTurnStore')

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
interface MultiTurnStoreState {
  // ==================== 状态 ====================
  /** 所有会话 */
  sessions: Record<string, MultiTurnConversationState>
  /** 当前活动会话 ID */
  currentSessionId: string | null
  /** 是否启用多轮对话模式 (特性开关) */
  multiTurnEnabled: boolean
  /** 全局用户偏好 */
  globalPreferences: UserPreferences
  /** 🆕 上下文快照列表（按时间倒序） */
  contextSnapshots: ConversationContextSnapshot[]
  /** 🆕 最新的审查结果（快速访问） */
  latestReviewResult: ReviewResult | null
  /** 🆕 最新的任务计划摘要（快速访问） */
  latestTaskPlan: TaskPlan | null

  // ==================== 会话管理 ====================
  /** 创建新会话 */
  createSession: (intent: string) => string
  /** 获取会话 */
  getSession: (sessionId: string) => MultiTurnConversationState | undefined
  /** 获取当前会话 */
  getCurrentSession: () => MultiTurnConversationState | undefined
  /** 设置当前会话 */
  setCurrentSession: (sessionId: string) => void
  /** 删除会话 */
  deleteSession: (sessionId: string) => void
  /** 清空所有会话 */
  clearAllSessions: () => void

  // ==================== 阶段管理 ====================
  /** 更新会话阶段 */
  updatePhase: (sessionId: string, phase: ConversationPhase) => boolean
  /** 检查是否可以转换阶段 */
  canTransition: (sessionId: string, targetPhase: ConversationPhase) => boolean

  // ==================== 澄清对话 ====================
  /** 添加澄清问题 */
  addClarification: (sessionId: string, question: ClarificationQuestion) => void
  /** 回答澄清问题 */
  answerClarification: (sessionId: string, questionId: string, answer: string, selectedOptionId?: string) => void
  /** 获取未回答的澄清问题 */
  getPendingClarifications: (sessionId: string) => ClarificationQuestion[]

  // ==================== 任务计划 ====================
  /** 设置任务计划 */
  setTaskPlan: (sessionId: string, plan: TaskPlan) => void
  /** 更新任务计划 */
  updateTaskPlan: (sessionId: string, updates: Partial<TaskPlan>) => void
  /** 确认任务计划 */
  confirmTaskPlan: (sessionId: string) => void
  /** 取消任务计划 */
  cancelTaskPlan: (sessionId: string) => void

  // ==================== 步骤执行 ====================
  /** 更新步骤状态 */
  updateStepStatus: (sessionId: string, stepId: string, status: TaskStepStatus, result?: TaskStep['result']) => void
  /** 获取当前步骤 */
  getCurrentStep: (sessionId: string) => TaskStep | undefined
  /** 移动到下一步 */
  moveToNextStep: (sessionId: string) => TaskStep | undefined
  /** 跳过当前步骤 */
  skipCurrentStep: (sessionId: string) => void
  /** 标记步骤完成 */
  completeStep: (sessionId: string, stepId: string, result: TaskStep['result']) => void

  // ==================== 偏好管理 ====================
  /** 更新用户偏好 */
  updatePreferences: (sessionId: string, preferences: Partial<UserPreferences>) => void
  /** 更新全局偏好 */
  updateGlobalPreferences: (preferences: Partial<UserPreferences>) => void
  /** 学习用户偏好 (从操作中推断) */
  learnPreference: (key: string, value: unknown) => void

  // ==================== 工具方法 ====================
  /** 更新上下文摘要 */
  updateContextSummary: (sessionId: string, summary: string) => void
  /** 设置错误 */
  setError: (sessionId: string, error: MultiTurnConversationState['error']) => void
  /** 清除错误 */
  clearError: (sessionId: string) => void
  /** 启用/禁用多轮对话模式 */
  setMultiTurnEnabled: (enabled: boolean) => void

  // ==================== 🆕 上下文快照管理 ====================
  /** 保存审查结果到快照 */
  saveReviewContext: (reviewResult: ReviewResult, formattedContext: string, sourceMessageId: string) => void
  /** 保存任务计划到快照 */
  saveTaskPlanContext: (taskPlan: TaskPlan, formattedContext: string, sourceMessageId: string) => void
  /** 添加上下文快照 */
  pushContextSnapshot: (snapshot: Omit<ConversationContextSnapshot, 'id' | 'createdAt'>) => void
  /** 获取最新的审查上下文 */
  getLatestReviewContext: () => { reviewResult: ReviewResult | null; formattedContext: string | null }
  /** 获取最新的任务计划上下文 */
  getLatestTaskPlanContext: () => { taskPlan: TaskPlan | null; formattedContext: string | null }
  /** 清除所有上下文快照 */
  clearContextSnapshots: () => void
  /** 为会话附加审查结果 */
  attachReviewResult: (sessionId: string, reviewResult: ReviewResult) => void
}

/**
 * 创建多轮对话 Store
 */
export const useMultiTurnStore = create<MultiTurnStoreState>()(
  persist(
    (set, get) => ({
      // ==================== 初始状态 ====================
      sessions: {} as Record<string, MultiTurnConversationState>,
      currentSessionId: null as string | null,
      multiTurnEnabled: true as boolean,  // 默认启用，支持复杂任务澄清/分解/计划
      globalPreferences: {} as UserPreferences,
      // 🆕 上下文快照
      contextSnapshots: [] as ConversationContextSnapshot[],
      latestReviewResult: null as ReviewResult | null,
      latestTaskPlan: null as TaskPlan | null,

      // ==================== 会话管理 ====================
      createSession: (intent: string) => {
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const session = createConversationState(sessionId, intent)

        logger.info('[MultiTurnStore] Creating new session', { sessionId, intent: intent.substring(0, 50) })

        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: session
          },
          currentSessionId: sessionId
        }))

        return sessionId
      },

      getSession: (sessionId: string) => {
        return get().sessions[sessionId]
      },

      getCurrentSession: () => {
        const { sessions, currentSessionId } = get()
        return currentSessionId ? sessions[currentSessionId] : undefined
      },

      setCurrentSession: (sessionId: string) => {
        if (get().sessions[sessionId]) {
          set({ currentSessionId: sessionId })
          logger.debug('[MultiTurnStore] Current session set', { sessionId })
        }
      },

      deleteSession: (sessionId: string) => {
        set((state) => {
          const { [sessionId]: deleted, ...remaining } = state.sessions
          const newCurrentId = state.currentSessionId === sessionId
            ? Object.keys(remaining)[0] || null
            : state.currentSessionId

          logger.info('[MultiTurnStore] Session deleted', { sessionId })

          return {
            sessions: remaining,
            currentSessionId: newCurrentId
          }
        })
      },

      clearAllSessions: () => {
        logger.info('[MultiTurnStore] All sessions cleared')
        set({ sessions: {}, currentSessionId: null })
      },

      // ==================== 阶段管理 ====================
      updatePhase: (sessionId: string, phase: ConversationPhase) => {
        const session = get().sessions[sessionId]
        if (!session) {
          logger.warn('[MultiTurnStore] Session not found for phase update', { sessionId })
          return false
        }

        if (!canTransitionTo(session.phase, phase)) {
          logger.warn('[MultiTurnStore] Invalid phase transition', {
            sessionId,
            from: session.phase,
            to: phase
          })
          return false
        }

        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...state.sessions[sessionId],
              phase,
              lastUpdatedAt: new Date()
            }
          }
        }))

        logger.info('[MultiTurnStore] Phase updated', { sessionId, from: session.phase, to: phase })
        return true
      },

      canTransition: (sessionId: string, targetPhase: ConversationPhase) => {
        const session = get().sessions[sessionId]
        return session ? canTransitionTo(session.phase, targetPhase) : false
      },

      // ==================== 澄清对话 ====================
      addClarification: (sessionId: string, question: ClarificationQuestion) => {
        set((state) => {
          const session = state.sessions[sessionId]
          if (!session) return state

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                clarifications: [...session.clarifications, question],
                lastUpdatedAt: new Date()
              }
            }
          }
        })

        logger.debug('[MultiTurnStore] Clarification added', { sessionId, questionId: question.id })
      },

      answerClarification: (sessionId: string, questionId: string, answer: string, selectedOptionId?: string) => {
        set((state) => {
          const session = state.sessions[sessionId]
          if (!session) return state

          const updatedClarifications = session.clarifications.map((q) =>
            q.id === questionId
              ? { ...q, answered: true, answer, selectedOptionId }
              : q
          )

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                clarifications: updatedClarifications,
                lastUpdatedAt: new Date()
              }
            }
          }
        })

        logger.debug('[MultiTurnStore] Clarification answered', { sessionId, questionId, answer: answer.substring(0, 50) })
      },

      getPendingClarifications: (sessionId: string) => {
        const session = get().sessions[sessionId]
        return session?.clarifications.filter((q) => !q.answered) || []
      },

      // ==================== 任务计划 ====================
      setTaskPlan: (sessionId: string, plan: TaskPlan) => {
        set((state) => {
          const session = state.sessions[sessionId]
          if (!session) return state

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                taskPlan: plan,
                lastUpdatedAt: new Date()
              }
            }
          }
        })

        logger.info('[MultiTurnStore] Task plan set', {
          sessionId,
          planId: plan.id,
          stepCount: plan.steps.length
        })
      },

      updateTaskPlan: (sessionId: string, updates: Partial<TaskPlan>) => {
        set((state) => {
          const session = state.sessions[sessionId]
          if (!session?.taskPlan) return state

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                taskPlan: {
                  ...session.taskPlan,
                  ...updates,
                  updatedAt: new Date().toISOString()  // 🆕 转换为 ISO 字符串
                },
                lastUpdatedAt: new Date()
              }
            }
          }
        })
      },

      confirmTaskPlan: (sessionId: string) => {
        const store = get()
        const session = store.getSession(sessionId)
        if (!session) {
          logger.warn('[MultiTurnStore] Session not found when confirming task plan', { sessionId })
          return
        }

        store.updateTaskPlan(sessionId, { status: 'confirmed' })

        // 兼容旧流程：规划阶段跳过确认会导致 planning→executing 警告
        if (session.phase === ConversationPhase.PLANNING) {
          store.updatePhase(sessionId, ConversationPhase.AWAITING_CONFIRMATION)
        }

        store.updatePhase(sessionId, ConversationPhase.EXECUTING)
        logger.info('[MultiTurnStore] Task plan confirmed', { sessionId })
      },

      cancelTaskPlan: (sessionId: string) => {
        const store = get()
        store.updateTaskPlan(sessionId, { status: 'cancelled' })
        store.updatePhase(sessionId, ConversationPhase.CANCELLED)
        logger.info('[MultiTurnStore] Task plan cancelled', { sessionId })
      },

      // ==================== 步骤执行 ====================
      updateStepStatus: (sessionId: string, stepId: string, status: TaskStepStatus, result?: TaskStep['result']) => {
        set((state) => {
          const session = state.sessions[sessionId]
          if (!session?.taskPlan) return state

          const updatedSteps = session.taskPlan.steps.map((step) =>
            step.id === stepId
              ? { ...step, status, result }
              : step
          )

          // 如果步骤完成，添加到已执行列表
          const executedSteps = status === 'completed'
            ? [...session.executedSteps, stepId]
            : session.executedSteps

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                taskPlan: {
                  ...session.taskPlan,
                  steps: updatedSteps,
                  updatedAt: new Date().toISOString()  // 🆕 转换为 ISO 字符串
                },
                executedSteps,
                lastUpdatedAt: new Date()
              }
            }
          }
        })

        logger.debug('[MultiTurnStore] Step status updated', { sessionId, stepId, status })
      },

      getCurrentStep: (sessionId: string) => {
        const session = get().sessions[sessionId]
        if (!session?.taskPlan) return undefined
        return session.taskPlan.steps[session.taskPlan.currentStepIndex]
      },

      moveToNextStep: (sessionId: string) => {
        const session = get().sessions[sessionId]
        if (!session?.taskPlan) return undefined

        const nextIndex = session.taskPlan.currentStepIndex + 1
        if (nextIndex >= session.taskPlan.steps.length) {
          // 所有步骤完成
          get().updateTaskPlan(sessionId, { status: 'completed' })
          get().updatePhase(sessionId, ConversationPhase.COMPLETED)
          return undefined
        }

        get().updateTaskPlan(sessionId, { currentStepIndex: nextIndex })
        return session.taskPlan.steps[nextIndex]
      },

      skipCurrentStep: (sessionId: string) => {
        const currentStep = get().getCurrentStep(sessionId)
        if (currentStep) {
          get().updateStepStatus(sessionId, currentStep.id, 'skipped')
          get().moveToNextStep(sessionId)
        }
      },

      completeStep: (sessionId: string, stepId: string, result: TaskStep['result']) => {
        get().updateStepStatus(sessionId, stepId, 'completed', result)
        get().moveToNextStep(sessionId)
      },

      // ==================== 偏好管理 ====================
      updatePreferences: (sessionId: string, preferences: Partial<UserPreferences>) => {
        set((state) => {
          const session = state.sessions[sessionId]
          if (!session) return state

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                userPreferences: {
                  ...session.userPreferences,
                  ...preferences
                },
                lastUpdatedAt: new Date()
              }
            }
          }
        })
      },

      updateGlobalPreferences: (preferences: Partial<UserPreferences>) => {
        set((state) => ({
          globalPreferences: {
            ...state.globalPreferences,
            ...preferences
          }
        }))
        logger.debug('[MultiTurnStore] Global preferences updated', { preferences })
      },

      learnPreference: (key: string, value: unknown) => {
        set((state) => ({
          globalPreferences: {
            ...state.globalPreferences,
            custom: {
              ...state.globalPreferences.custom,
              [key]: value
            }
          }
        }))
      },

      // ==================== 工具方法 ====================
      updateContextSummary: (sessionId: string, summary: string) => {
        set((state) => {
          const session = state.sessions[sessionId]
          if (!session) return state

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                contextSummary: summary,
                lastUpdatedAt: new Date()
              }
            }
          }
        })
      },

      setError: (sessionId: string, error: MultiTurnConversationState['error']) => {
        set((state) => {
          const session = state.sessions[sessionId]
          if (!session) return state

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                error,
                lastUpdatedAt: new Date()
              }
            }
          }
        })

        logger.error('[MultiTurnStore] Error set', { sessionId, error })
      },

      clearError: (sessionId: string) => {
        set((state) => {
          const session = state.sessions[sessionId]
          if (!session) return state

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                error: undefined,
                lastUpdatedAt: new Date()
              }
            }
          }
        })
      },

      setMultiTurnEnabled: (enabled: boolean) => {
        set({ multiTurnEnabled: enabled })
        logger.info('[MultiTurnStore] Multi-turn mode', { enabled })
      },

      // ==================== 🆕 上下文快照管理 ====================
      saveReviewContext: (reviewResult: ReviewResult, formattedContext: string, sourceMessageId: string) => {
        const snapshot: ConversationContextSnapshot = {
          id: `ctx-review-${Date.now()}`,
          sourceMessageId,
          type: 'review',
          formattedContext,
          itemCount: reviewResult.issues?.length || 0,
          createdAt: new Date(),
          rawData: reviewResult
        }

        set((state) => ({
          contextSnapshots: [snapshot, ...state.contextSnapshots].slice(0, 10), // 最多保留10个
          latestReviewResult: reviewResult
        }))

        logger.info('[MultiTurnStore] Review context saved', {
          snapshotId: snapshot.id,
          issueCount: snapshot.itemCount,
          sourceMessageId
        })
      },

      saveTaskPlanContext: (taskPlan: TaskPlan, formattedContext: string, sourceMessageId: string) => {
        const snapshot: ConversationContextSnapshot = {
          id: `ctx-plan-${Date.now()}`,
          sourceMessageId,
          type: 'task_plan',
          formattedContext,
          itemCount: taskPlan.steps?.length || 0,
          createdAt: new Date(),
          rawData: taskPlan
        }

        set((state) => ({
          contextSnapshots: [snapshot, ...state.contextSnapshots].slice(0, 10),
          latestTaskPlan: taskPlan
        }))

        logger.info('[MultiTurnStore] Task plan context saved', {
          snapshotId: snapshot.id,
          stepCount: snapshot.itemCount,
          sourceMessageId
        })
      },

      pushContextSnapshot: (snapshot: Omit<ConversationContextSnapshot, 'id' | 'createdAt'>) => {
        const fullSnapshot: ConversationContextSnapshot = {
          ...snapshot,
          id: `ctx-${snapshot.type}-${Date.now()}`,
          createdAt: new Date()
        }

        set((state) => ({
          contextSnapshots: [fullSnapshot, ...state.contextSnapshots].slice(0, 10)
        }))
      },

      getLatestReviewContext: () => {
        const state = get()
        const reviewSnapshot = state.contextSnapshots.find(s => s.type === 'review')
        
        return {
          reviewResult: state.latestReviewResult || (reviewSnapshot?.rawData as ReviewResult) || null,
          formattedContext: reviewSnapshot?.formattedContext || null
        }
      },

      getLatestTaskPlanContext: () => {
        const state = get()
        const planSnapshot = state.contextSnapshots.find(s => s.type === 'task_plan')
        
        return {
          taskPlan: state.latestTaskPlan || (planSnapshot?.rawData as TaskPlan) || null,
          formattedContext: planSnapshot?.formattedContext || null
        }
      },

      clearContextSnapshots: () => {
        set({
          contextSnapshots: [],
          latestReviewResult: null,
          latestTaskPlan: null
        })
        logger.info('[MultiTurnStore] Context snapshots cleared')
      },

      attachReviewResult: (sessionId: string, reviewResult: ReviewResult) => {
        set((state) => {
          const session = state.sessions[sessionId]
          if (!session) return state

          // 把 reviewResult 存入 session 的 metadata 或扩展字段
          return {
            ...state,
            latestReviewResult: reviewResult,
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                lastUpdatedAt: new Date()
              }
            }
          }
        })

        logger.info('[MultiTurnStore] Review result attached to session', {
          sessionId,
          issueCount: reviewResult.issues?.length || 0
        })
      }
    }),
    {
      name: 'multi-turn-conversation-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // 只持久化必要的数据
        globalPreferences: state.globalPreferences,
        multiTurnEnabled: state.multiTurnEnabled
        // sessions 不持久化，每次启动时重新开始
      })
    }
  )
)

/**
 * 选择器：获取当前会话
 */
export const selectCurrentSession = (state: MultiTurnStoreState) => 
  state.currentSessionId ? state.sessions[state.currentSessionId] : undefined

/**
 * 选择器：获取当前任务计划
 */
export const selectCurrentTaskPlan = (state: MultiTurnStoreState) => 
  selectCurrentSession(state)?.taskPlan

/**
 * 选择器：获取当前步骤
 */
export const selectCurrentStep = (state: MultiTurnStoreState) => {
  const session = selectCurrentSession(state)
  if (!session?.taskPlan) return undefined
  return session.taskPlan.steps[session.taskPlan.currentStepIndex]
}

/**
 * 选择器：是否启用多轮对话
 */
export const selectMultiTurnEnabled = (state: MultiTurnStoreState) => 
  state.multiTurnEnabled

/**
 * 🆕 选择器：获取最新审查结果
 */
export const selectLatestReviewResult = (state: MultiTurnStoreState) => 
  state.latestReviewResult

/**
 * 🆕 选择器：获取最新任务计划
 */
export const selectLatestTaskPlan = (state: MultiTurnStoreState) => 
  state.latestTaskPlan

/**
 * 🆕 选择器：获取所有上下文快照
 */
export const selectContextSnapshots = (state: MultiTurnStoreState) => 
  state.contextSnapshots

/**
 * 🆕 选择器：获取最新的审查上下文格式化文本
 */
export const selectLatestReviewContextText = (state: MultiTurnStoreState) => {
  const reviewSnapshot = state.contextSnapshots.find(s => s.type === 'review')
  return reviewSnapshot?.formattedContext || null
}
