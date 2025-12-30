/**
 * 连接状态管理 Hook
 * 监控桥接服务和网络连接状态
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { localAIClient } from '../services/ai/LocalAIClient'

/**
 * 连接状态
 */
export interface ConnectionStatus {
  online: boolean
  bridgeConnected: boolean
  lastCheck: number
  checking: boolean
}

/**
 * 连接状态 Hook 选项
 */
export interface UseConnectionStatusOptions {
  checkInterval?: number
  bridgeUrl?: string
  onStatusChange?: (status: ConnectionStatus) => void
}

/**
 * 连接状态管理 Hook
 */
export function useConnectionStatus(
  options: UseConnectionStatusOptions = {}
): ConnectionStatus & {
  checkConnection: () => Promise<void>
  retry: () => Promise<void>
} {
  const { checkInterval = 30000, bridgeUrl, onStatusChange } = options

  const [status, setStatus] = useState<ConnectionStatus>({
    online: navigator.onLine,
    bridgeConnected: false,
    lastCheck: 0,
    checking: false
  })

  const intervalRef = useRef<number | null>(null)
  const onStatusChangeRef = useRef(onStatusChange)
  onStatusChangeRef.current = onStatusChange

  const checkConnection = useCallback(async () => {
    setStatus(prev => ({ ...prev, checking: true }))

    try {
      if (bridgeUrl) {
        localAIClient.setBridgeUrl(bridgeUrl)
      }

      const bridgeConnected = await localAIClient.checkConnection()

      const newStatus: ConnectionStatus = {
        online: navigator.onLine,
        bridgeConnected,
        lastCheck: Date.now(),
        checking: false
      }

      setStatus(newStatus)
      onStatusChangeRef.current?.(newStatus)
    } catch {
      const newStatus: ConnectionStatus = {
        online: navigator.onLine,
        bridgeConnected: false,
        lastCheck: Date.now(),
        checking: false
      }

      setStatus(newStatus)
      onStatusChangeRef.current?.(newStatus)
    }
  }, [bridgeUrl])

  const retry = useCallback(async () => {
    await checkConnection()
  }, [checkConnection])

  // 监听网络状态变化
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, online: true }))
      checkConnection()
    }

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        online: false,
        bridgeConnected: false
      }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkConnection])

  // 定期检查连接
  useEffect(() => {
    checkConnection()

    if (checkInterval > 0) {
      intervalRef.current = window.setInterval(checkConnection, checkInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkConnection, checkInterval])

  return {
    ...status,
    checkConnection,
    retry
  }
}

export default useConnectionStatus
