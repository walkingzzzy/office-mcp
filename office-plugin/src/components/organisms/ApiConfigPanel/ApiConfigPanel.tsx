/**
 * API 配置面板
 * 允许用户动态配置 API 地址和其他设置
 */

import {
  Button,
  Card,
  CardHeader,
  Divider,
  Input,
  Spinner,
  Text} from '@fluentui/react-components'
import {
  ArrowClockwiseRegular,
  CheckmarkCircleRegular,
  DismissRegular,
  SettingsRegular,
  WarningRegular} from '@fluentui/react-icons'
import { FC, useEffect,useState } from 'react'

import { aiService } from '../../../services/ai'
import { apiClient } from '../../../services/api/client'

export interface ApiConfigPanelProps {
  open: boolean
  onClose: () => void
  onSave?: (config: any) => void
}

interface ConfigState {
  baseUrl: string
  apiKey: string
  timeout: string
  retries: string
}

export const ApiConfigPanel: FC<ApiConfigPanelProps> = ({
  open,
  onClose,
  onSave
}) => {
  const [config, setConfig] = useState<ConfigState>({
    baseUrl: '',
    apiKey: '',
    timeout: '',
    retries: ''
  })
  
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    responseTime?: number
  } | null>(null)

  const [validation, setValidation] = useState<{
    isValid: boolean
    error?: string
  }>({ isValid: true })

  // 初始化配置
  useEffect(() => {
    if (open) {
      const currentConfig = aiService.getConfig()
      setConfig({
        baseUrl: currentConfig.baseUrl,
        apiKey: currentConfig.apiKey,
        timeout: currentConfig.timeout.toString(),
        retries: currentConfig.retries.toString()
      })
      setTestResult(null)
    }
  }, [open])

  // 验证配置
  const validateConfig = async () => {
    try {
      // 基础格式验证
      new URL(config.baseUrl)
      
      const timeout = parseInt(config.timeout)
      const retries = parseInt(config.retries)
      
      if (isNaN(timeout) || timeout <= 0 || timeout > 300000) {
        setValidation({
          isValid: false,
          error: '超时时间必须在 1-300000 毫秒之间'
        })
        return false
      }
      
      if (isNaN(retries) || retries < 0 || retries > 10) {
        setValidation({
          isValid: false,
          error: '重试次数必须在 0-10 之间'
        })
        return false
      }
      
      setValidation({ isValid: true })
      return true
    } catch {
      setValidation({
        isValid: false,
        error: '请输入有效的 URL 格式'
      })
      return false
    }
  }

  // 测试连接
  const testConnection = async () => {
    const isValid = await validateConfig()
    if (!isValid) return

    setTesting(true)
    setTestResult(null)

    try {
      // 临时更新配置进行测试
      const tempConfig = {
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        timeout: parseInt(config.timeout),
        retries: parseInt(config.retries),
        retryDelay: 1000
      }

      aiService.updateConfig(tempConfig)
      apiClient.setConfig({ baseUrl: config.baseUrl })

      const result = await aiService.testConnection()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        message: (error as Error).message
      })
    } finally {
      setTesting(false)
    }
  }

  // 保存配置
  const handleSave = async () => {
    const isValid = await validateConfig()
    if (!isValid) return

    const newConfig = {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      timeout: parseInt(config.timeout),
      retries: parseInt(config.retries),
      retryDelay: 1000
    }

    // 更新服务配置
    aiService.updateConfig(newConfig)
    apiClient.setConfig({ baseUrl: config.baseUrl })

    // 保存到本地存储
    try {
      localStorage.setItem('office-plugin-api-config', JSON.stringify(newConfig))
    } catch (error) {
      console.warn('Failed to save config to localStorage:', error)
    }

    onSave?.(newConfig)
    onClose()
  }

  // 从本地存储加载配置
  useEffect(() => {
    try {
      const saved = localStorage.getItem('office-plugin-api-config')
      if (saved) {
        const savedConfig = JSON.parse(saved)
        if (savedConfig.baseUrl) {
          aiService.updateConfig(savedConfig)
          apiClient.setConfig({ baseUrl: savedConfig.baseUrl })
        }
      }
    } catch (error) {
      console.warn('Failed to load config from localStorage:', error)
    }
  }, [])

  if (!open) return null

  return (
    <Card style={{ 
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '500px',
      maxWidth: '90vw',
      zIndex: 1000,
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
    }}>
      <CardHeader
        header={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SettingsRegular />
            <Text weight="semibold">API 配置</Text>
          </div>
        }
        action={
          <Button
            appearance="subtle"
            size="small"
            icon={<DismissRegular />}
            onClick={onClose}
          />
        }
      />

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* API 基础地址 */}
          <div>
            <Text weight="medium" style={{ marginBottom: '8px', display: 'block' }}>
              API 基础地址 *
            </Text>
            <Input
              value={config.baseUrl}
              onChange={(e, data) => setConfig(prev => ({ ...prev, baseUrl: data.value }))}
              placeholder="http://localhost:3001"
              style={{ width: '100%' }}
            />
            <Text size={200} style={{ color: '#605e5c', marginTop: '4px' }}>
              支持 VITE_API_BASE_URL 环境变量配置
            </Text>
          </div>

          {/* API Key */}
          <div>
            <Text weight="medium" style={{ marginBottom: '8px', display: 'block' }}>
              API Key
            </Text>
            <Input
              type="password"
              value={config.apiKey}
              onChange={(e, data) => setConfig(prev => ({ ...prev, apiKey: data.value }))}
              placeholder="可选，用于身份验证"
              style={{ width: '100%' }}
            />
          </div>

          {/* 超时时间 */}
          <div>
            <Text weight="medium" style={{ marginBottom: '8px', display: 'block' }}>
              超时时间 (毫秒)
            </Text>
            <Input
              type="number"
              value={config.timeout}
              onChange={(e, data) => setConfig(prev => ({ ...prev, timeout: data.value }))}
              placeholder="60000"
              style={{ width: '100%' }}
            />
          </div>

          {/* 重试次数 */}
          <div>
            <Text weight="medium" style={{ marginBottom: '8px', display: 'block' }}>
              重试次数
            </Text>
            <Input
              type="number"
              value={config.retries}
              onChange={(e, data) => setConfig(prev => ({ ...prev, retries: data.value }))}
              placeholder="3"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* 验证错误 */}
        {!validation.isValid && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            backgroundColor: '#fef2f2', 
            borderRadius: '4px',
            border: '1px solid #fecaca'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <WarningRegular style={{ color: '#dc2626' }} />
              <Text size={200} style={{ color: '#dc2626' }}>
                {validation.error}
              </Text>
            </div>
          </div>
        )}

        {/* 测试结果 */}
        {testResult && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            backgroundColor: testResult.success ? '#f0fdf4' : '#fef2f2', 
            borderRadius: '4px',
            border: `1px solid ${testResult.success ? '#bbf7d0' : '#fecaca'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {testResult.success ? (
                <CheckmarkCircleRegular style={{ color: '#16a34a' }} />
              ) : (
                <WarningRegular style={{ color: '#dc2626' }} />
              )}
              <div>
                <Text size={200} style={{
                  color: testResult.success ? '#16a34a' : '#dc2626',
                  display: 'block'
                }}>
                  {testResult.message}
                </Text>
                {testResult.responseTime && (
                  <Text size={200} style={{ color: '#605e5c' }}>
                    响应时间: {testResult.responseTime}ms
                  </Text>
                )}
              </div>
            </div>
          </div>
        )}

        <Divider style={{ margin: '16px 0' }} />

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button
            appearance="secondary"
            onClick={testConnection}
            disabled={testing}
            icon={<ArrowClockwiseRegular />}
          >
            {testing ? <Spinner size="tiny" /> : '测试连接'}
          </Button>
          <Button appearance="primary" onClick={handleSave} disabled={!validation.isValid}>
            保存配置
          </Button>
        </div>

        <Text size={200} style={{ color: '#605e5c', marginTop: '12px' }}>
          💡 配置将保存到本地存储，下次启动时自动加载
        </Text>
      </div>
    </Card>
  )
}