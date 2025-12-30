/**
 * 配置管理 API
 * 提供配置的 CRUD 操作、导入导出和重置功能
 */

import { Router } from 'express'
import { loadConfig, saveConfig } from '../config/index.js'
import { loadSearchConfig, saveSearchConfig } from '../config/search.js'
import type { BridgeConfig, WebSearchConfig, McpServerConfig } from '../types/index.js'
import { createTavilyAdapter, updateWebSearchAdapter } from '../adapters/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('ConfigAPI')
const router = Router()

/**
 * 验证 MCP 服务器配置项
 */
function validateMcpServerConfig(server: unknown): server is McpServerConfig {
  if (!server || typeof server !== 'object') return false
  const s = server as Record<string, unknown>
  return (
    typeof s.id === 'string' && s.id.length > 0 &&
    typeof s.name === 'string' && s.name.length > 0 &&
    typeof s.command === 'string' && s.command.length > 0 &&
    (s.args === undefined || Array.isArray(s.args)) &&
    typeof s.enabled === 'boolean'
  )
}

/**
 * 验证导入的配置是否有效
 */
function validateImportedConfig(config: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!config || typeof config !== 'object') {
    errors.push('配置必须是一个对象')
    return { valid: false, errors }
  }
  
  const c = config as Record<string, unknown>
  
  // 验证必需字段
  if (typeof c.port !== 'number' || c.port < 1 || c.port > 65535) {
    errors.push('port 必须是 1-65535 之间的数字')
  }
  
  if (typeof c.host !== 'string' || c.host.length === 0) {
    errors.push('host 必须是非空字符串')
  }
  
  // 验证 mcpServers 数组
  if (c.mcpServers !== undefined) {
    if (!Array.isArray(c.mcpServers)) {
      errors.push('mcpServers 必须是数组')
    } else {
      c.mcpServers.forEach((server, index) => {
        if (!validateMcpServerConfig(server)) {
          errors.push(`mcpServers[${index}] 配置无效，需要 id、name、command（字符串）和 enabled（布尔值）`)
        }
      })
    }
  }
  
  // 验证 logLevel
  if (c.logLevel !== undefined) {
    const validLevels = ['debug', 'info', 'warn', 'error']
    if (!validLevels.includes(c.logLevel as string)) {
      errors.push(`logLevel 必须是 ${validLevels.join(', ')} 之一`)
    }
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * GET /api/config
 * 获取完整配置
 */
router.get('/', (_req, res) => {
  try {
    const config = loadConfig()
    res.json({
      success: true,
      data: config
    })
  } catch (error) {
    logger.error('获取配置失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '获取配置失败'
      }
    })
  }
})

/**
 * POST /api/config
 * 保存配置（部分更新）
 */
router.post('/', (req, res) => {
  try {
    const currentConfig = loadConfig()
    const updates = req.body as Partial<BridgeConfig>

    // 合并配置
    const newConfig: BridgeConfig = {
      ...currentConfig,
      ...updates
    }

    saveConfig(newConfig)

    res.json({
      success: true,
      data: newConfig
    })
  } catch (error) {
    logger.error('保存配置失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '保存配置失败'
      }
    })
  }
})

/**
 * POST /api/config/reset
 * 重置为默认配置
 */
router.post('/reset', (_req, res) => {
  try {
    const defaultConfig: BridgeConfig = {
      port: 3001,
      host: 'localhost',
      mcpServers: [],
      logLevel: 'info'
    }

    saveConfig(defaultConfig)

    res.json({
      success: true,
      data: defaultConfig
    })
  } catch (error) {
    logger.error('重置配置失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '重置配置失败'
      }
    })
  }
})

/**
 * POST /api/config/export
 * 导出配置文件
 */
router.post('/export', (_req, res) => {
  try {
    const config = loadConfig()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `config-export-${timestamp}.json`

    res.json({
      success: true,
      data: {
        content: JSON.stringify(config, null, 2),
        filename
      }
    })
  } catch (error) {
    logger.error('导出配置失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '导出配置失败'
      }
    })
  }
})

/**
 * POST /api/config/import
 * 导入配置文件
 */
router.post('/import', (req, res) => {
  try {
    const { content } = req.body

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: '配置内容无效'
        }
      })
    }

    // 解析配置
    let importedConfig: unknown
    try {
      importedConfig = JSON.parse(content)
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: '配置内容不是有效的 JSON 格式'
        }
      })
    }

    // 严格验证配置
    const validation = validateImportedConfig(importedConfig)
    if (!validation.valid) {
      logger.warn('配置验证失败', { errors: validation.errors })
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONFIG',
          message: '配置验证失败',
          details: validation.errors
        }
      })
    }

    saveConfig(importedConfig as BridgeConfig)

    res.json({
      success: true,
      data: importedConfig
    })
  } catch (error) {
    logger.error('导入配置失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '导入配置失败'
      }
    })
  }
})

/**
 * POST /api/config/defaults
 * 设置默认提供商和模型
 */
router.post('/defaults', (req, res) => {
  try {
    const { defaultProviderId, defaultChatModelId } = req.body
    const currentConfig = loadConfig()

    const newConfig: BridgeConfig = {
      ...currentConfig,
      defaultProviderId,
      defaultChatModelId
    }

    saveConfig(newConfig)

    res.json({
      success: true,
      data: {
        defaultProviderId: newConfig.defaultProviderId,
        defaultChatModelId: newConfig.defaultChatModelId
      }
    })
  } catch (error) {
    logger.error('设置默认配置失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '设置默认配置失败'
      }
    })
  }
})

/**
 * GET /api/config/websearch
 * 获取联网搜索配置
 */
router.get('/websearch', async (_req, res) => {
  try {
    const config = await loadSearchConfig()
    // 隐藏 API 密钥
    res.json({
      success: true,
      data: {
        ...config,
        apiKey: config.apiKey ? '******' : ''
      }
    })
  } catch (error) {
    logger.error('获取搜索配置失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '获取搜索配置失败'
      }
    })
  }
})

/**
 * POST /api/config/websearch
 * 保存联网搜索配置
 */
router.post('/websearch', async (req, res) => {
  try {
    const newConfig = req.body as Partial<WebSearchConfig>
    const currentConfig = await loadSearchConfig()

    // 合并配置（保留原 API 密钥如果未提供新密钥）
    const config: WebSearchConfig = {
      ...currentConfig,
      ...newConfig,
      apiKey: newConfig.apiKey || currentConfig.apiKey
    }

    // 基本验证
    if (!config.provider) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: '搜索引擎提供商不能为空'
        }
      })
    }

    await saveSearchConfig(config)

    // 更新适配器缓存
    if (config.provider === 'tavily' && config.apiKey) {
      updateWebSearchAdapter({ apiKey: config.apiKey })
    }

    res.json({
      success: true,
      data: {
        ...config,
        apiKey: config.apiKey ? '******' : ''
      }
    })
  } catch (error) {
    logger.error('保存搜索配置失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '保存搜索配置失败'
      }
    })
  }
})

export default router
