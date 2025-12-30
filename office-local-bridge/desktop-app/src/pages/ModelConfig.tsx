/**
 * 模型管理页面
 * 从已配置的模型中选择默认模型
 */

import { useEffect, useState } from 'react'
import {
  Star,
  Loader2,
  Settings,
  Check,
  MessageSquare,
  Database,
  Image
} from 'lucide-react'
import { Card, Button } from '../components'
import { getProviders, getConfig, updateConfig } from '../services/tauri'
import type { AIProviderConfig, BridgeConfig, SelectedModel, ModelType } from '../types'

// 模型类型标签
const ModelTypeLabel = ({ type }: { type: ModelType }) => {
  const labels: Record<ModelType, { text: string; color: string }> = {
    chat: { text: '对话', color: 'bg-blue-500/10 text-blue-500' },
    embedding: { text: '嵌入', color: 'bg-green-500/10 text-green-500' },
    multimodal: { text: '多模态', color: 'bg-purple-500/10 text-purple-500' },
  }
  const label = labels[type] || labels.chat
  return (
    <span className={`px-2 py-0.5 text-xs rounded ${label.color}`}>
      {label.text}
    </span>
  )
}

export default function ModelConfig() {
  const [providers, setProviders] = useState<AIProviderConfig[]>([])
  const [config, setConfig] = useState<BridgeConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 选择状态
  const [selectedChatModel, setSelectedChatModel] = useState<string>('')
  const [selectedEmbeddingModel, setSelectedEmbeddingModel] = useState<string>('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [providersRes, configRes] = await Promise.all([
        getProviders(),
        getConfig()
      ])

      if (providersRes.success && providersRes.data) {
        setProviders(providersRes.data)
      }
      if (configRes.success && configRes.data) {
        setConfig(configRes.data)
        setSelectedChatModel(configRes.data.defaultChatModelId || '')
        setSelectedEmbeddingModel(configRes.data.defaultEmbeddingModelId || '')
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 获取所有已选择的模型（按类型分组）
  const getAllSelectedModels = () => {
    const chatModels: { provider: AIProviderConfig; model: SelectedModel }[] = []
    const embeddingModels: { provider: AIProviderConfig; model: SelectedModel }[] = []
    const multimodalModels: { provider: AIProviderConfig; model: SelectedModel }[] = []

    providers.forEach(provider => {
      if (!provider.enabled || !provider.selectedModels) return
      provider.selectedModels.forEach(model => {
        const item = { provider, model }
        switch (model.modelType) {
          case 'embedding':
            embeddingModels.push(item)
            break
          case 'multimodal':
            multimodalModels.push(item)
            chatModels.push(item) // 多模态也可以用于对话
            break
          default:
            chatModels.push(item)
        }
      })
    })

    return { chatModels, embeddingModels, multimodalModels }
  }

  const { chatModels, embeddingModels } = getAllSelectedModels()

  // 生成模型完整 ID（provider:model）
  const getModelFullId = (providerId: string, modelId: string) => `${providerId}:${modelId}`

  // 解析模型完整 ID
  const parseModelFullId = (fullId: string) => {
    const [providerId, modelId] = fullId.split(':')
    return { providerId, modelId }
  }

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    try {
      const updatedConfig: BridgeConfig = {
        ...config,
        defaultChatModelId: selectedChatModel || undefined,
        defaultEmbeddingModelId: selectedEmbeddingModel || undefined,
      }
      const res = await updateConfig(updatedConfig)
      if (res.success) {
        setConfig(updatedConfig)
        alert('保存成功')
      } else {
        alert(res.error || '保存失败')
      }
    } catch (error) {
      console.error('保存配置失败:', error)
      alert('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 检查是否有变更
  const hasChanges = config && (
    selectedChatModel !== (config.defaultChatModelId || '') ||
    selectedEmbeddingModel !== (config.defaultEmbeddingModelId || '')
  )

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold page-title">默认模型设置</h1>
          <p className="page-subtitle mt-1">选择系统默认使用的 AI 模型</p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              保存设置
            </>
          )}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : providers.length === 0 ? (
        <Card className="text-center py-12">
          <Settings className="w-12 h-12 mx-auto mb-4 text-theme-muted" />
          <p className="text-theme-secondary">请先在 AI 配置页面添加提供商</p>
        </Card>
      ) : chatModels.length === 0 && embeddingModels.length === 0 ? (
        <Card className="text-center py-12">
          <Star className="w-12 h-12 mx-auto mb-4 text-theme-muted" />
          <p className="text-theme-secondary mb-2">暂无可用模型</p>
          <p className="text-sm text-theme-muted">请先在 AI 配置页面验证供应商并选择要使用的模型</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 默认对话模型 */}
          <Card>
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="w-5 h-5" style={{ color: 'rgb(var(--color-primary))' }} />
                <h3 className="font-semibold card-title">默认对话模型</h3>
              </div>
              <p className="text-sm text-theme-muted mb-4">
                用于 AI 对话、文本生成等任务
              </p>
              
              {chatModels.length === 0 ? (
                <p className="text-sm text-theme-muted">暂无可用的对话模型</p>
              ) : (
                <div className="space-y-2">
                  {chatModels.map(({ provider, model }) => {
                    const fullId = getModelFullId(provider.id, model.id)
                    const isSelected = selectedChatModel === fullId
                    return (
                      <label
                        key={fullId}
                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-2 border-primary-500/50 bg-primary-500/5'
                            : 'border border-transparent hover:bg-surface/50'
                        }`}
                        style={{ background: isSelected ? undefined : 'rgba(var(--color-surface), 0.3)' }}
                      >
                        <input
                          type="radio"
                          name="chatModel"
                          value={fullId}
                          checked={isSelected}
                          onChange={(e) => setSelectedChatModel(e.target.value)}
                          className="w-4 h-4"
                          style={{ accentColor: 'rgb(var(--color-primary))' }}
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm text-theme">{model.displayName || model.name}</span>
                            <ModelTypeLabel type={model.modelType} />
                            {model.contextWindow && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-500">
                                {Math.round(model.contextWindow / 1000)}K
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-theme-muted mt-0.5">
                            {provider.name} · {model.id}
                          </p>
                        </div>
                        {isSelected && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* 默认嵌入模型 */}
          <Card>
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Database className="w-5 h-5" style={{ color: 'rgb(var(--color-accent))' }} />
                <h3 className="font-semibold card-title">默认嵌入模型</h3>
              </div>
              <p className="text-sm text-theme-muted mb-4">
                用于文本向量化、语义搜索等任务
              </p>
              
              {embeddingModels.length === 0 ? (
                <p className="text-sm text-theme-muted">暂无可用的嵌入模型（请在 AI 配置中将模型类型设为"嵌入"）</p>
              ) : (
                <div className="space-y-2">
                  {embeddingModels.map(({ provider, model }) => {
                    const fullId = getModelFullId(provider.id, model.id)
                    const isSelected = selectedEmbeddingModel === fullId
                    return (
                      <label
                        key={fullId}
                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-2 border-primary-500/50 bg-primary-500/5'
                            : 'border border-transparent hover:bg-surface/50'
                        }`}
                        style={{ background: isSelected ? undefined : 'rgba(var(--color-surface), 0.3)' }}
                      >
                        <input
                          type="radio"
                          name="embeddingModel"
                          value={fullId}
                          checked={isSelected}
                          onChange={(e) => setSelectedEmbeddingModel(e.target.value)}
                          className="w-4 h-4"
                          style={{ accentColor: 'rgb(var(--color-primary))' }}
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm text-theme">{model.displayName || model.name}</span>
                            <ModelTypeLabel type={model.modelType} />
                          </div>
                          <p className="text-xs text-theme-muted mt-0.5">
                            {provider.name} · {model.id}
                          </p>
                        </div>
                        {isSelected && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* 当前设置摘要 */}
          {(selectedChatModel || selectedEmbeddingModel) && (
            <Card>
              <div className="p-4">
                <h3 className="font-semibold card-title mb-3">当前设置</h3>
                <div className="space-y-2 text-sm">
                  {selectedChatModel && (() => {
                    const { providerId, modelId } = parseModelFullId(selectedChatModel)
                    const provider = providers.find(p => p.id === providerId)
                    const model = provider?.selectedModels?.find(m => m.id === modelId)
                    return (
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-theme-muted" />
                        <span className="text-theme-muted">对话模型:</span>
                        <span className="text-theme">{model?.displayName || modelId}</span>
                        <span className="text-theme-muted">({provider?.name})</span>
                      </div>
                    )
                  })()}
                  {selectedEmbeddingModel && (() => {
                    const { providerId, modelId } = parseModelFullId(selectedEmbeddingModel)
                    const provider = providers.find(p => p.id === providerId)
                    const model = provider?.selectedModels?.find(m => m.id === modelId)
                    return (
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-theme-muted" />
                        <span className="text-theme-muted">嵌入模型:</span>
                        <span className="text-theme">{model?.displayName || modelId}</span>
                        <span className="text-theme-muted">({provider?.name})</span>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
