/**
 * Chat API - 聊天相关接口
 */

import type { ChatCompletionRequest } from '../../../types/ai'
import Logger from '../../../utils/logger'
import type { DocumentData } from '../../BinaryDocumentAdapter'

const logger = new Logger('ChatAPI')

export const chatApi = {
  /**
   * 流式聊天完成
   * 返回 ReadableStream 用于处理流式响应
   *
   * 使用标准 chat completions 端点，需要 API Key 认证
   */
  async streamChatCompletion(
    request: ChatCompletionRequest,
    documentData?: DocumentData,
    signal?: AbortSignal,
    apiKey?: string
  ): Promise<ReadableStream> {
    // 如果有文档数据，添加到请求中
    const requestWithDocument = documentData ? {
      ...request,
      officeDocument: {
        base64: documentData.base64,
        type: documentData.type,
        filename: documentData.filename
      }
    } : request

    logger.info('Sending chat request', {
      hasDocument: !!documentData,
      documentType: documentData?.type,
      documentSize: documentData?.size,
      messagesCount: request.messages.length
    })

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const response = await fetch('http://localhost:3001/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestWithDocument),
      signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    if (!response.body) {
      throw new Error('Response body is null')
    }

    return response.body
  },
}
