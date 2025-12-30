/**
 * API 服务
 */

import type {
  BridgeConfig,
  AIProviderConfig,
  ModelConfig,
  McpServerConfig,
  WebSearchConfig,
  HealthCheckResponse,
  McpServerStatus,
  ModelInfo,
  ValidateProviderRequest,
  ValidateProviderResponse,
  TestModelRequest,
  TestModelResponse,
} from '@/types'

const API_BASE = ''

/**
 * 发送 API 请求
 */
async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * 健康检查 API
 */
export const healthApi = {
  check: () => request<HealthCheckResponse>('/health'),
}

/**
 * 配置 API
 */
export const configApi = {
  /** 获取完整配置 */
  getConfig: () => request<BridgeConfig>('/api/config'),

  /** 保存完整配置 */
  saveConfig: (config: BridgeConfig) =>
    request<{ success: boolean }>('/api/config', {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  /** 重置配置 */
  resetConfig: () =>
    request<BridgeConfig>('/api/config/reset', {
      method: 'POST',
    }),
}

/**
 * AI 提供商 API
 */
export const providerApi = {
  /** 获取所有提供商 */
  getProviders: () => request<{ success: boolean; data: { providers: AIProviderConfig[] } }>('/api/config/providers'),

  /** 添加提供商 */
  addProvider: (provider: Omit<AIProviderConfig, 'id'>) =>
    request<{ success: boolean; data: AIProviderConfig }>('/api/config/providers', {
      method: 'POST',
      body: JSON.stringify(provider),
    }),

  /** 更新提供商 */
  updateProvider: (id: string, updates: Partial<AIProviderConfig>) =>
    request<{ success: boolean; data: AIProviderConfig }>(`/api/config/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  /** 删除提供商 */
  deleteProvider: (id: string) =>
    request<{ success: boolean }>(`/api/config/providers/${id}`, {
      method: 'DELETE',
    }),

  /** 验证供应商配置（不保存） */
  validateProvider: (config: ValidateProviderRequest) =>
    request<{ success: boolean; data: ValidateProviderResponse }>('/api/config/providers/validate', {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  /** 获取供应商可用模型列表 */
  getProviderModels: (providerId: string) =>
    request<{ success: boolean; data: { models: ModelInfo[] } }>(`/api/config/providers/${providerId}/models`),

  /** 测试特定模型（已保存的供应商） */
  testModel: (providerId: string, req: TestModelRequest) =>
    request<{ success: boolean; data: TestModelResponse }>(`/api/config/providers/${providerId}/test-model`, {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  /** 测试模型（无需保存供应商，使用临时配置） */
  testModelWithConfig: (config: ValidateProviderRequest & { modelId: string; testMessage?: string }) =>
    request<{ success: boolean; data: TestModelResponse }>('/api/config/providers/validate/test-model', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
}

/**
 * 模型 API
 */
export const modelApi = {
  /** 获取所有模型 */
  getModels: () => request<{ models: ModelConfig[] }>('/api/config/models'),

  /** 添加模型 */
  addModel: (model: Omit<ModelConfig, 'id'>) =>
    request<ModelConfig>('/api/config/models', {
      method: 'POST',
      body: JSON.stringify(model),
    }),

  /** 更新模型 */
  updateModel: (id: string, updates: Partial<ModelConfig>) =>
    request<ModelConfig>(`/api/config/models/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  /** 删除模型 */
  deleteModel: (id: string) =>
    request<{ success: boolean }>(`/api/config/models/${id}`, {
      method: 'DELETE',
    }),
}

/**
 * MCP 服务器 API
 */
export const mcpApi = {
  /** 获取所有 MCP 服务器状态 */
  getServers: () => request<{ servers: McpServerStatus[] }>('/api/mcp/servers'),

  /** 获取 MCP 服务器配置 */
  getServerConfigs: () => request<{ servers: McpServerConfig[] }>('/api/config/mcp'),

  /** 添加 MCP 服务器 */
  addServer: (server: Omit<McpServerConfig, 'id'>) =>
    request<McpServerConfig>('/api/config/mcp', {
      method: 'POST',
      body: JSON.stringify(server),
    }),

  /** 更新 MCP 服务器 */
  updateServer: (id: string, updates: Partial<McpServerConfig>) =>
    request<McpServerConfig>(`/api/config/mcp/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  /** 删除 MCP 服务器 */
  deleteServer: (id: string) =>
    request<{ success: boolean }>(`/api/config/mcp/${id}`, {
      method: 'DELETE',
    }),

  /** 启动 MCP 服务器 */
  startServer: (id: string) =>
    request<{ success: boolean }>(`/api/mcp/servers/${id}/start`, {
      method: 'POST',
    }),

  /** 停止 MCP 服务器 */
  stopServer: (id: string) =>
    request<{ success: boolean }>(`/api/mcp/servers/${id}/stop`, {
      method: 'POST',
    }),

  /** 重启 MCP 服务器 */
  restartServer: (id: string) =>
    request<{ success: boolean }>(`/api/mcp/servers/${id}/restart`, {
      method: 'POST',
    }),
}

/**
 * 联网搜索 API
 */
export const searchApi = {
  /** 获取联网搜索配置 */
  getConfig: () => request<WebSearchConfig>('/api/config/websearch'),

  /** 保存联网搜索配置 */
  saveConfig: (config: WebSearchConfig) =>
    request<{ success: boolean }>('/api/config/websearch', {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  /** 测试联网搜索 */
  test: (query: string) =>
    request<{ success: boolean; results?: unknown[] }>('/api/search/test', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
}
