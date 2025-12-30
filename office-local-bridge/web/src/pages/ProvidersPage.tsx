import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, RefreshCw, CheckCircle, XCircle, Loader2, Zap, ChevronDown, Play, Check } from 'lucide-react'
import { providerApi } from '../services/api'
import type { AIProviderConfig, AIProviderType, ModelInfo, ValidateProviderResponse, TestModelResponse } from '../types'

const PROVIDER_TYPES: { value: AIProviderType; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'ollama', label: 'Ollama' },
  { value: 'custom', label: '自定义' },
]

const DEFAULT_BASE_URLS: Record<AIProviderType, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com',
  azure: '',
  ollama: 'http://localhost:11434',
  custom: '',
}

interface ProviderFormData {
  type: AIProviderType
  name: string
  apiKey: string
  baseUrl: string
  azureEndpoint?: string
  azureDeployment?: string
  azureApiVersion?: string
}

type FormStep = 'config' | 'validated' | 'models'

export default function ProvidersPage() {
  const [providers, setProviders] = useState<AIProviderConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // 表单状态
  const [formData, setFormData] = useState<ProviderFormData>({
    type: 'openai',
    name: '',
    apiKey: '',
    baseUrl: DEFAULT_BASE_URLS.openai,
  })
  
  // 步骤状态
  const [formStep, setFormStep] = useState<FormStep>('config')
  
  // 验证状态
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidateProviderResponse | null>(null)
  
  // 模型状态
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  
  // 测试状态
  const [testingModelId, setTestingModelId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, TestModelResponse>>({})
  
  // 保存状态
  const [isSaving, setIsSaving] = useState(false)

  const loadProviders = useCallback(async () => {
    try {
      const res = await providerApi.getProviders()
      setProviders(res.data?.providers || [])
    } catch (err) {
      console.error('加载供应商失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProviders()
  }, [loadProviders])

  const resetForm = () => {
    setFormData({ type: 'openai', name: '', apiKey: '', baseUrl: DEFAULT_BASE_URLS.openai })
    setFormStep('config')
    setValidationResult(null)
    setAvailableModels([])
    setSelectedModels([])
    setTestResults({})
    setTestingModelId(null)
    setEditingId(null)
  }

  const handleTypeChange = (type: AIProviderType) => {
    setFormData(prev => ({ ...prev, type, baseUrl: DEFAULT_BASE_URLS[type] }))
    // 切换类型时重置验证状态
    setFormStep('config')
    setValidationResult(null)
    setAvailableModels([])
    setSelectedModels([])
    setTestResults({})
  }

  // 验证连接并获取模型列表
  const handleValidate = async () => {
    if (!formData.apiKey) return
    
    setIsValidating(true)
    setValidationResult(null)
    setAvailableModels([])
    setSelectedModels([])
    setTestResults({})
    
    try {
      const res = await providerApi.validateProvider({
        type: formData.type,
        apiKey: formData.apiKey,
        baseUrl: formData.baseUrl || undefined,
        azureEndpoint: formData.azureEndpoint,
        azureDeployment: formData.azureDeployment,
        azureApiVersion: formData.azureApiVersion,
      })
      
      setValidationResult(res.data)
      if (res.data?.valid && res.data.models) {
        setAvailableModels(res.data.models)
        setFormStep('validated')
        // 默认选中第一个模型
        if (res.data.models.length > 0) {
          setSelectedModels([res.data.models[0].id])
        }
      }
    } catch (err) {
      setValidationResult({ valid: false, error: String(err) })
    } finally {
      setIsValidating(false)
    }
  }

  // 切换模型选择
  const toggleModelSelection = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    )
  }

  // 测试单个模型（使用临时配置，无需保存）
  const handleTestModel = async (modelId: string) => {
    setTestingModelId(modelId)
    
    try {
      const res = await providerApi.testModelWithConfig({
        type: formData.type,
        apiKey: formData.apiKey,
        baseUrl: formData.baseUrl || undefined,
        azureEndpoint: formData.azureEndpoint,
        azureDeployment: formData.azureDeployment,
        azureApiVersion: formData.azureApiVersion,
        modelId,
      })
      
      setTestResults(prev => ({ ...prev, [modelId]: res.data }))
    } catch (err) {
      setTestResults(prev => ({ ...prev, [modelId]: { success: false, error: String(err) } }))
    } finally {
      setTestingModelId(null)
    }
  }

  // 刷新已保存供应商的模型列表
  const handleRefreshModels = async (providerId: string) => {
    setIsLoadingModels(true)
    try {
      const res = await providerApi.getProviderModels(providerId)
      // 这里可以显示模型列表或更新 UI
      console.log('模型列表:', res.data?.models)
    } catch (err) {
      console.error('刷新模型列表失败:', err)
    } finally {
      setIsLoadingModels(false)
    }
  }

  // 保存供应商（包含选中的模型）
  const handleSave = async () => {
    if (!formData.name || !formData.apiKey || !validationResult?.valid) return
    
    setIsSaving(true)
    try {
      if (editingId) {
        await providerApi.updateProvider(editingId, {
          name: formData.name,
          apiKey: formData.apiKey,
          baseUrl: formData.baseUrl,
          azureEndpoint: formData.azureEndpoint,
          azureDeployment: formData.azureDeployment,
          azureApiVersion: formData.azureApiVersion,
          selectedModels,
          connectionStatus: 'connected',
          lastTestedAt: Date.now(),
        })
      } else {
        await providerApi.addProvider({
          type: formData.type,
          name: formData.name,
          apiKey: formData.apiKey,
          baseUrl: formData.baseUrl,
          azureEndpoint: formData.azureEndpoint,
          azureDeployment: formData.azureDeployment,
          azureApiVersion: formData.azureApiVersion,
          enabled: true,
          selectedModels,
          connectionStatus: 'connected',
          lastTestedAt: Date.now(),
        })
      }
      
      await loadProviders()
      setShowForm(false)
      resetForm()
    } catch (err) {
      console.error('保存失败:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // 删除供应商
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此供应商吗？')) return
    
    try {
      await providerApi.deleteProvider(id)
      await loadProviders()
    } catch (err) {
      console.error('删除失败:', err)
    }
  }

  // 判断保存按钮是否可用
  const canSave = formData.name && formData.apiKey && validationResult?.valid && selectedModels.length > 0

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">AI 供应商管理</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          添加供应商
        </button>
      </div>

      {/* 供应商列表 */}
      <div className="grid gap-4">
        {providers.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
            暂无供应商配置，点击上方按钮添加
          </div>
        ) : (
          providers.map(provider => (
            <div key={provider.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    provider.connectionStatus === 'connected' ? 'bg-green-500' :
                    provider.connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-300'
                  }`} />
                  <div>
                    <h3 className="font-medium text-gray-800">{provider.name}</h3>
                    <p className="text-sm text-gray-500">
                      {provider.type} · {provider.baseUrl || '默认'}
                      {provider.selectedModels && provider.selectedModels.length > 0 && (
                        <span className="ml-2 text-blue-600">
                          · {provider.selectedModels.length} 个模型
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRefreshModels(provider.id)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="刷新模型列表"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingModels ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleDelete(provider.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 添加/编辑表单 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">{editingId ? '编辑供应商' : '添加供应商'}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {formStep === 'config' && '第 1 步：配置连接信息'}
                {formStep === 'validated' && '第 2 步：选择要使用的模型'}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* 供应商类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">供应商类型</label>
                <div className="relative">
                  <select
                    value={formData.type}
                    onChange={e => handleTypeChange(e.target.value as AIProviderType)}
                    disabled={formStep !== 'config'}
                    className="w-full px-3 py-2 border rounded-lg appearance-none bg-white pr-10 disabled:bg-gray-100"
                  >
                    {PROVIDER_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* 名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：我的 OpenAI"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, apiKey: e.target.value }))
                    // 修改 API Key 时重置验证状态
                    if (formStep !== 'config') {
                      setFormStep('config')
                      setValidationResult(null)
                      setAvailableModels([])
                      setSelectedModels([])
                    }
                  }}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              {/* Base URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                <input
                  type="text"
                  value={formData.baseUrl}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, baseUrl: e.target.value }))
                    // 修改 URL 时重置验证状态
                    if (formStep !== 'config') {
                      setFormStep('config')
                      setValidationResult(null)
                      setAvailableModels([])
                      setSelectedModels([])
                    }
                  }}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              {/* Azure 特定字段 */}
              {formData.type === 'azure' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Azure Endpoint</label>
                    <input
                      type="text"
                      value={formData.azureEndpoint || ''}
                      onChange={e => setFormData(prev => ({ ...prev, azureEndpoint: e.target.value }))}
                      placeholder="https://your-resource.openai.azure.com"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deployment Name</label>
                    <input
                      type="text"
                      value={formData.azureDeployment || ''}
                      onChange={e => setFormData(prev => ({ ...prev, azureDeployment: e.target.value }))}
                      placeholder="gpt-4"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </>
              )}

              {/* 验证按钮和结果 */}
              <div className="space-y-3">
                <button
                  onClick={handleValidate}
                  disabled={!formData.apiKey || isValidating}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  {isValidating ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 mr-1.5" />
                  )}
                  {formStep === 'config' ? '验证连接' : '重新验证'}
                </button>
                
                {validationResult && (
                  <div className={`flex items-center text-sm ${validationResult.valid ? 'text-green-600' : 'text-red-600'}`}>
                    {validationResult.valid ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        连接成功，获取到 {availableModels.length} 个可用模型
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        {validationResult.error || '连接失败'}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 模型选择列表 */}
              {formStep === 'validated' && availableModels.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      选择要使用的模型 <span className="text-gray-400">({selectedModels.length} 已选)</span>
                    </label>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
                    {availableModels.map(model => {
                      const isSelected = selectedModels.includes(model.id)
                      const testResult = testResults[model.id]
                      const isTesting = testingModelId === model.id
                      
                      return (
                        <div
                          key={model.id}
                          className={`p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                          onClick={() => toggleModelSelection(model.id)}
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-800 truncate">{model.name || model.id}</div>
                              <div className="text-xs text-gray-500 flex flex-wrap gap-1 mt-0.5">
                                {model.contextWindow && (
                                  <span className="px-1.5 py-0.5 bg-gray-100 rounded">{Math.round(model.contextWindow / 1000)}K</span>
                                )}
                                {model.supportsVision && (
                                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">视觉</span>
                                )}
                                {model.supportsTools && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">工具</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-2">
                            {/* 测试结果指示器 */}
                            {testResult && (
                              <div className={`text-xs ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                                {testResult.success ? `${testResult.latency}ms` : '失败'}
                              </div>
                            )}
                            
                            {/* 测试按钮 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTestModel(model.id)
                              }}
                              disabled={isTesting}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="测试模型"
                            >
                              {isTesting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {selectedModels.length === 0 && (
                    <p className="text-sm text-amber-600 mt-2">请至少选择一个模型</p>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {!validationResult?.valid && '请先验证连接'}
                {validationResult?.valid && selectedModels.length === 0 && '请选择至少一个模型'}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => { setShowForm(false); resetForm() }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={!canSave || isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isSaving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
