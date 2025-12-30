/**
 * 系统日志管理 API
 * 提供系统日志查询和管理功能
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { logStore, createLogger } from '../utils/logger.js'

const logger = createLogger('LogsAPI')
const router = Router()

/**
 * GET /api/logs
 * 获取系统日志
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { limit, level, module, since } = req.query

    const options = {
      limit: limit ? parseInt(limit as string) : 100,
      level: level as string | undefined,
      since: since ? parseInt(since as string) : undefined
    }

    let logs = logStore.getAll(options)

    // 按模块筛选
    if (module) {
      logs = logs.filter(log => log.module === module)
    }

    res.json({
      success: true,
      data: {
        logs,
        total: logs.length
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('获取系统日志失败', { error: errorMessage })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '获取系统日志失败'
      }
    })
  }
})

/**
 * DELETE /api/logs
 * 清空系统日志
 */
router.delete('/', (req: Request, res: Response) => {
  try {
    const { module } = req.query

    if (module) {
      // 清空指定模块的日志
      logStore.clear(module as string)
      logger.info('已清空模块日志', { module })
      res.json({
        success: true,
        message: `已清空模块 ${module} 的日志`
      })
    } else {
      // 清空所有日志
      logStore.clearAll()
      logger.info('已清空所有日志')
      res.json({
        success: true,
        message: '已清空所有日志'
      })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('清空系统日志失败', { error: errorMessage })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '清空系统日志失败'
      }
    })
  }
})

/**
 * GET /api/logs/modules
 * 获取所有日志模块列表
 */
router.get('/modules', (req: Request, res: Response) => {
  try {
    const allLogs = logStore.getAll({ limit: 10000 })
    const modules = [...new Set(allLogs.map(log => log.module))]

    res.json({
      success: true,
      data: {
        modules
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('获取日志模块列表失败', { error: errorMessage })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '获取日志模块列表失败'
      }
    })
  }
})

export default router
