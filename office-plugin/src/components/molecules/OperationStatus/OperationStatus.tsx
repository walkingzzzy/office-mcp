import { tokens, Badge } from '@fluentui/react-components'
import {
  CheckmarkCircleRegular,
  ClockRegular,
  ErrorCircleRegular,
  InfoRegular,
  SpinnerIosRegular } from '@fluentui/react-icons'
import React from 'react'

import Logger from '../../../utils/logger'

const logger = new Logger('OperationStatus')

interface OperationStatusProps {
  /** 操作状态 */
  status: 'success' | 'error' | 'pending' | 'processing' | 'warning' | 'info'
  /** 状态文本 */
  text: string
  /** 是否显示详细描述 */
  description?: string
  /** 是否紧凑显示 */
  compact?: boolean
  /** 自定义样式类名 */
  className?: string
}

/**
 * 操作状态指示组件
 *
 * 为各种操作提供清晰的视觉状态反馈
 */
export const OperationStatus: React.FC<OperationStatusProps> = ({
  status,
  text,
  description,
  compact = false,
  className
}) => {
  // 获取状态配置
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          color: tokens.colorPaletteGreenForeground1,
          bgColor: tokens.colorPaletteGreenBackground1,
          borderColor: tokens.colorPaletteGreenBorder1,
          icon: <CheckmarkCircleRegular />,
          badgeColor: 'success' as const
        }
      case 'error':
        return {
          color: tokens.colorPaletteRedForeground1,
          bgColor: tokens.colorPaletteRedBackground1,
          borderColor: tokens.colorPaletteRedBorder1,
          icon: <ErrorCircleRegular />,
          badgeColor: 'danger' as const
        }
      case 'processing':
        return {
          color: tokens.colorBrandForeground1,
          bgColor: tokens.colorNeutralBackground2,
          borderColor: tokens.colorNeutralStroke2,
          icon: <SpinnerIosRegular />,
          badgeColor: 'primary' as const
        }
      case 'pending':
        return {
          color: tokens.colorNeutralForeground3,
          bgColor: tokens.colorNeutralBackground2,
          borderColor: tokens.colorNeutralStroke2,
          icon: <ClockRegular />,
          badgeColor: 'default' as const
        }
      case 'warning':
        return {
          color: tokens.colorPaletteDarkOrangeForeground1,
          bgColor: tokens.colorPaletteDarkOrangeBackground1,
          borderColor: tokens.colorPaletteDarkOrangeBorder1,
          icon: <ErrorCircleRegular />,
          badgeColor: 'warning' as const
        }
      case 'info':
      default:
        return {
          color: tokens.colorPaletteBlueForeground2,
          bgColor: tokens.colorPaletteBlueBackground2,
          borderColor: tokens.colorPaletteRedBorder1,
          icon: <InfoRegular />,
          badgeColor: 'default' as const
        }
    }
  }

  const config = getStatusConfig()

  if (compact) {
    return (
      <div
        className={`operation-status-compact ${className || ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacingHorizontalXS,
          fontSize: tokens.fontSizeBase200,
          color: config.color
        }}
      >
        <span style={{ fontSize: '14px' }}>{config.icon}</span>
        <span>{text}</span>
      </div>
    )
  }

  return (
    <div
      className={`operation-status ${className || ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXS,
        padding: tokens.spacingVerticalS,
        backgroundColor: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        borderRadius: tokens.borderRadiusSmall,
        transition: 'all 0.2s ease'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacingHorizontalS
        }}
      >
        <span style={{ fontSize: '16px', color: config.color }}>
          {config.icon}
        </span>
        <Badge
          color={config.badgeColor === 'success' ? 'success' : config.badgeColor === 'danger' ? 'danger' : config.badgeColor === 'warning' ? 'warning' : 'brand'}
          appearance="filled"
          size="small"
        >
          {text}
        </Badge>
      </div>

      {description && (
        <div
          style={{
            fontSize: tokens.fontSizeBase200,
            color: tokens.colorNeutralForeground2,
            lineHeight: tokens.lineHeightBase300,
            marginLeft: '24px' // 对齐图标位置
          }}
        >
          {description}
        </div>
      )}
    </div>
  )
}

/**
 * 操作进度指示器
 */
interface OperationProgressProps {
  /** 进度百分比 (0-100) */
  progress: number
  /** 操作描述 */
  description: string
  /** 是否显示百分比 */
  showPercentage?: boolean
  /** 是否为不确定进度 */
  indeterminate?: boolean
}

export const OperationProgress: React.FC<OperationProgressProps> = ({
  progress,
  description,
  showPercentage = true,
  indeterminate = false
}) => {
  const percentage = Math.min(100, Math.max(0, progress))

  return (
    <div
      className="operation-progress"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalS,
        padding: tokens.spacingVerticalS,
        backgroundColor: tokens.colorNeutralBackground2,
        borderRadius: tokens.borderRadiusSmall,
        border: `1px solid ${tokens.colorNeutralStroke2}`
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: tokens.fontSizeBase200
        }}
      >
        <span style={{ color: tokens.colorNeutralForeground1 }}>
          {description}
        </span>
        {showPercentage && (
          <span style={{ color: tokens.colorNeutralForeground2 }}>
            {percentage}%
          </span>
        )}
      </div>

      <div
        style={{
          width: '100%',
          height: '4px',
          backgroundColor: tokens.colorNeutralStroke1,
          borderRadius: '2px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            height: '100%',
            width: indeterminate ? '100%' : `${percentage}%`,
            backgroundColor: tokens.colorBrandForeground1,
            borderRadius: '2px',
            transition: indeterminate ? 'none' : 'width 0.3s ease',
            ...(indeterminate && {
              animation: 'slide-progress 1.5s ease-in-out infinite'
            })
          }}
        />
      </div>
    </div>
  )
}

export default OperationStatus