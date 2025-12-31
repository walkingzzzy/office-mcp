/**
 * 阶段管理 Slice
 */

import Logger from '../../utils/logger'
import { ConversationPhase, canTransitionTo } from '../../services/ai/conversation/ConversationState'
import type { MultiTurnStoreState, SliceCreator } from './types'

const logger = new Logger('PhaseSlice')

export interface PhaseSlice {
    updatePhase: MultiTurnStoreState['updatePhase']
    canTransition: MultiTurnStoreState['canTransition']
}

export const createPhaseSlice: SliceCreator<PhaseSlice> = (set, get) => ({
    updatePhase: (sessionId: string, phase: ConversationPhase) => {
        const session = get().sessions[sessionId]
        if (!session) {
            logger.warn('[PhaseSlice] Session not found for phase update', { sessionId })
            return false
        }

        if (!canTransitionTo(session.phase, phase)) {
            logger.warn('[PhaseSlice] Invalid phase transition', {
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

        logger.info('[PhaseSlice] Phase updated', { sessionId, from: session.phase, to: phase })
        return true
    },

    canTransition: (sessionId: string, targetPhase: ConversationPhase) => {
        const session = get().sessions[sessionId]
        return session ? canTransitionTo(session.phase, targetPhase) : false
    }
})
