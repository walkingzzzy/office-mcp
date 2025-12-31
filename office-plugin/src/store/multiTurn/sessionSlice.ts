/**
 * 会话管理 Slice
 */

import Logger from '../../utils/logger'
import { createConversationState } from '../../services/ai/conversation/ConversationState'
import type { MultiTurnStoreState, SliceCreator } from './types'

const logger = new Logger('SessionSlice')

export interface SessionSlice {
    sessions: MultiTurnStoreState['sessions']
    currentSessionId: MultiTurnStoreState['currentSessionId']
    createSession: MultiTurnStoreState['createSession']
    getSession: MultiTurnStoreState['getSession']
    getCurrentSession: MultiTurnStoreState['getCurrentSession']
    setCurrentSession: MultiTurnStoreState['setCurrentSession']
    deleteSession: MultiTurnStoreState['deleteSession']
    clearAllSessions: MultiTurnStoreState['clearAllSessions']
}

export const createSessionSlice: SliceCreator<SessionSlice> = (set, get) => ({
    sessions: {},
    currentSessionId: null,

    createSession: (intent: string) => {
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const session = createConversationState(sessionId, intent)

        logger.info('[SessionSlice] Creating new session', { sessionId, intent: intent.substring(0, 50) })

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
            logger.debug('[SessionSlice] Current session set', { sessionId })
        }
    },

    deleteSession: (sessionId: string) => {
        set((state) => {
            const { [sessionId]: deleted, ...remaining } = state.sessions
            const newCurrentId = state.currentSessionId === sessionId
                ? Object.keys(remaining)[0] || null
                : state.currentSessionId

            logger.info('[SessionSlice] Session deleted', { sessionId })

            return {
                sessions: remaining,
                currentSessionId: newCurrentId
            }
        })
    },

    clearAllSessions: () => {
        logger.info('[SessionSlice] All sessions cleared')
        set({ sessions: {}, currentSessionId: null })
    }
})
