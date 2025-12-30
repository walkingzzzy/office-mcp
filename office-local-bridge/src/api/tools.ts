/**
 * 工具执行 API
 * 提供 HTTP 端点供 Office 插件调用
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import type { PendingCommand, CommandResult, ToolExecuteRequest } from '../types/index.js'
import { createLogger } from '../utils/logger.js'
import { loadConfig } from '../config/index.js'

const logger = createLogger('ToolsAPI')
const router = Router()

/**
 * 待执行命令队列
 * 用于 MCP Server 主动推送命令到 Office 插件执行
 */
const pendingCommands: Map<string, PendingCommand> = new Map()

/**
 * 命令结果等待队列
 * 用于等待 Office 插件返回执行结果
 */
const resultWaiters: Map<string, {
  resolve: (result: CommandResult) => void
  timeout: NodeJS.Timeout
}> = new Map()

/**
 * 默认命令超时时间（毫秒）
 */
const DEFAULT_COMMAND_TIMEOUT = 60000

/**
 * 获取命令超时时间（从配置或使用默认值）
 */
function getCommandTimeout(): number {
  const config = loadConfig()
  return config.commandTimeout ?? DEFAULT_COMMAND_TIMEOUT
}

/**
 * POST /execute-tool
 * MCP Server 调用此端点，将命令推送到队列
 * Office 插件通过轮询获取并执行
 */
router.post('/execute-tool', async (req: Request, res: Response) => {
  const { toolName, args, callId } = req.body as ToolExecuteRequest

  if (!toolName || !callId) {
    res.status(400).json({ success: false, error: '缺少必要参数: toolName, callId' })
    return
  }

  logger.info('收到工具执行请求', { toolName, callId })

  // 添加到待执行队列
  const command: PendingCommand = {
    callId,
    toolName,
    args: args || {},
    timestamp: Date.now()
  }
  pendingCommands.set(callId, command)

  // 等待执行结果
  try {
    const result = await waitForResult(callId)
    logger.info('工具执行完成', { callId, success: result.success })
    res.json(result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('工具执行失败', { callId, error: errorMessage })
    res.json({ success: false, error: errorMessage, callId })
  } finally {
    pendingCommands.delete(callId)
  }
})

/**
 * GET /pending-commands
 * Office 插件轮询此端点获取待执行命令
 */
router.get('/pending-commands', (_req: Request, res: Response) => {
  const commands = Array.from(pendingCommands.values())

  // 清理过期命令
  const now = Date.now()
  const commandTimeout = getCommandTimeout()
  for (const [callId, cmd] of pendingCommands) {
    if (now - cmd.timestamp > commandTimeout) {
      pendingCommands.delete(callId)
      const waiter = resultWaiters.get(callId)
      if (waiter) {
        clearTimeout(waiter.timeout)
        waiter.resolve({ callId, success: false, error: '命令超时' })
        resultWaiters.delete(callId)
      }
    }
  }

  res.json({ commands })
})

/**
 * POST /command-result
 * Office 插件执行完成后调用此端点返回结果
 */
router.post('/command-result', (req: Request, res: Response) => {
  const { callId, success, result, error } = req.body as CommandResult

  if (!callId) {
    res.status(400).json({ success: false, error: '缺少 callId' })
    return
  }

  logger.info('收到命令执行结果', { callId, success })

  const waiter = resultWaiters.get(callId)
  if (waiter) {
    clearTimeout(waiter.timeout)
    waiter.resolve({ callId, success, result, error })
    resultWaiters.delete(callId)
  }

  // 从待执行队列移除
  pendingCommands.delete(callId)

  res.json({ success: true })
})

/**
 * 等待命令执行结果
 */
function waitForResult(callId: string): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const commandTimeout = getCommandTimeout()
    const timeout = setTimeout(() => {
      resultWaiters.delete(callId)
      pendingCommands.delete(callId)  // 同时清理 pendingCommands
      reject(new Error('等待执行结果超时'))
    }, commandTimeout)

    resultWaiters.set(callId, { resolve, timeout })
  })
}

/**
 * 清理资源
 */
export function cleanup(): void {
  for (const [callId, waiter] of resultWaiters) {
    clearTimeout(waiter.timeout)
    waiter.resolve({ callId, success: false, error: '服务关闭' })
  }
  resultWaiters.clear()
  pendingCommands.clear()
}

export default router
