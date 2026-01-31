/**
 * useFunctionCallState Hook
 * 负责 Function Calling 的状态管理
 */

import { useCallback,useRef } from 'react'

import { FormattingFunctionRegistry } from '../../../../../services/ai/FormattingFunctionRegistry'
import { FunctionCallHandler } from '../../../../../services/ai/FunctionCallHandler'
import { IntentExtractor, PromptBuilder, PromptSelector } from '../../../../../services/ai/prompts'
import { ResponseAnalyzer } from '../../../../../services/ai/ResponseAnalyzer'
import { StreamToolCallAccumulator } from '../../../../../services/ai/StreamToolCallAccumulator'
import { ToolSelector } from '../../../../../services/ai/toolSelection/ToolSelector'
import type { BatchConfirmCallback, ConfirmRequestCallback, ProgressCallback, ToolCall } from '../../../../../services/ai/types'
import type { UndoManager } from '../../../../../services/UndoManager'
import type { ChatMessage } from '../../../../../types/ai'
import Logger from '../../../../../utils/logger'

const logger = new Logger('useFunctionCallState')

export interface FunctionCallState {
  registry: FormattingFunctionRegistry | null
  handler: FunctionCallHandler | null
  accumulator: StreamToolCallAccumulator | null
  toolSelector: ToolSelector | null
  responseAnalyzer: ResponseAnalyzer | null
  promptSelector: PromptSelector | null
  promptBuilder: PromptBuilder | null
  intentExtractor: IntentExtractor | null
  mcpToolsLoaded: boolean
  pendingOfficeExecutions: Array<{
    toolCalls: ToolCall[]
    toolMessages: ChatMessage[]
  }>
  isProcessingFollowUp: boolean
  processedToolCallIds: Set<string>
}

export interface StateConfig {
  wordService: any
  onConfirmRequest?: ConfirmRequestCallback
  onBatchConfirm?: BatchConfirmCallback
  onProgress?: ProgressCallback
  undoManager?: UndoManager
}

export function useFunctionCallState(config: StateConfig) {
  const registryRef = useRef<FormattingFunctionRegistry | null>(null)
  const handlerRef = useRef<FunctionCallHandler | null>(null)
  const accumulatorRef = useRef<StreamToolCallAccumulator | null>(null)
  const toolSelectorRef = useRef<ToolSelector | null>(null)
  const responseAnalyzerRef = useRef<ResponseAnalyzer | null>(null)
  const promptSelectorRef = useRef<PromptSelector | null>(null)
  const promptBuilderRef = useRef<PromptBuilder | null>(null)
  const intentExtractorRef = useRef<IntentExtractor | null>(null)
  const mcpToolsLoadedRef = useRef<boolean>(false)
  const pendingOfficeExecutionsRef = useRef<Array<{
    toolCalls: ToolCall[]
    toolMessages: ChatMessage[]
  }>>([])
  const isProcessingFollowUpRef = useRef<boolean>(false)
  const processedToolCallIds = useRef<Set<string>>(new Set())

  const getState = useCallback((): FunctionCallState => ({
    registry: registryRef.current,
    handler: handlerRef.current,
    accumulator: accumulatorRef.current,
    toolSelector: toolSelectorRef.current,
    responseAnalyzer: responseAnalyzerRef.current,
    promptSelector: promptSelectorRef.current,
    promptBuilder: promptBuilderRef.current,
    intentExtractor: intentExtractorRef.current,
    mcpToolsLoaded: mcpToolsLoadedRef.current,
    pendingOfficeExecutions: pendingOfficeExecutionsRef.current,
    isProcessingFollowUp: isProcessingFollowUpRef.current,
    processedToolCallIds: processedToolCallIds.current
  }), [])

  const updateState = useCallback((updates: Partial<FunctionCallState>) => {
    if (updates.registry !== undefined) registryRef.current = updates.registry
    if (updates.handler !== undefined) handlerRef.current = updates.handler
    if (updates.accumulator !== undefined) accumulatorRef.current = updates.accumulator
    if (updates.toolSelector !== undefined) toolSelectorRef.current = updates.toolSelector
    if (updates.responseAnalyzer !== undefined) responseAnalyzerRef.current = updates.responseAnalyzer
    if (updates.promptSelector !== undefined) promptSelectorRef.current = updates.promptSelector
    if (updates.promptBuilder !== undefined) promptBuilderRef.current = updates.promptBuilder
    if (updates.intentExtractor !== undefined) intentExtractorRef.current = updates.intentExtractor
    if (updates.mcpToolsLoaded !== undefined) mcpToolsLoadedRef.current = updates.mcpToolsLoaded
    if (updates.pendingOfficeExecutions !== undefined) pendingOfficeExecutionsRef.current = updates.pendingOfficeExecutions
    if (updates.isProcessingFollowUp !== undefined) isProcessingFollowUpRef.current = updates.isProcessingFollowUp
    if (updates.processedToolCallIds !== undefined) processedToolCallIds.current = updates.processedToolCallIds
  }, [])

  const resetState = useCallback(() => {
    registryRef.current = null
    handlerRef.current = null
    accumulatorRef.current = null
    toolSelectorRef.current = null
    responseAnalyzerRef.current = null
    promptSelectorRef.current = null
    promptBuilderRef.current = null
    intentExtractorRef.current = null
    mcpToolsLoadedRef.current = false
    pendingOfficeExecutionsRef.current = []
    isProcessingFollowUpRef.current = false
    processedToolCallIds.current = new Set()
  }, [])

  return {
    getState,
    updateState,
    resetState,
    refs: {
      registryRef,
      handlerRef,
      accumulatorRef,
      toolSelectorRef,
      responseAnalyzerRef,
      promptSelectorRef,
      promptBuilderRef,
      intentExtractorRef,
      mcpToolsLoadedRef,
      pendingOfficeExecutionsRef,
      isProcessingFollowUpRef,
      processedToolCallIds
    }
  }
}
