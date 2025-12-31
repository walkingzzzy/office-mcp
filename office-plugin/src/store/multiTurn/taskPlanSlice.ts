/**
 * 任务计划 Slice
 */

import Logger from '../../utils/logger'
import { ConversationPhase } from '../../services/ai/conversation/ConversationState'
import type { TaskPlan, MultiTurnStoreState, SliceCreator } from './types'

const logger = new Logger('TaskPlanSlice')

export interface TaskPlanSlice {
    setTaskPlan: MultiTurnStoreState['setTaskPlan']
    updateTaskPlan: MultiTurnStoreState['updateTaskPlan']
    confirmTaskPlan: MultiTurnStoreState['confirmTaskPlan']
    cancelTaskPlan: MultiTurnStoreState['cancelTaskPlan']
}

export const createTaskPlanSlice: SliceCreator<TaskPlanSlice> = (set, get) => ({
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

        logger.info('[TaskPlanSlice] Task plan set', {
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
                            updatedAt: new Date().toISOString()
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
            logger.warn('[TaskPlanSlice] Session not found when confirming task plan', { sessionId })
            return
        }

        store.updateTaskPlan(sessionId, { status: 'confirmed' })

        // 兼容旧流程
        if (session.phase === ConversationPhase.PLANNING) {
            store.updatePhase(sessionId, ConversationPhase.AWAITING_CONFIRMATION)
        }

        store.updatePhase(sessionId, ConversationPhase.EXECUTING)
        logger.info('[TaskPlanSlice] Task plan confirmed', { sessionId })
    },

    cancelTaskPlan: (sessionId: string) => {
        const store = get()
        store.updateTaskPlan(sessionId, { status: 'cancelled' })
        store.updatePhase(sessionId, ConversationPhase.CANCELLED)
        logger.info('[TaskPlanSlice] Task plan cancelled', { sessionId })
    }
})
