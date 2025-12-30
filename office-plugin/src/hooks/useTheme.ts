/**
 * useTheme Hook - 主题管理钩子
 * 提供主题状态和切换功能
 */

import { useState, useEffect, useCallback } from 'react'
import type { Theme } from '@fluentui/react-components'

import {
  ThemeMode,
  getFluentTheme,
  onThemeChange,
  setDocumentTheme,
  getOfficeTheme,
  getSystemThemePreference
} from '../utils/themeUtils'

export interface UseThemeReturn {
  /** 当前主题模式 */
  mode: ThemeMode
  /** 是否为深色模式 */
  isDark: boolean
  /** Fluent UI 主题对象 */
  theme: Theme
  /** 设置主题模式 */
  setMode: (mode: ThemeMode) => void
  /** 切换深色/浅色模式 */
  toggleMode: () => void
}

const THEME_STORAGE_KEY = 'office-plugin-theme-mode'

/**
 * 获取存储的主题模式
 */
const getStoredThemeMode = (): ThemeMode => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      return stored
    }
  } catch (e) {
    // localStorage 可能不可用
  }
  return 'auto'
}

/**
 * 存储主题模式
 */
const storeThemeMode = (mode: ThemeMode): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch (e) {
    // localStorage 可能不可用
  }
}

/**
 * 计算当前是否为深色模式
 */
const calculateIsDark = (mode: ThemeMode): boolean => {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  
  // auto 模式: 优先检测 Office 主题，然后系统主题
  const officeTheme = getOfficeTheme()
  if (officeTheme === 'dark') return true
  
  return getSystemThemePreference() === 'dark'
}

export const useTheme = (): UseThemeReturn => {
  const [mode, setModeState] = useState<ThemeMode>(getStoredThemeMode)
  const [isDark, setIsDark] = useState(() => calculateIsDark(mode))

  // 计算 Fluent 主题
  const theme = getFluentTheme(mode)

  // 设置主题模式
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode)
    storeThemeMode(newMode)
    const newIsDark = calculateIsDark(newMode)
    setIsDark(newIsDark)
    setDocumentTheme(newIsDark)
  }, [])

  // 切换深色/浅色模式
  const toggleMode = useCallback(() => {
    const newMode = isDark ? 'light' : 'dark'
    setMode(newMode)
  }, [isDark, setMode])

  // 监听系统/Office 主题变化 (仅 auto 模式)
  useEffect(() => {
    if (mode !== 'auto') return

    const cleanup = onThemeChange((systemIsDark) => {
      setIsDark(systemIsDark)
      setDocumentTheme(systemIsDark)
    })

    return cleanup
  }, [mode])

  // 初始化文档主题
  useEffect(() => {
    setDocumentTheme(isDark)
  }, [isDark])

  return {
    mode,
    isDark,
    theme,
    setMode,
    toggleMode
  }
}

export default useTheme
