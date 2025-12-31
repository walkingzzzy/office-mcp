/**
 * 上下文快照 Slice
 */

import Logger from '../../utils/logger'
import type {
    ReviewResult,
    TaskPlan,
    ConversationContextSnapshot,
    MultiTurnStoreState,
    SliceCreator
} from './types'

const logger = new Logger('ContextSnapshotSlice')

export interface ContextSnapshotSlice {
    contextSnapshots: MultiTurnStoreState['contextSnapshots']
    latestReviewResult: MultiTurnStoreState['latestReviewResult']
    latestTaskPlan: MultiTurnStoreState['latestTaskPlan']
    saveReviewContext: MultiTurnStoreState['saveReviewContext']
    saveTaskPlanContext: MultiTurnStoreState['saveTaskPlanContext']
    pushContextSnapshot: MultiTurnStoreState['pushContextSnapshot']
    getLatestReviewContext: MultiTurnStoreState['getLatestReviewContext']
    getLatestTaskPlanContext: MultiTurnStoreState['getLatestTaskPlanContext']
    clearContextSnapshots: MultiTurnStoreState['clearContextSnapshots']
    attachReviewResult: MultiTurnStoreState['attachReviewResult']
}

export const createContextSnapshotSlice: SliceCreator<ContextSnapshotSlice> = (set, get) => ({
    contextSnapshots: [],
    latestReviewResult: null,
    latestTaskPlan: null,

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
            contextSnapshots: [snapshot, ...state.contextSnapshots].slice(0, 10),
            latestReviewResult: reviewResult
        }))

        logger.info('[ContextSnapshotSlice] Review context saved', {
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

        logger.info('[ContextSnapshotSlice] Task plan context saved', {
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
        logger.info('[ContextSnapshotSlice] Context snapshots cleared')
    },

    attachReviewResult: (sessionId: string, reviewResult: ReviewResult) => {
        set((state) => {
            const session = state.sessions[sessionId]
            if (!session) return state

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

        logger.info('[ContextSnapshotSlice] Review result attached to session', {
            sessionId,
            issueCount: reviewResult.issues?.length || 0
        })
    }
})
