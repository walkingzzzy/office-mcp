/**
 * AI 服务配置页面 - AI 科技感设计
 * 管理多个 AI 提供商的配置
 */

import { useEffect, useState } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Star,
  Eye,
  EyeOff,
  Bot,
  Sparkles,
  RefreshCw,
  Zap
} from 'lucide-react'
import { Card, Button, Input, Select, Modal } from '../components'
import {
  getProviders,
  addProvider,
  updateProvider,
  deleteProvider,
  testProviderConnection,
  validateProvider,
  getProviderModels,
  testModel
} from '../services/tauri'
import type { AIProviderConfig, AIProviderType, ModelInfo, ValidateProviderResponse, TestModelResponse, SelectedModel, ModelType } from '../types'

const PROVIDER_TYPES = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'ollama', label: 'Ollama' },
  { value: 'custom', label: '自定义' },
]

const DEFAULT_BASE_URLS: Record<AIProviderType, string> = {
  openai: 'https://api.openai.com/v1',
  azure: '',
  anthropic: 'https://api.anthropic.com',
  ollama: 'http://localhost:11434',
  custom: '',
}

function generateId(): string {
  return `provider_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

export default function AIConfig() {
  const [providers, setProviders] = useState<AIProviderConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<AIProviderConfig | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)

  // 表单状态
  const [formData, setFormData] = useState<Partial<AIProviderConfig>>({
    type: 'openai',
    name: '',
    apiKey: '',
    baseUrl: '',
    enabled: true,
    isDefault: false,
  })

  // 验证和模型状态
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidateProviderResponse | null>(null)
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [selectedModels, setSelectedModels] = useState<Map<string, SelectedModel>>(new Map())
  const [testingModelId, setTestingModelId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Map<string, TestModelResponse>>(new Map())

  const loadProviders = async () => {
    setLoading(true)
    try {
      const res = await getProviders()
      if (res.success && res.data) {
        setProviders(res.data)
      }
    } catch (error) {
      console.error('加载提供商失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProviders()
  }, [])

  const openAddModal = () => {
    setEditingProvider(null)
    setFormData({
      type: 'openai',
      name: '',
      apiKey: '',
      baseUrl: DEFAULT_BASE_URLS.openai,
      enabled: true,
      isDefault: providers.length === 0,
    })
    setShowApiKey(false)
    setValidationResult(null)
    setAvailableModels([])
    setSelectedModels(new Map())
    setTestResults(new Map())
    setModalOpen(true)
  }

  const openEditModal = (provider: AIProviderConfig) => {
    setEditingProvider(provider)
    setFormData({
      type: provider.type,
      name: provider.name,
      apiKey: provider.apiKey,
      baseUrl: provider.baseUrl,
      azureEndpoint: provider.azureEndpoint,
      azureDeployment: provider.azureDeployment,
      azureApiVersion: provider.azureApiVersion,
      enabled: provider.enabled,
      isDefault: provider.isDefault,
    })
    setShowApiKey(false)
    setValidationResult(null)
    setAvailableModels([])
    // 恢复已保存的选中模型
    const savedModels = new Map<string, SelectedModel>()
    if (provider.selectedModels) {
      provider.selectedModels.forEach(m => savedModels.set(m.id, m))
    }
    setSelectedModels(savedModels)
    setTestResults(new Map())
    setModalOpen(true)
    // 加载已保存供应商的模型列表
    loadModelsForProvider(provider.id)
  }

  const loadModelsForProvider = async (providerId: string) => {
    setIsLoadingModels(true)
    try {
      const res = await getProviderModels(providerId)
      if (res.success && res.data) {
        setAvailableModels(res.data.models)
      }
    } catch (error) {
      console.error('加载模型列表失败:', error)
    } finally {
      setIsLoadingModels(false)
    }
  }

  const handleValidate = async () => {
    if (!formData.apiKey) {
      alert('请先填写 API Key')
      return
    }
    setIsValidating(true)
    setValidationResult(null)
    try {
      const res = await validateProvider({
        type: formData.type as AIProviderType,
        apiKey: formData.apiKey,
        baseUrl: formData.baseUrl,
        azureEndpoint: formData.azureEndpoint,
        azureDeployment: formData.azureDeployment,
        azureApiVersion: formData.azureApiVersion,
      })
      if (res.success && res.data) {
        setValidationResult(res.data)
        if (res.data.valid && res.data.models) {
          setAvailableModels(res.data.models)
        }
      } else {
        setValidationResult({ valid: false, error: res.error || '验证失败' })
      }
    } catch (error) {
      setValidationResult({ valid: false, error: '验证请求失败' })
    } finally {
      setIsValidating(false)
    }
  }

  const handleRefreshModels = async () => {
    if (!editingProvider) return
    setIsLoadingModels(true)
    try {
      const res = await getProviderModels(editingProvider.id)
      if (res.success && res.data) {
        setAvailableModels(res.data.models)
      }
    } catch (error) {
      console.error('刷新模型列表失败:', error)
    } finally {
      setIsLoadingModels(false)
    }
  }

  // 推断模型类型
  const inferModelType = (modelId: string): ModelType => {
    const id = modelId.toLowerCase()
    if (id.includes('embed') || id.includes('embedding')) {
      return 'embedding'
    }
    if (id.includes('vision') || id.includes('4o') || id.includes('gpt-4-turbo')) {
      return 'multimodal'
    }
    return 'chat'
  }

  // 切换模型选择
  const toggleModelSelection = (model: ModelInfo) => {
    const newSelected = new Map(selectedModels)
    if (newSelected.has(model.id)) {
      newSelected.delete(model.id)
    } else {
      const selectedModel: SelectedModel = {
        id: model.id,
        name: model.name,
        displayName: model.name,
        modelType: model.modelType || inferModelType(model.id),
        contextWindow: model.contextWindow,
        supportsVision: model.supportsVision,
        supportsTools: model.supportsTools,
        supportsStreaming: model.supportsStreaming,
      }
      newSelected.set(model.id, selectedModel)
    }
    setSelectedModels(newSelected)
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedModels.size === availableModels.length) {
      setSelectedModels(new Map())
    } else {
      const newSelected = new Map<string, SelectedModel>()
      availableModels.forEach(model => {
        newSelected.set(model.id, {
          id: model.id,
          name: model.name,
          displayName: model.name,
          modelType: model.modelType || inferModelType(model.id),
          contextWindow: model.contextWindow,
          supportsVision: model.supportsVision,
          supportsTools: model.supportsTools,
          supportsStreaming: model.supportsStreaming,
        })
      })
      setSelectedModels(newSelected)
    }
  }

  // 更新模型类型
  const updateModelType = (modelId: string, modelType: ModelType) => {
    const newSelected = new Map(selectedModels)
    const model = newSelected.get(modelId)
    if (model) {
      newSelected.set(modelId, { ...model, modelType })
      setSelectedModels(newSelected)
    }
  }

  const handleTestModel = async (modelId: string) => {
    if (!editingProvider) return
    setTestingModelId(modelId)
    try {
      const res = await testModel(editingProvider.id, { modelId })
      if (res.success && res.data) {
        setTestResults(new Map(testResults).set(modelId, res.data))
      } else {
        setTestResults(new Map(testResults).set(modelId, { success: false, error: res.error || '测试失败' }))
      }
    } catch (error) {
      setTestResults(new Map(testResults).set(modelId, { success: false, error: '测试请求失败' }))
    } finally {
      setTestingModelId(null)
    }
  }

  const handleTypeChange = (type: AIProviderType) => {
    setFormData({
      ...formData,
      type,
      baseUrl: DEFAULT_BASE_URLS[type],
    })
  }

  const handleSave = async () => {
    if (!formData.name || !formData.apiKey) {
      alert('请填写必填字段')
      return
    }

    const providerData: AIProviderConfig = {
      id: editingProvider?.id || generateId(),
      type: formData.type as AIProviderType,
      name: formData.name,
      apiKey: formData.apiKey,
      baseUrl: formData.baseUrl,
      azureEndpoint: formData.azureEndpoint,
      azureDeployment: formData.azureDeployment,
      azureApiVersion: formData.azureApiVersion,
      enabled: formData.enabled ?? true,
      isDefault: formData.isDefault ?? false,
      selectedModels: Array.from(selectedModels.values()),
    }

    try {
      const res = editingProvider
        ? await updateProvider(providerData)
        : await addProvider(providerData)

      if (res.success) {
        setModalOpen(false)
        loadProviders()
      } else {
        alert(res.error || '保存失败')
      }
    } catch (error) {
      console.error('保存提供商失败:', error)
      alert('保存失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个提供商吗？')) return

    try {
      const res = await deleteProvider(id)
      if (res.success) {
        loadProviders()
      } else {
        alert(res.error || '删除失败')
      }
    } catch (error) {
      console.error('删除提供商失败:', error)
      alert('删除失败')
    }
  }

  const handleTestConnection = async (provider: AIProviderConfig) => {
    setTestingId(provider.id)
    try {
      const res = await testProviderConnection(provider)
      if (res.success && res.data) {
        alert('连接成功！')
      } else {
        alert(res.error || '连接失败')
      }
    } catch (error) {
      console.error('测试连接失败:', error)
      alert('测试连接失败')
    } finally {
      setTestingId(null)
    }
  }

  const StatusBadge = ({ provider }: { provider: AIProviderConfig }) => {
    if (!provider.enabled) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(var(--color-surface), 0.8)', color: 'rgb(var(--color-text-muted))' }}>
          已禁用
        </span>
      )
    }
    if (provider.connectionStatus === 'connected') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          已连接
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(var(--color-surface), 0.8)', color: 'rgb(var(--color-text-muted))' }}>
        <XCircle className="w-3 h-3 mr-1" />
        未测试
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold page-title">AI 服务配置</h1>
          <p className="page-subtitle mt-1">管理 AI 提供商和 API 配置</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          添加提供商
        </Button>
      </div>

      {/* 提供商列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : providers.length === 0 ? (
        <Card className="text-center py-16">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, rgba(var(--color-primary), 0.2), rgba(var(--color-accent), 0.1))' }}>
              <Bot className="w-10 h-10" style={{ color: 'rgb(var(--color-primary))' }} />
            </div>
            <h3 className="text-xl font-semibold text-theme mb-2">暂无 AI 提供商</h3>
            <p className="text-theme-secondary text-center max-w-md mb-6">
              添加 AI 提供商以开始使用智能助手功能，支持 OpenAI、Azure、Anthropic 等多种服务。
            </p>
            <Button onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              添加第一个提供商
            </Button>
            <div className="mt-8 p-4 rounded-xl max-w-md text-left" style={{ background: 'rgba(var(--color-surface), 0.5)' }}>
              <p className="text-sm font-medium text-theme-secondary mb-2 flex items-center">
                <Sparkles className="w-4 h-4 mr-2" style={{ color: 'rgb(var(--color-accent))' }} />
                快速提示
              </p>
              <ul className="text-sm text-theme-muted space-y-1">
                <li>• 推荐使用 OpenAI 或 Azure OpenAI 获得最佳体验</li>
                <li>• 可以同时配置多个提供商作为备选</li>
                <li>• API Key 将安全存储在本地</li>
              </ul>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {providers.map((provider) => (
            <Card key={provider.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(var(--color-primary), 0.15)' }}>
                    <span className="font-semibold text-sm" style={{ color: 'rgb(var(--color-primary))' }}>
                      {provider.type.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold card-title">{provider.name}</h3>
                      {provider.isDefault && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                      <StatusBadge provider={provider} />
                    </div>
                    <p className="text-sm text-theme-muted mt-0.5">
                      {provider.type.toUpperCase()} · {provider.baseUrl || '默认端点'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTestConnection(provider)}
                    disabled={testingId === provider.id}
                  >
                    {testingId === provider.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      '测试连接'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(provider)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(provider.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 添加/编辑弹窗 */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProvider ? '编辑提供商' : '添加提供商'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="提供商类型"
            options={PROVIDER_TYPES}
            value={formData.type}
            onChange={(e) => handleTypeChange(e.target.value as AIProviderType)}
          />

          <Input
            label="名称"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="例如: 我的 OpenAI"
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-theme-secondary">
              API Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                className="w-full px-3 py-2 pr-10 rounded-lg text-sm input-theme"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="sk-..."
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme transition-colors"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Input
            label="Base URL"
            value={formData.baseUrl}
            onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
            placeholder={DEFAULT_BASE_URLS[formData.type as AIProviderType] || 'https://...'}
            hint="留空使用默认端点"
          />

          {/* Azure 特有配置 */}
          {formData.type === 'azure' && (
            <>
              <Input
                label="Azure 端点"
                required
                value={formData.azureEndpoint}
                onChange={(e) => setFormData({ ...formData, azureEndpoint: e.target.value })}
                placeholder="https://xxx.openai.azure.com"
              />
              <Input
                label="部署名称"
                value={formData.azureDeployment}
                onChange={(e) => setFormData({ ...formData, azureDeployment: e.target.value })}
                placeholder="gpt-4-deployment"
              />
              <Select
                label="API 版本"
                options={[
                  { value: '2024-02-15-preview', label: '2024-02-15-preview' },
                  { value: '2024-02-01', label: '2024-02-01' },
                  { value: '2023-12-01-preview', label: '2023-12-01-preview' },
                ]}
                value={formData.azureApiVersion || '2024-02-15-preview'}
                onChange={(e) => setFormData({ ...formData, azureApiVersion: e.target.value })}
              />
            </>
          )}

          {/* 验证连接按钮 */}
          <div className="pt-2">
            <Button
              variant="secondary"
              onClick={handleValidate}
              disabled={isValidating || !formData.apiKey}
              className="w-full"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  验证中...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  验证连接
                </>
              )}
            </Button>
            {validationResult && (
              <div className={`mt-2 p-3 rounded-lg text-sm ${
                validationResult.valid
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}>
                {validationResult.valid ? (
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    验证成功！获取到 {availableModels.length} 个可用模型
                  </div>
                ) : (
                  <div className="flex items-center">
                    <XCircle className="w-4 h-4 mr-2" />
                    {validationResult.error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 模型选择 */}
          {availableModels.length > 0 && (
            <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'rgba(var(--color-border), 0.5)' }}>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-theme-secondary">
                  选择要使用的模型 ({selectedModels.size}/{availableModels.length})
                </label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {selectedModels.size === availableModels.length ? '取消全选' : '全选'}
                  </Button>
                  {editingProvider && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshModels}
                      disabled={isLoadingModels}
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingModels ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* 模型列表 */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {availableModels.map((model) => {
                  const isSelected = selectedModels.has(model.id)
                  const selectedModel = selectedModels.get(model.id)
                  const testResult = testResults.get(model.id)
                  
                  return (
                    <div
                      key={model.id}
                      className={`p-3 rounded-lg border transition-all ${
                        isSelected 
                          ? 'border-primary-500/50 bg-primary-500/5' 
                          : 'border-transparent'
                      }`}
                      style={{ background: isSelected ? undefined : 'rgba(var(--color-surface), 0.5)' }}
                    >
                      <div className="flex items-start justify-between">
                        <label className="flex items-start space-x-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleModelSelection(model)}
                            className="w-4 h-4 mt-0.5 rounded"
                            style={{ accentColor: 'rgb(var(--color-primary))' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm text-theme">{model.name}</span>
                              {model.contextWindow && (
                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(var(--color-primary), 0.1)', color: 'rgb(var(--color-primary))' }}>
                                  {Math.round(model.contextWindow / 1000)}K
                                </span>
                              )}
                            </div>
                            {model.description && (
                              <p className="text-xs text-theme-muted mt-0.5 truncate">{model.description}</p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {model.supportsVision && (
                                <span className="px-1.5 py-0.5 text-xs rounded bg-purple-500/10 text-purple-500">视觉</span>
                              )}
                              {model.supportsTools && (
                                <span className="px-1.5 py-0.5 text-xs rounded bg-blue-500/10 text-blue-500">工具</span>
                              )}
                              {model.supportsStreaming && (
                                <span className="px-1.5 py-0.5 text-xs rounded bg-green-500/10 text-green-500">流式</span>
                              )}
                            </div>
                          </div>
                        </label>
                        
                        {/* 模型类型选择和测试按钮 */}
                        {isSelected && (
                          <div className="flex items-center space-x-2 ml-2">
                            <select
                              className="text-xs px-2 py-1 rounded input-theme"
                              value={selectedModel?.modelType || 'chat'}
                              onChange={(e) => updateModelType(model.id, e.target.value as ModelType)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="chat">对话</option>
                              <option value="embedding">嵌入</option>
                              <option value="multimodal">多模态</option>
                            </select>
                            {editingProvider && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleTestModel(model.id)
                                }}
                                disabled={testingModelId === model.id}
                                className="!p-1"
                              >
                                {testingModelId === model.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Zap className="w-3 h-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* 测试结果 */}
                      {testResult && (
                        <div className={`mt-2 p-2 rounded text-xs ${
                          testResult.success
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {testResult.success ? (
                            <span className="flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              测试成功 {testResult.latency && `(${testResult.latency}ms)`}
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <XCircle className="w-3 h-3 mr-1" />
                              {testResult.error}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-6 pt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-4 h-4 rounded"
                style={{ accentColor: 'rgb(var(--color-primary))' }}
              />
              <span className="text-sm text-theme">启用此提供商</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 rounded"
                style={{ accentColor: 'rgb(var(--color-primary))' }}
              />
              <span className="text-sm text-theme">设为默认提供商</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  )
}
