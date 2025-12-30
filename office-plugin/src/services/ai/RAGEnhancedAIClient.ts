/**
 * RAG 增强 AI 客户端
 * 在发送 AI 请求前自动检索相关知识
 */

import { localAIClient, LocalAIClient } from './LocalAIClient'
import type {
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk
} from './LocalAIClient'
import { ragService } from '../knowledge/RAGService'
import type { RAGEnhancedContext } from '../knowledge/RAGService'
import type { AIProviderConfig } from '../config/LocalConfigManager'

/**
 * RAG 增强请求选项
 */
export interface RAGEnhancedRequestOptions {
  enableRAG?: boolean
  onRAGComplete?: (context: RAGEnhancedContext) => void
}

/**
 * RAG 增强 AI 客户端类
 */
export class RAGEnhancedAIClient {
  private client: LocalAIClient

  constructor(client: LocalAIClient = localAIClient) {
    this.client = client
  }

  /**
   * 发送 RAG 增强的聊天完成请求（非流式）
   */
  async chatCompletion(
    provider: AIProviderConfig,
    request: ChatCompletionRequest,
    options: RAGEnhancedRequestOptions = {}
  ): Promise<ChatCompletionResponse> {
    const { enableRAG = true, onRAGComplete } = options

    let messages = request.messages

    if (enableRAG) {
      const { enhancedMessages, ragContext } = await ragService.enhanceMessages(
        messages as Array<{ role: string; content: string }>
      )
      messages = enhancedMessages as ChatMessage[]

      if (ragContext && onRAGComplete) {
        onRAGComplete(ragContext)
      }
    }

    return this.client.chatCompletion(provider, {
      ...request,
      messages
    })
  }

  /**
   * 发送 RAG 增强的流式聊天完成请求
   */
  async *chatCompletionStream(
    provider: AIProviderConfig,
    request: ChatCompletionRequest,
    options: RAGEnhancedRequestOptions = {}
  ): AsyncGenerator<ChatCompletionChunk, void, unknown> {
    const { enableRAG = true, onRAGComplete } = options

    let messages = request.messages

    if (enableRAG) {
      const { enhancedMessages, ragContext } = await ragService.enhanceMessages(
        messages as Array<{ role: string; content: string }>
      )
      messages = enhancedMessages as ChatMessage[]

      if (ragContext && onRAGComplete) {
        onRAGComplete(ragContext)
      }
    }

    yield* this.client.chatCompletionStream(provider, {
      ...request,
      messages
    })
  }

  /**
   * 仅执行 RAG 检索（不发送 AI 请求）
   */
  async retrieveContext(query: string): Promise<RAGEnhancedContext> {
    return ragService.enhance(query)
  }
}

export const ragEnhancedAIClient = new RAGEnhancedAIClient()
export default ragEnhancedAIClient
