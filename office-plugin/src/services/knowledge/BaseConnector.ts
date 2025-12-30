/**
 * 知识库连接器基类
 */

import type {
  KnowledgeBaseConnector,
  KnowledgeBaseType,
  RetrievalRequest,
  RetrievalResponse
} from './types'
import Logger from '../../utils/logger'

const logger = new Logger('BaseConnector')

/**
 * 抽象基类，提供通用功能
 */
export abstract class BaseConnector implements KnowledgeBaseConnector {
  abstract type: KnowledgeBaseType

  protected connected = false
  protected lastError: string | null = null

  /**
   * 连接到知识库
   */
  abstract connect(): Promise<void>

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    this.connected = false
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.connected
  }

  /**
   * 检索文档
   */
  abstract retrieve(request: RetrievalRequest): Promise<RetrievalResponse>

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.connected) {
        await this.connect()
      }
      return this.connected
    } catch {
      return false
    }
  }

  /**
   * 获取最后的错误信息
   */
  getLastError(): string | null {
    return this.lastError
  }

  /**
   * 设置错误信息
   */
  protected setError(error: string): void {
    this.lastError = error
    logger.error(`[${this.type}] ${error}`)
  }

  /**
   * 清除错误信息
   */
  protected clearError(): void {
    this.lastError = null
  }
}

export default BaseConnector
