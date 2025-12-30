/**
 * PowerPoint 幻灯片修改项组件
 * 显示单个幻灯片的文本修改建议,提供接受/拒绝/定位操作
 */

import {
  Badge,
  Button,
  Card,
  makeStyles,
  Text,
  tokens} from '@fluentui/react-components'
import {
  CheckmarkRegular,
  DismissRegular,
  DocumentRegular,
  LocationRegular} from '@fluentui/react-icons'
import React from 'react'

import type { PowerPointSlideTextChange } from '../../../types/powerpoint'

const useStyles = makeStyles({
  card: {
    marginBottom: tokens.spacingVerticalM,
    width: '100%'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalS
  },
  slideInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  content: {
    marginBottom: tokens.spacingVerticalM
  },
  textSection: {
    marginBottom: tokens.spacingVerticalM
  },
  label: {
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalXXS,
    display: 'block'
  },
  textBox: {
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  oldText: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderLeft: `3px solid ${tokens.colorPaletteRedBorder1}`
  },
  newText: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    borderLeft: `3px solid ${tokens.colorPaletteGreenBorder1}`
  },
  description: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    fontStyle: 'italic'
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'flex-end'
  },
  statusBadge: {
    marginLeft: tokens.spacingHorizontalS
  }
})

export interface SlideChangeItemProps {
  /** 幻灯片修改数据 */
  change: PowerPointSlideTextChange
  /** 接受回调 */
  onAccept?: (changeId: string) => void
  /** 拒绝回调 */
  onReject?: (changeId: string) => void
  /** 定位回调 */
  onLocate?: (slideIndex: number) => void
}

/**
 * PowerPoint 幻灯片修改项组件
 */
export const SlideChangeItem: React.FC<SlideChangeItemProps> = ({
  change,
  onAccept,
  onReject,
  onLocate
}) => {
  const styles = useStyles()

  const getStatusBadge = () => {
    switch (change.status) {
      case 'accepted':
        return (
          <Badge className={styles.statusBadge} appearance="filled" color="success">
            已接受
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className={styles.statusBadge} appearance="filled" color="danger">
            已拒绝
          </Badge>
        )
      default:
        return null
    }
  }

  const getPartLabel = () => {
    switch (change.part) {
      case 'title':
        return '标题'
      case 'content':
        return '正文'
      case 'notes':
        return '备注'
      default:
        return ''
    }
  }

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div className={styles.slideInfo}>
          <DocumentRegular />
          <Text weight="semibold" size={400}>
            幻灯片 {change.slideIndex} - {getPartLabel()}
          </Text>
          {getStatusBadge()}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.textSection}>
          <Text className={styles.label}>原文本:</Text>
          <div className={`${styles.textBox} ${styles.oldText}`}>
            <Text size={300}>{change.oldText || '(无)'}</Text>
          </div>
        </div>

        <div className={styles.textSection}>
          <Text className={styles.label}>新文本:</Text>
          <div className={`${styles.textBox} ${styles.newText}`}>
            <Text size={300}>{change.newText}</Text>
          </div>
        </div>

        {change.description && (
          <Text className={styles.description}>{change.description}</Text>
        )}
      </div>

      {change.status === 'pending' && (
        <div className={styles.actions}>
          {onLocate && (
            <Button
              appearance="subtle"
              icon={<LocationRegular />}
              onClick={() => onLocate(change.slideIndex)}
            >
              定位
            </Button>
          )}
          {onReject && (
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              onClick={() => onReject(change.id)}
            >
              拒绝
            </Button>
          )}
          {onAccept && (
            <Button
              appearance="primary"
              icon={<CheckmarkRegular />}
              onClick={() => onAccept(change.id)}
            >
              接受
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
