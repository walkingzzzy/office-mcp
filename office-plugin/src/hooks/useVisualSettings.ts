/**
 * useVisualSettings Hook
 * 管理视觉增强配置的持久化存储
 */

import { useCallback,useEffect, useState } from 'react'

import {
  DEFAULT_VISUAL_SETTINGS,
  VISUAL_SETTINGS_STORAGE_KEY,
  VisualEnhancementSettings} from '../types/visualSettings'
import Logger from '../utils/logger'

const logger = new Logger('useVisualSettings')

export function useVisualSettings() {
  const [settings, setSettings] = useState<VisualEnhancementSettings>(DEFAULT_VISUAL_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // 从本地存储加载配置
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VISUAL_SETTINGS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as VisualEnhancementSettings
        setSettings(parsed)
        logger.info('Visual settings loaded from storage', parsed)
      }
    } catch (error) {
      logger.error('Failed to load visual settings', { error })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 更新配置
  const updateSettings = useCallback((newSettings: Partial<VisualEnhancementSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings }

      // 保存到本地存储
      try {
        localStorage.setItem(VISUAL_SETTINGS_STORAGE_KEY, JSON.stringify(updated))
        logger.info('Visual settings updated and saved', updated)
      } catch (error) {
        logger.error('Failed to save visual settings', { error })
      }

      return updated
    })
  }, [])

  // 重置为默认配置
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_VISUAL_SETTINGS)
    try {
      localStorage.setItem(VISUAL_SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_VISUAL_SETTINGS))
      logger.info('Visual settings reset to defaults')
    } catch (error) {
      logger.error('Failed to reset visual settings', { error })
    }
  }, [])

  return {
    settings,
    isLoading,
    updateSettings,
    resetSettings
  }
}
