/**
 * MCP 服务器配置组件
 * 管理和监控 MCP 服务器连接状态
 */

import React, { useEffect, useState, useCallback } from 'react'
import { useConfigStore } from '../../store/configStore'
import { useLocalConfigStore } from '../../store/localConfigStore'
import type { McpServer } from '../../types/api'
import Logger from '../../utils/logger'

const logger = new Logger('McpServerConfig')

interface McpServerStatus {
  id: string
  name: string
  status: 'running' | 'stopped' | 'error' | 'unknown'
  error?: string
  tools?: string[]
}

export const McpServerConfig: React.FC = () => {
  const { getMcpServers, getMcpStatusSummary } = useConfigStore()
  const { config: localConfig, bridgeConnected, checkBridgeConnection } = useLocalConfigStore()

  const [serverStatuses, setServerStatuses] = useState<McpServerStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const mcpServers = getMcpServers()
  const statusSummary = getMcpStatusSummary()
  const bridgeUrl = localConfig?.bridgeUrl || 'http://localhost:3001'

  /**
   * 获取 MCP 服务器状态
   */
  const fetchServerStatuses = useCallback(async () => {
    if (!bridgeConnected) {
      setServerStatuses(mcpServers.map(s => ({
        id: s.id,
        name: s.name,
        status: 'unknown' as const
      })))
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${bridgeUrl}/api/mcp/servers`, {
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        const data = await response.json()
        setServerStatuses(data.servers || [])
      } else {
        setServerStatuses(mcpServers.map(s => ({
          id: s.id,
          name: s.name,
          status: 'unknown' as const
        })))
      }
    } catch {
      setServerStatuses(mcpServers.map(s => ({
        id: s.id,
        name: s.name,
        status: 'unknown' as const
      })))
    } finally {
      setLoading(false)
    }
  }, [bridgeConnected, bridgeUrl, mcpServers])

  useEffect(() => {
    fetchServerStatuses()
  }, [fetchServerStatuses])

  /**
   * 刷新状态
   */
  const handleRefresh = async () => {
    setRefreshing(true)
    await checkBridgeConnection()
    await fetchServerStatuses()
    setRefreshing(false)
  }

  /**
   * 重启 MCP 服务器
   */
  const handleRestart = async (serverId: string) => {
    try {
      const response = await fetch(`${bridgeUrl}/api/mcp/servers/${serverId}/restart`, {
        method: 'POST',
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        await fetchServerStatuses()
      }
    } catch (error) {
      logger.error('重启 MCP 服务器失败', { error, serverId })
    }
  }

  /**
   * 获取服务器工具列表
   */
  const handleViewTools = async (serverId: string) => {
    try {
      const response = await fetch(`${bridgeUrl}/api/mcp/servers/${serverId}/tools`, {
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        const data = await response.json()
        const toolNames = data.tools?.map((t: { name: string }) => t.name).join(', ') || '无工具'
        alert(`服务器工具:\n${toolNames}`)
      }
    } catch (error) {
      logger.error('获取工具列表失败', { error, serverId })
    }
  }

  /**
   * 获取状态样式
   */
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500'
      case 'stopped':
        return 'bg-gray-400'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-yellow-500'
    }
  }

  /**
   * 获取状态文本
   */
  const getStatusText = (status: string) => {
    switch (status) {
      case 'running':
        return '运行中'
      case 'stopped':
        return '已停止'
      case 'error':
        return '错误'
      default:
        return '未知'
    }
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 状态摘要 */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          <span>共 {statusSummary.totalServers} 个服务器</span>
          {statusSummary.enabledServers > 0 && (
            <span className="ml-2 text-green-600">
              {statusSummary.enabledServers} 个已启用
            </span>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          {refreshing ? '刷新中...' : '刷新状态'}
        </button>
      </div>

      {/* 桥接服务状态 */}
      <div className="p-3 bg-gray-50 rounded-md">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${bridgeConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            桥接服务: {bridgeConnected ? '已连接' : '未连接'}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {bridgeUrl}
        </div>
        {!bridgeConnected && (
          <p className="text-xs text-orange-600 mt-2">
            桥接服务未连接，MCP 服务器状态无法获取。请确保 office-local-bridge 服务正在运行。
          </p>
        )}
      </div>

      {/* 服务器列表 */}
      {mcpServers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>尚未配置任何 MCP 服务器</p>
          <p className="text-sm mt-1">MCP 服务器配置由 office-local-bridge 服务管理</p>
        </div>
      ) : (
        <div className="space-y-2">
          {mcpServers.map(server => {
            const serverStatus = serverStatuses.find(s => s.id === server.id)
            const status = serverStatus?.status || 'unknown'

            return (
              <div
                key={server.id}
                className="p-3 border rounded-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusStyle(status)}`} />
                    <div>
                      <div className="font-medium">{server.name}</div>
                      <div className="text-xs text-gray-500">
                        {getStatusText(status)}
                        {server.description && ` - ${server.description}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {bridgeConnected && (
                      <>
                        <button
                          onClick={() => handleViewTools(server.id)}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          查看工具
                        </button>
                        <button
                          onClick={() => handleRestart(server.id)}
                          className="text-xs text-orange-500 hover:underline"
                        >
                          重启
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {serverStatus?.error && (
                  <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
                    错误: {serverStatus.error}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 说明 */}
      <div className="text-sm text-gray-500 border-t pt-4">
        <p className="font-medium mb-2">关于 MCP 服务器</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>MCP (Model Context Protocol) 服务器提供文档操作能力</li>
          <li>服务器配置由 office-local-bridge 服务管理，此处仅显示状态</li>
          <li>需要桥接服务 (office-local-bridge) 来管理 MCP 进程</li>
          <li>支持 Word、Excel、PowerPoint 三种文档类型</li>
        </ul>
      </div>
    </div>
  )
}

export default McpServerConfig
