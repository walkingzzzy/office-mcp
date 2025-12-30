/**
 * 统一配置 Hook
 * 整合本地配置和远程配置，提供统一的配置访问接口
 */

import { useEffect, useMemo } from 'react'
import { useConfigStore } from '../store/configStore'
import { useLocalConfigStore } from '../store/localConfigStore'
import type { AIProviderConfig, ModelConfig } from '../services/config/LocalConfigManager'

/**
 * 配置来源
 */
export type ConfigSource = 'local' | 'remote' | 'hybrid'

/**
 * 统一配置接口
 */
export interface UnifiedConfig {
  // 配置来源
  source: ConfigSource

  // 连接状态
  connected: boolean
  bridgeConnected: boolean
  loading: boolean

  // 提供商和模型
  providers: AIProviderConfig[]
  models: ModelConfig[]
  defaultProviderId?: string
  defaultModelId?: string

  // 桥接服务
  bridgeUrl: string

  // 功能标志
  useLocalAI: boolean
  useMCP: boolean
}

/**
 * 统一配置 Hook
 */
export function useUnifiedConfig(): UnifiedConfig {
  // 远程配置
  const remoteConfig = useConfigStore()

  // 本地配置
  const localConfig = useLocalConfigStore()

  // 初始化
  useEffect(() => {
    // 加载本地配置
    localConfig.loadConfig()

    // 尝试同步远程配置
    remoteConfig.syncConfig()
  }, [])

  // 检查桥接服务连接
  useEffect(() => {
    if (localConfig.config?.bridgeUrl) {
      localConfig.checkBridgeConnection()
    }
  }, [localConfig.config?.bridgeUrl])

  // 计算统一配置
  const unifiedConfig = useMemo<UnifiedConfig>(() => {
    const hasLocalProviders = (localConfig.config?.providers.length || 0) > 0
    const hasRemoteConfig = remoteConfig.connected && remoteConfig.config !== null

    // 确定配置来源
    let source: ConfigSource = 'remote'
    if (hasLocalProviders && !hasRemoteConfig) {
      source = 'local'
    } else if (hasLocalProviders && hasRemoteConfig) {
      source = 'hybrid'
    }

    // 合并提供商列表
    const localProviders = localConfig.config?.providers || []
    const remoteProviders = remoteConfig.config?.providers?.map(p => ({
      id: p.id,
      type: 'custom' as const,
      name: p.name,
      enabled: p.enabled,
      apiKey: '', // 远程配置不暴露 API Key
      baseUrl: p.baseUrl
    })) || []

    // 本地配置优先
    const providers = hasLocalProviders ? localProviders : remoteProviders

    // 合并模型列表
    const localModels = localConfig.config?.models || []
    const remoteModels = remoteConfig.config?.models?.map(m => ({
      id: m.id,
      providerId: m.providerId,
      name: m.name,
      displayName: m.displayName || m.name,
      enabled: true,
      maxTokens: m.maxTokens
    })) || []

    const models = hasLocalProviders ? localModels : remoteModels

    return {
      source,
      connected: remoteConfig.connected,
      bridgeConnected: localConfig.bridgeConnected,
      loading: remoteConfig.loading || localConfig.loading,
      providers,
      models,
      defaultProviderId: localConfig.config?.defaultProviderId,
      defaultModelId: localConfig.config?.defaultModelId,
      bridgeUrl: localConfig.config?.bridgeUrl || 'http://localhost:3001',
      useLocalAI: hasLocalProviders,
      useMCP: localConfig.bridgeConnected
    }
  }, [
    localConfig.config,
    localConfig.bridgeConnected,
    localConfig.loading,
    remoteConfig.config,
    remoteConfig.connected,
    remoteConfig.loading
  ])

  return unifiedConfig
}

/**
 * 获取 AI 请求配置
 */
export function useAIRequestConfig() {
  const localConfig = useLocalConfigStore()

  return useMemo(() => {
    const defaultProvider = localConfig.getDefaultProvider()
    if (!defaultProvider) return null

    return {
      provider: defaultProvider.type,
      apiKey: defaultProvider.apiKey,
      baseUrl: defaultProvider.baseUrl,
      model: localConfig.getDefaultModel()?.name || 'gpt-4',
      azureDeployment: defaultProvider.azureDeployment,
      azureApiVersion: defaultProvider.azureApiVersion,
      customHeaders: defaultProvider.customHeaders
    }
  }, [localConfig.config])
}

export default useUnifiedConfig
