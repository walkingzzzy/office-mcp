/**
 * 任务规划 Hook
 * 
 * 实现类似 Cursor/Claude/Windsurf 的任务拆分功能
 * 让 AI 先分析任务并拆分为步骤列表，然后逐步执行
 */

import { useState, useCallback, useRef } from 'react'
import type { TaskPlan, TaskStep, TaskToolCall } from '../../../../types/taskPlan'
import { 
  createTaskPlan, 
  startTaskPlan, 
  completeCurrentStep, 
  failCurrentStep,
  getCurrentStep,
  getTaskPlanProgress
} from '../../../../types/taskPlan'
import type { TaskPlanMessageBlock } from '../../../../types/messageBlock'
import { MessageBlockType, MessageBlockStatus } from '../../../../types/messageBlock'
import Logger from '../../../../utils/logger'

const logger = new Logger('useTaskPlanning')

/**
 * 任务规划配置
 */
export interface TaskPlanningConfig {
  /** 是否启用任务规划（Agent 模式下启用） */
  enabled: boolean
  /** 是否需要用户确认才能执行 */
  requiresConfirmation?: boolean
  /** 最大重试次数 */
  maxRetries?: number
  /** 步骤超时时间（毫秒） */
  stepTimeout?: number
}

/**
 * 任务规划状态
 */
export interface TaskPlanningState {
  /** 当前任务计划 */
  currentPlan: TaskPlan | null
  /** 是否正在规划 */
  isPlanning: boolean
  /** 是否正在执行 */
  isExecuting: boolean
  /** 错误信息 */
  error: string | null
}

/**
 * 步骤执行函数类型
 */
export type StepExecutor = (
  step: TaskStep,
  plan: TaskPlan
) => Promise<{
  success: boolean
  resultSummary?: string
  toolCalls?: TaskToolCall[]
  error?: string
}>

/**
 * 任务规划 Hook
 */
export function useTaskPlanning(config: TaskPlanningConfig) {
  const [state, setState] = useState<TaskPlanningState>({
    currentPlan: null,
    isPlanning: false,
    isExecuting: false,
    error: null
  })
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const stepExecutorRef = useRef<StepExecutor | null>(null)

  /**
   * 创建任务计划
   */
  const createPlan = useCallback((
    messageId: string,
    title: string,
    steps: Array<{ description: string; expectedTools?: string[] }>,
    description?: string
  ): TaskPlan => {
    logger.info('[TASK_PLANNING] Creating task plan', {
      messageId,
      title,
      stepCount: steps.length
    })

    const plan = createTaskPlan(messageId, title, steps, {
      description,
      requiresConfirmation: config.requiresConfirmation
    })

    setState(prev => ({
      ...prev,
      currentPlan: plan,
      isPlanning: false,
      error: null
    }))

    return plan
  }, [config.requiresConfirmation])

  /**
   * 将 TaskPlan 转换为 TaskPlanMessageBlock
   */
  const planToMessageBlock = useCallback((
    plan: TaskPlan,
    blockId: string
  ): TaskPlanMessageBlock => {
    return {
      id: blockId,
      messageId: plan.messageId,
      type: MessageBlockType.TASK_PLAN,
      createdAt: plan.createdAt,
      status: plan.status === 'executing' 
        ? MessageBlockStatus.PROCESSING 
        : plan.status === 'completed'
          ? MessageBlockStatus.SUCCESS
          : plan.status === 'failed'
            ? MessageBlockStatus.ERROR
            : MessageBlockStatus.PENDING,
      planId: plan.id,
      title: plan.title,
      description: plan.description,
      planStatus: plan.status,
      steps: plan.steps.map(step => ({
        id: step.id,
        index: step.index,
        description: step.description,
        status: step.status,
        resultSummary: step.resultSummary,
        error: step.error,
        expectedTools: step.expectedTools,
        sourceIssueId: step.sourceIssueId,
        sourceIssueText: step.sourceIssueText,
        issueType: step.issueType,
        locationHint: step.locationHint,
        dependsOn: step.dependsOn
      })),
      currentStepIndex: plan.currentStepIndex,
      totalSteps: plan.totalSteps,
      completedSteps: plan.completedSteps,
      progress: getTaskPlanProgress(plan),
      requiresConfirmation: plan.requiresConfirmation,
      userConfirmed: plan.userConfirmed
    }
  }, [])

  /**
   * 设置步骤执行器
   */
  const setStepExecutor = useCallback((executor: StepExecutor) => {
    stepExecutorRef.current = executor
  }, [])

  /**
   * 开始执行任务计划
   */
  const startExecution = useCallback(async (
    plan: TaskPlan,
    onPlanUpdate: (plan: TaskPlan) => void
  ): Promise<TaskPlan> => {
    if (!stepExecutorRef.current) {
      throw new Error('Step executor not set')
    }

    logger.info('[TASK_PLANNING] Starting execution', {
      planId: plan.id,
      totalSteps: plan.totalSteps
    })

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController()
    
    // 开始执行
    let currentPlan = startTaskPlan(plan)
    setState(prev => ({ ...prev, currentPlan, isExecuting: true }))
    onPlanUpdate(currentPlan)

    const executor = stepExecutorRef.current

    // 逐步执行
    while (currentPlan.status === 'executing') {
      // 检查是否被中止
      if (abortControllerRef.current?.signal.aborted) {
        logger.info('[TASK_PLANNING] Execution aborted', { planId: plan.id })
        break
      }

      const currentStep = getCurrentStep(currentPlan)
      if (!currentStep) {
        break
      }

      logger.info('[TASK_PLANNING] Executing step', {
        planId: plan.id,
        stepIndex: currentStep.index,
        stepDescription: currentStep.description
      })

      try {
        // 执行当前步骤
        const result = await executor(currentStep, currentPlan)

        if (result.success) {
          // 步骤成功
          currentPlan = completeCurrentStep(currentPlan, {
            resultSummary: result.resultSummary,
            toolCalls: result.toolCalls
          })
          logger.info('[TASK_PLANNING] Step completed', {
            planId: plan.id,
            stepIndex: currentStep.index,
            completedSteps: currentPlan.completedSteps
          })
        } else {
          // 步骤失败
          currentPlan = failCurrentStep(currentPlan, result.error || '步骤执行失败')
          logger.error('[TASK_PLANNING] Step failed', {
            planId: plan.id,
            stepIndex: currentStep.index,
            error: result.error
          })
        }

        // 更新状态和通知外部
        setState(prev => ({ ...prev, currentPlan }))
        onPlanUpdate(currentPlan)

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误'
        currentPlan = failCurrentStep(currentPlan, errorMessage)
        setState(prev => ({ ...prev, currentPlan, error: errorMessage }))
        onPlanUpdate(currentPlan)
        logger.error('[TASK_PLANNING] Step execution error', {
          planId: plan.id,
          stepIndex: currentStep.index,
          error: errorMessage
        })
        break
      }
    }

    setState(prev => ({ ...prev, isExecuting: false }))
    
    logger.info('[TASK_PLANNING] Execution finished', {
      planId: plan.id,
      status: currentPlan.status,
      completedSteps: currentPlan.completedSteps,
      totalSteps: currentPlan.totalSteps
    })

    return currentPlan
  }, [])

  /**
   * 暂停执行
   */
  const pauseExecution = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      logger.info('[TASK_PLANNING] Execution paused')
    }
  }, [])

  /**
   * 取消任务
   */
  const cancelTask = useCallback(() => {
    pauseExecution()
    setState(prev => ({
      ...prev,
      currentPlan: prev.currentPlan 
        ? { ...prev.currentPlan, status: 'cancelled' }
        : null,
      isExecuting: false
    }))
    logger.info('[TASK_PLANNING] Task cancelled')
  }, [pauseExecution])

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    pauseExecution()
    setState({
      currentPlan: null,
      isPlanning: false,
      isExecuting: false,
      error: null
    })
  }, [pauseExecution])

  return {
    // 状态
    ...state,
    
    // 方法
    createPlan,
    planToMessageBlock,
    setStepExecutor,
    startExecution,
    pauseExecution,
    cancelTask,
    reset,
    
    // 工具方法
    getCurrentStep: () => state.currentPlan ? getCurrentStep(state.currentPlan) : null,
    getProgress: () => state.currentPlan ? getTaskPlanProgress(state.currentPlan) : 0
  }
}

/**
 * 解析 AI 返回的任务计划
 * 
 * AI 应该返回类似以下格式的 JSON：
 * {
 *   "title": "修复文档排版问题",
 *   "steps": [
 *     { "description": "统一标题格式", "expectedTools": ["word_set_bold", "word_set_font_size"] },
 *     { "description": "调整段落间距", "expectedTools": ["word_set_paragraph_spacing"] },
 *     ...
 *   ]
 * }
 */
export function parseTaskPlanFromAI(response: string): {
  title: string
  description?: string
  steps: Array<{ description: string; expectedTools?: string[] }>
} | null {
  try {
    // 尝试从响应中提取 JSON
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || 
                      response.match(/\{[\s\S]*"title"[\s\S]*"steps"[\s\S]*\}/)
    
    if (!jsonMatch) {
      logger.warn('[TASK_PLANNING] No JSON found in response')
      return null
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonStr)

    if (!parsed.title || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      logger.warn('[TASK_PLANNING] Invalid plan structure', { parsed })
      return null
    }

    return {
      title: parsed.title,
      description: parsed.description,
      steps: parsed.steps.map((step: { description?: string; name?: string; expectedTools?: string[]; tools?: string[] }) => ({
        description: step.description || step.name || '未命名步骤',
        expectedTools: step.expectedTools || step.tools
      }))
    }
  } catch (error) {
    logger.error('[TASK_PLANNING] Failed to parse plan', { error, response: response.substring(0, 200) })
    return null
  }
}

/**
 * 生成任务规划的系统提示词
 */
export function getTaskPlanningPrompt(userRequest: string, documentContext?: string): string {
  return `你是一个专业的文档编辑助手。用户请求你对文档进行修改。

请分析用户的请求，并将任务拆分为可执行的步骤列表。每个步骤应该是一个独立的、可验证的操作。

用户请求：${userRequest}

${documentContext ? `当前文档内容摘要：\n${documentContext.substring(0, 500)}...\n\n` : ''}

请以 JSON 格式返回任务计划：
\`\`\`json
{
  "title": "任务标题（简短描述）",
  "description": "任务整体说明（可选）",
  "steps": [
    {
      "description": "步骤描述",
      "expectedTools": ["可能用到的工具名称"]
    }
  ]
}
\`\`\`

要求：
1. 步骤数量控制在 3-8 个之间
2. 每个步骤描述清晰、具体
3. 按照合理的执行顺序排列
4. 避免步骤之间有冲突或重复`
}

export default useTaskPlanning
