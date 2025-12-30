/**
 * MCP Hooks - MCP 工具相关 Hooks
 * 使用 React Query 管理 MCP 服务器和工具
 * 
 * @updated 2025-12-29 - 添加严格类型定义 (修复 P1)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../services/api/ApiClientFacade'
import type { McpToolArgs } from '../types/api'
import Logger from '../utils/logger'

const logger = new Logger('useMCP')

/**
 * 查询键工厂
 */
const mcpKeys = {
  all: ['mcp'] as const,
  servers: () => [...mcpKeys.all, 'servers'] as const,
  activeServers: () => [...mcpKeys.all, 'servers', 'active'] as const,
  server: (serverId: string) => [...mcpKeys.all, 'server', serverId] as const,
  tools: (serverId: string) => [...mcpKeys.all, 'tools', serverId] as const,
  status: (serverId: string) => [...mcpKeys.all, 'status', serverId] as const
}

/**
 * 获取所有 MCP 服务器
 */
export function useMCPServers() {
  return useQuery({
    queryKey: mcpKeys.servers(),
    queryFn: () => apiClient.getMCPServers(),
    staleTime: 2 * 60 * 1000 // 2 分钟后视为过时
  })
}

/**
 * 获取激活的 MCP 服务器
 */
export function useActiveMCPServers() {
  return useQuery({
    queryKey: mcpKeys.activeServers(),
    queryFn: () => apiClient.getActiveMCPServers(),
    staleTime: 1 * 60 * 1000 // 1 分钟后视为过时
  })
}

/**
 * 获取单个 MCP 服务器详情
 */
export function useMCPServer(serverId: string, enabled = true) {
  return useQuery({
    queryKey: mcpKeys.server(serverId),
    queryFn: () => apiClient.getMCPServer(serverId),
    enabled: !!serverId && enabled,
    staleTime: 2 * 60 * 1000
  })
}

/**
 * 获取 MCP 服务器的工具列表
 */
export function useMCPServerTools(serverId: string, enabled = true) {
  return useQuery({
    queryKey: mcpKeys.tools(serverId),
    queryFn: () => apiClient.getMCPServerTools(serverId),
    enabled: !!serverId && enabled,
    staleTime: 5 * 60 * 1000 // 5 分钟后视为过时
  })
}

/**
 * 获取 MCP 服务器状态
 */
export function useMCPServerStatus(serverId: string, enabled = true) {
  return useQuery({
    queryKey: mcpKeys.status(serverId),
    queryFn: () => apiClient.getMCPServerStatus(serverId),
    enabled: !!serverId && enabled,
    staleTime: 10 * 1000, // 10 秒后视为过时
    refetchInterval: 30 * 1000 // 每 30 秒自动刷新
  })
}

/**
 * 调用 MCP 工具
 */
export function useCallMCPTool() {
  return useMutation({
    mutationFn: ({ serverId, toolName, params }: { serverId: string; toolName: string; params: McpToolArgs }) =>
      apiClient.callMCPTool(serverId, toolName, params),
    onError: (error) => {
      logger.error('Failed to call MCP tool', error)
    }
  })
}

/**
 * 激活 MCP 服务器
 */
export function useActivateMCPServer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (serverId: string) => apiClient.activateMCPServer(serverId),
    onSuccess: (_data, serverId) => {
      // 重新获取服务器列表和状态
      queryClient.invalidateQueries({ queryKey: mcpKeys.servers() })
      queryClient.invalidateQueries({ queryKey: mcpKeys.activeServers() })
      queryClient.invalidateQueries({ queryKey: mcpKeys.server(serverId) })
      queryClient.invalidateQueries({ queryKey: mcpKeys.status(serverId) })
    },
    onError: (error) => {
      logger.error('Failed to activate MCP server', error)
    }
  })
}

/**
 * 停用 MCP 服务器
 */
export function useDeactivateMCPServer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (serverId: string) => apiClient.deactivateMCPServer(serverId),
    onSuccess: (_data, serverId) => {
      // 重新获取服务器列表和状态
      queryClient.invalidateQueries({ queryKey: mcpKeys.servers() })
      queryClient.invalidateQueries({ queryKey: mcpKeys.activeServers() })
      queryClient.invalidateQueries({ queryKey: mcpKeys.server(serverId) })
      queryClient.invalidateQueries({ queryKey: mcpKeys.status(serverId) })
    },
    onError: (error) => {
      logger.error('Failed to deactivate MCP server', error)
    }
  })
}
