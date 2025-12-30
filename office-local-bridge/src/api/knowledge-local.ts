/**
 * 本地知识库 API
 */

import { Router, type Request, type Response } from 'express'
import { createLogger } from '../utils/logger.js'
import { localKnowledgeBase } from '../knowledge/LocalKnowledgeBase.js'
import type { AddDocumentRequest, SearchOptions } from '../knowledge/types.js'

const logger = createLogger('KnowledgeLocalAPI')
const router = Router()

/**
 * POST /api/knowledge/local/add
 * 添加文档到本地知识库
 */
router.post('/add', async (req: Request, res: Response) => {
  try {
    const request = req.body as AddDocumentRequest

    // 验证输入
    if (!request.title || !request.content) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: '标题和内容不能为空'
        }
      })
    }

    const document = await localKnowledgeBase.addDocument(request)

    res.json({
      success: true,
      data: document
    })
  } catch (error) {
    logger.error('添加文档失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: error instanceof Error ? error.message : '添加文档失败'
      }
    })
  }
})

/**
 * POST /api/knowledge/local/batch
 * 批量添加文档到本地知识库
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const requests = req.body as AddDocumentRequest[]

    // 验证输入
    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: '请求必须是非空数组'
        }
      })
    }

    // 验证每个文档
    for (const request of requests) {
      if (!request.title || !request.content) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: '所有文档的标题和内容不能为空'
          }
        })
      }
    }

    const result = await localKnowledgeBase.addDocuments(requests)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    logger.error('批量添加文档失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: error instanceof Error ? error.message : '批量添加文档失败'
      }
    })
  }
})

/**
 * GET /api/knowledge/local/search
 * 搜索本地知识库
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query, limit, threshold } = req.query

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: '查询参数不能为空'
        }
      })
    }

    const options: SearchOptions = {
      query,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      threshold: threshold ? parseFloat(threshold as string) : undefined
    }

    const results = await localKnowledgeBase.searchDocuments(options)

    res.json({
      success: true,
      data: {
        results,
        total: results.length
      }
    })
  } catch (error) {
    logger.error('搜索文档失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: error instanceof Error ? error.message : '搜索文档失败'
      }
    })
  }
})

/**
 * PUT /api/knowledge/local/:id
 * 更新文档
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updates = req.body as Partial<AddDocumentRequest>

    const document = await localKnowledgeBase.updateDocument(id, updates)

    res.json({
      success: true,
      data: document
    })
  } catch (error) {
    logger.error('更新文档失败', { error })

    if (error instanceof Error && error.message.includes('不存在')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      })
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: error instanceof Error ? error.message : '更新文档失败'
      }
    })
  }
})

/**
 * DELETE /api/knowledge/local/:id
 * 删除文档
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await localKnowledgeBase.deleteDocument(id)

    res.json({
      success: true,
      message: `文档已删除: ${id}`
    })
  } catch (error) {
    logger.error('删除文档失败', { error })

    if (error instanceof Error && error.message.includes('不存在')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      })
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: error instanceof Error ? error.message : '删除文档失败'
      }
    })
  }
})

/**
 * GET /api/knowledge/local/list
 * 列出所有文档
 */
router.get('/list', (req: Request, res: Response) => {
  try {
    const { limit, offset } = req.query

    const result = localKnowledgeBase.listDocuments(
      limit ? parseInt(limit as string, 10) : undefined,
      offset ? parseInt(offset as string, 10) : undefined
    )

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    logger.error('列出文档失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: error instanceof Error ? error.message : '列出文档失败'
      }
    })
  }
})

/**
 * GET /api/knowledge/local/:id
 * 获取文档详情
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const document = localKnowledgeBase.getDocument(id)

    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `文档不存在: ${id}`
        }
      })
    }

    res.json({
      success: true,
      data: document
    })
  } catch (error) {
    logger.error('获取文档失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: error instanceof Error ? error.message : '获取文档失败'
      }
    })
  }
})

export default router
