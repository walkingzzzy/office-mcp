/**
 * MCP API - MCP 服务器和工具管理接口
 * 
 * @updated 2025-12-29 - 添加严格类型定义 (修复 P1)
 */

import { apiClient } from '../client'
import type {
  McpServer,
  McpTool,
  McpToolArgs,
  McpToolResult,
  McpServerStatusDetail
} from '../../../types/api'

export const mcpApi = {
  /**
   * 获取所有 MCP 服务器
   */
  async getMCPServers(): Promise<McpServer[]> {
    const response = await apiClient.get<{ servers: McpServer[] }>('/api/mcp/servers')
    return response.servers
  },

  /**
   * 获取激活的 MCP 服务器
   */
  async getActiveMCPServers(): Promise<McpServer[]> {
    const response = await apiClient.get<{ servers: McpServer[] }>('/api/mcp/servers/active')
    return response.servers
  },

  /**
   * 获取指定 MCP 服务器详情
   */
  async getMCPServer(serverId: string): Promise<McpServer> {
    const response = await apiClient.get<{ server: McpServer }>(`/api/mcp/servers/${serverId}`)
    return response.server
  },

  /**
   * 获取 MCP 服务器的所有工具
   */
  async getMCPServerTools(serverId: string): Promise<McpTool[]> {
    const response = await apiClient.get<{ tools: McpTool[] }>(`/api/mcp/servers/${serverId}/tools`)
    return response.tools
  },

  /**
   * 调用 MCP 工具
   * 端点: POST /api/mcp/servers/:id/call
   */
  async callMCPTool(serverId: string, toolName: string, args: McpToolArgs): Promise<McpToolResult> {
    const response = await apiClient.post<{ result: McpToolResult }>(
      `/api/mcp/servers/${serverId}/call`,
      {
        toolName,
        args,
      }
    )
    return response.result
  },

  /**
   * 激活 MCP 服务器
   */
  async activateMCPServer(serverId: string): Promise<void> {
    await apiClient.post(`/api/mcp/servers/${serverId}/activate`)
  },

  /**
   * 停用 MCP 服务器
   */
  async deactivateMCPServer(serverId: string): Promise<void> {
    await apiClient.post(`/api/mcp/servers/${serverId}/deactivate`)
  },

  /**
   * 获取 MCP 服务器状态
   */
  async getMCPServerStatus(serverId: string): Promise<McpServerStatusDetail> {
    const response = await apiClient.get<{ status: McpServerStatusDetail }>(`/api/mcp/servers/${serverId}/status`)
    return response.status
  },
}
