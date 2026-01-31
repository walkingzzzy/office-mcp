/**
 * Office 插件配置状态管理
 * 使用 Zustand 管理全局配置状态
 */

import { create } from 'zustand'

import { configManager } from '../services/config'
import type { Assistant, Model, OfficePluginConfigResponse, Provider } from '../types/api'
import Logger from '../utils/logger'

const logger = new Logger('ConfigStore')

/**
 * 配置状态接口
 */
interface ConfigState {
  // 配置数据
  config: OfficePluginConfigResponse | null

  // 连接状态
  connected: boolean

  // 离线模式状态
  offlineMode: boolean

  // 加载状态
  loading: boolean

  // 错误信息
  error: string | null

  // 最后同步时间
  lastSyncTime: number | null

  // 连接重试计数
  retryCount: number

  // 最大重试次数
  maxRetries: number

  // Actions
  syncConfig: (force?: boolean) => Promise<void>
  checkConnection: () => Promise<void>
  clearError: () => void
  reset: () => void
  enableOfflineMode: () => void
  disableOfflineMode: () => Promise<void>
  retryConnection: () => Promise<void>

  // Getters (便捷访问)
  getProviders: () => Provider[]
  getModels: () => Model[]
  getAssistants: () => Assistant[]
  getEnabledProviders: () => Provider[]
  getModelsByProvider: (providerId: string) => Model[]
  getKnowledgeBases: () => import('../types/api').KnowledgeBase[]
  getEnabledKnowledgeBases: () => import('../types/api').KnowledgeBase[]
  getMcpServers: () => import('../types/api').McpServer[]
  getEnabledMcpServers: () => import('../types/api').McpServer[]
  getMcpStatusSummary: () => {
    totalServers: number
    enabledServers: number
    disabledServers: number
    hasActiveServer: boolean
  }
  getFeatureFlags: () => import('../types/api').FeatureFlags
}

/**
 * 初始状态
 */
const initialState: Pick<ConfigState, 'config' | 'connected' | 'offlineMode' | 'loading' | 'error' | 'lastSyncTime' | 'retryCount' | 'maxRetries'> = {
  config: null,
  connected: false,
  offlineMode: false,
  loading: false,
  error: null,
  lastSyncTime: null,
  retryCount: 0,
  maxRetries: 3
}

/**
 * 创建配置 Store
 */
export const useConfigStore = create<ConfigState>((set, get) => ({
  ...initialState,

  /**
   * 同步配置
   */
  syncConfig: async (force = false) => {
    set({ loading: true, error: null })

    try {
      const config = await configManager.getConfig(force)
      set({
        config,
        connected: true,
        loading: false,
        lastSyncTime: Date.now(),
        error: null
      })
      logger.info('配置同步成功', {
        providers: config.providers?.length || 0,
        models: config.models?.length || 0,
        assistants: config.assistants?.length || 0,
        knowledgeBases: config.knowledgeBases?.length || 0
      })
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to sync config'
      const currentState = get()
      
      // 检查是否应该启用离线模式
      if (currentState.retryCount >= currentState.maxRetries - 1) {
        logger.warn('已达到最大重试次数，启用离线模式')
        set({
          loading: false,
          connected: false,
          offlineMode: true,
          error: `${errorMessage}. 已切换到离线模式，基础功能仍可使用。`,
          retryCount: currentState.retryCount + 1
        })
      } else {
        set({
          loading: false,
          connected: false,
          error: errorMessage,
          retryCount: currentState.retryCount + 1
        })
      }
      logger.error('配置同步失败', error)
    }
  },

  /**
   * 检查连接状态
   */
  checkConnection: async () => {
    try {
      const connected = await configManager.checkConnection()
      const currentState = get()

      // 只有状态变化时才更新和输出日志
      if (currentState.connected !== connected) {
        set({ connected })
        logger.info('连接状态变化', { from: currentState.connected, to: connected })
      }
      // 移除重复的连接检查日志，减少控制台输出
    } catch (error) {
      const currentState = get()
      // 只有状态变化时才输出错误日志
      if (currentState.connected) {
        set({ connected: false })
        logger.error('连接检查失败', error)
      }
    }
  },

  /**
   * 清除错误
   */
  clearError: () => {
    set({ error: null })
  },

  /**
   * 重置状态
   */
  reset: () => {
    configManager.clearCache()
    set(initialState)
    logger.info('配置状态已重置')
  },

  /**
   * 启用离线模式
   */
  enableOfflineMode: () => {
    set({
      offlineMode: true,
      loading: false,
      error: '已启用离线模式。AI功能不可用，但基础文档编辑功能仍可正常使用。'
    })
    logger.info('已启用离线模式')
  },

  /**
   * 禁用离线模式
   */
  disableOfflineMode: async () => {
    set({
      offlineMode: false,
      retryCount: 0,
      error: null
    })
    logger.info('已禁用离线模式，正在尝试重新连接')
    // 自动尝试重新连接
    await get().syncConfig()
  },

  /**
   * 重试连接
   */
  retryConnection: async () => {
    const currentState = get()

    if (currentState.offlineMode) {
      currentState.disableOfflineMode()
      return
    }

    if (currentState.loading) {
      logger.warn('连接尝试正在进行中')
      return
    }

    logger.info('重试连接', {
      attempt: currentState.retryCount + 1,
      maxRetries: currentState.maxRetries
    })
    await currentState.syncConfig()
  },

  /**
   * 获取所有 Providers
   */
  getProviders: () => {
    const { config } = get()
    return config?.providers || []
  },

  /**
   * 获取所有 Models
   */
  getModels: () => {
    const { config } = get()
    return config?.models || []
  },

  /**
   * 获取所有 Assistants
   */
  getAssistants: () => {
    const { config } = get()
    return config?.assistants || []
  },

  /**
   * 获取已启用的 Providers
   */
  getEnabledProviders: () => {
    const { config } = get()
    return config?.providers?.filter((p) => p.enabled) || []
  },

  /**
   * 根据 Provider ID 获取 Models
   */
  getModelsByProvider: (providerId: string) => {
    const { config } = get()
    return config?.models.filter((m) => m.providerId === providerId) || []
  },

  /**
   * 获取所有知识库
   */
  getKnowledgeBases: () => {
    const { config } = get()
    return config?.knowledgeBases || []
  },

  /**
   * 获取已启用的知识库
   */
  getEnabledKnowledgeBases: () => {
    const { config } = get()
    return config?.knowledgeBases?.filter((kb) => kb.enabled) || []
  },

  /**
   * 获取所有 MCP 服务器
   */
  getMcpServers: () => {
    const { config } = get()
    return config?.mcpServers || []
  },

  /**
   * 获取已启用的 MCP 服务器
   */
  getEnabledMcpServers: () => {
    const { config } = get()
    return config?.mcpServers?.filter((server) => server.enabled) || []
  },

  /**
   * 获取 MCP 状态摘要
   */
  getMcpStatusSummary: () => {
    const { config } = get()
    const servers = config?.mcpServers || []
    const enabledServers = servers.filter((server) => server.enabled)

    return {
      totalServers: servers.length,
      enabledServers: enabledServers.length,
      disabledServers: servers.length - enabledServers.length,
      hasActiveServer: enabledServers.length > 0
    }
  },

  /**
   * 获取 Feature Flags
   */
  getFeatureFlags: () => {
    const { config } = get()
    return config?.featureFlags || {
      officeBinaryDocEnabled: false,
      officeLegacyPromptEnabled: true
    }
  }
}))

/**
 * 导出默认实例
 */
export default useConfigStore
