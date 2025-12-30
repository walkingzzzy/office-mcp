/**
 * 本地配置管理器
 * 管理用户自定义的 AI 提供商配置
 */

import { secureStorage } from '../storage/SecureStorage'
import Logger from '../../utils/logger'

const logger = new Logger('LocalConfigManager')
const CONFIG_KEY = 'local_config'
const CONFIG_VERSION = 1

/**
 * AI 提供商类型
 */
export type AIProviderType = 'openai' | 'azure' | 'anthropic' | 'custom'

/**
 * AI 提供商配置
 */
export interface AIProviderConfig {
  id: string
  type: AIProviderType
  name: string
  enabled: boolean
  apiKey: string
  baseUrl?: string
  // Azure 特有
  azureDeployment?: string
  azureApiVersion?: string
  // 自定义端点
  customHeaders?: Record<string, string>
}

/**
 * 模型配置
 */
export interface ModelConfig {
  id: string
  providerId: string
  name: string
  displayName: string
  enabled: boolean
  maxTokens?: number
  temperature?: number
}

/**
 * 本地配置
 */
export interface LocalConfig {
  version: number
  providers: AIProviderConfig[]
  models: ModelConfig[]
  defaultProviderId?: string
  defaultModelId?: string
  bridgeUrl: string
  updatedAt: number
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: LocalConfig = {
  version: CONFIG_VERSION,
  providers: [],
  models: [],
  bridgeUrl: 'http://localhost:3001',
  updatedAt: Date.now()
}

/**
 * 配置变更监听器
 */
type ConfigChangeListener = (config: LocalConfig) => void

/**
 * 本地配置管理器类
 */
class LocalConfigManager {
  private config: LocalConfig | null = null
  private listeners: Set<ConfigChangeListener> = new Set()

  /**
   * 加载配置
   */
  async loadConfig(): Promise<LocalConfig> {
    if (this.config) {
      return this.config
    }

    try {
      const stored = await secureStorage.getItem(CONFIG_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as LocalConfig
        // 版本迁移
        if (parsed.version < CONFIG_VERSION) {
          this.config = this.migrateConfig(parsed)
          await this.saveConfig()
        } else {
          this.config = parsed
        }
      } else {
        this.config = { ...DEFAULT_CONFIG }
      }
    } catch (error) {
      logger.error('加载本地配置失败', error instanceof Error ? error : { error })
      this.config = { ...DEFAULT_CONFIG }
    }

    return this.config
  }

  /**
   * 保存配置
   */
  async saveConfig(): Promise<void> {
    if (!this.config) return

    this.config.updatedAt = Date.now()
    await secureStorage.setItem(CONFIG_KEY, JSON.stringify(this.config))
    this.notifyListeners()
  }

  /**
   * 配置版本迁移
   */
  private migrateConfig(oldConfig: LocalConfig): LocalConfig {
    // 未来版本迁移逻辑
    return {
      ...DEFAULT_CONFIG,
      ...oldConfig,
      version: CONFIG_VERSION
    }
  }

  /**
   * 通知监听器
   */
  private notifyListeners(): void {
    if (!this.config) return
    this.listeners.forEach(listener => listener(this.config!))
  }

  /**
   * 添加配置变更监听器
   */
  addListener(listener: ConfigChangeListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * 获取所有提供商
   */
  async getProviders(): Promise<AIProviderConfig[]> {
    const config = await this.loadConfig()
    return config.providers
  }

  /**
   * 获取已启用的提供商
   */
  async getEnabledProviders(): Promise<AIProviderConfig[]> {
    const providers = await this.getProviders()
    return providers.filter(p => p.enabled)
  }

  /**
   * 添加提供商
   */
  async addProvider(provider: Omit<AIProviderConfig, 'id'>): Promise<AIProviderConfig> {
    const config = await this.loadConfig()
    const newProvider: AIProviderConfig = {
      ...provider,
      id: `provider_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    }
    config.providers.push(newProvider)
    await this.saveConfig()
    return newProvider
  }

  /**
   * 更新提供商
   */
  async updateProvider(id: string, updates: Partial<AIProviderConfig>): Promise<void> {
    const config = await this.loadConfig()
    const index = config.providers.findIndex(p => p.id === id)
    if (index !== -1) {
      config.providers[index] = { ...config.providers[index], ...updates }
      await this.saveConfig()
    }
  }

  /**
   * 删除提供商
   */
  async deleteProvider(id: string): Promise<void> {
    const config = await this.loadConfig()
    config.providers = config.providers.filter(p => p.id !== id)
    // 同时删除关联的模型
    config.models = config.models.filter(m => m.providerId !== id)
    await this.saveConfig()
  }

  /**
   * 获取所有模型
   */
  async getModels(): Promise<ModelConfig[]> {
    const config = await this.loadConfig()
    return config.models
  }

  /**
   * 获取提供商的模型
   */
  async getModelsByProvider(providerId: string): Promise<ModelConfig[]> {
    const models = await this.getModels()
    return models.filter(m => m.providerId === providerId)
  }

  /**
   * 添加模型
   */
  async addModel(model: Omit<ModelConfig, 'id'>): Promise<ModelConfig> {
    const config = await this.loadConfig()
    const newModel: ModelConfig = {
      ...model,
      id: `model_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    }
    config.models.push(newModel)
    await this.saveConfig()
    return newModel
  }

  /**
   * 更新模型
   */
  async updateModel(id: string, updates: Partial<ModelConfig>): Promise<void> {
    const config = await this.loadConfig()
    const index = config.models.findIndex(m => m.id === id)
    if (index !== -1) {
      config.models[index] = { ...config.models[index], ...updates }
      await this.saveConfig()
    }
  }

  /**
   * 删除模型
   */
  async deleteModel(id: string): Promise<void> {
    const config = await this.loadConfig()
    config.models = config.models.filter(m => m.id !== id)
    await this.saveConfig()
  }

  /**
   * 设置默认提供商
   */
  async setDefaultProvider(providerId: string): Promise<void> {
    const config = await this.loadConfig()
    config.defaultProviderId = providerId
    await this.saveConfig()
  }

  /**
   * 设置默认模型
   */
  async setDefaultModel(modelId: string): Promise<void> {
    const config = await this.loadConfig()
    config.defaultModelId = modelId
    await this.saveConfig()
  }

  /**
   * 获取桥接服务 URL
   */
  async getBridgeUrl(): Promise<string> {
    const config = await this.loadConfig()
    return config.bridgeUrl
  }

  /**
   * 设置桥接服务 URL
   */
  async setBridgeUrl(url: string): Promise<void> {
    const config = await this.loadConfig()
    config.bridgeUrl = url
    await this.saveConfig()
  }

  /**
   * 导出配置（不含敏感信息）
   */
  async exportConfig(): Promise<string> {
    const config = await this.loadConfig()
    const exportData = {
      ...config,
      providers: config.providers.map(p => ({
        ...p,
        apiKey: '' // 不导出 API Key
      }))
    }
    return JSON.stringify(exportData, null, 2)
  }

  /**
   * 导入配置
   */
  async importConfig(jsonString: string): Promise<void> {
    const imported = JSON.parse(jsonString) as LocalConfig
    const config = await this.loadConfig()

    // 合并提供商（保留现有 API Key）
    for (const provider of imported.providers) {
      const existing = config.providers.find(p => p.name === provider.name)
      if (existing) {
        // 更新但保留 API Key
        Object.assign(existing, { ...provider, apiKey: existing.apiKey })
      } else {
        config.providers.push(provider)
      }
    }

    // 合并模型
    for (const model of imported.models) {
      const existing = config.models.find(m => m.name === model.name)
      if (existing) {
        Object.assign(existing, model)
      } else {
        config.models.push(model)
      }
    }

    config.bridgeUrl = imported.bridgeUrl || config.bridgeUrl
    await this.saveConfig()
  }

  /**
   * 重置配置
   */
  async resetConfig(): Promise<void> {
    this.config = { ...DEFAULT_CONFIG }
    await this.saveConfig()
  }
}

export const localConfigManager = new LocalConfigManager()
export default localConfigManager
