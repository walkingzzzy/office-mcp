/**
 * AI API 代理主逻辑
 */

import type {
  AIRequestConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  ModelInfo
} from './types.js'
import { getAdapter } from './providers/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('AIProxy')

/**
 * AI 代理类
 */
export class AIProxy {
  /**
   * 发送聊天完成请求
   */
  async chatCompletion(
    config: AIRequestConfig,
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    logger.info('处理聊天完成请求', {
      provider: config.provider,
      model: request.model,
      messageCount: request.messages.length
    })

    const adapter = getAdapter(config.provider)
    return adapter.chatCompletion(config, request)
  }

  /**
   * 发送流式聊天完成请求
   */
  async *chatCompletionStream(
    config: AIRequestConfig,
    request: ChatCompletionRequest
  ): AsyncGenerator<ChatCompletionChunk, void, unknown> {
    logger.info('处理流式聊天完成请求', {
      provider: config.provider,
      model: request.model,
      messageCount: request.messages.length
    })

    const adapter = getAdapter(config.provider)
    yield* adapter.chatCompletionStream(config, request)
  }

  /**
   * 获取可用模型列表
   */
  async listModels(config: AIRequestConfig): Promise<ModelInfo[]> {
    logger.info('获取模型列表', { provider: config.provider })

    const adapter = getAdapter(config.provider)

    if (!adapter.listModels) {
      logger.warn('提供商不支持模型列表获取', { provider: config.provider })
      return []
    }

    return adapter.listModels(config)
  }
}

export const aiProxy = new AIProxy()
