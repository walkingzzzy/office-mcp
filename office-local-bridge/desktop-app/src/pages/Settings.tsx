/**
 * 系统设置页面
 * 配置应用行为和服务参数
 */

import { useEffect, useState } from 'react'
import {
  Save,
  RotateCcw,
  FolderOpen,
  Loader2,
  Palette,
  Sun,
  Moon,
  Sparkles,
  Zap
} from 'lucide-react'
import clsx from 'clsx'
import { Card, Button, Input, Select } from '../components'
import { getConfig, saveConfig, enableAutostart, disableAutostart } from '../services/tauri'
import { useTheme, themeColorOptions, type ThemeColor } from '../contexts/ThemeContext'
import type { BridgeConfig } from '../types'

const LOG_LEVELS = [
  { value: 'debug', label: 'Debug' },
  { value: 'info', label: 'Info' },
  { value: 'warn', label: 'Warn' },
  { value: 'error', label: 'Error' },
]

const DEFAULT_CONFIG: BridgeConfig = {
  version: 1,
  port: 3001,
  host: 'localhost',
  logLevel: 'info',
  autoStart: true,
  minimizeToTray: true,
}

// 主题预设
const themePresets = [
  { name: '深邃科技', mode: 'dark' as const, color: 'indigo' as ThemeColor, icon: Moon },
  { name: '清新明亮', mode: 'light' as const, color: 'cyan' as ThemeColor, icon: Sun },
  { name: '自然森林', mode: 'dark' as const, color: 'emerald' as ThemeColor, icon: Sparkles },
  { name: '活力玫瑰', mode: 'light' as const, color: 'rose' as ThemeColor, icon: Zap },
]

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const [config, setConfig] = useState<BridgeConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await getConfig()
      if (res.success && res.data) {
        setConfig(res.data)
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

  const handleChange = (field: keyof BridgeConfig, value: unknown) => {
    setConfig({ ...config, [field]: value })
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await saveConfig(config)
      if (res.success) {
        // 同步开机自启设置
        if (config.autoStart) {
          await enableAutostart()
        } else {
          await disableAutostart()
        }
        setHasChanges(false)
        alert('配置已保存')
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

  const handleReset = () => {
    if (confirm('确定要重置为默认配置吗？')) {
      setConfig(DEFAULT_CONFIG)
      setHasChanges(true)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold page-title">系统设置</h1>
          <p className="page-subtitle mt-1">配置应用行为和服务参数</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="secondary" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            重置
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            保存
          </Button>
        </div>
      </div>

      {/* 主题设置 */}
      <Card title="外观主题" description="自定义应用的视觉风格">
        <div className="space-y-6">
          {/* 主题预设 */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-3">快速预设</label>
            <div className="grid grid-cols-2 gap-3">
              {themePresets.map((preset) => {
                const isSelected = theme.mode === preset.mode && theme.color === preset.color
                const presetColor = themeColorOptions.find(c => c.value === preset.color)?.preview
                return (
                  <button
                    key={preset.name}
                    onClick={() => setTheme({ mode: preset.mode, color: preset.color })}
                    className={clsx(
                      'relative flex items-center p-3 rounded-xl border-2 transition-all duration-200',
                      isSelected
                        ? 'border-theme-primary'
                        : 'border-transparent bg-theme-surface hover:border-theme-primary/50'
                    )}
                    style={isSelected ? { 
                      borderColor: presetColor,
                      background: `linear-gradient(135deg, ${presetColor}15, transparent)`
                    } : {}}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                      style={{ 
                        backgroundColor: presetColor + '20',
                        color: presetColor
                      }}
                    >
                      <preset.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-theme">{preset.name}</span>
                    {/* 选中勾选图标 */}
                    {isSelected && (
                      <svg className="w-4 h-4 absolute right-3" viewBox="0 0 20 20" fill="currentColor" style={{ color: presetColor }}>
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 主题模式 */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-3">显示模式</label>
            <div className="flex rounded-xl border border-theme p-1 bg-theme-surface">
              <button
                onClick={() => setTheme({ mode: 'dark' })}
                className={clsx(
                  'flex-1 flex items-center justify-center py-3 px-4 rounded-lg transition-all duration-200',
                  theme.mode === 'dark' 
                    ? 'text-white shadow-md' 
                    : 'text-theme-secondary hover:text-theme'
                )}
                style={theme.mode === 'dark' ? { backgroundColor: `rgb(var(--color-primary))` } : {}}
              >
                <Moon className="w-5 h-5 mr-2" />
                <span className="font-medium">深色模式</span>
              </button>
              <button
                onClick={() => setTheme({ mode: 'light' })}
                className={clsx(
                  'flex-1 flex items-center justify-center py-3 px-4 rounded-lg transition-all duration-200',
                  theme.mode === 'light' 
                    ? 'text-white shadow-md' 
                    : 'text-theme-secondary hover:text-theme'
                )}
                style={theme.mode === 'light' ? { backgroundColor: `rgb(var(--color-primary))` } : {}}
              >
                <Sun className="w-5 h-5 mr-2" />
                <span className="font-medium">浅色模式</span>
              </button>
            </div>
          </div>

          {/* 主题颜色 */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-3">
              <Palette className="w-4 h-4 inline mr-2" />
              主题颜色
            </label>
            <div className="grid grid-cols-3 gap-3">
              {themeColorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setTheme({ color: color.value })}
                  className={clsx(
                    'relative flex items-center p-3 rounded-xl border-2 transition-all duration-200',
                    theme.color === color.value
                      ? 'border-current shadow-lg'
                      : 'border-transparent bg-theme-surface hover:scale-105 hover:border-theme/30'
                  )}
                  style={{ 
                    borderColor: theme.color === color.value ? color.preview : undefined,
                    boxShadow: theme.color === color.value ? `0 4px 20px ${color.preview}40` : undefined
                  }}
                >
                  <div 
                    className="w-6 h-6 rounded-full mr-3 shadow-inner ring-2 ring-white/50"
                    style={{ backgroundColor: color.preview }}
                  />
                  <span className="text-sm text-theme">{color.label}</span>
                  {/* 选中勾选图标 */}
                  {theme.color === color.value && (
                    <svg className="w-4 h-4 absolute right-3" viewBox="0 0 20 20" fill="currentColor" style={{ color: color.preview }}>
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 效果开关 */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl bg-theme-surface hover:bg-theme-surface-hover transition-colors">
              <input
                type="checkbox"
                checked={theme.glassEffect}
                onChange={(e) => setTheme({ glassEffect: e.target.checked })}
                className="w-4 h-4 rounded"
                style={{ accentColor: `rgb(var(--color-primary))` }}
              />
              <div>
                <span className="text-sm font-medium text-theme">毛玻璃效果</span>
                <p className="text-xs text-theme-muted">启用背景模糊的玻璃态效果</p>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl bg-theme-surface hover:bg-theme-surface-hover transition-colors">
              <input
                type="checkbox"
                checked={theme.animations}
                onChange={(e) => setTheme({ animations: e.target.checked })}
                className="w-4 h-4 rounded"
                style={{ accentColor: `rgb(var(--color-primary))` }}
              />
              <div>
                <span className="text-sm font-medium text-theme">动画效果</span>
                <p className="text-xs text-theme-muted">启用界面过渡动画和光效</p>
              </div>
            </label>
          </div>
        </div>
      </Card>

      {/* 服务配置 */}
      <Card title="服务配置" description="HTTP 服务相关设置">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="HTTP 服务端口"
              type="number"
              value={config.port}
              onChange={(e) => handleChange('port', parseInt(e.target.value))}
              hint="默认: 3001"
            />
            <Select
              label="服务地址"
              options={[
                { value: 'localhost', label: 'localhost (仅本机)' },
                { value: '0.0.0.0', label: '0.0.0.0 (允许外部访问)' },
              ]}
              value={config.host}
              onChange={(e) => handleChange('host', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* 应用行为 */}
      <Card title="应用行为" description="窗口和启动相关设置">
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl bg-theme-surface hover:bg-theme-surface-hover transition-colors">
            <input
              type="checkbox"
              checked={config.autoStart}
              onChange={(e) => handleChange('autoStart', e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: `rgb(var(--color-primary))` }}
            />
            <div>
              <span className="text-sm font-medium text-theme">开机自动启动</span>
              <p className="text-xs text-theme-muted">系统启动时自动运行应用</p>
            </div>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl bg-theme-surface hover:bg-theme-surface-hover transition-colors">
            <input
              type="checkbox"
              checked={config.minimizeToTray}
              onChange={(e) => handleChange('minimizeToTray', e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: `rgb(var(--color-primary))` }}
            />
            <div>
              <span className="text-sm font-medium text-theme">关闭时最小化到系统托盘</span>
              <p className="text-xs text-theme-muted">点击关闭按钮时最小化到托盘而非退出</p>
            </div>
          </label>
        </div>
      </Card>

      {/* 日志设置 */}
      <Card title="日志设置" description="日志级别和存储配置">
        <div className="space-y-4">
          <Select
            label="日志级别"
            options={LOG_LEVELS}
            value={config.logLevel}
            onChange={(e) => handleChange('logLevel', e.target.value)}
          />

          <div className="p-3 rounded-xl bg-theme-surface">
            <p className="text-sm text-theme-secondary">
              日志文件位置: <code className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'rgba(var(--color-primary), 0.1)', color: 'rgb(var(--color-primary))' }}>~/.office-local-bridge/logs/</code>
            </p>
            <Button variant="ghost" size="sm" className="mt-2">
              <FolderOpen className="w-4 h-4 mr-2" />
              打开日志目录
            </Button>
          </div>
        </div>
      </Card>

      {/* 关于 */}
      <Card title="关于" description="应用版本和相关信息">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-theme-surface">
            <span className="text-sm text-theme-secondary">应用版本</span>
            <span className="text-sm font-medium text-theme">v1.0.0</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-theme-surface">
            <span className="text-sm text-theme-secondary">配置文件位置</span>
            <code className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(var(--color-primary), 0.1)', color: 'rgb(var(--color-primary))' }}>~/.office-local-bridge/</code>
          </div>
        </div>
      </Card>
    </div>
  )
}
