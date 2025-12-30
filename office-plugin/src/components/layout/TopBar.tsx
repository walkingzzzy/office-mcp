/**
 * TopBar - 简化的顶部栏组件
 * 包含品牌Logo、连接状态和模型选择器
 * 
 * 更新: 与主应用 (office-local-bridge) 视觉统一
 * - 使用玻璃态效果
 * - 渐变品牌文字
 * - 统一的状态指示器动画
 */

import {
  CheckmarkRegular,
  ChevronDownRegular,
  ErrorCircleRegular,
  NavigationRegular,
  SettingsRegular,
  WeatherMoonRegular,
  WeatherSunnyRegular
} from '@fluentui/react-icons'
import React, { useState, useMemo } from 'react'

import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/themeStore'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../ui/tooltip'
import { BrandAvatar } from '../atoms/BrandAvatar'

// ==================== 类型定义 ====================

export interface ModelOption {
  id: string
  name: string
  provider: string
  capabilities?: {
    vision?: boolean
    reasoning?: boolean
    tools?: boolean
    webSearch?: boolean
  }
}

export interface TopBarProps {
  models: ModelOption[]
  selectedModelId: string
  defaultModelId?: string
  onModelChange: (modelId: string) => void
  onSetDefault?: (modelId: string) => void
  isConnected: boolean
  isLoading?: boolean
  onMenuClick?: () => void
}

// ==================== 模型选择器组件 ====================

interface ModelSelectorProps {
  models: ModelOption[]
  selectedModelId: string
  defaultModelId?: string
  onSelect: (modelId: string) => void
  onSetDefault?: (modelId: string) => void
  isDisabled?: boolean
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModelId,
  defaultModelId,
  onSelect,
  onSetDefault,
  isDisabled = false
}) => {
  const [open, setOpen] = useState(false)

  const selectedModel = useMemo(() => models.find(m => m.id === selectedModelId), [models, selectedModelId])

  const groupedModels = useMemo(() => {
    const groups: Record<string, ModelOption[]> = {}
    models.forEach(model => {
      if (!groups[model.provider]) {
        groups[model.provider] = []
      }
      groups[model.provider].push(model)
    })
    return groups
  }, [models])

  const hasNoModels = models.length === 0
  const displayName = selectedModel
    ? (selectedModel.name.length > 12 ? `${selectedModel.name.slice(0, 10)}…` : selectedModel.name)
    : hasNoModels
      ? '配置模型'
      : '选择模型'

  // 当没有模型时，显示带 Tooltip 的禁用按钮（增强视觉反馈）
  if (hasNoModels) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              className={cn(
                'h-9 gap-2 rounded-full border-2 border-amber-300 bg-amber-50/80 px-4 text-sm font-medium',
                'shadow-md shadow-amber-100/50',
                'dark:border-amber-600 dark:bg-amber-900/40 dark:shadow-amber-900/30',
                'cursor-help animate-pulse-subtle'
              )}>
              <SettingsRegular className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{displayName}</span>
              <ErrorCircleRegular className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[260px] text-center p-3">
            <p className="text-sm font-semibold text-foreground">需要配置 AI 模型</p>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              请在 office-local-bridge 桌面端添加 AI 服务提供商和模型
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isDisabled}
          className={cn(
            'h-9 gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium shadow-sm',
            'hover:border-gray-300 hover:bg-gray-50',
            'dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700',
            isDisabled && 'opacity-60'
          )}>
          <span className="text-sm text-foreground truncate">{displayName}</span>
          <span className="rounded-md bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-600">
            快捷
          </span>
          <ChevronDownRegular className="h-4 w-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-2xl p-2">
        {Object.entries(groupedModels).map(([provider, providerModels], index) => (
          <div key={provider} className="space-y-1">
            <DropdownMenuLabel className="text-xs text-muted-foreground">{provider}</DropdownMenuLabel>
            {providerModels.map(model => {
              const isDefault = defaultModelId === model.id
              const isSelected = selectedModelId === model.id
              return (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => {
                    onSelect(model.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-3 py-2 text-sm',
                    isSelected && 'bg-primary/10 text-primary'
                  )}>
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground">{model.capabilities?.tools ? '支持工具' : '纯对话'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDefault && <span className="rounded-full bg-primary/10 px-2 text-[11px] text-primary">默认</span>}
                    {isSelected && <CheckmarkRegular className="h-4 w-4 text-primary" />}
                    {onSetDefault && !isDefault && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSetDefault(model.id)
                        }}
                        className="text-[11px] text-muted-foreground hover:text-primary">
                        设为默认
                      </button>
                    )}
                  </div>
                </DropdownMenuItem>
              )
            })}
            {index < Object.keys(groupedModels).length - 1 && <DropdownMenuSeparator className="my-2" />}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ==================== 连接状态指示器 ====================

interface ConnectionStatusProps {
  isConnected: boolean
  isLoading: boolean
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected, isLoading }) => {
  const statusText = isLoading ? '加载中' : isConnected ? 'AI助手在线' : '未连接'
  
  return (
    <div className="flex items-center gap-1.5">
      {/* 状态指示器 - 与主应用一致的动画效果 */}
      <div className="relative flex h-2 w-2">
        {isConnected && !isLoading && (
          <span 
            className="absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ 
              backgroundColor: 'rgb(var(--color-accent-rgb))',
              animation: 'pulse-ring 2s ease-out infinite'
            }} 
          />
        )}
        <span 
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ 
            backgroundColor: isLoading 
              ? '#f59e0b' 
              : isConnected 
                ? 'rgb(var(--color-accent-rgb))' 
                : 'rgb(var(--color-text-muted-rgb))' 
          }} 
        />
      </div>
      <span className="text-xs text-theme-muted">{statusText}</span>
    </div>
  )
}

// ==================== 主题切换按钮 ====================

const ThemeToggleButton: React.FC = () => {
  const effectiveTheme = useThemeStore((state) => state.effectiveTheme)
  const setTheme = useThemeStore((state) => state.setTheme)

  const toggleTheme = () => {
    const newTheme = effectiveTheme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={cn(
              'h-9 w-9 flex-shrink-0 rounded-xl border border-transparent',
              'hover:border-[rgba(var(--color-primary-rgb),0.2)] hover:bg-[rgba(var(--color-primary-rgb),0.05)]',
              'transition-all duration-200 hover:scale-105 active:scale-95',
              effectiveTheme === 'light' && 'bg-amber-50/50 dark:bg-transparent'
            )}
          >
            {effectiveTheme === 'dark' ? (
              <WeatherSunnyRegular className="h-4 w-4 text-amber-500" />
            ) : (
              <WeatherMoonRegular className="h-4 w-4 text-indigo-500" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">
            {effectiveTheme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ==================== 主组件 ====================

export const TopBar: React.FC<TopBarProps> = ({
  models,
  selectedModelId,
  defaultModelId,
  onModelChange,
  onSetDefault,
  isConnected,
  isLoading = false,
  onMenuClick
}) => {
  return (
    <header className="relative z-10 flex h-14 items-center justify-between px-4 glass-header">
      <div className="flex items-center gap-2 min-w-0">
        {onMenuClick && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-9 w-9 flex-shrink-0 rounded-xl border border-transparent hover:border-[rgba(var(--color-primary-rgb),0.2)] hover:bg-[rgba(var(--color-primary-rgb),0.05)]">
            <NavigationRegular className="h-4 w-4 text-foreground" />
          </Button>
        )}
        <div className="flex items-center gap-2 min-w-0">
          {/* Logo 容器 - 添加发光效果 */}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-white p-1.5 border border-[rgba(var(--color-primary-rgb),0.15)] shadow-sm dark:bg-gray-800">
              <BrandAvatar size={24} isAI useLogo className="w-full h-full" />
            </div>
            {/* 发光背景 */}
            <div
              className="absolute -inset-1 rounded-xl blur-lg -z-10"
              style={{ backgroundColor: 'rgba(var(--color-primary-rgb), 0.15)' }}
            />
          </div>
          <div className="flex flex-col min-w-0">
            {/* 品牌名 - 使用渐变文字，窄屏下隐藏 */}
            <span className="hidden min-[340px]:block text-sm font-semibold gradient-text truncate">武汉问津</span>
            <span className="block min-[340px]:hidden text-xs font-semibold gradient-text">问津</span>
            <ConnectionStatus isConnected={isConnected} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* 右侧操作区 */}
      <div className="flex items-center gap-2">
        {/* 主题切换按钮 */}
        <ThemeToggleButton />

        {/* 模型选择器 */}
        <ModelSelector
          models={models}
          selectedModelId={selectedModelId}
          defaultModelId={defaultModelId}
          onSelect={onModelChange}
          onSetDefault={onSetDefault}
          isDisabled={!isConnected || isLoading || models.length === 0}
        />
      </div>
    </header>
  )
}

export default TopBar
