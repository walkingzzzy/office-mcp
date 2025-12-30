/**
 * useStreamingResponse Hook
 * 处理 AI 流式响应的逻辑，包括消息块创建、更新和错误处理
 * 
 * @updated 2025-12-29 - 统一错误处理 (修复 P2)
 */

import { useCallback,useRef } from 'react'

import { aiService } from '../../../../services/ai'
import type { ChatMessage } from '../../../../types/ai'
import {
  type CitationMessageBlock,
  type MainTextMessageBlock,
  type Message,
  type MessageBlock,
  MessageBlockStatus,
  MessageBlockType,
  type ToolMessageBlock
} from '../../../../types/messageBlock'
import Logger from '../../../../utils/logger'

const logger = new Logger('useStreamingResponse')

export interface StreamingCallbacks {
  /** 更新消息块 */
  updateMessageBlock: (messageId: string, blockId: string, updates: Partial<MessageBlock>) => void
  /** 添加消息块（批量） */
  addMessageBlocks: (messageId: string, blocks: MessageBlock[]) => void
  /** 添加消息 */
  addMessage: (message: Message) => void
  /** 更新消息（用于批量更新块状态） */
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  /** 设置加载状态 */
  setIsLoading: (loading: boolean) => void
  /** 获取消息（用于访问当前消息状态） */
  getMessage: (messageId: string) => Message | undefined
}

export interface StreamingConfig {
  /** 当前模型 ID (格式: "providerId:modelName") */
  modelId: string
  /** 选中的知识库 */
  knowledgeBases: string[]
  /** 选中的 MCP 工具 */
  mcpTools: string[]
  /** 是否启用网页搜索 */
  webSearchEnabled: boolean
}

export interface SendMessageOptions {
  /** 聊天消息历史 */
  chatMessages: ChatMessage[]
  /** 是否为选中模式 */
  isSelectionMode?: boolean
  /** Office 应用类型 */
  currentOfficeApp?: 'word' | 'excel' | 'powerpoint' | 'none'
  /** 是否有文档上下文 */
  hasDocument?: boolean
  /** 用户意图 */
  userIntent?: 'edit' | 'query'
  /** Word 编辑回调 */
  onWordEditRequested?: (messageId: string, isSelection: boolean) => void
}

export interface UseStreamingResponseReturn {
  /** 发送消息并处理流式响应 */
  sendMessage: (options: SendMessageOptions) => Promise<void>
  /** 取消当前请求 */
  cancelRequest: () => void
  /** 是否有正在进行的请求 */
  isStreaming: boolean
}

export function useStreamingResponse(
  callbacks: StreamingCallbacks,
  config: StreamingConfig
): UseStreamingResponseReturn {
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * 取消当前请求
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      callbacks.setIsLoading(false)
    }
  }, [callbacks])

  /**
   * 发送消息并处理流式响应
   */
  const sendMessage = useCallback(async (options: SendMessageOptions) => {
    const {
      chatMessages,
      isSelectionMode = false,
      currentOfficeApp = 'none',
      hasDocument = false,
      userIntent = 'query',
      onWordEditRequested
    } = options

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController()
    callbacks.setIsLoading(true)

    try {
      // 解析 modelId
      const [providerId, modelName] = config.modelId.split(':')

      let fullResponse = ''
      const aiMessageId = (Date.now() + 1).toString()

      // 创建主文本块
      const aiTextBlockId = `${aiMessageId}-text`
      const aiTextBlock: MainTextMessageBlock = {
        id: aiTextBlockId,
        messageId: aiMessageId,
        type: MessageBlockType.MAIN_TEXT,
        createdAt: new Date().toISOString(),
        status: MessageBlockStatus.STREAMING,
        content: ''
      }

      const aiMessage: Message = {
        id: aiMessageId,
        role: 'assistant',
        blocks: [aiTextBlock],
        createdAt: new Date().toISOString()
      }

      callbacks.addMessage(aiMessage)

      // 记录发送到 AI 的完整请求信息
      logger.info('Sending AI request', {
        model: `${providerId}/${modelName}`,
        messageCount: chatMessages.length,
        lastUserMessage: chatMessages[chatMessages.length - 1]?.content?.substring(0, 200),
        knowledgeBaseIds: config.knowledgeBases,
        mcpToolIds: config.mcpTools,
        enableWebSearch: config.webSearchEnabled
      })

      // 流式调用 AI
      await aiService.createChatCompletionStream(
        {
          model: `${providerId}/${modelName}`,
          messages: chatMessages,
          knowledgeBaseIds: config.knowledgeBases.length > 0 ? config.knowledgeBases : undefined,
          mcpToolIds: config.mcpTools.length > 0 ? config.mcpTools : undefined,
          enableWebSearch: config.webSearchEnabled
        },
        {
          signal: abortControllerRef.current.signal,
          onChunk: (chunk) => {
            // 处理 OpenAI 格式的文本 delta
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              fullResponse += content

              // 每20个chunk或前3个chunk记录一次内容
              const chunkNum = fullResponse.split('').length
              if (chunkNum <= 100 || chunkNum % 200 === 0) {
                logger.debug('AI response chunk received', {
                  currentLength: fullResponse.length,
                  contentPreview: fullResponse.substring(0, 100) + (fullResponse.length > 100 ? '...' : '')
                })
              }

              // 更新文本块
              callbacks.updateMessageBlock(aiMessageId, aiTextBlockId, {
                content: fullResponse,
                status: MessageBlockStatus.STREAMING
              })
            }
          },
          onKnowledgeRefs: (refs) => {
            // 处理知识库引用
            logger.debug('Received knowledge refs', { count: refs.length })

            // 创建 CITATION 块
            const citationBlocks: CitationMessageBlock[] = refs.map((ref, index) => {
              // 处理 source 可能是字符串或对象的情况
              const sourceObj = typeof ref.source === 'object' ? ref.source : undefined
              const sourceStr = typeof ref.source === 'string' ? ref.source : undefined
              
              return {
                id: `${aiMessageId}-citation-${ref.id || index}`,
                messageId: aiMessageId,
                type: MessageBlockType.CITATION,
                createdAt: new Date().toISOString(),
                status: MessageBlockStatus.SUCCESS,
                knowledge: [{
                  id: ref.id || `${index}`,
                  title: sourceObj?.fileName || sourceStr || '未命名文档',
                  content: ref.content,
                  score: ref.score || 0,
                  metadata: {
                    knowledgeBaseName: sourceObj?.knowledgeBaseName
                  }
                }]
              }
            })

            // 批量添加（自动去重）
            callbacks.addMessageBlocks(aiMessageId, citationBlocks)
          },
          onMCPTool: (responses) => {
            // 处理 MCP 工具调用
            logger.debug('Received MCP tool responses', { count: responses.length })

            // 创建 TOOL 块
            const toolBlocks: ToolMessageBlock[] = responses.map((resp, index) => ({
              id: `${aiMessageId}-tool-${resp.id || index}`,
              messageId: aiMessageId,
              type: MessageBlockType.TOOL,
              createdAt: new Date().toISOString(),
              status: resp.status === 'done'
                ? MessageBlockStatus.SUCCESS
                : resp.status === 'error'
                  ? MessageBlockStatus.ERROR
                  : MessageBlockStatus.PROCESSING,
              toolId: resp.id || `tool-${index}`,
              toolName: resp.tool?.name || resp.toolName || 'unknown',
              arguments: resp.arguments,
              content: (resp.response || resp.result || '') as string | object,
              metadata: {
                serverName: resp.serverName,
                rawMcpToolResponse: resp
              }
            }))

            // 批量添加（自动去重）
            callbacks.addMessageBlocks(aiMessageId, toolBlocks)
          },
          onThinking: (thinking) => {
            // 处理思考过程
            const thinkingText = thinking.text || thinking.content || ''
            logger.debug('Received thinking', { preview: thinkingText.substring(0, 50) })

            // 创建或更新 THINKING 块
            const thinkingBlockId = `${aiMessageId}-thinking`
            const thinkingBlock: MessageBlock = {
              id: thinkingBlockId,
              messageId: aiMessageId,
              type: MessageBlockType.THINKING,
              createdAt: new Date().toISOString(),
              status: MessageBlockStatus.STREAMING,
              content: thinkingText,
              thinking_millsec: thinking.thinking_millsec || thinking.duration
            }

            // 尝试更新，如果不存在则添加
            callbacks.addMessageBlocks(aiMessageId, [thinkingBlock])
          },
          onComplete: () => {
            // 记录完整的 AI 响应
            logger.info('AI response completed', {
              messageId: aiMessageId,
              fullResponseLength: fullResponse.length,
              fullResponsePreview: fullResponse.substring(0, 300) + (fullResponse.length > 300 ? '...' : '')
            })

            // 更新所有 STREAMING 状态的块为 SUCCESS
            const message = callbacks.getMessage(aiMessageId)
            if (message) {
              const updatedBlocks = message.blocks.map(block =>
                block.status === MessageBlockStatus.STREAMING
                  ? { ...block, status: MessageBlockStatus.SUCCESS }
                  : block
              )
              callbacks.updateMessage(aiMessageId, { blocks: updatedBlocks })
            }

            // 如果是 Word 编辑意图，触发编辑面板
            if (currentOfficeApp === 'word' && hasDocument && userIntent === 'edit' && onWordEditRequested) {
              onWordEditRequested(aiMessageId, isSelectionMode)
              logger.info('Opening Word edit panel for EDIT intent', {
                messageId: aiMessageId,
                intent: userIntent
              })
            }
          }
        }
      )
    } catch (error: unknown) {
      const err = error as Error & { name?: string; code?: string; type?: string }
      if (err.name === 'AbortError') {
        logger.info('请求已取消')
      } else {
        logger.error('AI 调用失败', { error: err.message, code: err.code })

        // 创建错误消息
        const errorMessageId = (Date.now() + 2).toString()
        const errorBlock: MessageBlock = {
          id: `${errorMessageId}-block-0`,
          messageId: errorMessageId,
          type: MessageBlockType.ERROR,
          createdAt: new Date().toISOString(),
          status: MessageBlockStatus.ERROR,
          content: err.message || '未知错误',
          error: {
            message: err.message || '未知错误',
            code: err.code,
            type: err.type || 'unknown_error'
          }
        }

        const errorMessage: Message = {
          id: errorMessageId,
          role: 'assistant',
          blocks: [errorBlock],
          createdAt: new Date().toISOString(),
          error: true
        }

        callbacks.addMessage(errorMessage)
      }
    } finally {
      callbacks.setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [callbacks, config])

  return {
    sendMessage,
    cancelRequest,
    isStreaming: abortControllerRef.current !== null
  }
}
