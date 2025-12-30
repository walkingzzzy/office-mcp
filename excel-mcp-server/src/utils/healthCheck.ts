/**
 * Health Check and System Monitoring
 * Excel MCP Server 健康检查模块
 */

import { logger } from './logger.js'
import { sendIPCCommand } from './ipc.js'

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: number
  checks: HealthCheckResult[]
  overallScore: number
  serverName: string
}

export interface HealthCheckResult {
  name: string
  status: 'pass' | 'warn' | 'fail'
  duration: number
  message?: string
  details?: any
}

export class HealthChecker {
  private checks: HealthCheck[] = []
  private serverName: string

  constructor(serverName: string = 'excel-mcp-server') {
    this.serverName = serverName
    this.registerDefaultChecks()
  }

  registerCheck(check: HealthCheck): void {
    this.checks.push(check)
  }

  async runHealthChecks(): Promise<HealthStatus> {
    const startTime = Date.now()
    const results: HealthCheckResult[] = []

    logger.info('运行健康检查...')

    for (const check of this.checks) {
      const checkStart = Date.now()
      try {
        const result = await check.execute()
        results.push({
          name: check.name,
          status: result.status,
          duration: Date.now() - checkStart,
          message: result.message,
          details: result.details
        })
      } catch (error: any) {
        results.push({
          name: check.name,
          status: 'fail',
          duration: Date.now() - checkStart,
          message: error.message
        })
      }
    }

    const overallScore = this.calculateOverallScore(results)
    const status = this.determineOverallStatus(overallScore)

    const healthStatus: HealthStatus = {
      status,
      timestamp: Date.now(),
      checks: results,
      overallScore,
      serverName: this.serverName
    }

    logger.info(`健康检查完成: ${status} (得分: ${overallScore})`)
    return healthStatus
  }

  private calculateOverallScore(results: HealthCheckResult[]): number {
    if (results.length === 0) return 0

    const scores = results.map(result => {
      switch (result.status) {
        case 'pass': return 100
        case 'warn': return 50
        case 'fail': return 0
        default: return 0
      }
    })

    return Math.round(scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length)
  }

  private determineOverallStatus(score: number): 'healthy' | 'degraded' | 'unhealthy' {
    if (score >= 80) return 'healthy'
    if (score >= 50) return 'degraded'
    return 'unhealthy'
  }

  private registerDefaultChecks(): void {
    // IPC Communication Check
    this.registerCheck({
      name: 'IPC 通信',
      execute: async () => {
        try {
          await sendIPCCommand('get_system_info', {})
          return { status: 'pass', message: 'IPC 通信正常' }
        } catch (error: any) {
          return { status: 'warn', message: `IPC 通信暂不可用: ${error.message}` }
        }
      }
    })

    // Memory Usage Check
    this.registerCheck({
      name: '内存使用',
      execute: async () => {
        const memUsage = process.memoryUsage()
        const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)

        if (heapUsedMB > 500) {
          return { status: 'warn', message: `内存使用较高: ${heapUsedMB}MB`, details: memUsage }
        }

        return { status: 'pass', message: `内存使用正常: ${heapUsedMB}MB`, details: memUsage }
      }
    })

    // Uptime Check
    this.registerCheck({
      name: '运行时间',
      execute: async () => {
        const uptimeSeconds = process.uptime()
        const uptimeMinutes = Math.round(uptimeSeconds / 60)

        return {
          status: 'pass',
          message: `已运行 ${uptimeMinutes} 分钟`,
          details: { uptimeSeconds }
        }
      }
    })
  }
}

interface HealthCheck {
  name: string
  execute: () => Promise<{ status: 'pass' | 'warn' | 'fail'; message?: string; details?: any }>
}

// Global health checker instance
export const globalHealthChecker = new HealthChecker('excel-mcp-server')
