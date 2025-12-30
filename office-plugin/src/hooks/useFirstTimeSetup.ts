/**
 * 首次使用检测 Hook
 * 检测用户是否首次使用，管理设置向导状态
 */

import { useState, useEffect, useCallback } from 'react'
import { secureStorage } from '../services/storage/SecureStorage'

const SETUP_COMPLETE_KEY = 'setup_complete'
const SETUP_SKIPPED_KEY = 'setup_skipped'

export interface UseFirstTimeSetupReturn {
  isFirstTime: boolean
  isLoading: boolean
  showWizard: boolean
  completeSetup: () => Promise<void>
  skipSetup: () => Promise<void>
  resetSetup: () => Promise<void>
}

/**
 * 首次使用检测 Hook
 */
export function useFirstTimeSetup(): UseFirstTimeSetupReturn {
  const [isFirstTime, setIsFirstTime] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    const checkFirstTime = async () => {
      try {
        const setupComplete = await secureStorage.getItem(SETUP_COMPLETE_KEY)
        const setupSkipped = await secureStorage.getItem(SETUP_SKIPPED_KEY)

        const isFirst = !setupComplete && !setupSkipped
        setIsFirstTime(isFirst)
        setShowWizard(isFirst)
      } catch {
        // 如果存储访问失败，假设是首次使用
        setIsFirstTime(true)
        setShowWizard(true)
      } finally {
        setIsLoading(false)
      }
    }

    checkFirstTime()
  }, [])

  const completeSetup = useCallback(async () => {
    await secureStorage.setItem(SETUP_COMPLETE_KEY, 'true')
    await secureStorage.removeItem(SETUP_SKIPPED_KEY)
    setIsFirstTime(false)
    setShowWizard(false)
  }, [])

  const skipSetup = useCallback(async () => {
    await secureStorage.setItem(SETUP_SKIPPED_KEY, 'true')
    setShowWizard(false)
  }, [])

  const resetSetup = useCallback(async () => {
    await secureStorage.removeItem(SETUP_COMPLETE_KEY)
    await secureStorage.removeItem(SETUP_SKIPPED_KEY)
    setIsFirstTime(true)
    setShowWizard(true)
  }, [])

  return {
    isFirstTime,
    isLoading,
    showWizard,
    completeSetup,
    skipSetup,
    resetSetup
  }
}

export default useFirstTimeSetup
