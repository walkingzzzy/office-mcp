/**
 * useToolExecution Hook
 * 负责工具选择和执行逻辑
 *
 * @updated 2025-12-29 - 添加工具定义缓存支持 (修复 P5)
 */

import { useCallback, useEffect, useRef } from 'react'

import aiService from '../../../../../services/ai/aiService'
import { getFunctionRegistry } from '../../../../../services/ai/FormattingFunctionRegistry'
import { FunctionCallHandler } from '../../../../../services/ai/FunctionCallHandler'
import { dynamicToolDiscovery, type ToolDefinition } from '../../../../../services/ai/toolSelection/DynamicToolDiscovery'
import { McpToolExecutor } from '../../../../../services/ai/McpToolExecutor'
import { toolDefinitionCache } from '../../../../../services/ai/toolSelection/ToolDefinitionCache'
import { IntentExtractor, PromptBuilder, PromptSelector } from '../../../../../services/ai/prompts'
import { ResponseAnalyzer } from '../../../../../services/ai/ResponseAnalyzer'
import { getSelectionContextForApp, type OfficeAppType } from '../../../../../services/ai/SelectionContextProvider'
import { selectionContextCache } from '../../../../../services/cache'
import { getAdapter, adapterRegistry } from '../../../../../services/adapters'
import { StreamToolCallAccumulator } from '../../../../../services/ai/StreamToolCallAccumulator'
import { ToolSelector } from '../../../../../services/ai/toolSelection/ToolSelector'
import { FunctionCategory, type FormattingFunction, type JsonSchemaProperty, type SelectionContext, type ToolCall, type ToolInputSchema } from '../../../../../services/ai/types'
import type { ChatMessage } from '../../../../../types/ai'
import { MessageBlockStatus, MessageBlockType, type MessageBlock, type ToolMessageBlock } from '../../../../../types/messageBlock'
import Logger from '../../../../../utils/logger'
import type { FunctionCallState, StateConfig } from '../state/useFunctionCallState'

const logger = new Logger('useToolExecution')

const sharedMcpExecutor = new McpToolExecutor()

function normalizeInputSchema(schema: Record<string, unknown> | undefined): ToolInputSchema {
  if (schema && schema.type === 'object') {
    return {
      type: 'object',
      properties: (schema.properties as Record<string, JsonSchemaProperty>) || {},
      required: (schema.required as string[]) || []
    }
  }
  return {
    type: 'object',
    properties: {},
    required: []
  }
}

function detectFunctionCategory(toolName: string): FunctionCategory {
  const lower = toolName.toLowerCase()
  if (lower.includes('table')) return FunctionCategory.TABLE
  if (lower.includes('image') || lower.includes('picture')) return FunctionCategory.IMAGE
  if (lower.includes('paragraph')) return FunctionCategory.PARAGRAPH
  if (lower.includes('style')) return FunctionCategory.STYLE
  if (lower.includes('list')) return FunctionCategory.LIST
  if (lower.includes('font') || lower.includes('format')) return FunctionCategory.FONT
  if (lower.includes('page') || lower.includes('layout')) return FunctionCategory.LAYOUT
  if (lower.includes('comment') || lower.includes('note')) return FunctionCategory.COMMENT
  if (lower.includes('hyperlink') || lower.includes('reference') || lower.includes('toc')) {
    return FunctionCategory.REFERENCE
  }
  return FunctionCategory.SMART
}

function mapPriority(label?: string): number | undefined {
  switch (label) {
    case 'P0':
      return 0
    case 'P1':
      return 1
    case 'P2':
      return 2
    default:
      return undefined
  }
}

function convertToolDefinitionToFormattingFunction(tool: ToolDefinition): FormattingFunction {
  const inputSchema = normalizeInputSchema(tool.inputSchema)
  const metadataPriority = mapPriority(tool.metadata?.priority)
  return {
    name: tool.name,
    description: tool.description || 'MCP 工具',
    category: detectFunctionCategory(tool.name),
    inputSchema,
    handler: async (args: Record<string, unknown>) => sharedMcpExecutor.executeTool(tool.name, args),
    executor: (args: Record<string, unknown>) => sharedMcpExecutor.executeTool(tool.name, args),
    priority: metadataPriority ?? (tool.name.includes('insert') ? 0 : 2),
    metadata: {
      scenario: tool.metadata?.scenario,
      contextTip: tool.metadata?.contextTip,
      intentKeywords: tool.metadata?.intentKeywords,
      applicableSelection: tool.metadata?.applicableFor,
      documentTypes: tool.metadata?.documentTypes as Array<'word' | 'excel' | 'powerpoint'> | undefined,
      priorityLabel: tool.metadata?.priority as 'P0' | 'P1' | 'P2' | undefined,
      tags: tool.metadata?.tags
    }
  }
}

async function synchronizeMcpTools(registry: ReturnType<typeof getFunctionRegistry>): Promise<boolean> {
  try {
    const { baseUrl, apiKey } = aiService.getConfig()

    // 🎯 优化：先检查缓存是否有效
    const cachedTools = toolDefinitionCache.getTools(baseUrl, apiKey || '')
    if (cachedTools && cachedTools.length > 0) {
      // 缓存命中，直接使用缓存的工具定义
      const startTime = performance.now()
      cachedTools.forEach((tool) => {
        const formattingFunction = convertToolDefinitionToFormattingFunction(tool)
        registry.register(formattingFunction)
      })
      const elapsed = performance.now() - startTime

      logger.info('[MCP_TOOL_SYNC] ⚡ 使用缓存的工具定义', {
        totalRegistered: registry.getAllFunctions().length,
        cachedTools: cachedTools.length,
        elapsed: `${elapsed.toFixed(1)}ms`
      })
      return true
    }

    // 缓存未命中，从服务器获取
    logger.info('[MCP_TOOL_SYNC] 缓存未命中，从服务器获取工具定义...')
    const startTime = performance.now()

    dynamicToolDiscovery.configure(baseUrl, apiKey || '')
    
    // 🚀 性能优化：并行获取三类工具，而非串行
    const categories: Array<'word' | 'excel' | 'powerpoint'> = ['word', 'excel', 'powerpoint']
    const toolPromises = categories.map(category => 
      dynamicToolDiscovery.getAvailableTools('all', category)
    )
    const results = await Promise.all(toolPromises)
    const aggregatedTools: ToolDefinition[] = results.flat()
    
    logger.info('[MCP_TOOL_SYNC] 并行获取工具完成', {
      categories: categories.length,
      totalTools: aggregatedTools.length,
      elapsed: `${(performance.now() - startTime).toFixed(1)}ms`
    })

    if (aggregatedTools.length === 0) {
      logger.warn('[MCP_TOOL_SYNC] 没有从 MCP 服务器获取到可用工具')
      return true
    }

    aggregatedTools.forEach((tool) => {
      const formattingFunction = convertToolDefinitionToFormattingFunction(tool)
      registry.register(formattingFunction)
    })

    // 🎯 优化：保存到缓存
    toolDefinitionCache.setTools(aggregatedTools, baseUrl, apiKey || '')

    const elapsed = performance.now() - startTime
    logger.info('[MCP_TOOL_SYNC] 已同步 MCP 工具（从服务器）', {
      totalRegistered: registry.getAllFunctions().length,
      newlyLoaded: aggregatedTools.length,
      elapsed: `${elapsed.toFixed(1)}ms`,
      cacheTTL: `${toolDefinitionCache.getTTL() / 1000}s`
    })
    return true
  } catch (error) {
    logger.error('[MCP_TOOL_SYNC] 同步 MCP 工具失败', { error })
    return false
  }
}

type OfficeApp = 'word' | 'excel' | 'powerpoint' | 'none'

export interface ToolExecutionCallbacks {
  addMessageBlocks: (messageId: string, blocks: MessageBlock[]) => void
}

interface ToolExecutionSummary {
  toolCallId: string
  toolName: string
  success: boolean
  message: string
  data?: unknown
  executionTime?: number
  rawContent: string
}

export function useToolExecution(
  getState: () => FunctionCallState,
  updateState: (updates: Partial<FunctionCallState>) => void,
  config: StateConfig,
  callbacks: ToolExecutionCallbacks
) {
  // 🆕 预热标记，避免重复预热
  const warmUpCompleteRef = useRef(false)
  
  // 🆕 预热基础设施（在组件挂载时执行一次）
  useEffect(() => {
    if (warmUpCompleteRef.current) {
      return
    }
    
    const warmUp = async () => {
      const startTime = Date.now()
      logger.info('[WARM_UP] 🚀 开始预热基础设施...')
      
      try {
        // 1. 初始化 Registry
        const registry = getFunctionRegistry()
        await registry.initialize()
        
        // 2. 同步 MCP 工具
        const synced = await synchronizeMcpTools(registry)
        
        // 3. 创建所有必要的组件
        const allFunctions = registry.getAllFunctions()
        const handler = new FunctionCallHandler(registry, {
          onConfirmRequest: config.onConfirmRequest,
          onBatchConfirm: config.onBatchConfirm,
          onProgress: config.onProgress,
          undoManager: config.undoManager
        })
        const accumulator = new StreamToolCallAccumulator()
        const toolSelector = new ToolSelector(allFunctions)
        const responseAnalyzer = new ResponseAnalyzer(allFunctions)
        const promptSelector = new PromptSelector()
        const promptBuilder = new PromptBuilder()
        const intentExtractor = new IntentExtractor()
        
        // 4. 更新状态
        updateState({
          registry,
          handler,
          accumulator,
          toolSelector,
          responseAnalyzer,
          promptSelector,
          promptBuilder,
          intentExtractor,
          mcpToolsLoaded: synced
        })
        
        warmUpCompleteRef.current = true
        
        const elapsed = Date.now() - startTime
        logger.info('[WARM_UP] ✅ 基础设施预热完成', {
          elapsed: `${elapsed}ms`,
          functionCount: allFunctions.length,
          mcpToolsSynced: synced
        })
      } catch (error) {
        logger.error('[WARM_UP] ❌ 预热失败，将在首次请求时初始化', { error })
      }
    }
    
    warmUp()
  }, []) // 仅在挂载时执行一次

  const ensureFunctionInfrastructure = useCallback(async () => {
    const state = getState()
    let registry = state.registry
    if (!registry) {
      registry = getFunctionRegistry()
      await registry.initialize()
      updateState({ registry })
      logger.info('FormattingFunctionRegistry initialized')
    }

    let accumulator = state.accumulator
    if (!accumulator) {
      accumulator = new StreamToolCallAccumulator()
      updateState({ accumulator })
    }

    let handler = state.handler
    if (!handler) {
      handler = new FunctionCallHandler(registry, {
        onConfirmRequest: config.onConfirmRequest,
        onBatchConfirm: config.onBatchConfirm,
        onProgress: config.onProgress,
        undoManager: config.undoManager
      })
      updateState({ handler })
    }

    if (!state.mcpToolsLoaded) {
      const synced = await synchronizeMcpTools(registry)
      updateState({ mcpToolsLoaded: synced })
    }

    const allFunctions = registry.getAllFunctions()
    let toolSelector = state.toolSelector
    if (!toolSelector) {
      toolSelector = new ToolSelector(allFunctions)
      updateState({ toolSelector })
    } else {
      toolSelector.updateFunctions(allFunctions)
    }

    let responseAnalyzer = state.responseAnalyzer
    if (!responseAnalyzer) {
      responseAnalyzer = new ResponseAnalyzer(allFunctions)
      updateState({ responseAnalyzer })
    } else {
      responseAnalyzer.updateFunctions(allFunctions)
    }

    let promptSelector = state.promptSelector
    if (!promptSelector) {
      promptSelector = new PromptSelector()
      updateState({ promptSelector })
    }

    let promptBuilder = state.promptBuilder
    if (!promptBuilder) {
      promptBuilder = new PromptBuilder()
      updateState({ promptBuilder })
    }

    let intentExtractor = state.intentExtractor
    if (!intentExtractor) {
      intentExtractor = new IntentExtractor()
      updateState({ intentExtractor })
    }

    return {
      registry,
      accumulator,
      handler,
      toolSelector,
      responseAnalyzer,
      promptSelector,
      promptBuilder,
      intentExtractor
    }
  }, [getState, updateState, config])

  /**
   * 选择工具并返回选区上下文
   * @returns 包含工具列表和选区上下文的对象
   */
  const selectToolsForMessage = useCallback(
    async (
      userMessage?: string,
      currentOfficeApp?: OfficeApp,
      infrastructure?: Awaited<ReturnType<typeof ensureFunctionInfrastructure>>
    ): Promise<{ tools: FormattingFunction[]; selectionContext: SelectionContext }> => {
      const state = getState()
      const registry = infrastructure?.registry ?? state.registry
      const toolSelector = infrastructure?.toolSelector ?? state.toolSelector

      // 默认选区上下文
      const defaultSelectionContext: SelectionContext = {
        hasSelection: false,
        selectionType: 'none',
        documentType: (currentOfficeApp === 'none' || !currentOfficeApp ? 'word' : currentOfficeApp) as 'word' | 'excel' | 'powerpoint'
      }

      if (!registry) {
        logger.warn('[TOOL SELECTION] Registry not initialized')
        return { tools: [], selectionContext: defaultSelectionContext }
      }

      if (!userMessage || !toolSelector) {
        return { tools: registry.getFunctionsByPriority(5), selectionContext: defaultSelectionContext }
      }

      // 🆕 使用统一的选区上下文获取函数，支持 Word/Excel/PowerPoint
      // 🎯 P1 优化：使用选区上下文缓存
      let selectionContext: SelectionContext
      try {
        // 先检查缓存
        const cachedContext = selectionContextCache.get(currentOfficeApp as OfficeAppType)
        if (cachedContext) {
          selectionContext = cachedContext
          logger.info('[TOOL SELECTION] Using cached selection context', { 
            currentOfficeApp,
            selectionContext 
          })
        } else {
          // 缓存未命中，从 Office.js API 获取
          selectionContext = await getSelectionContextForApp(
            currentOfficeApp as OfficeAppType,
            config.wordService
          )
          // 设置缓存
          selectionContextCache.set(currentOfficeApp as OfficeAppType, selectionContext)
          logger.info('[TOOL SELECTION] Selection context retrieved and cached', { 
            currentOfficeApp,
            selectionContext 
          })
        }
      } catch (error) {
        logger.error('[TOOL SELECTION] Failed to get selection context', { error, currentOfficeApp })
        // 失败时返回默认上下文，保持 documentType 与 currentOfficeApp 一致
        selectionContext = {
          hasSelection: false,
          selectionType: 'none',
          documentType: (currentOfficeApp === 'none' ? 'word' : currentOfficeApp) as 'word' | 'excel' | 'powerpoint'
        }
      }

      const candidateTools = toolSelector.selectCandidateTools(userMessage, selectionContext, 15)

      const totalAvailableTools = registry.getAllFunctions().length
      const estimatedTokenPerTool = 200
      const estimatedTokenSaved = (totalAvailableTools - candidateTools.length) * estimatedTokenPerTool
      const tokenSavingPercentage = Math.round(
        ((totalAvailableTools - candidateTools.length) / totalAvailableTools) * 100
      )

      logger.info('[TOOL SELECTION] Candidate tools selected', {
        userMessage,
        selectionContext,
        candidateCount: candidateTools.length,
        candidateToolNames: candidateTools.map((t) => t.name),
        totalAvailableTools,
        estimatedTokenSaved,
        tokenSavingPercentage: `${tokenSavingPercentage}%`,
        selectionReason: {
          hasKeywordMatch: candidateTools.length > 0,
          contextType: selectionContext.selectionType,
          usedFallback: candidateTools.length === 0
        },
        performance: {
          toolsIfNoOptimization: totalAvailableTools,
          toolsAfterOptimization: candidateTools.length,
          reductionRatio: `${Math.round((candidateTools.length / totalAvailableTools) * 100)}%`
        }
      })

      if (candidateTools.length === 0) {
        logger.warn('[TOOL SELECTION] No candidate tools found, using fallback')
        return { tools: registry.getFunctionsByPriority(10), selectionContext }
      }

      return { tools: candidateTools, selectionContext }
    },
    [getState, config]
  )

  const executeToolCalls = useCallback(
    async (toolCalls: ToolCall[], aiMessageId: string): Promise<{
      toolMessages: ChatMessage[]
      executionSummaries: ToolExecutionSummary[]
    }> => {
      const { handler } = getState()
      if (!handler) {
        throw new Error('FunctionCallHandler is not initialized')
      }

      logger.info(`Executing ${toolCalls.length} tool calls`)
      const toolResults = await handler.handleToolCalls(toolCalls, {
        messageId: aiMessageId
      })

      const toolMessages: ChatMessage[] = []
      const executionSummaries: ToolExecutionSummary[] = []

      toolResults.forEach((result, index) => {
        const toolCall = toolCalls[index]
        let parsedContent: Record<string, unknown> | string | null = null
        let parsedSuccessfully = false
        try {
          parsedContent = JSON.parse(result.content) as Record<string, unknown>
          parsedSuccessfully = true
        } catch {
          parsedContent = result.content
        }

        const toolBlock: ToolMessageBlock = {
          id: `${aiMessageId}-executed-tool-${index}`,
          messageId: aiMessageId,
          type: MessageBlockType.TOOL,
          createdAt: new Date().toISOString(),
          status: MessageBlockStatus.SUCCESS,
          toolId: result.tool_call_id,
          toolName: toolCall?.function.name || `function_${index}`,
          arguments: (() => {
            try {
              return JSON.parse(toolCall?.function.arguments || '{}') as Record<string, unknown>
            } catch {
              return { raw: toolCall?.function.arguments }
            }
          })(),
          content: parsedSuccessfully ? parsedContent : result.content
        }

        callbacks.addMessageBlocks(aiMessageId, [toolBlock])

        toolMessages.push({
          role: 'tool',
          tool_call_id: result.tool_call_id,
          content: result.content
        })

        const parsedObj = typeof parsedContent === 'object' && parsedContent !== null ? parsedContent : null
        const summarySuccess = parsedSuccessfully && parsedObj ? Boolean(parsedObj.success) : false
        const summaryMessage = parsedSuccessfully && parsedObj
          ? (typeof parsedObj.message === 'string' ? parsedObj.message : '')
          : '无法解析工具执行结果'

        executionSummaries.push({
          toolCallId: result.tool_call_id,
          toolName: toolCall?.function.name || `function_${index}`,
          success: summarySuccess,
          message: summaryMessage,
          data: parsedSuccessfully && parsedObj ? parsedObj.data : undefined,
          executionTime: parsedSuccessfully && parsedObj ? (parsedObj.executionTime as number | undefined) : undefined,
          rawContent: result.content
        })
      })

      return { toolMessages, executionSummaries }
    },
    [getState, callbacks]
  )

  return {
    ensureFunctionInfrastructure,
    selectToolsForMessage,
    executeToolCalls
  }
}
