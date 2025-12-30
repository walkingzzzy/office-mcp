/**
 * 离线提示横幅组件
 * 在离线或桥接服务断开时显示提示
 */

import React, { useState, useEffect } from 'react'
import { useConnectionStatus } from '../../hooks/useConnectionStatus'

interface OfflineBannerProps {
  bridgeUrl?: string
  onDismiss?: () => void
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  bridgeUrl,
  onDismiss
}) => {
  const { online, bridgeConnected, checking, retry } = useConnectionStatus({
    bridgeUrl
  })
  const [dismissed, setDismissed] = useState(false)

  // 当连接恢复时自动隐藏
  useEffect(() => {
    if (online && bridgeConnected) {
      setDismissed(false)
    }
  }, [online, bridgeConnected])

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  // 如果在线且桥接已连接，或已被关闭，则不显示
  if ((online && bridgeConnected) || dismissed) {
    return null
  }

  const isOffline = !online
  const isBridgeDisconnected = online && !bridgeConnected

  return (
    <div
      className={`px-4 py-2 flex items-center justify-between text-sm ${
        isOffline ? 'bg-gray-600 text-white' : 'bg-yellow-100 text-yellow-800'
      }`}
    >
      <div className="flex items-center gap-2">
        <span>{isOffline ? '📡' : '⚠️'}</span>
        <span>
          {isOffline
            ? '您当前处于离线状态，部分功能可能不可用'
            : '桥接服务未连接，AI 功能暂时不可用'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {isBridgeDisconnected && (
          <button
            onClick={retry}
            disabled={checking}
            className="px-2 py-1 text-xs bg-yellow-200 rounded hover:bg-yellow-300 disabled:opacity-50"
          >
            {checking ? '检查中...' : '重新连接'}
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="text-current opacity-60 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default OfflineBanner
