/**
 * useNetworkStatus Hook
 * 检测网络连接状态
 */

import { useCallback, useEffect, useState } from 'react'

export interface NetworkStatus {
  /**
   * 是否在线
   */
  online: boolean

  /**
   * 网络类型（如果可用）
   */
  effectiveType?: string

  /**
   * 下行速度（Mbps）
   */
  downlink?: number

  /**
   * 往返时间（ms）
   */
  rtt?: number

  /**
   * 是否节省数据模式
   */
  saveData?: boolean
}

export interface UseNetworkStatusOptions {
  /**
   * 在线状态变化回调
   */
  onOnline?: () => void

  /**
   * 离线状态变化回调
   */
  onOffline?: () => void

  /**
   * 状态变化回调
   */
  onChange?: (status: NetworkStatus) => void
}

/**
 * 获取网络信息
 */
function getNetworkInfo(): NetworkStatus {
  const online = navigator.onLine

  // 尝试获取 Network Information API 数据
  const connection =
    (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

  if (connection) {
    return {
      online,
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    }
  }

  return { online }
}

/**
 * 使用网络状态
 */
export function useNetworkStatus(options: UseNetworkStatusOptions = {}) {
  const { onOnline, onOffline, onChange } = options

  const [status, setStatus] = useState<NetworkStatus>(getNetworkInfo)

  const updateStatus = useCallback(() => {
    const newStatus = getNetworkInfo()
    setStatus((prevStatus) => {
      // 检查在线状态是否变化
      if (prevStatus.online !== newStatus.online) {
        if (newStatus.online) {
          onOnline?.()
        } else {
          onOffline?.()
        }
      }

      // 触发状态变化回调
      onChange?.(newStatus)

      return newStatus
    })
  }, [onOnline, onOffline, onChange])

  useEffect(() => {
    // 监听在线/离线事件
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    // 监听网络信息变化（如果支持）
    const connection =
      (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    if (connection) {
      connection.addEventListener('change', updateStatus)
    }

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)

      if (connection) {
        connection.removeEventListener('change', updateStatus)
      }
    }
  }, [updateStatus])

  return status
}

/**
 * 获取网络状态描述
 */
export function getNetworkStatusDescription(status: NetworkStatus): string {
  if (!status.online) {
    return '离线'
  }

  if (!status.effectiveType) {
    return '在线'
  }

  switch (status.effectiveType) {
    case 'slow-2g':
      return '在线 (2G - 慢)'
    case '2g':
      return '在线 (2G)'
    case '3g':
      return '在线 (3G)'
    case '4g':
      return '在线 (4G)'
    default:
      return '在线'
  }
}

/**
 * 获取网络状态颜色
 */
export function getNetworkStatusColor(status: NetworkStatus): 'success' | 'warning' | 'danger' {
  if (!status.online) {
    return 'danger'
  }

  if (!status.effectiveType) {
    return 'success'
  }

  switch (status.effectiveType) {
    case 'slow-2g':
    case '2g':
      return 'warning'
    case '3g':
    case '4g':
      return 'success'
    default:
      return 'success'
  }
}

export default useNetworkStatus
