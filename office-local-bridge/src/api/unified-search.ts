/**
 * 统一搜索 API
 * 提供知识库搜索和网络搜索的统一接口
 */

import { Router } from 'express'
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type {
  ExternalKBConnection,
  KnowledgeSearchResult,
  SearchResult,
  UnifiedSearchResult
} from '../types/index.js'
import { loadSearchConfig } from '../config/search.js'
import {
  createKnowledgeBaseAdapter,
  createTavilyAdapter
} from '../adapters/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('UnifiedSearchAPI')
const router = Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const CONNECTIONS_DATA_PATH = join(__dirname, '../../kb-connections.json')

/**
 * 加载外部知识库连接配置
 */
function loadConnections(): ExternalKBConnection[] {
  if (existsSync(CONNECTIONS_DATA_PATH)) {
    try {
      const content = readFileSync(CONNECTIONS_DATA_PATH, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      logger.error('加载知识库连接配置失败', { error })
    }
  }
  return []
}

/**
 * 统一搜索选项
 */
interface UnifiedSearchOptions {
  query: string
  sources?: {
    knowledgeBase?: boolean
    webSearch?: boolean
  }
  knowledgeBaseOptions?: {
    connectionIds?: string[]
    topK?: number
    scoreThreshold?: number
  }
  webSearchOptions?: {
    maxResults?: number
    searchDepth?: 'basic' | 'advanced'
  }
}

/**
 * 搜索知识库
 */
async function performKnowledgeBaseSearch(options: UnifiedSearchOptions): Promise<UnifiedSearchResult[]> {
  const connections = loadConnections()
  const enabledConnections = connections.filter(c => {
    if (!c.enabled || !c.datasetId) return false
    if (options.knowledgeBaseOptions?.connectionIds?.length) {
      return options.knowledgeBaseOptions.connectionIds.includes(c.id)
    }
    return true
  })

  if (enabledConnections.length === 0) {
    return []
  }

  const results: UnifiedSearchResult[] = []

  await Promise.all(
    enabledConnections.map(async connection => {
      try {
        const adapter = createKnowledgeBaseAdapter(
          connection.provider,
          {
            apiEndpoint: connection.apiEndpoint,
            apiKey: connection.apiKey
          },
          connection.id
        )

        const searchStartTime = Date.now()
        const searchResults = await adapter.search(
          options.query,
          connection.datasetId!,
          {
            topK: options.knowledgeBaseOptions?.topK || 5,
            scoreThreshold: options.knowledgeBaseOptions?.scoreThreshold
          }
        )

        results.push({
          source: 'knowledge_base',
          connectionId: connection.id,
          connectionName: connection.name,
          results: searchResults,
          searchTime: Date.now() - searchStartTime
        })
      } catch (error) {
        logger.error('搜索知识库失败', { connectionId: connection.id, error })
      }
    })
  )

  return results
}

/**
 * 执行网络搜索
 */
async function performWebSearch(options: UnifiedSearchOptions): Promise<UnifiedSearchResult | null> {
  const config = await loadSearchConfig()

  if (!config.enabled || !config.apiKey) {
    return null
  }

  // 目前仅支持 Tavily
  if (config.provider !== 'tavily') {
    return null
  }

  try {
    const adapter = createTavilyAdapter({ apiKey: config.apiKey })
    const searchStartTime = Date.now()

    const searchResults = await adapter.search(options.query, {
      maxResults: options.webSearchOptions?.maxResults || config.maxResults,
      searchDepth: options.webSearchOptions?.searchDepth || config.searchDepth
    })

    return {
      source: 'web_search',
      results: searchResults,
      searchTime: Date.now() - searchStartTime
    }
  } catch (error) {
    logger.error('网络搜索失败', { error })
    return null
  }
}

/**
 * POST /api/unified-search
 * 统一搜索接口 - 同时搜索知识库和网络
 */
router.post('/', async (req, res) => {
  try {
    const options = req.body as UnifiedSearchOptions

    if (!options.query) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: '搜索查询不能为空'
        }
      })
    }

    const startTime = Date.now()
    const results: UnifiedSearchResult[] = []

    // 默认同时搜索知识库和网络
    const shouldSearchKB = options.sources?.knowledgeBase ?? true
    const shouldSearchWeb = options.sources?.webSearch ?? true

    // 并行执行搜索
    const searchPromises: Promise<void>[] = []

    // 知识库搜索
    if (shouldSearchKB) {
      searchPromises.push(
        performKnowledgeBaseSearch(options).then(kbResults => {
          results.push(...kbResults)
        }).catch((error: Error) => {
          logger.error('知识库搜索失败', { error: error.message })
        })
      )
    }

    // 网络搜索
    if (shouldSearchWeb) {
      searchPromises.push(
        performWebSearch(options).then(webResult => {
          if (webResult) {
            results.push(webResult)
          }
        }).catch((error: Error) => {
          logger.error('网络搜索失败', { error: error.message })
        })
      )
    }

    await Promise.all(searchPromises)

    const totalTime = Date.now() - startTime

    res.json({
      success: true,
      data: {
        results,
        totalTime,
        sourcesSearched: {
          knowledgeBase: shouldSearchKB,
          webSearch: shouldSearchWeb
        }
      }
    })
  } catch (error) {
    logger.error('统一搜索失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : '搜索失败'
      }
    })
  }
})

/**
 * GET /api/unified-search/sources
 * 获取可用的搜索源信息
 */
router.get('/sources', async (_req, res) => {
  try {
    const connections = loadConnections()
    const searchConfig = await loadSearchConfig()

    const sources = {
      knowledgeBases: connections
        .filter(c => c.enabled && c.datasetId)
        .map(c => ({
          id: c.id,
          name: c.name,
          provider: c.provider,
          status: c.status
        })),
      webSearch: {
        enabled: searchConfig.enabled,
        provider: searchConfig.provider,
        hasApiKey: !!searchConfig.apiKey
      }
    }

    res.json({
      success: true,
      data: sources
    })
  } catch (error) {
    logger.error('获取搜索源信息失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '获取搜索源信息失败'
      }
    })
  }
})

export default router
