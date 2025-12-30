/**
 * 批量确认 Hook
 * 提供批量确认对话框的状态管理和回调
 */

import React, { useCallback, useState } from 'react'

import { BatchConfirmDialog } from '../components/molecules/BatchConfirmDialog'
import type {
  BatchConfirmOptions,
  BatchConfirmResult,
  ProgressInfo,
  ToolOperationPreview
} from '../services/ai/types'

interface BatchConfirmState {
  isOpen: boolean
  options: BatchConfirmOptions | null
  resolver?: (result: BatchConfirmResult) => void
  isExecuting: boolean
  progress: ProgressInfo | null
}

export function useBatchConfirm() {
  const [state, setState] = useState<BatchConfirmState>({
    isOpen: false,
    options: null,
    isExecuting: false,
    progress: null
  })

  /**
   * 请求批量确认
   */
  const requestBatchConfirm = useCallback(
    (options: BatchConfirmOptions): Promise<BatchConfirmResult> => {
      return new Promise<BatchConfirmResult>((resolve) => {
        setState({
          isOpen: true,
          options,
          resolver: resolve,
          isExecuting: false,
          progress: null
        })
      })
    },
    []
  )

  /**
   * 处理确认
   */
  const handleConfirm = useCallback(
    (selectedIds: string[]) => {
      state.resolver?.({
        confirmed: true,
        selectedIds
      })
      setState((prev) => ({
        ...prev,
        isOpen: false,
        resolver: undefined
      }))
    },
    [state.resolver]
  )

  /**
   * 处理取消
   */
  const handleCancel = useCallback(() => {
    state.resolver?.({
      confirmed: false,
      selectedIds: []
    })
    setState((prev) => ({
      ...prev,
      isOpen: false,
      resolver: undefined
    }))
  }, [state.resolver])

  /**
   * 更新进度
   */
  const updateProgress = useCallback((progress: ProgressInfo) => {
    setState((prev) => ({
      ...prev,
      isExecuting: true,
      progress
    }))
  }, [])

  /**
   * 重置状态
   */
  const resetState = useCallback(() => {
    setState({
      isOpen: false,
      options: null,
      isExecuting: false,
      progress: null
    })
  }, [])

  /**
   * 批量确认对话框组件
   */
  const BatchConfirmDialogComponent = useCallback(
    () =>
      state.options ? (
        <BatchConfirmDialog
          open={state.isOpen}
          title={state.options.title}
          operations={state.options.operations}
          totalEstimatedTime={state.options.totalEstimatedTime}
          highRiskCount={state.options.highRiskCount}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isExecuting={state.isExecuting}
          progress={
            state.progress
              ? {
                  current: state.progress.currentStep,
                  total: state.progress.totalSteps,
                  currentOperation: state.progress.stepDescription
                }
              : undefined
          }
        />
      ) : null,
    [state, handleConfirm, handleCancel]
  )

  return {
    requestBatchConfirm,
    updateProgress,
    resetState,
    isOpen: state.isOpen,
    isExecuting: state.isExecuting,
    BatchConfirmDialog: BatchConfirmDialogComponent
  }
}
