/**
 * 步骤执行 Slice
 */

import Logger from '../../utils/logger'
import { ConversationPhase } from '../../services/ai/conversation/ConversationState'
import type { TaskStep, TaskStepStatus, MultiTurnStoreState, SliceCreator } from './types'

const logger = new Logger('StepExecutionSlice')

export interface StepExecutionSlice {
    updateStepStatus: MultiTurnStoreState['updateStepStatus']
    getCurrentStep: MultiTurnStoreState['getCurrentStep']
    moveToNextStep: MultiTurnStoreState['moveToNextStep']
    skipCurrentStep: MultiTurnStoreState['skipCurrentStep']
    completeStep: MultiTurnStoreState['completeStep']
}

export const createStepExecutionSlice: SliceCreator<StepExecutionSlice> = (set, get) => ({
    updateStepStatus: (sessionId: string, stepId: string, status: TaskStepStatus, result?: TaskStep['result']) => {
        set((state) => {
            const session = state.sessions[sessionId]
            if (!session?.taskPlan) return state

            const updatedSteps = session.taskPlan.steps.map((step) =>
                step.id === stepId
                    ? { ...step, status, result }
                    : step
            )

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
                            updatedAt: new Date().toISOString()
                        },
                        executedSteps,
                        lastUpdatedAt: new Date()
                    }
                }
            }
        })

        logger.debug('[StepExecutionSlice] Step status updated', { sessionId, stepId, status })
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
    }
})
