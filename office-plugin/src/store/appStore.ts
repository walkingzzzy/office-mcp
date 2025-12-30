/**
 * Application Store - 应用状态管理
 * 
 * 合并 documentContextStore + pendingOperationsStore
 * 管理文档上下文状态和待执行操作队列
 * 
 * @created 2025-12-30 - P1-3 Store 合并优化
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import Logger from '../utils/logger'

const logger = new Logger('AppStore')

// ==================== 类型定义 ====================

/**
 * 表格信息
 */
export interface TableInfo {
  tableIndex: number
  rowCount: number
  columnCount: number
  createdAt: number
  lastModifiedAt: number
}

/**
 * 待执行操作
 */
export interface PendingOperation {
  id: string
  stepIndex: number
  toolName: string
  toolArgs: Record<string, unknown>
  description: string
  parametersSummary: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  canUndo: boolean
  estimatedTime: number
  createdAt: string
}

/**
 * 待执行计划
 */
export interface PendingPlan {
  planId: string
  title: string
  description: string
  operations: PendingOperation[]
  documentSnapshot?: string
  status: 'pending' | 'applying' | 'applied' | 'rolled_back' | 'discarded'
  messageId: string
  createdAt: string
  updatedAt: string
}

/**
 * 操作执行结果
 */
export interface OperationResult {
  operationId: string
  success: boolean
  message: string
  data?: unknown
  executionTime: number
}

// ==================== Store 状态接口 ====================

interface AppState {
  // === 文档上下文状态 ===
  tables: TableInfo[]
  hasTables: boolean
  lastToolExecutionAt: number | null
  documentSessionId: string | null

  // === 待执行操作状态 ===
  pendingPlans: Record<string, PendingPlan>
  activePlanId: string | null
  isApplying: boolean
  applyProgress: number
  currentOperationIndex: number
  executionResults: OperationResult[]
  lastError: string | null

  // === 文档上下文 Actions ===
  recordTableInsert: (tableIndex: number, rowCount: number, columnCount: number) => void
  recordCellWrite: (tableIndex: number) => void
  recordTableDelete: (tableIndex: number) => void
  getTableInfo: (tableIndex: number) => TableInfo | undefined
  checkHasTables: () => boolean
  clearDocumentState: () => void
  setDocumentSessionId: (sessionId: string) => void

  // === 待执行操作 Actions ===
  createPendingPlan: (planId: string, title: string, description: string, messageId: string) => void
  addOperation: (planId: string, operation: Omit<PendingOperation, 'id' | 'createdAt'>) => void
  addOperations: (planId: string, operations: Omit<PendingOperation, 'id' | 'createdAt'>[]) => void
  removeOperation: (planId: string, operationId: string) => void
  setDocumentSnapshot: (planId: string, snapshot: string) => void
  startApplying: (planId: string) => void
  updateApplyProgress: (progress: number, currentIndex: number) => void
  recordOperationResult: (result: OperationResult) => void
  completeApply: (planId: string, success: boolean) => void
  rollbackPlan: (planId: string) => void
  discardPlan: (planId: string) => void
  clearAllPlans: () => void
  getPlan: (planId: string) => PendingPlan | undefined
  getActivePlan: () => PendingPlan | undefined
  setActivePlan: (planId: string | null) => void
  setError: (error: string | null) => void
}

// ==================== 辅助函数 ====================

function generateOperationId(): string {
  return `op-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

// ==================== Store 实现 ====================

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // === 初始状态 ===
      tables: [] as TableInfo[],
      hasTables: false,
      lastToolExecutionAt: null as number | null,
      documentSessionId: null as string | null,
      pendingPlans: {} as Record<string, PendingPlan>,
      activePlanId: null as string | null,
      isApplying: false,
      applyProgress: 0,
      currentOperationIndex: -1,
      executionResults: [] as OperationResult[],
      lastError: null as string | null,

      // === 文档上下文 Actions ===
      recordTableInsert: (tableIndex, rowCount, columnCount) => {
        const now = Date.now()
        logger.info('[AppStore] Recording table insert', { tableIndex, rowCount, columnCount })

        set((state) => {
          const existingIndex = state.tables.findIndex(t => t.tableIndex === tableIndex)
          const newTable: TableInfo = {
            tableIndex,
            rowCount,
            columnCount,
            createdAt: now,
            lastModifiedAt: now
          }

          let newTables: TableInfo[]
          if (existingIndex >= 0) {
            newTables = [...state.tables]
            newTables[existingIndex] = newTable
          } else {
            newTables = [...state.tables, newTable]
          }

          return {
            tables: newTables,
            hasTables: true,
            lastToolExecutionAt: now
          }
        })
      },

      recordCellWrite: (tableIndex) => {
        const now = Date.now()
        logger.debug('[AppStore] Recording cell write', { tableIndex })

        set((state) => {
          const tableIdx = state.tables.findIndex(t => t.tableIndex === tableIndex)
          if (tableIdx >= 0) {
            const newTables = [...state.tables]
            newTables[tableIdx] = { ...newTables[tableIdx], lastModifiedAt: now }
            return { tables: newTables, lastToolExecutionAt: now }
          }
          return { lastToolExecutionAt: now }
        })
      },

      recordTableDelete: (tableIndex) => {
        logger.info('[AppStore] Recording table delete', { tableIndex })
        set((state) => {
          const newTables = state.tables.filter(t => t.tableIndex !== tableIndex)
          return {
            tables: newTables,
            hasTables: newTables.length > 0,
            lastToolExecutionAt: Date.now()
          }
        })
      },

      getTableInfo: (tableIndex) => {
        return get().tables.find(t => t.tableIndex === tableIndex)
      },

      checkHasTables: () => get().hasTables,

      clearDocumentState: () => {
        logger.info('[AppStore] Clearing document state')
        set({
          tables: [],
          hasTables: false,
          lastToolExecutionAt: null
        })
      },

      setDocumentSessionId: (sessionId) => {
        logger.debug('[AppStore] Setting document session ID', { sessionId })
        set({ documentSessionId: sessionId })
      },

      // === 待执行操作 Actions ===
      createPendingPlan: (planId, title, description, messageId) => {
        const now = new Date().toISOString()
        const plan: PendingPlan = {
          planId,
          title,
          description,
          operations: [],
          status: 'pending',
          messageId,
          createdAt: now,
          updatedAt: now
        }

        set((state) => ({
          pendingPlans: { ...state.pendingPlans, [planId]: plan },
          activePlanId: planId
        }))

        logger.info('[AppStore] Created pending plan', { planId, title })
      },

      addOperation: (planId, operationData) => {
        const operation: PendingOperation = {
          ...operationData,
          id: generateOperationId(),
          createdAt: new Date().toISOString()
        }

        set((state) => {
          const plan = state.pendingPlans[planId]
          if (!plan) {
            logger.warn('[AppStore] Plan not found for adding operation', { planId })
            return state
          }

          return {
            pendingPlans: {
              ...state.pendingPlans,
              [planId]: {
                ...plan,
                operations: [...plan.operations, operation],
                updatedAt: new Date().toISOString()
              }
            }
          }
        })

        logger.debug('[AppStore] Added operation to plan', { planId, operationId: operation.id })
      },

      addOperations: (planId, operationsData) => {
        const operations: PendingOperation[] = operationsData.map((data) => ({
          ...data,
          id: generateOperationId(),
          createdAt: new Date().toISOString()
        }))

        set((state) => {
          const plan = state.pendingPlans[planId]
          if (!plan) {
            logger.warn('[AppStore] Plan not found for adding operations', { planId })
            return state
          }

          return {
            pendingPlans: {
              ...state.pendingPlans,
              [planId]: {
                ...plan,
                operations: [...plan.operations, ...operations],
                updatedAt: new Date().toISOString()
              }
            }
          }
        })

        logger.info('[AppStore] Added operations to plan', { planId, count: operations.length })
      },

      removeOperation: (planId, operationId) => {
        set((state) => {
          const plan = state.pendingPlans[planId]
          if (!plan) return state

          return {
            pendingPlans: {
              ...state.pendingPlans,
              [planId]: {
                ...plan,
                operations: plan.operations.filter((op) => op.id !== operationId),
                updatedAt: new Date().toISOString()
              }
            }
          }
        })

        logger.debug('[AppStore] Removed operation from plan', { planId, operationId })
      },

      setDocumentSnapshot: (planId, snapshot) => {
        set((state) => {
          const plan = state.pendingPlans[planId]
          if (!plan) return state

          return {
            pendingPlans: {
              ...state.pendingPlans,
              [planId]: {
                ...plan,
                documentSnapshot: snapshot,
                updatedAt: new Date().toISOString()
              }
            }
          }
        })

        logger.info('[AppStore] Set document snapshot for plan', { planId, snapshotLength: snapshot.length })
      },

      startApplying: (planId) => {
        set((state) => {
          const plan = state.pendingPlans[planId]
          if (!plan) return state

          return {
            isApplying: true,
            applyProgress: 0,
            currentOperationIndex: 0,
            executionResults: [],
            lastError: null,
            activePlanId: planId,
            pendingPlans: {
              ...state.pendingPlans,
              [planId]: {
                ...plan,
                status: 'applying',
                updatedAt: new Date().toISOString()
              }
            }
          }
        })

        logger.info('[AppStore] Started applying plan', { planId })
      },

      updateApplyProgress: (progress, currentIndex) => {
        set({ applyProgress: progress, currentOperationIndex: currentIndex })
      },

      recordOperationResult: (result) => {
        set((state) => ({
          executionResults: [...state.executionResults, result]
        }))

        logger.debug('[AppStore] Recorded operation result', {
          operationId: result.operationId,
          success: result.success
        })
      },

      completeApply: (planId, success) => {
        set((state) => {
          const plan = state.pendingPlans[planId]
          if (!plan) return state

          return {
            isApplying: false,
            applyProgress: 100,
            currentOperationIndex: -1,
            pendingPlans: {
              ...state.pendingPlans,
              [planId]: {
                ...plan,
                status: success ? 'applied' : 'pending',
                updatedAt: new Date().toISOString()
              }
            }
          }
        })

        logger.info('[AppStore] Completed applying plan', { planId, success })
      },

      rollbackPlan: (planId) => {
        set((state) => {
          const plan = state.pendingPlans[planId]
          if (!plan) return state

          return {
            pendingPlans: {
              ...state.pendingPlans,
              [planId]: {
                ...plan,
                status: 'rolled_back',
                updatedAt: new Date().toISOString()
              }
            }
          }
        })

        logger.info('[AppStore] Rolled back plan', { planId })
      },

      discardPlan: (planId) => {
        set((state) => {
          const plan = state.pendingPlans[planId]
          if (!plan) return state

          return {
            pendingPlans: {
              ...state.pendingPlans,
              [planId]: {
                ...plan,
                status: 'discarded',
                operations: [],
                updatedAt: new Date().toISOString()
              }
            },
            activePlanId: state.activePlanId === planId ? null : state.activePlanId
          }
        })

        logger.info('[AppStore] Discarded plan', { planId })
      },

      clearAllPlans: () => {
        set({
          pendingPlans: {},
          activePlanId: null,
          isApplying: false,
          applyProgress: 0,
          currentOperationIndex: -1,
          executionResults: [],
          lastError: null
        })

        logger.info('[AppStore] Cleared all pending plans')
      },

      getPlan: (planId) => get().pendingPlans[planId],

      getActivePlan: () => {
        const { activePlanId, pendingPlans } = get()
        return activePlanId ? pendingPlans[activePlanId] : undefined
      },

      setActivePlan: (planId) => {
        set({ activePlanId: planId })
      },

      setError: (error) => {
        set({ lastError: error })
        if (error) {
          logger.error('[AppStore] Error set', { error })
        }
      }
    }),
    { name: 'app-store' }
  )
)

// ==================== Selectors ====================

export const selectTableCount = (state: AppState) => state.tables.length
export const selectHasTables = (state: AppState) => state.hasTables
export const selectTables = (state: AppState) => state.tables
export const selectPendingOperationCount = (planId: string) => (state: AppState) => {
  const plan = state.pendingPlans[planId]
  return plan?.operations.length ?? 0
}
export const selectTotalEstimatedTime = (planId: string) => (state: AppState) => {
  const plan = state.pendingPlans[planId]
  if (!plan) return 0
  return plan.operations.reduce((sum, op) => sum + op.estimatedTime, 0)
}
export const selectHighRiskOperationCount = (planId: string) => (state: AppState) => {
  const plan = state.pendingPlans[planId]
  if (!plan) return 0
  return plan.operations.filter((op) => op.riskLevel === 'high' || op.riskLevel === 'critical').length
}
export const selectHasPendingPlans = (state: AppState) => {
  return Object.values(state.pendingPlans).some((plan) => plan.status === 'pending')
}
export const selectAllPendingPlans = (state: AppState) => {
  return Object.values(state.pendingPlans).filter((plan) => plan.status === 'pending')
}

export default useAppStore

