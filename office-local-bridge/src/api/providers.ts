/**
 * AI提供商管理 API
 * 提供AI提供商的CRUD操作和连接测试功能
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import {
  loadProvidersConfig,
  addProvider,
  updateProvider,
  deleteProvider,
  setDefaultProvider,
  getProvider
} from '../config/providers.js'
import type { AIProviderConfig } from '../types/index.js'
import type { AIProvider, ValidateProviderRequest, TestModelRequest } from '../proxy/types.js'
import { createLogger } from '../utils/logger.js'
import { aiProxy } from '../proxy/AIProxy.js'

const logger = createLogger('ProvidersAPI')
const router = Router()
const MASKED_VALUE = '******'

/**
 * GET /api/config/providers
 * 获取所有AI提供商
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const providers = await loadProvidersConfig()

    // 隐藏API密钥
    const safeProviders = providers.map(p => ({
      ...p,
      apiKey: p.apiKey ? '******' : ''
    }))

    res.json({
      success: true,
      data: {
        providers: safeProviders
      }
    })
  } catch (error) {
    logger.error('获取提供商列表失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '获取提供商列表失败'
      }
    })
  }
})

/**
 * POST /api/config/providers
 * 添加AI提供商
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const providerData = req.body as Partial<AIProviderConfig>

    // 验证必填字段
    if (!providerData.type || !providerData.name || !providerData.apiKey) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: '缺少必填字段: type, name, apiKey'
        }
      })
    }
    if (providerData.apiKey === MASKED_VALUE) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'apiKey 不能为占位符，请提供真实的密钥'
        }
      })
    }

    // 生成ID
    const id = `provider_${providerData.type}_${Date.now()}`

    // 创建完整的provider对象
    const provider: AIProviderConfig = {
      id,
      type: providerData.type,
      name: providerData.name,
      enabled: providerData.enabled ?? true,
      isDefault: providerData.isDefault ?? false,
      baseUrl: providerData.baseUrl || getDefaultBaseUrl(providerData.type),
      apiKey: providerData.apiKey,
      connectionStatus: 'unknown',
      lastTestedAt: undefined,
      modelCount: 0
    }

    const added = await addProvider(provider)

    // 隐藏API密钥
    const safeProvider = {
      ...added,
      apiKey: '******'
    }

    res.json({
      success: true,
      data: safeProvider
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('添加提供商失败', { error: errorMessage })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: errorMessage
      }
    })
  }
})

/**
 * PUT /api/config/providers/:id
 * 更新AI提供商
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updates = req.body as Partial<AIProviderConfig>

    // 不允许修改ID
    delete updates.id

    const updated = await updateProvider(id, updates)

    // 隐藏API密钥
    const safeProvider = {
      ...updated,
      apiKey: updated.apiKey ? '******' : ''
    }

    res.json({
      success: true,
      data: safeProvider
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('更新提供商失败', { error: errorMessage })

    if (errorMessage.includes('不存在')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: errorMessage
        }
      })
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'OPERATION_FAILED',
          message: errorMessage
        }
      })
    }
  }
})

/**
 * DELETE /api/config/providers/:id
 * 删除AI提供商
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await deleteProvider(id)

    res.json({
      success: true
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('删除提供商失败', { error: errorMessage })

    if (errorMessage.includes('不存在')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: errorMessage
        }
      })
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'OPERATION_FAILED',
          message: errorMessage
        }
      })
    }
  }
})

/**
 * POST /api/config/providers/:id/set-default
 * 设为默认提供商
 */
router.post('/:id/set-default', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await setDefaultProvider(id)

    res.json({
      success: true
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('设置默认提供商失败', { error: errorMessage })

    if (errorMessage.includes('不存在')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: errorMessage
        }
      })
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'OPERATION_FAILED',
          message: errorMessage
        }
      })
    }
  }
})

/**
 * POST /api/config/providers/:id/test
 * 测试提供商连接
 */
router.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const provider = await getProvider(id)

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Provider不存在: ${id}`
        }
      })
    }

    logger.info('测试提供商连接', { id, type: provider.type })

    const startTime = Date.now()

    try {
      const defaultModel = getDefaultModelForProvider(provider.type)

      // 使用AI代理测试连接
      const testResponse = await aiProxy.chatCompletion(
        {
          provider: provider.type,
          apiKey: provider.apiKey,
          baseUrl: provider.baseUrl,
          model: defaultModel
        },
        {
          model: defaultModel,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        }
      )

      const latency = Date.now() - startTime

      // 获取可用模型列表
      let availableModels: string[] = []
      try {
        const models = await aiProxy.listModels({
          provider: provider.type,
          apiKey: provider.apiKey,
          baseUrl: provider.baseUrl,
          model: defaultModel
        })
        availableModels = models.map(m => m.id)
      } catch (error) {
        logger.warn('获取模型列表失败', { id, error })
        // 不影响连接测试结果
      }

      // 更新连接状态
      await updateProvider(id, {
        connectionStatus: 'connected',
        lastTestedAt: Date.now()
      })

      res.json({
        success: true,
        data: {
          connected: true,
          latency,
          availableModels
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      // 更新连接状态为错误
      await updateProvider(id, {
        connectionStatus: 'error',
        lastTestedAt: Date.now()
      })

      res.json({
        success: false,
        data: {
          connected: false,
          error: errorMessage
        }
      })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('测试连接失败', { error: errorMessage })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: errorMessage
      }
    })
  }
})

/**
 * POST /api/config/providers/validate
 * 验证供应商配置（不保存，仅验证）
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const data = req.body as ValidateProviderRequest

    if (!data.type || !data.apiKey) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: '缺少必填字段: type, apiKey' }
      })
    }
    if (data.apiKey === MASKED_VALUE) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'apiKey 不能为占位符' }
      })
    }

    logger.info('验证供应商配置', { type: data.type })

    const config = {
      provider: data.type,
      apiKey: data.apiKey,
      baseUrl: data.baseUrl || data.azureEndpoint || getDefaultBaseUrl(data.type),
      model: getDefaultModelForProvider(data.type),
      azureDeployment: data.azureDeployment,
      azureApiVersion: data.azureApiVersion
    }

    try {
      const models = await aiProxy.listModels(config)
      res.json({ success: true, data: { valid: true, models } })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      res.json({ success: true, data: { valid: false, error: errorMessage, models: [] } })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('验证供应商配置失败', { error: errorMessage })
    res.status(500).json({
      success: false,
      error: { code: 'OPERATION_FAILED', message: errorMessage }
    })
  }
})

/**
 * POST /api/config/providers/validate/test-model
 * 测试模型（无需保存供应商，直接使用临时配置测试）
 */
router.post('/validate/test-model', async (req: Request, res: Response) => {
  try {
    const { type, apiKey, baseUrl, azureEndpoint, azureDeployment, azureApiVersion, modelId, testMessage } = req.body

    if (!type || !apiKey || !modelId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: '缺少必填字段: type, apiKey, modelId' }
      })
    }
    if (apiKey === MASKED_VALUE) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'apiKey 不能为占位符' }
      })
    }

    logger.info('测试模型（临时配置）', { type, modelId })

    const config = {
      provider: type,
      apiKey,
      baseUrl: baseUrl || azureEndpoint || getDefaultBaseUrl(type),
      model: modelId,
      azureDeployment: azureDeployment || modelId,
      azureApiVersion
    }

    const startTime = Date.now()
    try {
      const response = await aiProxy.chatCompletion(config, {
        model: modelId,
        messages: [{ role: 'user', content: testMessage || 'Hi' }],
        max_tokens: 20
      })

      const latency = Date.now() - startTime
      const content = response.choices[0]?.message?.content || ''

      res.json({
        success: true,
        data: { success: true, response: content, latency }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      res.json({
        success: true,
        data: { success: false, error: errorMessage, latency: Date.now() - startTime }
      })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('测试模型失败', { error: errorMessage })
    res.status(500).json({
      success: false,
      error: { code: 'OPERATION_FAILED', message: errorMessage }
    })
  }
})

/**
 * GET /api/config/providers/:id/models
 * 获取指定供应商的可用模型列表
 */
router.get('/:id/models', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const provider = await getProvider(id)

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Provider不存在: ${id}` }
      })
    }

    logger.info('获取供应商模型列表', { id, type: provider.type })

    const models = await aiProxy.listModels({
      provider: provider.type,
      apiKey: provider.apiKey,
      baseUrl: provider.baseUrl,
      model: getDefaultModelForProvider(provider.type)
    })

    res.json({ success: true, data: { models } })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('获取模型列表失败', { error: errorMessage })
    res.status(500).json({
      success: false,
      error: { code: 'OPERATION_FAILED', message: errorMessage }
    })
  }
})

/**
 * POST /api/config/providers/:id/test-model
 * 测试特定模型是否可用
 */
router.post('/:id/test-model', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { modelId, testMessage } = req.body as TestModelRequest

    if (!modelId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: '缺少必填字段: modelId' }
      })
    }

    const provider = await getProvider(id)
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Provider不存在: ${id}` }
      })
    }

    logger.info('测试模型', { id, modelId })

    const startTime = Date.now()
    try {
      const response = await aiProxy.chatCompletion(
        {
          provider: provider.type,
          apiKey: provider.apiKey,
          baseUrl: provider.baseUrl,
          model: modelId,
          azureDeployment: modelId
        },
        {
          model: modelId,
          messages: [{ role: 'user', content: testMessage || 'Hi' }],
          max_tokens: 20
        }
      )

      const latency = Date.now() - startTime
      const content = response.choices[0]?.message?.content || ''

      res.json({
        success: true,
        data: { success: true, response: content, latency }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      res.json({
        success: true,
        data: { success: false, error: errorMessage, latency: Date.now() - startTime }
      })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('测试模型失败', { error: errorMessage })
    res.status(500).json({
      success: false,
      error: { code: 'OPERATION_FAILED', message: errorMessage }
    })
  }
})

/**
 * 获取提供商的默认Base URL
 */
function getDefaultBaseUrl(type: string): string {
  const defaults: Record<string, string> = {
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com',
    ollama: 'http://localhost:11434',
    azure: '',
    custom: ''
  }
  return defaults[type] || ''
}

/**
 * 获取提供商的默认测试模型
 */
function getDefaultModelForProvider(type: string): string {
  const defaults: Record<string, string> = {
    openai: 'gpt-3.5-turbo',
    anthropic: 'claude-3-haiku-20240307',
    ollama: 'llama3',
    azure: 'gpt-35-turbo',
    custom: ''
  }
  return defaults[type] || 'gpt-3.5-turbo'
}

export default router
