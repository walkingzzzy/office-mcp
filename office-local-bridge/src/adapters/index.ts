/**
 * 适配器工厂和注册模块
 * 统一管理所有外部服务适配器
 */

import type {
  KnowledgeBaseAdapter,
  WebSearchAdapter,
  DifyAdapterConfig,
  TavilyAdapterConfig
} from './types.js'
import { DifyAdapter, createDifyAdapter } from './dify-adapter.js'
import { TavilyAdapter, createTavilyAdapter } from './tavily-adapter.js'
import { DuckDuckGoAdapter, createDuckDuckGoAdapter } from './duckduckgo-adapter.js'
import { SearXNGAdapter, createSearXNGAdapter, type SearXNGConfig } from './searxng-adapter.js'
import { SerperAdapter, createSerperAdapter, type SerperConfig } from './serper-adapter.js'
import type { ExternalKBProvider, SearchProvider } from '../types/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('AdapterFactory')

// 导出所有类型和类
export * from './types.js'
export { DifyAdapter, createDifyAdapter } from './dify-adapter.js'
export { TavilyAdapter, createTavilyAdapter } from './tavily-adapter.js'
export { DuckDuckGoAdapter, createDuckDuckGoAdapter } from './duckduckgo-adapter.js'
export { SearXNGAdapter, createSearXNGAdapter, type SearXNGConfig } from './searxng-adapter.js'
export { SerperAdapter, createSerperAdapter, type SerperConfig } from './serper-adapter.js'

/**
 * 知识库适配器缓存
 */
const knowledgeBaseAdapters = new Map<string, KnowledgeBaseAdapter>()

/**
 * 网络搜索适配器实例
 */
let webSearchAdapter: WebSearchAdapter | null = null

/**
 * 创建知识库适配器
 * @param provider 提供商类型
 * @param config 适配器配置
 * @param connectionId 连接 ID（用于缓存）
 */
export function createKnowledgeBaseAdapter(
  provider: ExternalKBProvider,
  config: DifyAdapterConfig,
  connectionId?: string
): KnowledgeBaseAdapter {
  // 检查缓存
  if (connectionId && knowledgeBaseAdapters.has(connectionId)) {
    return knowledgeBaseAdapters.get(connectionId)!
  }

  let adapter: KnowledgeBaseAdapter

  switch (provider) {
    case 'dify':
      adapter = createDifyAdapter(config)
      break
    case 'custom':
      // 自定义适配器暂时使用 Dify 适配器作为基础
      logger.warn('自定义适配器暂未实现，使用 Dify 适配器')
      adapter = createDifyAdapter(config)
      break
    default:
      throw new Error(`不支持的知识库提供商: ${provider}`)
  }

  // 缓存适配器
  if (connectionId) {
    knowledgeBaseAdapters.set(connectionId, adapter)
  }

  logger.info('创建知识库适配器', { provider, connectionId })
  return adapter
}

/**
 * 获取或创建网络搜索适配器
 * @param config Tavily 配置
 */
export function getWebSearchAdapter(config?: TavilyAdapterConfig): WebSearchAdapter | null {
  if (!config?.apiKey) {
    return null
  }

  if (!webSearchAdapter) {
    webSearchAdapter = createTavilyAdapter(config)
    logger.info('创建网络搜索适配器')
  }

  return webSearchAdapter
}

/**
 * 更新网络搜索适配器配置
 * @param config 新配置
 */
export function updateWebSearchAdapter(config: TavilyAdapterConfig): void {
  webSearchAdapter = createTavilyAdapter(config)
  logger.info('更新网络搜索适配器配置')
}

/**
 * 移除知识库适配器缓存
 * @param connectionId 连接 ID
 */
export function removeKnowledgeBaseAdapter(connectionId: string): void {
  if (knowledgeBaseAdapters.has(connectionId)) {
    knowledgeBaseAdapters.delete(connectionId)
    logger.info('移除知识库适配器缓存', { connectionId })
  }
}

/**
 * 清除所有适配器缓存
 */
export function clearAllAdapters(): void {
  knowledgeBaseAdapters.clear()
  webSearchAdapter = null
  logger.info('清除所有适配器缓存')
}

/**
 * 获取已缓存的知识库适配器
 * @param connectionId 连接 ID
 */
export function getCachedKnowledgeBaseAdapter(
  connectionId: string
): KnowledgeBaseAdapter | undefined {
  return knowledgeBaseAdapters.get(connectionId)
}
