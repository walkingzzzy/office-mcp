/**
 * 仪表盘页面 - AI 科技感设计
 * 显示服务状态概览和快速操作
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Bot,
  Server,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Square,
  Loader2,
  Zap,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { Card, Button } from '../components'
import { getBridgeStatus, getMcpServerStatus, getProviders, startBridgeService, stopBridgeService } from '../services/tauri'
import type { BridgeStatus, McpServerStatus, AIProviderConfig } from '../types'

export default function Dashboard() {
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null)
  const [mcpServers, setMcpServers] = useState<McpServerStatus[]>([])
  const [providers, setProviders] = useState<AIProviderConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [serviceLoading, setServiceLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [bridgeRes, mcpRes, providersRes] = await Promise.all([
        getBridgeStatus(),
        getMcpServerStatus(),
        getProviders()
      ])

      if (bridgeRes.success && bridgeRes.data) {
        setBridgeStatus(bridgeRes.data)
      }
      if (mcpRes.success && mcpRes.data) {
        setMcpServers(mcpRes.data)
      }
      if (providersRes.success && providersRes.data) {
        setProviders(providersRes.data)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleStartService = async () => {
    setServiceLoading(true)
    try {
      const res = await startBridgeService()
      if (res.success) {
        setTimeout(loadData, 2000)
      } else {
        alert(res.error || '启动服务失败')
      }
    } catch (error) {
      console.error('启动服务失败:', error)
      alert('启动服务失败')
    } finally {
      setServiceLoading(false)
    }
  }

  const handleStopService = async () => {
    setServiceLoading(true)
    try {
      const res = await stopBridgeService()
      if (res.success) {
        setTimeout(loadData, 1000)
      } else {
        alert(res.error || '停止服务失败')
      }
    } catch (error) {
      console.error('停止服务失败:', error)
      alert('停止服务失败')
    } finally {
      setServiceLoading(false)
    }
  }

  const runningMcpCount = mcpServers.filter((s) => s.status === 'running').length
  const enabledProviders = providers.filter((p) => p.enabled).length

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'stopped':
        return <XCircle className="w-5 h-5 text-dark-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-400" />
    }
  }

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold page-title flex items-center">
            <Sparkles className="w-8 h-8 mr-3" style={{ color: 'rgb(var(--color-primary))' }} />
            仪表盘
          </h1>
          <p className="page-subtitle mt-2 ml-11">服务状态概览与快速操作</p>
        </div>
        <Button
          variant="secondary"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新状态
        </Button>
      </div>

      {/* 状态卡片 - 响应式网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* 服务状态 */}
        <Card variant="glow" className="relative overflow-hidden flex flex-col min-h-[200px]">
          <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-gradient-to-br from-primary-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 opacity-70" />
          <div className="relative flex-1 flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium label-text flex items-center">
                  <Zap className="w-4 h-4 mr-1.5 text-primary-400" />
                  服务状态
                </p>
                <p className="text-3xl font-bold stat-value mt-3">
                  {bridgeStatus?.running ? '运行中' : '已停止'}
                </p>
                <p className="text-sm label-text mt-2 font-mono">
                  端口: <span className="text-primary-400">{bridgeStatus?.port || 3001}</span>
                </p>
              </div>
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  bridgeStatus?.running 
                    ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 shadow-lg shadow-green-500/20' 
                    : 'bg-dark-800/50'
                }`}
              >
                <Activity
                  className={`w-7 h-7 ${
                    bridgeStatus?.running ? 'text-green-400' : 'text-dark-500'
                  }`}
                />
              </div>
            </div>
            {/* 服务控制按钮 - 固定在底部 */}
            <div className="mt-auto pt-4">
              {bridgeStatus?.running ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleStopService}
                  disabled={serviceLoading}
                  className="w-full"
                >
                  {serviceLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Square className="w-4 h-4 mr-2" />
                  )}
                  停止服务
                </Button>
              ) : (
                <Button
                  variant="cyber"
                  size="sm"
                  onClick={handleStartService}
                  disabled={serviceLoading}
                  className="w-full"
                >
                  {serviceLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  启动服务
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* AI 提供商 */}
        <Card variant="glow" className="relative overflow-hidden flex flex-col min-h-[200px]">
          <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-gradient-to-br from-cyber-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 opacity-70" />
          <div className="relative flex-1 flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium label-text flex items-center">
                  <Bot className="w-4 h-4 mr-1.5 text-cyber-400" />
                  AI 提供商
                </p>
                <p className="text-3xl font-bold stat-value mt-3">
                  <span className="text-cyber-400">{enabledProviders}</span>
                  <span className="text-dark-500 text-xl mx-1">/</span>
                  <span className="text-dark-400 text-xl">{providers.length}</span>
                </p>
                <p className="text-sm label-text mt-2">已启用</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyber-500/20 to-cyber-600/10 flex items-center justify-center shadow-lg shadow-cyber-500/20">
                <Bot className="w-7 h-7 text-cyber-400" />
              </div>
            </div>
            <Link to="/ai-config" className="block mt-auto pt-4">
              <Button variant="ghost" size="sm" className="w-full justify-between group">
                <span>配置 AI 服务</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* MCP 服务器 */}
        <Card variant="glow" className="relative overflow-hidden flex flex-col min-h-[200px] sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 opacity-70" />
          <div className="relative flex-1 flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium label-text flex items-center">
                  <Server className="w-4 h-4 mr-1.5 text-purple-400" />
                  MCP 服务器
                </p>
                <p className="text-3xl font-bold stat-value mt-3">
                  <span className="text-purple-400">{runningMcpCount}</span>
                  <span className="text-dark-500 text-xl mx-1">/</span>
                  <span className="text-dark-400 text-xl">{mcpServers.length}</span>
                </p>
                <p className="text-sm label-text mt-2">运行中</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Server className="w-7 h-7 text-purple-400" />
              </div>
            </div>
            <Link to="/mcp-config" className="block mt-auto pt-4">
              <Button variant="ghost" size="sm" className="w-full justify-between group">
                <span>管理 MCP 服务器</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* MCP 服务器状态 */}
      {mcpServers.length > 0 && (
        <Card title="MCP 服务器状态" variant="default">
          <div className="space-y-3">
            {mcpServers.map((server) => (
              <div
                key={server.id}
                className="flex items-center justify-between p-4 rounded-xl glass-light border border-primary-500/10 hover:border-primary-500/20 transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${
                    server.status === 'running' 
                      ? 'bg-green-500/10' 
                      : server.status === 'error' 
                        ? 'bg-red-500/10' 
                        : 'bg-dark-800/50'
                  }`}>
                    <StatusIcon status={server.status} />
                  </div>
                  <div>
                    <p className="font-medium card-title">{server.name}</p>
                    <p className="text-sm text-dark-400">
                      {server.status === 'running'
                        ? <span className="font-mono">PID: <span className="text-primary-400">{server.pid}</span></span>
                        : server.lastError || '已停止'}
                    </p>
                  </div>
                </div>
                {server.toolCount !== undefined && (
                  <span className="text-sm px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
                    {server.toolCount} 个工具
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 快速操作 - 当没有 MCP 服务器时显示 */}
      {mcpServers.length === 0 && (
        <Card title="快速开始" description="配置您的 AI 服务和工具" variant="default">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/ai-config" className="block">
              <div className="p-6 rounded-xl glass-light border border-primary-500/10 hover:border-primary-500/30 transition-all duration-300 group cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-cyber-500/20 to-cyber-600/10">
                    <Bot className="w-6 h-6 text-cyber-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium card-title group-hover:text-cyber-400 transition-colors">配置 AI 服务</h4>
                    <p className="text-sm card-text mt-1">添加和管理 AI 提供商</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-dark-500 group-hover:text-cyber-400 transition-all group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
            <Link to="/mcp-config" className="block">
              <div className="p-6 rounded-xl glass-light border border-primary-500/10 hover:border-purple-500/30 transition-all duration-300 group cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10">
                    <Server className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium card-title group-hover:text-purple-400 transition-colors">管理 MCP 服务器</h4>
                    <p className="text-sm card-text mt-1">配置和启动 MCP 工具</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-dark-500 group-hover:text-purple-400 transition-all group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
