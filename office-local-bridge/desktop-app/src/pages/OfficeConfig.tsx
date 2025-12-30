/**
 * Office 插件管理页面
 * 显示 Office 环境信息、插件管理和系统日志
 */

import { useEffect, useState, useCallback } from 'react'
import {
  FileText,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Download,
  Trash2,
  ScrollText,
  Monitor,
  Package,
  AlertCircle,
  FolderOpen
} from 'lucide-react'
import { Card, Button } from '../components'
import {
  getOfficeEnvironment,
  getOfficePlugins,
  installOfficePlugin,
  uninstallOfficePlugin,
  getSystemLogs,
  clearSystemLogs
} from '../services/tauri'
import type { OfficeEnvironment, OfficePlugin, LogEntry } from '../types'

export default function OfficeConfig() {
  const [environment, setEnvironment] = useState<OfficeEnvironment | null>(null)
  const [plugins, setPlugins] = useState<OfficePlugin[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState(false)
  const [uninstallingId, setUninstallingId] = useState<string | null>(null)
  const [logLevel, setLogLevel] = useState<string>('')
  const [logModule, setLogModule] = useState<string>('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [envRes, pluginsRes, logsRes] = await Promise.all([
        getOfficeEnvironment(),
        getOfficePlugins(),
        getSystemLogs(100, logLevel || undefined, logModule || undefined)
      ])
      if (envRes.success && envRes.data) setEnvironment(envRes.data)
      if (pluginsRes.success && pluginsRes.data) setPlugins(pluginsRes.data)
      if (logsRes.success && logsRes.data) setLogs(logsRes.data.logs || [])
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [logLevel, logModule])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleInstall = async () => {
    // 使用默认的 manifest 路径（office-plugin 项目）
    const manifestPath = '../office-plugin/manifest.xml'
    setInstalling(true)
    try {
      const res = await installOfficePlugin(manifestPath)
      if (res.success) {
        alert('插件安装成功！请重启 Office 应用以加载插件。')
        loadData()
      } else {
        alert(res.error || '安装失败')
      }
    } catch (error) {
      console.error('安装失败:', error)
      alert('安装失败')
    } finally {
      setInstalling(false)
    }
  }

  const handleUninstall = async (id: string) => {
    if (!confirm('确定要卸载此插件吗？')) return
    setUninstallingId(id)
    try {
      const res = await uninstallOfficePlugin(id)
      if (res.success) {
        alert('插件已卸载')
        loadData()
      } else {
        alert(res.error || '卸载失败')
      }
    } catch (error) {
      console.error('卸载失败:', error)
      alert('卸载失败')
    } finally {
      setUninstallingId(null)
    }
  }

  const handleClearLogs = async () => {
    if (!confirm('确定要清空日志吗？')) return
    try {
      await clearSystemLogs()
      setLogs([])
    } catch (error) {
      console.error('清空日志失败:', error)
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400 bg-red-500/10'
      case 'warn': return 'text-yellow-400 bg-yellow-500/10'
      case 'info': return 'text-blue-400 bg-blue-500/10'
      default: return 'text-gray-400 bg-gray-500/10'
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold page-title flex items-center">
            <FileText className="w-7 h-7 mr-3" style={{ color: 'rgb(var(--color-primary))' }} />
            Office 插件管理
          </h1>
          <p className="page-subtitle mt-1 ml-10">管理 Office 环境和插件</p>
        </div>
        <Button variant="secondary" onClick={loadData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* Office 环境信息 */}
      <Card title="Office 环境" description="检测到的 Office 安装信息" variant="glow">
        {loading && !environment ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
          </div>
        ) : environment?.detected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl glass-light">
                <div className="flex items-center text-sm text-theme-muted mb-1">
                  <Monitor className="w-4 h-4 mr-2" />
                  产品名称
                </div>
                <p className="font-medium text-theme">{environment.version || '未知'}</p>
              </div>
              <div className="p-4 rounded-xl glass-light">
                <div className="flex items-center text-sm text-theme-muted mb-1">
                  <Package className="w-4 h-4 mr-2" />
                  版本号
                </div>
                <p className="font-mono text-theme" style={{ color: 'rgb(var(--color-primary))' }}>
                  {environment.versionNumber || '未知'}
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl glass-light">
              <div className="flex items-center text-sm text-theme-muted mb-2">
                <FolderOpen className="w-4 h-4 mr-2" />
                安装路径
              </div>
              <p className="font-mono text-xs text-theme break-all">{environment.installPath || '未知'}</p>
            </div>
            <div>
              <p className="text-sm text-theme-muted mb-2">已安装应用</p>
              <div className="flex flex-wrap gap-2">
                {environment.apps.filter(app => app.installed).map(app => (
                  <span
                    key={app.name}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center"
                    style={{ backgroundColor: 'rgba(var(--color-primary), 0.1)', color: 'rgb(var(--color-primary))' }}
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    {app.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-theme-muted">
            <AlertCircle className="w-5 h-5 mr-2" />
            未检测到 Office 安装
          </div>
        )}
      </Card>

      {/* 插件管理 */}
      <Card title="插件管理" description="安装和管理 Office 插件">
        <div className="space-y-4">
          {/* 一键安装按钮 */}
          <div className="flex items-center justify-between p-4 rounded-xl glass-light border border-primary-500/20">
            <div>
              <p className="font-medium text-theme">Office AI 助手插件</p>
              <p className="text-sm text-theme-muted">为 Word、Excel、PowerPoint 添加 AI 功能</p>
            </div>
            <Button onClick={handleInstall} disabled={installing}>
              {installing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              一键安装
            </Button>
          </div>

          {/* 已安装插件列表 */}
          {plugins.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-theme-muted">已安装插件 ({plugins.length})</p>
              {plugins.map(plugin => (
                <div
                  key={plugin.id}
                  className="flex items-center justify-between p-4 rounded-xl glass-light"
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                      <span className="font-medium text-theme">{plugin.name}</span>
                      <span className="ml-2 text-xs text-theme-muted">v{plugin.version}</span>
                    </div>
                    {plugin.description && (
                      <p className="text-sm text-theme-muted mt-1 ml-6">{plugin.description}</p>
                    )}
                    <div className="flex items-center mt-1 ml-6 text-xs text-theme-muted">
                      <span>支持: {plugin.supportedApps?.join(', ') || '未知'}</span>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleUninstall(plugin.id)}
                    disabled={uninstallingId === plugin.id}
                  >
                    {uninstallingId === plugin.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-theme-muted">
              <XCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>暂无已安装的插件</p>
            </div>
          )}
        </div>
      </Card>

      {/* Office插件日志 */}
      <Card title="Office插件日志" description="查看服务运行日志">
        <div className="flex justify-end mb-3">
          <Button variant="ghost" size="sm" onClick={handleClearLogs}>
            <Trash2 className="w-4 h-4 mr-1" />
            清空
          </Button>
        </div>
        <div className="space-y-3">
          {/* 筛选器 */}
          <div className="flex gap-2">
            <select
              value={logLevel}
              onChange={(e) => setLogLevel(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm bg-theme-surface border border-theme text-theme"
            >
              <option value="">全部级别</option>
              <option value="error">Error</option>
              <option value="warn">Warn</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
            <input
              type="text"
              placeholder="按模块筛选..."
              value={logModule}
              onChange={(e) => setLogModule(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm bg-theme-surface border border-theme text-theme flex-1"
            />
          </div>

          {/* 日志列表 */}
          <div className="max-h-80 overflow-y-auto space-y-1 rounded-xl bg-dark-900/50 p-3">
            {logs.length > 0 ? (
              logs.map((log, idx) => (
                <div key={idx} className="flex items-start text-xs font-mono py-1 border-b border-white/5 last:border-0">
                  <span className="text-theme-muted w-20 flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-xs mr-2 ${getLevelColor(log.level)}`}>
                    {log.level.toUpperCase()}
                  </span>
                  <span className="text-purple-400 mr-2">[{log.module}]</span>
                  <span className="text-theme flex-1">{log.message}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center py-8 text-theme-muted">
                <ScrollText className="w-5 h-5 mr-2" />
                暂无日志
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
