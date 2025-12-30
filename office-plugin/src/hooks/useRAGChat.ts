/**
 * RAG 增强聊天 Hook
 * 提供带知识库检索的 AI 对话功能
 */

import { useState, useCallback, useRef } from 'react'
import { ragEnhancedAIClient } from '../services/ai/RAGEnhancedAIClient'
import { ragService } from '../services/knowledge/RAGService'
import type { RAGEnhancedContext, RAGConfig } from '../services/knowledge/RAGService'
import type {
  ChatMessage,
  ChatCompletionChunk
} from '../services/ai/LocalAIClient'
import type { AIProviderConfig } from '../services/config/LocalConfigManager'

/**
 * 聊天状态
 */
export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  ragContext: RAGEnhancedContext | null
}

/**
 * RAG 聊天 Hook 返回值
 */
export interface UseRAGChatReturn {
  state: ChatState
  sendMessage: (content: string) => Promise<void>
  sendMessageStream: (content: string) => AsyncGenerator<string, void, unknown>
  clearMessages: () => void
  setRAGConfig: (config: Partial<RAGConfig>) => void
  getRAGConfig: () => RAGConfig
}

/**
 * RAG 聊天 Hook 选项
 */
export interface UseRAGChatOptions {
  provider: AIProviderConfig | null
  model: string
  systemPrompt?: string
  enableRAG?: boolean
  onError?: (error: Error) => void
}

/**
 * RAG 增强聊天 Hook
 */
export function useRAGChat(options: UseRAGChatOptions): UseRAGChatReturn {
  const { provider, model, systemPrompt, enableRAG = true, onError } = options

  const [state, setState] = useState<ChatState>({
    messages: systemPrompt
      ? [{ role: 'system', content: systemPrompt }]
      : [],
    isLoading: false,
    error: null,
    ragContext: null
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * 发送消息（非流式）
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!provider) {
      const error = new Error('未配置 AI 提供商')
      setState(prev => ({ ...prev, error: error.message }))
      onError?.(error)
      return
    }

    const userMessage: ChatMessage = { role: 'user', content }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
      ragContext: null
    }))

    try {
      const response = await ragEnhancedAIClient.chatCompletion(
        provider,
        {
          model,
          messages: [...state.messages, userMessage]
        },
        {
          enableRAG,
          onRAGComplete: (context) => {
            setState(prev => ({ ...prev, ragContext: context }))
          }
        }
      )

      const assistantMessage = response.choices[0]?.message
      if (assistantMessage) {
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isLoading: false
        }))
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }))
      onError?.(error)
    }
  }, [provider, model, state.messages, enableRAG, onError])

  /**
   * 发送消息（流式）
   */
  const sendMessageStream = useCallback(async function* (
    content: string
  ): AsyncGenerator<string, void, unknown> {
    if (!provider) {
      const error = new Error('未配置 AI 提供商')
      setState(prev => ({ ...prev, error: error.message }))
      onError?.(error)
      return
    }

    const userMessage: ChatMessage = { role: 'user', content }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
      ragContext: null
    }))

    abortControllerRef.current = new AbortController()

    try {
      let fullContent = ''

      const stream = ragEnhancedAIClient.chatCompletionStream(
        provider,
        {
          model,
          messages: [...state.messages, userMessage],
          stream: true
        },
        {
          enableRAG,
          onRAGComplete: (context) => {
            setState(prev => ({ ...prev, ragContext: context }))
          }
        }
      )

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content
        if (delta) {
          fullContent += delta
          yield delta
        }
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: fullContent
      }

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false
      }))
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }))
      onError?.(error)
    }
  }, [provider, model, state.messages, enableRAG, onError])

  /**
   * 清空消息
   */
  const clearMessages = useCallback(() => {
    setState({
      messages: systemPrompt
        ? [{ role: 'system', content: systemPrompt }]
        : [],
      isLoading: false,
      error: null,
      ragContext: null
    })
  }, [systemPrompt])

  /**
   * 设置 RAG 配置
   */
  const setRAGConfig = useCallback((config: Partial<RAGConfig>) => {
    ragService.setConfig(config)
  }, [])

  /**
   * 获取 RAG 配置
   */
  const getRAGConfig = useCallback(() => {
    return ragService.getConfig()
  }, [])

  return {
    state,
    sendMessage,
    sendMessageStream,
    clearMessages,
    setRAGConfig,
    getRAGConfig
  }
}

export default useRAGChat
