/**
 * Excel 编辑面板组件
 * 显示 Excel 单元格修改建议列表和批量操作
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
  ClearFormattingRegular,
  DismissCircleRegular,
  DismissRegular,
  HighlightRegular} from '@fluentui/react-icons'
import React, { useEffect } from 'react'

import { useExcelEdit } from '../../../hooks/useExcelEdit'
import { CellChangeItem } from '../CellChangeItem'
import Logger from '../../../utils/logger'

const logger = new Logger('ExcelEditPanel')

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

export interface ExcelEditPanelProps {
  /** AI 生成的建议数据(JSON 格式) */
  aiSuggestions?: string
  /** 是否可见 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
}

/**
 * Excel 编辑面板组件
 */
export const ExcelEditPanel: React.FC<ExcelEditPanelProps> = ({
  aiSuggestions,
  visible,
  onClose
}) => {
  const styles = useStyles()
  const {
    worksheetContent,
    cellChanges,
    isLoading,
    error,
    totalChanges,
    pendingChanges,
    acceptedChanges,
    rejectedChanges,
    readWorksheet,
    addCellChanges,
    acceptChange,
    rejectChange,
    acceptAllChanges,
    rejectAllChanges,
    navigateToCell,
    highlightPendingChanges,
    clearHighlights,
    clearChanges
  } = useExcelEdit()

  // 初始化:读取工作表内容
  useEffect(() => {
    if (visible && !worksheetContent) {
      readWorksheet()
    }
  }, [visible, worksheetContent, readWorksheet])

  // 处理 AI 建议
  useEffect(() => {
    if (visible && aiSuggestions && worksheetContent) {
      try {
        const suggestions = JSON.parse(aiSuggestions)
        if (Array.isArray(suggestions)) {
          addCellChanges(suggestions)
        }
      } catch (err) {
        logger.error('Failed to parse AI suggestions', { error: err })
      }
    }
  }, [visible, aiSuggestions, worksheetContent, addCellChanges])

  if (!visible) {
    return null
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <Text className={styles.title}>Excel 单元格修改</Text>
          <Button appearance="subtle" icon={<DismissRegular />} onClick={onClose} />
        </div>

        {worksheetContent && (
          <Text size={300} style={{ marginBottom: tokens.spacingVerticalM }}>
            工作表: {worksheetContent.name}
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
                appearance="subtle"
                icon={<HighlightRegular />}
                onClick={highlightPendingChanges}
                size="small"
              >
                高亮待修改单元格
              </Button>
              <Button
                appearance="subtle"
                icon={<ClearFormattingRegular />}
                onClick={clearHighlights}
                size="small"
              >
                清除高亮
              </Button>
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
            <Text>正在加载工作表数据...</Text>
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
            <Text size={300}>AI 将为您提供单元格修改建议</Text>
          </div>
        )}

        {!isLoading &&
          cellChanges.map((change) => (
            <CellChangeItem
              key={change.id}
              change={change}
              onAccept={acceptChange}
              onReject={rejectChange}
              onLocate={navigateToCell}
            />
          ))}
      </div>
    </div>
  )
}
