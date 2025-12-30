/**
 * Tauri API 服务
 * 封装与 Rust 后端的 IPC 通信
 */

import { invoke } from '@tauri-apps/api/core'
import type {
  AIProviderConfig,
  ModelConfig,
  McpServerConfig,
  McpServerStatus,
  McpTool,
  BridgeConfig,
  BridgeStatus,
  ApiResponse,
  LogEntry,
  ModelInfo,
  ValidateProviderRequest,
  ValidateProviderResponse,
  TestModelRequest,
  TestModelResponse,
  OfficeEnvironment,
  OfficePlugin
} from '../types'

// ===== 配置管理 =====

export async function getConfig(): Promise<ApiResponse<BridgeConfig>> {
  return invoke('get_config')
}

export async function saveConfig(config: BridgeConfig): Promise<ApiResponse<BridgeConfig>> {
  return invoke('save_config', { config })
}

export async function updateConfig(config: Partial<BridgeConfig>): Promise<ApiResponse<BridgeConfig>> {
  return invoke('update_config', { config })
}

// ===== AI 提供商 =====

export async function getProviders(): Promise<ApiResponse<AIProviderConfig[]>> {
  return invoke('get_providers')
}

export async function addProvider(provider: AIProviderConfig): Promise<ApiResponse<AIProviderConfig>> {
  return invoke('add_provider', { provider })
}

export async function updateProvider(provider: AIProviderConfig): Promise<ApiResponse<AIProviderConfig>> {
  return invoke('update_provider', { provider })
}

export async function deleteProvider(id: string): Promise<ApiResponse<boolean>> {
  return invoke('delete_provider', { id })
}

export async function testProviderConnection(provider: AIProviderConfig): Promise<ApiResponse<boolean>> {
  return invoke('test_provider_connection', { provider })
}

// ===== 模型管理 =====

export async function getModels(): Promise<ApiResponse<ModelConfig[]>> {
  return invoke('get_models')
}

export async function addModel(model: ModelConfig): Promise<ApiResponse<ModelConfig>> {
  return invoke('add_model', { model })
}

export async function updateModel(model: ModelConfig): Promise<ApiResponse<ModelConfig>> {
  return invoke('update_model', { model })
}

export async function deleteModel(id: string): Promise<ApiResponse<boolean>> {
  return invoke('delete_model', { id })
}

// ===== MCP 服务器 =====

export async function getMcpServers(): Promise<ApiResponse<McpServerConfig[]>> {
  return invoke('get_mcp_servers')
}

export async function addMcpServer(server: McpServerConfig): Promise<ApiResponse<McpServerConfig>> {
  return invoke('add_mcp_server', { server })
}

export async function updateMcpServer(server: McpServerConfig): Promise<ApiResponse<McpServerConfig>> {
  return invoke('update_mcp_server', { server })
}

export async function deleteMcpServer(id: string): Promise<ApiResponse<boolean>> {
  return invoke('delete_mcp_server', { id })
}

export async function getMcpServerStatus(): Promise<ApiResponse<McpServerStatus[]>> {
  return invoke('get_mcp_server_status')
}

export async function startMcpServer(id: string): Promise<ApiResponse<boolean>> {
  return invoke('start_mcp_server', { id })
}

export async function stopMcpServer(id: string): Promise<ApiResponse<boolean>> {
  return invoke('stop_mcp_server', { id })
}

export async function restartMcpServer(id: string): Promise<ApiResponse<boolean>> {
  return invoke('restart_mcp_server', { id })
}

export async function getMcpServerTools(id: string): Promise<ApiResponse<McpTool[]>> {
  return invoke('get_mcp_server_tools', { id })
}

// ===== 日志 =====

export async function getLogs(limit?: number, level?: string): Promise<ApiResponse<LogEntry[]>> {
  return invoke('get_logs', { limit, level })
}

// ===== 桥接服务 =====

export async function getBridgeStatus(): Promise<ApiResponse<BridgeStatus>> {
  return invoke('get_bridge_status')
}

export async function startBridgeService(): Promise<ApiResponse<boolean>> {
  return invoke('start_bridge_service')
}

export async function stopBridgeService(): Promise<ApiResponse<boolean>> {
  return invoke('stop_bridge_service')
}

// ===== 开机自启 =====

export async function enableAutostart(): Promise<void> {
  return invoke('enable_autostart')
}

export async function disableAutostart(): Promise<void> {
  return invoke('disable_autostart')
}

export async function isAutostartEnabled(): Promise<boolean> {
  return invoke('is_autostart_enabled')
}

// ===== 供应商验证和模型管理 =====

export async function validateProvider(config: ValidateProviderRequest): Promise<ApiResponse<ValidateProviderResponse>> {
  return invoke('validate_provider', { config })
}

export async function getProviderModels(providerId: string): Promise<ApiResponse<{ models: ModelInfo[] }>> {
  return invoke('get_provider_models', { providerId })
}

export async function testModel(providerId: string, request: TestModelRequest): Promise<ApiResponse<TestModelResponse>> {
  return invoke('test_model', { providerId, request })
}

// ===== Office 环境和插件管理 =====

const API_BASE = 'http://localhost:3001/api'

export async function getOfficeEnvironment(): Promise<ApiResponse<OfficeEnvironment>> {
  const res = await fetch(`${API_BASE}/office/environment`)
  return res.json()
}

export async function getOfficePlugins(): Promise<ApiResponse<OfficePlugin[]>> {
  const res = await fetch(`${API_BASE}/office/plugins`)
  const data = await res.json()
  return { success: data.success, data: data.data, error: data.error }
}

export async function installOfficePlugin(manifestPath: string): Promise<ApiResponse<OfficePlugin>> {
  const res = await fetch(`${API_BASE}/office/plugins/install`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ manifestPath })
  })
  return res.json()
}

export async function uninstallOfficePlugin(id: string): Promise<ApiResponse<boolean>> {
  const res = await fetch(`${API_BASE}/office/plugins/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
  return res.json()
}

export async function getSystemLogs(limit?: number, level?: string, module?: string): Promise<ApiResponse<{ logs: LogEntry[], total: number }>> {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  if (level) params.set('level', level)
  if (module) params.set('module', module)
  const res = await fetch(`${API_BASE}/logs?${params}`)
  return res.json()
}

export async function clearSystemLogs(module?: string): Promise<ApiResponse<{ message: string }>> {
  const params = module ? `?module=${encodeURIComponent(module)}` : ''
  const res = await fetch(`${API_BASE}/logs${params}`, { method: 'DELETE' })
  return res.json()
}
