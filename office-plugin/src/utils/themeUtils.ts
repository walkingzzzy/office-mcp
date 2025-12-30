/**
 * Theme Utilities - 主题工具函数
 * 处理 Office 主题检测和 Fluent UI 主题切换
 */

import {
  webLightTheme,
  webDarkTheme,
  teamsLightTheme,
  teamsDarkTheme,
  type Theme
} from '@fluentui/react-components'
import Logger from './logger'

const logger = new Logger('ThemeUtils')

export type ThemeMode = 'light' | 'dark' | 'auto'
export type OfficeTheme = 'colorful' | 'dark' | 'white' | 'gray'

/**
 * 检测 Office 当前主题
 * Office.context.officeTheme 可能返回的值:
 * - colorful: 彩色主题 (默认)
 * - dark: 深色主题
 * - white: 白色主题
 * - gray: 灰色主题 (已弃用)
 */
export const getOfficeTheme = (): OfficeTheme => {
  try {
    // @ts-ignore - Office API
    if (typeof Office !== 'undefined' && Office.context?.officeTheme) {
      // @ts-ignore
      const theme = Office.context.officeTheme
      
      // 检测背景亮度来判断深浅
      if (theme.bodyBackgroundColor) {
        const brightness = getColorBrightness(theme.bodyBackgroundColor)
        return brightness < 128 ? 'dark' : 'colorful'
      }
    }
  } catch (e) {
    logger.warn('Failed to detect Office theme', { error: e })
  }
  
  return 'colorful'
}

/**
 * 检测系统主题偏好
 */
export const getSystemThemePreference = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

/**
 * 根据主题模式获取 Fluent UI 主题对象
 */
export const getFluentTheme = (mode: ThemeMode): Theme => {
  let isDark = false

  if (mode === 'auto') {
    const officeTheme = getOfficeTheme()
    isDark = officeTheme === 'dark' || getSystemThemePreference() === 'dark'
  } else {
    isDark = mode === 'dark'
  }

  // 使用 Teams 主题以获得更好的 Office 集成体验
  return isDark ? teamsDarkTheme : teamsLightTheme
}

/**
 * 计算颜色亮度 (0-255)
 * 使用感知亮度公式: 0.299*R + 0.587*G + 0.114*B
 */
const getColorBrightness = (color: string): number => {
  // 移除 # 前缀
  const hex = color.replace('#', '')
  
  // 解析 RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b)
}

/**
 * 监听主题变化
 */
export const onThemeChange = (callback: (isDark: boolean) => void): (() => void) => {
  const handlers: (() => void)[] = []

  // 监听系统主题变化
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => callback(e.matches)
    mediaQuery.addEventListener('change', handler)
    handlers.push(() => mediaQuery.removeEventListener('change', handler))
  }

  // 监听 Office 主题变化
  try {
    // @ts-ignore
    if (typeof Office !== 'undefined' && Office.context?.officeTheme) {
      // @ts-ignore
      Office.context.officeTheme.onChanged = () => {
        callback(getOfficeTheme() === 'dark')
      }
      handlers.push(() => {
        // @ts-ignore
        Office.context.officeTheme.onChanged = null
      })
    }
  } catch (e) {
    // Ignore Office API errors
  }

  // 返回清理函数
  return () => {
    handlers.forEach(h => h())
  }
}

/**
 * 设置 HTML 根元素的主题属性
 * 用于 Tailwind CSS dark mode 支持
 */
export const setDocumentTheme = (isDark: boolean): void => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', isDark)
  }
}
