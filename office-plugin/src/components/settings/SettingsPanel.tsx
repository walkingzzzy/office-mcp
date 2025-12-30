/**
 * 设置面板组件
 * 管理本地 AI 配置
 */

import React, { useEffect, useState } from 'react'
import { useLocalConfigStore } from '../../store/localConfigStore'
import { ProviderConfig } from './ProviderConfig'
import { KnowledgeBaseConfig } from './KnowledgeBaseConfig'
import { McpServerConfig } from './McpServerConfig'
import type { AIProviderConfig } from '../../services/config/LocalConfigManager'

interface SettingsPanelProps {
  onClose?: () => void
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const {
    config,
    loading,
    error,
    bridgeConnected,
    loadConfig,
    checkBridgeConnection,
    deleteProvider,
    toggleProvider,
    setDefaultProvider,
    setBridgeUrl,
    exportConfig,
    importConfig,
    resetConfig
  } = useLocalConfigStore()

  const [activeTab, setActiveTab] = useState<'providers' | 'knowledge' | 'mcp' | 'bridge' | 'advanced'>('providers')
  const [editingProvider, setEditingProvider] = useState<AIProviderConfig | null>(null)
  const [showAddProvider, setShowAddProvider] = useState(false)
  const [bridgeUrlInput, setBridgeUrlInput] = useState('')

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  useEffect(() => {
    if (config?.bridgeUrl) {
      setBridgeUrlInput(config.bridgeUrl)
      checkBridgeConnection()
    }
  }, [config?.bridgeUrl, checkBridgeConnection])

  const handleExport = async () => {
    const json = await exportConfig()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'office-plugin-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const text = await file.text()
        await importConfig(text)
      }
    }
    input.click()
  }

  const handleSaveBridgeUrl = async () => {
    await setBridgeUrl(bridgeUrlInput)
    await checkBridgeConnection()
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  // 编辑/添加提供商模式
  if (showAddProvider || editingProvider) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">
          {editingProvider ? '编辑提供商' : '添加提供商'}
        </h2>
        <ProviderConfig
          provider={editingProvider || undefined}
          onSave={() => {
            setShowAddProvider(false)
            setEditingProvider(null)
          }}
          onCancel={() => {
            setShowAddProvider(false)
            setEditingProvider(null)
          }}
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">设置</h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        )}
      </div>

      {/* 标签页 */}
      <div className="flex border-b">
        {[
          { key: 'providers', label: 'AI 提供商' },
          { key: 'knowledge', label: '知识库' },
          { key: 'mcp', label: 'MCP 服务器' },
          { key: 'bridge', label: '桥接服务' },
          { key: 'advanced', label: '高级' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 text-sm ${
              activeTab === tab.key
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* AI 提供商标签页 */}
        {activeTab === 'providers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                配置您的 AI 服务提供商
              </p>
              <button
                onClick={() => setShowAddProvider(true)}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
              >
                + 添加提供商
              </button>
            </div>

            {config?.providers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>尚未配置任何提供商</p>
                <p className="text-sm mt-1">点击上方按钮添加您的第一个 AI 提供商</p>
              </div>
            ) : (
              <div className="space-y-2">
                {config?.providers.map(provider => (
                  <div
                    key={provider.id}
                    className="p-3 border rounded-md flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={provider.enabled}
                        onChange={() => toggleProvider(provider.id)}
                      />
                      <div>
                        <div className="font-medium">{provider.name}</div>
                        <div className="text-xs text-gray-500">
                          {provider.type.toUpperCase()}
                          {provider.id === config.defaultProviderId && (
                            <span className="ml-2 text-blue-500">默认</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {provider.id !== config.defaultProviderId && (
                        <button
                          onClick={() => setDefaultProvider(provider.id)}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          设为默认
                        </button>
                      )}
                      <button
                        onClick={() => setEditingProvider(provider)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => deleteProvider(provider.id)}
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
        )}

        {/* 知识库标签页 */}
        {activeTab === 'knowledge' && (
          <KnowledgeBaseConfig />
        )}

        {/* MCP 服务器标签页 */}
        {activeTab === 'mcp' && (
          <McpServerConfig />
        )}

        {/* 桥接服务标签页 */}
        {activeTab === 'bridge' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">桥接服务地址</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={bridgeUrlInput}
                  onChange={(e) => setBridgeUrlInput(e.target.value)}
                  placeholder="http://localhost:3001"
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <button
                  onClick={handleSaveBridgeUrl}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  保存
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${bridgeConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">
                {bridgeConnected ? '已连接' : '未连接'}
              </span>
              <button
                onClick={() => checkBridgeConnection()}
                className="text-xs text-blue-500 hover:underline"
              >
                刷新状态
              </button>
            </div>

            <div className="text-sm text-gray-500">
              <p>桥接服务用于：</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>代理 AI API 请求（解决 CORS 限制）</li>
                <li>管理 MCP 服务器进程</li>
                <li>执行 Office 文档操作</li>
              </ul>
            </div>
          </div>
        )}

        {/* 高级标签页 */}
        {activeTab === 'advanced' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">导入/导出配置</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  导出配置
                </button>
                <button
                  onClick={handleImport}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  导入配置
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                注意：导出的配置不包含 API Key
              </p>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2 text-red-600">危险操作</h3>
              <button
                onClick={() => {
                  if (confirm('确定要重置所有配置吗？此操作不可撤销。')) {
                    resetConfig()
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                重置所有配置
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPanel
