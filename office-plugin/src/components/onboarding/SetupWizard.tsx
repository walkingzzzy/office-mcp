/**
 * 首次使用设置向导
 * 引导用户完成初始配置
 */

import React, { useState } from 'react'
import { useLocalConfigStore } from '../../store/localConfigStore'
import type { AIProviderConfig } from '../../services/config/LocalConfigManager'

interface SetupWizardProps {
  onComplete: () => void
  onSkip?: () => void
}

type WizardStep = 'welcome' | 'bridge' | 'provider' | 'complete'

const PROVIDER_TYPES = [
  { value: 'openai', label: 'OpenAI', description: 'GPT-4, GPT-3.5 等模型' },
  { value: 'azure', label: 'Azure OpenAI', description: '微软 Azure 托管的 OpenAI' },
  { value: 'anthropic', label: 'Anthropic', description: 'Claude 系列模型' },
  { value: 'custom', label: '自定义', description: 'OpenAI 兼容的自定义端点' }
] as const

export const SetupWizard: React.FC<SetupWizardProps> = ({
  onComplete,
  onSkip
}) => {
  const [step, setStep] = useState<WizardStep>('welcome')
  const [bridgeUrl, setBridgeUrl] = useState('http://localhost:3001')
  const [providerType, setProviderType] = useState<string>('openai')
  const [providerName, setProviderName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [error, setError] = useState('')

  const { setBridgeUrl: saveBridgeUrl, addProvider } = useLocalConfigStore()

  const handleNext = async () => {
    setError('')

    switch (step) {
      case 'welcome':
        setStep('bridge')
        break

      case 'bridge':
        try {
          const response = await fetch(`${bridgeUrl}/health`, {
            signal: AbortSignal.timeout(5000)
          })
          if (response.ok) {
            await saveBridgeUrl(bridgeUrl)
            setStep('provider')
          } else {
            setError('无法连接到桥接服务，请确保服务已启动')
          }
        } catch {
          setError('无法连接到桥接服务，请检查地址是否正确')
        }
        break

      case 'provider':
        if (!providerName.trim()) {
          setError('请输入提供商名称')
          return
        }
        if (!apiKey.trim()) {
          setError('请输入 API Key')
          return
        }

        const config: Omit<AIProviderConfig, 'id'> = {
          type: providerType as AIProviderConfig['type'],
          name: providerName,
          apiKey,
          enabled: true
        }

        if (providerType === 'custom' && baseUrl) {
          config.baseUrl = baseUrl
        }

        await addProvider(config as AIProviderConfig)
        setStep('complete')
        break

      case 'complete':
        onComplete()
        break
    }
  }

  const handleBack = () => {
    setError('')
    switch (step) {
      case 'bridge':
        setStep('welcome')
        break
      case 'provider':
        setStep('bridge')
        break
      case 'complete':
        setStep('provider')
        break
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 进度指示器 */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-6">
            {['welcome', 'bridge', 'provider', 'complete'].map((s, i) => (
              <React.Fragment key={s}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    step === s
                      ? 'bg-blue-500 text-white'
                      : i < ['welcome', 'bridge', 'provider', 'complete'].indexOf(step)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i + 1}
                </div>
                {i < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      i < ['welcome', 'bridge', 'provider', 'complete'].indexOf(step)
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="px-6 pb-6">
          {step === 'welcome' && (
            <div className="text-center">
              <div className="text-4xl mb-4">👋</div>
              <h2 className="text-xl font-semibold mb-2">欢迎使用 Office AI 助手</h2>
              <p className="text-gray-600 mb-6">
                让我们花几分钟完成初始设置，以便您可以开始使用 AI 功能。
              </p>
            </div>
          )}

          {step === 'bridge' && (
            <div>
              <h2 className="text-xl font-semibold mb-2">配置桥接服务</h2>
              <p className="text-gray-600 mb-4 text-sm">
                桥接服务用于代理 AI 请求和管理 Office 工具。请确保服务已启动。
              </p>
              <div>
                <label className="block text-sm font-medium mb-1">
                  桥接服务地址
                </label>
                <input
                  type="url"
                  value={bridgeUrl}
                  onChange={(e) => setBridgeUrl(e.target.value)}
                  placeholder="http://localhost:3001"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          )}

          {step === 'provider' && (
            <div>
              <h2 className="text-xl font-semibold mb-2">配置 AI 提供商</h2>
              <p className="text-gray-600 mb-4 text-sm">
                选择您的 AI 服务提供商并输入 API Key。
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">提供商类型</label>
                  <select
                    value={providerType}
                    onChange={(e) => setProviderType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    {PROVIDER_TYPES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label} - {p.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">名称</label>
                  <input
                    type="text"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    placeholder="我的 OpenAI"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                {providerType === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      API 地址
                    </label>
                    <input
                      type="url"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://api.example.com/v1"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-xl font-semibold mb-2">设置完成！</h2>
              <p className="text-gray-600 mb-6">
                您已完成初始配置，现在可以开始使用 AI 助手了。
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* 按钮区域 */}
          <div className="flex justify-between mt-6">
            <div>
              {step !== 'welcome' && step !== 'complete' && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  上一步
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {onSkip && step !== 'complete' && (
                <button
                  onClick={onSkip}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700"
                >
                  跳过
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {step === 'complete' ? '开始使用' : '下一步'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SetupWizard
