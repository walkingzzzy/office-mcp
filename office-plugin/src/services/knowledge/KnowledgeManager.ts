/**
 * 知识库管理器
 * 统一管理多个知识库连接器
 */

import type {
  AnyKnowledgeBaseConfig,
  HttpKnowledgeBaseConfig,
  KnowledgeBaseConnector,
  KnowledgeBaseManager,
  RetrievalRequest,
  RetrievalResponse,
  RetrievedDocument
} from './types'
import { HttpConnector } from './HttpConnector'
import { secureStorage } from '../storage/SecureStorage'
import Logger from '../../utils/logger'

const logger = new Logger('KnowledgeManager')

const KNOWLEDGE_CONFIG_KEY = 'knowledge_bases'

/**
 * 知识库管理器实现
 */
class KnowledgeManagerImpl implements KnowledgeBaseManager {
  private configs: Map<string, AnyKnowledgeBaseConfig> = new Map()
  private connectors: Map<string, KnowledgeBaseConnector> = new Map()
  private initialized = false

  /**
   * 初始化管理器
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const stored = await secureStorage.getItem(KNOWLEDGE_CONFIG_KEY)
      if (stored) {
        const configs = JSON.parse(stored) as AnyKnowledgeBaseConfig[]
        for (const config of configs) {
          this.configs.set(config.id, config)
          if (config.enabled) {
            await this.createConnector(config)
          }
        }
      }
      this.initialized = true
    } catch (error) {
      logger.error('初始化知识库管理器失败', error instanceof Error ? error : { error })
    }
  }

  /**
   * 保存配置
   */
  private async saveConfigs(): Promise<void> {
    const configs = Array.from(this.configs.values())
    await secureStorage.setItem(KNOWLEDGE_CONFIG_KEY, JSON.stringify(configs))
  }

  /**
   * 创建连接器
   */
  private async createConnector(config: AnyKnowledgeBaseConfig): Promise<KnowledgeBaseConnector | null> {
    try {
      let connector: KnowledgeBaseConnector

      const configType = config.type as string
      switch (configType) {
        case 'http':
          connector = new HttpConnector(config as HttpKnowledgeBaseConfig)
          break
        case 'milvus':
        case 'pinecone':
        case 'chroma':
          // 这些类型通过 HTTP 连接器代理
          connector = new HttpConnector({
            id: config.id,
            name: config.name,
            enabled: config.enabled,
            description: config.description,
            type: 'http',
            baseUrl: this.buildProxyUrl(config),
            searchEndpoint: '/search'
          })
          break
        default:
          logger.warn(`不支持的知识库类型: ${configType}`)
          return null
      }

      await connector.connect()
      this.connectors.set(config.id, connector)
      return connector
    } catch (error) {
      logger.error(`创建知识库连接器失败 [${config.id}]`, error instanceof Error ? error : { error })
      return null
    }
  }

  /**
   * 构建代理 URL（通过 office-local-bridge）
   */
  private buildProxyUrl(config: AnyKnowledgeBaseConfig): string {
    // 通过本地桥接服务代理知识库请求
    const bridgeUrl = 'http://localhost:3001'
    return `${bridgeUrl}/api/knowledge/${config.type}/${config.id}`
  }

  /**
   * 添加知识库
   */
  async addKnowledgeBase(config: AnyKnowledgeBaseConfig): Promise<void> {
    await this.initialize()

    // 生成 ID
    if (!config.id) {
      config.id = `kb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    }

    this.configs.set(config.id, config)

    if (config.enabled) {
      await this.createConnector(config)
    }

    await this.saveConfigs()
  }

  /**
   * 更新知识库配置
   */
  async updateKnowledgeBase(id: string, updates: Partial<AnyKnowledgeBaseConfig>): Promise<void> {
    const config = this.configs.get(id)
    if (!config) return

    const updatedConfig = { ...config, ...updates } as AnyKnowledgeBaseConfig
    this.configs.set(id, updatedConfig)

    // 重新创建连接器
    const existingConnector = this.connectors.get(id)
    if (existingConnector) {
      await existingConnector.disconnect()
      this.connectors.delete(id)
    }

    if (updatedConfig.enabled) {
      await this.createConnector(updatedConfig)
    }

    await this.saveConfigs()
  }

  /**
   * 移除知识库
   */
  async removeKnowledgeBase(id: string): Promise<void> {
    const connector = this.connectors.get(id)
    if (connector) {
      await connector.disconnect()
      this.connectors.delete(id)
    }

    this.configs.delete(id)
    await this.saveConfigs()
  }

  /**
   * 获取所有知识库配置
   */
  getKnowledgeBases(): AnyKnowledgeBaseConfig[] {
    return Array.from(this.configs.values())
  }

  /**
   * 获取已启用的知识库
   */
  getEnabledKnowledgeBases(): AnyKnowledgeBaseConfig[] {
    return Array.from(this.configs.values()).filter(c => c.enabled)
  }

  /**
   * 获取知识库配置
   */
  getKnowledgeBase(id: string): AnyKnowledgeBaseConfig | undefined {
    return this.configs.get(id)
  }

  /**
   * 从所有已启用的知识库检索
   */
  async retrieve(request: RetrievalRequest): Promise<RetrievalResponse> {
    await this.initialize()

    const startTime = Date.now()
    const allDocuments: RetrievedDocument[] = []

    // 并行检索所有已启用的知识库
    const enabledConnectors = Array.from(this.connectors.entries())
      .filter(([id]) => this.configs.get(id)?.enabled)

    const results = await Promise.allSettled(
      enabledConnectors.map(async ([id, connector]) => {
        try {
          const result = await connector.retrieve(request)
          // 添加来源标识
          return result.documents.map(doc => ({
            ...doc,
            source: doc.source || this.configs.get(id)?.name || id
          }))
        } catch (error) {
          logger.error(`知识库检索失败 [${id}]`, error instanceof Error ? error : { error })
          return []
        }
      })
    )

    // 合并结果
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allDocuments.push(...result.value)
      }
    }

    // 按分数排序并限制数量
    const topK = request.topK || 5
    const sortedDocuments = allDocuments
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    // 应用最小分数过滤
    const filteredDocuments = request.minScore
      ? sortedDocuments.filter(d => d.score >= request.minScore!)
      : sortedDocuments

    return {
      documents: filteredDocuments,
      totalCount: allDocuments.length,
      queryTime: Date.now() - startTime
    }
  }

  /**
   * 检查特定知识库的连接状态
   */
  async checkConnection(id: string): Promise<boolean> {
    const connector = this.connectors.get(id)
    if (!connector) return false
    return connector.healthCheck()
  }

  /**
   * 重置所有知识库
   */
  async reset(): Promise<void> {
    for (const connector of this.connectors.values()) {
      await connector.disconnect()
    }
    this.connectors.clear()
    this.configs.clear()
    await secureStorage.removeItem(KNOWLEDGE_CONFIG_KEY)
    this.initialized = false
  }
}

export const knowledgeManager = new KnowledgeManagerImpl()
export default knowledgeManager
