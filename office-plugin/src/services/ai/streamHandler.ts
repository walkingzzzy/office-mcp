/**
 * AI 流式响应处理
 * 负责解析 SSE 流并分发给前端回调
 */

import type { ChatCompletionChunk, KnowledgeReference, MCPToolResponse, OfficeToolCall, StreamOptions, ThinkingInfo } from '../../types/ai'
import Logger from '../../utils/logger'

const logger = new Logger('StreamHandler')

/** MCP 工具响应（流式） */
interface StreamMcpToolResponse {
  id?: string
  tool?: {
    name?: string
    type?: string
  }
  toolName?: string
  status?: string
  success?: boolean
  arguments?: Record<string, unknown>
  response?: unknown
}

// SSE 指标统计
const sseMetrics = {
  totalStreams: 0,
  failedStreams: 0,
  totalChunks: 0,
  parseErrors: 0
}

export class StreamHandler {
  /**
   * 处理 SSE 流
   */
  async processSSEStream(response: Response, options: StreamOptions): Promise<void> {
    const streamStartTime = Date.now()
    sseMetrics.totalStreams++

    const reader = response.body?.getReader()
    if (!reader) {
      sseMetrics.failedStreams++
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let chunkCount = 0
    let pendingEventLines: string[] = []
    let streamTerminated = false

    const collectEventData = (): string | null => {
      if (!pendingEventLines.length) {
        return null
      }
      const eventData = pendingEventLines.join('\n')
      pendingEventLines = []
      return eventData
    }

    const handleEvent = (rawData: string): boolean => {
      const data = rawData.trim()
      if (!data) {
        return false
      }

      chunkCount++
      sseMetrics.totalChunks++

      if (data === '[DONE]') {
        const streamDuration = Date.now() - streamStartTime
        logger.info('Stream completed with [DONE] marker', {
          totalChunks: chunkCount,
          streamDurationMs: streamDuration,
          avgChunkIntervalMs: streamDuration / chunkCount,
          sseFailureRate: (sseMetrics.failedStreams / sseMetrics.totalStreams * 100).toFixed(2) + '%'
        })
        options.onComplete?.(null)
        return true
      }

      try {
        const chunk: ChatCompletionChunk = JSON.parse(data)

        // 🔧 添加详细的调试日志
        logger.debug(`Processing chunk #${chunkCount}`, {
          chunkNumber: chunkCount,
          hasChoices: !!chunk.choices?.length,
          choicesCount: chunk.choices?.length,
          hasDelta: !!chunk.choices?.[0]?.delta,
          deltaKeys: chunk.choices?.[0]?.delta ? Object.keys(chunk.choices[0].delta) : [],
          hasContent: chunk.choices?.[0]?.delta?.content !== undefined,
          contentLength: chunk.choices?.[0]?.delta?.content?.length,
          hasToolCalls: !!chunk.choices?.[0]?.delta?.tool_calls,
          toolCallsCount: chunk.choices?.[0]?.delta?.tool_calls?.length,
          finishReason: chunk.choices?.[0]?.finish_reason
        })

        const delta = chunk.choices?.[0]?.delta
        const deltaContent = delta?.content

        if (deltaContent !== undefined) {
          logger.debug('Processing content delta', {
            chunkNumber: chunkCount,
            contentLength: deltaContent.length,
            contentPreview: deltaContent.substring(0, 50),
            hasSpecialChunks: deltaContent.includes('\x00')
          })

          this.parseSpecialChunks(deltaContent, options)

          const cleanContent = deltaContent.replace(/\x00[A-Z_]+\x00.*?\x00/g, '')

          if (cleanContent) {
            const sanitizedChunk: ChatCompletionChunk = {
              ...chunk,
              choices: chunk.choices?.map(choice => {
                if (!choice?.delta) {
                  return choice
                }
                return {
                  ...choice,
                  delta: {
                    ...choice.delta,
                    content: cleanContent
                  }
                }
              }) ?? []
            }

            logger.debug('Calling onChunk callback', {
              chunkNumber: chunkCount,
              cleanContentLength: cleanContent.length,
              hasCallback: !!options.onChunk
            })

            options.onChunk?.(sanitizedChunk)
          } else {
            logger.debug('Skipping chunk with no clean content', {
              chunkNumber: chunkCount,
              originalContentLength: deltaContent.length
            })
          }
        } else {
          // 🔧 修复：即使没有 content，也要传递 chunk（用于处理 tool_calls 和 finish_reason）
          const hasToolCalls = !!delta?.tool_calls?.length
          const hasFinishReason = !!chunk.choices?.[0]?.finish_reason
          
          if (hasToolCalls || hasFinishReason) {
            logger.debug('Calling onChunk for tool_calls or finish_reason', {
              chunkNumber: chunkCount,
              hasToolCalls,
              hasFinishReason,
              finishReason: chunk.choices?.[0]?.finish_reason
            })
            options.onChunk?.(chunk)
          } else {
            logger.debug('Chunk has no content delta', {
              chunkNumber: chunkCount,
              deltaKeys: delta ? Object.keys(delta) : []
            })
          }
        }

        const toolCallDelta = delta?.tool_calls
        if (toolCallDelta && toolCallDelta.length > 0) {
          logger.debug('Processing tool_calls delta', {
            chunkNumber: chunkCount,
            toolCallsCount: toolCallDelta.length,
            hasCallback: !!options.onToolCallDelta
          })
          // 逐个处理 tool_calls 数组中的每个元素
          toolCallDelta.forEach(tc => {
            options.onToolCallDelta?.(tc)
          })
        }

        const finishReason = chunk.choices?.[0]?.finish_reason
        if (finishReason) {
          logger.info('Stream finished with finish_reason', {
            chunkNumber: chunkCount,
            finishReason
          })
          logger.info('Stream finished', {
            reason: finishReason,
            totalChunks: chunkCount
          })
          options.onComplete?.(finishReason)
          return true
        }
      } catch (parseError) {
        sseMetrics.parseErrors++
        logger.error('Failed to parse SSE data', {
          dataPreview: data.substring(0, 100),
          error: parseError,
          parseErrorRate: (sseMetrics.parseErrors / sseMetrics.totalChunks * 100).toFixed(2) + '%'
        })
      }

      return false
    }

    logger.debug('Starting to read SSE stream')

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          const remaining = collectEventData()
          if (remaining && handleEvent(remaining)) {
            streamTerminated = true
          }
          break
        }

        const decoded = decoder.decode(value, { stream: true })
        buffer += decoded

        logger.debug('Received data chunk', {
          size: decoded.length,
          preview: decoded.substring(0, 50) + (decoded.length > 50 ? '...' : '')
        })

        const lines = buffer.split(/\r?\n/)
        buffer = lines.pop() || ''

        for (const rawLine of lines) {
          const line = rawLine.trimEnd()

          if (line === '') {
            const eventData = collectEventData()
            if (eventData && handleEvent(eventData)) {
              streamTerminated = true
              break
            }
            continue
          }

          if (line.startsWith(':')) {
            continue
          }

          if (line.startsWith('data:')) {
            const valuePart = line.slice(5).replace(/^ /, '')
            pendingEventLines.push(valuePart)
            continue
          }

          // 其它字段（event/id/retry）暂不处理
        }

        if (streamTerminated) {
          break
        }
      }

      if (!streamTerminated) {
        logger.info('Stream ended without explicit completion marker', {
          totalChunks: chunkCount
        })
        options.onComplete?.(null)
      }
    } catch (error) {
      sseMetrics.failedStreams++
      const streamDuration = Date.now() - streamStartTime
      logger.error('Stream processing error', {
        error,
        streamDurationMs: streamDuration,
        chunksProcessed: chunkCount,
        sseFailureRate: (sseMetrics.failedStreams / sseMetrics.totalStreams * 100).toFixed(2) + '%'
      })
      throw error
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * 解析特殊嵌入块
   */
  private parseSpecialChunks(content: string, options: StreamOptions): void {
    const regex = /\x00([A-Z_]+)\x00(.*?)\x00/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(content)) !== null) {
      const type = match[1]
      const jsonData = match[2]

      try {
        switch (type) {
          case 'KNOWLEDGE_REFS': {
            const refs = JSON.parse(jsonData) as KnowledgeReference[]
            logger.info('Knowledge refs received', { count: refs.length })
            options.onKnowledgeRefs?.(refs)
            break
          }

          case 'MCP_TOOL': {
            const responses = JSON.parse(jsonData) as MCPToolResponse[]
            logger.info('MCP tool responses received', { count: responses.length })
            options.onMCPTool?.(responses)
            break
          }

          case 'MCP_TOOL_PENDING': {
            // 🔧 修复：处理主应用发送的 MCP_TOOL_PENDING 特殊块
            // 主应用的 handleToolCallChunk 会将所有工具调用（包括 Office 工具）
            // 都转换为 MCP_TOOL_PENDING chunk，我们需要根据工具类型分发到不同的回调
            const responses = JSON.parse(jsonData) as StreamMcpToolResponse[]
            logger.info('[OFFICE_TOOL_FLOW] 📥 收到 MCP_TOOL_PENDING 特殊块', {
              count: responses.length,
              toolTypes: responses.map((r) => r.tool?.type || 'unknown'),
              toolNames: responses.map((r) => r.tool?.name || 'unknown'),
              rawData: JSON.stringify(responses).substring(0, 500)
            })

            // 区分 Office 工具和 MCP 工具
            const officeTools = responses.filter((r) => r.tool?.type === 'office')
            const mcpTools = responses.filter((r) => r.tool?.type !== 'office')

            logger.info('[OFFICE_TOOL_FLOW] 🔀 工具分类结果', {
              officeToolCount: officeTools.length,
              mcpToolCount: mcpTools.length,
              officeToolNames: officeTools.map((t) => t.tool?.name),
              mcpToolNames: mcpTools.map((t) => t.tool?.name),
              allToolTypes: responses.map((r) => `${r.tool?.name}:${r.tool?.type}`)
            })

            // 调用相应的回调
            if (officeTools.length > 0) {
              if (options.onOfficeToolCall) {
                logger.info('[OFFICE_TOOL_FLOW] ✅ 分发 Office 工具到 onOfficeToolCall', {
                  count: officeTools.length,
                  toolNames: officeTools.map((t) => t.tool?.name),
                  hasCallback: true
                })
                options.onOfficeToolCall(officeTools as unknown as OfficeToolCall[])
              } else {
                logger.error('[OFFICE_TOOL_FLOW] ❌ onOfficeToolCall 回调未定义！Office 工具无法执行', {
                  count: officeTools.length,
                  toolNames: officeTools.map((t) => t.tool?.name)
                })
              }
            } else {
              logger.info('[OFFICE_TOOL_FLOW] ℹ️ 未检测到 type=office 的工具，视为纯 MCP 工具流程', {
                totalResponses: responses.length,
                allTypes: responses.map((r) => r.tool?.type)
              })
            }

            if (mcpTools.length > 0) {
              if (options.onMCPTool) {
                logger.info('Dispatching MCP tools to onMCPTool', {
                  count: mcpTools.length,
                  toolNames: mcpTools.map((t) => t.tool?.name)
                })
                options.onMCPTool(mcpTools as unknown as MCPToolResponse[])
              } else {
                logger.warn('MCP tools received but onMCPTool callback is not defined', {
                  count: mcpTools.length
                })
              }
            }
            break
          }

          case 'OFFICE_TOOL_CALL': {
            const toolCalls = JSON.parse(jsonData) as OfficeToolCall[]
            logger.info('Office tool calls received', {
              count: toolCalls.length,
              toolNames: toolCalls.map((t) => t.name)
            })
            options.onOfficeToolCall?.(toolCalls)
            break
          }

          case 'THINKING': {
            const thinking = JSON.parse(jsonData) as ThinkingInfo
            logger.debug('Thinking received', {
              preview: thinking.text?.substring(0, 50) || '...'
            })
            options.onThinking?.(thinking)
            break
          }

          case 'OFFICE_DOC_UPDATED': {
            const docUpdate = JSON.parse(jsonData)
            logger.info('Office document update received', {
              sessionId: docUpdate.sessionId,
              filePath: docUpdate.filePath,
              documentType: docUpdate.documentType,
              description: docUpdate.description
            })
            options.onDocumentUpdate?.(docUpdate)
            break
          }

          case 'ERROR': {
            const error = JSON.parse(jsonData)
            const fallbackMessage = 'No output generated. 请稍后重试或在设置中切换到可用的模型提供商。'
            const message = error?.message || fallbackMessage
            logger.error('Error chunk received', { message })

            const providerError = new Error(message)
            providerError.name = 'AI_ProviderSpecificError'

            options.onError?.(providerError)
            break
          }

          default:
            logger.warn('Unknown special chunk type', { type })
        }
      } catch (parseError) {
        logger.error(`Failed to parse ${type} chunk`, {
          type,
          dataPreview: jsonData.substring(0, 100),
          error: parseError
        })
      }
    }
  }
}

export const streamHandler = new StreamHandler()
