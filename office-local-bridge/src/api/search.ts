/**
 * 联网搜索 API
 * 提供搜索配置管理和搜索功能
 */

import { Router } from 'express'
import { loadSearchConfig, saveSearchConfig } from '../config/search.js'
import type { WebSearchConfig, SearchResult } from '../types/index.js'
import { 
  createTavilyAdapter, 
  createDuckDuckGoAdapter,
  createSearXNGAdapter,
  createSerperAdapter
} from '../adapters/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('SearchAPI')
const router = Router()


/**
 * POST /api/search/test
 * 测试搜索功能
 */
router.post('/test', async (req, res) => {
  try {
    const { query } = req.body

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: '搜索查询不能为空'
        }
      })
    }

    const config = await loadSearchConfig()

    if (!config.enabled) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: '搜索功能未启用'
        }
      })
    }

    // 执行搜索
    const startTime = Date.now()
    const results = await performSearch(query, config)
    const searchTime = Date.now() - startTime

    res.json({
      success: true,
      data: {
        results,
        searchTime
      }
    })
  } catch (error) {
    logger.error('搜索测试失败', { error })
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
 * POST /api/search
 * 执行搜索（供 AI 调用）
 */
router.post('/', async (req, res) => {
  try {
    const { query, maxResults } = req.body

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: '搜索查询不能为空'
        }
      })
    }

    const config = await loadSearchConfig()

    if (!config.enabled) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: '搜索功能未启用'
        }
      })
    }

    // 使用自定义 maxResults 或配置中的值
    const searchConfig = {
      ...config,
      maxResults: maxResults || config.maxResults
    }

    const startTime = Date.now()
    const results = await performSearch(query, searchConfig)
    const searchTime = Date.now() - startTime

    res.json({
      success: true,
      data: {
        results,
        searchTime
      }
    })
  } catch (error) {
    logger.error('搜索失败', { error })
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
 * POST /api/search/test-connection
 * 测试搜索服务连接
 */
router.post('/test-connection', async (req, res) => {
  try {
    const config = await loadSearchConfig()

    if (!config.apiKey) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'API 密钥未配置'
        }
      })
    }

    if (config.provider !== 'tavily') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: '仅支持 Tavily 连接测试'
        }
      })
    }

    const adapter = createTavilyAdapter({ apiKey: config.apiKey })
    const result = await adapter.testConnection()

    res.json({
      success: true,
      data: {
        connected: result.success,
        message: result.message
      }
    })
  } catch (error) {
    logger.error('连接测试失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'CONNECTION_FAILED',
        message: error instanceof Error ? error.message : '连接测试失败'
      }
    })
  }
})

/**
 * 执行搜索
 */
async function performSearch(query: string, config: WebSearchConfig): Promise<SearchResult[]> {
  logger.info('执行搜索', { provider: config.provider, query })
  
  switch (config.provider) {
    case 'tavily':
      return searchWithTavily(query, config)
    case 'duckduckgo':
      return searchWithDuckDuckGo(query, config)
    case 'searxng':
      return searchWithSearXNG(query, config)
    case 'serper':
      return searchWithSerper(query, config)
    default:
      throw new Error(`不支持的搜索引擎: ${config.provider}`)
  }
}

/**
 * 使用 Tavily 搜索
 */
async function searchWithTavily(query: string, config: WebSearchConfig): Promise<SearchResult[]> {
  if (!config.apiKey) {
    throw new Error('Tavily API Key 未配置')
  }

  const adapter = createTavilyAdapter({ apiKey: config.apiKey })

  return adapter.search(query, {
    maxResults: config.maxResults,
    searchDepth: config.searchDepth,
    includeImages: config.includeImages,
    includeDomains: config.includeDomains,
    excludeDomains: config.excludeDomains,
    language: config.language,
    region: config.region
  })
}

/**
 * 使用 DuckDuckGo 搜索（HTML 解析版本）
 */
async function searchWithDuckDuckGo(query: string, config: WebSearchConfig): Promise<SearchResult[]> {
  logger.info('使用 DuckDuckGo HTML 搜索', { query })
  
  const adapter = createDuckDuckGoAdapter()
  return adapter.search(query, {
    maxResults: config.maxResults
  })
}

/**
 * 使用 SearXNG 搜索
 */
async function searchWithSearXNG(query: string, config: WebSearchConfig): Promise<SearchResult[]> {
  logger.info('使用 SearXNG 搜索', { query })
  
  const adapter = createSearXNGAdapter({
    instanceUrl: config.searxngInstanceUrl || 'https://searx.be',
    language: config.language,
    safesearch: 1
  })
  
  return adapter.search(query, {
    maxResults: config.maxResults
  })
}

/**
 * 使用 Serper 搜索
 */
async function searchWithSerper(query: string, config: WebSearchConfig): Promise<SearchResult[]> {
  if (!config.apiKey) {
    throw new Error('Serper API Key 未配置')
  }
  
  logger.info('使用 Serper 搜索', { query })
  
  const adapter = createSerperAdapter({
    apiKey: config.apiKey,
    gl: config.region === 'auto' ? 'cn' : config.region,
    hl: config.language || 'zh-cn'
  })
  
  return adapter.search(query, {
    maxResults: config.maxResults
  })
}

export default router
