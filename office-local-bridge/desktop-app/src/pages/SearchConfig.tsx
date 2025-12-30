/**
 * 联网搜索配置页面
 * 配置搜索引擎和搜索参数
 */

import { useEffect, useState } from 'react'
import {
  Save,
  Search,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { Card, Button, Input } from '../components'

interface WebSearchConfig {
  enabled: boolean
  provider: string
  apiKey: string
  maxResults: number
  searchDepth: 'basic' | 'advanced'
  includeImages: boolean
  includeDomains: string[]
  excludeDomains: string[]
  searxngInstanceUrl?: string
}

interface SearchResult {
  title: string
  url: string
  snippet: string
  score?: number
}

const SEARCH_PROVIDERS = [
  { value: 'duckduckgo', label: 'DuckDuckGo (免费)', description: '免费搜索，无需 API Key，使用 HTML 解析' },
  { value: 'searxng', label: 'SearXNG (免费)', description: '开源元搜索引擎，支持自部署或公共实例' },
  { value: 'tavily', label: 'Tavily (推荐)', description: 'AI 优化搜索引擎，结果质量高，需要 API Key' },
  { value: 'serper', label: 'Serper', description: 'Google 搜索 API，有免费额度，需要 API Key' },
]

const DEFAULT_CONFIG: WebSearchConfig = {
  enabled: false,
  provider: 'duckduckgo',
  apiKey: '',
  maxResults: 5,
  searchDepth: 'basic',
  includeImages: false,
  includeDomains: [],
  excludeDomains: [],
  searxngInstanceUrl: ''
}

export default function SearchConfig() {
  const [config, setConfig] = useState<WebSearchConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testQuery, setTestQuery] = useState('什么是 MCP 协议')
  const [testResults, setTestResults] = useState<SearchResult[]>([])
  const [testError, setTestError] = useState<string>('')
  const [hasChanges, setHasChanges] = useState(false)

  const loadConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/config/websearch')
      const data = await response.json()
      if (data.success && data.data) {
        setConfig(data.data)
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const handleChange = (field: keyof WebSearchConfig, value: unknown) => {
    setConfig({ ...config, [field]: value })
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('http://localhost:3001/api/config/websearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await response.json()
      if (data.success) {
        setHasChanges(false)
        alert('配置已保存')
      } else {
        alert(data.error?.message || '保存失败')
      }
    } catch (error) {
      console.error('保存配置失败:', error)
      alert('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!testQuery.trim()) {
      alert('请输入搜索查询')
      return
    }

    setTesting(true)
    setTestError('')
    setTestResults([])

    try {
      const response = await fetch('http://localhost:3001/api/search/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery })
      })
      const data = await response.json()

      if (data.success) {
        setTestResults(data.data.results || [])
      } else {
        setTestError(data.error?.message || '搜索失败')
      }
    } catch (error) {
      console.error('搜索测试失败:', error)
      setTestError('搜索测试失败')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const selectedProvider = SEARCH_PROVIDERS.find(p => p.value === config.provider)

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold page-title">联网搜索配置</h1>
          <p className="page-subtitle mt-1">配置 AI 联网搜索能力</p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          保存
        </Button>
      </div>

      {/* 启用开关 */}
      <Card>
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="text-base font-medium text-slate-700">启用联网搜索</span>
            <p className="text-sm text-slate-500">允许 AI 通过搜索引擎获取最新信息</p>
          </div>
        </label>
      </Card>

      {/* 搜索引擎选择 */}
      <Card title="搜索引擎" description="选择搜索服务提供商">
        <div className="space-y-4">
          {SEARCH_PROVIDERS.map((provider) => (
            <label
              key={provider.value}
              className="flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:bg-slate-50"
              style={{
                borderColor: config.provider === provider.value ? '#3b82f6' : '#e2e8f0'
              }}
            >
              <input
                type="radio"
                name="provider"
                value={provider.value}
                checked={config.provider === provider.value}
                onChange={(e) => handleChange('provider', e.target.value)}
                className="mt-1 w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-700">{provider.label}</div>
                <div className="text-sm text-slate-500">{provider.description}</div>
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* API 配置 */}
      {selectedProvider && (selectedProvider.value === 'tavily' || selectedProvider.value === 'serper') && (
        <Card title="API 配置" description="配置搜索引擎 API 密钥">
          <div className="space-y-4">
            <Input
              label="API Key"
              type="password"
              value={config.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              placeholder="输入 API Key"
              required
            />
            {selectedProvider.value === 'tavily' && (
              <p className="text-sm text-slate-500">
                获取 API Key: <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">https://tavily.com</a>
              </p>
            )}
            {selectedProvider.value === 'serper' && (
              <p className="text-sm text-slate-500">
                获取 API Key: <a href="https://serper.dev" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">https://serper.dev</a> (有免费额度)
              </p>
            )}
          </div>
        </Card>
      )}

      {/* SearXNG 配置 */}
      {selectedProvider && selectedProvider.value === 'searxng' && (
        <Card title="SearXNG 配置" description="配置 SearXNG 实例">
          <div className="space-y-4">
            <Input
              label="实例 URL"
              value={config.searxngInstanceUrl || ''}
              onChange={(e) => handleChange('searxngInstanceUrl', e.target.value)}
              placeholder="https://searx.be (留空使用公共实例)"
            />
            <p className="text-sm text-slate-500">
              公共实例列表: <a href="https://searx.space" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">https://searx.space</a>
            </p>
          </div>
        </Card>
      )}

      {/* 搜索参数 */}
      <Card title="搜索参数" description="配置搜索行为">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              最大结果数: {config.maxResults}
            </label>
            <input
              type="range"
              min="3"
              max="10"
              value={config.maxResults}
              onChange={(e) => handleChange('maxResults', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>3</span>
              <span>10</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">搜索深度</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="searchDepth"
                  value="basic"
                  checked={config.searchDepth === 'basic'}
                  onChange={(e) => handleChange('searchDepth', e.target.value)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-700">基础 (快速)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="searchDepth"
                  value="advanced"
                  checked={config.searchDepth === 'advanced'}
                  onChange={(e) => handleChange('searchDepth', e.target.value)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-700">深度 (详细)</span>
              </label>
            </div>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeImages}
              onChange={(e) => handleChange('includeImages', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-slate-700">包含图片结果</span>
          </label>
        </div>
      </Card>

      {/* 测试搜索 */}
      <Card title="测试搜索" description="测试搜索功能是否正常工作">
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="输入搜索查询"
              className="flex-1"
            />
            <Button onClick={handleTest} disabled={testing || !config.enabled}>
              {testing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              测试搜索
            </Button>
          </div>

          {testError && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">{testError}</div>
            </div>
          )}

          {testResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>找到 {testResults.length} 条结果</span>
              </div>
              {testResults.map((result, index) => (
                <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-medium text-slate-800">{result.title}</div>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:underline"
                  >
                    {result.url}
                  </a>
                  <p className="text-sm text-slate-600 mt-1">{result.snippet}</p>
                  {result.score && (
                    <div className="text-xs text-slate-500 mt-1">相关度: {(result.score * 100).toFixed(0)}%</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
