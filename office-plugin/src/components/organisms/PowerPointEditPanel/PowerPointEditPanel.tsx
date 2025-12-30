/**
 * PowerPoint 编辑面板组件
 * 显示 PowerPoint 幻灯片修改建议列表和批量操作
 */

import {
  Button,
  Divider,
  makeStyles,
  Spinner,
  Text,
  tokens
} from '@fluentui/react-components'
import {
  CheckmarkCircleRegular,
  DismissCircleRegular,
  DismissRegular
} from '@fluentui/react-icons'
import React, { useEffect } from 'react'

import { usePowerPointEdit } from '../../../hooks/usePowerPointEdit'
import { SlideChangeItem } from '../SlideChangeItem'

const useStyles = makeStyles({
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground1
  },
  header: {
    padding: tokens.spacingVerticalL,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold
  },
  stats: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalM
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS
  },
  statLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3
  },
  statValue: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap'
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: tokens.spacingVerticalL
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: tokens.colorNeutralForeground3
  },
  error: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground1,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalM
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalXXL
  }
})

export interface PowerPointEditPanelProps {
  /** AI 生成的文本内容 */
  aiText?: string
  /** 是否可见 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
}

/**
 * PowerPoint 编辑面板组件
 */
export const PowerPointEditPanel: React.FC<PowerPointEditPanelProps> = ({
  aiText,
  visible,
  onClose
}) => {
  const styles = useStyles()
  const {
    presentationContent,
    slideChanges,
    isLoading,
    error,
    totalChanges,
    pendingChanges,
    acceptedChanges,
    rejectedChanges,
    readPresentation,
    calculateSlideDiff,
    acceptChange,
    rejectChange,
    acceptAllChanges,
    rejectAllChanges,
    navigateToSlide
  } = usePowerPointEdit()

  // 初始化:读取演示文稿内容
  useEffect(() => {
    if (visible && !presentationContent) {
      readPresentation()
    }
  }, [visible, presentationContent, readPresentation])

  // 计算差异
  useEffect(() => {
    if (visible && aiText && presentationContent) {
      calculateSlideDiff(aiText)
    }
  }, [visible, aiText, presentationContent, calculateSlideDiff])

  if (!visible) {
    return null
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <Text className={styles.title}>PowerPoint 幻灯片修改</Text>
          <Button appearance="subtle" icon={<DismissRegular />} onClick={onClose} />
        </div>

        {presentationContent && (
          <Text size={300} style={{ marginBottom: tokens.spacingVerticalM }}>
            演示文稿: {presentationContent.title} ({presentationContent.slideCount} 张幻灯片)
          </Text>
        )}

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <Text className={styles.statLabel}>待处理</Text>
            <Text className={styles.statValue}>{pendingChanges}</Text>
          </div>
          <div className={styles.statItem}>
            <Text className={styles.statLabel}>已接受</Text>
            <Text className={styles.statValue}>{acceptedChanges}</Text>
          </div>
          <div className={styles.statItem}>
            <Text className={styles.statLabel}>已拒绝</Text>
            <Text className={styles.statValue}>{rejectedChanges}</Text>
          </div>
        </div>

        {pendingChanges > 0 && (
          <>
            <Divider style={{ margin: `${tokens.spacingVerticalM} 0` }} />
            <div className={styles.actions}>
              <Button
                appearance="primary"
                icon={<CheckmarkCircleRegular />}
                onClick={acceptAllChanges}
                size="small"
              >
                接受全部
              </Button>
              <Button
                appearance="subtle"
                icon={<DismissCircleRegular />}
                onClick={rejectAllChanges}
                size="small"
              >
                拒绝全部
              </Button>
            </div>
          </>
        )}
      </div>

      <div className={styles.content}>
        {isLoading && (
          <div className={styles.loading}>
            <Spinner size="large" />
            <Text>正在加载演示文稿数据...</Text>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <Text weight="semibold">错误</Text>
            <Text>{error}</Text>
          </div>
        )}

        {!isLoading && totalChanges === 0 && (
          <div className={styles.empty}>
            <Text size={400}>暂无修改建议</Text>
            <Text size={300}>AI 将为您提供幻灯片修改建议</Text>
          </div>
        )}

        {!isLoading &&
          slideChanges.map((change) => (
            <SlideChangeItem
              key={change.id}
              change={change}
              onAccept={acceptChange}
              onReject={rejectChange}
              onLocate={navigateToSlide}
            />
          ))}
      </div>
    </div>
  )
}
