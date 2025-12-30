/**
 * 主题上下文 - 支持多主题切换
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// 主题类型定义
export type ThemeMode = 'dark' | 'light'
export type ThemeColor = 'indigo' | 'cyan' | 'emerald' | 'rose' | 'amber' | 'violet'

export interface ThemeConfig {
  mode: ThemeMode
  color: ThemeColor
  glassEffect: boolean
  animations: boolean
}

interface ThemeContextType {
  theme: ThemeConfig
  setTheme: (theme: Partial<ThemeConfig>) => void
  toggleMode: () => void
}

const defaultTheme: ThemeConfig = {
  mode: 'dark',
  color: 'indigo',
  glassEffect: true,
  animations: true,
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// 主题颜色配置
const colorPalettes: Record<ThemeColor, { primary: string; accent: string; glow: string }> = {
  indigo: {
    primary: '99, 102, 241',    // #6366f1
    accent: '20, 184, 166',     // #14b8a6
    glow: '99, 102, 241',
  },
  cyan: {
    primary: '6, 182, 212',     // #06b6d4
    accent: '168, 85, 247',     // #a855f7
    glow: '6, 182, 212',
  },
  emerald: {
    primary: '16, 185, 129',    // #10b981
    accent: '59, 130, 246',     // #3b82f6
    glow: '16, 185, 129',
  },
  rose: {
    primary: '244, 63, 94',     // #f43f5e
    accent: '251, 146, 60',     // #fb923c
    glow: '244, 63, 94',
  },
  amber: {
    primary: '245, 158, 11',    // #f59e0b
    accent: '239, 68, 68',      // #ef4444
    glow: '245, 158, 11',
  },
  violet: {
    primary: '139, 92, 246',    // #8b5cf6
    accent: '236, 72, 153',     // #ec4899
    glow: '139, 92, 246',
  },
}

// 模式配置
const modeConfigs: Record<ThemeMode, {
  bg: string
  bgSecondary: string
  surface: string
  surfaceHover: string
  text: string
  textSecondary: string
  textMuted: string
  border: string
}> = {
  dark: {
    bg: '15, 23, 42',           // #0f172a
    bgSecondary: '30, 27, 75',  // #1e1b4b
    surface: '30, 41, 59',      // #1e293b
    surfaceHover: '51, 65, 85', // #334155
    text: '226, 232, 240',      // #e2e8f0
    textSecondary: '148, 163, 184', // #94a3b8
    textMuted: '100, 116, 139', // #64748b
    border: '51, 65, 85',       // #334155
  },
  light: {
    bg: '248, 250, 252',        // #f8fafc
    bgSecondary: '241, 245, 249', // #f1f5f9
    surface: '255, 255, 255',   // #ffffff
    surfaceHover: '241, 245, 249', // #f1f5f9
    text: '15, 23, 42',         // #0f172a
    textSecondary: '71, 85, 105', // #475569
    textMuted: '100, 116, 139', // #64748b
    border: '226, 232, 240',    // #e2e8f0
  },
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('theme-config')
    return saved ? { ...defaultTheme, ...JSON.parse(saved) } : defaultTheme
  })

  // 应用主题到 CSS 变量
  useEffect(() => {
    const root = document.documentElement
    const colors = colorPalettes[theme.color]
    const mode = modeConfigs[theme.mode]

    // 颜色变量
    root.style.setProperty('--color-primary', colors.primary)
    root.style.setProperty('--color-accent', colors.accent)
    root.style.setProperty('--color-glow', colors.glow)

    // 模式变量
    root.style.setProperty('--color-bg', mode.bg)
    root.style.setProperty('--color-bg-secondary', mode.bgSecondary)
    root.style.setProperty('--color-surface', mode.surface)
    root.style.setProperty('--color-surface-hover', mode.surfaceHover)
    root.style.setProperty('--color-text', mode.text)
    root.style.setProperty('--color-text-secondary', mode.textSecondary)
    root.style.setProperty('--color-text-muted', mode.textMuted)
    root.style.setProperty('--color-border', mode.border)

    // 效果开关
    root.style.setProperty('--glass-blur', theme.glassEffect ? '12px' : '0px')
    root.style.setProperty('--animation-duration', theme.animations ? '1' : '0')

    // 设置 data 属性用于 Tailwind
    root.setAttribute('data-theme', theme.mode)
    root.setAttribute('data-color', theme.color)

    // 保存到本地存储
    localStorage.setItem('theme-config', JSON.stringify(theme))
  }, [theme])

  const setTheme = (newTheme: Partial<ThemeConfig>) => {
    setThemeState(prev => ({ ...prev, ...newTheme }))
  }

  const toggleMode = () => {
    setThemeState(prev => ({
      ...prev,
      mode: prev.mode === 'dark' ? 'light' : 'dark'
    }))
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// 主题颜色选项（用于 UI 展示）
export const themeColorOptions: { value: ThemeColor; label: string; preview: string }[] = [
  { value: 'indigo', label: '靛蓝科技', preview: '#6366f1' },
  { value: 'cyan', label: '青色未来', preview: '#06b6d4' },
  { value: 'emerald', label: '翡翠自然', preview: '#10b981' },
  { value: 'rose', label: '玫瑰活力', preview: '#f43f5e' },
  { value: 'amber', label: '琥珀温暖', preview: '#f59e0b' },
  { value: 'violet', label: '紫罗兰梦', preview: '#8b5cf6' },
]
