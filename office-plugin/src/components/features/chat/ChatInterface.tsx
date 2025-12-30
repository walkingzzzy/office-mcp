/**
 * ChatInterface - 完整的 Fluent UI 重构聊天界面
 * 使用 Organism 组件组合，支持消息块系统
 * 集成对话历史管理和消息操作
 */

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useBatchConfirm } from '../../../hooks/useBatchConfirm'
import { useConfig } from '../../../hooks/useConfig'
import { useConfirmDialog } from '../../../hooks/useConfirmDialog'
// P6 修复：useConnection 已移至 useChatUIState hook 中
import { useOfficeContext } from './hooks/useOfficeContext'
// import { useDocumentPreprocessing } from '../../../hooks/useDocumentPreprocessing'
import { useMessageOperations } from '../../../hooks/useMessageOperations'
import { AttachmentStore } from '../../../services/AttachmentStore'
import { binaryDocumentAdapter, type DocumentData } from '../../../services/BinaryDocumentAdapter'
import { UndoManager } from '../../../services/UndoManager'
import { wordService } from '../../../services/WordService'
import { documentContextCache } from '../../../services/cache'
import { useConversationStore } from '../../../store/conversationStore'
import { useAppStore, type PendingPlan } from '../../../store/appStore'
import type { ChatMessage, ChatMode } from '../../../types/ai'
import { detectTaskComplexity, type ComplexityResult } from '../../../services/ai/prompts/TaskComplexityDetector'
import {
  type MainTextMessageBlock,
  type Message,
  type MessageBlock,
  MessageBlockStatus,
  MessageBlockType,
  type TaskPlanMessageBlock,
  type ToolMessageBlock
} from '../../../types/messageBlock'
import type { WordParagraph } from '../../../types/word'
import { detectUserIntent, UserIntent } from '../../../utils/intentDetection'
import Logger from '../../../utils/logger'
import { filterChatModels, validateChatModel } from '../../../utils/modelFilters'
import type { FileAttachmentData } from '../../molecules/FileAttachment'
import { useChatInterfaceStyles } from './ChatInterface.styles'
import {
  useFunctionCalling,
  type AssistantCreatedPayload,
  type AssistantCompletedPayload
} from './hooks/useFunctionCalling'
import { useMultiTurnConversation, type MultiTurnResult } from './hooks/useMultiTurnConversation'
import { useTaskPlanningIntegration } from './hooks/useTaskPlanningIntegration'
// P6 修复：导入新的状态管理 Hooks
import { useChatInputState } from './hooks/useChatInputState'
import { useChatUIState } from './hooks/useChatUIState'
import { useChatMultiTurnState } from './hooks/useChatMultiTurnState'
import type { ClarificationQuestion, TaskPlan, OperationPreview, PlanPreview } from '../../../services/ai/conversation'
import { previewGenerator } from '../../../services/ai/conversation'

const logger = new Logger('ChatInterface')

// 导入 Organism 组件
// import { DocumentPreprocessingBanner } from '../../molecules/DocumentPreprocessingBanner'
import { ConnectionBanner, MessageList } from '../../organisms'
import { ExcelEditPanel } from '../../organisms/ExcelEditPanel'
import { PowerPointEditPanel } from '../../organisms/PowerPointEditPanel'
import { Inputbar } from '../../input'
import { AnimatedBackground, ChatBackground } from '../../atoms'

// 多轮对话 UI 组件
import { ClarificationCard } from '../../molecules/ClarificationCard'
// TaskPlanCard 已移除 - 任务计划现在直接在对话流中显示
import { PreviewCard } from '../../molecules/PreviewCard'
import { PendingChangesCard } from '../../molecules/PendingChangesCard'

export interface ChatInterfaceProps {
  selectedModelId?: string
  onModelChange?: (modelId: string) => void
  className?: string
}

export const ChatInterface: FC<ChatInterfaceProps> = ({ selectedModelId: propModelId, onModelChange, className }) => {
  const styles = useChatInterfaceStyles()
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedModelId, setSelectedModelId] = useState(propModelId || '')
  const [taskComplexity, setTaskComplexity] = useState<ComplexityResult | null>(null) // AI 自动检测的任务复杂度
  
  // P6 修复：使用 useChatInputState 管理输入相关状态
  const {
    inputText,
    setInputText,
    attachedFiles,
    setAttachedFiles,
    addAttachedFile,
    removeAttachedFile,
    clearAttachedFiles,
    selectedKnowledgeBases,
    setSelectedKnowledgeBases,
    selectedMCPTools,
    setSelectedMCPTools,
    webSearchEnabled,
    setWebSearchEnabled,
    webSearchProviderId,
    setWebSearchProviderId,
    chatMode,
    setChatMode,
    clearInputState
  } = useChatInputState()
  
  // P6 修复：使用 useChatUIState 管理 UI 相关状态
  const {
    showBanner,
    setShowBanner,
    isLoading,
    setIsLoading,
    excelEditPanelOpen,
    openExcelEditPanel,
    closeExcelEditPanel,
    powerPointEditPanelOpen,
    openPowerPointEditPanel,
    closePowerPointEditPanel,
    selectedMessageForEdit,
    setSelectedMessageForEdit,
    connected
  } = useChatUIState()
  
  // P7 修复：使用 useChatMultiTurnState 管理多轮对话状态
  const {
    activeClarification,
    setActiveClarification,
    activeSessionId,
    setActiveSessionId,
    activeTaskPlan,
    setActiveTaskPlan,
    pendingPlans,
    setPendingPlans,
    planSessions,
    setPlanSessions,
    pendingPlanExecution,
    setPendingPlanExecution,
    isApplyingPlan,
    setIsApplyingPlan,
    isExecutingPlan,
    setIsExecutingPlan,
    currentStepIndex,
    setCurrentStepIndex,
    activePreview,
    setActivePreview,
    pendingToolCalls,
    setPendingToolCalls
  } = useChatMultiTurnState()
  
  const MAX_DOCUMENT_CONTEXT_CHARS = 7000
  const MAX_SELECTION_CONTEXT_CHARS = 4000

  const resolvedModelId = useMemo(() => {
    if (!selectedModelId) {
      return ''
    }

    if (selectedModelId.includes(':')) {
      const [providerId, modelName] = selectedModelId.split(':')
      if (modelName) {
        return `${providerId}/${modelName}`
      }
    }

    return selectedModelId
  }, [selectedModelId])

  const messagesRef = useRef<Message[]>([])
  const activeConversationIdRef = useRef<string | null>(null)
  const assistantMessageConversationsRef = useRef<Record<string, string>>({})
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])


  // 同步外部传入的模型ID
  useEffect(() => {
    if (propModelId && propModelId !== selectedModelId) {
      setSelectedModelId(propModelId)
    }
  }, [propModelId, selectedModelId])

  // UndoManager 用于 Word 文档操作的撤销/重做功能
  const undoManagerRef = useRef<UndoManager | null>(null)

  // 使用确认对话框 Hook
  const { confirm, ConfirmDialog } = useConfirmDialog()

  // 使用批量确认 Hook
  const { 
    requestBatchConfirm, 
    updateProgress, 
    BatchConfirmDialog 
  } = useBatchConfirm()

  // 智能截断上下文，优先按段落结构裁剪
  const trimContext = useCallback((text: string, maxChars: number, paragraphs?: WordParagraph[]) => {
    if (text.length <= maxChars) {
      return {
        text,
        truncated: false,
        originalLength: text.length,
        paragraphCount: paragraphs?.length || 0
      }
    }

    // 优先按段落结构裁剪
    if (paragraphs && paragraphs.length > 0) {
      const collected: string[] = []
      let total = 0
      let includedParaCount = 0

      for (const para of paragraphs) {
        const paraText = para.text || ''
        if (!paraText.trim()) {
          continue // 跳过空段落
        }

        // 如果加入当前段落会超限且已经有内容,则停止
        if (total + paraText.length > maxChars && collected.length > 0) {
          break
        }

        collected.push(paraText)
        total += paraText.length + 1 // +1 for newline
        includedParaCount++

        if (total >= maxChars) {
          break
        }
      }

      if (collected.length > 0) {
        return {
          text: collected.join('\n'),
          truncated: true,
          originalLength: text.length,
          paragraphCount: paragraphs.length,
          includedParagraphs: includedParaCount,
          remainingParagraphs: paragraphs.length - includedParaCount
        }
      }
    }

    // 降级方案:按字符截断
    return {
      text: text.slice(0, maxChars),
      truncated: true,
      originalLength: text.length,
      paragraphCount: 0
    }
  }, [])

  // 使用 useOfficeContext hook 来检测当前 Office 应用
  const { currentOfficeApp } = useOfficeContext()
  const initializedRef = useRef(false) // 跟踪是否已初始化

  // 启动 MCP 命令轮询服务
  const mcpPollerRef = useRef<{ stop: () => void } | null>(null)

  useEffect(() => {
    // 动态导入并启动轮询
    let mounted = true

    import('../../../services/McpCommandPoller').then(({ mcpCommandPoller }) => {
      if (mounted) {
        mcpPollerRef.current = mcpCommandPoller
        mcpCommandPoller.start()
        logger.info('MCP command poller started')
      }
    })

    return () => {
      mounted = false
      // 同步停止轮询，避免异步清理问题
      if (mcpPollerRef.current) {
        mcpPollerRef.current.stop()
        mcpPollerRef.current = null
      }
    }
  }, [])

  // 使用配置状态（连接状态已由 useChatUIState 管理）
  const { models, enabledProviders, knowledgeBases, mcpServers, featureFlags, loading: configLoading } = useConfig()

  // 使用对话历史管理 Store
  const {
    currentConversationId,
    getConversationMessages,
    addMessage: addMessageToStore,
    updateConversation,
    createConversation,
    getCurrentConversation
  } = useConversationStore()

  useEffect(() => {
    if (!currentConversationId) {
      setMessages([])
      return
    }
    const storedMessages = getConversationMessages(currentConversationId)
    setMessages(storedMessages)
  }, [currentConversationId, getConversationMessages])

  // 使用消息操作 Hook
  const messageOperations = useMessageOperations({
    messages,
    setMessages,
    onSendMessage: async (content: string) => {
      setInputText(content)
      // 小延迟确保 UI 更新
      await new Promise((resolve) => setTimeout(resolve, 100))
      await handleSendMessage()
    }
  })

  // 处理助手消息创建生命周期
  const handleAssistantMessageCreated = useCallback((payload: AssistantCreatedPayload) => {
    logger.info('[ChatInterface] Assistant message created', payload)
    // 记录消息关联的上下文信息
    if (activeConversationIdRef.current) {
      assistantMessageConversationsRef.current[payload.messageId] = activeConversationIdRef.current
    }
  }, [])

  // 处理助手消息完成生命周期
  const handleAssistantMessageCompleted = useCallback((payload: AssistantCompletedPayload) => {
    logger.info('[ChatInterface] Assistant message completed', {
      messageId: payload.messageId,
      hasContent: !!payload.message.blocks.length
    })

    // 如果有当前会话，将完整的助手消息保存到 store
    if (currentConversationId) {
      addMessageToStore(currentConversationId, payload.message)
      logger.debug('[ChatInterface] Saved completed assistant message to store', {
        conversationId: currentConversationId,
        messageId: payload.messageId
      })
    }
  }, [currentConversationId, addMessageToStore])

  // 使用 Function Calling Hook
  const { 
    sendMessage, 
    executeConfirmedTools,
    executeTaskPlan,
    pauseExecution,
    resumeExecution,
    isProcessing 
  } = useFunctionCalling(
    {
      updateMessageBlock: (messageId: string, blockId: string, updates: Partial<MessageBlock>) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  blocks: m.blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b))
                }
              : m
          )
        )
      },
      addMessageBlocks: (messageId: string, blocks: MessageBlock[]) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  blocks: [...m.blocks, ...blocks]
                }
              : m
          )
        )
      },
      addMessage: (message: Message) => setMessages((prev) => [...prev, message]),
      updateMessage: (messageId: string, updates: Partial<Message>) =>
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...updates } : m))),
      setIsLoading,
      getMessage: (messageId) => messagesRef.current.find((m) => m.id === messageId)
    },
    {
      modelId: resolvedModelId,
      knowledgeBases: selectedKnowledgeBases,
      mcpTools: selectedMCPTools,
      webSearchEnabled,
      wordService,
      onBatchConfirm: requestBatchConfirm,
      onProgress: updateProgress,
      undoManager: undoManagerRef.current,
      onAssistantMessageCreated: handleAssistantMessageCreated,
      onAssistantMessageCompleted: handleAssistantMessageCompleted,
      chatMode // 传递聊天模式给 useFunctionCalling
    }
  )

  // 多轮对话 Hook
  const multiTurn = useMultiTurnConversation()

  // 待执行操作 Store - 用于延迟执行模式
  const pendingOpsStore = useAppStore()

  // 任务规划集成 Hook - 用于自动检测复杂任务并创建任务计划消息块
  const taskPlanningIntegration = useTaskPlanningIntegration({
    enabled: chatMode === 'agent', // 只在 Agent 模式下启用
    requiresConfirmation: true // 需要用户确认才能执行
  })

  // 🔧 修复：过滤只显示已启用 provider 的聊天模型（排除嵌入式模型、图像生成模型等）
  const filteredModels = useMemo(() => {
    const enabledProviderIds = new Set(enabledProviders.map((p) => p.id))
    const providerFilteredModels = models?.filter((m) => enabledProviderIds.has(m.providerId)) || []
    const chatModels = filterChatModels(providerFilteredModels)

    logger.info('Filtered models for chat', {
      totalModels: models?.length || 0,
      providerFilteredCount: providerFilteredModels.length,
      chatModelsCount: chatModels.length,
      excludedCount: providerFilteredModels.length - chatModels.length
    })

    return chatModels
  }, [models, enabledProviders])

  // 自动选择第一个模型
  useEffect(() => {
    if (filteredModels && filteredModels.length > 0 && !selectedModelId) {
      const firstModel = filteredModels[0]
      const modelId = `${firstModel.providerId}:${firstModel.id}`
      setSelectedModelId(modelId)
      onModelChange?.(modelId)
    }
  }, [filteredModels, selectedModelId, onModelChange])

  // 构建模型选项 - 优化显示名称 (使用 useMemo 避免每次渲染重新计算)
  const modelOptions = useMemo(() => {
    return filteredModels.map((m) => {
      const modelId = `${m.providerId}:${m.id}`
      // 优先显示模型名称，如果名称太长则截断
      const displayName = m.name || m.id
      const shortName = displayName.length > 30 ? `${displayName.substring(0, 27)}...` : displayName

      return {
        value: modelId,
        label: shortName,
        // 完整信息用于 tooltip
        title: `${m.name || m.id} (${m.providerId})`
      }
    })
  }, [filteredModels])

  // P6 修复：连接状态变化时重置 banner 显示已移至 useChatUIState hook

  /**
   * 检测用户是否在询问上传的文件内容（而非当前 Word 文档）
   * 关键词模式：询问词 + 上传文件相关词
   */
  const isAskingAboutUploadedFile = (input: string, hasUploadedFiles: boolean): boolean => {
    if (!hasUploadedFiles) return false
    
    // 询问/理解类关键词
    const queryKeywords = /了解|理解|分析|查看|阅读|看看|介绍|总结|概括|说明|告诉|内容|是什么|有什么|包含|讲解|读取|解读|描述/
    // 上传文件相关词
    const uploadKeywords = /上传|文件|文档|附件/
    
    return queryKeywords.test(input) && uploadKeywords.test(input)
  }

  /**
   * 🆕 检测是否是简单问候或闲聊（不需要文档上下文）
   * 这类输入应该直接回复，不需要读取文档内容
   */
  const isSimpleGreetingOrChat = (input: string): boolean => {
    const trimmedInput = input.trim().toLowerCase()
    
    const greetingPatterns = [
      // 中文问候
      /^(你好|您好|嗨|哈喽|早上好|下午好|晚上好|早安|晚安)$/,
      /^(hi|hello|hey|good morning|good afternoon|good evening)$/i,
      // 简单闲聊
      /^(在吗|你在吗|在不在|你是谁|你叫什么|你会什么|能做什么)$/,
      /^(谢谢|感谢|多谢|thank|thanks)$/i,
      /^(再见|拜拜|bye|goodbye)$/i,
      // 带问候语的短句（最多5个字符的后缀）
      /^(你好|您好|嗨).{0,5}$/
    ]
    
    return greetingPatterns.some(p => p.test(trimmedInput))
  }

  const prepareUserPrompt = async (currentInput: string, hasUploadedDocuments: boolean = false) => {
    let documentContext = ''
    let hasDocument = false
    let isSelectionMode = false
    let isContextTruncated = false
    let contextLimit = 0
    let contextSource: 'selection' | 'document' | null = null
    let truncationInfo: {
      originalLength?: number
      truncatedLength?: number
      truncationRatio?: string
      paragraphCount?: number
      includedParagraphs?: number
      remainingParagraphs?: number
    } = {}
    
    // 🔧 关键修复：如果用户在询问上传的文件，跳过读取当前 Word 文档
    const skipCurrentDocument = isAskingAboutUploadedFile(currentInput, hasUploadedDocuments)
    
    // 🆕 修复：如果是简单问候/闲聊，也跳过读取文档
    const isSimpleChat = isSimpleGreetingOrChat(currentInput)
    
    if (skipCurrentDocument) {
      logger.info('[prepareUserPrompt] 检测到用户询问上传文件，跳过读取当前 Word 文档', {
        input: currentInput,
        hasUploadedDocuments
      })
    }
    
    if (isSimpleChat) {
      logger.info('[prepareUserPrompt] 检测到简单问候/闲聊，跳过读取文档', {
        input: currentInput
      })
      // 简单问候直接返回，不需要文档上下文
      return { 
        finalUserInput: currentInput, 
        userIntent: UserIntent.QUERY, 
        hasDocument: false, 
        isSelectionMode: false, 
        skipCurrentDocument: true 
      }
    }

    if (currentOfficeApp === 'word' && !skipCurrentDocument) {
      try {
        // 🎯 P1 优化：使用文档内容缓存
        const hasSelection = await wordService.hasSelection()
        if (hasSelection) {
          // 选区内容使用缓存
          const selectionResult = await documentContextCache.getSelectionContent(wordService)
          documentContext = selectionResult.text
          hasDocument = documentContext.trim().length > 0
          isSelectionMode = true
          
          if (selectionResult.fromCache) {
            logger.debug('[prepareUserPrompt] 使用缓存的选区内容')
          }

          const trimmed = trimContext(documentContext, MAX_SELECTION_CONTEXT_CHARS)
          if (trimmed.truncated) {
            documentContext = trimmed.text
            isContextTruncated = true
            contextLimit = MAX_SELECTION_CONTEXT_CHARS
            contextSource = 'selection'
            truncationInfo = { originalLength: trimmed.originalLength }
          }
        } else {
          // 文档内容使用缓存
          const docResult = await documentContextCache.getDocumentContent(wordService)
          documentContext = docResult.text
          hasDocument = documentContext.trim().length > 0
          
          if (docResult.fromCache) {
            logger.debug('[prepareUserPrompt] 使用缓存的文档内容')
          }

          const trimmed = trimContext(
            documentContext,
            MAX_DOCUMENT_CONTEXT_CHARS,
            docResult.paragraphs as WordParagraph[]
          )

          if (trimmed.truncated) {
            documentContext = trimmed.text
            isContextTruncated = true
            contextLimit = MAX_DOCUMENT_CONTEXT_CHARS
            contextSource = 'document'
            truncationInfo = {
              originalLength: trimmed.originalLength,
              paragraphCount: trimmed.paragraphCount,
              includedParagraphs: trimmed.includedParagraphs,
              remainingParagraphs: trimmed.remainingParagraphs
            }
          }
        }
      } catch (error) {
        logger.error('Failed to read document content', { error })
      }
    }

    let finalUserInput = currentInput
    let userIntent = UserIntent.CHAT

    // 🔧 如果跳过了当前文档，直接使用原始输入，不包装文档上下文
    if (skipCurrentDocument) {
      userIntent = UserIntent.QUERY  // 询问上传文件属于查询意图
      // finalUserInput 保持为 currentInput，不添加当前文档包装
      return { finalUserInput, userIntent, hasDocument: false, isSelectionMode: false, skipCurrentDocument: true }
    }

    if (hasDocument && documentContext) {
      userIntent = detectUserIntent(currentInput, hasDocument)

      // 🎯 关键：Ask 模式下强制使用 QUERY 意图，不生成改写建议
      const effectivePromptIntent = chatMode === 'ask' ? UserIntent.QUERY : userIntent

      if (effectivePromptIntent === UserIntent.EDIT) {
        if (isSelectionMode) {
          finalUserInput = `你是一个专业的文档编辑助手。\n\n【选中的文本内容】\n---选中开始---\n${documentContext}\n---选中结束---\n\n【用户请求】\n${currentInput}\n\n【输出要求】\n1. 返回修改后的选中文本内容\n2. 只返回文本正文，不要添加任何解释或说明\n3. 保持文本的原始格式\n4. 只修改需要改进的部分\n\n请直接输出修改后的文本内容：`
        } else {
          finalUserInput = `你是一个专业的文档编辑助手。\n\n【当前文档内容】\n---文档开始---\n${documentContext}\n---文档结束---\n\n【用户请求】\n${currentInput}\n\n【输出要求】\n1. 返回修改后的完整文档内容\n2. 只返回文档正文，不要添加任何解释或说明\n3. 保持文档的原始结构和段落格式\n4. 只修改需要改进的部分\n\n请直接输出修改后的文档内容：`
        }
      } else if (effectivePromptIntent === UserIntent.QUERY) {
        if (isSelectionMode) {
          finalUserInput = `【选中的文本内容】\n---选中开始---\n${documentContext}\n---选中结束---\n\n【用户问题】\n${currentInput}\n\n请基于上述选中的文本内容，回答用户的问题。`
        } else {
          finalUserInput = `【当前文档内容】\n---文档开始---\n${documentContext}\n---文档结束---\n\n【用户问题】\n${currentInput}\n\n请基于上述文档内容，回答用户的问题。`
        }
      }
    }

    return { finalUserInput, userIntent, hasDocument, isSelectionMode, skipCurrentDocument: false }
  }

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading || !connected || !selectedModelId) return

    // 🔧 修复：验证选中的模型是否适合聊天
    const currentModel = filteredModels.find((m) => `${m.providerId}:${m.id}` === selectedModelId)
    const validationError = validateChatModel(currentModel)
    if (validationError) {
      logger.error('Invalid model selected for chat', {
        selectedModelId,
        error: validationError
      })

      // 显示错误消息
      const errorMessageId = Date.now().toString()
      const errorBlock: MainTextMessageBlock = {
        id: `${errorMessageId}-block-0`,
        messageId: errorMessageId,
        type: MessageBlockType.MAIN_TEXT,
        createdAt: new Date().toISOString(),
        status: MessageBlockStatus.ERROR,
        content: `❌ ${validationError}`
      }

      const errorMessage: Message = {
        id: errorMessageId,
        role: 'assistant',
        blocks: [errorBlock],
        createdAt: new Date().toISOString()
      }

      setMessages((prev) => [...prev, errorMessage])
      return
    }

    const currentInput = inputText

    // 🆕 多轮对话：先分析用户输入（传入消息历史用于上下文关联）
    if (multiTurn.isEnabled) {
      const multiTurnResult = multiTurn.analyzeInput(currentInput, activeSessionId || undefined, messages)
      
      logger.info('[MULTI_TURN] Analysis result', {
        type: multiTurnResult.type,
        shouldProceed: multiTurnResult.shouldProceed,
        sessionId: multiTurnResult.sessionId
      })

      // 如果需要澄清
      if (multiTurnResult.type === 'clarification' && !multiTurnResult.shouldProceed) {
        setActiveClarification(multiTurnResult.clarificationQuestion || null)
        setActiveSessionId(multiTurnResult.sessionId || null)
        setInputText('') // 清空输入
        return // 不发送消息，等待用户回答澄清问题
      }

      // 如果是任务计划 - 🆕 Windsurf 风格：直接在对话中显示并自动执行
      if (multiTurnResult.type === 'planning' && !multiTurnResult.shouldProceed) {
        const taskPlan = multiTurnResult.taskPlan
        if (taskPlan) {
          setInputText('') // 清空输入
          setActiveSessionId(multiTurnResult.sessionId || null)
          
          // 🆕 创建用户消息
          const userMessageId = Date.now().toString()
          const userTextBlock: MainTextMessageBlock = {
            id: `${userMessageId}-block-0`,
            messageId: userMessageId,
            type: MessageBlockType.MAIN_TEXT,
            createdAt: new Date().toISOString(),
            status: MessageBlockStatus.SUCCESS,
            content: currentInput
          }
          const userMessage: Message = {
            id: userMessageId,
            role: 'user',
            content: currentInput,
            blocks: [userTextBlock],
            createdAt: new Date().toISOString()
          }
          setMessages(prev => [...prev, userMessage])
          
          // 🆕 创建包含 TaskPlanMessageBlock 的 AI 消息
          const aiMessageId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2)}`
          const taskPlanBlock: TaskPlanMessageBlock = {
            id: `${aiMessageId}-plan-block`,
            messageId: aiMessageId,
            type: MessageBlockType.TASK_PLAN,
            createdAt: new Date().toISOString(),
            status: MessageBlockStatus.SUCCESS,
            planId: taskPlan.id,
            title: taskPlan.title,
            description: taskPlan.description,
            planStatus: 'executing', // 🆕 直接开始执行
            steps: taskPlan.steps.map((step, index) => ({
              id: step.id,
              index,
              description: step.description,
              status: index === 0 ? 'in_progress' : 'pending',
              expectedTools: step.expectedTools,
              sourceIssueId: step.sourceIssueId,
              sourceIssueText: step.sourceIssueText,
              issueType: step.issueType,
              locationHint: step.locationHint,
              dependsOn: step.dependsOn
            })),
            currentStepIndex: 0,
            totalSteps: taskPlan.steps.length,
            completedSteps: 0,
            progress: 0,
            requiresConfirmation: false, // 🆕 不需要确认
            userConfirmed: true // 🆕 视为已确认
          }
          const aiMessage: Message = {
            id: aiMessageId,
            role: 'assistant',
            content: `正在执行任务计划: ${taskPlan.title}`,
            blocks: [taskPlanBlock],
            createdAt: new Date().toISOString()
          }
          setMessages(prev => [...prev, aiMessage])
          
          logger.info('[MULTI_TURN] Task plan added to chat, starting auto-execution', {
            planId: taskPlan.id,
            stepCount: taskPlan.steps.length
          })
          
          // 🆕 自动开始执行任务计划
          setIsExecutingPlan(true)
          setCurrentStepIndex(0)
          
          executeTaskPlan(taskPlan, (stepIndex, stepResult) => {
            setCurrentStepIndex(stepIndex + 1)
            
            // 更新消息中的任务计划状态
            updateTaskPlanBlockStatus(taskPlan.id, 'executing', {
              stepIndex,
              stepStatus: stepResult.success ? 'completed' : 'failed',
              resultSummary: stepResult.message,
              error: stepResult.success ? undefined : stepResult.message
            })
          }).then(() => {
            updateTaskPlanBlockStatus(taskPlan.id, 'completed')
            logger.info('[MULTI_TURN] Task plan auto-execution completed')
          }).catch((error) => {
            updateTaskPlanBlockStatus(taskPlan.id, 'failed')
            logger.error('[MULTI_TURN] Task plan auto-execution failed', { error })
          }).finally(() => {
            setIsExecutingPlan(false)
            setCurrentStepIndex(-1)
            setActiveTaskPlan(null)
          })
          
          return // 任务已开始执行
        }
        return
      }

      // 如果是取消操作
      if (multiTurnResult.type === 'cancel') {
        setActiveClarification(null)
        setActiveTaskPlan(null)
        setActiveSessionId(null)
        setInputText('')
        return
      }

      // 保存会话 ID
      if (multiTurnResult.sessionId) {
        setActiveSessionId(multiTurnResult.sessionId)
      }
    }

    const currentFiles = [...attachedFiles]
    const userMessageId = Date.now().toString()

    // 🆕 将附件存储到 AttachmentStore，供工具执行时使用
    if (currentFiles.length > 0) {
      AttachmentStore.storeAll(currentFiles)
      logger.info('[ChatInterface] 附件已存储到 AttachmentStore', {
        count: currentFiles.length,
        fileIds: currentFiles.map(f => f.fileId)
      })
    }

    const userTextBlock: MainTextMessageBlock = {
      id: `${userMessageId}-block-0`,
      messageId: userMessageId,
      type: MessageBlockType.MAIN_TEXT,
      createdAt: new Date().toISOString(),
      status: MessageBlockStatus.SUCCESS,
      content: currentInput
    }

    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      blocks: [userTextBlock],
      createdAt: new Date().toISOString()
    }

    setMessages((prev) => [...prev, userMessage])
    clearInputState() // P6 修复：使用 useChatInputState 提供的方法清空输入状态
    setIsLoading(true)

    if (currentConversationId) {
      addMessageToStore(currentConversationId, userMessage)
      console.log('[ChatInterface] Saved user message to conversation:', currentConversationId)
      
      // 🆕 自动生成对话标题：如果是第一条消息且标题为默认值，则根据消息内容生成标题
      const currentConv = getCurrentConversation()
      if (currentConv && (currentConv.title === '新对话' || !currentConv.title) && currentConv.messages.length <= 1) {
        // 从用户输入中提取标题（取前20个字符，去除换行）
        const autoTitle = currentInput.replace(/\n/g, ' ').trim().slice(0, 20) + (currentInput.length > 20 ? '...' : '')
        if (autoTitle) {
          updateConversation(currentConversationId, { title: autoTitle })
          console.log('[ChatInterface] Auto-generated conversation title:', autoTitle)
        }
      }
    }

    try {
      // 🔧 关键修复：在调用 prepareUserPrompt 之前检测是否有上传的文档
      // 如果用户询问上传文件，则不读取当前 Word 文档
      const hasUploadedDocuments = currentFiles.some(f => f.textContent)
      
      const { finalUserInput, userIntent, hasDocument, isSelectionMode, skipCurrentDocument } = await prepareUserPrompt(currentInput, hasUploadedDocuments)

      // 🆕 自动检测复杂任务并创建任务计划消息块
      const complexityResult = taskPlanningIntegration.shouldCreateTaskPlan(currentInput)
      setTaskComplexity(complexityResult)
      
      if (complexityResult.needsPlanning && chatMode === 'agent' && userIntent === UserIntent.COMMAND) {
        logger.info('[TASK_PLANNING] Complex task detected, creating task plan block', {
          complexity: complexityResult.complexity,
          indicators: complexityResult.indicators,
          suggestedStepCount: complexityResult.suggestedStepCount
        })
        
        // 基于复杂度检测结果创建简化的任务计划步骤
        const suggestedSteps: Array<{ description: string; expectedTools?: string[] }> = 
          complexityResult.indicators.map((indicator, index) => ({
            description: `步骤 ${index + 1}: ${indicator}`,
            expectedTools: [] as string[]
          }))
        
        // 如果检测到的指标较少，添加通用步骤
        if (suggestedSteps.length < 2) {
          suggestedSteps.push(
            { description: '分析当前文档状态', expectedTools: ['word_read_document'] },
            { description: '执行用户请求的操作', expectedTools: [] as string[] },
            { description: '验证操作结果', expectedTools: ['word_read_document'] }
          )
        }
        
        // 创建任务计划消息块
        const planMessageId = `plan-msg-${Date.now()}`
        const planBlockId = `${planMessageId}-plan-block`
        
        const taskPlanBlock = taskPlanningIntegration.createTaskPlanBlock({
          messageId: planMessageId,
          blockId: planBlockId,
          title: `任务规划: ${currentInput.substring(0, 30)}${currentInput.length > 30 ? '...' : ''}`,
          description: `检测到复杂任务（${complexityResult.complexity}级别），建议分步执行`,
          steps: suggestedSteps,
          requiresConfirmation: true
        })
        
        // 添加任务计划消息到消息列表
        const planMessage: Message = {
          id: planMessageId,
          role: 'assistant',
          blocks: [taskPlanBlock],
          createdAt: new Date().toISOString()
        }
        
        setMessages((prev) => [...prev, planMessage])
        
        // 保存任务计划到状态，等待用户确认
        // 类型已统一到 types/taskPlan.ts
        const taskPlan = taskPlanningIntegration.createTaskPlanObject({
          messageId: planMessageId,
          blockId: planBlockId,
          title: taskPlanBlock.title,
          description: taskPlanBlock.description,
          steps: suggestedSteps,
          requiresConfirmation: true
        })
        
        setActiveTaskPlan(taskPlan as TaskPlan)
        setIsLoading(false) // 停止加载，等待用户操作
        
        logger.info('[TASK_PLANNING] Task plan block created and waiting for user confirmation', {
          planId: taskPlan.id,
          stepCount: taskPlan.steps.length
        })
        
        return // 不继续发送消息，等待用户确认任务计划
      }

      // 🔧 修复：构建对话历史，确保每条消息都有有效的 content
      // 当 AI 只调用工具而不返回文本时，需要生成一个描述性的 content
      const chatMessages: ChatMessage[] = messages
        .map((m) => {
          // 提取主文本内容
          const textContent = m.blocks
            .filter((b) => b.type === MessageBlockType.MAIN_TEXT)
            .map((b) => (b as MainTextMessageBlock).content)
            .join('\n')
            .trim()

          // 🔧 修复：如果是 assistant 消息且没有文本内容，检查是否有工具调用
          let content = textContent
          if (!content && m.role === 'assistant') {
            const toolBlocks = m.blocks.filter((b) => b.type === MessageBlockType.TOOL)
            if (toolBlocks.length > 0) {
              // 生成工具调用的描述作为 content
              const toolNames = toolBlocks.map((b) => (b as any).toolName || 'unknown').join(', ')
              content = `[执行了工具: ${toolNames}]`

              logger.debug('Generated content for tool-only assistant message', {
                messageId: m.id,
                toolCount: toolBlocks.length,
                toolNames,
                generatedContent: content
              })
            } else {
              // 完全没有内容的消息，使用占位符
              content = '[消息处理中]'
              logger.warn('Assistant message has no content or tool blocks', {
                messageId: m.id,
                blockCount: m.blocks.length,
                blockTypes: m.blocks.map((b) => b.type)
              })
            }
          }

          return {
            role: m.role as 'user' | 'assistant',
            content
          }
        })
        .filter((m) => m.content.trim().length > 0) // 🔧 过滤掉完全空的消息

      logger.info('Built chat messages for API request', {
        totalMessages: messages.length,
        validMessages: chatMessages.length,
        messageRoles: chatMessages.map((m) => m.role),
        messageLengths: chatMessages.map((m) => m.content.length)
      })

      // 🔧 修复：为 COMMAND 意图添加 system message，强制 AI 调用工具
      // 🆕 检查是否有可用于插入的图片附件
      const imageAttachments = currentFiles.filter(f => 
        f.type?.startsWith('image/') && f.base64Data
      )
      const hasImageAttachments = imageAttachments.length > 0
      
      // 🆕 检查是否有文档附件（含文本内容）
      const documentAttachments = currentFiles.filter(f => f.textContent)
      const hasDocumentAttachments = documentAttachments.length > 0
      
      // 构建图片信息提示（如果有图片附件）
      let imageContextPrompt = ''
      if (hasImageAttachments) {
        const imageInfos = imageAttachments.map((img, idx) => 
          `  - 图片${idx + 1}: ${img.fileName} (ID: ${img.fileId})`
        ).join('\n')
        
        imageContextPrompt = `
【重要】用户已上传以下图片附件，可直接用于插入文档：
${imageInfos}

如果用户请求插入图片，请使用 word_insert_image 工具，并设置 base64Data 参数为 "ATTACHED_IMAGE:${imageAttachments[0].fileId}"。
系统会自动替换为实际的图片数据。`

        logger.info('[ChatInterface] 检测到图片附件，将添加到上下文', {
          count: imageAttachments.length,
          fileIds: imageAttachments.map(f => f.fileId)
        })
      }
      
      // 🆕 构建文档内容提示（如果有文档附件）
      // 使用 AttachmentStore 的统一上下文生成方法
      let documentContextPrompt = ''
      if (hasDocumentAttachments) {
        // 使用 AttachmentStore 生成结构化的 AI 上下文
        documentContextPrompt = AttachmentStore.generateAIContext({
          includeFullContent: true,
          maxLength: 50000,  // 限制总长度防止 token 超限
          includeMetadata: true,
          includeSummary: true
        })

        const summary = AttachmentStore.getSummary()
        logger.info('[ChatInterface] 检测到文档附件，将添加到上下文', {
          count: summary.documents,
          totalSize: summary.totalSize,
          files: summary.fileNames,
          contextLength: documentContextPrompt.length
        })
      }
      
      // 🔧 使用 prepareUserPrompt 返回的 skipCurrentDocument 标志
      // 该标志表示用户在询问上传的文件内容，已跳过读取当前 Word 文档
      const wantsToUnderstandUploadedFile = skipCurrentDocument && hasDocumentAttachments

      if (userIntent === UserIntent.COMMAND && !wantsToUnderstandUploadedFile) {
        // 🔧 修复：COMMAND 意图也需要包含上传文档内容
        // 例如用户说"将上传的文件内容插入到文档中"，AI 需要知道文件内容才能执行
        const documentContentForCommand = hasDocumentAttachments ? `

【重要】用户已上传文档，以下是文档内容：
${documentContextPrompt}

如果用户要求将上传文件内容插入到当前文档，请使用 word_insert_text 或 word_add_paragraph 工具，将上述文档内容作为 text 参数。` : ''
        
        chatMessages.unshift({
          role: 'system',
          content: `你是一个自动化命令执行系统。你的唯一任务是调用工具函数来执行用户的命令。

关键规则：
1. 必须调用相应的工具函数，不要返回文本说明
2. 不要询问用户任何问题
3. 不要提供建议或解释
4. 根据用户命令直接选择最合适的工具并执行

可用的工具类型：
- 格式化工具：字体、段落、样式
- 编辑工具：查找替换、插入、删除
- 布局工具：页面设置、页眉页脚
- 内容工具：表格、列表、图片
${imageContextPrompt}${documentContentForCommand}
请立即分析用户命令并调用相应的工具函数。`
        })
      } else if (wantsToUnderstandUploadedFile) {
        // 🆕 用户想要了解上传的文件内容，不执行命令，直接回答
        chatMessages.unshift({
          role: 'system',
          content: `你是一个智能文档助手。用户已上传文件，请帮助用户理解和分析文件内容。

【重要提示】
- 用户想要了解的是【上传的文件】内容，不是当前打开的 Word 文档
- 请专注分析上传文件的内容，不要混淆两者
- 可以总结文件的主要内容、结构、关键点等
- 用户说"然后我们再来进行操作"意味着现在只需要了解内容，暂不执行任何操作

${documentContextPrompt}

请基于上传的文件内容进行回答，告诉用户这个文件主要包含什么内容。`
        })
        
        logger.info('[ChatInterface] 检测到用户想要了解上传文件内容，切换到文档分析模式')
      }
      
      // 🆕 如果有文档附件，将文档内容添加到用户消息中
      if (hasDocumentAttachments && userIntent !== UserIntent.COMMAND) {
        // 对于非命令意图（如问答），添加文档内容作为上下文
        chatMessages.unshift({
          role: 'system',
          content: `你是一个智能助手，可以帮助用户分析和处理文档内容。

重要规则：
1. 用户已上传文档，请仔细阅读并基于文档内容回答问题
2. 回答时可以引用文档中的具体内容，使用引号标注
3. 如果问题与文档内容无关，请说明并提供一般性回答
4. 可以分析文档结构、提取关键信息、总结内容要点

${documentContextPrompt}`
        })
      }

      const fileMetadata = currentFiles.map((file) => ({
        id: file.fileId,
        name: file.fileName,
        origin_name: file.fileName,
        path: '',
        ext: file.ext,
        type: file.type,
        size: file.size,
        created_at: new Date().toISOString(),
        count: 1
      }))

      // 🔧 修复：当用户想了解上传文件时，不使用包含当前 Word 文档的 finalUserInput
      // 而是使用原始用户输入，让上传文件的上下文成为主要内容
      const effectiveUserInput = wantsToUnderstandUploadedFile ? currentInput : finalUserInput

      const userChatMessage = {
        role: 'user',
        content: effectiveUserInput,
        ...(fileMetadata.length > 0 ? { files: fileMetadata } : {})
      } as ChatMessage

      chatMessages.push(userChatMessage)

      if (fileMetadata.length > 0) {
        console.log('📎 Sending message with files:', {
          fileCount: fileMetadata.length,
          files: fileMetadata.map((f) => ({ id: f.id, name: f.name, type: f.type, size: f.size }))
        })
      }

      if (wantsToUnderstandUploadedFile) {
        logger.info('[ChatInterface] 用户想了解上传文件，跳过当前文档上下文', {
          originalInput: currentInput,
          skipCurrentDocContext: true
        })
      }

      logger.info('Sending AI request through useFunctionCalling', {
        model: resolvedModelId,
        messageCount: chatMessages.length,
        lastUserMessage: effectiveUserInput.substring(0, 200),
        knowledgeBaseIds: selectedKnowledgeBases,
        mcpToolIds: selectedMCPTools,
        enableWebSearch: webSearchEnabled,
        hasFiles: fileMetadata.length > 0
      })

      // 🆕 读取文档数据（如果启用了二进制文档功能）
      let documentData: DocumentData | undefined = undefined
      if (featureFlags?.officeBinaryDocEnabled && currentOfficeApp !== 'none') {
        try {
          if (binaryDocumentAdapter.isSupported()) {
            documentData = await binaryDocumentAdapter.readCurrentDocument()
            logger.info('Document data read successfully', {
              type: documentData.type,
              size: documentData.size,
              hasFilename: !!documentData.filename
            })
          }
        } catch (error) {
          logger.warn('Failed to read document data, falling back to text mode', { error })
        }
      }

      // 🎯 根据 chatMode 和用户意图决定 effectiveIntent
      // Ask 模式：始终使用 'query'，不触发工具调用和改写建议
      // Agent 模式：根据用户意图智能决定
      let effectiveIntent: 'edit' | 'query' | 'command'
      if (chatMode === 'ask') {
        // Ask 模式：只回答问题，不生成改写建议
        effectiveIntent = 'query'
      } else if (wantsToUnderstandUploadedFile) {
        // 用户想要了解上传文件，不强制工具调用
        effectiveIntent = 'query'
      } else {
        // Agent 模式：根据检测到的用户意图
        effectiveIntent = userIntent === UserIntent.COMMAND ? 'command' : userIntent === UserIntent.EDIT ? 'edit' : 'query'
      }

      logger.info('[CHAT_MODE] Intent decision', {
        chatMode,
        originalIntent: userIntent,
        effectiveIntent,
        wantsToUnderstandUploadedFile
      })

      await sendMessage({
        chatMessages,
        isSelectionMode,
        currentOfficeApp,
        hasDocument,
        userIntent: effectiveIntent,
        documentData
      })
    } catch (error) {
      const err = error as { name?: string; message?: string; code?: string; type?: string }

      if (err?.name === 'AbortError') {
        logger.info('请求已取消')
      } else {
        logger.error('AI 调用失败', { error: err })

        const errorMessageId = `error-${Date.now()}`
        const errorBlock: MessageBlock = {
          id: `${errorMessageId}-block-0`,
          messageId: errorMessageId,
          type: MessageBlockType.ERROR,
          createdAt: new Date().toISOString(),
          status: MessageBlockStatus.ERROR,
          content: err?.message || '未知错误',
          error: {
            message: err?.message || '未知错误',
            code: err?.code,
            type: err?.type || 'unknown_error'
          }
        }

        const errorMessage: Message = {
          id: errorMessageId,
          role: 'assistant',
          blocks: [errorBlock],
          createdAt: new Date().toISOString(),
          error: true
        }

        setMessages((prev) => [...prev, errorMessage])
      }

      setIsLoading(false)
    }
  }

  const handleRetry = async (messageId: string) => {
    // 找到错误消息
    const errorMessage = messages.find((m) => m.id === messageId)
    if (errorMessage && errorMessage.error) {
      // 移除错误消息
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      // 获取最后一条用户消息并重新发送
      const lastUserMessage = messages
        .slice()
        .reverse()
        .find((m) => m.role === 'user')

      if (lastUserMessage) {
        const userContent = lastUserMessage.blocks
          .filter((b) => b.type === MessageBlockType.MAIN_TEXT)
          .map((b) => (b as MainTextMessageBlock).content)
          .join('\n')

        if (userContent) {
          setInputText(userContent)
          // 等待 UI 更新后再发送消息
          await new Promise((resolve) => setTimeout(resolve, 100))
          await handleSendMessage()
        }
      }
    }
  }

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId)
    onModelChange?.(modelId)
  }

  // P6 修复：使用 useChatInputState 提供的方法处理文件附件
  const handleFileAttached = useCallback((file: FileAttachmentData) => {
    logger.info('File attached', { fileName: file.fileName, fileId: file.fileId })
    addAttachedFile(file)
  }, [addAttachedFile])

  const handleFileRemoved = useCallback((fileId: string) => {
    logger.info('File removed', { fileId })
    removeAttachedFile(fileId)
  }, [removeAttachedFile])

  const handleFileUploadError = (error: Error) => {
    logger.error('File upload error', { error: error.message })
    // TODO: 可以添加 Toast 通知显示错误信息
  }

  // 🆕 多轮对话：处理澄清问题回答
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
      // 澄清完成，继续执行
      setActiveClarification(null)
      if (result.enhancedIntent) {
        // 使用增强后的意图发送消息
        setInputText(result.enhancedIntent)
        setTimeout(() => handleSendMessage(), 100)
      }
    } else if (result.clarificationQuestion) {
      // 还有更多问题
      setActiveClarification(result.clarificationQuestion)
    }
  }, [activeClarification, activeSessionId, multiTurn])

  // 🆕 更新消息列表中的 TaskPlanMessageBlock 状态
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
            // 更新计划状态（使用 TaskPlanMessageBlock 定义的状态类型）
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
            
            // 如果有步骤更新
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
  }, [])

  // 🆕 多轮对话：处理任务计划确认（两阶段执行）
  const handleConfirmTaskPlan = useCallback(async () => {
    if (!activeTaskPlan) return

    // 🐛 修复：即使 session 丢失也继续执行，使用本地 activeTaskPlan
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

    // 更新 UI 状态为 executing
    updateTaskPlanBlockStatus(activeTaskPlan.id, 'executing')

    // 开始分步执行
    setIsExecutingPlan(true)
    setCurrentStepIndex(0)

    try {
      // 使用分步执行器
      await executeTaskPlan(activeTaskPlan, (stepIndex, stepResult) => {
        setCurrentStepIndex(stepIndex + 1)
        
        // 更新步骤状态
        updateTaskPlanBlockStatus(activeTaskPlan.id, 'executing', {
          stepIndex,
          stepStatus: stepResult.success ? 'completed' : 'failed',
          resultSummary: stepResult.message,
          error: stepResult.success ? undefined : stepResult.message
        })
        
        logger.info('[MULTI_TURN] Step completed', {
          stepIndex,
          success: stepResult.success
        })
      })

      // 更新为完成状态
      updateTaskPlanBlockStatus(activeTaskPlan.id, 'completed')
      logger.info('[MULTI_TURN] Task plan execution completed')
    } catch (error) {
      // 更新为失败状态
      updateTaskPlanBlockStatus(activeTaskPlan.id, 'failed')
      logger.error('[MULTI_TURN] Task plan execution failed', { error })
    } finally {
      setActiveTaskPlan(null)
      setIsExecutingPlan(false)
      setCurrentStepIndex(-1)
    }
  }, [activeTaskPlan, activeSessionId, multiTurn, executeTaskPlan, updateTaskPlanBlockStatus])

  // 🆕 应用待执行的修改
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

  // 🆕 放弃待执行的修改
  const handleDiscardPendingChanges = useCallback((planId: string) => {
    pendingOpsStore.discardPlan(planId)
    logger.info('[PENDING_OPS] Pending changes discarded', { planId })
  }, [pendingOpsStore])

  // 🆕 回滚已应用的修改
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

  // 🆕 多轮对话：取消澄清或计划
  const handleCancelMultiTurn = useCallback(() => {
    if (activeSessionId) {
      multiTurn.cancelSession(activeSessionId)
    }
    setActiveClarification(null)
    setActiveTaskPlan(null)
    setActiveSessionId(null)
    setIsExecutingPlan(false)
    setCurrentStepIndex(-1)
  }, [activeSessionId, multiTurn])

  // 🆕 多轮对话：跳过澄清问题
  const handleSkipClarification = useCallback(() => {
    setActiveClarification(null)
    // 使用原始意图继续
    if (multiTurn.currentSession?.originalIntent) {
      setInputText(multiTurn.currentSession.originalIntent)
      setTimeout(() => handleSendMessage(), 100)
    }
  }, [multiTurn])

  // 🆕 预览：生成任务计划的预览
  const generatePlanPreview = useCallback((plan: TaskPlan) => {
    const preview = previewGenerator.generatePlanPreview(plan)
    setActivePreview(preview)
    
    // 提取所有待执行的工具调用
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
  }, [])

  // 🆕 预览：确认执行预览的操作
  const handleConfirmPreview = useCallback(async () => {
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
  }, [pendingToolCalls, executeConfirmedTools])

  // 🆕 预览：取消预览
  const handleCancelPreview = useCallback(() => {
    setActivePreview(null)
    setPendingToolCalls(null)
    logger.info('[PREVIEW] User cancelled preview')
  }, [])

  // 通用的应用到 Office 处理函数(根据当前应用自动选择)
  const handleApplyToOffice = (messageId: string) => {
    console.log('📋 Apply to Office clicked for message:', messageId, 'App:', currentOfficeApp)

    switch (currentOfficeApp) {
      case 'word':
        console.warn('Word edit panel is disabled - tools modify document directly')
        break
      case 'excel':
        openExcelEditPanel(messageId)
        break
      case 'powerpoint':
        openPowerPointEditPanel(messageId)
        break
      default:
        console.warn('No Office application detected')
    }
  }

  // 获取选中消息的文本内容（用于 Word 编辑）
  const getMessageTextContent = (messageId: string): string => {
    const message = messages.find((m) => m.id === messageId)
    if (!message) return ''

    return message.blocks
      .filter((b) => b.type === MessageBlockType.MAIN_TEXT)
      .map((b) => (b as MainTextMessageBlock).content)
      .join('\n')
  }

  // 优化的事件处理器 - 使用 useCallback 避免子组件不必要的重新渲染
  const handleCopyMessage = useCallback(
    async (messageId: string) => {
      const message = messages.find((m) => m.id === messageId)
      if (message) {
        await messageOperations.copyMessage(message)
        console.log('[ChatInterface] Message copied:', messageId)
      }
    },
    [messages, messageOperations]
  )

  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      messageOperations.deleteMessage(messageId)
      console.log('[ChatInterface] Message deleted:', messageId)
    },
    [messageOperations]
  )

  const handleRegenerateMessage = useCallback(
    async (messageId: string) => {
      const message = messages.find((m) => m.id === messageId)
      if (message) {
        if (message.role === 'assistant') {
          await messageOperations.regenerateAssistantMessage(message)
        } else {
          await messageOperations.regenerateUserMessage(message)
        }
        console.log('[ChatInterface] Message regenerated:', messageId)
      }
    },
    [messages, messageOperations]
  )

  const handleUndoCommand = useCallback(
    async (messageId: string): Promise<boolean> => {
      const targetMessage = messages.find((m) => m.id === messageId)
      if (!targetMessage) {
        logger.warn('Cannot undo: message not found', { messageId })
        return false
      }

      if (currentOfficeApp !== 'word') {
        logger.warn('Undo is only supported for Word documents', {
          messageId,
          currentOfficeApp
        })
        return false
      }

      try {
        if (undoManagerRef.current) {
          const undoCount = await undoManagerRef.current.undoMessageOperations(messageId)
          if (undoCount > 0) {
            logger.info('Undo manager reverted operations', { messageId, undoCount })
            return true
          }
        }

        const toolBlocks = targetMessage.blocks.filter(
          (block): block is ToolMessageBlock => block.type === MessageBlockType.TOOL
        )
        const successfulToolCalls = toolBlocks.filter((block) => block.status === MessageBlockStatus.SUCCESS)
        const undoCount = successfulToolCalls.length

        if (undoCount === 0) {
          logger.warn('No successful tool operations to undo', {
            messageId,
            toolBlockCount: toolBlocks.length
          })
          return false
        }

        await wordService.undo()
        // Note: undo() no longer returns a value after refactoring
        {
          logger.info('Word undo executed successfully', {
            messageId,
            undoCount,
            toolNames: successfulToolCalls.map((b) => (b as any).toolName)
          })
          return true
        }

        logger.error('Word undo failed', {
          messageId,
          undoCount
        })
        return false
      } catch (error) {
        logger.error('Failed to undo command operations', {
          messageId,
          error
        })
        return false
      }
    },
    [messages, currentOfficeApp]
  )

  const showWelcomeState = !isLoading && messages.length === 0

  return (
    <div className={`${styles.root} ${className || ''}`}>
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <AnimatedBackground />
        {/* ChatBackground 已移除，使用 EmptyState 统一处理空状态 */}
        <div className="relative z-10 flex flex-1 flex-col">
          {!connected && showBanner && (
            <div className="px-4 pt-4">
              <ConnectionBanner
                error="无法连接到 office-local-bridge 服务，请确保服务正在运行"
                onDismiss={() => setShowBanner(false)}
              />
            </div>
          )}

          <MessageList
            messages={messages}
            loading={isLoading}
            onRetry={handleRetry}
            onCopy={handleCopyMessage}
            onDelete={handleDeleteMessage}
            onRegenerate={handleRegenerateMessage}
            onApplyToWord={handleApplyToOffice}
            onUndoCommand={handleUndoCommand}
            onSuggestionClick={(suggestion) => {
              if (!suggestion) return
              setInputText(suggestion.prompt || suggestion.title)
            }}
            className={`${styles.messageList} relative`}
          />

          {activeClarification && !isLoading && (
            <div style={{ padding: '8px 16px' }}>
              <ClarificationCard
                question={activeClarification}
                onAnswer={handleClarificationAnswer}
                onSkip={handleSkipClarification}
              />
            </div>
          )}

          {/* 🆕 TaskPlanCard 已移除 - 任务计划现在直接显示在对话流中 (Windsurf 风格) */}

          {activePreview && !isLoading && (
            <div style={{ padding: '8px 16px' }}>
              <PreviewCard
                planPreview={activePreview}
                onConfirm={handleConfirmPreview}
                onCancel={handleCancelPreview}
                isExecuting={isProcessing}
              />
            </div>
          )}

          {/* 🆕 待应用修改卡片 - 延迟执行模式 */}
          {pendingOpsStore.activePlanId && pendingOpsStore.getActivePlan()?.status === 'pending' && (
            <div style={{ padding: '8px 16px' }}>
              <PendingChangesCard
                plan={pendingOpsStore.getActivePlan()!}
                isApplying={pendingOpsStore.isApplying}
                applyProgress={pendingOpsStore.applyProgress}
                currentOperationIndex={pendingOpsStore.currentOperationIndex}
                onApplyAll={() => pendingOpsStore.activePlanId && handleApplyPendingChanges(pendingOpsStore.activePlanId)}
                onDiscard={() => pendingOpsStore.activePlanId && handleDiscardPendingChanges(pendingOpsStore.activePlanId)}
                onRollback={() => pendingOpsStore.activePlanId && handleRollbackChanges(pendingOpsStore.activePlanId)}
              />
            </div>
          )}

          <Inputbar
            value={inputText}
            onChange={setInputText}
            onSubmit={handleSendMessage}
            disabled={isLoading || !connected || configLoading}
            placeholder={
              !connected ? '未连接到服务...' : configLoading ? '正在加载配置...' : '在这里输入消息，按 Enter 发送'
            }
            knowledgeBases={knowledgeBases}
            selectedKnowledgeBases={selectedKnowledgeBases}
            onKnowledgeBasesChange={setSelectedKnowledgeBases}
            mcpServers={mcpServers}
            selectedMCPTools={selectedMCPTools}
            onMCPToolsChange={setSelectedMCPTools}
            attachedFiles={attachedFiles}
            onFileAttach={handleFileAttached}
            onFileRemove={handleFileRemoved}
            webSearchEnabled={webSearchEnabled}
            webSearchProviderId={webSearchProviderId}
            onWebSearchChange={(enabled, providerId) => {
              setWebSearchEnabled(enabled)
              setWebSearchProviderId(providerId)
            }}
            chatMode={chatMode}
            onChatModeChange={setChatMode}
            className={`${styles.inputArea} px-4 pb-2`}
          />
          
          {/* 底部版权信息 - 匹配设计稿，增强对比度 */}
          <div className="pb-4 text-center">
            <p className="text-xs text-foreground/50 dark:text-foreground/60 font-medium tracking-wide">
              武汉问津职业学校 AI助手 · 内容仅供参考，请核实重要信息
            </p>
          </div>
        </div>
      </div>

      {/* Excel 编辑面板 */}
      {excelEditPanelOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '450px',
            backgroundColor: 'white',
            boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            overflow: 'hidden'
          }}>
          <ExcelEditPanel
            aiSuggestions={getMessageTextContent(selectedMessageForEdit)}
            visible={excelEditPanelOpen}
            onClose={closeExcelEditPanel}
          />
        </div>
      )}

      {/* PowerPoint 编辑面板 */}
      {powerPointEditPanelOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '450px',
            backgroundColor: 'white',
            boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            overflow: 'hidden'
          }}>
          <PowerPointEditPanel
            aiText={getMessageTextContent(selectedMessageForEdit)}
            visible={powerPointEditPanelOpen}
            onClose={closePowerPointEditPanel}
          />
        </div>
      )}

      {/* 确认对话框 */}
      <ConfirmDialog />

      {/* 批量确认对话框 */}
      <BatchConfirmDialog />
    </div>
  )
}
