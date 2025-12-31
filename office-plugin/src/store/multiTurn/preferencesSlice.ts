/**
 * 偏好管理 Slice
 */

import Logger from '../../utils/logger'
import type { UserPreferences, MultiTurnStoreState, SliceCreator } from './types'

const logger = new Logger('PreferencesSlice')

export interface PreferencesSlice {
    globalPreferences: MultiTurnStoreState['globalPreferences']
    updatePreferences: MultiTurnStoreState['updatePreferences']
    updateGlobalPreferences: MultiTurnStoreState['updateGlobalPreferences']
    learnPreference: MultiTurnStoreState['learnPreference']
}

export const createPreferencesSlice: SliceCreator<PreferencesSlice> = (set, get) => ({
    globalPreferences: {} as UserPreferences,

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
        logger.debug('[PreferencesSlice] Global preferences updated', { preferences })
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
    }
})
