/**
 * 任务规划集成 Hook
 * 
 * 将复杂度检测与任务计划 UI 创建整合
 * 当检测到复杂任务时，自动创建任务计划消息块
 */

import { useCallback } from 'react'
import { 
  detectTaskComplexity, 
  getTaskPlanningPrompt,
  type ComplexityResult 
} from '../../../../services/ai/prompts/TaskComplexityDetector'
import { 
  type TaskPlanMessageBlock, 
  MessageBlockType, 
  MessageBlockStatus 
} from '../../../../types/messageBlock'
import { createTaskPlan, type TaskPlan } from '../../../../types/taskPlan'
import Logger from '../../../../utils/logger'
import type { ReviewResult } from '../../../../services/ai/conversation'

const logger = new Logger('useTaskPlanningIntegration')

/**
 * 任务规划集成配置
 */
export interface TaskPlanningIntegrationConfig {
  /** 是否启用自动任务规划 */
  enabled: boolean
  /** 复杂度阈值（默认 3，score >= 阈值触发规划） */
  complexityThreshold?: number
  /** 是否需要用户确认 */
  requiresConfirmation?: boolean
}

/**
 * 创建任务计划消息块的参数
 */
export interface CreateTaskPlanBlockParams {
  messageId: string
  blockId: string
  title: string
  description?: string
  steps: Array<{ description: string; expectedTools?: string[] }>
  requiresConfirmation?: boolean
}

/**
 * 任务规划集成返回类型
 */
export interface TaskPlanningIntegrationReturn {
  /** 检测是否需要任务规划 */
  shouldCreateTaskPlan: (userMessage: string) => ComplexityResult
  /** 创建任务计划消息块 */
  createTaskPlanBlock: (params: CreateTaskPlanBlockParams) => TaskPlanMessageBlock
  /** 创建任务计划对象 */
  createTaskPlanObject: (params: CreateTaskPlanBlockParams) => TaskPlan
  /** 生成任务规划提示词 */
  generatePlanningPrompt: (
    userMessage: string, 
    documentContext?: string, 
    reviewHistory?: ReviewResult | ReviewResult[], 
    formattedContext?: string
  ) => string
  /** 从 AI 响应中解析任务计划 */
  parseTaskPlanFromResponse: (response: string) => ParsedTaskPlan | null
}

/**
 * 解析后的任务计划
 */
export interface ParsedTaskPlan {
  title: string
  description?: string
  steps: Array<{ description: string; expectedTools?: string[] }>
}

/**
 * 任务规划集成 Hook
 */
export function useTaskPlanningIntegration(
  config: TaskPlanningIntegrationConfig
): TaskPlanningIntegrationReturn {
  
  /**
   * 检测是否需要任务规划
   */
  const shouldCreateTaskPlan = useCallback((userMessage: string): ComplexityResult => {
    if (!config.enabled) {
      return {
        complexity: 'simple',
        needsPlanning: false,
        indicators: [],
        confidence: 1.0
      }
    }
    
    const result = detectTaskComplexity(userMessage)
    
    // 可以使用自定义阈值覆盖默认行为
    if (config.complexityThreshold !== undefined) {
      const shouldPlan = result.indicators.length >= config.complexityThreshold
      return {
        ...result,
        needsPlanning: shouldPlan
      }
    }
    
    logger.info('[TASK_PLANNING_INTEGRATION] Complexity detected', {
      message: userMessage.substring(0, 50),
      complexity: result.complexity,
      needsPlanning: result.needsPlanning,
      indicatorCount: result.indicators.length
    })
    
    return result
  }, [config.enabled, config.complexityThreshold])

  /**
   * 创建任务计划对象
   */
  const createTaskPlanObject = useCallback((
    params: CreateTaskPlanBlockParams
  ): TaskPlan => {
    const plan = createTaskPlan(
      params.messageId,
      params.title,
      params.steps,
      {
        description: params.description,
        requiresConfirmation: params.requiresConfirmation ?? config.requiresConfirmation
      }
    )
    
    logger.info('[TASK_PLANNING_INTEGRATION] Task plan created', {
      planId: plan.id,
      title: plan.title,
      stepCount: plan.steps.length
    })
    
    return plan
  }, [config.requiresConfirmation])

  /**
   * 创建任务计划消息块
   */
  const createTaskPlanBlock = useCallback((
    params: CreateTaskPlanBlockParams
  ): TaskPlanMessageBlock => {
    const plan = createTaskPlanObject(params)
    
    const block: TaskPlanMessageBlock = {
      id: params.blockId,
      messageId: params.messageId,
      type: MessageBlockType.TASK_PLAN,
      createdAt: new Date().toISOString(),
      status: MessageBlockStatus.PENDING,
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
      progress: 0,
      requiresConfirmation: plan.requiresConfirmation,
      userConfirmed: plan.userConfirmed
    }
    
    logger.info('[TASK_PLANNING_INTEGRATION] Task plan block created', {
      blockId: block.id,
      planId: block.planId,
      stepCount: block.totalSteps
    })
    
    return block
  }, [createTaskPlanObject])

  /**
   * 生成任务规划提示词
   */
  const generatePlanningPrompt = useCallback((
    userMessage: string, 
    documentContext?: string,
    reviewHistory?: ReviewResult | ReviewResult[],
    formattedContext?: string
  ): string => {
    return getTaskPlanningPrompt(userMessage, documentContext, undefined, reviewHistory, formattedContext)
  }, [])

  /**
   * 从 AI 响应中解析任务计划
   */
  const parseTaskPlanFromResponse = useCallback((
    response: string
  ): ParsedTaskPlan | null => {
    try {
      // 尝试从响应中提取 JSON
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || 
                        response.match(/\{[\s\S]*"title"[\s\S]*"steps"[\s\S]*\}/)
      
      if (!jsonMatch) {
        logger.warn('[TASK_PLANNING_INTEGRATION] No JSON found in response')
        return null
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0]
      const parsed = JSON.parse(jsonStr)

      if (!parsed.title || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
        logger.warn('[TASK_PLANNING_INTEGRATION] Invalid plan structure', { parsed })
        return null
      }

      const result: ParsedTaskPlan = {
        title: parsed.title,
        description: parsed.description,
        steps: parsed.steps.map((step: { description?: string; name?: string; expectedTools?: string[]; tools?: string[] }) => ({
          description: step.description || step.name || '未命名步骤',
          expectedTools: step.expectedTools || step.tools
        }))
      }
      
      logger.info('[TASK_PLANNING_INTEGRATION] Plan parsed successfully', {
        title: result.title,
        stepCount: result.steps.length
      })
      
      return result
    } catch (error) {
      logger.error('[TASK_PLANNING_INTEGRATION] Failed to parse plan', { 
        error, 
        response: response.substring(0, 200) 
      })
      return null
    }
  }, [])

  return {
    shouldCreateTaskPlan,
    createTaskPlanBlock,
    createTaskPlanObject,
    generatePlanningPrompt,
    parseTaskPlanFromResponse
  }
}

export default useTaskPlanningIntegration
