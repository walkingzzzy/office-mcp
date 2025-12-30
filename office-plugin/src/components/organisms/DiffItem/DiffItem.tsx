/**
 * DiffItem 组件
 * 显示单个文本差异项，支持接受/拒绝操作
 */

import {
  Button,
  Card,
  makeStyles,
  mergeClasses,
  Text,
  tokens} from '@fluentui/react-components'
import {
  AddRegular,
  CheckmarkRegular,
  DeleteRegular,
  DismissRegular,
  LocationRegular
} from '@fluentui/react-icons'
import React from 'react'

import type { DiffItem as DiffItemType } from '../../../types/word'

const useStyles = makeStyles({
  card: {
    marginBottom: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium
  },
  cardInsert: {
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    borderLeftColor: tokens.colorPaletteGreenBorder2
  },
  cardDelete: {
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    borderLeftColor: tokens.colorPaletteRedBorder2
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalS
  },
  typeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS
  },
  typeIcon: {
    fontSize: '16px'
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS
  },
  content: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    marginBottom: tokens.spacingVerticalS
  },
  contentInsert: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    color: tokens.colorPaletteGreenForeground2
  },
  contentDelete: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground2,
    textDecoration: 'line-through'
  },
  context: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalS
  },
  contextLabel: {
    fontWeight: tokens.fontWeightSemibold,
    marginRight: tokens.spacingHorizontalXS
  },
  statusAccepted: {
    backgroundColor: tokens.colorPaletteGreenBackground2
  },
  statusRejected: {
    backgroundColor: tokens.colorNeutralBackground4,
    opacity: 0.6
  },
  statusError: {
    backgroundColor: tokens.colorPaletteRedBackground2
  }
})

export interface DiffItemProps {
  /** 差异项数据 */
  diff: DiffItemType
  /** 接受差异的回调 */
  onAccept: (diffId: string) => void
  /** 拒绝差异的回调 */
  onReject: (diffId: string) => void
  /** 定位到文档中的回调 */
  onLocate?: (diffId: string) => void
  /** 是否显示上下文 */
  showContext?: boolean
  /** 是否禁用操作按钮 */
  disabled?: boolean
}

export const DiffItem: React.FC<DiffItemProps> = ({
  diff,
  onAccept,
  onReject,
  onLocate,
  showContext = true,
  disabled = false
}) => {
  const styles = useStyles()

  // 根据状态判断是否禁用操作
  const isDisabled = disabled || diff.status !== 'pending'
  const isInsert = diff.type === 'insert'

  // 根据状态组合卡片样式
  const cardClassName = mergeClasses(
    styles.card,
    isInsert ? styles.cardInsert : styles.cardDelete,
    diff.status === 'accepted' && styles.statusAccepted,
    diff.status === 'rejected' && styles.statusRejected,
    diff.status === 'error' && styles.statusError
  )

  // 获取状态文本
  const getStatusText = () => {
    switch (diff.status) {
      case 'accepted':
        return '已接受'
      case 'rejected':
        return '已拒绝'
      case 'error':
        return '操作失败'
      default:
        return ''
    }
  }

  return (
    <Card className={cardClassName}>
      {/* 头部：类型信息 + 操作按钮 */}
      <div className={styles.header}>
        <div className={styles.typeInfo}>
          {isInsert ? (
            <>
              <AddRegular className={styles.typeIcon} />
              <Text weight="semibold" style={{ color: tokens.colorPaletteGreenForeground2 }}>
                添加文本
              </Text>
            </>
          ) : (
            <>
              <DeleteRegular className={styles.typeIcon} />
              <Text weight="semibold" style={{ color: tokens.colorPaletteRedForeground2 }}>
                删除文本
              </Text>
            </>
          )}
          {getStatusText() && (
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              ({getStatusText()})
            </Text>
          )}
        </div>

        {/* 操作按钮 */}
        <div className={styles.actions}>
          {onLocate && (
            <Button
              appearance="subtle"
              size="small"
              icon={<LocationRegular />}
              onClick={() => onLocate(diff.id)}
              disabled={isDisabled}
              title="在文档中定位"
            />
          )}
          <Button
            appearance="primary"
            size="small"
            icon={<CheckmarkRegular />}
            onClick={() => onAccept(diff.id)}
            disabled={isDisabled}
            title="接受此修改"
          >
            接受
          </Button>
          <Button
            appearance="subtle"
            size="small"
            icon={<DismissRegular />}
            onClick={() => onReject(diff.id)}
            disabled={isDisabled}
            title="拒绝此修改"
          >
            拒绝
          </Button>
        </div>
      </div>

      {/* 差异内容 */}
      <div
        className={mergeClasses(
          styles.content,
          isInsert ? styles.contentInsert : styles.contentDelete
        )}
      >
        {diff.text}
      </div>

      {/* 上下文 */}
      {showContext && diff.context && typeof diff.context === 'object' && (diff.context.before || diff.context.after) && (
        <div className={styles.context}>
          {diff.context.before && (
            <div>
              <Text className={styles.contextLabel}>前文：</Text>
              <Text>...{diff.context.before}</Text>
            </div>
          )}
          {diff.context.after && (
            <div>
              <Text className={styles.contextLabel}>后文：</Text>
              <Text>{diff.context.after}...</Text>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
