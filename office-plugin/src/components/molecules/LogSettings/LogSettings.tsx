import { makeStyles, Switch, Text, tokens } from '@fluentui/react-components'
import { SettingsRegular } from '@fluentui/react-icons'
import React, { useEffect,useState } from 'react'

import Logger, { LogLevel } from '../../../utils/logger'

export interface LogSettingsProps {
  onSettingsChange?: (quietMode: boolean, currentLevel: LogLevel) => void
}

const useLogSettingsStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
  },
  settingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  settingLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  settingTitle: {
    fontWeight: tokens.fontWeightSemibold,
  },
  settingDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  currentStatus: {
    marginTop: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase200,
  },
})

export const LogSettings: React.FC<LogSettingsProps> = ({ onSettingsChange }) => {
  const styles = useLogSettingsStyles()
  const [quietMode, setQuietMode] = useState(false)
  const [isDev, setIsDev] = useState(false)

  useEffect(() => {
    // 初始化时读取当前设置
    const currentQuietMode = Logger.getGlobalQuietMode()
    setQuietMode(currentQuietMode)
    setIsDev(import.meta.env.DEV)
  }, [])

  const handleQuietModeChange = (checked: boolean) => {
    Logger.setGlobalQuietMode(checked)
    setQuietMode(checked)

    // 通知父组件设置已更改
    const currentLevel = quietMode ? 'error' : (isDev ? 'debug' : 'info')
    onSettingsChange?.(checked, currentLevel)
  }

  const getCurrentLogLevel = (): LogLevel => {
    if (quietMode) return 'error'
    if (isDev) return 'debug'
    return 'info'
  }

  const getLogDescription = (level: LogLevel): string => {
    switch (level) {
      case 'debug':
        return '显示所有日志（包括调试信息）'
      case 'info':
        return '显示一般信息、警告和错误'
      case 'warn':
        return '仅显示警告和错误'
      case 'error':
        return '仅显示错误信息'
      default:
        return '未知日志级别'
    }
  }

  const currentLevel = getCurrentLogLevel()

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <SettingsRegular />
        <Text weight="semibold">日志设置</Text>
      </div>

      <div className={styles.settingRow}>
        <div className={styles.settingLabel}>
          <Text className={styles.settingTitle}>安静模式</Text>
          <Text className={styles.settingDescription}>
            减少日志输出，只显示重要信息
          </Text>
        </div>
        <Switch
          checked={quietMode}
          onChange={(_, checked) => handleQuietModeChange(typeof checked === 'boolean' ? checked : checked.checked)}
        />
      </div>

      <div className={styles.currentStatus}>
        <Text weight="semibold">当前状态：</Text>
        <Text>当前日志级别：<strong>{currentLevel.toUpperCase()}</strong></Text>
        <Text>{getLogDescription(currentLevel)}</Text>
        <Text style={{ marginTop: tokens.spacingVerticalXS }}>
          💡 提示：开发环境可查看详细调试信息，生产环境建议启用安静模式
        </Text>
      </div>
    </div>
  )
}

export default LogSettings