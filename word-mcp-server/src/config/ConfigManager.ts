/**
 * 配置管理器 - 生产环境部署配置
 */

import process from 'node:process'

import { readFileSync } from 'fs'
import { join } from 'path'

export interface AppConfig {
  server: {
    port: number
    host: string
    timeout?: number
    name?: string
    version?: string
  }
  performance: {
    enableCache: boolean
    cacheTTL: number // Changed from cacheTtl to match JSON
    maxConcurrentOperations: number
    operationTimeout: number
    enableMonitoring?: boolean
    healthCheckInterval?: number
    enableProfiling?: boolean
  }
  monitoring: {
    healthCheckInterval?: number
    performanceMonitoring?: boolean // Kept for backward compatibility or specific logic
    enableHealthCheck?: boolean
    enableMetrics?: boolean
    enablePerformanceTracking?: boolean
    metricsInterval?: number
    enableTracing?: boolean
  }
  logging: {
    level: string
    format?: string
    compress?: boolean
    maxFiles?: number
    maxSize?: string
    enableConsole?: boolean
    enableFile?: boolean
    maxFileSize?: string
  }
  security: {
    enableCors: boolean
    allowedOrigins: string[]
    maxRetryAttempts?: number
    retryDelay?: number
    enableEncryption?: boolean
    enableRateLimit?: boolean
    rateLimitMax?: number
    rateLimitWindow?: number
    maxRequestsPerMinute?: number
  }
  errorHandling: {
    enableDetailedErrors: boolean
    enableFallbackStrategies: boolean
    maxRetryAttempts: number
    retryDelay: number
  }
  ipc: {
    apiBaseUrl: string
    timeout: number
    maxRetries: number
    retryDelay: number
  }
}

export class ConfigManager {
  private static instance: ConfigManager
  private config: AppConfig = this.getDefaultConfig()

  private constructor() {
    this.loadConfig()
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  private loadConfig(): void {
    const env = process.env.NODE_ENV || 'development'
    const configPath = join(process.cwd(), 'config', `${env}.json`)

    try {
      const configData = readFileSync(configPath, 'utf-8')
      const fileConfig = JSON.parse(configData)
      // Merge file config with default config
      this.config = { ...this.getDefaultConfig(), ...fileConfig }

      // Deep merge for nested objects if necessary, but simple spread works for top level.
      // For robustness, let's do a shallow merge of sections.
      this.config.server = { ...this.getDefaultConfig().server, ...fileConfig.server }
      this.config.performance = { ...this.getDefaultConfig().performance, ...fileConfig.performance }
      this.config.monitoring = { ...this.getDefaultConfig().monitoring, ...fileConfig.monitoring }
      this.config.logging = { ...this.getDefaultConfig().logging, ...fileConfig.logging }
      this.config.security = { ...this.getDefaultConfig().security, ...fileConfig.security }
      this.config.errorHandling = { ...this.getDefaultConfig().errorHandling, ...fileConfig.errorHandling }
      this.config.ipc = { ...this.getDefaultConfig().ipc, ...fileConfig.ipc }
    } catch (error) {

      ;(globalThis as any).console?.warn(`Failed to load config from ${configPath}, using defaults`)
      this.config = this.getDefaultConfig()
    }

    // Apply environment variable overrides
    this.applyEnvOverrides()
  }

  private applyEnvOverrides(): void {
    if (process.env.PORT || process.env.OFFICE_MCP_PORT) {
      this.config.server.port = parseInt(process.env.PORT || process.env.OFFICE_MCP_PORT || '3001', 10)
    }
    if (process.env.HOST || process.env.OFFICE_MCP_HOST) {
      this.config.server.host = process.env.HOST || process.env.OFFICE_MCP_HOST || '0.0.0.0'
    }
    if (process.env.LOG_LEVEL || process.env.OFFICE_MCP_LOG_LEVEL) {
      this.config.logging.level = process.env.LOG_LEVEL || process.env.OFFICE_MCP_LOG_LEVEL || 'info'
    }
    // IPC API Base URL 环境变量覆盖
    if (process.env.WENJIN_API_BASE_URL || process.env.OFFICE_MCP_IPC_URL) {
      const baseUrl = process.env.WENJIN_API_BASE_URL || process.env.OFFICE_MCP_IPC_URL
      this.config.ipc.apiBaseUrl = `${baseUrl}/api/office-plugin`
    }
  }

  private getDefaultConfig(): AppConfig {
    return {
      server: {
        port: 3001,
        host: '0.0.0.0',
        timeout: 30000,
        name: 'office-mcp-js',
        version: '2.0.0'
      },
      performance: {
        enableCache: true,
        cacheTTL: 300000,
        maxConcurrentOperations: 10,
        operationTimeout: 30000,
        enableMonitoring: true,
        healthCheckInterval: 30000
      },
      monitoring: {
        enableHealthCheck: true,
        enableMetrics: true,
        enablePerformanceTracking: true,
        metricsInterval: 60000
      },
      logging: {
        level: 'info',
        format: 'json',
        compress: true,
        maxFiles: 10,
        maxSize: '10m'
      },
      security: {
        enableCors: false,
        allowedOrigins: ['localhost:3001'],
        enableEncryption: true,
        enableRateLimit: true,
        rateLimitMax: 100,
        rateLimitWindow: 900000
      },
      errorHandling: {
        enableDetailedErrors: false,
        enableFallbackStrategies: true,
        maxRetryAttempts: 3,
        retryDelay: 1000
      },
      ipc: {
        apiBaseUrl: 'http://localhost:3001/api/office-plugin',
        timeout: 30000,
        maxRetries: 3,
        retryDelay: 1000
      }
    }
  }

  getConfig(): AppConfig {
    return this.config
  }

  get<T>(path: string): T {
    const keys = path.split('.')
    let value: any = this.config

    for (const key of keys) {
      value = value?.[key]
    }

    return value as T
  }
}
