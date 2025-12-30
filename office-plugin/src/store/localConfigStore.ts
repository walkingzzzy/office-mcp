/**
 * 本地配置状态管理
 * 使用 Zustand 管理本地 AI 配置状态
 */

import { create } from 'zustand'
import {
  localConfigManager,
  type AIProviderConfig,
  type ModelConfig,
  type LocalConfig
} from '../services/config/LocalConfigManager'

/**
 * 本地配置状态接口
 */
interface LocalConfigState {
  // 配置数据
  config: LocalConfig | null

  // 加载状态
  loading: boolean

  // 错误信息
  error: string | null

  // 桥接服务连接状态
  bridgeConnected: boolean

  // Actions
  loadConfig: () => Promise<void>
  checkBridgeConnection: () => Promise<boolean>

  // Provider 操作
  addProvider: (provider: Omit<AIProviderConfig, 'id'>) => Promise<AIProviderConfig>
  updateProvider: (id: string, updates: Partial<AIProviderConfig>) => Promise<void>
  deleteProvider: (id: string) => Promise<void>
  toggleProvider: (id: string) => Promise<void>

  // Model 操作
  addModel: (model: Omit<ModelConfig, 'id'>) => Promise<ModelConfig>
  updateModel: (id: string, updates: Partial<ModelConfig>) => Promise<void>
  deleteModel: (id: string) => Promise<void>

  // 默认设置
  setDefaultProvider: (providerId: string) => Promise<void>
  setDefaultModel: (modelId: string) => Promise<void>
  setBridgeUrl: (url: string) => Promise<void>

  // 导入导出
  exportConfig: () => Promise<string>
  importConfig: (json: string) => Promise<void>
  resetConfig: () => Promise<void>

  // Getters
  getProviders: () => AIProviderConfig[]
  getEnabledProviders: () => AIProviderConfig[]
  getModels: () => ModelConfig[]
  getModelsByProvider: (providerId: string) => ModelConfig[]
  getDefaultProvider: () => AIProviderConfig | undefined
  getDefaultModel: () => ModelConfig | undefined
}

/**
 * 创建本地配置 Store
 */
export const useLocalConfigStore = create<LocalConfigState>((set, get) => ({
  config: null,
  loading: false,
  error: null,
  bridgeConnected: false,

  /**
   * 加载配置
   */
  loadConfig: async () => {
    set({ loading: true, error: null })
    try {
      const config = await localConfigManager.loadConfig()
      set({ config, loading: false })

      // 添加配置变更监听
      localConfigManager.addListener((newConfig) => {
        set({ config: newConfig })
      })
    } catch (error) {
      set({
        loading: false,
        error: (error as Error).message || '加载配置失败'
      })
    }
  },

  /**
   * 检查桥接服务连接
   */
  checkBridgeConnection: async () => {
    const config = get().config
    if (!config) return false

    try {
      const response = await fetch(`${config.bridgeUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      const connected = response.ok
      set({ bridgeConnected: connected })
      return connected
    } catch {
      set({ bridgeConnected: false })
      return false
    }
  },

  /**
   * 添加提供商
   */
  addProvider: async (provider) => {
    const newProvider = await localConfigManager.addProvider(provider)
    const config = await localConfigManager.loadConfig()
    set({ config })
    return newProvider
  },

  /**
   * 更新提供商
   */
  updateProvider: async (id, updates) => {
    await localConfigManager.updateProvider(id, updates)
    const config = await localConfigManager.loadConfig()
    set({ config })
  },

  /**
   * 删除提供商
   */
  deleteProvider: async (id) => {
    await localConfigManager.deleteProvider(id)
    const config = await localConfigManager.loadConfig()
    set({ config })
  },

  /**
   * 切换提供商启用状态
   */
  toggleProvider: async (id) => {
    const config = get().config
    const provider = config?.providers.find(p => p.id === id)
    if (provider) {
      await localConfigManager.updateProvider(id, { enabled: !provider.enabled })
      const newConfig = await localConfigManager.loadConfig()
      set({ config: newConfig })
    }
  },

  /**
   * 添加模型
   */
  addModel: async (model) => {
    const newModel = await localConfigManager.addModel(model)
    const config = await localConfigManager.loadConfig()
    set({ config })
    return newModel
  },

  /**
   * 更新模型
   */
  updateModel: async (id, updates) => {
    await localConfigManager.updateModel(id, updates)
    const config = await localConfigManager.loadConfig()
    set({ config })
  },

  /**
   * 删除模型
   */
  deleteModel: async (id) => {
    await localConfigManager.deleteModel(id)
    const config = await localConfigManager.loadConfig()
    set({ config })
  },

  /**
   * 设置默认提供商
   */
  setDefaultProvider: async (providerId) => {
    await localConfigManager.setDefaultProvider(providerId)
    const config = await localConfigManager.loadConfig()
    set({ config })
  },

  /**
   * 设置默认模型
   */
  setDefaultModel: async (modelId) => {
    await localConfigManager.setDefaultModel(modelId)
    const config = await localConfigManager.loadConfig()
    set({ config })
  },

  /**
   * 设置桥接服务 URL
   */
  setBridgeUrl: async (url) => {
    await localConfigManager.setBridgeUrl(url)
    const config = await localConfigManager.loadConfig()
    set({ config })
  },

  /**
   * 导出配置
   */
  exportConfig: async () => {
    return localConfigManager.exportConfig()
  },

  /**
   * 导入配置
   */
  importConfig: async (json) => {
    await localConfigManager.importConfig(json)
    const config = await localConfigManager.loadConfig()
    set({ config })
  },

  /**
   * 重置配置
   */
  resetConfig: async () => {
    await localConfigManager.resetConfig()
    const config = await localConfigManager.loadConfig()
    set({ config })
  },

  /**
   * 获取所有提供商
   */
  getProviders: () => {
    return get().config?.providers || []
  },

  /**
   * 获取已启用的提供商
   */
  getEnabledProviders: () => {
    return get().config?.providers.filter(p => p.enabled) || []
  },

  /**
   * 获取所有模型
   */
  getModels: () => {
    return get().config?.models || []
  },

  /**
   * 获取提供商的模型
   */
  getModelsByProvider: (providerId) => {
    return get().config?.models.filter(m => m.providerId === providerId) || []
  },

  /**
   * 获取默认提供商
   */
  getDefaultProvider: () => {
    const config = get().config
    if (!config?.defaultProviderId) return undefined
    return config.providers.find(p => p.id === config.defaultProviderId)
  },

  /**
   * 获取默认模型
   */
  getDefaultModel: () => {
    const config = get().config
    if (!config?.defaultModelId) return undefined
    return config.models.find(m => m.id === config.defaultModelId)
  }
}))

export default useLocalConfigStore
