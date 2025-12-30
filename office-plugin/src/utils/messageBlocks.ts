/**
 * 消息块解析器
 * 从 AI 响应中提取不同类型的消息块
 *
 * 支持两种格式:
 * 1. SSE 流标记格式: \x00TYPE\x00{json}\x00 (后端使用)
 * 2. XML 标记格式: <type>...</type> (AI 模型原生输出)
 * 
 * @updated 2025-12-29 - 添加严格类型定义 (修复 P1)
 */

import { v4 as uuidv4 } from 'uuid'

import {
  CitationMessageBlock,
  ErrorMessageBlock,
  MainTextMessageBlock,
  MessageBlock,
  MessageBlockStatus,
  MessageBlockType,
  ThinkingMessageBlock,
  ToolMessageBlock
} from '../types/messageBlock'
import Logger from './logger'

const logger = new Logger('MessageBlocks')

/**
 * MCP 工具数据结构
 */
interface McpToolData {
  id?: string
  name?: string
  toolName?: string
  arguments?: Record<string, unknown>
  params?: Record<string, unknown>
  result?: string
  content?: string
}

/**
 * 知识库引用数据结构
 * 与 CitationMessageBlock.knowledge 类型兼容
 */
interface KnowledgeRefData {
  id: string
  name?: string
  title?: string
  content: string
  source?: string
  score?: number
  metadata?: Record<string, unknown>
}

/**
 * 思考数据结构
 */
interface ThinkingData {
  text: string
  thinking_millsec?: number
}

/**
 * 错误数据结构
 */
interface ErrorData {
  message?: string
  code?: string
  type?: string
}

/**
 * 从 SSE chunk 中提取特殊块标记
 * 格式: \x00TYPE\x00{json}\x00
 */
interface ParsedMetadata {
  type: 'KNOWLEDGE_REFS' | 'MCP_TOOL' | 'THINKING' | 'ERROR'
  data: KnowledgeRefData[] | McpToolData[] | ThinkingData | ErrorData
}

function extractMetadataFromChunk(content: string): { metadata: ParsedMetadata[]; cleanContent: string } {
  const metadata: ParsedMetadata[] = []
  let cleanContent = content

  // 匹配 \x00TYPE\x00{json}\x00 格式
  const metadataRegex = /\x00([A-Z_]+)\x00(.*?)\x00/g
  let match

  while ((match = metadataRegex.exec(content)) !== null) {
    const type = match[1] as ParsedMetadata['type']
    const jsonStr = match[2]

    try {
      const data = JSON.parse(jsonStr) as ParsedMetadata['data']
      metadata.push({ type, data })
      // 从内容中移除元数据标记
      cleanContent = cleanContent.replace(match[0], '')
    } catch (e) {
      logger.warn(`Failed to parse metadata for type ${type}`, { error: e })
    }
  }

  return { metadata, cleanContent }
}

/**
 * 从流式响应中解析消息块
 * @param content - AI 响应内容
 * @param messageId - 消息 ID
 * @returns 消息块数组
 */
export function parseMessageBlocks(content: string, messageId: string): MessageBlock[] {
  const blocks: MessageBlock[] = []
  const now = new Date().toISOString()

  // 首先提取 SSE 元数据标记
  const { metadata, cleanContent } = extractMetadataFromChunk(content)

  // 处理元数据块
  metadata.forEach((meta) => {
    switch (meta.type) {
      case 'KNOWLEDGE_REFS':
        // 知识库引用
        if (Array.isArray(meta.data) && meta.data.length > 0) {
          blocks.push({
            id: uuidv4(),
            messageId,
            type: MessageBlockType.CITATION,
            knowledge: meta.data,
            status: MessageBlockStatus.SUCCESS,
            createdAt: now
          } as CitationMessageBlock)
        }
        break

      case 'MCP_TOOL':
        // MCP 工具调用
        if (Array.isArray(meta.data) && meta.data.length > 0) {
          (meta.data as McpToolData[]).forEach((tool: McpToolData) => {
            blocks.push({
              id: uuidv4(),
              messageId,
              type: MessageBlockType.TOOL,
              toolId: tool.id || uuidv4(),
              toolName: tool.name || tool.toolName,
              arguments: tool.arguments || tool.params,
              content: tool.result || tool.content,
              status: MessageBlockStatus.SUCCESS,
              createdAt: now,
              metadata: {
                rawMcpToolResponse: tool
              }
            } as ToolMessageBlock)
          })
        }
        break

      case 'THINKING':
        // 思考过程
        {
          const thinkingData = meta.data as ThinkingData
          if (thinkingData.text) {
            blocks.push({
              id: uuidv4(),
              messageId,
              type: MessageBlockType.THINKING,
              content: thinkingData.text,
              thinking_millsec: thinkingData.thinking_millsec || 0,
              status: MessageBlockStatus.SUCCESS,
              createdAt: now
            } as ThinkingMessageBlock)
          }
        }
        break

      case 'ERROR':
        // 错误信息
        {
          const errorData = meta.data as ErrorData
          blocks.push({
            id: uuidv4(),
            messageId,
            type: MessageBlockType.ERROR,
            content: errorData.message || 'Unknown error',
            errorCode: errorData.code,
            errorType: errorData.type,
            status: MessageBlockStatus.ERROR,
            createdAt: now,
            error: errorData
          } as ErrorMessageBlock)
        }
        break
    }
  })

  // 然后解析 XML 标记格式 (AI 模型原生输出)
  let workingContent = cleanContent

  // 1. 检测思考块 (thinking block)
  // 格式: <thinking>...</thinking> 或 <think>...</think>
  const thinkingRegex = /<think(?:ing)?>([\s\S]*?)<\/think(?:ing)?>/gi
  let thinkingMatch
  while ((thinkingMatch = thinkingRegex.exec(workingContent)) !== null) {
    const thinkingContent = thinkingMatch[1].trim()
    if (thinkingContent) {
      blocks.push({
        id: uuidv4(),
        messageId,
        type: MessageBlockType.THINKING,
        content: thinkingContent,
        thinking_millsec: 0,
        status: MessageBlockStatus.SUCCESS,
        createdAt: now
      } as ThinkingMessageBlock)
    }
  }
  workingContent = workingContent.replace(thinkingRegex, '')

  // 2. 检测工具调用块 (tool block)
  // 格式: <tool_call>...</tool_call>
  const toolCallRegex = /<tool_call>([\s\S]*?)<\/tool_call>/gi
  let toolMatch
  while ((toolMatch = toolCallRegex.exec(workingContent)) !== null) {
    try {
      const toolData = JSON.parse(toolMatch[1])
      blocks.push({
        id: uuidv4(),
        messageId,
        type: MessageBlockType.TOOL,
        toolId: toolData.id || uuidv4(),
        toolName: toolData.name,
        arguments: toolData.arguments || toolData.parameters,
        content: toolData.result,
        status: MessageBlockStatus.SUCCESS,
        createdAt: now
      } as ToolMessageBlock)
    } catch (e) {
      logger.warn('Failed to parse tool call', { error: e })
    }
  }
  workingContent = workingContent.replace(toolCallRegex, '')

  // 3. 检测引用块 (citation block)
  // 格式: <citation>...</citation>
  const citationRegex = /<citation>([\s\S]*?)<\/citation>/gi
  let citationMatch
  while ((citationMatch = citationRegex.exec(workingContent)) !== null) {
    try {
      const citationData = JSON.parse(citationMatch[1])
      blocks.push({
        id: uuidv4(),
        messageId,
        type: MessageBlockType.CITATION,
        response: citationData.response,
        knowledge: citationData.knowledge,
        memories: citationData.memories,
        status: MessageBlockStatus.SUCCESS,
        createdAt: now
      } as CitationMessageBlock)
    } catch (e) {
      logger.warn('Failed to parse citation', { error: e })
    }
  }
  workingContent = workingContent.replace(citationRegex, '')

  // 4. 剩余内容作为主文本块
  const mainContent = workingContent.trim()

  // 如果有主文本内容，创建主文本块
  if (mainContent) {
    blocks.push({
      id: uuidv4(),
      messageId,
      type: MessageBlockType.MAIN_TEXT,
      content: mainContent,
      status: MessageBlockStatus.SUCCESS,
      createdAt: now
    } as MainTextMessageBlock)
  }

  // 如果没有任何块，创建一个空的主文本块
  if (blocks.length === 0) {
    blocks.push({
      id: uuidv4(),
      messageId,
      type: MessageBlockType.MAIN_TEXT,
      content: '',
      status: MessageBlockStatus.PENDING,
      createdAt: now
    } as MainTextMessageBlock)
  }

  return blocks
}

/**
 * 从流式响应块中更新消息块
 * 支持增量解析 SSE 元数据标记和普通文本
 *
 * @param existingBlocks - 现有消息块
 * @param chunk - 新的响应块
 * @param messageId - 消息 ID
 * @returns 更新后的消息块数组
 */
export function updateMessageBlocksFromChunk(
  existingBlocks: MessageBlock[],
  chunk: string,
  messageId: string
): MessageBlock[] {
  const blocks = [...existingBlocks]
  const now = new Date().toISOString()

  // 提取元数据和纯文本
  const { metadata, cleanContent } = extractMetadataFromChunk(chunk)

  // 处理元数据块
  metadata.forEach((meta) => {
    switch (meta.type) {
      case 'KNOWLEDGE_REFS':
        // 添加或更新知识库引用块
        if (Array.isArray(meta.data) && meta.data.length > 0) {
          const knowledgeData = meta.data as KnowledgeRefData[]
          const existingCitation = blocks.find(
            (b) => b.type === MessageBlockType.CITATION
          ) as CitationMessageBlock | undefined

          if (existingCitation) {
            // 合并知识库引用
            existingCitation.knowledge = [
              ...(existingCitation.knowledge || []),
              ...knowledgeData
            ]
            existingCitation.updatedAt = now
          } else {
            // 创建新的引用块
            blocks.push({
              id: uuidv4(),
              messageId,
              type: MessageBlockType.CITATION,
              knowledge: knowledgeData,
              status: MessageBlockStatus.SUCCESS,
              createdAt: now
            } as CitationMessageBlock)
          }
        }
        break

      case 'MCP_TOOL':
        // 添加 MCP 工具调用块
        if (Array.isArray(meta.data) && meta.data.length > 0) {
          (meta.data as McpToolData[]).forEach((tool: McpToolData) => {
            blocks.push({
              id: uuidv4(),
              messageId,
              type: MessageBlockType.TOOL,
              toolId: tool.id || uuidv4(),
              toolName: tool.name || tool.toolName,
              arguments: tool.arguments || tool.params,
              content: tool.result || tool.content,
              status: MessageBlockStatus.SUCCESS,
              createdAt: now,
              metadata: {
                rawMcpToolResponse: tool
              }
            } as ToolMessageBlock)
          })
        }
        break

      case 'THINKING':
        // 添加或更新思考块
        {
          const thinkingData = meta.data as ThinkingData
          if (thinkingData.text) {
            const existingThinking = blocks.find(
              (b) => b.type === MessageBlockType.THINKING
            ) as ThinkingMessageBlock | undefined

            if (existingThinking) {
              // 追加思考内容
              existingThinking.content += thinkingData.text
              existingThinking.thinking_millsec = thinkingData.thinking_millsec || existingThinking.thinking_millsec
              existingThinking.status = MessageBlockStatus.STREAMING
              existingThinking.updatedAt = now
            } else {
              // 创建新的思考块
              blocks.push({
                id: uuidv4(),
                messageId,
                type: MessageBlockType.THINKING,
                content: thinkingData.text,
                thinking_millsec: thinkingData.thinking_millsec || 0,
                status: MessageBlockStatus.STREAMING,
                createdAt: now
              } as ThinkingMessageBlock)
            }
          }
        }
        break

      case 'ERROR':
        // 添加错误块
        {
          const errorData = meta.data as ErrorData
          blocks.push({
            id: uuidv4(),
            messageId,
            type: MessageBlockType.ERROR,
            content: errorData.message || 'Unknown error',
            errorCode: errorData.code,
            errorType: errorData.type,
            status: MessageBlockStatus.ERROR,
            createdAt: now,
            error: errorData
          } as ErrorMessageBlock)
        }
        break
    }
  })

  // 处理纯文本内容
  if (cleanContent) {
    // 查找或创建主文本块
    let mainTextBlock = blocks.find((b) => b.type === MessageBlockType.MAIN_TEXT) as MainTextMessageBlock | undefined

    if (!mainTextBlock) {
      mainTextBlock = {
        id: uuidv4(),
        messageId,
        type: MessageBlockType.MAIN_TEXT,
        content: '',
        status: MessageBlockStatus.STREAMING,
        createdAt: now
      } as MainTextMessageBlock
      blocks.push(mainTextBlock)
    }

    // 追加内容
    mainTextBlock.content += cleanContent
    mainTextBlock.status = MessageBlockStatus.STREAMING
    mainTextBlock.updatedAt = now
  }

  return blocks
}

/**
 * 完成消息块流式输出
 * @param blocks - 消息块数组
 * @returns 更新后的消息块数组
 */
export function finalizeMessageBlocks(blocks: MessageBlock[]): MessageBlock[] {
  return blocks.map((block) => ({
    ...block,
    status: block.status === 'streaming' ? ('success' as MessageBlockStatus) : block.status,
    updatedAt: new Date().toISOString()
  }))
}

/**
 * 带有错误码的错误接口
 */
interface ErrorWithCode extends Error {
  code?: string
}

/**
 * 创建错误消息块
 * @param error - 错误对象
 * @param messageId - 消息 ID
 * @returns 错误消息块
 */
export function createErrorBlock(error: Error, messageId: string): ErrorMessageBlock {
  const errorWithCode = error as ErrorWithCode
  return {
    id: uuidv4(),
    messageId,
    type: MessageBlockType.ERROR,
    content: error.message,
    errorCode: errorWithCode.code,
    errorType: error.name,
    status: MessageBlockStatus.ERROR,
    createdAt: new Date().toISOString(),
    error: {
      message: error.message,
      code: errorWithCode.code,
      type: error.name
    }
  }
}

/**
 * 获取主文本内容
 * @param blocks - 消息块数组
 * @returns 主文本内容
 */
export function getMainTextContent(blocks: MessageBlock[]): string {
  const mainTextBlocks = blocks.filter((b) => b.type === 'main_text') as MainTextMessageBlock[]
  return mainTextBlocks.map((b) => b.content).join('\n\n')
}

/**
 * 获取思考内容
 * @param blocks - 消息块数组
 * @returns 思考内容
 */
export function getThinkingContent(blocks: MessageBlock[]): string {
  const thinkingBlocks = blocks.filter((b) => b.type === 'thinking') as ThinkingMessageBlock[]
  return thinkingBlocks.map((b) => b.content).join('\n\n')
}

/**
 * 检查是否有特定类型的块
 * @param blocks - 消息块数组
 * @param type - 块类型
 * @returns 是否存在该类型的块
 */
export function hasBlockType(blocks: MessageBlock[], type: MessageBlockType): boolean {
  return blocks.some((b) => b.type === type)
}
