/**
 * Config API - 配置相关接口
 * 用于与 office-local-bridge 服务交互
 * 
 * 从 bridge 获取完整配置，包括：
 * - AI 提供商 (providers)
 * - 模型配置 (models)
 * - MCP 服务器 (mcpServers)
 * - 知识库连接 (knowledgeBases)
 * - 联网搜索配置 (webSearch)
 */

import type { OfficePluginConfigResponse, Provider, Model, KnowledgeBase, McpServer } from '../../../types/api'
import { apiClient } from '../client'

interface BridgeProvider {
  id: string
  name: string
  type: string
  apiKey?: string
  baseUrl?: string
  enabled: boolean
  isDefault?: boolean
  connectionStatus?: string
  selectedModels?: Array<{
    id: string
    name: string
    displayName?: string
    modelType?: string
    contextWindow?: number
    supportsVision?: boolean
    supportsTools?: boolean
  }>
}

interface BridgeModel {
  id: string
  name: string
  displayName?: string
  providerId: string
  enabled: boolean
  isDefault?: boolean
  maxTokens?: number
  contextWindow?: number
  supportsVision?: boolean
  supportsTools?: boolean
}

interface BridgeKnowledgeConnection {
  id: string
  name: string
  provider: string
  apiEndpoint: string
  datasetId?: string
  enabled: boolean
  status?: string
}

interface BridgeWebSearchConfig {
  enabled: boolean
  provider: string
  maxResults?: number
  searchDepth?: string
}

interface BridgeMcpServer {
  id: string
  name: string
  status?: string
  enabled?: boolean
  toolCount?: number
}

/**
 * 健康检查响应类型
 */
interface HealthCheckResponse {
  status: string
  timestamp: number
  version?: string
  mcpServers?: BridgeMcpServer[]
}

/**
 * API 响应数据类型（apiClient 会自动解包 data 字段）
 */
interface ProvidersResponse {
  providers: BridgeProvider[]
}

interface ModelsResponse {
  models: BridgeModel[] | Record<string, never>
}

interface McpServersResponse {
  servers?: BridgeMcpServer[]
}

interface KnowledgeConnectionsResponse {
  connections: BridgeKnowledgeConnection[]
}

export const configApi = {
  /**
   * 获取插件配置
   * 从 office-local-bridge 获取完整配置信息
   * 
   * 注意：apiClient 会自动解包 { success: true, data: {...} } 格式的响应，
   * 所以这里直接获取 data 的内容
   */
  async getConfig(): Promise<OfficePluginConfigResponse> {
    // 并行获取所有配置
    const [
      healthData,
      bridgeConfig,
      providersData,
      modelsData,
      mcpServersData,
      knowledgeData,
      webSearchData
    ] = await Promise.all([
      // 健康检查
      apiClient.get<HealthCheckResponse>('/health')
        .catch((): HealthCheckResponse => ({ status: 'unknown', timestamp: Date.now() })),
      
      // 基础配置 - apiClient 自动解包，返回 config 对象
      apiClient.get<Record<string, unknown>>('/api/config')
        .catch((): Record<string, unknown> => ({})),
      
      // AI 提供商 - apiClient 自动解包，返回 { providers: [...] }
      apiClient.get<ProvidersResponse>('/api/config/providers')
        .then(res => res?.providers || [])
        .catch((): BridgeProvider[] => []),
      
      // 模型配置 - apiClient 自动解包，返回 { models: [...] 或 {} }
      apiClient.get<ModelsResponse>('/api/config/models')
        .then(res => {
          const models = res?.models
          // 处理空对象的情况
          return Array.isArray(models) ? models : []
        })
        .catch((): BridgeModel[] => []),
      
      // MCP 服务器 - 可能返回数组或 { servers: [...] }
      apiClient.get<McpServersResponse | BridgeMcpServer[]>('/api/mcp/servers')
        .then(res => {
          if (Array.isArray(res)) return res
          if (res?.servers) return res.servers
          return []
        })
        .catch((): BridgeMcpServer[] => []),
      
      // 知识库连接 - apiClient 自动解包，返回 { connections: [...] }
      apiClient.get<KnowledgeConnectionsResponse>('/api/knowledge/connections')
        .then(res => res?.connections || [])
        .catch((): BridgeKnowledgeConnection[] => []),
      
      // 联网搜索配置 - apiClient 自动解包
      apiClient.get<BridgeWebSearchConfig>('/api/config/websearch')
        .catch((): BridgeWebSearchConfig | null => null)
    ])

    // 转换 providers 格式
    const providers: Provider[] = providersData.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      apiKey: p.apiKey,
      baseUrl: p.baseUrl,
      enabled: p.enabled
    }))

    // 转换 models 格式
    // 优先使用独立的 models 配置，如果没有则从 providers 的 selectedModels 中提取
    let models: Model[] = modelsData.map(m => ({
      id: m.id,
      name: m.name,
      displayName: m.displayName,
      providerId: m.providerId,
      contextWindow: m.contextWindow,
      maxTokens: m.maxTokens,
      supportVision: m.supportsVision,
      supportFunctionCall: m.supportsTools
    }))

    // 如果没有独立的 models 配置，从 providers 的 selectedModels 中提取
    if (models.length === 0) {
      providersData.forEach(provider => {
        if (provider.selectedModels) {
          provider.selectedModels.forEach(m => {
            models.push({
              // 模型 ID 直接使用原始 ID，不要包含 providerId
              // App.tsx 会在选择时组合成 providerId:modelId 格式
              id: m.id,
              name: m.name,
              displayName: m.displayName || m.name,
              providerId: provider.id,
              contextWindow: m.contextWindow,
              supportVision: m.supportsVision,
              supportFunctionCall: m.supportsTools
            })
          })
        }
      })
    }

    // 转换 MCP 服务器格式
    const mcpServersList = mcpServersData.length > 0 
      ? mcpServersData 
      : (healthData.mcpServers || [])
    const mcpServers: McpServer[] = mcpServersList.map((s: BridgeMcpServer) => ({
      id: s.id,
      name: s.name,
      enabled: s.enabled ?? s.status === 'running',
      description: s.toolCount ? `${s.toolCount} 个工具` : undefined
    }))

    // 转换知识库格式
    const knowledgeBases: KnowledgeBase[] = knowledgeData.map(kb => ({
      id: kb.id,
      name: kb.name,
      description: kb.datasetId ? `数据集: ${kb.datasetId}` : undefined,
      enabled: kb.enabled
    }))

    // 构造配置响应
    const config = bridgeConfig as Record<string, unknown>
    return {
      providers,
      models,
      assistants: [],
      knowledgeBases,
      mcpServers,
      mcpTools: [], // 已废弃
      settings: {
        apiKey: (config.apiToken as string) || '',
        apiHost: config.host && config.port 
          ? `http://${config.host}:${config.port}` 
          : 'http://localhost:3001',
        version: healthData.version || '1.0.0',
        enableWebSearch: webSearchData?.enabled ?? false,
        streamOutput: true
      },
      featureFlags: {
        officeBinaryDocEnabled: false,
        officeLegacyPromptEnabled: true
      },
      syncInfo: {
        version: '1.0.0',
        timestamp: String(healthData.timestamp || Date.now())
      }
    }
  },

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return apiClient.get('/health')
  },
}
