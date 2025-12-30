/**
 * 外部知识库连接管理 API
 * 提供外部知识库连接的 CRUD 操作和搜索功能
 */

import { Router } from 'express'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type {
  ExternalKBConnection,
  KnowledgeSearchResult,
  KnowledgeSearchOptions,
  DifyDataset
} from '../types/index.js'
import {
  createKnowledgeBaseAdapter,
  removeKnowledgeBaseAdapter,
  getCachedKnowledgeBaseAdapter
} from '../adapters/index.js'
import { createLogger } from '../utils/logger.js'
import { encryptValue, decryptValue, isEncrypted } from '../utils/crypto.js'

const logger = createLogger('KnowledgeAPI')
const router = Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 外部知识库连接配置存储路径
const CONNECTIONS_DATA_PATH = join(__dirname, '../../kb-connections.json')

/**
 * 解密连接配置中的敏感信息
 */
function decryptConnectionApiKeys(connections: ExternalKBConnection[]): ExternalKBConnection[] {
  return connections.map(conn => ({
    ...conn,
    apiKey: conn.apiKey && isEncrypted(conn.apiKey)
      ? decryptValue(conn.apiKey)
      : conn.apiKey
  }))
}

/**
 * 加密连接配置中的敏感信息
 */
function encryptConnectionApiKeys(connections: ExternalKBConnection[]): ExternalKBConnection[] {
  return connections.map(conn => ({
    ...conn,
    apiKey: conn.apiKey && !isEncrypted(conn.apiKey)
      ? encryptValue(conn.apiKey)
      : conn.apiKey
  }))
}

/**
 * 加载外部知识库连接配置
 * apiKey 会在加载时自动解密
 */
function loadConnections(): ExternalKBConnection[] {
  if (existsSync(CONNECTIONS_DATA_PATH)) {
    try {
      const content = readFileSync(CONNECTIONS_DATA_PATH, 'utf-8')
      const connections = JSON.parse(content) as ExternalKBConnection[]
      // 解密 apiKey
      return decryptConnectionApiKeys(connections)
    } catch (error) {
      logger.error('加载知识库连接配置失败', { error })
    }
  }
  return []
}

/**
 * 保存外部知识库连接配置
 * apiKey 会在保存时自动加密
 */
function saveConnections(connections: ExternalKBConnection[]): void {
  try {
    // 保存前加密 apiKey
    const encryptedConnections = encryptConnectionApiKeys(connections)
    writeFileSync(CONNECTIONS_DATA_PATH, JSON.stringify(encryptedConnections, null, 2), 'utf-8')
  } catch (error) {
    logger.error('保存知识库连接配置失败', { error })
    throw error
  }
}

/**
 * GET /api/knowledge/connections
 * 获取所有外部知识库连接
 */
router.get('/connections', (_req, res) => {
  try {
    const connections = loadConnections()
    // 返回时隐藏 API 密钥
    const safeConnections = connections.map(conn => ({
      ...conn,
      apiKey: conn.apiKey ? '******' : ''
    }))

    res.json({
      success: true,
      data: { connections: safeConnections }
    })
  } catch (error) {
    logger.error('获取知识库连接列表失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '获取知识库连接列表失败'
      }
    })
  }
})

/**
 * GET /api/knowledge/connections/:id
 * 获取单个连接详情
 */
router.get('/connections/:id', (req, res) => {
  try {
    const connections = loadConnections()
    const connection = connections.find(c => c.id === req.params.id)

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '连接不存在'
        }
      })
    }

    res.json({
      success: true,
      data: {
        ...connection,
        apiKey: connection.apiKey ? '******' : ''
      }
    })
  } catch (error) {
    logger.error('获取知识库连接详情失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '获取知识库连接详情失败'
      }
    })
  }
})

/**
 * POST /api/knowledge/connections
 * 创建新的外部知识库连接
 */
router.post('/connections', (req, res) => {
  try {
    const connections = loadConnections()
    const newConnection: ExternalKBConnection = {
      id: `kb_${Date.now()}`,
      name: req.body.name,
      provider: req.body.provider || 'dify',
      apiEndpoint: req.body.apiEndpoint,
      apiKey: req.body.apiKey,
      datasetId: req.body.datasetId,
      enabled: req.body.enabled ?? true,
      status: 'unknown'
    }

    connections.push(newConnection)
    saveConnections(connections)

    res.json({
      success: true,
      data: {
        ...newConnection,
        apiKey: '******'
      }
    })
  } catch (error) {
    logger.error('创建知识库连接失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '创建知识库连接失败'
      }
    })
  }
})

/**
 * PUT /api/knowledge/connections/:id
 * 更新外部知识库连接配置
 */
router.put('/connections/:id', (req, res) => {
  try {
    const connections = loadConnections()
    const index = connections.findIndex(c => c.id === req.params.id)

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '连接不存在'
        }
      })
    }

    // 更新配置（保留原 API 密钥如果未提供新密钥）
    const updatedConnection: ExternalKBConnection = {
      ...connections[index],
      name: req.body.name ?? connections[index].name,
      provider: req.body.provider ?? connections[index].provider,
      apiEndpoint: req.body.apiEndpoint ?? connections[index].apiEndpoint,
      apiKey: req.body.apiKey || connections[index].apiKey,
      datasetId: req.body.datasetId ?? connections[index].datasetId,
      enabled: req.body.enabled ?? connections[index].enabled,
      status: 'unknown' // 重置状态
    }

    connections[index] = updatedConnection
    saveConnections(connections)

    // 移除适配器缓存以便下次使用新配置
    removeKnowledgeBaseAdapter(req.params.id)

    res.json({
      success: true,
      data: {
        ...updatedConnection,
        apiKey: '******'
      }
    })
  } catch (error) {
    logger.error('更新知识库连接失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '更新知识库连接失败'
      }
    })
  }
})

/**
 * DELETE /api/knowledge/connections/:id
 * 删除外部知识库连接
 */
router.delete('/connections/:id', (req, res) => {
  try {
    const connections = loadConnections()
    const filtered = connections.filter(c => c.id !== req.params.id)

    if (filtered.length === connections.length) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '连接不存在'
        }
      })
    }

    saveConnections(filtered)
    removeKnowledgeBaseAdapter(req.params.id)

    res.json({ success: true })
  } catch (error) {
    logger.error('删除知识库连接失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '删除知识库连接失败'
      }
    })
  }
})

/**
 * POST /api/knowledge/connections/:id/test
 * 测试外部知识库连接
 */
router.post('/connections/:id/test', async (req, res) => {
  try {
    const connections = loadConnections()
    const connection = connections.find(c => c.id === req.params.id)

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '连接不存在'
        }
      })
    }

    const adapter = createKnowledgeBaseAdapter(
      connection.provider,
      {
        apiEndpoint: connection.apiEndpoint,
        apiKey: connection.apiKey
      },
      connection.id
    )

    const result = await adapter.testConnection()

    // 更新连接状态
    connection.status = result.success ? 'connected' : 'error'
    connection.statusMessage = result.message
    connection.lastTested = Date.now()
    saveConnections(connections)

    res.json({
      success: true,
      data: {
        connected: result.success,
        message: result.message
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    logger.error('测试知识库连接失败', { error })

    // 更新连接状态
    const connections = loadConnections()
    const connection = connections.find(c => c.id === req.params.id)
    if (connection) {
      connection.status = 'error'
      connection.statusMessage = message
      connection.lastTested = Date.now()
      saveConnections(connections)
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'CONNECTION_FAILED',
        message: `连接测试失败: ${message}`
      }
    })
  }
})

/**
 * GET /api/knowledge/connections/:id/datasets
 * 获取外部知识库的数据集列表
 */
router.get('/connections/:id/datasets', async (req, res) => {
  try {
    const connections = loadConnections()
    const connection = connections.find(c => c.id === req.params.id)

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '连接不存在'
        }
      })
    }

    const adapter = createKnowledgeBaseAdapter(
      connection.provider,
      {
        apiEndpoint: connection.apiEndpoint,
        apiKey: connection.apiKey
      },
      connection.id
    )

    const datasets: DifyDataset[] = await adapter.getDatasets()

    res.json({
      success: true,
      data: { datasets }
    })
  } catch (error) {
    logger.error('获取数据集列表失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '获取数据集列表失败'
      }
    })
  }
})

/**
 * POST /api/knowledge/search
 * 搜索知识库
 */
router.post('/search', async (req, res) => {
  try {
    const { query, connectionIds, options } = req.body as {
      query: string
      connectionIds?: string[]
      options?: KnowledgeSearchOptions
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: '搜索查询不能为空'
        }
      })
    }

    const connections = loadConnections()
    const enabledConnections = connections.filter(c => {
      if (!c.enabled) return false
      if (connectionIds && connectionIds.length > 0) {
        return connectionIds.includes(c.id)
      }
      return true
    })

    if (enabledConnections.length === 0) {
      return res.json({
        success: true,
        data: {
          results: [],
          searchTime: 0,
          message: '没有可用的知识库连接'
        }
      })
    }

    const startTime = Date.now()
    const allResults: Array<KnowledgeSearchResult & { connectionId: string; connectionName: string }> = []

    // 并行搜索所有启用的连接
    await Promise.all(
      enabledConnections.map(async connection => {
        try {
          if (!connection.datasetId) {
            logger.warn('连接未配置数据集 ID', { connectionId: connection.id })
            return
          }

          const adapter = createKnowledgeBaseAdapter(
            connection.provider,
            {
              apiEndpoint: connection.apiEndpoint,
              apiKey: connection.apiKey
            },
            connection.id
          )

          const results = await adapter.search(query, connection.datasetId, options)

          results.forEach(result => {
            allResults.push({
              ...result,
              connectionId: connection.id,
              connectionName: connection.name
            })
          })
        } catch (error) {
          logger.error('搜索知识库失败', { connectionId: connection.id, error })
        }
      })
    )

    // 按分数排序
    allResults.sort((a, b) => b.score - a.score)

    const searchTime = Date.now() - startTime

    res.json({
      success: true,
      data: {
        results: allResults,
        searchTime,
        connectionsSearched: enabledConnections.length
      }
    })
  } catch (error) {
    logger.error('搜索知识库失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '搜索知识库失败'
      }
    })
  }
})

export default router
