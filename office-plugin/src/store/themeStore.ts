/**
 * 主题管理 Store
 * 管理浅色/深色主题切换和持久化
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import Logger from '../utils/logger'

const logger = new Logger('ThemeStore')

export type Theme = 'light' | 'dark' | 'auto'

interface ThemeState {
  /**
   * 用户选择的主题
   */
  theme: Theme

  /**
   * 实际生效的主题（auto 会解析为 light 或 dark）
   */
  effectiveTheme: 'light' | 'dark'

  /**
   * 设置主题
   */
  setTheme: (theme: Theme) => void

  /**
   * 初始化主题（应用启动时调用）
   */
  initTheme: () => void
}

/**
 * 获取系统主题偏好
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * 应用主题到 DOM
 */
function applyTheme(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return

  // 设置 data-theme 属性（用于 CSS 选择器）
  document.documentElement.setAttribute('data-theme', theme)

  // 设置 theme-mode 属性（与主应用保持一致）
  document.documentElement.setAttribute('theme-mode', theme)

  // 可选：添加过渡效果类
  document.documentElement.classList.add('theme-transitioning')
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning')
  }, 300)
}

/**
 * 主题 Store
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      effectiveTheme: 'light',

      setTheme: (theme: Theme) => {
        // 计算实际生效的主题
        const effectiveTheme = theme === 'auto' ? getSystemTheme() : theme

        // 更新状态
        set({ theme, effectiveTheme })

        // 应用主题到 DOM
        applyTheme(effectiveTheme)

        logger.info('主题已切换', { theme, effectiveTheme })
      },

      initTheme: () => {
        const { theme } = get()
        const effectiveTheme = theme === 'auto' ? getSystemTheme() : theme

        // 更新状态
        set({ effectiveTheme })

        // 应用主题到 DOM
        applyTheme(effectiveTheme)

        // 监听系统主题变化（仅在 auto 模式下）
        if (theme === 'auto' && typeof window !== 'undefined') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          const handleChange = (e: MediaQueryListEvent) => {
            const newEffectiveTheme = e.matches ? 'dark' : 'light'
            set({ effectiveTheme: newEffectiveTheme })
            applyTheme(newEffectiveTheme)
            logger.info('系统主题已变化', { newEffectiveTheme })
          }

          mediaQuery.addEventListener('change', handleChange)

          // 返回清理函数（可选）
          return () => {
            mediaQuery.removeEventListener('change', handleChange)
          }
        }

        logger.info('主题已初始化', { theme, effectiveTheme })
      },
    }),
    {
      name: 'wuhanwenjin-office-theme', // localStorage key
      // 只持久化 theme，不持久化 effectiveTheme
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)

/**
 * 主题工具函数
 */
export const themeUtils = {
  /**
   * 获取当前主题
   */
  getCurrentTheme: () => useThemeStore.getState().theme,

  /**
   * 获取实际生效的主题
   */
  getEffectiveTheme: () => useThemeStore.getState().effectiveTheme,

  /**
   * 切换主题（在 light 和 dark 之间切换）
   */
  toggleTheme: () => {
    const currentTheme = useThemeStore.getState().effectiveTheme
    const newTheme = currentTheme === 'light' ? 'dark' : 'light'
    useThemeStore.getState().setTheme(newTheme)
  },
}

