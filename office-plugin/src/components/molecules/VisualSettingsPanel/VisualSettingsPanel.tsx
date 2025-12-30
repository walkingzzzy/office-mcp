/**
 * VisualSettingsPanel 组件
 * 视觉增强配置面板
 */

import {
  Button,
  Card,
  makeStyles,
  Switch,
  Text,
  tokens
} from '@fluentui/react-components'
import { ArrowResetRegular, ColorRegular } from '@fluentui/react-icons'
import React from 'react'

import type { VisualEnhancementSettings } from '../../../types/visualSettings'
import { PRESET_COLOR_SCHEMES } from '../../../types/visualSettings'

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium
  },
  title: {
    marginBottom: tokens.spacingVerticalM,
    fontWeight: tokens.fontWeightSemibold,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  section: {
    marginBottom: tokens.spacingVerticalM
  },
  switchRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalS
  },
  colorSection: {
    marginTop: tokens.spacingVerticalM
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalS
  },
  colorPicker: {
    width: '60px',
    height: '30px',
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    cursor: 'pointer'
  },
  presetSchemes: {
    marginTop: tokens.spacingVerticalS,
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap'
  },
  presetButton: {
    fontSize: tokens.fontSizeBase200
  },
  resetButton: {
    marginTop: tokens.spacingVerticalM,
    width: '100%'
  }
})

export interface VisualSettingsPanelProps {
  settings: VisualEnhancementSettings
  onSettingsChange: (settings: Partial<VisualEnhancementSettings>) => void
  onReset: () => void
}

export const VisualSettingsPanel: React.FC<VisualSettingsPanelProps> = ({
  settings,
  onSettingsChange,
  onReset
}) => {
  const styles = useStyles()

  return (
    <Card className={styles.container}>
      <div className={styles.title}>
        <ColorRegular />
        <Text>视觉增强设置</Text>
      </div>

      {/* 启用开关 */}
      <div className={styles.section}>
        <div className={styles.switchRow}>
          <Text>启用视觉增强</Text>
          <Switch
            checked={settings.enabled}
            onChange={(_, data) => onSettingsChange({ enabled: data.checked })}
          />
        </div>
      </div>

      {/* 格式选项 */}
      {settings.enabled && (
        <>
          <div className={styles.section}>
            <div className={styles.switchRow}>
              <Text>使用删除线（删除文本）</Text>
              <Switch
                checked={settings.useStrikethrough}
                onChange={(_, data) => onSettingsChange({ useStrikethrough: data.checked })}
              />
            </div>
            <div className={styles.switchRow}>
              <Text>使用下划线（插入文本）</Text>
              <Switch
                checked={settings.useUnderline}
                onChange={(_, data) => onSettingsChange({ useUnderline: data.checked })}
              />
            </div>
          </div>

          {/* 颜色配置 */}
          <div className={styles.colorSection}>
            <Text style={{ marginBottom: tokens.spacingVerticalS, display: 'block' }}>
              高亮颜色
            </Text>

            <div className={styles.colorRow}>
              <Text size={200}>插入文本</Text>
              <input
                type="color"
                className={styles.colorPicker}
                value={settings.insertionColor}
                onChange={(e) => onSettingsChange({ insertionColor: e.target.value })}
              />
            </div>

            <div className={styles.colorRow}>
              <Text size={200}>删除文本</Text>
              <input
                type="color"
                className={styles.colorPicker}
                value={settings.deletionColor}
                onChange={(e) => onSettingsChange({ deletionColor: e.target.value })}
              />
            </div>

            {/* 预设配色方案 */}
            <Text size={200} style={{ marginTop: tokens.spacingVerticalM, display: 'block' }}>
              预设方案
            </Text>
            <div className={styles.presetSchemes}>
              {Object.entries(PRESET_COLOR_SCHEMES).map(([key, scheme]) => (
                <Button
                  key={key}
                  size="small"
                  appearance="outline"
                  className={styles.presetButton}
                  onClick={() =>
                    onSettingsChange({
                      insertionColor: scheme.insertionColor,
                      deletionColor: scheme.deletionColor
                    })
                  }
                >
                  {scheme.name}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 重置按钮 */}
      <Button
        appearance="subtle"
        icon={<ArrowResetRegular />}
        className={styles.resetButton}
        onClick={onReset}
      >
        重置为默认设置
      </Button>
    </Card>
  )
}
