/**
 * RAG (Retrieval Augmented Generation) 服务
 * 在 AI 对话前检索相关知识并注入上下文
 */

import { knowledgeManager } from './KnowledgeManager'
import type { RetrievalRequest, RetrievedDocument } from './types'

/**
 * RAG 配置
 */
export interface RAGConfig {
  enabled: boolean
  topK: number
  minScore: number
  maxContextLength: number
  includeSource: boolean
}

/**
 * RAG 增强结果
 */
export interface RAGEnhancedContext {
  originalQuery: string
  retrievedDocuments: RetrievedDocument[]
  contextPrompt: string
  queryTime: number
}

/**
 * 默认 RAG 配置
 */
const DEFAULT_RAG_CONFIG: RAGConfig = {
  enabled: true,
  topK: 5,
  minScore: 0.5,
  maxContextLength: 4000,
  includeSource: true
}

/**
 * RAG 服务类
 */
class RAGServiceImpl {
  private config: RAGConfig = DEFAULT_RAG_CONFIG

  /**
   * 更新配置
   */
  setConfig(config: Partial<RAGConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 获取当前配置
   */
  getConfig(): RAGConfig {
    return { ...this.config }
  }

  /**
   * 检索并增强查询
   */
  async enhance(query: string): Promise<RAGEnhancedContext> {
    const startTime = Date.now()

    if (!this.config.enabled) {
      return {
        originalQuery: query,
        retrievedDocuments: [],
        contextPrompt: '',
        queryTime: 0
      }
    }

    const request: RetrievalRequest = {
      query,
      topK: this.config.topK,
      minScore: this.config.minScore
    }

    const response = await knowledgeManager.retrieve(request)
    const contextPrompt = this.buildContextPrompt(response.documents)

    return {
      originalQuery: query,
      retrievedDocuments: response.documents,
      contextPrompt,
      queryTime: Date.now() - startTime
    }
  }

  /**
   * 构建上下文提示
   */
  private buildContextPrompt(documents: RetrievedDocument[]): string {
    if (documents.length === 0) {
      return ''
    }

    let context = '以下是与您问题相关的参考资料：\n\n'
    let totalLength = context.length

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i]
      const docText = this.formatDocument(doc, i + 1)

      if (totalLength + docText.length > this.config.maxContextLength) {
        break
      }

      context += docText
      totalLength += docText.length
    }

    context += '\n请基于以上参考资料回答问题。如果参考资料不足以回答，请说明。\n\n'

    return context
  }

  /**
   * 格式化单个文档
   */
  private formatDocument(doc: RetrievedDocument, index: number): string {
    let text = `【参考 ${index}】`

    if (this.config.includeSource && doc.source) {
      text += `（来源: ${doc.source}）`
    }

    text += `\n${doc.content}\n\n`

    return text
  }

  /**
   * 增强消息列表
   */
  async enhanceMessages(
    messages: Array<{ role: string; content: string }>
  ): Promise<{
    enhancedMessages: Array<{ role: string; content: string }>
    ragContext: RAGEnhancedContext | null
  }> {
    if (!this.config.enabled || messages.length === 0) {
      return { enhancedMessages: messages, ragContext: null }
    }

    // 获取最后一条用户消息
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')

    if (!lastUserMessage) {
      return { enhancedMessages: messages, ragContext: null }
    }

    const ragContext = await this.enhance(lastUserMessage.content)

    if (!ragContext.contextPrompt) {
      return { enhancedMessages: messages, ragContext }
    }

    // 在系统消息后插入 RAG 上下文
    const enhancedMessages = [...messages]
    const systemIndex = enhancedMessages.findIndex(m => m.role === 'system')

    if (systemIndex >= 0) {
      // 将 RAG 上下文追加到系统消息
      enhancedMessages[systemIndex] = {
        ...enhancedMessages[systemIndex],
        content: enhancedMessages[systemIndex].content + '\n\n' + ragContext.contextPrompt
      }
    } else {
      // 插入新的系统消息
      enhancedMessages.unshift({
        role: 'system',
        content: ragContext.contextPrompt
      })
    }

    return { enhancedMessages, ragContext }
  }
}

export const ragService = new RAGServiceImpl()
export default ragService
