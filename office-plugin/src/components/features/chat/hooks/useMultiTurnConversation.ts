/**
 * useMultiTurnConversation Hook
 * 
 * 多轮对话逻辑封装，处理：
 * - 意图分析与分类
 * - 澄清对话流程
 * - 对话状态管理
 * - 与现有工具调用的集成
 */

import { useCallback, useMemo } from 'react'

import {
  ConversationPhase,
  ClarificationQuestion,
  TaskPlan,
  clarificationEngine,
  createClarificationQuestion,
  taskDecomposer,
  reviewContextExtractor,
  type ReviewResult,
  type ContextExtractionResult
} from '../../../../services/ai/conversation'
import { IntentExtractor } from '../../../../services/ai/prompts/IntentExtractor'
import { detectTaskComplexity, type ComplexityResult } from '../../../../services/ai/prompts/TaskComplexityDetector'
import { EnhancedIntentType, type EnhancedUserIntent } from '../../../../services/ai/prompts/types'
import type { Message } from '../../../../types/messageBlock'
import {
  useMultiTurnStore,
  selectCurrentSession,
  selectMultiTurnEnabled
} from '../../../../store/multiTurnStore'
import Logger from '../../../../utils/logger'

const logger = new Logger('useMultiTurnConversation')

/**
 * 多轮对话处理结果
 */
export interface MultiTurnResult {
  /** 处理类型 */
  type: 'direct_execute' | 'clarification' | 'confirmation' | 'cancel' | 'continue' | 'modification' | 'planning'
  /** 是否应该继续执行原有的工具调用流程 */
  shouldProceed: boolean
  /** 澄清问题（如果需要） */
  clarificationQuestion?: ClarificationQuestion
  /** 任务计划（如果是复杂任务） */
  taskPlan?: TaskPlan
  /** 增强后的用户意图 */
  enhancedIntent?: string
  /** 原始意图分析结果 */
  intentAnalysis?: EnhancedUserIntent
  /** 复杂度检测结果 */
  complexityResult?: ComplexityResult
  /** 会话 ID */
  sessionId?: string
  /** 当前阶段 */
  phase?: ConversationPhase
  /** 🆕 上下文提取结果 */
  contextExtraction?: ContextExtractionResult
  /** 🆕 审查结果（如果有） */
  reviewResult?: ReviewResult
  /** 🆕 格式化的上下文（用于注入 prompt） */
  formattedContext?: string
  /** 🆕 是否是纯查询意图（不需要执行工具，只需要返回分析结果） */
  isQueryOnly?: boolean
}

/**
 * Hook 配置选项
 */
export interface UseMultiTurnConversationOptions {
  /** 是否强制启用（覆盖全局设置） */
  forceEnabled?: boolean
}

/**
 * 多轮对话 Hook
 */
export function useMultiTurnConversation(options: UseMultiTurnConversationOptions = {}) {
  const { forceEnabled } = options

  // Store 状态和方法
  const store = useMultiTurnStore()
  const currentSession = useMultiTurnStore(selectCurrentSession)
  const isGlobalEnabled = useMultiTurnStore(selectMultiTurnEnabled)

  // 是否启用多轮对话
  const isEnabled = forceEnabled ?? isGlobalEnabled

  // 意图提取器
  const intentExtractor = useMemo(() => new IntentExtractor(), [])

  /**
   * 分析用户输入，决定如何处理
   * 
   * @param userMessage 用户消息
   * @param existingSessionId 现有会话 ID
   * @param messageHistory 🆕 对话历史（用于上下文关联）
   */
  const analyzeInput = useCallback((
    userMessage: string,
    existingSessionId?: string,
    messageHistory?: Message[]
  ): MultiTurnResult => {
    // 如果未启用多轮对话，直接执行
    if (!isEnabled) {
      logger.debug('[MultiTurn] Disabled, proceeding with direct execution')
      return {
        type: 'direct_execute',
        shouldProceed: true
      }
    }

    // 分析意图
    const intentAnalysis = intentExtractor.extractEnhancedIntent(userMessage)
    
    // 🆕 复杂度检测：使用 TaskComplexityDetector 进行更精细的复杂度判断
    const complexityResult = detectTaskComplexity(userMessage)
    
    // 🆕 上下文关联：检测是否引用之前的审查结果
    let contextExtraction: ContextExtractionResult | undefined
    let reviewResult: ReviewResult | undefined
    let formattedContext: string | undefined
    
    // 🆕 优先从 Store 获取最新审查结果（避免每次都扫描消息历史）
    const storeContext = store.getLatestReviewContext()
    if (storeContext.reviewResult) {
      reviewResult = storeContext.reviewResult
      formattedContext = storeContext.formattedContext || undefined
      logger.debug('[MultiTurn] Using cached review context from Store', {
        issueCount: reviewResult.issues?.length
      })
    }
    
    // 如果 Store 中没有，再从消息历史中提取
    if (!reviewResult && messageHistory && messageHistory.length > 0) {
      contextExtraction = reviewContextExtractor.extractContext(userMessage, messageHistory)
      
      if (contextExtraction.hasContextReference && contextExtraction.reviewResult) {
        reviewResult = contextExtraction.reviewResult
        formattedContext = contextExtraction.formattedContext
        
        // 🆕 将提取的上下文写入 Store（避免下次重复扫描）
        const sourceMessageId = contextExtraction.reviewResult.messageId || 'unknown'
        store.saveReviewContext(reviewResult, formattedContext || '', sourceMessageId)
        
        logger.info('[MultiTurn] Context reference detected and cached to Store', {
          referenceType: contextExtraction.referenceType,
          issueCount: reviewResult.issues.length,
          confidence: contextExtraction.confidence
        })
      }
    }
    
    // 🆕 检测用户输入是否包含上下文引用（即使已有缓存也要检测）
    if (!contextExtraction && reviewResult) {
      contextExtraction = reviewContextExtractor.extractContext(userMessage, [])
      // 如果检测到引用，使用缓存的审查结果
      if (contextExtraction.hasContextReference) {
        contextExtraction = {
          ...contextExtraction,
          reviewResult,
          formattedContext
        }
      }
    }
    
    logger.info('[MultiTurn] Intent & complexity analyzed', {
      input: userMessage.substring(0, 50),
      enhancedType: intentAnalysis.enhancedType,
      needsClarification: intentAnalysis.needsClarification,
      isDialogControl: intentAnalysis.isDialogControl,
      // 复杂度检测结果
      complexity: complexityResult.complexity,
      needsPlanning: complexityResult.needsPlanning,
      suggestedStepCount: complexityResult.suggestedStepCount,
      indicators: complexityResult.indicators,
      // 🆕 上下文关联结果
      hasContextReference: contextExtraction?.hasContextReference,
      contextReferenceType: contextExtraction?.referenceType
    })

    // 获取或创建会话
    let sessionId = existingSessionId || currentSession?.sessionId
    
    // 如果有现有会话，检查是否是对话控制指令
    if (sessionId && currentSession) {
      const controlResult = handleDialogControl(intentAnalysis, currentSession.phase)
      if (controlResult && controlResult.type && controlResult.shouldProceed !== undefined) {
        return {
          type: controlResult.type,
          shouldProceed: controlResult.shouldProceed,
          sessionId,
          phase: currentSession.phase,
          intentAnalysis,
          complexityResult
        }
      }
    }

    // 🆕 复杂度检测优先：如果复杂度检测器认为需要规划，强制走任务规划流程
    // 这使得 TaskComplexityDetector 的丰富检测逻辑能够覆盖 IntentExtractor 的简单判断
    if (complexityResult.needsPlanning && 
        intentAnalysis.enhancedType !== EnhancedIntentType.QUERY &&
        !intentAnalysis.isDialogControl) {
      logger.info('[MultiTurn] Complexity detector triggered planning', {
        complexity: complexityResult.complexity,
        suggestedStepCount: complexityResult.suggestedStepCount,
        hasReviewResult: !!reviewResult
      })
      // 🆕 传递审查结果
      return handleComplexTask(userMessage, intentAnalysis, sessionId, complexityResult, reviewResult)
    }

    // 🆕 如果检测到上下文引用（如"修改这些问题"），且有审查结果，触发任务规划
    if (contextExtraction?.hasContextReference && reviewResult && reviewResult.issues.length > 0) {
      logger.info('[MultiTurn] Context reference triggered planning with review result', {
        referenceType: contextExtraction.referenceType,
        issueCount: reviewResult.issues.length
      })
      return handleComplexTask(userMessage, intentAnalysis, sessionId, complexityResult, reviewResult)
    }

    // 根据意图类型决定处理方式
    switch (intentAnalysis.enhancedType) {
      case EnhancedIntentType.VAGUE_REQUEST:
        // 模糊请求 - 需要澄清
        return handleVagueRequest(userMessage, intentAnalysis, sessionId)

      case EnhancedIntentType.COMPLEX_TASK:
        // 复杂任务 - 尝试分解为步骤（传递复杂度检测结果和审查结果）
        return handleComplexTask(userMessage, intentAnalysis, sessionId, complexityResult, reviewResult)

      case EnhancedIntentType.QUERY:
        // 🆕 查询类 - 直接执行，标记为纯查询（不应该触发任务规划）
        logger.info('[MultiTurn] Query intent detected, skipping task planning', {
          userMessage: userMessage.substring(0, 50),
          hasReviewResult: !!reviewResult
        })
        return {
          type: 'direct_execute',
          shouldProceed: true,
          intentAnalysis,
          complexityResult,
          sessionId,
          contextExtraction,
          reviewResult,
          formattedContext,
          // 🆕 标记为纯查询，后续处理不应该尝试执行工具
          isQueryOnly: true
        } as MultiTurnResult

      case EnhancedIntentType.DIRECT_COMMAND:
      default:
        // 直接命令 - 直接执行（包含上下文信息供后续使用）
        return {
          type: 'direct_execute',
          shouldProceed: true,
          intentAnalysis,
          complexityResult,
          sessionId,
          contextExtraction,
          reviewResult,
          formattedContext
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled, intentExtractor, currentSession, store])

  /**
   * 处理对话控制指令
   */
  const handleDialogControl = useCallback((
    intentAnalysis: EnhancedUserIntent,
    currentPhase: ConversationPhase
  ): Partial<MultiTurnResult> | null => {
    if (!intentAnalysis.isDialogControl) {
      return null
    }

    switch (intentAnalysis.enhancedType) {
      case EnhancedIntentType.CONFIRMATION:
        logger.info('[MultiTurn] User confirmed')
        return {
          type: 'confirmation',
          shouldProceed: true  // 继续执行之前暂停的操作
        }

      case EnhancedIntentType.NEGATION:
        logger.info('[MultiTurn] User negated')
        return {
          type: 'cancel',
          shouldProceed: false
        }

      case EnhancedIntentType.CANCEL_REQUEST:
        logger.info('[MultiTurn] User cancelled')
        return {
          type: 'cancel',
          shouldProceed: false
        }

      case EnhancedIntentType.CONTINUE_REQUEST:
        logger.info('[MultiTurn] User requested continue')
        return {
          type: 'continue',
          shouldProceed: true
        }

      case EnhancedIntentType.UNDO_REQUEST:
        logger.info('[MultiTurn] User requested undo')
        // 撤销操作由其他模块处理，这里只标记
        return {
          type: 'direct_execute',
          shouldProceed: true
        }

      case EnhancedIntentType.MODIFICATION:
        logger.info('[MultiTurn] User requested modification')
        return {
          type: 'modification',
          shouldProceed: true
        }

      default:
        return null
    }
  }, [])

  /**
   * 处理模糊请求
   */
  const handleVagueRequest = useCallback((
    userMessage: string,
    intentAnalysis: EnhancedUserIntent,
    existingSessionId?: string
  ): MultiTurnResult => {
    // 创建或获取会话
    let sessionId = existingSessionId
    if (!sessionId) {
      sessionId = store.createSession(userMessage)
      logger.info('[MultiTurn] Created new session for vague request', { sessionId })
    }

    // 生成澄清问题
    const clarificationQuestion = clarificationEngine.generateClarificationQuestion(userMessage)

    // 更新会话状态
    store.addClarification(sessionId, clarificationQuestion)
    store.updatePhase(sessionId, ConversationPhase.CLARIFYING)

    logger.info('[MultiTurn] Generated clarification question', {
      sessionId,
      questionId: clarificationQuestion.id,
      questionType: clarificationQuestion.type
    })

    return {
      type: 'clarification',
      shouldProceed: false,  // 暂停执行，等待用户回答
      clarificationQuestion,
      intentAnalysis,
      sessionId,
      phase: ConversationPhase.CLARIFYING
    }
  }, [store])

  /**
   * 处理复杂任务（任务分解）
   * @param complexityResult 复杂度检测结果，包含建议步骤数等信息
   * @param reviewResult 🆕 审查结果（如果有）
   */
  const handleComplexTask = useCallback((
    userMessage: string,
    intentAnalysis: EnhancedUserIntent,
    existingSessionId?: string,
    complexityResult?: ComplexityResult,
    reviewResult?: ReviewResult
  ): MultiTurnResult => {
    // 🆕 使用复杂度检测的建议步骤数
    const suggestedStepCount = complexityResult?.suggestedStepCount
    
    logger.info('[MultiTurn] Processing complex task', {
      userMessage: userMessage.substring(0, 50),
      complexity: complexityResult?.complexity,
      suggestedStepCount,
      indicators: complexityResult?.indicators,
      hasReviewResult: !!reviewResult,
      reviewIssueCount: reviewResult?.issues?.length
    })

    let taskPlan: TaskPlan | null = null

    // 🆕 优先尝试从审查结果生成任务计划
    if (reviewResult && taskDecomposer.canDecomposeFromReview(reviewResult)) {
      taskPlan = taskDecomposer.decomposeFromReviewResults(reviewResult, userMessage)
      
      if (taskPlan) {
        logger.info('[MultiTurn] Task plan created from review results', {
          planId: taskPlan.id,
          stepCount: taskPlan.steps.length,
          reviewIssueCount: reviewResult.issues.length
        })
      }
    }

    // 如果没有从审查结果生成，尝试常规分解
    if (!taskPlan) {
      taskPlan = taskDecomposer.decompose(userMessage, { maxSteps: suggestedStepCount })
    }

    if (!taskPlan) {
      // 无法分解，按直接执行处理
      logger.info('[MultiTurn] Could not decompose task, proceeding with direct execution', {
        userMessage: userMessage.substring(0, 50)
      })
      return {
        type: 'direct_execute',
        shouldProceed: true,
        intentAnalysis,
        complexityResult,
        sessionId: existingSessionId,
        reviewResult
      }
    }

    // 创建或获取会话
    let sessionId = existingSessionId
    if (!sessionId) {
      sessionId = store.createSession(userMessage)
      logger.info('[MultiTurn] Created new session for complex task', { sessionId })
    }

    // 保存任务计划到会话
    store.setTaskPlan(sessionId, taskPlan)
    store.updatePhase(sessionId, ConversationPhase.PLANNING)

    // 🆕 将审查结果附加到会话（如果有）
    if (reviewResult) {
      store.attachReviewResult(sessionId, reviewResult)
    }

    // 🆕 保存任务计划到上下文快照
    const planSummary = `任务计划: ${taskPlan.title}\n步骤:\n${taskPlan.steps.map((s, i) => `${i + 1}. ${s.description}`).join('\n')}`
    store.saveTaskPlanContext(taskPlan, planSummary, taskPlan.id)

    logger.info('[MultiTurn] Task decomposed into plan', {
      sessionId,
      planId: taskPlan.id,
      stepCount: taskPlan.steps.length,
      suggestedStepCount,
      estimatedTime: taskDecomposer.estimateTotalTime(taskPlan),
      fromReviewResult: !!reviewResult
    })

    return {
      type: 'planning',
      shouldProceed: false,  // 暂停执行，等待用户确认计划
      taskPlan,
      intentAnalysis,
      complexityResult,
      sessionId,
      phase: ConversationPhase.PLANNING,
      reviewResult
    }
  }, [store])

  /**
   * 确认任务计划并开始执行
   */
  const confirmTaskPlan = useCallback((sessionId: string): MultiTurnResult => {
    const session = store.getSession(sessionId)
    if (!session?.taskPlan) {
      logger.error('[MultiTurn] No task plan found for session', { sessionId })
      return {
        type: 'direct_execute',
        shouldProceed: true
      }
    }

    // 确认计划
    store.confirmTaskPlan(sessionId)

    logger.info('[MultiTurn] Task plan confirmed', {
      sessionId,
      planId: session.taskPlan.id
    })

    return {
      type: 'direct_execute',
      shouldProceed: true,
      taskPlan: session.taskPlan,
      sessionId,
      phase: ConversationPhase.EXECUTING
    }
  }, [store])

  /**
   * 处理用户对澄清问题的回答
   */
  const handleClarificationAnswer = useCallback((
    sessionId: string,
    questionId: string,
    answer: string,
    selectedOptionId?: string
  ): MultiTurnResult => {
    // 记录回答
    store.answerClarification(sessionId, questionId, answer, selectedOptionId)

    // 获取会话
    const session = store.getSession(sessionId)
    if (!session) {
      logger.error('[MultiTurn] Session not found', { sessionId })
      return {
        type: 'direct_execute',
        shouldProceed: true
      }
    }

    // 构建增强意图
    const enhancedIntent = clarificationEngine.buildEnhancedIntent(
      session.originalIntent,
      session.clarifications
    )

    logger.info('[MultiTurn] Clarification answered, enhanced intent built', {
      sessionId,
      originalIntent: session.originalIntent.substring(0, 30),
      enhancedIntent: enhancedIntent.substring(0, 50)
    })

    // 检查是否还有未回答的必填问题
    const pendingQuestions = store.getPendingClarifications(sessionId)
    if (pendingQuestions.length > 0) {
      // 还有问题需要回答
      return {
        type: 'clarification',
        shouldProceed: false,
        clarificationQuestion: pendingQuestions[0],
        enhancedIntent,
        sessionId,
        phase: ConversationPhase.CLARIFYING
      }
    }

    // 所有问题都已回答，可以执行
    store.updatePhase(sessionId, ConversationPhase.EXECUTING)

    // 获取推荐工具（如果用户选择了选项）
    let recommendedTools: string[] = []
    if (selectedOptionId) {
      recommendedTools = clarificationEngine.getRecommendedTools(selectedOptionId)
    }

    return {
      type: 'direct_execute',
      shouldProceed: true,
      enhancedIntent,
      sessionId,
      phase: ConversationPhase.EXECUTING
    }
  }, [store])

  /**
   * 取消当前会话
   */
  const cancelSession = useCallback((sessionId: string) => {
    store.updatePhase(sessionId, ConversationPhase.CANCELLED)
    logger.info('[MultiTurn] Session cancelled', { sessionId })
  }, [store])

  /**
   * 完成当前会话
   */
  const completeSession = useCallback((sessionId: string) => {
    store.updatePhase(sessionId, ConversationPhase.COMPLETED)
    logger.info('[MultiTurn] Session completed', { sessionId })
  }, [store])

  /**
   * 启用/禁用多轮对话模式
   */
  const setEnabled = useCallback((enabled: boolean) => {
    store.setMultiTurnEnabled(enabled)
    logger.info('[MultiTurn] Mode changed', { enabled })
  }, [store])

  return {
    // 状态
    isEnabled,
    currentSession,
    
    // 核心方法
    analyzeInput,
    handleClarificationAnswer,
    confirmTaskPlan,
    
    // 会话管理
    cancelSession,
    completeSession,
    setEnabled,
    
    // Store 访问（供高级用例使用）
    store
  }
}
