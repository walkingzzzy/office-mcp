/**
 * DiffViewer 组件
 * 显示文本差异列表，支持批量操作
 */

import {
  Button,
  Card,
  Divider,
  makeStyles,
  Spinner,
  Text,
  tokens} from '@fluentui/react-components'
import {
  CheckmarkRegular,
  DismissRegular
} from '@fluentui/react-icons'
import React, { useMemo } from 'react'

import type { DiffItem as DiffItemType } from '../../../types/word'
import { DiffItem } from '../DiffItem/DiffItem'

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden'
  },
  header: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalS
  },
  title: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold
  },
  statistics: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalS
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS
  },
  statValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold
  },
  statLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalM
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: tokens.spacingVerticalM
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXXL,
    textAlign: 'center'
  },
  emptyIcon: {
    fontSize: '48px',
    color: tokens.colorNeutralForeground3,
    marginBottom: tokens.spacingVerticalM
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXXL,
    gap: tokens.spacingVerticalM
  },
  filterContainer: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS
  }
})

export interface DiffViewerProps {
  /** 差异列表 */
  diffs: DiffItemType[]
  /** 接受单个差异的回调 */
  onAcceptDiff: (diffId: string) => void | Promise<void>
  /** 拒绝单个差异的回调 */
  onRejectDiff: (diffId: string) => void | Promise<void>
  /** 接受所有差异的回调 */
  onAcceptAll?: () => void | Promise<void>
  /** 拒绝所有差异的回调 */
  onRejectAll?: () => void | Promise<void>
  /** 定位到文档的回调 */
  onLocate?: (diffId: string) => void | Promise<void>
  /** 是否显示上下文 */
  showContext?: boolean
  /** 是否正在加载 */
  loading?: boolean
  /** 是否禁用操作 */
  disabled?: boolean
  /** 标题 */
  title?: string
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  diffs,
  onAcceptDiff,
  onRejectDiff,
  onAcceptAll,
  onRejectAll,
  onLocate,
  showContext = true,
  loading = false,
  disabled = false,
  title = '文本修改建议'
}) => {
  const styles = useStyles()

  // 计算统计信息
  const statistics = useMemo(() => {
    const insertions = diffs.filter((d) => d.type === 'insert')
    const deletions = diffs.filter((d) => d.type === 'delete')
    const pending = diffs.filter((d) => d.status === 'pending')
    const accepted = diffs.filter((d) => d.status === 'accepted')
    const rejected = diffs.filter((d) => d.status === 'rejected')

    return {
      total: diffs.length,
      insertions: insertions.length,
      deletions: deletions.length,
      pending: pending.length,
      accepted: accepted.length,
      rejected: rejected.length
    }
  }, [diffs])

  // 渲染加载状态
  if (loading) {
    return (
      <Card className={styles.container}>
        <div className={styles.loadingContainer}>
          <Spinner size="large" label="正在分析文本差异..." />
        </div>
      </Card>
    )
  }

  // 渲染空状态
  if (diffs.length === 0) {
    return (
      <Card className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📝</div>
          <Text size={400} weight="semibold">
            暂无修改建议
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginTop: tokens.spacingVerticalXS }}>
            AI 将在分析文档后提供修改建议
          </Text>
        </div>
      </Card>
    )
  }

  return (
    <div className={styles.container}>
      {/* 头部：标题和统计信息 */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <Text className={styles.title}>{title}</Text>
        </div>

        {/* 统计信息 */}
        <div className={styles.statistics}>
          <div className={styles.statItem}>
            <Text className={styles.statValue}>{statistics.total}</Text>
            <Text className={styles.statLabel}>总计</Text>
          </div>
          <div className={styles.statItem}>
            <Text className={styles.statValue} style={{ color: tokens.colorPaletteGreenForeground2 }}>
              {statistics.insertions}
            </Text>
            <Text className={styles.statLabel}>添加</Text>
          </div>
          <div className={styles.statItem}>
            <Text className={styles.statValue} style={{ color: tokens.colorPaletteRedForeground2 }}>
              {statistics.deletions}
            </Text>
            <Text className={styles.statLabel}>删除</Text>
          </div>
          <div className={styles.statItem}>
            <Text className={styles.statValue}>{statistics.pending}</Text>
            <Text className={styles.statLabel}>待处理</Text>
          </div>
        </div>

        {/* 批量操作按钮 */}
        {(onAcceptAll || onRejectAll) && statistics.pending > 0 && (
          <>
            <Divider style={{ margin: `${tokens.spacingVerticalM} 0` }} />
            <div className={styles.actions}>
              {onAcceptAll && (
                <Button
                  appearance="primary"
                  icon={<CheckmarkRegular />}
                  onClick={onAcceptAll}
                  disabled={disabled || statistics.pending === 0}
                >
                  接受全部 ({statistics.pending})
                </Button>
              )}
              {onRejectAll && (
                <Button
                  appearance="subtle"
                  icon={<DismissRegular />}
                  onClick={onRejectAll}
                  disabled={disabled || statistics.pending === 0}
                >
                  拒绝全部
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      <Divider />

      {/* 差异列表 */}
      <div className={styles.content}>
        {diffs.map((diff) => (
          <DiffItem
            key={diff.id}
            diff={diff}
            onAccept={onAcceptDiff}
            onReject={onRejectDiff}
            onLocate={onLocate}
            showContext={showContext}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}
