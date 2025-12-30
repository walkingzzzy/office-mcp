/**
 * RAG 配置组件
 * 配置知识库检索增强参数
 */

import React, { useEffect, useState } from 'react'
import { ragService } from '../../services/knowledge/RAGService'
import type { RAGConfig } from '../../services/knowledge/RAGService'

interface RAGConfigProps {
  onChange?: (config: RAGConfig) => void
}

export const RAGConfigPanel: React.FC<RAGConfigProps> = ({ onChange }) => {
  const [config, setConfig] = useState<RAGConfig>(ragService.getConfig())

  useEffect(() => {
    setConfig(ragService.getConfig())
  }, [])

  const handleChange = (field: keyof RAGConfig, value: boolean | number) => {
    const newConfig = { ...config, [field]: value }
    setConfig(newConfig)
    ragService.setConfig(newConfig)
    onChange?.(newConfig)
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium">RAG 检索设置</h4>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">启用 RAG</div>
          <div className="text-xs text-gray-500">在 AI 对话前自动检索相关知识</div>
        </div>
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => handleChange('enabled', e.target.checked)}
          className="w-5 h-5"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          检索数量 (Top K): {config.topK}
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={config.topK}
          onChange={(e) => handleChange('topK', parseInt(e.target.value))}
          className="w-full"
          disabled={!config.enabled}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1</span>
          <span>10</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          最低相关度: {config.minScore.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={config.minScore * 100}
          onChange={(e) => handleChange('minScore', parseInt(e.target.value) / 100)}
          className="w-full"
          disabled={!config.enabled}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          最大上下文长度: {config.maxContextLength}
        </label>
        <input
          type="range"
          min="1000"
          max="8000"
          step="500"
          value={config.maxContextLength}
          onChange={(e) => handleChange('maxContextLength', parseInt(e.target.value))}
          className="w-full"
          disabled={!config.enabled}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1000</span>
          <span>8000</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">显示来源</div>
          <div className="text-xs text-gray-500">在检索结果中包含文档来源</div>
        </div>
        <input
          type="checkbox"
          checked={config.includeSource}
          onChange={(e) => handleChange('includeSource', e.target.checked)}
          className="w-5 h-5"
          disabled={!config.enabled}
        />
      </div>
    </div>
  )
}

export default RAGConfigPanel
