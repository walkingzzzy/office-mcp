/**
 * 消息块解析器
 *
 * 解析 SSE chunk 中的消息块信息（CITATION、TOOL、THINKING 等）
 * 用于 Office 插件显示完整的 AI 响应
 * 
 * @updated 2025-12-29 - 添加严格类型定义 (修复 P1)
 */

import {
  CitationMessageBlock,
  MainTextMessageBlock,
  MessageBlock,
  MessageBlockStatus,
  MessageBlockType,
  ThinkingMessageBlock,
  ToolMessageBlock
} from '../types/messageBlock'
import Logger from './logger'

const logger = new Logger('MessageBlockParser')

/**
 * SSE Chunk 中的块数据结构
 */
interface ChunkBlockData {
  id?: string
  type: 'CITATION' | 'TOOL' | 'THINKING' | 'MAIN_TEXT'
  createdAt?: string
  status?: MessageBlockStatus
  content?: string
  // Citation 特有字段
  knowledge?: Array<{ id: string; name: string; content: string }>
  response?: { results?: Array<{ content: string; source: string }> }
  // Tool 特有字段
  toolId?: string
  toolName?: string
  arguments?: Record<string, unknown>
  // Thinking 特有字段
  thinking_millsec?: number
}

/**
 * SSE Chunk 结构
 */
interface SSEChunk {
  blocks?: ChunkBlockData[]
  [key: string]: unknown
}

/**
 * 从 SSE chunk 中解析消息块
 *
 * 注意：当前实现是基础版本，只解析文本内容
 * 完整的消息块解析需要后端支持在 SSE 响应中包含扩展信息
 */
export function parseMessageBlocksFromChunk(chunk: SSEChunk, messageId: string): MessageBlock[] {
  const blocks: MessageBlock[] = []

  // 检查是否有自定义的消息块数据
  // 这需要后端在 SSE 响应中包含额外的块信息
  if (chunk.blocks && Array.isArray(chunk.blocks)) {
    chunk.blocks.forEach((blockData: ChunkBlockData) => {
      const block = parseBlockData(blockData, messageId)
      if (block) blocks.push(block)
    })
  }

  return blocks
}

/**
 * 解析单个块数据
 */
function parseBlockData(data: ChunkBlockData, messageId: string): MessageBlock | null {
  switch (data.type) {
    case 'CITATION':
      return parseCitationBlock(data, messageId)

    case 'TOOL':
      return parseToolBlock(data, messageId)

    case 'THINKING':
      return parseThinkingBlock(data, messageId)

    case 'MAIN_TEXT':
      return parseMainTextBlock(data, messageId)

    default:
      logger.warn('Unknown block type', { type: (data as { type: string }).type })
      return null
  }
}

/**
 * 解析引用块（知识库检索结果）
 */
function parseCitationBlock(data: ChunkBlockData, messageId: string): CitationMessageBlock {
  return {
    id: data.id || `${messageId}-citation-${Date.now()}`,
    messageId,
    type: MessageBlockType.CITATION,
    createdAt: data.createdAt || new Date().toISOString(),
    status: MessageBlockStatus.SUCCESS,
    knowledge: data.knowledge || [],
    response: data.response
  }
}

/**
 * 解析工具块（MCP 工具调用）
 */
function parseToolBlock(data: ChunkBlockData, messageId: string): ToolMessageBlock {
  return {
    id: data.id || `${messageId}-tool-${Date.now()}`,
    messageId,
    type: MessageBlockType.TOOL,
    createdAt: data.createdAt || new Date().toISOString(),
    status: data.status || MessageBlockStatus.SUCCESS,
    toolId: data.toolId,
    toolName: data.toolName,
    arguments: data.arguments,
    content: data.content
  }
}

/**
 * 解析思考块（推理过程）
 */
function parseThinkingBlock(data: ChunkBlockData, messageId: string): ThinkingMessageBlock {
  return {
    id: data.id || `${messageId}-thinking-${Date.now()}`,
    messageId,
    type: MessageBlockType.THINKING,
    createdAt: data.createdAt || new Date().toISOString(),
    status: data.status || MessageBlockStatus.SUCCESS,
    content: data.content,
    thinking_millsec: data.thinking_millsec || 0
  }
}

/**
 * 解析主文本块
 */
function parseMainTextBlock(data: ChunkBlockData, messageId: string): MainTextMessageBlock {
  return {
    id: data.id || `${messageId}-text-${Date.now()}`,
    messageId,
    type: MessageBlockType.MAIN_TEXT,
    createdAt: data.createdAt || new Date().toISOString(),
    status: MessageBlockStatus.SUCCESS,
    content: data.content || ''
  }
}

/**
 * 从文本内容创建主文本块
 * 这是一个辅助函数，用于当前的基础实现
 */
export function createMainTextBlock(messageId: string, content: string): MainTextMessageBlock {
  return {
    id: `${messageId}-text-${Date.now()}`,
    messageId,
    type: MessageBlockType.MAIN_TEXT,
    createdAt: new Date().toISOString(),
    status: MessageBlockStatus.SUCCESS,
    content
  }
}

/**
 * 更新文本块内容（追加文本）
 */
export function appendToTextBlock(block: MainTextMessageBlock, deltaText: string): MainTextMessageBlock {
  return {
    ...block,
    content: block.content + deltaText
  }
}

/**
 * 创建流式状态的文本块
 */
export function createStreamingTextBlock(messageId: string): MainTextMessageBlock {
  return {
    id: `${messageId}-text-${Date.now()}`,
    messageId,
    type: MessageBlockType.MAIN_TEXT,
    createdAt: new Date().toISOString(),
    status: MessageBlockStatus.STREAMING,
    content: ''
  }
}

/**
 * 完成文本块的流式状态
 */
export function completeTextBlock(block: MainTextMessageBlock): MainTextMessageBlock {
  return {
    ...block,
    status: MessageBlockStatus.SUCCESS
  }
}
