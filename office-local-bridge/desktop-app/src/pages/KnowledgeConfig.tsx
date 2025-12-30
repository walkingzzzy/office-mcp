/**
 * 知识库配置页面
 * 配置外部知识库连接（如 Dify）
 */

import { useEffect, useState } from 'react'
import {
  Save,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Database,
  Link2,
  Search
} from 'lucide-react'
import { Card, Button, Input } from '../components'

interface ExternalKBConnection {
  id: string
  name: string
  provider: string
  apiEndpoint: string
  apiKey: string
  datasetId?: string
  enabled: boolean
  lastTested?: number
  status: 'unknown' | 'connected' | 'error'
  statusMessage?: string
}

interface DifyDataset {
  id: string
  name: string
  description?: string
  documentCount: number
  wordCount: number
}

interface KnowledgeSearchResult {
  content: string
  score: number
  documentName?: string
  connectionName?: string
}

const KB_PROVIDERS = [
  { value: 'dify', label: 'Dify', description: '开源 LLM 应用开发平台' },
  { value: 'custom', label: '自定义', description: '使用自定义 API 端点' }
]

const DEFAULT_CONNECTION: Omit<ExternalKBConnection, 'id'> = {
  name: '',
  provider: 'dify',
  apiEndpoint: 'https://api.dify.ai',
  apiKey: '',
  datasetId: '',
  enabled: true,
  status: 'unknown'
}

export default function KnowledgeConfig() {
  const [connections, setConnections] = useState<ExternalKBConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Omit<ExternalKBConnection, 'id'> | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [datasets, setDatasets] = useState<DifyDataset[]>([])
  const [loadingDatasets, setLoadingDatasets] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)

  // 搜索测试状态
  const [testQuery, setTestQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResult[]>([])
  const [searchError, setSearchError] = useState('')

  const loadConnections = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/knowledge/connections')
      const data = await response.json()
      if (data.success && data.data?.connections) {
        setConnections(data.data.connections)
      }
    } catch (error) {
      console.error('加载连接失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConnections()
  }, [])

  const handleAddNew = () => {
    setShowAddForm(true)
    setEditForm({ ...DEFAULT_CONNECTION })
    setDatasets([])
  }

  const handleEdit = (connection: ExternalKBConnection) => {
    setEditingId(connection.id)
    setEditForm({
      name: connection.name,
      provider: connection.provider,
      apiEndpoint: connection.apiEndpoint,
      apiKey: '',
      datasetId: connection.datasetId,
      enabled: connection.enabled,
      status: connection.status
    })
    setShowAddForm(false)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm(null)
    setShowAddForm(false)
    setDatasets([])
  }

  const handleSave = async () => {
    if (!editForm) return

    setSaving(true)
    try {
      const url = editingId
        ? `http://localhost:3001/api/knowledge/connections/${editingId}`
        : 'http://localhost:3001/api/knowledge/connections'

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      const data = await response.json()
      if (data.success) {
        await loadConnections()
        handleCancel()
      } else {
        alert(data.error?.message || '保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个连接吗？')) return

    try {
      const response = await fetch(`http://localhost:3001/api/knowledge/connections/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        await loadConnections()
      } else {
        alert(data.error?.message || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败')
    }
  }

  const handleTestConnection = async (id: string) => {
    setTestingId(id)
    try {
      const response = await fetch(`http://localhost:3001/api/knowledge/connections/${id}/test`, {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        alert(data.data.connected ? '连接成功！' : `连接失败: ${data.data.message}`)
        await loadConnections()
      } else {
        alert(data.error?.message || '测试失败')
      }
    } catch (error) {
      console.error('测试失败:', error)
      alert('测试失败')
    } finally {
      setTestingId(null)
    }
  }

  const loadDatasets = async (connectionId: string) => {
    setLoadingDatasets(true)
    try {
      const response = await fetch(`http://localhost:3001/api/knowledge/connections/${connectionId}/datasets`)
      const data = await response.json()
      if (data.success && data.data?.datasets) {
        setDatasets(data.data.datasets)
      }
    } catch (error) {
      console.error('加载数据集失败:', error)
    } finally {
      setLoadingDatasets(false)
    }
  }

  const handleSearch = async () => {
    if (!testQuery.trim()) {
      alert('请输入搜索查询')
      return
    }

    setSearching(true)
    setSearchError('')
    setSearchResults([])

    try {
      const response = await fetch('http://localhost:3001/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery })
      })
      const data = await response.json()

      if (data.success) {
        setSearchResults(data.data.results || [])
      } else {
        setSearchError(data.error?.message || '搜索失败')
      }
    } catch (error) {
      console.error('搜索失败:', error)
      setSearchError('搜索失败')
    } finally {
      setSearching(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const renderConnectionForm = () => {
    if (!editForm) return null

    return (
      <Card className="border-primary-200 bg-primary-50/30">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-800">
              {editingId ? '编辑连接' : '添加新连接'}
            </h3>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              取消
            </Button>
          </div>

          <Input
            label="连接名称"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="例如: 公司知识库"
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              服务提供商
            </label>
            <div className="grid grid-cols-2 gap-3">
              {KB_PROVIDERS.map((provider) => (
                <label
                  key={provider.value}
                  className="flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:bg-white"
                  style={{
                    borderColor: editForm.provider === provider.value ? '#3b82f6' : '#e2e8f0'
                  }}
                >
                  <input
                    type="radio"
                    name="provider"
                    value={provider.value}
                    checked={editForm.provider === provider.value}
                    onChange={(e) => setEditForm({ ...editForm, provider: e.target.value })}
                    className="mt-1 w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <div className="font-medium text-slate-700">{provider.label}</div>
                    <div className="text-xs text-slate-500">{provider.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Input
            label="API 端点"
            value={editForm.apiEndpoint}
            onChange={(e) => setEditForm({ ...editForm, apiEndpoint: e.target.value })}
            placeholder="https://api.dify.ai"
            required
          />

          <Input
            label="API Key"
            type="password"
            value={editForm.apiKey}
            onChange={(e) => setEditForm({ ...editForm, apiKey: e.target.value })}
            placeholder={editingId ? '留空保持不变' : '输入 API Key'}
            required={!editingId}
          />

          {editingId && datasets.length === 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadDatasets(editingId)}
              disabled={loadingDatasets}
            >
              {loadingDatasets ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Database className="w-4 h-4 mr-2" />
              )}
              加载数据集列表
            </Button>
          )}

          {datasets.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                选择数据集
              </label>
              <select
                value={editForm.datasetId || ''}
                onChange={(e) => setEditForm({ ...editForm, datasetId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">-- 选择数据集 --</option>
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.documentCount} 文档)
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="数据集 ID（手动输入）"
            value={editForm.datasetId || ''}
            onChange={(e) => setEditForm({ ...editForm, datasetId: e.target.value })}
            placeholder="直接输入数据集 ID"
          />

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={editForm.enabled}
              onChange={(e) => setEditForm({ ...editForm, enabled: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-slate-700">启用此连接</span>
          </label>

          <div className="flex space-x-2 pt-2">
            <Button onClick={handleSave} disabled={saving || !editForm.name}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              保存
            </Button>
            <Button variant="secondary" onClick={handleCancel}>
              取消
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold page-title">知识库配置</h1>
          <p className="page-subtitle mt-1">配置外部知识库连接（如 Dify）</p>
        </div>
        {!showAddForm && !editingId && (
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            添加连接
          </Button>
        )}
      </div>

      {/* 添加/编辑表单 */}
      {(showAddForm || editingId) && renderConnectionForm()}

      {/* 连接列表 */}
      {connections.length === 0 && !showAddForm ? (
        <Card className="text-center py-16">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, rgba(var(--color-primary), 0.2), rgba(var(--color-accent), 0.1))' }}>
              <Database className="w-10 h-10" style={{ color: 'rgb(var(--color-primary))' }} />
            </div>
            <h3 className="text-xl font-semibold text-theme mb-2">暂无知识库连接</h3>
            <p className="text-theme-secondary text-center max-w-md mb-6">
              添加外部知识库连接以增强 AI 的知识能力，支持 Dify 等知识库平台。
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              添加第一个连接
            </Button>
            <div className="mt-8 p-4 rounded-xl max-w-md text-left" style={{ background: 'rgba(var(--color-surface), 0.5)' }}>
              <p className="text-sm font-medium text-theme-secondary mb-2 flex items-center">
                <Link2 className="w-4 h-4 mr-2" style={{ color: 'rgb(var(--color-accent))' }} />
                快速提示
              </p>
              <ul className="text-sm text-theme-muted space-y-1">
                <li>• 支持 Dify 开源知识库平台</li>
                <li>• 可配置多个知识库数据集</li>
                <li>• API Key 将安全存储在本地</li>
              </ul>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => (
            <Card
              key={connection.id}
              className={editingId === connection.id ? 'hidden' : ''}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${connection.enabled ? 'bg-primary-100' : 'bg-slate-100'}`}>
                    <Database className={`w-6 h-6 ${connection.enabled ? 'text-primary-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-slate-800">{connection.name}</h3>
                      {connection.status === 'connected' && (
                        <span className="flex items-center text-xs text-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          已连接
                        </span>
                      )}
                      {connection.status === 'error' && (
                        <span className="flex items-center text-xs text-red-600">
                          <XCircle className="w-3 h-3 mr-1" />
                          连接失败
                        </span>
                      )}
                      {!connection.enabled && (
                        <span className="text-xs text-slate-500">(已禁用)</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      {KB_PROVIDERS.find(p => p.value === connection.provider)?.label || connection.provider}
                      {' • '}
                      {connection.apiEndpoint}
                    </div>
                    {connection.datasetId && (
                      <div className="text-xs text-slate-400 mt-1">
                        数据集: {connection.datasetId}
                      </div>
                    )}
                    {connection.statusMessage && (
                      <div className="text-xs text-slate-500 mt-1">
                        {connection.statusMessage}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTestConnection(connection.id)}
                    disabled={testingId === connection.id}
                  >
                    {testingId === connection.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(connection)}
                  >
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(connection.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 知识库搜索测试 */}
      {connections.some(c => c.enabled && c.datasetId) && (
        <Card title="搜索测试" description="测试知识库搜索功能">
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="输入搜索查询"
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                搜索
              </Button>
            </div>

            {searchError && (
              <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">{searchError}</div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>找到 {searchResults.length} 条结果</span>
                </div>
                {searchResults.map((result, index) => (
                  <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    {result.documentName && (
                      <div className="text-xs text-slate-500 mb-1">
                        来源: {result.connectionName} / {result.documentName}
                      </div>
                    )}
                    <p className="text-sm text-slate-700">{result.content}</p>
                    <div className="text-xs text-slate-500 mt-1">
                      相关度: {(result.score * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
