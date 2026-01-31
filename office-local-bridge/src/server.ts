/**
 * Office Local Bridge 主入口
 * 轻量级本地桥接服务，连接 Office 插件与 MCP Server
 */

import express from 'express'
import cors from 'cors'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadConfig, discoverMcpServers } from './config/index.js'
import { processManager } from './mcp/ProcessManager.js'
import { stdioBridge } from './mcp/StdioBridge.js'
import toolsRouter, { cleanup as cleanupTools } from './api/tools.js'
import mcpRouter from './api/mcp.js'
import mcpConfigRouter from './api/mcp-config.js'
import aiRouter from './api/ai.js'
import configRouter from './api/config.js'
import searchRouter from './api/search.js'
import knowledgeRouter from './api/knowledge.js'
import knowledgeLocalRouter from './api/knowledge-local.js'
import unifiedSearchRouter from './api/unified-search.js'
import providersRouter from './api/providers.js'
import modelsRouter from './api/models.js'
import logsRouter from './api/logs.js'
import officeRouter from './api/office.js'
import { createLogger, setLogLevel } from './utils/logger.js'
import { logStore } from './utils/LogStore.js'
import { WebSocketServer } from './websocket/WebSocketServer.js'
import { tokenAuth } from './middleware/auth.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import {
  VALID_LOG_LEVELS,
  DEFAULT_LOG_LEVEL,
  SERVICE_VERSION,
  SERVICE_START_TIME,
  FORCE_EXIT_TIMEOUT_MS
} from './utils/constants.js'
import type { HealthCheckResponse } from './types/index.js'

const logger = createLogger('Server')

/**
 * 验证并获取有效的日志级别
 * @param level 配置的日志级别
 * @returns 有效的日志级别
 */
function validateLogLevel(level: string): 'debug' | 'info' | 'warn' | 'error' {
  if (VALID_LOG_LEVELS.includes(level as typeof VALID_LOG_LEVELS[number])) {
    return level as 'debug' | 'info' | 'warn' | 'error'
  }
  logger.warn('无效的日志级别配置，使用默认值', { configured: level, default: DEFAULT_LOG_LEVEL })
  return DEFAULT_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error'
}

/**
 * 获取系统内存使用信息
 */
function getMemoryUsage(): {
  heapUsed: number
  heapTotal: number
  external: number
  rss: number
  heapUsedMB: string
  rssMB: string
} {
  const memUsage = process.memoryUsage()
  return {
    heapUsed: memUsage.heapUsed,
    heapTotal: memUsage.heapTotal,
    external: memUsage.external,
    rss: memUsage.rss,
    heapUsedMB: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
    rssMB: (memUsage.rss / 1024 / 1024).toFixed(2) + ' MB'
  }
}

/**
 * 获取系统运行时间信息
 */
function getUptimeInfo(): {
  uptimeSeconds: number
  uptimeFormatted: string
  startTime: number
} {
  const uptimeSeconds = Math.floor((Date.now() - SERVICE_START_TIME) / 1000)
  const hours = Math.floor(uptimeSeconds / 3600)
  const minutes = Math.floor((uptimeSeconds % 3600) / 60)
  const seconds = uptimeSeconds % 60

  return {
    uptimeSeconds,
    uptimeFormatted: `${hours}h ${minutes}m ${seconds}s`,
    startTime: SERVICE_START_TIME
  }
}

/**
 * 启动服务器
 */
async function startServer(): Promise<void> {
  // 加载配置
  const config = loadConfig()
  
  // 验证并设置日志级别
  const validLogLevel = validateLogLevel(config.logLevel)
  setLogLevel(validLogLevel)

  logger.info('Office Local Bridge 启动中...', { port: config.port })

  // 创建 Express 应用
  const app = express()

  // 配置 CORS - 允许 Office 插件访问
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [
        'http://localhost:3000',
        'https://localhost:3000',
        'http://127.0.0.1:3000',
        'https://127.0.0.1:3000',
        'http://localhost:1420',
        'https://localhost:1420',
        'http://127.0.0.1:1420',
        'https://127.0.0.1:1420',
        'tauri://localhost'
      ]

  // 是否为开发环境
  const isDevelopment = process.env.NODE_ENV !== 'production'

  app.use(cors({
    origin: (origin, callback) => {
      // 仅在开发环境允许无 origin 的请求（如 Postman）
      if (!origin) {
        if (isDevelopment) {
          return callback(null, true)
        }
        logger.warn('CORS 请求被拒绝：缺少 origin', { origin })
        return callback(new Error('不允许的来源'))
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        logger.warn('CORS 请求被拒绝', { origin })
        callback(new Error('不允许的来源'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }))

  // 解析 JSON 请求体（添加大小限制以防止 DoS 攻击）
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // 健康检查端点 - 返回详细的系统健康信息
  app.get('/health', tokenAuth, (_req, res) => {
    const memoryUsage = getMemoryUsage()
    const uptimeInfo = getUptimeInfo()
    const mcpServers = processManager.getAllStatus()

    // 计算 MCP 服务器健康状态
    const runningServers = mcpServers.filter(s => s.status === 'running').length
    const totalServers = mcpServers.length
    const allServersHealthy = totalServers === 0 || runningServers > 0

    const response = {
      success: true,
      data: {
        status: allServersHealthy ? 'ok' : 'degraded',
        timestamp: Date.now(),
        version: SERVICE_VERSION,
        uptime: uptimeInfo,
        memory: memoryUsage,
        process: {
          pid: process.pid,
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch
        },
        mcpServers: {
          total: totalServers,
          running: runningServers,
          stopped: mcpServers.filter(s => s.status === 'stopped').length,
          error: mcpServers.filter(s => s.status === 'error').length,
          details: mcpServers
        }
      } as HealthCheckResponse & {
        uptime: ReturnType<typeof getUptimeInfo>
        memory: ReturnType<typeof getMemoryUsage>
        process: {
          pid: number
          nodeVersion: string
          platform: string
          arch: string
        }
        mcpServers: {
          total: number
          running: number
          stopped: number
          error: number
          details: typeof mcpServers
        }
      }
    }
    res.json(response)
  })

  // 挂载 API 路由（带认证中间件）
  app.use('/api', tokenAuth, toolsRouter)
  app.use('/api/mcp', tokenAuth, mcpRouter)
  app.use('/api/config/mcp-servers', tokenAuth, mcpConfigRouter)
  app.use('/api/ai', tokenAuth, aiRouter)
  app.use('/api/config', tokenAuth, configRouter)
  app.use('/api/config/providers', tokenAuth, providersRouter)
  app.use('/api/config/models', tokenAuth, modelsRouter)
  app.use('/api/search', tokenAuth, searchRouter)
  app.use('/api/knowledge', tokenAuth, knowledgeRouter)
  app.use('/api/knowledge/local', tokenAuth, knowledgeLocalRouter)
  app.use('/api/unified-search', tokenAuth, unifiedSearchRouter)
  app.use('/api/logs', tokenAuth, logsRouter)
  app.use('/api/office', tokenAuth, officeRouter)

  // ========== /v1/office/* 兼容路由 ==========
  // 将旧版 /v1/office/* 路由转发到对应的 /api/* 处理器
  app.get('/v1/office/health', (_req, res) => {
    res.redirect(307, '/health')
  })
  app.get('/v1/office/status', (_req, res) => {
    res.redirect(307, '/health')
  })
  app.use('/v1/office/config', tokenAuth, configRouter)
  // /v1/office/tools -> toolsRouter (提供 /execute-tool, /pending-commands, /command-result)
  app.use('/v1/office/tools', tokenAuth, toolsRouter)
  // /v1/office/mcp -> mcpRouter (提供 /servers, /servers/:id/tools 等)
  app.use('/v1/office/mcp', tokenAuth, mcpRouter)
  app.use('/v1/office', tokenAuth, officeRouter)

  // 404 处理中间件（放在所有路由之后）
  app.use('/api/*', notFoundHandler)
  app.use('/v1/office/*', notFoundHandler)

  // 统一错误处理中间件（必须放在最后）
  app.use(errorHandler)

  // 启动 HTTP 服务器
  const server = app.listen(config.port, config.host, () => {
    logger.info('服务器已启动', {
      url: `http://${config.host}:${config.port}`,
      websocket: `ws://${config.host}:${config.port}/ws`,
      endpoints: {
        health: '/health',
        executeTool: '/api/execute-tool',
        pendingCommands: '/api/pending-commands',
        commandResult: '/api/command-result',
        mcpServers: '/api/mcp/servers',
        mcpTools: '/api/mcp/servers/:id/tools',
        mcpCall: '/api/mcp/servers/:id/call',
        aiProviders: '/api/ai/providers',
        aiChat: '/api/ai/chat/completions'
      }
    })
  })

  // 创建 WebSocket 服务器
  const wsServer = new WebSocketServer(server)

  // 监听日志并广播
  logStore.addListener((entry) => {
    wsServer.broadcastLog(entry)
  })

  // 注册并启动 MCP 服务器
  await initMcpServers(config, wsServer)

  // 优雅关闭
  setupGracefulShutdown(server, wsServer)
}

/**
 * 初始化 MCP 服务器
 */
async function initMcpServers(config: ReturnType<typeof loadConfig>, wsServer: WebSocketServer): Promise<void> {
  let servers = config.mcpServers

  // 如果配置中没有服务器，尝试自动发现
  if (servers.length === 0) {
    // 尝试多个可能的路径
    const possiblePaths = [
      process.cwd(),                          // 当前目录
      join(process.cwd(), '..'),              // 父目录（MCP 服务器通常在这里）
      dirname(dirname(fileURLToPath(import.meta.url)))  // 项目根目录的父目录
    ]
    
    for (const basePath of possiblePaths) {
      servers = discoverMcpServers(basePath)
      if (servers.length > 0) {
        break
      }
    }
    logger.info('自动发现 MCP 服务器', { count: servers.length })
  }

  // 注册所有服务器
  for (const serverConfig of servers) {
    if (config.apiToken) {
      serverConfig.env = {
        ...serverConfig.env,
        OFFICE_MCP_API_TOKEN: config.apiToken
      }
    }
    processManager.register(serverConfig)
  }

  // 监听进程事件
  processManager.on('start', (id) => {
    logger.info('MCP 服务器已启动', { id })
    stdioBridge.initServer(id)
    const status = processManager.getStatus(id)
    wsServer.broadcastStatus(id, 'running', 'MCP 服务器已启动', status?.pid)
  })

  processManager.on('exit', (id, code) => {
    logger.warn('MCP 服务器已退出', { id, code })
    wsServer.broadcastStatus(id, 'stopped', `MCP 服务器已退出，退出码: ${code}`)
  })

  processManager.on('error', (id, error) => {
    logger.error('MCP 服务器错误', { id, error: error.message })
    wsServer.broadcastStatus(id, 'error', error.message)
  })

  // 启动所有已启用的服务器
  await processManager.startAll()
}

/**
 * 设置优雅关闭
 */
function setupGracefulShutdown(server: ReturnType<typeof express.application.listen>, wsServer: WebSocketServer): void {
  const shutdown = async (signal: string) => {
    logger.info('收到关闭信号，正在关闭...', { signal })

    // 关闭 WebSocket 服务器
    wsServer.close()

    // 清理工具 API 资源
    cleanupTools()

    // 清理 stdio 桥接
    stdioBridge.cleanup()

    // 停止所有 MCP 服务器
    await processManager.stopAll()

    // 关闭 HTTP 服务器
    server.close(() => {
      logger.info('服务器已关闭')
      process.exit(0)
    })

    // 强制退出超时
    setTimeout(() => {
      logger.error('强制退出')
      process.exit(1)
    }, FORCE_EXIT_TIMEOUT_MS)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

// 启动服务器
startServer().catch((error) => {
  logger.error('服务器启动失败', { error: error.message })
  process.exit(1)
})
