/**
 * AI 提供商配置组件
 */

import React, { useState } from 'react'
import { useLocalConfigStore } from '../../store/localConfigStore'
import type { AIProviderConfig, AIProviderType } from '../../services/config/LocalConfigManager'

interface ProviderConfigProps {
  provider?: AIProviderConfig
  onSave: () => void
  onCancel: () => void
}

const PROVIDER_TYPES: { value: AIProviderType; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'custom', label: '自定义端点' }
]

export const ProviderConfig: React.FC<ProviderConfigProps> = ({
  provider,
  onSave,
  onCancel
}) => {
  const { addProvider, updateProvider } = useLocalConfigStore()
  const isEditing = !!provider

  const [formData, setFormData] = useState({
    type: provider?.type || 'openai' as AIProviderType,
    name: provider?.name || '',
    apiKey: provider?.apiKey || '',
    baseUrl: provider?.baseUrl || '',
    azureDeployment: provider?.azureDeployment || '',
    azureApiVersion: provider?.azureApiVersion || '2024-02-15-preview',
    enabled: provider?.enabled ?? true
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 验证
    if (!formData.name.trim()) {
      setError('请输入提供商名称')
      return
    }
    if (!formData.apiKey.trim()) {
      setError('请输入 API Key')
      return
    }
    if (formData.type === 'azure' && !formData.azureDeployment.trim()) {
      setError('Azure OpenAI 需要配置部署名称')
      return
    }
    if ((formData.type === 'azure' || formData.type === 'custom') && !formData.baseUrl.trim()) {
      setError('请输入 API 端点 URL')
      return
    }

    setSaving(true)
    try {
      if (isEditing && provider) {
        await updateProvider(provider.id, formData)
      } else {
        await addProvider(formData)
      }
      onSave()
    } catch (err) {
      setError((err as Error).message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">提供商类型</label>
        <select
          value={formData.type}
          onChange={(e) => handleChange('type', e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          disabled={isEditing}
        >
          {PROVIDER_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">名称</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="例如：我的 OpenAI"
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">API Key</label>
        <input
          type="password"
          value={formData.apiKey}
          onChange={(e) => handleChange('apiKey', e.target.value)}
          placeholder="sk-..."
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      {(formData.type === 'azure' || formData.type === 'custom') && (
        <div>
          <label className="block text-sm font-medium mb-1">
            {formData.type === 'azure' ? 'Azure 端点 URL' : 'API 端点 URL'}
          </label>
          <input
            type="url"
            value={formData.baseUrl}
            onChange={(e) => handleChange('baseUrl', e.target.value)}
            placeholder={formData.type === 'azure'
              ? 'https://your-resource.openai.azure.com'
              : 'https://api.example.com/v1'}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      )}

      {formData.type === 'azure' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">部署名称</label>
            <input
              type="text"
              value={formData.azureDeployment}
              onChange={(e) => handleChange('azureDeployment', e.target.value)}
              placeholder="gpt-4"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">API 版本</label>
            <input
              type="text"
              value={formData.azureApiVersion}
              onChange={(e) => handleChange('azureApiVersion', e.target.value)}
              placeholder="2024-02-15-preview"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </>
      )}

      <div className="flex items-center">
        <input
          type="checkbox"
          id="enabled"
          checked={formData.enabled}
          onChange={(e) => handleChange('enabled', e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="enabled" className="text-sm">启用此提供商</label>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-md hover:bg-gray-50"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  )
}

export default ProviderConfig
