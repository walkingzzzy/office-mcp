/**
 * useChatMessages - 消息状态管理 Hook
 * 从 ChatInterface 中提取的消息管理逻辑
 *
 * 包含消息的 CRUD 操作、消息块管理和文本提取功能
 */

import { useCallback,useState } from 'react'

import type { Message, MessageBlock } from '../../../../types/messageBlock'

export interface UseChatMessagesReturn {
  // 消息状态
  messages: Message[]
  isLoading: boolean
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>

  // 消息 CRUD 操作
  addMessage: (message: Message) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  deleteMessage: (messageId: string) => void
  clearMessages: () => void

  // 消息块操作
  updateMessageBlock: (messageId: string, blockId: string, updates: Partial<MessageBlock>) => void
  addMessageBlock: (messageId: string, block: MessageBlock) => void
  addMessageBlocks: (messageId: string, blocks: MessageBlock[]) => void

  // 消息查询
  getMessage: (messageId: string) => Message | undefined
  getMessageTextContent: (messageId: string) => string
}

export function useChatMessages(): UseChatMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message])
  }, [])

  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages(prev =>
      prev.map(msg => (msg.id === messageId ? { ...msg, ...updates } : msg))
    )
  }, [])

  const deleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  /**
   * 更新消息中的指定块
   * @param messageId 消息 ID
   * @param blockId 块 ID
   * @param updates 要更新的块字段
   */
  const updateMessageBlock = useCallback((messageId: string, blockId: string, updates: Partial<MessageBlock>) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              blocks: msg.blocks.map(block =>
                block.id === blockId ? { ...block, ...updates } : block
              )
            }
          : msg
      )
    )
  }, [])

  /**
   * 向消息添加单个块
   * @param messageId 消息 ID
   * @param block 要添加的消息块
   */
  const addMessageBlock = useCallback((messageId: string, block: MessageBlock) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              blocks: [...msg.blocks, block]
            }
          : msg
      )
    )
  }, [])

  /**
   * 向消息批量添加多个块（支持去重）
   * @param messageId 消息 ID
   * @param blocks 要添加的消息块数组
   */
  const addMessageBlocks = useCallback((messageId: string, blocks: MessageBlock[]) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id !== messageId) return msg

        // 去重：检查是否已存在相同 ID 的块
        const existingBlockIds = new Set(msg.blocks.map(b => b.id))
        const newBlocks = blocks.filter(b => !existingBlockIds.has(b.id))

        return {
          ...msg,
          blocks: [...msg.blocks, ...newBlocks]
        }
      })
    )
  }, [])

  /**
   * 获取指定消息
   * @param messageId 消息 ID
   * @returns 消息对象或 undefined
   */
  const getMessage = useCallback((messageId: string): Message | undefined => {
    return messages.find(m => m.id === messageId)
  }, [messages])

  /**
   * 获取消息的文本内容（从所有 MAIN_TEXT 块中提取）
   * @param messageId 消息 ID
   * @returns 拼接后的文本内容
   */
  const getMessageTextContent = useCallback((messageId: string): string => {
    const message = getMessage(messageId)
    if (!message) return ''

    return message.blocks
      .filter(block => block.type === 'main_text')
      .map(block => ('content' in block ? block.content : ''))
      .filter(Boolean)
      .join('\n\n')
  }, [getMessage])

  return {
    // 消息状态
    messages,
    isLoading,
    setMessages,
    setIsLoading,

    // 消息 CRUD 操作
    addMessage,
    updateMessage,
    deleteMessage,
    clearMessages,

    // 消息块操作
    updateMessageBlock,
    addMessageBlock,
    addMessageBlocks,

    // 消息查询
    getMessage,
    getMessageTextContent
  }
}
