/**
 * 知识库配置组件
 */

import React, { useEffect, useState } from 'react'
import { knowledgeManager } from '../../services/knowledge/KnowledgeManager'
import { RAGConfigPanel } from './RAGConfig'
import type {
  AnyKnowledgeBaseConfig,
  KnowledgeBaseType
} from '../../services/knowledge/types'

interface KnowledgeBaseConfigProps {
  onClose?: () => void
}

const KB_TYPES: { value: KnowledgeBaseType; label: string }[] = [
  { value: 'http', label: '通用 HTTP API' },
  { value: 'milvus', label: 'Milvus' },
  { value: 'pinecone', label: 'Pinecone' },
  { value: 'chroma', label: 'Chroma' }
]

export const KnowledgeBaseConfig: React.FC<KnowledgeBaseConfigProps> = ({ onClose }) => {
  const [knowledgeBases, setKnowledgeBases] = useState<AnyKnowledgeBaseConfig[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingKb, setEditingKb] = useState<AnyKnowledgeBaseConfig | null>(null)
  const [loading, setLoading] = useState(true)

  // 表单状态
  const [formData, setFormData] = useState({
    type: 'http' as KnowledgeBaseType,
    name: '',
    baseUrl: '',
    apiKey: '',
    enabled: true
  })

  useEffect(() => {
    loadKnowledgeBases()
  }, [])

  const loadKnowledgeBases = async () => {
    setLoading(true)
    await knowledgeManager.initialize()
    setKnowledgeBases(knowledgeManager.getKnowledgeBases())
    setLoading(false)
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const config: AnyKnowledgeBaseConfig = {
      id: editingKb?.id || '',
      type: formData.type,
      name: formData.name,
      enabled: formData.enabled,
      baseUrl: formData.baseUrl,
      apiKey: formData.apiKey
    } as AnyKnowledgeBaseConfig

    if (editingKb) {
      await knowledgeManager.updateKnowledgeBase(editingKb.id, config)
    } else {
      await knowledgeManager.addKnowledgeBase(config)
    }

    setShowAddForm(false)
    setEditingKb(null)
    resetForm()
    loadKnowledgeBases()
  }

  const handleEdit = (kb: AnyKnowledgeBaseConfig) => {
    setEditingKb(kb)
    setFormData({
      type: kb.type,
      name: kb.name,
      baseUrl: (kb as { baseUrl?: string }).baseUrl || '',
      apiKey: (kb as { apiKey?: string }).apiKey || '',
      enabled: kb.enabled
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除此知识库吗？')) {
      await knowledgeManager.removeKnowledgeBase(id)
      loadKnowledgeBases()
    }
  }

  const handleToggle = async (kb: AnyKnowledgeBaseConfig) => {
    await knowledgeManager.updateKnowledgeBase(kb.id, { enabled: !kb.enabled })
    loadKnowledgeBases()
  }

  const resetForm = () => {
    setFormData({
      type: 'http',
      name: '',
      baseUrl: '',
      apiKey: '',
      enabled: true
    })
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingKb(null)
    resetForm()
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  // 添加/编辑表单
  if (showAddForm) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">
          {editingKb ? '编辑知识库' : '添加知识库'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">类型</label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              disabled={!!editingKb}
            >
              {KB_TYPES.map(t => (
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
              placeholder="我的知识库"
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">API 地址</label>
            <input
              type="url"
              value={formData.baseUrl}
              onChange={(e) => handleChange('baseUrl', e.target.value)}
              placeholder="https://api.example.com"
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">API Key（可选）</label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              placeholder="可选"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="kb-enabled"
              checked={formData.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="kb-enabled" className="text-sm">启用此知识库</label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    )
  }

  // 知识库列表
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">知识库</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
          >
            + 添加
          </button>
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        连接外部知识库，为 AI 对话提供上下文增强
      </p>

      {/* RAG 配置 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <RAGConfigPanel />
      </div>

      <h4 className="font-medium mb-3">知识库连接</h4>

      {knowledgeBases.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>尚未配置任何知识库</p>
          <p className="text-sm mt-1">点击上方按钮添加您的第一个知识库</p>
        </div>
      ) : (
        <div className="space-y-2">
          {knowledgeBases.map(kb => (
            <div
              key={kb.id}
              className="p-3 border rounded-md flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={kb.enabled}
                  onChange={() => handleToggle(kb)}
                />
                <div>
                  <div className="font-medium">{kb.name}</div>
                  <div className="text-xs text-gray-500">
                    {kb.type.toUpperCase()}
                    {kb.description && ` - ${kb.description}`}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(kb)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(kb.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default KnowledgeBaseConfig
