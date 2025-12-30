/**
 * Office 插件配置管理服务
 * 负责配置的获取、缓存、同步
 */

import type { OfficePluginConfigResponse } from '../types/api'
import Logger from '../utils/logger'
import { apiClient } from './api/index'

const logger = new Logger('ConfigManager')

/**
 * LocalStorage 键名
 */
const STORAGE_KEYS = {
  CONFIG: 'wuhanwenjin_office_config',
  CONFIG_VERSION: 'wuhanwenjin_office_config_version',
  CONFIG_TIMESTAMP: 'wuhanwenjin_office_config_timestamp',
  API_BASE_URL: 'wuhanwenjin_office_api_base_url'
} as const

/**
 * 配置缓存时长（毫秒）
 */
const CONFIG_CACHE_DURATION = 5 * 60 * 1000 // 5 分钟

/**
 * 配置管理器类
 */
export class ConfigManager {
  private config: OfficePluginConfigResponse | null = null
  private lastSyncTime: number = 0
  private syncInProgress: boolean = false
  private cacheInvalidated: boolean = false // 缓存失效标记

  /**
   * 手动使缓存失效
   * 下次 getConfig 调用将强制从 API 获取
   */
  invalidateCache(): void {
    this.cacheInvalidated = true
    logger.info('Config cache invalidated, will refresh on next request')
  }

  /**
   * 获取配置
   * @param force 是否强制从 API 获取（忽略缓存）
   */
  async getConfig(force: boolean = false): Promise<OfficePluginConfigResponse> {
    const now = Date.now()

    // 检查缓存是否被手动失效
    const shouldRefresh = force || this.cacheInvalidated

    logger.debug('getConfig called', { 
      force, 
      hasCachedConfig: !!this.config, 
      cacheAge: now - this.lastSyncTime,
      cacheInvalidated: this.cacheInvalidated
    })

    // 如果有缓存且未过期且未被失效，直接返回
    if (!shouldRefresh && this.config && now - this.lastSyncTime < CONFIG_CACHE_DURATION) {
      logger.info('Using cached config', {
        cacheAge: now - this.lastSyncTime,
        providersCount: this.config.providers?.length || 0,
        knowledgeBasesCount: this.config.knowledgeBases?.length || 0,
        mcpServersCount: this.config.mcpServers?.length || 0
      })
      return this.config
    }

    // 重置失效标记
    this.cacheInvalidated = false

    // 如果正在同步，等待同步完成
    if (this.syncInProgress) {
      logger.debug('Sync in progress, waiting...')
      await this.waitForSync()
      if (this.config) {
        return this.config
      }
    }

    // 从 API 获取配置
    this.syncInProgress = true
    const endTimer = logger.startTimer('Config sync')
    try {
      logger.info('Fetching config from API...')
      const config = await apiClient.getConfig()

      logger.info('Config fetched successfully', {
        providersCount: config.providers?.length || 0,
        modelsCount: config.models?.length || 0,
        knowledgeBasesCount: config.knowledgeBases?.length || 0,
        mcpServersCount: config.mcpServers?.length || 0,
        assistantsCount: config.assistants?.length || 0
      })

      // 详细记录知识库和 MCP 工具数据
      if (config.knowledgeBases && config.knowledgeBases.length > 0) {
        logger.debug('Knowledge bases loaded', {
          knowledgeBases: config.knowledgeBases.map(kb => ({
            id: kb.id,
            name: kb.name,
            enabled: kb.enabled
          }))
        })
      }

      // 记录 MCP 服务器数据（mcpTools 已废弃，使用 mcpServers）
      if (config.mcpServers && config.mcpServers.length > 0) {
        logger.info('MCP servers loaded', {
          mcpServers: config.mcpServers.map(server => ({
            id: server.id,
            name: server.name,
            enabled: server.enabled
          }))
        })
      } else {
        logger.warn('No MCP servers found in config response')
      }

      // 更新内存缓存
      this.config = config
      this.lastSyncTime = now

      // 保存到 LocalStorage
      this.saveToStorage(config)

      endTimer()
      return config
    } catch (error) {
      logger.error('Failed to fetch config from API', error)

      // 降级：尝试从 LocalStorage 加载缓存
      const cachedConfig = this.loadFromStorage()
      if (cachedConfig) {
        logger.warn('Using cached config from LocalStorage (offline mode)', {
          providersCount: cachedConfig.providers?.length || 0,
          knowledgeBasesCount: cachedConfig.knowledgeBases?.length || 0,
          mcpServersCount: cachedConfig.mcpServers?.length || 0
        })
        this.config = cachedConfig
        return cachedConfig
      }

      // 无可用配置，抛出错误
      throw new Error('无法获取配置。请确保 office-local-bridge 服务正在运行。')
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * 检查连接状态
   */
  async checkConnection(): Promise<boolean> {
    try {
      return await apiClient.checkConnection()
    } catch (error) {
      logger.warn('Connection check failed', error instanceof Error ? error : { error })
      return false
    }
  }

  /**
   * 强制同步配置
   */
  async syncConfig(): Promise<OfficePluginConfigResponse> {
    return this.getConfig(true)
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.config = null
    this.lastSyncTime = 0
    this.clearStorage()
    logger.info('Config cache cleared')
  }

  /**
   * 获取缓存的配置（不触发 API 请求）
   */
  getCachedConfig(): OfficePluginConfigResponse | null {
    return this.config || this.loadFromStorage()
  }

  /**
   * 保存配置到 LocalStorage
   */
  private saveToStorage(config: OfficePluginConfigResponse): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config))
      localStorage.setItem(STORAGE_KEYS.CONFIG_VERSION, config.syncInfo?.version || '1.0.0')
      localStorage.setItem(STORAGE_KEYS.CONFIG_TIMESTAMP, Date.now().toString())
      logger.debug('Config saved to LocalStorage')
    } catch (error) {
      logger.error('Failed to save config to LocalStorage', error instanceof Error ? error : { error })
    }
  }

  /**
   * 从 LocalStorage 加载配置
   */
  private loadFromStorage(): OfficePluginConfigResponse | null {
    try {
      const configStr = localStorage.getItem(STORAGE_KEYS.CONFIG)
      if (!configStr) {
        return null
      }

      const config: OfficePluginConfigResponse = JSON.parse(configStr)
      const timestamp = parseInt(localStorage.getItem(STORAGE_KEYS.CONFIG_TIMESTAMP) || '0', 10)

      // 检查缓存是否过期（超过 24 小时）
      const now = Date.now()
      if (now - timestamp > 24 * 60 * 60 * 1000) {
        logger.warn('Cached config is too old (>24h), ignoring')
        return null
      }

      logger.debug('Config loaded from LocalStorage')
      return config
    } catch (error) {
      logger.error('Failed to load config from LocalStorage', error instanceof Error ? error : { error })
      return null
    }
  }

  /**
   * 清除 LocalStorage
   */
  private clearStorage(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CONFIG)
      localStorage.removeItem(STORAGE_KEYS.CONFIG_VERSION)
      localStorage.removeItem(STORAGE_KEYS.CONFIG_TIMESTAMP)
    } catch (error) {
      logger.error('Failed to clear LocalStorage', error instanceof Error ? error : { error })
    }
  }

  /**
   * 等待同步完成
   */
  private async waitForSync(maxWait: number = 10000): Promise<void> {
    const startTime = Date.now()
    while (this.syncInProgress && Date.now() - startTime < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  /**
   * 设置 API 基础 URL
   */
  setApiBaseUrl(baseUrl: string): void {
    apiClient.setBaseUrl(baseUrl)
    localStorage.setItem(STORAGE_KEYS.API_BASE_URL, baseUrl)
    logger.info('API base URL updated', { baseUrl })
  }

  /**
   * 获取 API 基础 URL
   * 优先级: localStorage > 环境变量 > 默认值
   */
  getApiBaseUrl(): string {
    return (
      localStorage.getItem(STORAGE_KEYS.API_BASE_URL) ||
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
      'http://localhost:3001'
    )
  }
}

/**
 * 导出单例实例
 */
export const configManager = new ConfigManager()

/**
 * 导出默认实例
 */
export default configManager
