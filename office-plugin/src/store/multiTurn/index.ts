/**
 * multiTurn Store 主入口
 * 
 * 使用 Zustand Slice Pattern 组合所有功能模块
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type { MultiTurnStoreState } from './types'
import { createSessionSlice } from './sessionSlice'
import { createPhaseSlice } from './phaseSlice'
import { createClarificationSlice } from './clarificationSlice'
import { createTaskPlanSlice } from './taskPlanSlice'
import { createStepExecutionSlice } from './stepExecutionSlice'
import { createPreferencesSlice } from './preferencesSlice'
import { createContextSnapshotSlice } from './contextSnapshotSlice'
import { createUtilsSlice } from './utilsSlice'

/**
 * 创建多轮对话 Store
 */
export const useMultiTurnStore = create<MultiTurnStoreState>()(
    persist(
        (set, get) => ({
            // 组合所有 slices
            ...createSessionSlice(set, get),
            ...createPhaseSlice(set, get),
            ...createClarificationSlice(set, get),
            ...createTaskPlanSlice(set, get),
            ...createStepExecutionSlice(set, get),
            ...createPreferencesSlice(set, get),
            ...createContextSnapshotSlice(set, get),
            ...createUtilsSlice(set, get)
        }),
        {
            name: 'multi-turn-conversation-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // 只持久化必要的数据
                globalPreferences: state.globalPreferences,
                multiTurnEnabled: state.multiTurnEnabled
                // sessions 不持久化，每次启动时重新开始
            })
        }
    )
)

// 导出类型
export type {
    MultiTurnStoreState,
    ConversationContextSnapshot,
    ConversationPhase,
    MultiTurnConversationState,
    TaskPlan,
    TaskStep,
    TaskStepStatus,
    ClarificationQuestion,
    UserPreferences,
    ReviewResult
} from './types'

// 导出选择器
export {
    selectCurrentSession,
    selectCurrentTaskPlan,
    selectCurrentStep,
    selectMultiTurnEnabled,
    selectLatestReviewResult,
    selectLatestTaskPlan,
    selectContextSnapshots,
    selectLatestReviewContextText
} from './selectors'
