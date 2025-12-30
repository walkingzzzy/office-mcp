/**
 * Theme Provider 包装器
 * 已迁移到纯 Tailwind，移除 Fluent UI 依赖
 * 支持浅色/深色主题切换
 */

import { FC, ReactNode, useEffect } from 'react'

import { TooltipProvider } from '@/components/ui/tooltip'
import { useThemeStore } from '../../store/themeStore'

export interface FluentProviderProps {
  children: ReactNode
}

export const FluentProvider: FC<FluentProviderProps> = ({ children }) => {
  // 获取当前主题
  const effectiveTheme = useThemeStore((state) => state.effectiveTheme)
  const initTheme = useThemeStore((state) => state.initTheme)

  // 初始化主题
  useEffect(() => {
    initTheme()
  }, [initTheme])

  // 同步主题到 document
  useEffect(() => {
    const root = document.documentElement
    if (effectiveTheme === 'dark') {
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
    } else {
      root.classList.remove('dark')
      root.setAttribute('data-theme', 'light')
    }
    console.log('[ThemeProvider] Theme applied:', effectiveTheme)
  }, [effectiveTheme])

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-full w-full flex flex-col overflow-hidden relative">
        {children}
      </div>
    </TooltipProvider>
  )
}
