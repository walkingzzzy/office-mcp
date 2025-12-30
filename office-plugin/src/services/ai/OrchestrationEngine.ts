/**
 * 多步骤编排引擎
 * 用于执行复杂的多步骤格式化操作，支持进度回调和错误处理
 */

import Logger from '../../utils/logger'
import { FormattingFunctionRegistry } from './FormattingFunctionRegistry'
import {
  ExecutionReport,
  FunctionResult,
  OrchestrationStep,
  ProgressCallback} from './types'

const logger = new Logger('OrchestrationEngine')

/**
 * 编排引擎配置选项
 */
export interface OrchestrationOptions {
  /** 是否在步骤失败时停止执行 */
  stopOnError?: boolean
  /** 是否启用详细日志 */
  verbose?: boolean
  /** 超时时间（毫秒） */
  timeout?: number
  /** 是否启用步骤验证 */
  validateSteps?: boolean
}

/**
 * 步骤执行状态
 */
export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

/**
 * 步骤执行结果
 */
export interface StepResult {
  /** 步骤序号 */
  stepNumber: number
  /** 函数名称 */
  functionName: string
  /** 执行状态 */
  status: StepStatus
  /** 函数执行结果 */
  result?: FunctionResult
  /** 错误信息 */
  error?: Error
  /** 执行时间（毫秒） */
  executionTime: number
  /** 步骤描述 */
  description?: string
}

/**
 * 编排执行结果
 */
export interface OrchestrationResult {
  /** 执行报告 */
  report: ExecutionReport
  /** 详细步骤结果 */
  stepResults: StepResult[]
  /** 是否成功完成 */
  success: boolean
  /** 执行总时间 */
  totalExecutionTime: number
}

/**
 * 多步骤编排引擎类
 */
export class OrchestrationEngine {
  private registry: FormattingFunctionRegistry

  constructor(registry: FormattingFunctionRegistry) {
    this.registry = registry
    logger.debug('OrchestrationEngine initialized')
  }

  /**
   * 执行编排步骤
   * @param steps 编排步骤列表
   * @param progressCallback 进度回调（可选）
   * @param options 编排选项（可选）
   */
  async executeSteps(
    steps: OrchestrationStep[],
    progressCallback?: ProgressCallback,
    options: OrchestrationOptions = {}
  ): Promise<OrchestrationResult> {
    const startTime = Date.now()
    const operationId = `orchestration-${startTime}`

    logger.info(`[${operationId}] Starting orchestration with ${steps.length} steps`, {
      stepCount: steps.length,
      options
    })

    // 验证步骤
    if (options.validateSteps !== false) {
      this.validateSteps(steps)
    }

    const stepResults: StepResult[] = []
    let successfulSteps = 0
    let failedSteps = 0

    // 设置默认选项
    const opts: Required<OrchestrationOptions> = {
      stopOnError: options.stopOnError ?? true,
      verbose: options.verbose ?? false,
      timeout: options.timeout ?? 30000, // 30秒默认超时
      validateSteps: options.validateSteps ?? true
    }

    // 执行每个步骤
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const stepStartTime = Date.now()

      // 报告进度
      if (progressCallback) {
        progressCallback({
          currentStep: i + 1,
          totalSteps: steps.length,
          stepDescription: step.description,
          functionName: step.functionName,
          percentage: Math.round(((i + 1) / steps.length) * 100)
        })
      }

      const stepResult = await this.executeStep(
        step,
        i + 1,
        operationId,
        opts
      )

      stepResults.push(stepResult)

      // 更新计数器
      if (stepResult.status === StepStatus.COMPLETED) {
        successfulSteps++
      } else if (stepResult.status === StepStatus.FAILED) {
        failedSteps++

        // 决定是否继续执行
        if (opts.stopOnError && !step.skipOnError) {
          logger.warn(`[${operationId}] Stopping orchestration due to step ${i + 1} failure`, {
            functionName: step.functionName,
            error: stepResult.error?.message
          })
          break
        }
      }
    }

    const totalExecutionTime = Date.now() - startTime

    // 生成执行报告
    const report: ExecutionReport = {
      totalSteps: steps.length,
      successfulSteps,
      failedSteps,
      totalExecutionTime,
      stepResults: stepResults.map(sr => ({
        stepNumber: sr.stepNumber,
        functionName: sr.functionName,
        success: sr.status === StepStatus.COMPLETED,
        message: sr.result?.message || sr.error?.message || 'No message',
        executionTime: sr.executionTime,
        error: sr.error
      })),
      overallSuccess: failedSteps === 0
    }

    const result: OrchestrationResult = {
      report,
      stepResults,
      success: report.overallSuccess,
      totalExecutionTime
    }

    logger.info(`[${operationId}] Orchestration completed`, {
      success: result.success,
      successfulSteps,
      failedSteps,
      totalExecutionTime
    })

    return result
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(
    step: OrchestrationStep,
    stepNumber: number,
    operationId: string,
    options: Required<OrchestrationOptions>
  ): Promise<StepResult> {
    const startTime = Date.now()

    logger.info(`[${operationId}] Executing step ${stepNumber}: ${step.functionName}`, {
      description: step.description,
      arguments: step.arguments
    })

    const stepResult: StepResult = {
      stepNumber,
      functionName: step.functionName,
      status: StepStatus.RUNNING,
      executionTime: 0,
      description: step.description
    }

    try {
      // 检查函数是否存在
      const func = this.registry.getFunction(step.functionName)
      if (!func) {
        throw new Error(`Function not found: ${step.functionName}`)
      }

      // 执行函数（带超时控制）
      const result = await this.executeWithTimeout(
        () => this.registry.executeFunction(step.functionName, step.arguments),
        options.timeout
      )

      stepResult.result = result
      stepResult.status = result.success ? StepStatus.COMPLETED : StepStatus.FAILED

      if (options.verbose) {
        logger.debug(`[${operationId}] Step ${stepNumber} result`, {
          success: result.success,
          message: result.message,
          executionTime: Date.now() - startTime
        })
      }

    } catch (error) {
      stepResult.status = StepStatus.FAILED
      stepResult.error = error instanceof Error ? error : new Error(String(error))

      logger.error(`[${operationId}] Step ${stepNumber} failed`, {
        functionName: step.functionName,
        error: stepResult.error?.message
      })
    }

    stepResult.executionTime = Date.now() - startTime

    return stepResult
  }

  /**
   * 带超时的执行函数
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Execution timeout after ${timeoutMs}ms`))
      }, timeoutMs)

      fn()
        .then(result => {
          clearTimeout(timeoutId)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timeoutId)
          reject(error)
        })
    })
  }

  /**
   * 验证编排步骤
   */
  private validateSteps(steps: OrchestrationStep[]): void {
    if (!Array.isArray(steps)) {
      throw new Error('Steps must be an array')
    }

    if (steps.length === 0) {
      throw new Error('At least one step is required')
    }

    if (steps.length > 50) {
      throw new Error('Too many steps (max 50 allowed)')
    }

    // 验证每个步骤
    steps.forEach((step, index) => {
      if (!step.functionName || typeof step.functionName !== 'string') {
        throw new Error(`Step ${index + 1}: Invalid functionName`)
      }

      if (!step.arguments || typeof step.arguments !== 'object') {
        throw new Error(`Step ${index + 1}: Invalid arguments`)
      }

      if (step.stepNumber !== undefined && typeof step.stepNumber !== 'number') {
        throw new Error(`Step ${index + 1}: Invalid stepNumber`)
      }
    })

    logger.debug(`Validated ${steps.length} orchestration steps`)
  }

  /**
   * 创建智能编排步骤
   * 根据文档类型自动生成编排步骤
   */
  createSmartOrchestrationSteps(
    documentType: 'academic' | 'business' | 'casual'
  ): OrchestrationStep[] {
    logger.info(`Creating smart orchestration steps for document type: ${documentType}`)

    const steps: OrchestrationStep[] = []

    switch (documentType) {
      case 'academic':
        steps.push(
          {
            functionName: 'apply_font_formatting',
            arguments: {
              target: 'document',
              name: 'Times New Roman',
              size: 12
            },
            skipOnError: false,
            description: '设置学术论文字体格式'
          },
          {
            functionName: 'apply_paragraph_formatting',
            arguments: {
              target: 'document',
              alignment: 'justified',
              firstLineIndent: 24,
              lineSpacingRule: 'double'
            },
            skipOnError: false,
            description: '设置学术论文段落格式'
          },
          {
            functionName: 'apply_style',
            arguments: {
              styleName: 'Normal',
              target: 'document'
            },
            skipOnError: true,
            description: '应用正文样式'
          }
        )
        break

      case 'business':
        steps.push(
          {
            functionName: 'apply_font_formatting',
            arguments: {
              target: 'document',
              name: 'Calibri',
              size: 11
            },
            skipOnError: false,
            description: '设置商务文档字体格式'
          },
          {
            functionName: 'apply_paragraph_formatting',
            arguments: {
              target: 'document',
              alignment: 'left',
              lineSpacingRule: 'single',
              spaceAfter: 6
            },
            skipOnError: false,
            description: '设置商务文档段落格式'
          }
        )
        break

      case 'casual':
        steps.push(
          {
            functionName: 'apply_font_formatting',
            arguments: {
              target: 'document',
              name: 'Arial',
              size: 11
            },
            skipOnError: false,
            description: '设置休闲文档字体格式'
          },
          {
            functionName: 'apply_paragraph_formatting',
            arguments: {
              target: 'document',
              alignment: 'left',
              lineSpacingRule: 'single'
            },
            skipOnError: false,
            description: '设置休闲文档段落格式'
          }
        )
        break
    }

    logger.info(`Created ${steps.length} smart orchestration steps for ${documentType}`)
    return steps
  }

  /**
   * 创建批量修改样式编排步骤
   */
  createBatchStyleSteps(
    targetStyle: string,
    formattingChanges: Record<string, any>
  ): OrchestrationStep[] {
    logger.info(`Creating batch style steps for: ${targetStyle}`)

    const steps: OrchestrationStep[] = [
      {
        functionName: 'batch_modify_style',
        arguments: {
          targetStyle,
          formatting: formattingChanges
        },
        skipOnError: false,
        description: `批量修改 ${targetStyle} 样式`
      }
    ]

    return steps
  }

  /**
   * 获取编排统计信息
   */
  getStats(): {
    supportedFunctions: number
    availableFunctions: string[]
  } {
    const functions = this.registry.getAllFunctions()

    return {
      supportedFunctions: functions.length,
      availableFunctions: functions.map(f => f.name)
    }
  }
}

/**
 * 便捷函数：创建编排引擎
 */
export function createOrchestrationEngine(registry: FormattingFunctionRegistry): OrchestrationEngine {
  return new OrchestrationEngine(registry)
}

/**
 * 便捷函数：执行编排步骤
 */
export async function executeOrchestration(
  registry: FormattingFunctionRegistry,
  steps: OrchestrationStep[],
  progressCallback?: ProgressCallback,
  options?: OrchestrationOptions
): Promise<OrchestrationResult> {
  const engine = new OrchestrationEngine(registry)
  return engine.executeSteps(steps, progressCallback, options)
}