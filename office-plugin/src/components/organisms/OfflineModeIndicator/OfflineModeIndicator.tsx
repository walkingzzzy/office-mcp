/**
 * 离线模式指示器组件
 * 显示当前连接状态，提供重试和离线模式控制功能
 */

import {
  Badge,
  Button,
  Card,
  CardHeader,
  Divider,
  Text} from '@fluentui/react-components'
import {
  ArrowClockwiseRegular,
  CheckmarkCircleRegular,
  DismissRegular,
  WarningRegular,
  WifiOffRegular} from '@fluentui/react-icons'
import { FC } from 'react'

import { useConfigStore } from '../../../store/configStore'

export interface OfflineModeIndicatorProps {
  onDismiss?: () => void
}

export const OfflineModeIndicator: FC<OfflineModeIndicatorProps> = ({ onDismiss }) => {
  const {
    connected,
    offlineMode,
    loading,
    error,
    retryCount,
    maxRetries,
    enableOfflineMode,
    disableOfflineMode,
    retryConnection
  } = useConfigStore()

  // 如果连接正常且不在离线模式，不显示组件
  if (connected && !offlineMode && !loading && !error) {
    return null
  }

  const getStatusIcon = () => {
    if (offlineMode) return <WifiOffRegular />
    if (connected) return <CheckmarkCircleRegular />
    if (loading) return <ArrowClockwiseRegular />
    return <WarningRegular />
  }

  const getStatusText = () => {
    if (offlineMode) return '离线模式'
    if (connected) return '已连接'
    if (loading) return '连接中...'
    return '连接失败'
  }

  const getStatusColor = () => {
    if (offlineMode) return 'warning' as const
    if (connected) return 'success' as const
    if (loading) return 'subtle' as const
    return 'danger' as const
  }

  const getRetryText = () => {
    if (retryCount >= maxRetries) {
      return `已达到最大重试次数 (${maxRetries})`
    }
    return `重试次数: ${retryCount}/${maxRetries}`
  }

  return (
    <Card style={{ margin: '16px', maxWidth: '400px' }}>
      <CardHeader
        action={
          onDismiss && (
            <Button
              appearance="subtle"
              size="small"
              icon={<DismissRegular />}
              onClick={onDismiss}
            />
          )
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getStatusIcon()}
          <Text weight="semibold">连接状态</Text>
          <Badge appearance="outline" color={getStatusColor()} size="small">
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>

      <div style={{ padding: '16px' }}>
        {error && (
          <Text style={{ marginBottom: '12px', color: '#d13438' }}>
            {error}
          </Text>
        )}

        {!offlineMode && retryCount > 0 && (
          <Text size={200} style={{ marginBottom: '12px', color: '#605e5c' }}>
            {getRetryText()}
          </Text>
        )}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {!offlineMode && !connected && !loading && (
            <Button
              appearance="primary"
              size="small"
              icon={<ArrowClockwiseRegular />}
              onClick={retryConnection}
              disabled={loading}
            >
              重试连接
            </Button>
          )}

          {!offlineMode && !connected && retryCount >= maxRetries - 1 && (
            <Button
              appearance="secondary"
              size="small"
              icon={<WifiOffRegular />}
              onClick={enableOfflineMode}
            >
              启用离线模式
            </Button>
          )}

          {offlineMode && (
            <Button
              appearance="primary"
              size="small"
              icon={<CheckmarkCircleRegular />}
              onClick={disableOfflineMode}
            >
              重新连接
            </Button>
          )}
        </div>

        {!offlineMode && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Text size={200} style={{ color: '#605e5c' }}>
              💡 提示：连接失败时，可以启用离线模式继续使用基础文档编辑功能。
            </Text>
          </>
        )}

        {offlineMode && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Text size={200} style={{ color: '#605e5c' }}>
              📝 离线模式下，AI功能不可用，但您仍可以使用基础的文档编辑功能。
            </Text>
          </>
        )}
      </div>
    </Card>
  )
}