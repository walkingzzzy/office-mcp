/**
 * 澄清对话 Slice
 */

import Logger from '../../utils/logger'
import type { ClarificationQuestion, MultiTurnStoreState, SliceCreator } from './types'

const logger = new Logger('ClarificationSlice')

export interface ClarificationSlice {
    addClarification: MultiTurnStoreState['addClarification']
    answerClarification: MultiTurnStoreState['answerClarification']
    getPendingClarifications: MultiTurnStoreState['getPendingClarifications']
}

export const createClarificationSlice: SliceCreator<ClarificationSlice> = (set, get) => ({
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

        logger.debug('[ClarificationSlice] Clarification added', { sessionId, questionId: question.id })
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

        logger.debug('[ClarificationSlice] Clarification answered', { sessionId, questionId, answer: answer.substring(0, 50) })
    },

    getPendingClarifications: (sessionId: string) => {
        const session = get().sessions[sessionId]
        return session?.clarifications.filter((q) => !q.answered) || []
    }
})
