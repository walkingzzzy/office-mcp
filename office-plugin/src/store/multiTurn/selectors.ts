/**
 * 选择器函数
 */

import type { MultiTurnStoreState } from './types'

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
 * 选择器：获取最新审查结果
 */
export const selectLatestReviewResult = (state: MultiTurnStoreState) =>
    state.latestReviewResult

/**
 * 选择器：获取最新任务计划
 */
export const selectLatestTaskPlan = (state: MultiTurnStoreState) =>
    state.latestTaskPlan

/**
 * 选择器：获取所有上下文快照
 */
export const selectContextSnapshots = (state: MultiTurnStoreState) =>
    state.contextSnapshots

/**
 * 选择器：获取最新的审查上下文格式化文本
 */
export const selectLatestReviewContextText = (state: MultiTurnStoreState) => {
    const reviewSnapshot = state.contextSnapshots.find(s => s.type === 'review')
    return reviewSnapshot?.formattedContext || null
}
