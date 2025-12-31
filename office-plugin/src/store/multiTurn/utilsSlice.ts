/**
 * 工具方法 Slice
 */

import Logger from '../../utils/logger'
import type { MultiTurnConversationState, MultiTurnStoreState, SliceCreator } from './types'

const logger = new Logger('UtilsSlice')

export interface UtilsSlice {
    multiTurnEnabled: MultiTurnStoreState['multiTurnEnabled']
    updateContextSummary: MultiTurnStoreState['updateContextSummary']
    setError: MultiTurnStoreState['setError']
    clearError: MultiTurnStoreState['clearError']
    setMultiTurnEnabled: MultiTurnStoreState['setMultiTurnEnabled']
}

export const createUtilsSlice: SliceCreator<UtilsSlice> = (set, get) => ({
    multiTurnEnabled: true,

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

        logger.error('[UtilsSlice] Error set', { sessionId, error })
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
        logger.info('[UtilsSlice] Multi-turn mode', { enabled })
    }
})
