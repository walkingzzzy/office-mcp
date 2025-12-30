/**
 * 模型管理 API
 * 提供模型的CRUD操作和预设模型功能
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import {
  loadModelsConfig,
  addModel,
  updateModel,
  deleteModel,
  setDefaultModel,
  getModel,
  getModelsByProvider,
  getModelPresets
} from '../config/models.js'
import type { ModelConfig, AIProviderType } from '../types/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('ModelsAPI')
const router = Router()

/**
 * GET /api/config/models
 * 获取所有模型
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { providerId } = req.query

    let models = loadModelsConfig()

    // 按providerId筛选
    if (providerId && typeof providerId === 'string') {
      models = getModelsByProvider(providerId)
    }

    res.json({
      success: true,
      data: {
        models
      }
    })
  } catch (error) {
    logger.error('获取模型列表失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '获取模型列表失败'
      }
    })
  }
})

/**
 * GET /api/config/models/presets
 * 获取预设模型模板
 */
router.get('/presets', (req: Request, res: Response) => {
  try {
    const { type } = req.query

    if (!type || typeof type !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: '缺少type参数'
        }
      })
    }

    const presets = getModelPresets(type as AIProviderType)

    res.json({
      success: true,
      data: {
        presets
      }
    })
  } catch (error) {
    logger.error('获取预设模型失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '获取预设模型失败'
      }
    })
  }
})

/**
 * POST /api/config/models
 * 添加模型
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const modelData = req.body as Partial<ModelConfig>

    // 验证必填字段
    if (!modelData.providerId || !modelData.name || !modelData.displayName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: '缺少必填字段: providerId, name, displayName'
        }
      })
    }

    // 生成ID
    const id = `model_${modelData.providerId}_${Date.now()}`

    // 创建完整的model对象
    const model: ModelConfig = {
      id,
      providerId: modelData.providerId,
      name: modelData.name,
      displayName: modelData.displayName,
      enabled: modelData.enabled ?? true,
      isDefault: modelData.isDefault ?? false,
      maxTokens: modelData.maxTokens ?? 4096,
      temperature: modelData.temperature ?? 0.7,
      topP: modelData.topP ?? 0.95,
      supportsVision: modelData.supportsVision ?? false,
      supportsTools: modelData.supportsTools ?? false,
      supportsStreaming: modelData.supportsStreaming ?? true,
      contextWindow: modelData.contextWindow ?? 4096
    }

    const added = addModel(model)

    res.json({
      success: true,
      data: added
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('添加模型失败', { error: errorMessage })
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
 * PUT /api/config/models/:id
 * 更新模型配置
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updates = req.body as Partial<ModelConfig>

    // 不允许修改ID和providerId
    delete updates.id
    delete updates.providerId

    const updated = updateModel(id, updates)

    res.json({
      success: true,
      data: updated
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('更新模型失败', { error: errorMessage })

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
 * DELETE /api/config/models/:id
 * 删除模型
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params

    deleteModel(id)

    res.json({
      success: true
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('删除模型失败', { error: errorMessage })

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
 * POST /api/config/models/:id/set-default
 * 设为默认模型
 */
router.post('/:id/set-default', (req: Request, res: Response) => {
  try {
    const { id } = req.params

    setDefaultModel(id)

    res.json({
      success: true
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('设置默认模型失败', { error: errorMessage })

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

export default router
