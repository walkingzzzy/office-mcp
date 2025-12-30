/**
 * 连接状态指示器组件
 * 显示网络和桥接服务的连接状态
 */

import React from 'react'
import { useConnectionStatus } from '../../hooks/useConnectionStatus'

interface ConnectionIndicatorProps {
  bridgeUrl?: string
  showDetails?: boolean
  className?: string
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  bridgeUrl,
  showDetails = false,
  className = ''
}) => {
  const { online, bridgeConnected, checking, retry } = useConnectionStatus({
    bridgeUrl,
    checkInterval: 30000
  })

  const getStatusColor = () => {
    if (!online) return 'bg-gray-400'
    if (bridgeConnected) return 'bg-green-500'
    return 'bg-yellow-500'
  }

  const getStatusText = () => {
    if (!online) return '离线'
    if (bridgeConnected) return '已连接'
    return '桥接服务未连接'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()}`} />
        {checking && (
          <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
        )}
      </div>

      {showDetails && (
        <>
          <span className="text-xs text-gray-600">{getStatusText()}</span>
          {!bridgeConnected && online && (
            <button
              onClick={retry}
              disabled={checking}
              className="text-xs text-blue-500 hover:underline disabled:opacity-50"
            >
              重试
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default ConnectionIndicator
