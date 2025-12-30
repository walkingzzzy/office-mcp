/**
 * MCP 服务器配置页面
 * 管理和监控 MCP 服务器
 */

import { useEffect, useState } from 'react'
import {
  Play,
  Square,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Terminal,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Wrench,
  ScrollText,
  Search,
  Plus,
  Edit3,
  Trash2,
  Save,
  X
} from 'lucide-react'
import { Card, Button, Input, Modal } from '../components'
import {
  getMcpServers,
  getMcpServerStatus,
  addMcpServer,
  updateMcpServer,
  deleteMcpServer,
  startMcpServer,
  stopMcpServer,
  restartMcpServer,
  getMcpServerTools,
  getLogs
} from '../services/tauri'
import type { McpServerConfig, McpServerStatus, McpTool, LogEntry } from '../types'

// 格式化运行时间
function formatUptime(seconds?: number): string {
  if (!seconds) return '-'
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hours}小时${mins}分`
}

// 格式化时间
function formatTime(timestamp?: number): string {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleTimeString()
}

// 工具分类
function categorizeTools(tools: McpTool[]): Map<string, McpTool[]> {
  const categories = new Map<string, McpTool[]>()
  
  tools.forEach(tool => {
    // 从工具名称提取类别
    let category = '其他'
    const name = tool.name.toLowerCase()
    
    if (name.includes('paragraph')) category = '段落操作'
    else if (name.includes('text')) category = '文本操作'
    else if (name.includes('format') || name.includes('font') || name.includes('bold') || name.includes('italic')) category = '格式化'
    else if (name.includes('style') || name.includes('heading') || name.includes('theme')) category = '样式操作'
    else if (name.includes('table') || name.includes('cell') || name.includes('row') || name.includes('column')) category = '表格操作'
    else if (name.includes('image') || name.includes('picture')) category = '图片操作'
    else if (name.includes('hyperlink') || name.includes('bookmark') || name.includes('footnote') || name.includes('citation')) category = '链接与引用'
    else if (name.includes('header') || name.includes('footer')) category = '页眉页脚'
    else if (name.includes('page') || name.includes('margin') || name.includes('orientation')) category = '页面设置'
    else if (name.includes('comment')) category = '批注操作'
    else if (name.includes('save') || name.includes('document') || name.includes('open') || name.includes('close')) category = '文档操作'
    else if (name.includes('chart')) category = '图表操作'
    else if (name.includes('shape') || name.includes('canvas')) category = '形状操作'
    else if (name.includes('worksheet') || name.includes('sheet')) category = '工作表操作'
    else if (name.includes('formula')) category = '公式操作'
    else if (name.includes('slide')) category = '幻灯片操作'
    else if (name.includes('animation')) category = '动画操作'
    else if (name.includes('education') || name.includes('exam') || name.includes('lesson')) category = '教育工具'
    else if (name.includes('health')) category = '系统工具'
    
    if (!categories.has(category)) {
      categories.set(category, [])
    }
    categories.get(category)!.push(tool)
  })
  
  return categories
}

// 默认的空MCP服务器配置
const emptyServerConfig: McpServerConfig = {
  id: '',
  name: '',
  command: '',
  args: [],
  cwd: '',
  env: {},
  enabled: true,
  autoStart: true
}

export default function McpConfig() {
  const [serverStatus, setServerStatus] = useState<McpServerStatus[]>([])
  const [serverConfigs, setServerConfigs] = useState<McpServerConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expandedServer, setExpandedServer] = useState<string | null>(null)
  const [serverTools, setServerTools] = useState<Map<string, McpTool[]>>(new Map())
  const [toolsLoading, setToolsLoading] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const [logFilter, setLogFilter] = useState('')
  const [toolSearch, setToolSearch] = useState('')
  
  // MCP 服务器管理状态
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingServer, setEditingServer] = useState<McpServerConfig>(emptyServerConfig)
  const [serverToDelete, setServerToDelete] = useState<McpServerConfig | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  // 环境变量编辑状态
  const [envKey, setEnvKey] = useState('')
  const [envValue, setEnvValue] = useState('')
  // 参数编辑状态
  const [newArg, setNewArg] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      // 加载服务器配置
      const configRes = await getMcpServers()
      if (configRes.success && configRes.data) {
        setServerConfigs(configRes.data)
      }
      // 加载服务器状态
      const statusRes = await getMcpServerStatus()
      if (statusRes.success && statusRes.data) {
        setServerStatus(statusRes.data)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async () => {
    try {
      const res = await getLogs(100)
      if (res.success && res.data) {
        setLogs(res.data)
      }
    } catch (error) {
      console.error('加载日志失败:', error)
    }
  }

  useEffect(() => {
    loadData()
    // 每 5 秒刷新状态
    const interval = setInterval(async () => {
      const res = await getMcpServerStatus()
      if (res.success && res.data) {
        setServerStatus(res.data)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // 加载日志
  useEffect(() => {
    if (showLogs) {
      loadLogs()
      const interval = setInterval(loadLogs, 3000)
      return () => clearInterval(interval)
    }
  }, [showLogs])

  const handleStart = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await startMcpServer(id)
      if (res.success) {
        setTimeout(loadData, 1000)
      } else {
        alert(res.error || '启动失败')
      }
    } catch (error) {
      console.error('启动服务器失败:', error)
      alert('启动失败')
    } finally {
      setActionLoading(null)
    }
  }

  const handleStop = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await stopMcpServer(id)
      if (res.success) {
        setTimeout(loadData, 1000)
      } else {
        alert(res.error || '停止失败')
      }
    } catch (error) {
      console.error('停止服务器失败:', error)
      alert('停止失败')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRestart = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await restartMcpServer(id)
      if (res.success) {
        setTimeout(loadData, 1000)
      } else {
        alert(res.error || '重启失败')
      }
    } catch (error) {
      console.error('重启服务器失败:', error)
      alert('重启失败')
    } finally {
      setActionLoading(null)
    }
  }

  const toggleServerExpand = async (id: string) => {
    if (expandedServer === id) {
      setExpandedServer(null)
    } else {
      setExpandedServer(id)
      // 加载工具列表
      if (!serverTools.has(id)) {
        setToolsLoading(id)
        try {
          const res = await getMcpServerTools(id)
          if (res.success && res.data) {
            setServerTools(new Map(serverTools.set(id, res.data)))
          }
        } catch (error) {
          console.error('加载工具列表失败:', error)
        } finally {
          setToolsLoading(null)
        }
      }
    }
  }

  const StatusIcon = ({ status }: { status?: string }) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'stopped':
        return <XCircle className="w-5 h-5 text-slate-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  }

  const StatusBadge = ({ status }: { status?: string }) => {
    const getStyles = () => {
      switch (status) {
        case 'running':
          return 'bg-green-500/10 text-green-500 border border-green-500/20'
        case 'error':
          return 'bg-red-500/10 text-red-500 border border-red-500/20'
        default:
          return 'bg-theme-surface text-theme-muted'
      }
    }
    const labels = {
      running: '运行中',
      stopped: '已停止',
      error: '错误',
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStyles()}`}>
        {labels[status as keyof typeof labels] || '未知'}
      </span>
    )
  }

  // ===== MCP 服务器管理函数 =====
  
  // 打开添加模态框
  const handleOpenAddModal = () => {
    setEditingServer({
      ...emptyServerConfig,
      id: `mcp_${Date.now()}`
    })
    setFormError(null)
    setEnvKey('')
    setEnvValue('')
    setNewArg('')
    setShowAddModal(true)
  }

  // 打开编辑模态框
  const handleOpenEditModal = (server: McpServerConfig) => {
    setEditingServer({ ...server })
    setFormError(null)
    setEnvKey('')
    setEnvValue('')
    setNewArg('')
    setShowEditModal(true)
  }

  // 打开删除确认
  const handleOpenDeleteConfirm = (server: McpServerConfig) => {
    setServerToDelete(server)
    setShowDeleteConfirm(true)
  }

  // 添加 MCP 服务器
  const handleAddServer = async () => {
    if (!editingServer.name.trim()) {
      setFormError('请输入服务器名称')
      return
    }
    if (!editingServer.command.trim()) {
      setFormError('请输入启动命令')
      return
    }

    setSaveLoading(true)
    setFormError(null)

    try {
      const res = await addMcpServer(editingServer)
      if (res.success) {
        setShowAddModal(false)
        await loadData()
      } else {
        setFormError(res.error || '添加失败')
      }
    } catch (error) {
      console.error('添加 MCP 服务器失败:', error)
      setFormError('添加失败')
    } finally {
      setSaveLoading(false)
    }
  }

  // 更新 MCP 服务器
  const handleUpdateServer = async () => {
    if (!editingServer.name.trim()) {
      setFormError('请输入服务器名称')
      return
    }
    if (!editingServer.command.trim()) {
      setFormError('请输入启动命令')
      return
    }

    setSaveLoading(true)
    setFormError(null)

    try {
      const res = await updateMcpServer(editingServer)
      if (res.success) {
        setShowEditModal(false)
        await loadData()
      } else {
        setFormError(res.error || '更新失败')
      }
    } catch (error) {
      console.error('更新 MCP 服务器失败:', error)
      setFormError('更新失败')
    } finally {
      setSaveLoading(false)
    }
  }

  // 删除 MCP 服务器
  const handleDeleteServer = async () => {
    if (!serverToDelete) return

    setSaveLoading(true)
    try {
      const res = await deleteMcpServer(serverToDelete.id)
      if (res.success) {
        setShowDeleteConfirm(false)
        setServerToDelete(null)
        await loadData()
      } else {
        alert(res.error || '删除失败')
      }
    } catch (error) {
      console.error('删除 MCP 服务器失败:', error)
      alert('删除失败')
    } finally {
      setSaveLoading(false)
    }
  }

  // 添加环境变量
  const handleAddEnv = () => {
    if (!envKey.trim()) return
    setEditingServer({
      ...editingServer,
      env: {
        ...(editingServer.env || {}),
        [envKey.trim()]: envValue
      }
    })
    setEnvKey('')
    setEnvValue('')
  }

  // 删除环境变量
  const handleRemoveEnv = (key: string) => {
    const newEnv = { ...(editingServer.env || {}) }
    delete newEnv[key]
    setEditingServer({
      ...editingServer,
      env: newEnv
    })
  }

  // 添加参数
  const handleAddArg = () => {
    if (!newArg.trim()) return
    setEditingServer({
      ...editingServer,
      args: [...(editingServer.args || []), newArg.trim()]
    })
    setNewArg('')
  }

  // 删除参数
  const handleRemoveArg = (index: number) => {
    const newArgs = [...(editingServer.args || [])]
    newArgs.splice(index, 1)
    setEditingServer({
      ...editingServer,
      args: newArgs
    })
  }

  // 根据 ID 获取服务器配置
  const getServerConfig = (id: string): McpServerConfig | undefined => {
    return serverConfigs.find(s => s.id === id)
  }

  const filteredLogs = logs.filter(log => {
    if (!logFilter) return true
    return log.message.toLowerCase().includes(logFilter.toLowerCase()) ||
           log.module.toLowerCase().includes(logFilter.toLowerCase())
  })

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold page-title">MCP 服务器配置</h1>
          <p className="page-subtitle mt-1">管理和监控 MCP 服务器进程</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="primary"
            onClick={handleOpenAddModal}
          >
            <Plus className="w-4 h-4 mr-2" />
            添加 MCP 服务器
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowLogs(!showLogs)}
          >
            <ScrollText className="w-4 h-4 mr-2" />
            {showLogs ? '隐藏日志' : '查看日志'}
          </Button>
          <Button variant="secondary" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 服务器列表 */}
      {loading && serverStatus.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : serverStatus.length === 0 ? (
        <Card className="text-center py-16">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, rgba(var(--color-primary), 0.2), rgba(168, 85, 247, 0.1))' }}>
              <Terminal className="w-10 h-10" style={{ color: 'rgb(168, 85, 247)' }} />
            </div>
            <h3 className="text-xl font-semibold text-theme mb-2">暂无 MCP 服务器</h3>
            <p className="text-theme-secondary text-center max-w-md mb-6">
              MCP 服务器提供 Office 文档操作工具，请确保桥接服务已启动并正确配置。
            </p>
            <Button variant="secondary" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新状态
            </Button>
            <div className="mt-8 p-4 rounded-xl max-w-md text-left" style={{ background: 'rgba(var(--color-surface), 0.5)' }}>
              <p className="text-sm font-medium text-theme-secondary mb-2 flex items-center">
                <Wrench className="w-4 h-4 mr-2" style={{ color: 'rgb(168, 85, 247)' }} />
                快速提示
              </p>
              <ul className="text-sm text-theme-muted space-y-1">
                <li>• 在仪表盘启动桥接服务</li>
                <li>• 确保 Word、Excel、PowerPoint MCP 服务器已配置</li>
                <li>• 服务器启动后会自动加载可用工具</li>
              </ul>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {serverStatus.map((status) => (
            <Card key={status.id} className="overflow-hidden">
              {/* 服务器头部 */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="mt-1">
                      <StatusIcon status={status.status} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold card-title">{status.name}</h3>
                        <StatusBadge status={status.status} />
                      </div>
                      
                      {/* 状态详情 */}
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {status.status === 'running' && (
                          <>
                            <div className="flex items-center text-theme-muted">
                              <Cpu className="w-4 h-4 mr-1.5" />
                              PID: {status.pid || '-'}
                            </div>
                            <div className="flex items-center text-theme-muted">
                              <Clock className="w-4 h-4 mr-1.5" />
                              运行: {formatUptime(status.uptime)}
                            </div>
                            <div className="flex items-center text-theme-muted">
                              <Wrench className="w-4 h-4 mr-1.5" />
                              工具: {status.toolCount ?? '加载中...'}
                            </div>
                            <div className="flex items-center text-theme-muted">
                              <Clock className="w-4 h-4 mr-1.5" />
                              最后活动: {formatTime(status.lastActivityTime)}
                            </div>
                          </>
                        )}
                        {status.status === 'error' && status.lastError && (
                          <div className="col-span-4 text-sm text-red-500">
                            错误: {status.lastError}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-1">
                    {status.status === 'running' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleServerExpand(status.id)}
                        title="查看工具"
                      >
                        {expandedServer === status.id ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    {status.status === 'running' ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestart(status.id)}
                          disabled={actionLoading === status.id}
                          title="重启"
                        >
                          {actionLoading === status.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStop(status.id)}
                          disabled={actionLoading === status.id}
                          title="停止"
                        >
                          <Square className="w-4 h-4 text-red-500" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStart(status.id)}
                        disabled={actionLoading === status.id}
                        title="启动"
                      >
                        {actionLoading === status.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 text-green-500" />
                        )}
                      </Button>
                    )}
                    {/* 编辑按钮 */}
                    {getServerConfig(status.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const config = getServerConfig(status.id)
                          if (config) handleOpenEditModal(config)
                        }}
                        title="编辑配置"
                      >
                        <Edit3 className="w-4 h-4 text-blue-500" />
                      </Button>
                    )}
                    {/* 删除按钮 */}
                    {getServerConfig(status.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const config = getServerConfig(status.id)
                          if (config) handleOpenDeleteConfirm(config)
                        }}
                        disabled={status.status === 'running'}
                        title={status.status === 'running' ? '请先停止服务器' : '删除'}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* 工具列表（展开时显示） */}
              {expandedServer === status.id && status.status === 'running' && (
                <div className="border-t p-4" style={{ borderColor: 'rgba(var(--color-border), 0.5)', backgroundColor: 'rgba(var(--color-surface), 0.3)' }}>
                  {toolsLoading === status.id ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'rgb(var(--color-primary))' }} />
                      <span className="ml-2 text-theme-muted">加载工具列表...</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-theme-secondary">
                          工具列表 ({serverTools.get(status.id)?.length || 0} 个)
                        </h4>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-muted" />
                          <Input
                            placeholder="搜索工具..."
                            value={toolSearch}
                            onChange={(e) => setToolSearch(e.target.value)}
                            className="pl-9 w-64"
                          />
                        </div>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto space-y-3">
                        {(() => {
                          const tools = serverTools.get(status.id) || []
                          const filteredTools = toolSearch 
                            ? tools.filter(t => 
                                t.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
                                t.description.toLowerCase().includes(toolSearch.toLowerCase())
                              )
                            : tools
                          const categories = categorizeTools(filteredTools)
                          
                          return Array.from(categories.entries()).map(([category, categoryTools]) => (
                            <div key={category} className="rounded-xl p-4" style={{ backgroundColor: 'rgba(var(--color-surface), 0.5)', border: '1px solid rgba(var(--color-border), 0.3)' }}>
                              <h5 className="font-medium text-theme-secondary mb-3 flex items-center">
                                <Wrench className="w-4 h-4 mr-2" style={{ color: 'rgb(var(--color-accent))' }} />
                                {category}
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(var(--color-primary), 0.1)', color: 'rgb(var(--color-primary))' }}>
                                  {categoryTools.length}
                                </span>
                              </h5>
                              <div className="space-y-2">
                                {categoryTools.map((tool) => (
                                  <div 
                                    key={tool.name}
                                    className="text-sm py-2 px-3 rounded-lg transition-colors"
                                    style={{ backgroundColor: 'rgba(var(--color-surface), 0.3)' }}
                                  >
                                    <div className="font-mono text-sm" style={{ color: 'rgb(var(--color-primary))' }}>
                                      {tool.name}
                                    </div>
                                    <div className="text-theme-muted text-xs mt-1 leading-relaxed">
                                      {tool.description}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* 批量操作 */}
      {serverStatus.length > 0 && (
        <Card title="批量操作">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={async () => {
                for (const status of serverStatus) {
                  if (status.status !== 'running') {
                    await startMcpServer(status.id)
                  }
                }
                setTimeout(loadData, 2000)
              }}
            >
              <Play className="w-4 h-4 mr-2" />
              全部启动
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                for (const status of serverStatus) {
                  if (status.status === 'running') {
                    await stopMcpServer(status.id)
                  }
                }
                setTimeout(loadData, 2000)
              }}
            >
              <Square className="w-4 h-4 mr-2" />
              全部停止
            </Button>
          </div>
        </Card>
      )}

      {/* 日志面板 */}
      {showLogs && (
        <Card title="系统日志">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-muted" />
                <Input
                  placeholder="过滤日志..."
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="ghost" size="sm" onClick={loadLogs}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="rounded-xl p-4 max-h-80 overflow-y-auto font-mono text-sm" style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}>
              {filteredLogs.length === 0 ? (
                <div className="text-gray-500 text-center py-4">暂无日志</div>
              ) : (
                filteredLogs.map((log, index) => (
                  <div key={index} className="py-1 flex flex-wrap">
                    <span className="text-gray-500 mr-2 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-gray-600 mr-2 shrink-0">
                      [{log.module}]
                    </span>
                    <span className={`mr-2 shrink-0 ${
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'warn' ? 'text-yellow-400' :
                      log.level === 'info' ? 'text-blue-400' :
                      'text-gray-400'
                    }`}>
                      [{log.level.toUpperCase()}]
                    </span>
                    <span className="text-gray-300 break-all">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      )}

      {/* MCP 服务器配置列表 */}
      <Card title="已配置的 MCP 服务器">
        <div className="space-y-3">
          {serverConfigs.length === 0 ? (
            <div className="text-center py-8 text-theme-muted">
              <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无已配置的 MCP 服务器</p>
              <p className="text-sm mt-1">点击上方"添加 MCP 服务器"按钮来添加</p>
            </div>
          ) : (
            serverConfigs.map((config) => {
              const status = serverStatus.find(s => s.id === config.id)
              return (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: 'rgba(var(--color-surface), 0.5)', border: '1px solid rgba(var(--color-border), 0.3)' }}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-theme">{config.name}</span>
                      {config.enabled ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">启用</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500">禁用</span>
                      )}
                      {config.autoStart && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">自动启动</span>
                      )}
                    </div>
                    <div className="text-xs text-theme-muted mt-1 font-mono">
                      {config.command} {(config.args || []).join(' ')}
                    </div>
                    {config.cwd && (
                      <div className="text-xs text-theme-muted">工作目录: {config.cwd}</div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditModal(config)}
                      title="编辑"
                    >
                      <Edit3 className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDeleteConfirm(config)}
                      disabled={status?.status === 'running'}
                      title={status?.status === 'running' ? '请先停止服务器' : '删除'}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      {/* 添加 MCP 服务器模态框 */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="添加 MCP 服务器"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleAddServer} disabled={saveLoading}>
              {saveLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              添加
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
              {formError}
            </div>
          )}
          
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">
                服务器名称 <span className="text-red-500">*</span>
              </label>
              <Input
                value={editingServer.name}
                onChange={(e) => setEditingServer({ ...editingServer, name: e.target.value })}
                placeholder="例如: Word MCP Server"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">
                启动命令 <span className="text-red-500">*</span>
              </label>
              <Input
                value={editingServer.command}
                onChange={(e) => setEditingServer({ ...editingServer, command: e.target.value })}
                placeholder="例如: node, npx, python"
              />
            </div>
          </div>

          {/* 工作目录 */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              工作目录
            </label>
            <Input
              value={editingServer.cwd || ''}
              onChange={(e) => setEditingServer({ ...editingServer, cwd: e.target.value })}
              placeholder="例如: /path/to/mcp-server"
            />
          </div>

          {/* 命令参数 */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              命令参数
            </label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={newArg}
                onChange={(e) => setNewArg(e.target.value)}
                placeholder="输入参数"
                onKeyDown={(e) => e.key === 'Enter' && handleAddArg()}
              />
              <Button variant="secondary" onClick={handleAddArg}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {(editingServer.args || []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(editingServer.args || []).map((arg, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded text-sm"
                    style={{ backgroundColor: 'rgba(var(--color-primary), 0.1)', color: 'rgb(var(--color-primary))' }}
                  >
                    {arg}
                    <button
                      onClick={() => handleRemoveArg(index)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 环境变量 */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              环境变量
            </label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={envKey}
                onChange={(e) => setEnvKey(e.target.value)}
                placeholder="变量名"
                className="flex-1"
              />
              <Input
                value={envValue}
                onChange={(e) => setEnvValue(e.target.value)}
                placeholder="变量值"
                className="flex-1"
              />
              <Button variant="secondary" onClick={handleAddEnv}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {Object.entries(editingServer.env || {}).length > 0 && (
              <div className="space-y-1">
                {Object.entries(editingServer.env || {}).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-2 py-1 rounded text-sm"
                    style={{ backgroundColor: 'rgba(var(--color-surface), 0.5)' }}
                  >
                    <span className="font-mono">
                      <span className="text-theme-secondary">{key}</span>
                      <span className="text-theme-muted">=</span>
                      <span className="text-theme">{value}</span>
                    </span>
                    <button
                      onClick={() => handleRemoveEnv(key)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 选项 */}
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingServer.enabled}
                onChange={(e) => setEditingServer({ ...editingServer, enabled: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-theme-secondary">启用服务器</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingServer.autoStart}
                onChange={(e) => setEditingServer({ ...editingServer, autoStart: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-theme-secondary">自动启动</span>
            </label>
          </div>
        </div>
      </Modal>

      {/* 编辑 MCP 服务器模态框 */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="编辑 MCP 服务器"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleUpdateServer} disabled={saveLoading}>
              {saveLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              保存
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
              {formError}
            </div>
          )}
          
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">
                服务器名称 <span className="text-red-500">*</span>
              </label>
              <Input
                value={editingServer.name}
                onChange={(e) => setEditingServer({ ...editingServer, name: e.target.value })}
                placeholder="例如: Word MCP Server"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">
                启动命令 <span className="text-red-500">*</span>
              </label>
              <Input
                value={editingServer.command}
                onChange={(e) => setEditingServer({ ...editingServer, command: e.target.value })}
                placeholder="例如: node, npx, python"
              />
            </div>
          </div>

          {/* 工作目录 */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              工作目录
            </label>
            <Input
              value={editingServer.cwd || ''}
              onChange={(e) => setEditingServer({ ...editingServer, cwd: e.target.value })}
              placeholder="例如: /path/to/mcp-server"
            />
          </div>

          {/* 命令参数 */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              命令参数
            </label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={newArg}
                onChange={(e) => setNewArg(e.target.value)}
                placeholder="输入参数"
                onKeyDown={(e) => e.key === 'Enter' && handleAddArg()}
              />
              <Button variant="secondary" onClick={handleAddArg}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {(editingServer.args || []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(editingServer.args || []).map((arg, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded text-sm"
                    style={{ backgroundColor: 'rgba(var(--color-primary), 0.1)', color: 'rgb(var(--color-primary))' }}
                  >
                    {arg}
                    <button
                      onClick={() => handleRemoveArg(index)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 环境变量 */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              环境变量
            </label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={envKey}
                onChange={(e) => setEnvKey(e.target.value)}
                placeholder="变量名"
                className="flex-1"
              />
              <Input
                value={envValue}
                onChange={(e) => setEnvValue(e.target.value)}
                placeholder="变量值"
                className="flex-1"
              />
              <Button variant="secondary" onClick={handleAddEnv}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {Object.entries(editingServer.env || {}).length > 0 && (
              <div className="space-y-1">
                {Object.entries(editingServer.env || {}).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-2 py-1 rounded text-sm"
                    style={{ backgroundColor: 'rgba(var(--color-surface), 0.5)' }}
                  >
                    <span className="font-mono">
                      <span className="text-theme-secondary">{key}</span>
                      <span className="text-theme-muted">=</span>
                      <span className="text-theme">{value}</span>
                    </span>
                    <button
                      onClick={() => handleRemoveEnv(key)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 选项 */}
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingServer.enabled}
                onChange={(e) => setEditingServer({ ...editingServer, enabled: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-theme-secondary">启用服务器</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingServer.autoStart}
                onChange={(e) => setEditingServer({ ...editingServer, autoStart: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-theme-secondary">自动启动</span>
            </label>
          </div>
        </div>
      </Modal>

      {/* 删除确认对话框 */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="确认删除"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteServer}
              disabled={saveLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {saveLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              删除
            </Button>
          </>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-theme mb-2">
            确定要删除 MCP 服务器 "<span className="font-semibold">{serverToDelete?.name}</span>" 吗？
          </p>
          <p className="text-sm text-theme-muted">
            此操作不可撤销，服务器配置将被永久删除。
          </p>
        </div>
      </Modal>
    </div>
  )
}
