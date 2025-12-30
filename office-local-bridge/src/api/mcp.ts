/**
 * MCP 服务器管理 API
 * 提供 MCP 服务器状态查询和管理功能
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { processManager } from '../mcp/ProcessManager.js'
import { stdioBridge } from '../mcp/StdioBridge.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('McpAPI')
const router = Router()

/**
 * GET /mcp/servers
 * 获取所有 MCP 服务器状态
 */
router.get('/servers', (_req: Request, res: Response) => {
  const servers = processManager.getAllStatus()
  res.json({ servers })
})

/**
 * GET /mcp/servers/:id
 * 获取指定 MCP 服务器状态
 */
router.get('/servers/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const status = processManager.getStatus(id)

  if (!status) {
    res.status(404).json({ error: `MCP 服务器不存在: ${id}` })
    return
  }

  res.json(status)
})

/**
 * POST /mcp/servers/:id/start
 * 启动指定 MCP 服务器
 */
router.post('/servers/:id/start', async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const status = processManager.getStatus(id)

    if (!status) {
      return res.status(404).json({
        success: false,
        error: `MCP 服务器不存在: ${id}`
      })
    }

    if (status.status === 'running') {
      return res.status(400).json({
        success: false,
        error: `MCP 服务器已在运行: ${id}`
      })
    }

    logger.info('启动 MCP 服务器', { id })
    await processManager.start(id)
    stdioBridge.initServer(id)

    const newStatus = processManager.getStatus(id)
    res.json({
      success: true,
      data: {
        pid: newStatus?.pid,
        status: newStatus?.status
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('启动 MCP 服务器失败', { id, error: errorMessage })
    res.status(500).json({ success: false, error: errorMessage })
  }
})

/**
 * POST /mcp/servers/:id/stop
 * 停止指定 MCP 服务器
 */
router.post('/servers/:id/stop', async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const status = processManager.getStatus(id)

    if (!status) {
      return res.status(404).json({
        success: false,
        error: `MCP 服务器不存在: ${id}`
      })
    }

    if (status.status !== 'running') {
      return res.status(400).json({
        success: false,
        error: `MCP 服务器未在运行: ${id}`
      })
    }

    logger.info('停止 MCP 服务器', { id })
    await processManager.stop(id)

    res.json({
      success: true,
      message: `MCP 服务器已停止: ${id}`
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('停止 MCP 服务器失败', { id, error: errorMessage })
    res.status(500).json({ success: false, error: errorMessage })
  }
})

/**
 * POST /mcp/servers/:id/restart
 * 重启指定 MCP 服务器
 */
router.post('/servers/:id/restart', async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    logger.info('重启 MCP 服务器', { id })
    const success = await processManager.restart(id)

    if (success) {
      stdioBridge.initServer(id)
      res.json({ success: true, message: `MCP 服务器已重启: ${id}` })
    } else {
      res.status(500).json({ success: false, error: `重启失败: ${id}` })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('重启 MCP 服务器失败', { id, error: errorMessage })
    res.status(500).json({ success: false, error: errorMessage })
  }
})

/**
 * GET /mcp/servers/:id/logs
 * 获取指定 MCP 服务器的日志
 */
router.get('/servers/:id/logs', async (req: Request, res: Response) => {
  const { id } = req.params
  const { limit, level } = req.query

  try {
    const status = processManager.getStatus(id)
    if (!status) {
      return res.status(404).json({
        success: false,
        error: `MCP 服务器不存在: ${id}`
      })
    }

    // 从日志存储中获取该服务器的日志
    const { logStore } = await import('../utils/logger.js')
    const logs = logStore.get('ProcessManager', {
      limit: limit ? parseInt(limit as string) : 100,
      level: level as string | undefined
    })

    // 过滤出与该服务器相关的日志
    const serverLogs = logs.filter(log => {
      if (log.data && typeof log.data === 'object' && 'id' in log.data) {
        return log.data.id === id
      }
      return false
    })

    res.json({
      success: true,
      data: {
        logs: serverLogs
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('获取 MCP 服务器日志失败', { id, error: errorMessage })
    res.status(500).json({
      success: false,
      error: errorMessage
    })
  }
})

/**
 * GET /mcp/servers/:id/tools
 * 获取指定 MCP 服务器的工具列表
 */
router.get('/servers/:id/tools', async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const status = processManager.getStatus(id)
    if (!status || status.status !== 'running') {
      res.status(400).json({ error: `MCP 服务器未运行: ${id}` })
      return
    }

    const result = await stdioBridge.listTools(id)
    res.json(result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('获取工具列表失败', { id, error: errorMessage })
    res.status(500).json({ error: errorMessage })
  }
})

/**
 * POST /mcp/servers/:id/call
 * 调用指定 MCP 服务器的工具
 */
router.post('/servers/:id/call', async (req: Request, res: Response) => {
  const { id } = req.params
  const { toolName, args } = req.body

  // 验证 toolName 参数
  if (!toolName || typeof toolName !== 'string') {
    res.status(400).json({ error: '缺少 toolName 参数或类型错误' })
    return
  }

  // 验证 args 参数类型
  if (args !== undefined && (typeof args !== 'object' || args === null || Array.isArray(args))) {
    res.status(400).json({ error: 'args 参数必须是对象类型' })
    return
  }

  try {
    const status = processManager.getStatus(id)
    if (!status || status.status !== 'running') {
      res.status(400).json({ error: `MCP 服务器未运行: ${id}` })
      return
    }

    logger.info('调用 MCP 工具', { serverId: id, toolName })
    const result = await stdioBridge.callTool(id, toolName, args || {})
    res.json({ success: true, result })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('调用 MCP 工具失败', { id, toolName, error: errorMessage })
    res.status(500).json({ success: false, error: errorMessage })
  }
})

export default router
