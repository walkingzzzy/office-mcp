/**
 * 消息构建工具
 * 提供构建各种类型消息的辅助函数
 */

import {
  type ErrorMessageBlock,
  type MainTextMessageBlock,
  type Message,
  type MessageBlock,
  MessageBlockStatus,
  MessageBlockType} from '../../../../types/messageBlock'
import type { FileAttachmentData } from '../../../molecules/FileAttachment'

/**
 * 构建用户消息
 * @param content 消息文本内容
 * @param files 附加的文件列表（可选）
 * @returns 用户消息对象
 */
export function buildUserMessage(content: string, files?: FileAttachmentData[]): Message {
  const messageId = Date.now().toString()
  const blockId = `${messageId}-block-0`

  // 创建主文本块
  const textBlock: MainTextMessageBlock = {
    id: blockId,
    messageId,
    type: MessageBlockType.MAIN_TEXT,
    createdAt: new Date().toISOString(),
    status: MessageBlockStatus.SUCCESS,
    content
  }

  const blocks: MessageBlock[] = [textBlock]

  // 如果有文件附件，可以添加 FILE 类型的块
  // 注意：文件附件的处理通常在调用 AI API 时完成，这里仅创建基本消息结构
  const message: Message = {
    id: messageId,
    role: 'user',
    blocks,
    createdAt: new Date().toISOString()
  }

  return message
}

/**
 * 构建 AI 助手消息（初始状态，带一个空的文本块）
 * @param customMessageId 自定义消息 ID（可选，默认使用时间戳）
 * @returns AI 助手消息对象和主文本块 ID
 */
export function buildAssistantMessage(customMessageId?: string): {
  message: Message
  textBlockId: string
} {
  const messageId = customMessageId || (Date.now() + 1).toString()
  const textBlockId = `${messageId}-text`

  const textBlock: MainTextMessageBlock = {
    id: textBlockId,
    messageId,
    type: MessageBlockType.MAIN_TEXT,
    createdAt: new Date().toISOString(),
    status: MessageBlockStatus.STREAMING,
    content: ''
  }

  const message: Message = {
    id: messageId,
    role: 'assistant',
    blocks: [textBlock],
    createdAt: new Date().toISOString()
  }

  return { message, textBlockId }
}

/**
 * 构建错误消息
 * @param error 错误对象或错误消息
 * @param errorCode 错误代码（可选）
 * @param errorType 错误类型（可选）
 * @returns 错误消息对象
 */
export function buildErrorMessage(
  error: Error | string,
  errorCode?: string,
  errorType?: string
): Message {
  const messageId = (Date.now() + 2).toString()
  const blockId = `${messageId}-block-0`

  const errorMessage = error instanceof Error ? error.message : error

  const errorBlock: ErrorMessageBlock = {
    id: blockId,
    messageId,
    type: MessageBlockType.ERROR,
    createdAt: new Date().toISOString(),
    status: MessageBlockStatus.ERROR,
    content: errorMessage || '未知错误',
    errorCode,
    errorType: errorType || 'unknown_error',
    error: {
      message: errorMessage || '未知错误',
      code: errorCode,
      type: errorType || 'unknown_error'
    }
  }

  const message: Message = {
    id: messageId,
    role: 'assistant',
    blocks: [errorBlock],
    createdAt: new Date().toISOString(),
    error: true
  }

  return message
}
