/**
 * 待应用修改卡片组件
 * 
 * 展示所有待应用的修改操作，支持用户确认后批量应用或放弃
 */

import {
  Button,
  Card,
  CardHeader,
  makeStyles,
  ProgressBar,
  Spinner,
  Text,
  tokens,
  Tooltip
} from '@fluentui/react-components'
import {
  ArrowSyncRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  DocumentEditRegular,
  ErrorCircleRegular,
  InfoRegular,
  WarningRegular
} from '@fluentui/react-icons'
import React, { useMemo } from 'react'

import type { PendingOperation, PendingPlan } from '../../../store/appStore'

const useStyles = makeStyles({
  card: {
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`
  },
  headerIcon: {
    color: tokens.colorBrandForeground1,
    fontSize: '20px'
  },
  headerTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    flex: 1
  },
  headerStats: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3
  },
  content: {
    padding: tokens.spacingVerticalM
  },
  operationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  operationItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`
  },
  operationIndex: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    borderRadius: '50%',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    flexShrink: 0
  },
  operationContent: {
    flex: 1,
    minWidth: 0
  },
  operationDescription: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalXS
  },
  operationDetails: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3
  },
  operationTool: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase100,
    backgroundColor: tokens.colorNeutralBackground4,
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
    borderRadius: tokens.borderRadiusSmall,
    marginRight: tokens.spacingHorizontalS
  },
  riskBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXXS,
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase100
  },
  riskLow: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    color: tokens.colorPaletteGreenForeground1
  },
  riskMedium: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
    color: tokens.colorPaletteYellowForeground1
  },
  riskHigh: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground1
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2
  },
  footerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3
  },
  footerActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS
  },
  progressSection: {
    padding: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalS
  },
  progressText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2
  },
  statusApplied: {
    color: tokens.colorPaletteGreenForeground1
  },
  statusFailed: {
    color: tokens.colorPaletteRedForeground1
  },
  emptyState: {
    padding: tokens.spacingVerticalL,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3
  }
})

interface PendingChangesCardProps {
  /** 待执行计划 */
  plan: PendingPlan
  /** 是否正在应用 */
  isApplying?: boolean
  /** 应用进度 (0-100) */
  applyProgress?: number
  /** 当前正在执行的操作索引 */
  currentOperationIndex?: number
  /** 点击应用所有按钮 */
  onApplyAll?: () => void
  /** 点击放弃按钮 */
  onDiscard?: () => void
  /** 点击回滚按钮 */
  onRollback?: () => void
}

/**
 * 待应用修改卡片组件
 */
export const PendingChangesCard: React.FC<PendingChangesCardProps> = ({
  plan,
  isApplying = false,
  applyProgress = 0,
  currentOperationIndex = -1,
  onApplyAll,
  onDiscard,
  onRollback
}) => {
  const styles = useStyles()

  // 计算统计信息
  const stats = useMemo(() => {
    const operations = plan.operations
    const totalTime = operations.reduce((sum: number, op: PendingOperation) => sum + op.estimatedTime, 0)
    const highRiskCount = operations.filter((op: PendingOperation) => op.riskLevel === 'high' || op.riskLevel === 'critical').length
    
    return {
      totalOperations: operations.length,
      totalTime: Math.round(totalTime / 1000), // 秒
      highRiskCount
    }
  }, [plan.operations])

  // 获取风险等级样式
  const getRiskStyle = (riskLevel: PendingOperation['riskLevel']) => {
    switch (riskLevel) {
      case 'high':
      case 'critical':
        return styles.riskHigh
      case 'medium':
        return styles.riskMedium
      default:
        return styles.riskLow
    }
  }

  // 获取风险等级文本
  const getRiskText = (riskLevel: PendingOperation['riskLevel']) => {
    switch (riskLevel) {
      case 'critical':
        return '极高风险'
      case 'high':
        return '高风险'
      case 'medium':
        return '中等'
      default:
        return '低风险'
    }
  }

  // 获取风险图标
  const getRiskIcon = (riskLevel: PendingOperation['riskLevel']) => {
    switch (riskLevel) {
      case 'high':
      case 'critical':
        return <ErrorCircleRegular />
      case 'medium':
        return <WarningRegular />
      default:
        return <CheckmarkCircleRegular />
    }
  }

  // 渲染状态图标
  const renderStatusIcon = () => {
    switch (plan.status) {
      case 'applied':
        return <CheckmarkCircleRegular className={styles.statusApplied} />
      case 'rolled_back':
      case 'discarded':
        return <DismissCircleRegular className={styles.statusFailed} />
      case 'applying':
        return <Spinner size="tiny" />
      default:
        return <DocumentEditRegular className={styles.headerIcon} />
    }
  }

  // 渲染状态文本
  const getStatusText = () => {
    switch (plan.status) {
      case 'applied':
        return '已应用'
      case 'rolled_back':
        return '已回滚'
      case 'discarded':
        return '已放弃'
      case 'applying':
        return '正在应用...'
      default:
        return '待确认'
    }
  }

  if (plan.operations.length === 0) {
    return (
      <Card className={styles.card}>
        <div className={styles.emptyState}>
          <InfoRegular style={{ fontSize: '24px', marginBottom: tokens.spacingVerticalS }} />
          <Text>没有待应用的修改</Text>
        </div>
      </Card>
    )
  }

  return (
    <Card className={styles.card}>
      {/* 头部 */}
      <div className={styles.header}>
        {renderStatusIcon()}
        <Text className={styles.headerTitle}>
          {plan.title || '待应用修改'}
        </Text>
        <div className={styles.headerStats}>
          <span>{stats.totalOperations} 个操作</span>
          <span>约 {stats.totalTime}s</span>
          {stats.highRiskCount > 0 && (
            <span style={{ color: tokens.colorPaletteRedForeground1 }}>
              {stats.highRiskCount} 个高风险
            </span>
          )}
        </div>
      </div>

      {/* 操作列表 */}
      <div className={styles.content}>
        <div className={styles.operationList}>
          {plan.operations.map((op: PendingOperation, index: number) => (
            <div 
              key={op.id} 
              className={styles.operationItem}
              style={{
                opacity: isApplying && index < currentOperationIndex ? 0.5 : 1,
                borderColor: isApplying && index === currentOperationIndex 
                  ? tokens.colorBrandStroke1 
                  : undefined
              }}
            >
              <div className={styles.operationIndex}>
                {isApplying && index === currentOperationIndex ? (
                  <Spinner size="extra-tiny" />
                ) : isApplying && index < currentOperationIndex ? (
                  <CheckmarkCircleRegular />
                ) : (
                  index + 1
                )}
              </div>
              <div className={styles.operationContent}>
                <div className={styles.operationDescription}>
                  {op.description}
                </div>
                <div className={styles.operationDetails}>
                  <span className={styles.operationTool}>{op.toolName}</span>
                  <span>{op.parametersSummary}</span>
                  <Tooltip content={getRiskText(op.riskLevel)} relationship="label">
                    <span 
                      className={`${styles.riskBadge} ${getRiskStyle(op.riskLevel)}`}
                      style={{ marginLeft: tokens.spacingHorizontalS }}
                    >
                      {getRiskIcon(op.riskLevel)}
                      {getRiskText(op.riskLevel)}
                    </span>
                  </Tooltip>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 进度条（仅在应用时显示） */}
      {isApplying && (
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <Text className={styles.progressText}>
              正在应用修改 ({currentOperationIndex + 1}/{stats.totalOperations})
            </Text>
            <Text className={styles.progressText}>
              {Math.round(applyProgress)}%
            </Text>
          </div>
          <ProgressBar value={applyProgress / 100} />
        </div>
      )}

      {/* 底部操作栏 */}
      {plan.status === 'pending' && !isApplying && (
        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            <InfoRegular />
            <span>确认后将应用所有修改到文档</span>
          </div>
          <div className={styles.footerActions}>
            <Button 
              appearance="subtle" 
              icon={<DismissCircleRegular />}
              onClick={onDiscard}
            >
              放弃
            </Button>
            <Button 
              appearance="primary" 
              icon={<CheckmarkCircleRegular />}
              onClick={onApplyAll}
            >
              应用所有修改
            </Button>
          </div>
        </div>
      )}

      {/* 已应用状态的操作栏 */}
      {plan.status === 'applied' && (
        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            <CheckmarkCircleRegular style={{ color: tokens.colorPaletteGreenForeground1 }} />
            <span>{getStatusText()}</span>
          </div>
          <div className={styles.footerActions}>
            {plan.documentSnapshot && (
              <Button 
                appearance="subtle" 
                icon={<ArrowSyncRegular />}
                onClick={onRollback}
              >
                撤销所有修改
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 已放弃/已回滚状态 */}
      {(plan.status === 'discarded' || plan.status === 'rolled_back') && (
        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            <DismissCircleRegular style={{ color: tokens.colorNeutralForeground3 }} />
            <span>{getStatusText()}</span>
          </div>
        </div>
      )}
    </Card>
  )
}

export default PendingChangesCard
