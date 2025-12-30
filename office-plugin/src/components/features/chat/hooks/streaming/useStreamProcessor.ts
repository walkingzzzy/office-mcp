/**
 * useStreamProcessor Hook
 * 负责流式响应处理和消息管理
 */

import { useCallback, useRef } from 'react'

import { aiService } from '../../../../../services/ai'
import { getAdapter } from '../../../../../services/adapters'
import { AgentPromptManager, agentPromptManager, type OfficeAppType } from '../../../../../services/ai/prompts'
import type { FormattingFunction, ToolCall } from '../../../../../services/ai/types'
import type { DocumentData } from '../../../../../services/BinaryDocumentAdapter'
import type { ChatCompletionChunk, ChatMessage, ToolCallDelta, ToolDefinition } from '../../../../../types/ai'
import {
  type Citation,
  type CitationMessageBlock,
  type Message,
  type MessageBlock,
  MessageBlockStatus,
  MessageBlockType,
  type ToolMessageBlock
} from '../../../../../types/messageBlock'
import Logger from '../../../../../utils/logger'
import type { FunctionCallState } from '../state/useFunctionCallState'

const logger = new Logger('useStreamProcessor')

/** 流式 Office 工具响应 */
interface StreamOfficeToolResponse {
  id?: string
  toolCallId?: string
  tool?: {
    name?: string
    type?: string
  }
  arguments?: Record<string, unknown> | string
}

/** 流式 MCP 工具响应 */
interface StreamMcpToolResponse {
  id?: string
  toolCallId?: string
  tool?: {
    name?: string
    type?: string
    serverName?: string
  }
  toolName?: string
  status?: string
  success?: boolean
  arguments?: Record<string, unknown> | string
  response?: unknown
  result?: unknown
  message?: string
  serverName?: string
}

const RATE_LIMIT_ERROR_NAME = 'RateLimitError'
const RATE_LIMIT_MAX_RETRIES = 2
const RATE_LIMIT_BASE_DELAY_MS = 2000
const RATE_LIMIT_MAX_DELAY_MS = 15000
const PROVIDER_ERROR_NAME = 'AI_ProviderSpecificError'
 
const SPECIAL_CHUNK_REGEX = /\x00([A-Z_]+)\x00(.*?)\x00/g
const SPECIAL_CHUNK_STRIP_REGEX = /\x00[A-Z_]+\x00.*?\x00/g
 
const RETRYABLE_ERROR_NAMES = new Set([RATE_LIMIT_ERROR_NAME, PROVIDER_ERROR_NAME])

/**
 * 🎯 根据用户意图过滤 MCP 工具 ID
 * 当检测到单元格写入意图时，排除 word_insert_table
 */
function filterMcpToolsForIntent(mcpToolIds: string[], userMessage: string): string[] {
  // 检测单元格写入意图
  const rowColumnPattern = /第\s*\d+\s*行|第\s*\d+\s*列|row\s*\d|col\s*\d/i
  const cellWritePattern = /写入|填入|填充|设置.*单元格|表格.*写|cell.*value|write.*cell|在表格.*写/i
  const hasRowColumnRef = rowColumnPattern.test(userMessage)
  const hasCellWriteIntent = cellWritePattern.test(userMessage)
  
  // 检测表格创建意图
  const tableCreatePattern = /插入\s*(一个|一张|个)?\s*\d*\s*(行|列|x|\*)?\s*\d*\s*(行|列)?\s*(的)?\s*表格|创建.*表格|新建.*表格|insert.*table|create.*table|添加.*表格/i
  const hasTableCreateIntent = tableCreatePattern.test(userMessage)

  // 如果有单元格写入意图，且没有明确的创建表格意图，排除 word_insert_table
  if ((hasRowColumnRef || hasCellWriteIntent) && !hasTableCreateIntent) {
    const filtered = mcpToolIds.filter(id => !id.includes('word_insert_table'))
    logger.info('[MCP TOOL FILTER] Excluded word_insert_table from MCP tools', {
      hasRowColumnRef,
      hasCellWriteIntent,
      hasTableCreateIntent,
      originalCount: mcpToolIds.length,
      filteredCount: filtered.length
    })
    return filtered
  }

  return mcpToolIds
}

export interface StreamCallbacks {
  updateMessageBlock: (messageId: string, blockId: string, updates: Partial<MessageBlock>) => void
  addMessageBlocks: (messageId: string, blocks: MessageBlock[]) => void
  addMessage: (message: Message) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  setIsLoading: (loading: boolean) => void
  getMessage: (messageId: string) => Message | undefined
}

export interface StreamConfig {
  modelId: string
  knowledgeBases: string[]
  mcpTools: string[]
  webSearchEnabled: boolean
}

/**
 * Agent 提示词生成所需的上下文
 */
export interface AgentPromptOptions {
  /** Office 应用类型 */
  officeApp?: OfficeAppType
  /** 是否有选区 */
  hasSelection?: boolean
  /** 选区类型 */
  selectionType?: 'text' | 'image' | 'table' | 'none'
  /** 是否使用高级提示词（融合 availableTools 和 userIntent） */
  useAdvancedPrompt?: boolean
}

export function useStreamProcessor(
  getState: () => FunctionCallState,
  callbacks: StreamCallbacks,
  config: StreamConfig
) {
  const abortControllerRef = useRef<AbortController | null>(null)

  const createAssistantMessage = useCallback(
    (chatMessages: ChatMessage[], lifecycleContext: unknown): Message => {
      const messageId = `assistant-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

      const message: Message = {
        id: messageId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        blocks: []
      }

      callbacks.addMessage(message)
      callbacks.setIsLoading(true)

      return message
    },
    [callbacks]
  )

  const upsertToolBlock = useCallback(
    (block: ToolMessageBlock) => {
      const existingMessage = callbacks.getMessage(block.messageId)
      const existing = existingMessage?.blocks.find((b) => b.id === block.id)

      if (existing) {
        const updates: Partial<ToolMessageBlock> = {
          status: block.status,
          content: block.content,
          metadata: {
            ...(existing.metadata || {}),
            ...(block.metadata || {})
          }
        }

        // 只有 TOOL 类型的 block 才有 toolName 和 arguments
        if (block.type === MessageBlockType.TOOL && existing.type === MessageBlockType.TOOL) {
          const toolBlock = block as ToolMessageBlock
          const existingToolBlock = existing as ToolMessageBlock
          updates.toolName = toolBlock.toolName ?? existingToolBlock.toolName
          updates.arguments = toolBlock.arguments ?? existingToolBlock.arguments
        }

        callbacks.updateMessageBlock(block.messageId, block.id, updates)
      } else {
        callbacks.addMessageBlocks(block.messageId, [block])
      }
    },
    [callbacks]
  )

  const processStreamChunk = useCallback(
    (chunk: ChatCompletionChunk, aiMessageId: string, mainTextBlockId: string) => {
      const state = getState()
      // 🔧 修复：正确处理 ChatCompletionChunk 格式（OpenAI SSE 格式）
      // ChatCompletionChunk 格式：{ choices: [{ delta: { content?, tool_calls? }, finish_reason }] }
      const delta = chunk.choices?.[0]?.delta
      const finishReason = chunk.choices?.[0]?.finish_reason

      // 处理文本内容
      if (delta?.content !== undefined && delta.content !== null) {
        if (typeof delta.content === 'string' && delta.content.includes('\x00')) {
          SPECIAL_CHUNK_REGEX.lastIndex = 0
          let match: RegExpExecArray | null

          while ((match = SPECIAL_CHUNK_REGEX.exec(delta.content)) !== null) {
            const type = match[1]
            const payload = match[2]

            if (type === 'ERROR') {
              let errorPayload: { message?: string } | undefined
              try {
                errorPayload = JSON.parse(payload)
              } catch (parseError) {
                logger.error('Failed to parse embedded ERROR payload', {
                  payloadPreview: payload.substring(0, 120),
                  parseError
                })
              }

              const fallbackMessage = 'No output generated. 请稍后重试或在设置中切换到可用的模型提供商。'
              const message = errorPayload?.message || fallbackMessage

              callbacks.updateMessageBlock(aiMessageId, mainTextBlockId, {
                content: message,
                status: MessageBlockStatus.ERROR
              })

              const providerError = new Error(message)
              providerError.name = PROVIDER_ERROR_NAME
              throw providerError
            }
          }
        }

        // 注意：不要在这里更新 content，因为我们需要累积完整的文本
        // 文本累积在 sendStreamRequest 中处理
        logger.debug('Received text delta', {
          contentLength: delta.content.length,
          preview: delta.content.substring(0, 50)
        })
      }

      // 处理工具调用增量
      if (delta?.tool_calls && state.accumulator) {
        logger.debug('Received tool_calls delta', {
          count: delta.tool_calls.length,
          toolCalls: delta.tool_calls.map((tc: ToolCallDelta) => ({
            index: tc.index,
            id: tc.id,
            name: tc.function?.name,
            argsLength: tc.function?.arguments?.length
          }))
        })

        // 累积每个 tool_call delta
        delta.tool_calls.forEach((toolCallDelta: ToolCallDelta) => {
          state.accumulator!.accumulateToolCallDelta(toolCallDelta)
        })
      }

      // 当流结束时标记完成
      if (finishReason) {
        logger.info('Stream finished', {
          finishReason,
          hasAccumulator: !!state.accumulator
        })

        if (state.accumulator) {
          state.accumulator.markComplete()

          // 记录累积状态
          const status = state.accumulator.getAccumulationStatus()
          logger.info('Tool call accumulation status', status)
        }
      }

      // 保留对旧格式的兼容性（如果有的话）
      const chunkWithLegacy = chunk as ChatCompletionChunk & { type?: string; citations?: Citation[] }
      if (chunkWithLegacy.type === 'citations' && chunkWithLegacy.citations) {
        const citationBlock: CitationMessageBlock = {
          id: `${aiMessageId}-citations`,
          messageId: aiMessageId,
          type: MessageBlockType.CITATION,
          createdAt: new Date().toISOString(),
          status: MessageBlockStatus.SUCCESS,
          citations: chunkWithLegacy.citations
        }
        callbacks.addMessageBlocks(aiMessageId, [citationBlock])
      }
    },
    [getState, callbacks]
  )

  const sendStreamRequest = useCallback(
    async (
      chatMessages: ChatMessage[],
      tools: ToolDefinition[],
      officeTools: FormattingFunction[],
      aiMessageId: string,
      mainTextBlockId: string,
      allowToolCalls: boolean = true,
      userIntent?: 'edit' | 'query' | 'command',
      documentData?: DocumentData,
      agentPromptOptions?: AgentPromptOptions
    ): Promise<{ toolCalls: ToolCall[]; finalContent: string; mcpToolsExecuted: number }> => {
      abortControllerRef.current = new AbortController()

      let finalContent = ''
      let toolCalls: ToolCall[] = []
      const receivedOfficeToolCalls: ToolCall[] = []
      const receivedMcpToolCalls: ToolCall[] = [] // 🆕 收集 MCP 工具调用

      logger.info('Starting stream request', {
        messageCount: chatMessages.length,
        toolCount: tools.length,
        officeToolCount: officeTools.length,
        allowToolCalls,
        userIntent,
        modelId: config.modelId,
        officeApp: agentPromptOptions?.officeApp
      })

      const stateSnapshot = getState()
      if (allowToolCalls && !stateSnapshot.accumulator) {
        const error = new Error('工具调用已启用，但尚未初始化 tool call accumulator')
        logger.error('Tool calls enabled but accumulator is missing', {
          allowToolCalls,
          hasAccumulator: false
        })
        throw error
      }

      // 🚀 智能 tool_choice 策略（参考 OpenAI/Claude 最佳实践）
      // - 'auto': 让模型自己决定是否需要调用工具（适用于普通对话、查询、模糊请求）
      // - 'required': 强制模型必须调用工具（仅适用于明确的文档操作命令）
      // - 'none': 禁止调用工具
      let toolChoice: 'auto' | 'required' | 'none' | undefined = undefined
      if (allowToolCalls && (tools.length > 0 || config.mcpTools.length > 0)) {
        // 🎯 根据用户意图智能选择 tool_choice（像 Cursor/Claude/ChatGPT 一样）
        switch (userIntent) {
          case 'query':
            // 查询意图（问候、闲聊、问答）：让模型自己决定
            // 模型通常会选择直接文本回复，而不是调用工具
            toolChoice = 'auto'
            logger.info('Smart tool_choice: using auto for query intent', {
              userIntent,
              localToolCount: tools.length,
              mcpToolCount: config.mcpTools.length
            })
            break
            
          case 'edit':
            // 编辑意图（模糊请求、修改）：让模型自己决定
            // 模型可能需要先澄清需求，或者直接执行简单的修改
            toolChoice = 'auto'
            logger.info('Smart tool_choice: using auto for edit intent', {
              userIntent,
              localToolCount: tools.length,
              mcpToolCount: config.mcpTools.length
            })
            break
            
          case 'command':
            // 命令意图（明确的操作指令）：强制调用工具
            // 用户明确要求执行某个操作，必须调用工具完成
            toolChoice = 'required'
            logger.info('Smart tool_choice: using required for command intent', {
              userIntent,
              localToolCount: tools.length,
              mcpToolCount: config.mcpTools.length
            })
            break
            
          default:
            // 兜底：使用 auto，让模型自己判断
            toolChoice = 'auto'
            logger.info('Smart tool_choice: using auto as fallback', {
              userIntent,
              localToolCount: tools.length,
              mcpToolCount: config.mcpTools.length
            })
        }
      }

      // 🆕 Agent 模式：使用 Adapter + AgentPromptManager 动态生成系统提示词
      // Adapter 提供应用特定片段，AgentPromptManager 负责编排
      let enhancedMessages = [...chatMessages]
      if (allowToolCalls && (tools.length > 0 || config.mcpTools.length > 0)) {
        const lastUserMessage = chatMessages.filter(m => m.role === 'user').pop()?.content || ''
        const currentAppType = agentPromptOptions?.officeApp || 'word'
        
        // 🆕 获取对应应用的 Adapter
        const adapter = getAdapter(currentAppType)
        
        // 🆕 根据 useAdvancedPrompt 选项选择提示词生成方法
        let agentSystemPrompt: string
        
        if (agentPromptOptions?.useAdvancedPrompt) {
          // 使用高级提示词：融合 availableTools、userIntent 等信息
          agentSystemPrompt = agentPromptManager.generateAdvancedSystemPrompt({
            officeApp: currentAppType,
            hasSelection: agentPromptOptions?.hasSelection,
            selectionType: agentPromptOptions?.selectionType,
            userMessage: lastUserMessage,
            availableTools: officeTools,
            clarificationPolicy: AgentPromptManager.getClarificationPolicy('default')
          })
          logger.info('Agent mode: using ADVANCED system prompt', {
            officeApp: currentAppType,
            promptLength: agentSystemPrompt.length,
            toolCount: officeTools.length,
            adapterUsed: !!adapter
          })
        } else {
          // 使用基础提示词
          agentSystemPrompt = agentPromptManager.generateAgentSystemPrompt({
            officeApp: currentAppType,
            hasSelection: agentPromptOptions?.hasSelection,
            selectionType: agentPromptOptions?.selectionType,
            userMessage: lastUserMessage,
            availableTools: officeTools,
            clarificationPolicy: AgentPromptManager.getClarificationPolicy('default')
          })
          logger.info('Agent mode: using basic system prompt', {
            officeApp: currentAppType,
            promptLength: agentSystemPrompt.length,
            adapterUsed: !!adapter
          })
        }

        // 🆕 如果有 Adapter，追加应用特定的提示词片段和工具提示
        if (adapter) {
          const adapterPromptFragment = adapter.getSystemPromptFragment({
            appType: currentAppType,
            hasSelection: agentPromptOptions?.hasSelection || false,
            selectionType: agentPromptOptions?.selectionType || 'none',
            userMessage: lastUserMessage,
            availableTools: officeTools.map(t => t.name)
          })
          
          // 追加工具使用提示
          const toolHints = adapter.getToolUsageHints(officeTools.map(t => t.name))
          
          if (adapterPromptFragment || toolHints) {
            agentSystemPrompt += '\n\n' + [adapterPromptFragment, toolHints].filter(Boolean).join('\n\n')
            logger.debug('Adapter prompt fragment appended', {
              appType: currentAppType,
              fragmentLength: adapterPromptFragment.length,
              hasToolHints: !!toolHints
            })
          }
        }

        // 🎯 根据用户意图调整工具调用指令
        // query 意图：允许纯文本回复（分析、查看、理解文档等）
        // edit/command 意图：要求调用工具
        if (userIntent === 'query') {
          // 移除"必须调用工具"的强制指令，允许纯文本回复
          agentSystemPrompt = agentSystemPrompt.replace(
            /\n重要：你必须调用工具来完成操作，不能只回复文本。/g,
            ''
          )
          // 添加允许纯文本回复的指令
          agentSystemPrompt += '\n\n【查询模式】用户正在询问或分析文档内容。你可以直接用文本回答问题，无需调用工具。如果用户只是想了解、分析或查看文档信息，请直接提供答案。'
          logger.info('Query intent: allowing text-only response', { userIntent })
        }

        // 在消息开头插入 Agent 模式系统提示
        enhancedMessages = [
          { role: 'system' as const, content: agentSystemPrompt },
          ...chatMessages
        ]
      }

      try {
        let chunkCount = 0

        // 🎯 关键修复：过滤 MCP 工具 ID，防止冲突工具被发送到服务端
        const lastUserMessage = chatMessages.filter(m => m.role === 'user').pop()?.content || ''
        const filteredMcpToolIds = filterMcpToolsForIntent(config.mcpTools, lastUserMessage)
        
        logger.info('[MCP TOOL FILTER] Filtered MCP tools for request', {
          original: config.mcpTools,
          filtered: filteredMcpToolIds,
          userMessage: lastUserMessage.substring(0, 50)
        })

        // 🔧 修复：使用 streamOptions.onChunk 回调接收数据，而不是 for await 循环
        // 因为 createChatCompletionStream 会通过 StreamHandler 处理流，消费掉 response.body
        
        // 🚀 性能优化：使用 requestAnimationFrame 节流 UI 更新
        let pendingUIUpdate = false
        
        const stream = aiService.streamChatCompletion({
          messages: enhancedMessages,
          model: config.modelId,
          tools: allowToolCalls ? tools : undefined,
          tool_choice: toolChoice,
          officeTools: allowToolCalls ? officeTools : undefined,
          knowledgeBaseIds: config.knowledgeBases,
          mcpToolIds: filteredMcpToolIds,
          webSearchEnabled: config.webSearchEnabled,
          officeDocument: documentData,
          signal: abortControllerRef.current.signal,
          streamOptions: {
            onChunk: (chunk: ChatCompletionChunk) => {
              chunkCount++

              if (abortControllerRef.current?.signal.aborted) {
                logger.info('Stream aborted by user', { chunkCount })
                return
              }

              logger.debug('Received chunk from stream', {
                chunkNumber: chunkCount,
                hasChoices: !!chunk.choices?.length,
                hasDelta: !!chunk.choices?.[0]?.delta,
                hasContent: !!chunk.choices?.[0]?.delta?.content,
                hasToolCalls: !!chunk.choices?.[0]?.delta?.tool_calls
              })

              // 处理 chunk（包括 tool_calls 累积）
              processStreamChunk(chunk, aiMessageId, mainTextBlockId)

              // 🔧 修复：正确累积文本内容（从 ChatCompletionChunk 格式）
              const delta = chunk.choices?.[0]?.delta
              if (delta?.content) {
                finalContent += delta.content

                // 🚀 性能优化：使用 requestAnimationFrame 节流 UI 更新
                // 避免每个 chunk 都触发 React 状态更新，提升 UI 帧率
                if (!pendingUIUpdate) {
                  pendingUIUpdate = true
                  requestAnimationFrame(() => {
                    callbacks.updateMessageBlock(aiMessageId, mainTextBlockId, {
                      content: finalContent,
                      status: MessageBlockStatus.SUCCESS
                    })
                    pendingUIUpdate = false
                  })
                }

                logger.debug('Updated content', {
                  contentLength: finalContent.length,
                  deltaLength: delta.content.length
                })
              }
            },
            onOfficeToolCall: (officeToolResponses: StreamOfficeToolResponse[]) => {
              logger.info('[OFFICE_TOOL_FLOW] 📥 onOfficeToolCall 回调被触发', {
                count: officeToolResponses.length,
                toolNames: officeToolResponses.map((r) => r.tool?.name || 'unknown'),
                toolTypes: officeToolResponses.map((r) => r.tool?.type || 'unknown'),
                rawData: JSON.stringify(officeToolResponses).substring(0, 500)
              })

              // ⚠️ 注意：type=office 的工具已经通过 MCP Server → McpCommandPoller 链路执行
              // 但为了兼容性，仍然将其添加到执行队列（McpCommandPoller 会先执行）
              // 这里的执行结果会被忽略或作为备份

              // 将 Office tool responses 转换为 ToolCall 格式
              const convertedToolCalls: ToolCall[] = officeToolResponses.map((resp) => ({
                id: resp.id || resp.toolCallId || `office-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                type: 'function' as const,
                function: {
                  name: resp.tool?.name || 'unknown',
                  arguments: typeof resp.arguments === 'string' ? resp.arguments : JSON.stringify(resp.arguments || {})
                }
              }))

              logger.info('[OFFICE_TOOL_FLOW] 🔄 转换为 ToolCall 格式', {
                convertedCount: convertedToolCalls.length,
                toolCalls: convertedToolCalls.map(tc => ({
                  id: tc.id,
                  name: tc.function.name,
                  argsPreview: tc.function.arguments.substring(0, 100)
                }))
              })

              receivedOfficeToolCalls.push(...convertedToolCalls)
              logger.info('[OFFICE_TOOL_FLOW] 📋 累计 Office 工具调用', {
                totalCount: receivedOfficeToolCalls.length
              })

              // 创建 TOOL 消息块显示工具调用信息
              const toolBlocks: ToolMessageBlock[] = officeToolResponses.map((resp, index) => ({
                id: `${aiMessageId}-office-tool-${resp.id || index}`,
                messageId: aiMessageId,
                type: MessageBlockType.TOOL as MessageBlockType.TOOL,
                createdAt: new Date().toISOString(),
                status: MessageBlockStatus.PROCESSING,
                toolId: resp.id || `office-tool-${index}`,
                toolName: resp.tool?.name || 'unknown',
                arguments: typeof resp.arguments === 'string'
                  ? JSON.parse(resp.arguments || '{}') as Record<string, unknown>
                  : resp.arguments || {},
                content: '正在执行 Office 工具...',
                metadata: {
                  rawOfficeToolResponse: resp
                }
              }))

              toolBlocks.forEach((block) => upsertToolBlock(block))

              logger.info('[OFFICE_TOOL_FLOW] 🎨 创建/更新 UI 消息块', {
                blockCount: toolBlocks.length,
                toolCallCount: convertedToolCalls.length,
                upserted: true
              })
            },
            onMCPTool: (mcpResponses: StreamMcpToolResponse[]) => {
              if (!Array.isArray(mcpResponses) || mcpResponses.length === 0) {
                logger.debug('[OFFICE_TOOL_FLOW] ℹ️ 未收到 MCP 工具响应', {
                  count: mcpResponses?.length || 0
                })
                return
              }

              logger.info('[OFFICE_TOOL_FLOW] 🛰️ 收到 MCP 工具响应', {
                count: mcpResponses.length,
                toolNames: mcpResponses.map((resp) => resp.tool?.name || resp.toolName || 'unknown'),
                statuses: mcpResponses.map((resp) => resp.status || (resp.success === false ? 'error' : 'done'))
              })

              // 🆕 将 MCP 工具转换为 ToolCall 格式并收集（只收集 pending 状态，避免重复）
              const existingIds = new Set(receivedMcpToolCalls.map(tc => tc.id))
              const newMcpToolCalls: ToolCall[] = mcpResponses
                .filter((resp) => {
                  const status = resp.status || 'pending'
                  const id = resp.id || resp.toolCallId
                  // 只收集 pending 状态且未收集过的工具
                  return status === 'pending' && !existingIds.has(id)
                })
                .map((resp) => ({
                  id: resp.id || resp.toolCallId || `mcp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                  type: 'function' as const,
                  function: {
                    name: resp.tool?.name || resp.toolName || 'unknown',
                    arguments: typeof resp.arguments === 'string' ? resp.arguments : JSON.stringify(resp.arguments || {})
                  }
                }))
              
              if (newMcpToolCalls.length > 0) {
                receivedMcpToolCalls.push(...newMcpToolCalls)
                logger.info('[OFFICE_TOOL_FLOW] 📋 累计 MCP 工具调用', {
                  newCount: newMcpToolCalls.length,
                  totalCount: receivedMcpToolCalls.length
                })
              }

              const toolBlocks: ToolMessageBlock[] = mcpResponses.map((resp, index) => {
                const statusRaw = resp.status || (resp.success === false ? 'error' : undefined)
                const blockStatus =
                  statusRaw === 'done' || statusRaw === 'success' || resp.success === true
                    ? MessageBlockStatus.SUCCESS
                    : statusRaw === 'error' || statusRaw === 'failed'
                      ? MessageBlockStatus.ERROR
                      : MessageBlockStatus.PROCESSING

                return {
                  id: `${aiMessageId}-mcp-tool-${resp.id || resp.toolCallId || index}`,
                  messageId: aiMessageId,
                  type: MessageBlockType.TOOL,
                  createdAt: new Date().toISOString(),
                  status: blockStatus,
                  toolId: resp.id || resp.toolCallId || `mcp-tool-${index}`,
                  toolName: resp.tool?.name || resp.toolName || 'unknown',
                  arguments: typeof resp.arguments === 'string'
                    ? JSON.parse(resp.arguments || '{}') as Record<string, unknown>
                    : resp.arguments || {},
                  content: (resp.response ?? resp.result ?? resp.message ?? '') as string | object,
                  metadata: {
                    serverName: resp.serverName || resp.tool?.serverName,
                    rawMcpToolResponse: resp
                  }
                }
              })

              toolBlocks.forEach((block) => upsertToolBlock(block))
            },
            onComplete: (finishReason: string | null) => {
              logger.info('Stream completed via onComplete callback', {
                finishReason,
                chunkCount,
                finalContentLength: finalContent.length
              })
            },
            onDocumentUpdate: async (docUpdate: {
              sessionId: string
              filePath: string
              documentType: 'word' | 'excel' | 'powerpoint'
              description?: string
            }) => {
              logger.info('Document update received', {
                sessionId: docUpdate.sessionId,
                filePath: docUpdate.filePath,
                documentType: docUpdate.documentType,
                description: docUpdate.description
              })

              try {
                // 动态导入 BinaryDocumentAdapter
                const { binaryDocumentAdapter } = await import('../../../../../services/BinaryDocumentAdapter')

                // 检查是否支持当前环境
                if (!binaryDocumentAdapter.isSupported()) {
                  logger.warn('Document update skipped: Office.js not supported in current environment')
                  return
                }

                // 从文件路径写回文档
                await binaryDocumentAdapter.writeDocumentFromPath(docUpdate.filePath)

                logger.info('Document update completed successfully', {
                  sessionId: docUpdate.sessionId,
                  filePath: docUpdate.filePath
                })

                // 可以在这里添加 UI 反馈，比如显示成功消息
                callbacks.updateMessageBlock(aiMessageId, mainTextBlockId, {
                  content: finalContent + '\n\n✅ 文档已更新',
                  status: MessageBlockStatus.SUCCESS
                })
              } catch (error) {
                logger.error('Failed to update document', {
                  sessionId: docUpdate.sessionId,
                  filePath: docUpdate.filePath,
                  error
                })

                // 显示错误消息
                callbacks.updateMessageBlock(aiMessageId, mainTextBlockId, {
                  content: finalContent + '\n\n❌ 文档更新失败: ' + (error as Error).message,
                  status: MessageBlockStatus.ERROR
                })
              }
            },
            onError: (error: Error) => {
              logger.error('Stream error via onError callback', {
                error: error.message,
                chunkCount
              })
            }
          }
        })

        // 等待流处理完成（streamChatCompletion 会等待 StreamHandler 完成）
        // 注意：不要使用 for await 循环，因为 response.body 已被 StreamHandler 消费
        try {
          // 消费生成器（虽然它不会产生任何值，因为 body 已被消费）
          // 但这会等待 createChatCompletionStream 完成
          for await (const _ of stream) {
            // 这个循环不会执行，因为 StreamHandler 已经消费了流
            // 但我们需要这个循环来等待 Promise 完成
          }
        } catch (error) {
          logger.error('Stream iteration error', { error })
          throw error
        }

        logger.info('Stream completed', {
          chunkCount,
          finalContentLength: finalContent.length,
          hasAccumulator: !!stateSnapshot.accumulator
        })

        // 🚀 性能优化：流结束后确保最后一次 UI 更新被执行
        // 因为使用了 requestAnimationFrame 节流，可能有未完成的更新
        callbacks.updateMessageBlock(aiMessageId, mainTextBlockId, {
          content: finalContent,
          status: MessageBlockStatus.SUCCESS
        })

        // 获取完整的工具调用
        if (stateSnapshot.accumulator) {
          // 检查 accumulator 是否有数据，避免对空 accumulator 调用 getCompletedToolCalls
          const accumulationStatus = stateSnapshot.accumulator.getAccumulationStatus()

          if (accumulationStatus.totalCalls > 0) {
            toolCalls = stateSnapshot.accumulator.getCompletedToolCalls()
            logger.info('Retrieved tool calls from accumulator', {
              toolCallCount: toolCalls.length,
              toolNames: toolCalls.map((tc) => tc.function.name)
            })
          } else {
            logger.debug('Accumulator is empty, skipping getCompletedToolCalls', {
              isComplete: accumulationStatus.isComplete
            })
          }

          stateSnapshot.accumulator.reset()
        }

        // 合并从 SSE 流接收到的 Office tool calls
        if (receivedOfficeToolCalls.length > 0) {
          logger.info('Merging Office tool calls from SSE stream', {
            officeToolCallCount: receivedOfficeToolCalls.length,
            accumulatorToolCallCount: toolCalls.length
          })
          toolCalls = [...toolCalls, ...receivedOfficeToolCalls]
        }

        // 🆕 记录 MCP 工具调用（但不添加到 toolCalls，因为它们已通过 McpCommandPoller 执行）
        // 这些信息用于防止重试逻辑误判"没有工具调用"
        if (receivedMcpToolCalls.length > 0) {
          logger.info('MCP tool calls already executed via McpCommandPoller', {
            mcpToolCallCount: receivedMcpToolCalls.length,
            mcpToolNames: receivedMcpToolCalls.map(tc => tc.function.name),
            note: 'Not adding to toolCalls to avoid duplicate execution'
          })
        }
      } catch (error: unknown) {
        const err = error as Error
        logger.error('Stream request failed', { error })

        callbacks.updateMessageBlock(aiMessageId, mainTextBlockId, {
          content: `错误: ${err.message}`,
          status: MessageBlockStatus.ERROR
        })

        throw error
      } finally {
        callbacks.setIsLoading(false)
        abortControllerRef.current = null
      }

      return { 
        toolCalls, 
        finalContent,
        mcpToolsExecuted: receivedMcpToolCalls.length // 🆕 已通过 McpCommandPoller 执行的 MCP 工具数量
      }
    },
    [getState, callbacks, config, processStreamChunk, upsertToolBlock]
  )

  const handleRateLimitError = useCallback(
    async (
      error: unknown,
      retryCount: number,
      chatMessages: ChatMessage[],
      tools: ToolDefinition[],
      aiMessageId: string,
      mainTextBlockId: string,
      allowToolCalls: boolean,
      officeTools: FormattingFunction[],
      userIntent?: 'edit' | 'query' | 'command',
      documentData?: DocumentData,
      agentPromptOptions?: AgentPromptOptions
    ): Promise<{ toolCalls: ToolCall[]; finalContent: string }> => {
      const err = error as Error & { name?: string }
      if (!err.name || !RETRYABLE_ERROR_NAMES.has(err.name) || retryCount >= RATE_LIMIT_MAX_RETRIES) {
        throw error
      }

      const delay = Math.min(RATE_LIMIT_BASE_DELAY_MS * Math.pow(2, retryCount), RATE_LIMIT_MAX_DELAY_MS)

      const reasonLabel = err.name === RATE_LIMIT_ERROR_NAME ? '请求过多，已触发限流' : '模型服务暂时不可用'

      logger.warn(
        `Retryable stream error (${err.name}), retrying in ${delay}ms (attempt ${retryCount + 1}/${RATE_LIMIT_MAX_RETRIES})`
      )

      callbacks.updateMessageBlock(aiMessageId, mainTextBlockId, {
        content: `${reasonLabel}，${delay / 1000} 秒后自动重试（${retryCount + 1}/${RATE_LIMIT_MAX_RETRIES}）...`,
        status: MessageBlockStatus.PENDING
      })

      await new Promise((resolve) => setTimeout(resolve, delay))

      return sendStreamRequest(
        chatMessages,
        tools,
        officeTools,
        aiMessageId,
        mainTextBlockId,
        allowToolCalls,
        userIntent,
        documentData,
        agentPromptOptions
      )
    },
    [sendStreamRequest, callbacks]
  )
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      callbacks.setIsLoading(false)
    }
  }, [callbacks])

  return {
    createAssistantMessage,
    sendStreamRequest,
    handleRateLimitError,
    cancelRequest,
    processStreamChunk
  }
}
