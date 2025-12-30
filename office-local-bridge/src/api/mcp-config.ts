/**
 * MCP服务器配置管理API
 * 提供MCP服务器配置的CRUD操作
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { loadConfig, saveConfig } from '../config/index.js'
import { processManager } from '../mcp/ProcessManager.js'
import type { McpServerConfig } from '../types/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('McpConfigAPI')
const router = Router()

/**
 * GET /api/config/mcp-servers
 * 获取所有MCP服务器配置
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const config = loadConfig()
    res.json({
      success: true,
      data: {
        mcpServers: config.mcpServers
      }
    })
  } catch (error) {
    logger.error('获取MCP服务器配置失败', { error })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: '获取MCP服务器配置失败'
      }
    })
  }
})

/**
 * POST /api/config/mcp-servers
 * 添加MCP服务器配置
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const serverData = req.body as Partial<McpServerConfig>

    // 验证必填字段
    if (!serverData.name || !serverData.command) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: '缺少必填字段: name, command'
        }
      })
    }

    const config = loadConfig()

    // 生成ID
    const id = `mcp_${Date.now()}`

    // 创建完整的服务器配置对象
    const newServer: McpServerConfig = {
      id,
      name: serverData.name,
      command: serverData.command,
      args: serverData.args || [],
      cwd: serverData.cwd,
      env: serverData.env,
      enabled: serverData.enabled ?? true,
      autoStart: serverData.autoStart ?? true
    }

    // 检查名称是否重复
    if (config.mcpServers.some(s => s.name === newServer.name)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_NAME',
          message: `MCP服务器名称已存在: ${newServer.name}`
        }
      })
    }

    config.mcpServers.push(newServer)
    saveConfig(config)

    // 注册到进程管理器
    processManager.register(newServer)

    // 如果启用了自动启动，则启动服务器
    if (newServer.enabled && newServer.autoStart) {
      processManager.start(id).catch(error => {
        logger.error('自动启动MCP服务器失败', { id, error })
      })
    }

    logger.info('MCP服务器配置已添加', { id, name: newServer.name })

    res.json({
      success: true,
      data: newServer
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('添加MCP服务器配置失败', { error: errorMessage })
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
 * PUT /api/config/mcp-servers/:id
 * 更新MCP服务器配置
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updates = req.body as Partial<McpServerConfig>

    const config = loadConfig()
    const index = config.mcpServers.findIndex(s => s.id === id)

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `MCP服务器不存在: ${id}`
        }
      })
    }

    // 不允许修改ID
    delete updates.id

    // 检查名称是否与其他服务器重复
    if (updates.name && updates.name !== config.mcpServers[index].name) {
      if (config.mcpServers.some(s => s.id !== id && s.name === updates.name)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_NAME',
            message: `MCP服务器名称已存在: ${updates.name}`
          }
        })
      }
    }

    // 合并更新
    const oldServer = config.mcpServers[index]
    const updatedServer: McpServerConfig = {
      ...oldServer,
      ...updates,
      id // 确保ID不被修改
    }

    config.mcpServers[index] = updatedServer
    saveConfig(config)

    // 如果服务器正在运行且配置发生变化，需要重启
    const status = processManager.getStatus(id)
    if (status && status.status === 'running') {
      logger.info('配置已更新，重启MCP服务器', { id })
      await processManager.restart(id)
    }

    logger.info('MCP服务器配置已更新', { id })

    res.json({
      success: true,
      data: updatedServer
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('更新MCP服务器配置失败', { error: errorMessage })
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
 * DELETE /api/config/mcp-servers/:id
 * 删除MCP服务器配置
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const config = loadConfig()
    const index = config.mcpServers.findIndex(s => s.id === id)

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `MCP服务器不存在: ${id}`
        }
      })
    }

    // 如果服务器正在运行，先停止
    const status = processManager.getStatus(id)
    if (status && status.status === 'running') {
      logger.info('停止MCP服务器', { id })
      await processManager.stop(id)
    }

    // 从配置中删除
    config.mcpServers.splice(index, 1)
    saveConfig(config)

    logger.info('MCP服务器配置已删除', { id })

    res.json({
      success: true
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('删除MCP服务器配置失败', { error: errorMessage })
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
 * POST /api/config/mcp-servers/:id/toggle
 * 启用/禁用MCP服务器
 */
router.post('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const config = loadConfig()
    const server = config.mcpServers.find(s => s.id === id)

    if (!server) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `MCP服务器不存在: ${id}`
        }
      })
    }

    // 切换启用状态
    server.enabled = !server.enabled
    saveConfig(config)

    // 根据新状态启动或停止服务器
    if (server.enabled) {
      logger.info('启用并启动MCP服务器', { id })
      await processManager.start(id)
    } else {
      logger.info('禁用并停止MCP服务器', { id })
      await processManager.stop(id)
    }

    res.json({
      success: true,
      data: {
        id: server.id,
        enabled: server.enabled
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('切换MCP服务器状态失败', { error: errorMessage })
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: errorMessage
      }
    })
  }
})

export default router
