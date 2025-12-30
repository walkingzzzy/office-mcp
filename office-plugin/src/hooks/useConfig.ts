/**
 * useConfig Hook
 * 提供配置管理的 React Hook 接口
 * 
 * @updated 2025-12-29 - 优化依赖比较，使用数值比较替代 JSON.stringify (修复 P10)
 */

import { useEffect, useMemo, useRef } from 'react'

import { aiService } from '../services/ai'
import { useConfigStore } from '../store/configStore'
import Logger from '../utils/logger'

const logger = new Logger('useConfig')

/**
 * 浅比较两个对象的数值属性
 * 比 JSON.stringify 更高效
 */
function useStableConfigKey(
  config: { 
    providers?: unknown[]; 
    models?: unknown[]; 
    assistants?: unknown[]; 
    knowledgeBases?: unknown[]; 
    mcpServers?: unknown[] 
  } | null, 
  lastSyncTime: number
): string {
  const prevKeyRef = useRef<string>('')
  
  // 计算当前 key（只使用数值，避免序列化）
  const currentKey = config ? [
    config.providers?.length ?? 0,
    config.models?.length ?? 0,
    config.assistants?.length ?? 0,
    config.knowledgeBases?.length ?? 0,
    config.mcpServers?.length ?? 0,
    lastSyncTime
  ].join('-') : 'null'
  
  // 只有 key 变化时才更新
  if (currentKey !== prevKeyRef.current) {
    prevKeyRef.current = currentKey
  }
  
  return prevKeyRef.current
}

/**
 * 配置管理 Hook
 *
 * @example
 * ```tsx
 * const { config, loading, error, syncConfig } = useConfig()
 *
 * // 强制刷新配置
 * await syncConfig(true)
 * ```
 */
export function useConfig() {
  const {
    config,
    loading,
    error,
    connected,
    lastSyncTime,
    syncConfig,
    clearError,
    getProviders,
    getModels,
    getAssistants,
    getEnabledProviders,
    getModelsByProvider,
    getKnowledgeBases,
    getEnabledKnowledgeBases,
    getMcpServers,
    getEnabledMcpServers,
    getFeatureFlags
  } = useConfigStore()

  // 组件挂载时自动加载配置
  useEffect(() => {
    if (!config && !loading) {
      syncConfig()
    }
  }, [config, loading, syncConfig])

  // 配置加载后更新 AIService
  useEffect(() => {
    logger.debug('useConfig useEffect triggered', {
      hasConfig: !!config,
      hasSettings: !!config?.settings,
      apiKey: config?.settings?.apiKey ? '***' + config.settings.apiKey.slice(-8) : 'undefined',
      apiHost: config?.settings?.apiHost
    })

    if (config?.settings) {
      const { apiKey, apiHost } = config.settings
      if (apiKey) {
        logger.debug('Updating AIService with API key from config')
        aiService.updateConfig({
          apiKey,
          baseUrl: apiHost || 'http://localhost:3001'
        })
      } else {
        logger.warn('Config loaded but apiKey is missing!')
      }
    }
    // 注意：config 为 undefined 是正常的加载状态，不需要警告
  }, [config])

  // 使用优化的 configKey（避免 JSON.stringify）
  const configKey = useStableConfigKey(config, lastSyncTime)

  const providers = useMemo(() => getProviders(), [configKey])
  const models = useMemo(() => getModels(), [configKey])
  const assistants = useMemo(() => getAssistants(), [configKey])
  const enabledProviders = useMemo(() => getEnabledProviders(), [configKey])
  const knowledgeBases = useMemo(() => getKnowledgeBases(), [configKey])
  const enabledKnowledgeBases = useMemo(() => getEnabledKnowledgeBases(), [configKey])
  const mcpServers = useMemo(() => getMcpServers(), [configKey])
  const enabledMcpServers = useMemo(() => getEnabledMcpServers(), [configKey])
  const featureFlags = useMemo(() => getFeatureFlags(), [configKey])

  return {
    // 状态
    config,
    loading,
    error,
    connected,
    lastSyncTime,

    // Actions
    syncConfig,
    clearError,
    reload: () => syncConfig(false),
    forceReload: () => syncConfig(true),

    // Getters
    providers,
    models,
    assistants,
    enabledProviders,
    knowledgeBases,
    enabledKnowledgeBases,
    mcpServers,
    enabledMcpServers,
    featureFlags,
    getModelsByProvider
  }
}

/**
 * 导出默认 Hook
 */
export default useConfig
