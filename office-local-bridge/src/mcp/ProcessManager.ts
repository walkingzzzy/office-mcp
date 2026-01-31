/**
 * MCP 进程管理器
 * 负责 MCP Server 进程的启动、停止、重启和健康检查
 *
 * 特性：
 * - 指数退避重试策略
 * - 可配置的重启参数
 * - 错误类型感知重启决策
 * - 健康检查支持
 * - 命令注入防护
 */

import { spawn, type ChildProcess } from 'node:child_process'
import { EventEmitter } from 'node:events'
import type { McpServerConfig, McpProcessStatus } from '../types/index.js'
import { createLogger } from '../utils/logger.js'
import { validateCommandWithArgs, validateEnv } from '../utils/commandValidator.js'

const logger = createLogger('ProcessManager')

/**
 * 重启配置
 */
interface RestartConfig {
  /** 最大重启次数 */
  maxRestarts: number
  /** 基础重启延迟（毫秒） */
  baseDelay: number
  /** 最大重启延迟（毫秒） */
  maxDelay: number
  /** 指数退避因子 */
  backoffFactor: number
  /** 重启计数器重置时间（毫秒），进程稳定运行超过此时间后重置计数器 */
  resetAfter: number
}

/**
 * 默认重启配置
 */
const DEFAULT_RESTART_CONFIG: RestartConfig = {
  maxRestarts: 5,
  baseDelay: 1000,
  maxDelay: 60000,
  backoffFactor: 2,
  resetAfter: 300000 // 5 分钟
}

/**
 * 不可重启的错误类型
 */
const NON_RETRYABLE_ERRORS = [
  'ENOENT',      // 命令不存在
  'EACCES',      // 权限不足
  'EINVAL',      // 无效参数
  'MODULE_NOT_FOUND' // 模块未找到
]

/**
 * MCP 进程信息
 */
interface McpProcess {
  config: McpServerConfig
  process: ChildProcess | null
  status: 'running' | 'stopped' | 'error'
  startTime?: number
  lastError?: string
  restartCount: number
  lastRestartTime?: number
  restartTimer?: NodeJS.Timeout
  // 扩展信息
  toolCount?: number
  lastActivityTime?: number
}

/**
 * MCP 进程管理器
 */
export class ProcessManager extends EventEmitter {
  private processes: Map<string, McpProcess> = new Map()
  private restartConfig: RestartConfig

  constructor(restartConfig?: Partial<RestartConfig>) {
    super()
    this.restartConfig = { ...DEFAULT_RESTART_CONFIG, ...restartConfig }
  }

  /**
   * 更新重启配置
   */
  setRestartConfig(config: Partial<RestartConfig>): void {
    this.restartConfig = { ...this.restartConfig, ...config }
    logger.info('重启配置已更新', { config: this.restartConfig })
  }

  /**
   * 注册 MCP 服务器
   */
  register(config: McpServerConfig): void {
    if (this.processes.has(config.id)) {
      logger.warn('MCP 服务器已注册，跳过', { id: config.id })
      return
    }

    this.processes.set(config.id, {
      config,
      process: null,
      status: 'stopped',
      restartCount: 0
    })

    logger.info('MCP 服务器已注册', { id: config.id, name: config.name })
  }

  /**
   * 启动 MCP 服务器
   */
  async start(id: string): Promise<boolean> {
    const mcpProcess = this.processes.get(id)
    if (!mcpProcess) {
      logger.error('MCP 服务器未注册', { id })
      return false
    }

    if (mcpProcess.status === 'running') {
      logger.warn('MCP 服务器已在运行', { id })
      return true
    }

    const { config } = mcpProcess

    // 验证命令和参数，防止命令注入
    const commandValidation = validateCommandWithArgs(config.command, config.args)
    if (!commandValidation.valid) {
      logger.error('命令验证失败', { id, error: commandValidation.error })
      mcpProcess.status = 'error'
      mcpProcess.lastError = commandValidation.error
      this.emit('validationError', id, commandValidation.error)
      return false
    }

    // 验证环境变量
    const envValidation = validateEnv(config.env)
    if (!envValidation.valid) {
      logger.error('环境变量验证失败', { id, error: envValidation.error })
      mcpProcess.status = 'error'
      mcpProcess.lastError = envValidation.error
      this.emit('validationError', id, envValidation.error)
      return false
    }

    try {
      logger.info('启动 MCP 服务器', { id, command: config.command, args: config.args })

      const child = spawn(
        commandValidation.sanitizedCommand!,
        commandValidation.sanitizedArgs || [],
        {
          cwd: config.cwd,
          env: { ...process.env, ...config.env },
          stdio: ['pipe', 'pipe', 'pipe']
        }
      )

      mcpProcess.process = child
      mcpProcess.status = 'running'
      mcpProcess.startTime = Date.now()
      mcpProcess.lastError = undefined

      // 清理进程事件监听器的辅助函数
      const cleanupListeners = () => {
        child.removeAllListeners('error')
        child.removeAllListeners('exit')
        child.stderr?.removeAllListeners('data')
      }

      // 监听进程事件
      child.on('error', (error) => {
        logger.error('MCP 进程错误', { id, error: error.message })
        mcpProcess.status = 'error'
        mcpProcess.lastError = error.message
        cleanupListeners()
        this.emit('error', id, error)
        this.handleProcessExit(id)
      })

      child.on('exit', (code, signal) => {
        logger.info('MCP 进程退出', { id, code, signal })
        mcpProcess.status = 'stopped'
        mcpProcess.process = null
        cleanupListeners()
        this.emit('exit', id, code, signal)
        this.handleProcessExit(id, code)
      })

      // 监听 stderr
      child.stderr?.on('data', (data) => {
        const message = data.toString().trim()
        if (message) {
          logger.warn('MCP 进程 stderr', { id, message })
        }
      })

      this.emit('start', id)
      logger.info('MCP 服务器启动成功', { id, pid: child.pid })
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('MCP 服务器启动失败', { id, error: errorMessage })
      mcpProcess.status = 'error'
      mcpProcess.lastError = errorMessage
      return false
    }
  }

  /**
   * 处理进程退出，自动重启（带指数退避）
   */
  private handleProcessExit(id: string, exitCode?: number | null): void {
    const mcpProcess = this.processes.get(id)
    if (!mcpProcess || !mcpProcess.config.enabled) return

    // 清除之前的重启计时器
    if (mcpProcess.restartTimer) {
      clearTimeout(mcpProcess.restartTimer)
      mcpProcess.restartTimer = undefined
    }

    // 检查是否为不可重启的错误
    if (mcpProcess.lastError && this.isNonRetryableError(mcpProcess.lastError)) {
      logger.error('检测到不可重启的错误，停止重启', {
        id,
        error: mcpProcess.lastError
      })
      this.emit('nonRetryableError', id, mcpProcess.lastError)
      return
    }

    // 检查进程是否已稳定运行足够长时间，重置计数器
    if (mcpProcess.startTime) {
      const runningTime = Date.now() - mcpProcess.startTime
      if (runningTime >= this.restartConfig.resetAfter) {
        logger.info('进程已稳定运行，重置重启计数器', {
          id,
          runningTime,
          resetAfter: this.restartConfig.resetAfter
        })
        mcpProcess.restartCount = 0
      }
    }

    // 检查是否达到最大重启次数
    if (mcpProcess.restartCount >= this.restartConfig.maxRestarts) {
      logger.error('MCP 服务器重启次数已达上限', {
        id,
        restartCount: mcpProcess.restartCount,
        maxRestarts: this.restartConfig.maxRestarts
      })
      this.emit('maxRestartsReached', id)
      return
    }

    // 计算指数退避延迟
    const delay = this.calculateBackoffDelay(mcpProcess.restartCount)
    mcpProcess.restartCount++
    mcpProcess.lastRestartTime = Date.now()

    logger.info('准备重启 MCP 服务器（指数退避）', {
      id,
      attempt: mcpProcess.restartCount,
      maxRestarts: this.restartConfig.maxRestarts,
      delay,
      exitCode
    })

    // 设置重启计时器
    mcpProcess.restartTimer = setTimeout(() => {
      this.start(id)
    }, delay)

    this.emit('scheduledRestart', id, delay, mcpProcess.restartCount)
  }

  /**
   * 计算指数退避延迟
   */
  private calculateBackoffDelay(restartCount: number): number {
    const { baseDelay, maxDelay, backoffFactor } = this.restartConfig
    const delay = baseDelay * Math.pow(backoffFactor, restartCount)
    // 添加抖动（±10%）避免雷群效应
    const jitter = delay * 0.1 * (Math.random() * 2 - 1)
    return Math.min(Math.round(delay + jitter), maxDelay)
  }

  /**
   * 检查是否为不可重启的错误
   */
  private isNonRetryableError(errorMessage: string): boolean {
    return NON_RETRYABLE_ERRORS.some(code =>
      errorMessage.includes(code)
    )
  }

  /**
   * 取消计划中的重启
   */
  cancelScheduledRestart(id: string): boolean {
    const mcpProcess = this.processes.get(id)
    if (!mcpProcess?.restartTimer) return false

    clearTimeout(mcpProcess.restartTimer)
    mcpProcess.restartTimer = undefined
    logger.info('已取消计划中的重启', { id })
    return true
  }

  /**
   * 重置重启计数器
   */
  resetRestartCount(id: string): boolean {
    const mcpProcess = this.processes.get(id)
    if (!mcpProcess) return false

    mcpProcess.restartCount = 0
    logger.info('重启计数器已重置', { id })
    return true
  }

  /**
   * 停止 MCP 服务器
   */
  async stop(id: string): Promise<boolean> {
    const mcpProcess = this.processes.get(id)
    if (!mcpProcess) {
      logger.error('MCP 服务器未注册', { id })
      return false
    }

    // 取消任何计划中的重启
    if (mcpProcess.restartTimer) {
      clearTimeout(mcpProcess.restartTimer)
      mcpProcess.restartTimer = undefined
    }

    const child = mcpProcess.process
    if (mcpProcess.status !== 'running' || !child) {
      logger.warn('MCP 服务器未在运行', { id })
      return true
    }

    return new Promise((resolve) => {
      let resolved = false
      let timeout: NodeJS.Timeout | undefined

      const cleanup = () => {
        if (timeout) {
          clearTimeout(timeout)
          timeout = undefined
        }
        mcpProcess.status = 'stopped'
        mcpProcess.process = null
        mcpProcess.restartCount = 0
      }

      const onExit = () => {
        if (resolved) return
        resolved = true
        cleanup()
        logger.info('MCP 服务器已停止', { id })
        resolve(true)
      }

      timeout = setTimeout(() => {
        if (resolved) return
        resolved = true
        logger.warn('MCP 服务器停止超时，强制终止', { id })
        child.kill('SIGKILL')
        cleanup()
        resolve(true)
      }, 5000)

      child.once('exit', onExit)
      child.kill('SIGTERM')
    })
  }

  /**
   * 重启 MCP 服务器
   */
  async restart(id: string): Promise<boolean> {
    const mcpProcess = this.processes.get(id)
    if (!mcpProcess) {
      logger.error('MCP 服务器未注册', { id })
      return false
    }

    mcpProcess.restartCount = 0
    await this.stop(id)
    return this.start(id)
  }

  /**
   * 启动所有已启用的 MCP 服务器
   */
  async startAll(): Promise<void> {
    for (const [id, mcpProcess] of this.processes) {
      if (mcpProcess.config.enabled) {
        await this.start(id)
      }
    }
  }

  /**
   * 停止所有 MCP 服务器
   */
  async stopAll(): Promise<void> {
    for (const id of this.processes.keys()) {
      await this.stop(id)
    }
  }

  /**
   * 更新工具数量
   */
  updateToolCount(id: string, count: number): void {
    const mcpProcess = this.processes.get(id)
    if (mcpProcess) {
      mcpProcess.toolCount = count
    }
  }

  /**
   * 更新最后活动时间
   */
  updateLastActivityTime(id: string): void {
    const mcpProcess = this.processes.get(id)
    if (mcpProcess) {
      mcpProcess.lastActivityTime = Date.now()
    }
  }

  /**
   * 获取 MCP 服务器状态
   */
  getStatus(id: string): McpProcessStatus | null {
    const mcpProcess = this.processes.get(id)
    if (!mcpProcess) return null

    // 计算运行时间
    const uptime = mcpProcess.startTime && mcpProcess.status === 'running'
      ? Math.floor((Date.now() - mcpProcess.startTime) / 1000)
      : undefined

    // 注意：Node.js 无法直接获取子进程的内存使用情况
    // process.memoryUsage() 只能获取当前进程的内存，不是子进程的
    // 如需获取子进程内存，需要使用 pidusage 等第三方库或 OS API
    const memoryUsage: number | undefined = undefined

    return {
      id: mcpProcess.config.id,
      name: mcpProcess.config.name,
      status: mcpProcess.status,
      pid: mcpProcess.process?.pid,
      startTime: mcpProcess.startTime,
      lastError: mcpProcess.lastError,
      toolCount: mcpProcess.toolCount,
      uptime,
      memoryUsage,
      restartCount: mcpProcess.restartCount,
      lastActivityTime: mcpProcess.lastActivityTime
    }
  }

  /**
   * 获取所有 MCP 服务器状态
   */
  getAllStatus(): McpProcessStatus[] {
    const statuses: McpProcessStatus[] = []
    for (const id of this.processes.keys()) {
      const status = this.getStatus(id)
      if (status) {
        statuses.push(status)
      }
    }
    return statuses
  }

  /**
   * 获取进程的 stdio
   */
  getProcessStdio(id: string): { stdin: NodeJS.WritableStream; stdout: NodeJS.ReadableStream } | null {
    const mcpProcess = this.processes.get(id)
    if (!mcpProcess?.process) return null

    const { stdin, stdout } = mcpProcess.process
    if (!stdin || !stdout) return null

    return { stdin, stdout }
  }
}

export const processManager = new ProcessManager()
