/**
 * useMultiTurnHandlers - 多轮对话处理 Hook
 * 从 ChatInterface.tsx 提取的多轮对话相关逻辑
 */

import { useCallback } from 'react'
import type { Message, TaskPlanMessageBlock } from '../../../../types/messageBlock'
import { MessageBlockType, MessageBlockStatus } from '../../../../types/messageBlock'
import type { ClarificationQuestion, TaskPlan, PlanPreview } from '../../../../services/ai/conversation'
import { previewGenerator } from '../../../../services/ai/conversation'
import { wordService } from '../../../../services/WordService'
import { useAppStore } from '../../../../store/appStore'
import Logger from '../../../../utils/logger'

const logger = new Logger('useMultiTurnHandlers')

export interface UseMultiTurnHandlersOptions {
  multiTurn: {
    handleClarificationAnswer: (
      sessionId: string,
      questionId: string,
      answer: string,
      selectedOptionId?: string
    ) => { shouldProceed: boolean; enhancedIntent?: string; clarificationQuestion?: ClarificationQuestion }
    confirmTaskPlan: (sessionId: string) => void
    cancelSession: (sessionId: string) => void
    currentSession?: { originalIntent?: string }
  }
  activeClarification: ClarificationQuestion | null
  setActiveClarification: (q: ClarificationQuestion | null) => void
  activeSessionId: string | null
  setActiveSessionId: (id: string | null) => void
  activeTaskPlan: TaskPlan | null
  setActiveTaskPlan: (plan: TaskPlan | null) => void
  setIsExecutingPlan: (executing: boolean) => void
  setCurrentStepIndex: (index: number) => void
  setActivePreview: (preview: PlanPreview | null) => void
  setPendingToolCalls: (calls: Array<{ toolName: string; args: Record<string, unknown> }> | null) => void
  setInputText: (text: string) => void
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  executeTaskPlan: (
    plan: TaskPlan,
    onStepComplete: (stepIndex: number, result: { success: boolean; message: string }) => void
  ) => Promise<void>
  executeConfirmedTools: (tools: Array<{ toolName: string; args: Record<string, unknown> }>) => Promise<void>
  handleSendMessage: () => Promise<void>
}

export interface UseMultiTurnHandlersReturn {
  handleClarificationAnswer: (answer: string, selectedOptionId?: string) => void
  handleConfirmTaskPlan: () => Promise<void>
  handleCancelMultiTurn: () => void
  handleSkipClarification: () => void
  generatePlanPreview: (plan: TaskPlan) => void
  handleConfirmPreview: () => Promise<void>
  handleCancelPreview: () => void
  updateTaskPlanBlockStatus: (
    planId: string,
    status: 'ready' | 'executing' | 'completed' | 'failed',
    stepUpdates?: { stepIndex: number; stepStatus: string; resultSummary?: string; error?: string }
  ) => void
}

export function useMultiTurnHandlers({
  multiTurn,
  activeClarification,
  setActiveClarification,
  activeSessionId,
  setActiveSessionId,
  activeTaskPlan,
  setActiveTaskPlan,
  setIsExecutingPlan,
  setCurrentStepIndex,
  setActivePreview,
  setPendingToolCalls,
  setInputText,
  setMessages,
  executeTaskPlan,
  executeConfirmedTools,
  handleSendMessage
}: UseMultiTurnHandlersOptions): UseMultiTurnHandlersReturn {
  
  // 更新消息列表中的 TaskPlanMessageBlock 状态
  const updateTaskPlanBlockStatus = useCallback((
    planId: string, 
    status: 'ready' | 'executing' | 'completed' | 'failed',
    stepUpdates?: { stepIndex: number; stepStatus: string; resultSummary?: string; error?: string }
  ) => {
    setMessages((prev) => prev.map((msg) => ({
      ...msg,
      blocks: msg.blocks.map((block) => {
        if (block.type === MessageBlockType.TASK_PLAN) {
          const taskBlock = block as TaskPlanMessageBlock
          if (taskBlock.planId === planId) {
            const updatedBlock: TaskPlanMessageBlock = {
              ...taskBlock,
              planStatus: status,
              status: status === 'executing' 
                ? MessageBlockStatus.PROCESSING 
                : status === 'completed' 
                  ? MessageBlockStatus.SUCCESS 
                  : status === 'failed' 
                    ? MessageBlockStatus.ERROR 
                    : MessageBlockStatus.PENDING
            }
            
            if (stepUpdates) {
              updatedBlock.steps = taskBlock.steps.map((step, idx) => 
                idx === stepUpdates.stepIndex 
                  ? { 
                      ...step, 
                      status: stepUpdates.stepStatus as any,
                      resultSummary: stepUpdates.resultSummary,
                      error: stepUpdates.error
                    }
                  : step
              )
              updatedBlock.currentStepIndex = stepUpdates.stepIndex
              updatedBlock.completedSteps = taskBlock.steps.filter(
                (s, i) => i < stepUpdates.stepIndex || (i === stepUpdates.stepIndex && stepUpdates.stepStatus === 'completed')
              ).length
              updatedBlock.progress = Math.round((updatedBlock.completedSteps / updatedBlock.totalSteps) * 100)
            }
            
            return updatedBlock
          }
        }
        return block
      })
    })))
  }, [setMessages])

  // 处理澄清问题回答
  const handleClarificationAnswer = useCallback((answer: string, selectedOptionId?: string) => {
    if (!activeClarification || !activeSessionId) return

    const result = multiTurn.handleClarificationAnswer(
      activeSessionId,
      activeClarification.id,
      answer,
      selectedOptionId
    )

    logger.info('[MULTI_TURN] Clarification answered', {
      sessionId: activeSessionId,
      questionId: activeClarification.id,
      shouldProceed: result.shouldProceed
    })

    if (result.shouldProceed) {
      setActiveClarification(null)
      if (result.enhancedIntent) {
        setInputText(result.enhancedIntent)
        setTimeout(() => handleSendMessage(), 100)
      }
    } else if (result.clarificationQuestion) {
      setActiveClarification(result.clarificationQuestion)
    }
  }, [activeClarification, activeSessionId, multiTurn, setActiveClarification, setInputText, handleSendMessage])

  // 处理任务计划确认
  const handleConfirmTaskPlan = useCallback(async () => {
    if (!activeTaskPlan) return

    if (activeSessionId) {
      try {
        multiTurn.confirmTaskPlan(activeSessionId)
      } catch (error) {
        logger.warn('[MULTI_TURN] Could not confirm in store, but proceeding with execution', { error })
      }
    }
    
    logger.info('[MULTI_TURN] Task plan confirmed, starting execution', {
      sessionId: activeSessionId,
      planId: activeTaskPlan.id
    })

    updateTaskPlanBlockStatus(activeTaskPlan.id, 'executing')
    setIsExecutingPlan(true)
    setCurrentStepIndex(0)

    try {
      await executeTaskPlan(activeTaskPlan, (stepIndex, stepResult) => {
        setCurrentStepIndex(stepIndex + 1)
        updateTaskPlanBlockStatus(activeTaskPlan.id, 'executing', {
          stepIndex,
          stepStatus: stepResult.success ? 'completed' : 'failed',
          resultSummary: stepResult.message,
          error: stepResult.success ? undefined : stepResult.message
        })
        logger.info('[MULTI_TURN] Step completed', { stepIndex, success: stepResult.success })
      })

      updateTaskPlanBlockStatus(activeTaskPlan.id, 'completed')
      logger.info('[MULTI_TURN] Task plan execution completed')
    } catch (error) {
      updateTaskPlanBlockStatus(activeTaskPlan.id, 'failed')
      logger.error('[MULTI_TURN] Task plan execution failed', { error })
    } finally {
      setActiveTaskPlan(null)
      setIsExecutingPlan(false)
      setCurrentStepIndex(-1)
    }
  }, [activeTaskPlan, activeSessionId, multiTurn, executeTaskPlan, updateTaskPlanBlockStatus, setIsExecutingPlan, setCurrentStepIndex, setActiveTaskPlan])

  // 取消多轮对话
  const handleCancelMultiTurn = useCallback(() => {
    if (activeSessionId) {
      multiTurn.cancelSession(activeSessionId)
    }
    setActiveClarification(null)
    setActiveTaskPlan(null)
    setActiveSessionId(null)
    setIsExecutingPlan(false)
    setCurrentStepIndex(-1)
  }, [activeSessionId, multiTurn, setActiveClarification, setActiveTaskPlan, setActiveSessionId, setIsExecutingPlan, setCurrentStepIndex])

  // 跳过澄清问题
  const handleSkipClarification = useCallback(() => {
    setActiveClarification(null)
    if (multiTurn.currentSession?.originalIntent) {
      setInputText(multiTurn.currentSession.originalIntent)
      setTimeout(() => handleSendMessage(), 100)
    }
  }, [multiTurn, setActiveClarification, setInputText, handleSendMessage])

  // 生成任务计划预览
  const generatePlanPreview = useCallback((plan: TaskPlan) => {
    const preview = previewGenerator.generatePlanPreview(plan)
    setActivePreview(preview)
    
    const toolCalls = plan.steps.map(step => ({
      toolName: step.toolName,
      args: step.toolArgs
    }))
    setPendingToolCalls(toolCalls)
    
    logger.info('[PREVIEW] Generated plan preview', {
      planId: plan.id,
      stepCount: plan.steps.length,
      overallRisk: preview.overallRisk
    })
  }, [setActivePreview, setPendingToolCalls])

  // 确认预览执行
  const handleConfirmPreview = useCallback(async () => {
    // 从 store 获取 pendingToolCalls
    const pendingOpsStore = useAppStore.getState()
    const pendingToolCalls = pendingOpsStore.activePlanId 
      ? pendingOpsStore.getPlan(pendingOpsStore.activePlanId)?.operations.map(op => ({
          toolName: op.toolName,
          args: op.toolArgs
        }))
      : null

    if (!pendingToolCalls || pendingToolCalls.length === 0) return

    logger.info('[PREVIEW] User confirmed preview, executing tools', {
      toolCount: pendingToolCalls.length
    })

    setActivePreview(null)
    
    try {
      await executeConfirmedTools(pendingToolCalls)
      logger.info('[PREVIEW] All tools executed successfully')
    } catch (error) {
      logger.error('[PREVIEW] Tool execution failed', { error })
    } finally {
      setPendingToolCalls(null)
    }
  }, [executeConfirmedTools, setActivePreview, setPendingToolCalls])

  // 取消预览
  const handleCancelPreview = useCallback(() => {
    setActivePreview(null)
    setPendingToolCalls(null)
    logger.info('[PREVIEW] User cancelled preview')
  }, [setActivePreview, setPendingToolCalls])

  return {
    handleClarificationAnswer,
    handleConfirmTaskPlan,
    handleCancelMultiTurn,
    handleSkipClarification,
    generatePlanPreview,
    handleConfirmPreview,
    handleCancelPreview,
    updateTaskPlanBlockStatus
  }
}
