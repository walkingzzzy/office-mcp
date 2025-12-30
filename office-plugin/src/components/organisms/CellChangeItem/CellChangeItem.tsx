/**
 * Excel 单元格修改项组件
 * 显示单个单元格的修改建议,提供接受/拒绝/定位操作
 */

import {
  Badge,
  Button,
  Card,
  makeStyles,
  Text,
  tokens} from '@fluentui/react-components'
import {
  ArrowSyncRegular,
  CheckmarkRegular,
  DismissRegular,
  LocationRegular} from '@fluentui/react-icons'
import React from 'react'

import type { ExcelCellChange } from '../../../types/excel'

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
  cellAddress: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  content: {
    marginBottom: tokens.spacingVerticalM
  },
  valueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalXS
  },
  valueLabel: {
    fontWeight: tokens.fontWeightSemibold,
    minWidth: '60px'
  },
  oldValue: {
    textDecoration: 'line-through',
    color: tokens.colorPaletteRedForeground1
  },
  newValue: {
    color: tokens.colorPaletteGreenForeground1,
    fontWeight: tokens.fontWeightSemibold
  },
  formula: {
    fontFamily: 'monospace',
    backgroundColor: tokens.colorNeutralBackground3,
    padding: tokens.spacingHorizontalXS,
    borderRadius: tokens.borderRadiusSmall
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

export interface CellChangeItemProps {
  /** 单元格修改数据 */
  change: ExcelCellChange
  /** 接受回调 */
  onAccept?: (changeId: string) => void
  /** 拒绝回调 */
  onReject?: (changeId: string) => void
  /** 定位回调 */
  onLocate?: (address: string) => void
}

/**
 * Excel 单元格修改项组件
 */
export const CellChangeItem: React.FC<CellChangeItemProps> = ({
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

  const getChangeTypeIcon = () => {
    switch (change.changeType) {
      case 'formula':
        return <ArrowSyncRegular />
      default:
        return null
    }
  }

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div className={styles.cellAddress}>
          {getChangeTypeIcon()}
          <Text weight="semibold" size={400}>
            {change.address}
          </Text>
          {getStatusBadge()}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.valueRow}>
          <Text className={styles.valueLabel}>原值:</Text>
          <Text className={styles.oldValue}>{String(change.oldValue)}</Text>
        </div>

        <div className={styles.valueRow}>
          <Text className={styles.valueLabel}>新值:</Text>
          <Text className={styles.newValue}>{String(change.newValue)}</Text>
        </div>

        {change.formula && (
          <div className={styles.valueRow}>
            <Text className={styles.valueLabel}>公式:</Text>
            <Text className={styles.formula}>{change.formula}</Text>
          </div>
        )}

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
              onClick={() => onLocate(change.address)}
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
