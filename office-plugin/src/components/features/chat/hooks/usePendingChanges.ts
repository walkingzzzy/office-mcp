/**
 * usePendingChanges - 待执行修改处理 Hook
 * 从 ChatInterface.tsx 提取的延迟执行相关逻辑
 */

import { useCallback } from 'react'
import { wordService } from '../../../../services/WordService'
import { useAppStore } from '../../../../store/appStore'
import Logger from '../../../../utils/logger'

const logger = new Logger('usePendingChanges')

export interface UsePendingChangesOptions {
  executeConfirmedTools: (tools: Array<{ toolName: string; args: Record<string, unknown> }>) => Promise<void>
}

export interface UsePendingChangesReturn {
  handleApplyPendingChanges: (planId: string) => Promise<void>
  handleDiscardPendingChanges: (planId: string) => void
  handleRollbackChanges: (planId: string) => Promise<void>
}

export function usePendingChanges({
  executeConfirmedTools
}: UsePendingChangesOptions): UsePendingChangesReturn {
  
  const pendingOpsStore = useAppStore()

  // 应用待执行的修改
  const handleApplyPendingChanges = useCallback(async (planId: string) => {
    const plan = pendingOpsStore.getPlan(planId)
    if (!plan || plan.operations.length === 0) return

    logger.info('[PENDING_OPS] Starting to apply pending changes', {
      planId,
      operationCount: plan.operations.length
    })

    pendingOpsStore.startApplying(planId)

    try {
      // 保存文档快照用于回滚
      const docContent = await wordService.readDocument()
      pendingOpsStore.setDocumentSnapshot(planId, docContent.text)

      // 依次执行每个操作
      for (let i = 0; i < plan.operations.length; i++) {
        const op = plan.operations[i]
        const progress = Math.round(((i + 1) / plan.operations.length) * 100)
        pendingOpsStore.updateApplyProgress(progress, i)

        try {
          // 执行工具调用
          await executeConfirmedTools([{
            toolName: op.toolName,
            args: op.toolArgs
          }])

          pendingOpsStore.recordOperationResult({
            operationId: op.id,
            success: true,
            message: '执行成功',
            executionTime: op.estimatedTime
          })
        } catch (error: unknown) {
          const err = error as Error
          pendingOpsStore.recordOperationResult({
            operationId: op.id,
            success: false,
            message: err.message || '执行失败',
            executionTime: 0
          })
          logger.error('[PENDING_OPS] Operation failed', { operationId: op.id, error })
        }
      }

      pendingOpsStore.completeApply(planId, true)
      logger.info('[PENDING_OPS] All pending changes applied')
    } catch (error) {
      pendingOpsStore.completeApply(planId, false)
      logger.error('[PENDING_OPS] Failed to apply pending changes', { error })
    }
  }, [pendingOpsStore, executeConfirmedTools])

  // 放弃待执行的修改
  const handleDiscardPendingChanges = useCallback((planId: string) => {
    pendingOpsStore.discardPlan(planId)
    logger.info('[PENDING_OPS] Pending changes discarded', { planId })
  }, [pendingOpsStore])

  // 回滚已应用的修改
  const handleRollbackChanges = useCallback(async (planId: string) => {
    const plan = pendingOpsStore.getPlan(planId)
    if (!plan?.documentSnapshot) {
      logger.warn('[PENDING_OPS] No snapshot available for rollback', { planId })
      return
    }

    try {
      // 恢复文档快照
      await wordService.replaceDocumentContent(plan.documentSnapshot)
      pendingOpsStore.rollbackPlan(planId)
      logger.info('[PENDING_OPS] Changes rolled back successfully', { planId })
    } catch (error) {
      logger.error('[PENDING_OPS] Failed to rollback changes', { planId, error })
    }
  }, [pendingOpsStore])

  return {
    handleApplyPendingChanges,
    handleDiscardPendingChanges,
    handleRollbackChanges
  }
}
