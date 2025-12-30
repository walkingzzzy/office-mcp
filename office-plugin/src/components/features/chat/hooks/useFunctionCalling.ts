/**
 * useFunctionCalling Hook - 重构版本
 * 负责统一的流式响应 + Function Calling 处理，作为协调器整合各个模块
 */

import { useCallback, useRef, useState } from 'react'

import { WORD_SKIP_AUTO_APPLY_METADATA_KEY } from '../../../../constants/word'
import type { DocumentData } from '../../../../services/BinaryDocumentAdapter'
import type { ClarificationQuestion, TaskPlan } from '../../../../services/ai/conversation'
import { previewGenerator, type OperationPreview, type PlanPreview } from '../../../../services/ai/conversation'
import { createStepExecutor, type StepExecutor, type StepExecutionResult, type RecordedOperation } from '../../../../services/ai/conversation'
import { agentPromptManager, type OfficeAppType } from '../../../../services/ai/prompts'
import type { BatchConfirmCallback, ConfirmRequestCallback, FormattingFunction, ProgressCallback } from '../../../../services/ai/types'
import type { UndoManager } from '../../../../services/UndoManager'
import { WordService } from '../../../../services/WordService'
import type { ChatMessage, ChatMode, ToolDefinition } from '../../../../types/ai'
import { type MainTextMessageBlock, type Message, type MessageBlock, MessageBlockStatus, MessageBlockType } from '../../../../types/messageBlock'
import Logger from '../../../../utils/logger'
// 导入模块化的 hooks
import { useFunctionCallState } from './state/useFunctionCallState'
import { useStreamProcessor, type AgentPromptOptions } from './streaming/useStreamProcessor'
import { useResponseAnalysis } from './tools/useResponseAnalysis'
import { useToolExecution } from './tools/useToolExecution'
import { useMultiTurnConversation } from './useMultiTurnConversation'

const logger = new Logger('useFunctionCalling')

type OfficeApp = 'word' | 'excel' | 'powerpoint' | 'none'

const MAX_TOOL_ENFORCEMENT_RETRY = 2

/**
 * 构建工具强制重试提示词
 * 使用 AgentPromptManager 基于工具 schema 动态生成，而非硬编码字段
 */
function buildToolEnforcementPrompt(
  userMessage: string,
  candidateTools: FormattingFunction[],
  previousOutput?: string,
  officeApp: OfficeAppType = 'word'
): string {
  // 使用 AgentPromptManager 动态生成重试提示词
  // 基于工具 schema 生成参数示例，而非硬编码 color、paragraphIndex 等字段
  return agentPromptManager.generateRetryPrompt({
    userMessage,
    candidateTools,
    previousOutput,
    officeApp
  })
}

interface AssistantLifecycleContext {
  isSelectionMode: boolean
  userIntent: 'edit' | 'query' | 'command'
  currentOfficeApp: OfficeApp
  hasDocument: boolean
}

export interface AssistantCreatedPayload extends AssistantLifecycleContext {
  messageId: string
}

export interface AssistantCompletedPayload extends AssistantLifecycleContext {
  messageId: string
  message: Message
}

export interface StreamingCallbacks {
  updateMessageBlock: (messageId: string, blockId: string, updates: Partial<MessageBlock>) => void
  addMessageBlocks: (messageId: string, blocks: MessageBlock[]) => void
  addMessage: (message: Message) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  setIsLoading: (loading: boolean) => void
  getMessage: (messageId: string) => Message | undefined
}

export interface StreamingConfig {
  modelId: string
  knowledgeBases: string[]
  mcpTools: string[]
  webSearchEnabled: boolean
  wordService: WordService
  onConfirmRequest?: ConfirmRequestCallback
  onBatchConfirm?: BatchConfirmCallback
  onProgress?: ProgressCallback
  onAssistantMessageCreated?: (payload: AssistantCreatedPayload) => void
  onAssistantMessageCompleted?: (payload: AssistantCompletedPayload) => void
  undoManager?: UndoManager
  /** 聊天模式：agent 可调用工具，ask 只回答问题 */
  chatMode?: ChatMode
}

export interface SendMessageOptions {
  chatMessages: ChatMessage[]
  isSelectionMode?: boolean
  currentOfficeApp?: OfficeApp
  hasDocument?: boolean
  userIntent?: 'edit' | 'query' | 'command'
  allowToolCalls?: boolean
  documentData?: DocumentData
  /** 多轮对话会话 ID（如果已存在） */
  sessionId?: string
  /** 是否是澄清回答 */
  isClarificationAnswer?: boolean
  /** 澄清问题 ID */
  clarificationQuestionId?: string
  /** 用户选择的选项 ID */
  selectedOptionId?: string
  /** 是否跳过预览（预览确认后执行时使用） */
  skipPreview?: boolean
  /** 预览确认后要执行的工具调用 */
  confirmedToolCalls?: Array<{ toolName: string; args: Record<string, unknown> }>
  /** 任务计划（分步执行时使用） */
  taskPlan?: TaskPlan
  /** 分步执行：当前步骤索引 */
  currentStepIndex?: number
}

/**
 * 多轮对话结果（当需要澄清/预览/计划时返回）
 */
export interface MultiTurnResult {
  /** 是否需要澄清 */
  needsClarification?: boolean
  /** 澄清问题 */
  clarificationQuestion?: ClarificationQuestion
  /** 会话 ID */
  sessionId?: string
  /** 是否需要预览确认 */
  needsPreview?: boolean
  /** 操作预览 */
  operationPreview?: OperationPreview
  /** 计划预览 */
  planPreview?: PlanPreview
  /** 是否需要计划确认 */
  needsPlanConfirmation?: boolean
  /** 任务计划 */
  taskPlan?: TaskPlan
  /** 待执行的工具调用（预览确认后执行） */
  pendingToolCalls?: Array<{ toolName: string; args: Record<string, unknown> }>
}

/** 执行任务计划的选项 */
export interface ExecuteTaskPlanOptions {
  /** 仅记录模式：不执行操作，只记录到队列等待批量应用 */
  recordOnly?: boolean
  /** 步骤完成回调 */
  onStepComplete?: (stepIndex: number, result: StepExecutionResult) => void
  /** 记录完成回调（recordOnly 模式） */
  onRecordComplete?: (recordedOperations: RecordedOperation[]) => void
}

export interface UseFunctionCallingReturn {
  sendMessage: (options: SendMessageOptions) => Promise<MultiTurnResult | void>
  /** 执行预览确认后的工具调用 */
  executeConfirmedTools: (toolCalls: Array<{ toolName: string; args: Record<string, unknown> }>, messageId?: string) => Promise<void>
  /** 执行任务计划 */
  executeTaskPlan: (
    plan: TaskPlan, 
    optionsOrCallback?: ExecuteTaskPlanOptions | ((stepIndex: number, result: StepExecutionResult) => void)
  ) => Promise<{ recordedOperations?: RecordedOperation[] }>
  /** 暂停分步执行 */
  pauseExecution: () => void
  /** 继续分步执行 */
  resumeExecution: () => void
  cancelRequest: () => void
  isProcessing: boolean
  /** 当前分步执行器 */
  stepExecutor: StepExecutor | null
}

interface InternalSendOptions extends SendMessageOptions {
  allowToolCalls: boolean
  forceRetryAttempt?: number
  missingToolRetryAttempt?: number
  originalUserMessage?: string  // 原始用户消息，用于重试时的工具选择
}

export function useFunctionCalling(
  callbacks: StreamingCallbacks,
  config: StreamingConfig
): UseFunctionCallingReturn {
  const [isProcessing, setIsProcessing] = useState(false)

  // 使用模块化的状态管理
  const { getState, updateState, resetState } = useFunctionCallState({
    wordService: config.wordService,
    onConfirmRequest: config.onConfirmRequest,
    onBatchConfirm: config.onBatchConfirm,
    onProgress: config.onProgress,
    undoManager: config.undoManager
  })

  // 使用模块化的工具执行
  const { ensureFunctionInfrastructure, selectToolsForMessage, executeToolCalls } = useToolExecution(
    getState,
    updateState,
    {
      wordService: config.wordService,
      onConfirmRequest: config.onConfirmRequest,
      onBatchConfirm: config.onBatchConfirm,
      onProgress: config.onProgress,
      undoManager: config.undoManager
    },
    callbacks
  )

  // 使用模块化的响应分析
  const { analyzeResponseForRetry, shouldTriggerFollowUp, extractUserIntent } = useResponseAnalysis(getState)

  // 使用模块化的流处理
  const { createAssistantMessage, sendStreamRequest, handleRateLimitError, cancelRequest: cancelStream } = useStreamProcessor(
    getState,
    callbacks,
    {
      modelId: config.modelId,
      knowledgeBases: config.knowledgeBases,
      mcpTools: config.mcpTools,
      webSearchEnabled: config.webSearchEnabled
    }
  )

  const internalSend = useCallback(async (options: InternalSendOptions) => {
    const {
      chatMessages,
      isSelectionMode = false,
      currentOfficeApp = 'none', // 🆕 默认值改为 'none'，强制调用方显式传入
      hasDocument = true,
      allowToolCalls,
      forceRetryAttempt = 0,
      missingToolRetryAttempt = 0,
      originalUserMessage,
      userIntent: externalUserIntent  // 🎯 外部传入的意图（来自 ChatInterface 的首次分析）
    } = options

    // 🎯 智能意图检测策略（参考 OpenAI/Claude 最佳实践）
    // 优先使用外部传入的意图，因为它是基于原始用户输入分析的
    // 只有在重试时才重新计算（此时 originalUserMessage 会被传入）
    let userIntent: 'edit' | 'query' | 'command'
    
    if (externalUserIntent) {
      // 使用外部传入的意图（基于原始用户输入）
      userIntent = externalUserIntent
      logger.info('[INTENT] Using external userIntent from ChatInterface', { userIntent })
    } else if (originalUserMessage) {
      // 重试时使用原始用户消息重新计算
      userIntent = extractUserIntent(originalUserMessage)
      logger.info('[INTENT] Recalculated userIntent from originalUserMessage', { 
        userIntent, 
        originalUserMessage: originalUserMessage.substring(0, 50) 
      })
    } else {
      // 兜底：从合并消息中提取（但这通常不应该发生）
      const fallbackMessage = chatMessages[chatMessages.length - 1]?.content || ''
      userIntent = extractUserIntent(fallbackMessage)
      logger.warn('[INTENT] Fallback: calculated userIntent from merged message', { 
        userIntent,
        messageLength: fallbackMessage.length 
      })
    }

    // 用于工具选择和重试的用户消息（优先使用原始消息）
    const lastMessage = chatMessages[chatMessages.length - 1]?.content || ''
    const userMessage = originalUserMessage || lastMessage

    // 生命周期上下文
    const lifecycleContext: AssistantLifecycleContext = {
      isSelectionMode,
      userIntent,
      currentOfficeApp,
      hasDocument
    }

    // 创建助手消息
    const assistantMessage = createAssistantMessage(chatMessages, lifecycleContext)
    const aiMessageId = assistantMessage.id

    // 触发生命周期回调
    config.onAssistantMessageCreated?.({
      messageId: aiMessageId,
      ...lifecycleContext
    })

    // 创建主文本块
    const mainTextBlockId = `${aiMessageId}-main-text`
    const mainTextBlock: MainTextMessageBlock = {
      id: mainTextBlockId,
      messageId: aiMessageId,
      type: MessageBlockType.MAIN_TEXT,
      createdAt: new Date().toISOString(),
      status: MessageBlockStatus.PENDING,
      content: ''
    }
    callbacks.addMessageBlocks(aiMessageId, [mainTextBlock])

    let selectedTools: FormattingFunction[] = []
    let openAITools: ToolDefinition[] = []

    // 🆕 agentPromptOptions 将在获取真实选区上下文后构建
    let agentPromptOptions: AgentPromptOptions = {
      officeApp: currentOfficeApp as OfficeAppType,
      hasSelection: isSelectionMode,
      selectionType: isSelectionMode ? 'text' : 'none'
    }

    try {
      // 🆕 并行化优化：同时执行基础设施初始化和工具选择准备
      // 这两个操作是独立的，可以并行执行
      const startTime = Date.now()
      
      const [infrastructure] = await Promise.all([
        ensureFunctionInfrastructure(),
        // 预热：如果有文档数据，可以在这里预处理
      ])
      
      logger.info('[PARALLEL] Infrastructure ready', { 
        elapsed: `${Date.now() - startTime}ms` 
      })

      // 🆕 选择工具并获取真实选区上下文
      const { tools, selectionContext } = await selectToolsForMessage(userMessage, currentOfficeApp, infrastructure)
      selectedTools = tools
      logger.info('Selected tools for message', { 
        toolCount: selectedTools.length, 
        selectionContext,
        totalElapsed: `${Date.now() - startTime}ms`
      })

      // 🆕 使用真实的选区上下文构建 agentPromptOptions
      agentPromptOptions = {
        officeApp: selectionContext.documentType as OfficeAppType,
        hasSelection: selectionContext.hasSelection,
        selectionType: selectionContext.selectionType
      }

      // 转换为 OpenAI tools 格式
      openAITools = selectedTools.map(func => ({
        type: 'function' as const,
        function: {
          name: func.name,
          description: func.description,
          parameters: func.inputSchema
        }
      }))

      logger.info('Converted tools to OpenAI format', {
        toolCount: openAITools.length,
        toolNames: openAITools.map(t => t.function.name)
      })

      // 发送流式请求
      const { toolCalls, finalContent, mcpToolsExecuted } = await sendStreamRequest(
        chatMessages,
        openAITools,
        selectedTools,
        aiMessageId,
        mainTextBlockId,
        allowToolCalls,
        userIntent,
        options.documentData,
        agentPromptOptions // 🆕 传递 Agent 提示词选项
      )

      // 🆕 如果有 MCP 工具已经执行，不需要重试
      if (mcpToolsExecuted > 0) {
        logger.info('[OFFICE_TOOL_FLOW] ✅ MCP 工具已通过 McpCommandPoller 执行，跳过重试', {
          mcpToolsExecuted,
          toolCallsLength: toolCalls.length
        })
      } else if (
        toolCalls.length === 0 &&
        allowToolCalls &&
        (userIntent === 'command' || userIntent === 'edit')
      ) {
        // 🔧 修复：检查 AI 是否在询问用户提供更多信息
        // 如果是询问信息，则不应该强制重试
        const isAskingForInput = /请提供|请输入|需要.*路径|需要.*信息|请告诉|请指定|缺少.*参数/i.test(finalContent)
        
        if (isAskingForInput) {
          logger.info('[OFFICE_TOOL_FLOW] AI 正在询问用户提供更多信息，跳过重试', {
            userIntent,
            userMessage: userMessage.substring(0, 100),
            finalContent: finalContent.substring(0, 100)
          })
          // 不重试，让用户看到 AI 的询问
        } else if (missingToolRetryAttempt < MAX_TOOL_ENFORCEMENT_RETRY) {
          // 🔧 修复：使用 AgentPromptManager 动态生成重试提示词，并传递 officeApp
          const enforcementPrompt = buildToolEnforcementPrompt(
            userMessage, 
            selectedTools, 
            finalContent,
            currentOfficeApp as OfficeAppType
          )
          logger.warn('[OFFICE_TOOL_FLOW] 未收到任何工具调用，准备注入强化 tool prompt 重试', {
            userIntent,
            userMessage: userMessage.substring(0, 100),
            enforcementPrompt: enforcementPrompt.substring(0, 200),
            retryAttempt: missingToolRetryAttempt + 1,
            officeApp: currentOfficeApp
          })

          // 🔧 修复：将重试提示词作为 system 消息而非 user 消息
          // 避免污染对话历史，防止模型误以为这是用户真实需求
          const retryMessages = [
            ...chatMessages,
            {
              role: 'system' as const,
              content: enforcementPrompt
            }
          ]

          return internalSend({
            ...options,
            chatMessages: retryMessages,
            forceRetryAttempt,
            missingToolRetryAttempt: missingToolRetryAttempt + 1,
            originalUserMessage: userMessage  // 保留原始用户消息用于工具选择
          })
        }
      }

      // 执行工具调用
      if (toolCalls.length > 0) {
        logger.info('[OFFICE_TOOL_FLOW] 🔧 准备执行工具调用', {
          toolCallCount: toolCalls.length,
          toolNames: toolCalls.map(tc => tc.function.name),
          toolIds: toolCalls.map(tc => tc.id),
          toolArgs: toolCalls.map(tc => tc.function.arguments.substring(0, 100))
        })
        const { toolMessages } = await executeToolCalls(toolCalls, aiMessageId)
        logger.info('[OFFICE_TOOL_FLOW] ✅ 工具调用执行完成', {
          resultCount: toolMessages.length
        })
        // 分析是否需要重试
        const analysisResult = analyzeResponseForRetry(userMessage, toolCalls, forceRetryAttempt)

        if (analysisResult.shouldRetry && analysisResult.retryPrompt) {
          logger.info('Retrying with enhanced prompt')
          const retryMessages = [...chatMessages, ...toolMessages, {
            role: 'user' as const,
            content: analysisResult.retryPrompt
          }]

          return internalSend({
            ...options,
            chatMessages: retryMessages,
            forceRetryAttempt: forceRetryAttempt + 1,
            missingToolRetryAttempt
          })
        }

        // 检查是否需要后续处理
        if (shouldTriggerFollowUp(toolCalls, userMessage)) {
          logger.info('Triggering follow-up processing')
          const state = getState()
          if (!state.isProcessingFollowUp) {
            updateState({ isProcessingFollowUp: true })

            const followUpMessages = [...chatMessages, ...toolMessages, {
              role: 'user' as const,
              content: '请继续完成操作并提供结果摘要。'
            }]

            setTimeout(async () => {
              try {
                await internalSend({
                  ...options,
                  chatMessages: followUpMessages,
                  allowToolCalls: false
                })
              } finally {
                updateState({ isProcessingFollowUp: false })
              }
            }, 1000)
          }
        }
      } else if (allowToolCalls && (userIntent === 'command' || userIntent === 'edit') && mcpToolsExecuted === 0) {
        // 🚨 [TOOL_DEBUG] 工具调用为空但用户意图是编辑/命令 - 静默失败检测
        // 🆕 只有当没有 MCP 工具执行时才显示警告
        logger.warn('[OFFICE_TOOL_FLOW] ⚠️ 模型未返回工具调用，但用户意图需要文档操作', {
          userIntent,
          userMessage: userMessage.substring(0, 100),
          selectedToolCount: selectedTools.length,
          selectedToolNames: selectedTools.map(t => t.name),
          finalContentLength: finalContent.length,
          finalContentPreview: finalContent.substring(0, 200)
        })
        
        // 在消息内容后追加提示
        const warningMessage = '\n\n⚠️ **注意**: 当前模型未触发文档操作。可能的原因：\n' +
          '1. 模型未正确识别您的意图\n' +
          '2. 模型提供商不支持工具调用\n' +
          '3. 请尝试更明确地描述您想要的操作'
        
        callbacks.updateMessageBlock(aiMessageId, mainTextBlockId, {
          content: finalContent + warningMessage,
          status: MessageBlockStatus.SUCCESS
        })
      }

      // 完成消息处理
      callbacks.updateMessage(aiMessageId, {
        content: finalContent,
        metadata: {
          [WORD_SKIP_AUTO_APPLY_METADATA_KEY]: true
        }
      })

      // 触发完成回调
      config.onAssistantMessageCompleted?.({
        messageId: aiMessageId,
        message: assistantMessage,
        ...lifecycleContext
      })

    } catch (error: unknown) {
      const err = error as Error & { name?: string; message?: string }
      logger.error('Message processing failed', { error })

      // 处理速率限制错误
      if ((err.name === 'RateLimitError' || err.name === 'AI_ProviderSpecificError') && forceRetryAttempt < 2) {
        return handleRateLimitError(
          error,
          forceRetryAttempt,
          chatMessages,
          openAITools || [],
          aiMessageId,
          mainTextBlockId,
          allowToolCalls,
          selectedTools || [],
          userIntent,
          options.documentData,
          agentPromptOptions // 🆕 传递 Agent 提示词选项
        )
      }

      // 更新错误状态
      callbacks.updateMessageBlock(aiMessageId, mainTextBlockId, {
        content: `错误: ${err.message || '未知错误'}`,
        status: MessageBlockStatus.ERROR
      })

      throw err
    }
  }, [
    ensureFunctionInfrastructure,
    selectToolsForMessage,
    executeToolCalls,
    analyzeResponseForRetry,
    shouldTriggerFollowUp,
    extractUserIntent,
    createAssistantMessage,
    sendStreamRequest,
    handleRateLimitError,
    getState,
    updateState,
    callbacks,
    config
  ])

  // 多轮对话 Hook
  const multiTurn = useMultiTurnConversation()

  const sendMessage = useCallback(async (options: SendMessageOptions): Promise<MultiTurnResult | void> => {
    if (!config.modelId) {
      throw new Error('Model ID is required to send messages')
    }

    setIsProcessing(true)

    try {
      // 获取用户消息
      const lastMessage = options.chatMessages[options.chatMessages.length - 1]?.content || ''

      // 如果启用了多轮对话，先分析用户输入（传入消息历史用于上下文关联）
      if (multiTurn.isEnabled && !options.isClarificationAnswer) {
        const multiTurnResult = multiTurn.analyzeInput(lastMessage, options.sessionId, options.chatMessages as any)
        
        logger.info('[MULTI_TURN] Analysis result', {
          type: multiTurnResult.type,
          shouldProceed: multiTurnResult.shouldProceed,
          sessionId: multiTurnResult.sessionId
        })

        // 如果需要澄清，返回澄清问题
        if (multiTurnResult.type === 'clarification' && !multiTurnResult.shouldProceed) {
          logger.info('[MULTI_TURN] Clarification needed, returning question')
          setIsProcessing(false)
          return {
            needsClarification: true,
            clarificationQuestion: multiTurnResult.clarificationQuestion,
            sessionId: multiTurnResult.sessionId
          }
        }

        // 如果是取消操作
        if (multiTurnResult.type === 'cancel') {
          logger.info('[MULTI_TURN] User cancelled')
          if (multiTurnResult.sessionId) {
            multiTurn.cancelSession(multiTurnResult.sessionId)
          }
          setIsProcessing(false)
          return
        }

        // 如果有增强意图，使用它替换原始消息
        if (multiTurnResult.enhancedIntent && multiTurnResult.shouldProceed) {
          logger.info('[MULTI_TURN] Using enhanced intent', {
            original: lastMessage.substring(0, 50),
            enhanced: multiTurnResult.enhancedIntent.substring(0, 50)
          })
          // 使用增强后的意图
          const enhancedMessages = [
            ...options.chatMessages.slice(0, -1),
            { ...options.chatMessages[options.chatMessages.length - 1], content: multiTurnResult.enhancedIntent }
          ]
          options = { ...options, chatMessages: enhancedMessages }
        }

        // 🆕 如果有上下文关联（审查结果），将其注入到最后一条用户消息中
        if (multiTurnResult.formattedContext && multiTurnResult.shouldProceed) {
          logger.info('[MULTI_TURN] Injecting review context into message', {
            contextLength: multiTurnResult.formattedContext.length,
            hasReviewResult: !!multiTurnResult.reviewResult
          })
          
          const lastMsg = options.chatMessages[options.chatMessages.length - 1]
          const contextInjectedContent = `${lastMsg.content}\n\n${multiTurnResult.formattedContext}`
          
          const contextInjectedMessages = [
            ...options.chatMessages.slice(0, -1),
            { ...lastMsg, content: contextInjectedContent }
          ]
          options = { ...options, chatMessages: contextInjectedMessages }
        }
      }

      // 如果是澄清回答，处理回答并获取增强意图
      if (options.isClarificationAnswer && options.sessionId && options.clarificationQuestionId) {
        const answerResult = multiTurn.handleClarificationAnswer(
          options.sessionId,
          options.clarificationQuestionId,
          lastMessage,
          options.selectedOptionId
        )

        if (!answerResult.shouldProceed) {
          // 还有更多澄清问题
          setIsProcessing(false)
          return {
            needsClarification: true,
            clarificationQuestion: answerResult.clarificationQuestion,
            sessionId: answerResult.sessionId
          }
        }

        // 使用增强后的意图
        if (answerResult.enhancedIntent) {
          const enhancedMessages = [
            ...options.chatMessages.slice(0, -1),
            { ...options.chatMessages[options.chatMessages.length - 1], content: answerResult.enhancedIntent }
          ]
          options = { ...options, chatMessages: enhancedMessages }
        }
      }

      // 🎯 根据 chatMode 决定是否允许工具调用
      // Ask 模式：只回答问题，不调用工具 (tool_choice = 'none')
      // Agent 模式：根据意图智能选择是否调用工具
      const effectiveAllowToolCalls = config.chatMode === 'ask' 
        ? false 
        : (options.allowToolCalls ?? true)
      
      logger.info('[CHAT_MODE] Tool call decision', {
        chatMode: config.chatMode || 'agent',
        optionsAllowToolCalls: options.allowToolCalls,
        effectiveAllowToolCalls
      })

      // 执行正常的工具调用流程
      await internalSend({
        ...options,
        allowToolCalls: effectiveAllowToolCalls
      })

      // 完成会话
      if (options.sessionId && multiTurn.isEnabled) {
        multiTurn.completeSession(options.sessionId)
      }

    } finally {
      setIsProcessing(false)
    }
  }, [config.modelId, internalSend, multiTurn])

  const cancelRequest = useCallback(() => {
    cancelStream()
    stepExecutorRef.current?.cancel()
    setIsProcessing(false)
  }, [cancelStream])

  // 分步执行器 ref
  const stepExecutorRef = useRef<StepExecutor | null>(null)

  /**
   * 执行预览确认后的工具调用
   */
  const executeConfirmedTools = useCallback(async (
    toolCalls: Array<{ toolName: string; args: Record<string, unknown> }>,
    messageId?: string
  ): Promise<void> => {
    if (toolCalls.length === 0) return

    setIsProcessing(true)
    try {
      logger.info('[PREVIEW] Executing confirmed tools', {
        toolCount: toolCalls.length,
        tools: toolCalls.map(t => t.toolName)
      })

      // 直接执行工具调用
      for (const toolCall of toolCalls) {
        await executeToolCalls(
          [{ 
            id: `confirmed-${Date.now()}`, 
            type: 'function', 
            function: { 
              name: toolCall.toolName, 
              arguments: JSON.stringify(toolCall.args) 
            } 
          }],
          messageId || `msg-${Date.now()}`
        )
      }

      logger.info('[PREVIEW] Confirmed tools executed successfully')
    } catch (error) {
      logger.error('[PREVIEW] Failed to execute confirmed tools', { error })
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [executeToolCalls])

  /**
   * 执行任务计划（分步执行）
   * 
   * @param plan 任务计划
   * @param optionsOrCallback 选项对象或步骤完成回调（向后兼容）
   */
  const executeTaskPlan = useCallback(async (
    plan: TaskPlan,
    optionsOrCallback?: ExecuteTaskPlanOptions | ((stepIndex: number, result: StepExecutionResult) => void)
  ): Promise<{ recordedOperations?: RecordedOperation[] }> => {
    // 向后兼容：如果传入函数，转换为选项对象
    const options: ExecuteTaskPlanOptions = typeof optionsOrCallback === 'function'
      ? { onStepComplete: optionsOrCallback }
      : optionsOrCallback || {}

    const { recordOnly = false, onStepComplete, onRecordComplete } = options

    setIsProcessing(true)

    logger.info('[STEP_EXECUTOR] Starting plan execution', {
      planId: plan.id,
      stepCount: plan.steps.length,
      recordOnly
    })

    // 创建工具执行器适配器
    const toolExecutor = {
      execute: async (toolName: string, args: Record<string, unknown>) => {
        try {
          const { executionSummaries } = await executeToolCalls(
            [{
              id: `step-${Date.now()}`,
              type: 'function',
              function: {
                name: toolName,
                arguments: JSON.stringify(args)
              }
            }],
            `plan-${plan.id}`
          )

          const summary = executionSummaries[0]
          if (!summary) {
            return { success: false, message: '未获取工具执行结果' }
          }

          return {
            success: summary.success,
            message: summary.message || (summary.success ? '执行成功' : '执行失败'),
            data: summary.data
          }
        } catch (error: unknown) {
          const err = error as Error
          return { success: false, message: err.message || '执行失败' }
        }
      }
    }

    // 创建分步执行器
    const executor = createStepExecutor(toolExecutor, {
      onStepStart: (step, index, total) => {
        logger.info('[STEP_EXECUTOR] Step started', {
          stepIndex: index,
          description: step.description,
          total,
          recordOnly
        })
      },
      onStepComplete: (step, result) => {
        const stepIndex = plan.steps.findIndex(s => s.id === step.id)
        logger.info('[STEP_EXECUTOR] Step completed', {
          stepIndex,
          success: result.success,
          executionTime: result.executionTime
        })
        onStepComplete?.(stepIndex, result)
      },
      onStepFailed: (step, error) => {
        logger.error('[STEP_EXECUTOR] Step failed', {
          stepDescription: step.description,
          error: error.message
        })
      },
      onPlanComplete: (completedPlan, results) => {
        logger.info('[STEP_EXECUTOR] Plan completed', {
          planId: completedPlan.id,
          totalSteps: results.length,
          successfulSteps: results.filter(r => r.success).length
        })
      }
    })

    stepExecutorRef.current = executor

    try {
      const result = await executor.executePlan(plan, { recordOnly })
      
      logger.info('[STEP_EXECUTOR] Execution finished', {
        success: result.success,
        completedSteps: result.completedSteps,
        cancelled: result.cancelled,
        recordedCount: result.recordedOperations?.length
      })

      // 如果是记录模式，调用记录完成回调
      if (recordOnly && result.recordedOperations) {
        onRecordComplete?.(result.recordedOperations)
        return { recordedOperations: result.recordedOperations }
      }

      return {}
    } finally {
      stepExecutorRef.current = null
      setIsProcessing(false)
    }
  }, [executeToolCalls])

  /**
   * 暂停分步执行
   */
  const pauseExecution = useCallback(() => {
    stepExecutorRef.current?.pause()
    logger.info('[STEP_EXECUTOR] Execution paused')
  }, [])

  /**
   * 继续分步执行
   */
  const resumeExecution = useCallback(() => {
    stepExecutorRef.current?.resume()
    logger.info('[STEP_EXECUTOR] Execution resumed')
  }, [])

  return {
    sendMessage,
    executeConfirmedTools,
    executeTaskPlan,
    pauseExecution,
    resumeExecution,
    cancelRequest,
    isProcessing,
    stepExecutor: stepExecutorRef.current
  }
}
