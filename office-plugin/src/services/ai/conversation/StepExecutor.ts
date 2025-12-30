/**
 * 分步执行器
 * 
 * 逐步执行任务计划中的步骤
 * 支持暂停、继续、跳过、回滚等操作
 */

import Logger from '../../../utils/logger'
import {
  TaskPlan,
  TaskStep,
  TaskStepStatus
} from './ConversationState'
import type { PendingOperation } from '../../../store/appStore'

const logger = new Logger('StepExecutor')

/**
 * 步骤执行结果
 */
export interface StepExecutionResult {
  /** 是否成功 */
  success: boolean
  /** 结果消息 */
  message: string
  /** 返回数据 */
  data?: unknown
  /** 执行时间（毫秒） */
  executionTime: number
  /** 是否可撤销 */
  canUndo: boolean
  /** 撤销操作（如果可撤销） */
  undoAction?: () => Promise<void>
}

/**
 * 执行进度回调
 */
export interface ExecutionProgressCallback {
  /** 步骤开始 */
  onStepStart?: (step: TaskStep, index: number, total: number) => void
  /** 步骤完成 */
  onStepComplete?: (step: TaskStep, result: StepExecutionResult) => void
  /** 步骤失败 */
  onStepFailed?: (step: TaskStep, error: Error) => void
  /** 步骤跳过 */
  onStepSkipped?: (step: TaskStep) => void
  /** 需要确认 */
  onConfirmationNeeded?: (step: TaskStep) => Promise<boolean>
  /** 计划完成 */
  onPlanComplete?: (plan: TaskPlan, results: StepExecutionResult[]) => void
  /** 计划取消 */
  onPlanCancelled?: (plan: TaskPlan, lastCompletedStepIndex: number) => void
}

/**
 * 工具执行器接口（由外部提供）
 */
export interface ToolExecutor {
  execute: (toolName: string, args: Record<string, unknown>) => Promise<{
    success: boolean
    message: string
    data?: unknown
  }>
}

/**
 * 记录的操作（用于 recordOnly 模式）
 */
export interface RecordedOperation {
  stepIndex: number
  toolName: string
  toolArgs: Record<string, unknown>
  description: string
  parametersSummary: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  canUndo: boolean
  estimatedTime: number
}

/**
 * 执行器选项
 */
export interface StepExecutorOptions {
  /** 仅记录模式：不执行操作，只记录到队列 */
  recordOnly?: boolean
}

/**
 * 分步执行器类
 */
export class StepExecutor {
  private isPaused: boolean = false
  private isCancelled: boolean = false
  private currentStepIndex: number = 0
  private executionResults: StepExecutionResult[] = []
  private recordedOperations: RecordedOperation[] = []
  private options: StepExecutorOptions

  constructor(
    private toolExecutor: ToolExecutor,
    private progressCallback?: ExecutionProgressCallback,
    options?: StepExecutorOptions
  ) {
    this.options = options || {}
  }

  /**
   * 执行整个任务计划
   * 
   * @param plan 任务计划
   * @param options 执行选项（可覆盖构造函数中的选项）
   */
  async executePlan(plan: TaskPlan, options?: StepExecutorOptions): Promise<{
    success: boolean
    completedSteps: number
    results: StepExecutionResult[]
    recordedOperations?: RecordedOperation[]
    cancelled: boolean
  }> {
    this.reset()
    this.executionResults = []
    this.recordedOperations = []

    const effectiveOptions = { ...this.options, ...options }
    const isRecordOnly = effectiveOptions.recordOnly === true

    logger.info('[StepExecutor] Starting plan execution', {
      planId: plan.id,
      totalSteps: plan.steps.length,
      recordOnly: isRecordOnly
    })

    // 如果是记录模式，直接记录所有操作
    if (isRecordOnly) {
      return this.recordPlanOperations(plan)
    }

    try {
      for (let i = 0; i < plan.steps.length; i++) {
        // 检查是否取消
        if (this.isCancelled) {
          logger.info('[StepExecutor] Plan cancelled', {
            completedSteps: i,
            totalSteps: plan.steps.length
          })
          this.progressCallback?.onPlanCancelled?.(plan, i - 1)
          return {
            success: false,
            completedSteps: i,
            results: this.executionResults,
            recordedOperations: undefined,
            cancelled: true
          }
        }

        // 等待暂停状态解除
        while (this.isPaused) {
          await this.sleep(100)
          if (this.isCancelled) break
        }

        const step = plan.steps[i]
        this.currentStepIndex = i

        // 检查是否需要确认
        if (step.needsConfirmation && this.progressCallback?.onConfirmationNeeded) {
          const confirmed = await this.progressCallback.onConfirmationNeeded(step)
          if (!confirmed) {
            // 用户跳过此步骤
            this.progressCallback?.onStepSkipped?.(step)
            this.executionResults.push({
              success: true,
              message: '用户跳过',
              executionTime: 0,
              canUndo: false
            })
            continue
          }
        }

        // 执行步骤
        const result = await this.executeStep(step, i, plan.steps.length)
        this.executionResults.push(result)

        // 如果步骤失败且是关键步骤，可以选择停止
        if (!result.success && step.riskLevel === 'high') {
          logger.warn('[StepExecutor] Critical step failed, stopping execution', {
            stepIndex: i,
            stepDescription: step.description
          })
          break
        }
      }

      // 计划完成
      const allSuccess = this.executionResults.every(r => r.success)
      this.progressCallback?.onPlanComplete?.(plan, this.executionResults)

      logger.info('[StepExecutor] Plan execution completed', {
        planId: plan.id,
        success: allSuccess,
        completedSteps: this.executionResults.length
      })

      return {
        success: allSuccess,
        completedSteps: this.executionResults.length,
        results: this.executionResults,
        recordedOperations: undefined,
        cancelled: false
      }

    } catch (error) {
      logger.error('[StepExecutor] Plan execution error', { error })
      throw error
    }
  }

  /**
   * 记录计划中的所有操作（不执行）
   * 用于延迟执行模式
   */
  private async recordPlanOperations(plan: TaskPlan): Promise<{
    success: boolean
    completedSteps: number
    results: StepExecutionResult[]
    recordedOperations: RecordedOperation[]
    cancelled: boolean
  }> {
    this.recordedOperations = []

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i]

      // 通知步骤开始（用于 UI 更新）
      this.progressCallback?.onStepStart?.(step, i, plan.steps.length)

      // 生成参数摘要
      const parametersSummary = this.generateParametersSummary(step.toolName, step.toolArgs)

      // 记录操作
      const recordedOp: RecordedOperation = {
        stepIndex: i,
        toolName: step.toolName,
        toolArgs: step.toolArgs,
        description: step.description,
        parametersSummary,
        riskLevel: step.riskLevel || 'low',
        canUndo: step.canUndo !== false,
        estimatedTime: this.estimateExecutionTime(step.toolName)
      }

      this.recordedOperations.push(recordedOp)

      // 创建一个虚拟的成功结果用于 UI 更新
      const placeholderResult: StepExecutionResult = {
        success: true,
        message: '已记录，等待确认后执行',
        executionTime: 0,
        canUndo: step.canUndo !== false
      }

      this.executionResults.push(placeholderResult)

      // 通知步骤完成
      this.progressCallback?.onStepComplete?.(step, placeholderResult)
    }

    logger.info('[StepExecutor] Plan operations recorded', {
      planId: plan.id,
      recordedCount: this.recordedOperations.length
    })

    return {
      success: true,
      completedSteps: 0, // 实际上没有执行
      results: this.executionResults,
      recordedOperations: this.recordedOperations,
      cancelled: false
    }
  }

  /**
   * 生成参数摘要（用户友好的描述）
   */
  private generateParametersSummary(toolName: string, args: Record<string, any>): string {
    const summaryParts: string[] = []

    if (args.text) {
      const text = String(args.text)
      summaryParts.push(`文本: "${text.length > 20 ? text.substring(0, 20) + '...' : text}"`)
    }
    if (args.searchText) {
      summaryParts.push(`查找: "${args.searchText}"`)
    }
    if (args.replaceText !== undefined) {
      summaryParts.push(`替换为: "${args.replaceText}"`)
    }
    if (args.name) {
      summaryParts.push(`字体: ${args.name}`)
    }
    if (args.size) {
      summaryParts.push(`字号: ${args.size}`)
    }
    if (args.bold !== undefined) {
      summaryParts.push(args.bold ? '加粗' : '取消加粗')
    }
    if (args.styleName) {
      summaryParts.push(`样式: ${args.styleName}`)
    }
    if (args.alignment) {
      const alignmentMap: Record<string, string> = {
        left: '左对齐',
        center: '居中',
        right: '右对齐',
        justify: '两端对齐'
      }
      summaryParts.push(alignmentMap[args.alignment] || args.alignment)
    }

    return summaryParts.length > 0 ? summaryParts.join(', ') : '无参数'
  }

  /**
   * 预估执行时间
   */
  private estimateExecutionTime(toolName: string): number {
    // 根据工具类型预估时间
    if (toolName.includes('smart') || toolName.includes('ai')) {
      return 3000
    }
    if (toolName.includes('table') || toolName.includes('image')) {
      return 1500
    }
    if (toolName.includes('format') || toolName.includes('style')) {
      return 500
    }
    return 1000
  }

  /**
   * 获取记录的操作
   */
  getRecordedOperations(): RecordedOperation[] {
    return [...this.recordedOperations]
  }

  /**
   * 执行单个步骤
   */
  async executeStep(
    step: TaskStep,
    index: number,
    total: number
  ): Promise<StepExecutionResult> {
    const startTime = Date.now()

    logger.info('[StepExecutor] Executing step', {
      stepIndex: index,
      stepDescription: step.description,
      toolName: step.toolName
    })

    // 通知步骤开始
    this.progressCallback?.onStepStart?.(step, index, total)

    try {
      // 调用工具执行器
      const toolResult = await this.toolExecutor.execute(step.toolName, step.toolArgs)

      const executionTime = Date.now() - startTime

      const result: StepExecutionResult = {
        success: toolResult.success,
        message: toolResult.message,
        data: toolResult.data,
        executionTime,
        canUndo: step.canUndo
      }

      if (!toolResult.success) {
        const failureError = new Error(toolResult.message || '执行失败')
        this.progressCallback?.onStepFailed?.(step, failureError)
      }

      // 通知步骤完成（无论成功与否都需要更新 UI）
      this.progressCallback?.onStepComplete?.(step, result)

      if (result.success) {
        logger.info('[StepExecutor] Step completed', {
          stepIndex: index,
          success: result.success,
          executionTime
        })
      } else {
        logger.warn('[StepExecutor] Step completed with errors', {
          stepIndex: index,
          executionTime,
          message: result.message
        })
      }

      return result

    } catch (error: unknown) {
      const err = error as Error
      const executionTime = Date.now() - startTime

      const result: StepExecutionResult = {
        success: false,
        message: err.message || '执行失败',
        executionTime,
        canUndo: false
      }

      // 通知步骤失败
      this.progressCallback?.onStepFailed?.(step, err)

      logger.error('[StepExecutor] Step failed', {
        stepIndex: index,
        error: err.message,
        executionTime
      })

      return result
    }
  }

  /**
   * 暂停执行
   */
  pause(): void {
    this.isPaused = true
    logger.info('[StepExecutor] Execution paused', {
      currentStep: this.currentStepIndex
    })
  }

  /**
   * 继续执行
   */
  resume(): void {
    this.isPaused = false
    logger.info('[StepExecutor] Execution resumed', {
      currentStep: this.currentStepIndex
    })
  }

  /**
   * 取消执行
   */
  cancel(): void {
    this.isCancelled = true
    this.isPaused = false // 确保不会卡在暂停状态
    logger.info('[StepExecutor] Execution cancelled', {
      currentStep: this.currentStepIndex
    })
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.isPaused = false
    this.isCancelled = false
    this.currentStepIndex = 0
    this.executionResults = []
    this.recordedOperations = []
  }

  /**
   * 获取当前状态
   */
  getStatus(): {
    isPaused: boolean
    isCancelled: boolean
    currentStepIndex: number
    completedSteps: number
  } {
    return {
      isPaused: this.isPaused,
      isCancelled: this.isCancelled,
      currentStepIndex: this.currentStepIndex,
      completedSteps: this.executionResults.length
    }
  }

  /**
   * 获取执行结果
   */
  getResults(): StepExecutionResult[] {
    return [...this.executionResults]
  }

  /**
   * 撤销已执行的步骤
   */
  async undoSteps(count: number = 1): Promise<{
    undoneSteps: number
    errors: Error[]
  }> {
    const errors: Error[] = []
    let undoneSteps = 0

    // 从最后执行的步骤开始撤销
    for (let i = this.executionResults.length - 1; i >= 0 && undoneSteps < count; i--) {
      const result = this.executionResults[i]
      if (result.canUndo && result.undoAction) {
        try {
          await result.undoAction()
          undoneSteps++
          logger.info('[StepExecutor] Step undone', { stepIndex: i })
        } catch (error: unknown) {
          const err = error as Error
          errors.push(err)
          logger.error('[StepExecutor] Failed to undo step', {
            stepIndex: i,
            error: err.message
          })
        }
      }
    }

    return { undoneSteps, errors }
  }

  /**
   * 辅助方法：等待
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * 创建步骤执行器的工厂函数
 */
export function createStepExecutor(
  toolExecutor: ToolExecutor,
  progressCallback?: ExecutionProgressCallback,
  options?: StepExecutorOptions
): StepExecutor {
  return new StepExecutor(toolExecutor, progressCallback, options)
}
