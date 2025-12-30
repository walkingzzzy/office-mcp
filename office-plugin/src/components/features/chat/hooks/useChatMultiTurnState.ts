/**
 * useChatMultiTurnState Hook
 * 
 * 管理多轮对话相关的状态，包括：
 * - 澄清问题状态
 * - 任务计划状态
 * - 预览状态
 * - 执行状态
 * 
 * @created 2025-12-29 - 修复 P7 ChatInterface 状态过多问题
 */

import { useState, useCallback } from 'react'
import type { ClarificationQuestion, TaskPlan, PlanPreview } from '../../../../services/ai/conversation'

/**
 * 任务计划执行状态
 */
export interface TaskPlanExecutionState {
  /** 待执行的计划 */
  plan: TaskPlan
  /** 待执行的工具调用 */
  toolCalls: Array<{ toolName: string; args: Record<string, unknown> }>
}

/**
 * 预览状态
 */
export interface PreviewState {
  /** 活动预览 */
  activePreview: PlanPreview | null
  /** 待执行的工具调用 */
  pendingToolCalls: Array<{ toolName: string; args: Record<string, unknown> }> | null
}

/**
 * 多轮对话状态返回类型
 */
export interface ChatMultiTurnStateReturn {
  // ==================== 澄清问题状态 ====================
  /** 当前活动的澄清问题 */
  activeClarification: ClarificationQuestion | null
  /** 设置活动澄清问题 */
  setActiveClarification: (clarification: ClarificationQuestion | null) => void
  /** 清除澄清问题 */
  clearClarification: () => void

  // ==================== 会话状态 ====================
  /** 当前活动的会话 ID */
  activeSessionId: string | null
  /** 设置活动会话 ID */
  setActiveSessionId: (sessionId: string | null) => void

  // ==================== 任务计划状态 ====================
  /** 当前活动的任务计划 */
  activeTaskPlan: TaskPlan | null
  /** 设置活动任务计划 */
  setActiveTaskPlan: (plan: TaskPlan | null) => void
  /** 待处理的计划（按消息 ID 索引） */
  pendingPlans: Record<string, TaskPlan>
  /** 设置待处理计划 */
  setPendingPlans: React.Dispatch<React.SetStateAction<Record<string, TaskPlan>>>
  /** 添加待处理计划 */
  addPendingPlan: (messageId: string, plan: TaskPlan) => void
  /** 移除待处理计划 */
  removePendingPlan: (messageId: string) => void
  /** 计划会话映射 */
  planSessions: Record<string, string>
  /** 设置计划会话映射 */
  setPlanSessions: React.Dispatch<React.SetStateAction<Record<string, string>>>

  // ==================== 执行状态 ====================
  /** 待执行的计划 */
  pendingPlanExecution: TaskPlanExecutionState | null
  /** 设置待执行计划 */
  setPendingPlanExecution: (execution: TaskPlanExecutionState | null) => void
  /** 是否正在应用计划 */
  isApplyingPlan: boolean
  /** 设置应用计划状态 */
  setIsApplyingPlan: (applying: boolean) => void
  /** 是否正在执行计划 */
  isExecutingPlan: boolean
  /** 设置执行计划状态 */
  setIsExecutingPlan: (executing: boolean) => void
  /** 当前执行步骤索引 */
  currentStepIndex: number
  /** 设置当前步骤索引 */
  setCurrentStepIndex: (index: number) => void

  // ==================== 预览状态 ====================
  /** 活动预览 */
  activePreview: PlanPreview | null
  /** 设置活动预览 */
  setActivePreview: (preview: PlanPreview | null) => void
  /** 待执行的工具调用 */
  pendingToolCalls: Array<{ toolName: string; args: Record<string, unknown> }> | null
  /** 设置待执行工具调用 */
  setPendingToolCalls: (calls: Array<{ toolName: string; args: Record<string, unknown> }> | null) => void

  // ==================== 批量操作 ====================
  /** 重置所有多轮对话状态 */
  resetMultiTurnState: () => void
  /** 开始新的多轮对话 */
  startNewSession: (sessionId: string) => void
}

/**
 * 多轮对话状态管理 Hook
 */
export function useChatMultiTurnState(): ChatMultiTurnStateReturn {
  // 澄清问题状态
  const [activeClarification, setActiveClarification] = useState<ClarificationQuestion | null>(null)
  
  // 会话状态
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  
  // 任务计划状态
  const [activeTaskPlan, setActiveTaskPlan] = useState<TaskPlan | null>(null)
  const [pendingPlans, setPendingPlans] = useState<Record<string, TaskPlan>>({})
  const [planSessions, setPlanSessions] = useState<Record<string, string>>({})
  
  // 执行状态
  const [pendingPlanExecution, setPendingPlanExecution] = useState<TaskPlanExecutionState | null>(null)
  const [isApplyingPlan, setIsApplyingPlan] = useState(false)
  const [isExecutingPlan, setIsExecutingPlan] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  
  // 预览状态
  const [activePreview, setActivePreview] = useState<PlanPreview | null>(null)
  const [pendingToolCalls, setPendingToolCalls] = useState<Array<{ toolName: string; args: Record<string, unknown> }> | null>(null)

  // ==================== 辅助方法 ====================

  const clearClarification = useCallback(() => {
    setActiveClarification(null)
  }, [])

  const addPendingPlan = useCallback((messageId: string, plan: TaskPlan) => {
    setPendingPlans(prev => ({
      ...prev,
      [messageId]: plan
    }))
  }, [])

  const removePendingPlan = useCallback((messageId: string) => {
    setPendingPlans(prev => {
      const { [messageId]: _, ...rest } = prev
      return rest
    })
  }, [])

  const resetMultiTurnState = useCallback(() => {
    setActiveClarification(null)
    setActiveSessionId(null)
    setActiveTaskPlan(null)
    setPendingPlans({})
    setPlanSessions({})
    setPendingPlanExecution(null)
    setIsApplyingPlan(false)
    setIsExecutingPlan(false)
    setCurrentStepIndex(-1)
    setActivePreview(null)
    setPendingToolCalls(null)
  }, [])

  const startNewSession = useCallback((sessionId: string) => {
    resetMultiTurnState()
    setActiveSessionId(sessionId)
  }, [resetMultiTurnState])

  return {
    // 澄清问题状态
    activeClarification,
    setActiveClarification,
    clearClarification,

    // 会话状态
    activeSessionId,
    setActiveSessionId,

    // 任务计划状态
    activeTaskPlan,
    setActiveTaskPlan,
    pendingPlans,
    setPendingPlans,
    addPendingPlan,
    removePendingPlan,
    planSessions,
    setPlanSessions,

    // 执行状态
    pendingPlanExecution,
    setPendingPlanExecution,
    isApplyingPlan,
    setIsApplyingPlan,
    isExecutingPlan,
    setIsExecutingPlan,
    currentStepIndex,
    setCurrentStepIndex,

    // 预览状态
    activePreview,
    setActivePreview,
    pendingToolCalls,
    setPendingToolCalls,

    // 批量操作
    resetMultiTurnState,
    startNewSession
  }
}

export default useChatMultiTurnState
