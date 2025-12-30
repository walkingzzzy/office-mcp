import React, { useState } from 'react'
import { 
  tokens, 
  Button, 
  Spinner,
  Tooltip,
  ProgressBar
} from '@fluentui/react-components'
import {
  CheckmarkCircleRegular,
  ChevronDownRegular,
  ChevronRightRegular,
  CircleRegular,
  ClockRegular,
  DismissCircleRegular,
  PauseRegular,
  PlayRegular,
  SkipForward10Regular,
  SpinnerIosRegular,
  TaskListSquareAddRegular
} from '@fluentui/react-icons'

import type { TaskPlanMessageBlock } from '../../../types/messageBlock'
import Logger from '../../../utils/logger'

const logger = new Logger('TaskPlanView')

const ISSUE_TYPE_LABELS: Record<string, string> = {
  structure: '结构问题',
  format: '格式问题',
  content: '内容问题',
  style: '风格问题',
  other: '其他问题'
}

interface TaskPlanViewProps {
  /** 任务计划消息块 */
  block: TaskPlanMessageBlock
  /** 开始执行回调 */
  onStartExecution?: () => void
  /** 暂停执行回调 */
  onPauseExecution?: () => void
  /** 跳过当前步骤回调 */
  onSkipStep?: (stepId: string) => void
  /** 取消任务回调 */
  onCancelTask?: () => void
  /** 是否正在加载 */
  isLoading?: boolean
}

/**
 * 获取步骤状态图标
 */
const getStepStatusIcon = (status: string, isCurrentStep: boolean) => {
  const iconSize = 18
  
  switch (status) {
    case 'completed':
      return <CheckmarkCircleRegular style={{ width: iconSize, height: iconSize, color: tokens.colorPaletteGreenForeground1 }} />
    case 'in_progress':
      return <SpinnerIosRegular style={{ width: iconSize, height: iconSize, color: tokens.colorBrandForeground1 }} className="animate-spin" />
    case 'failed':
      return <DismissCircleRegular style={{ width: iconSize, height: iconSize, color: tokens.colorPaletteRedForeground1 }} />
    case 'skipped':
      return <SkipForward10Regular style={{ width: iconSize, height: iconSize, color: tokens.colorNeutralForeground3 }} />
    case 'pending':
    default:
      return <CircleRegular style={{ width: iconSize, height: iconSize, color: isCurrentStep ? tokens.colorBrandForeground1 : tokens.colorNeutralForeground3 }} />
  }
}

/**
 * 获取计划状态文本
 */
const getPlanStatusText = (status: string): string => {
  switch (status) {
    case 'planning': return '正在规划...'
    case 'ready': return '准备就绪'
    case 'executing': return '执行中'
    case 'completed': return '已完成'
    case 'failed': return '执行失败'
    case 'cancelled': return '已取消'
    default: return status
  }
}

/**
 * 获取计划状态颜色
 */
const getPlanStatusColor = (status: string): string => {
  switch (status) {
    case 'planning': return tokens.colorNeutralForeground2
    case 'ready': return tokens.colorBrandForeground1
    case 'executing': return tokens.colorBrandForeground1
    case 'completed': return tokens.colorPaletteGreenForeground1
    case 'failed': return tokens.colorPaletteRedForeground1
    case 'cancelled': return tokens.colorNeutralForeground3
    default: return tokens.colorNeutralForeground2
  }
}

/**
 * TaskPlanView 组件
 * 
 * 显示任务拆分和执行进度，类似 Cursor/Claude/Windsurf 的任务规划视图
 */
export const TaskPlanView: React.FC<TaskPlanViewProps> = ({
  block,
  onStartExecution,
  onPauseExecution,
  onSkipStep,
  onCancelTask,
  isLoading
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  
  const {
    planId,
    title,
    description,
    planStatus,
    steps,
    currentStepIndex,
    totalSteps,
    completedSteps,
    progress,
    requiresConfirmation,
    userConfirmed
  } = block

  const toggleStepExpanded = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev)
      if (newSet.has(stepId)) {
        newSet.delete(stepId)
      } else {
        newSet.add(stepId)
      }
      return newSet
    })
  }

  const handleStartExecution = () => {
    logger.info('Start execution requested', { planId })
    onStartExecution?.()
  }

  const renderHeader = () => (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
        backgroundColor: tokens.colorNeutralBackground3,
        borderRadius: `${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium} 0 0`,
        cursor: 'pointer'
      }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
        {isExpanded ? <ChevronDownRegular style={{ width: 16, height: 16 }} /> : <ChevronRightRegular style={{ width: 16, height: 16 }} />}
        <TaskListSquareAddRegular style={{ width: 18, height: 18, color: tokens.colorBrandForeground1 }} />
        <span style={{ 
          fontWeight: 600, 
          fontSize: tokens.fontSizeBase300,
          color: tokens.colorNeutralForeground1
        }}>
          {title}
        </span>
        <span style={{
          fontSize: tokens.fontSizeBase200,
          color: getPlanStatusColor(planStatus),
          backgroundColor: tokens.colorNeutralBackground1,
          padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
          borderRadius: tokens.borderRadiusSmall
        }}>
          {getPlanStatusText(planStatus)}
        </span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
        <span style={{ 
          fontSize: tokens.fontSizeBase200, 
          color: tokens.colorNeutralForeground2 
        }}>
          {completedSteps}/{totalSteps} 步骤
        </span>
        {planStatus === 'executing' && (
          <Spinner size="tiny" />
        )}
      </div>
    </div>
  )

  const renderProgressBar = () => (
    <div style={{ padding: `0 ${tokens.spacingHorizontalM}` }}>
      <ProgressBar 
        value={progress / 100} 
        thickness="medium"
        color={planStatus === 'failed' ? 'error' : planStatus === 'completed' ? 'success' : 'brand'}
      />
    </div>
  )

  const renderStep = (step: typeof steps[0], index: number) => {
    const isCurrentStep = index === currentStepIndex
    const isStepExpanded = expandedSteps.has(step.id)
    
    return (
      <div 
        key={step.id}
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
          backgroundColor: isCurrentStep ? tokens.colorNeutralBackground2 : 'transparent',
          borderLeft: isCurrentStep 
            ? `3px solid ${tokens.colorBrandForeground1}` 
            : '3px solid transparent',
          transition: 'all 0.2s ease'
        }}
      >
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: tokens.spacingHorizontalS,
            cursor: step.resultSummary || step.error ? 'pointer' : 'default'
          }}
          onClick={() => {
            if (step.resultSummary || step.error) {
              toggleStepExpanded(step.id)
            }
          }}
        >
          <div style={{ marginTop: '2px' }}>
            {getStepStatusIcon(step.status, isCurrentStep)}
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: tokens.spacingHorizontalS 
            }}>
              <span style={{
                fontSize: tokens.fontSizeBase200,
                color: tokens.colorNeutralForeground3,
                fontWeight: 500,
                minWidth: '24px'
              }}>
                {step.index}.
              </span>
              <span style={{
                fontSize: tokens.fontSizeBase300,
                color: step.status === 'pending' 
                  ? tokens.colorNeutralForeground3 
                  : tokens.colorNeutralForeground1,
                fontWeight: isCurrentStep ? 500 : 400
              }}>
                {step.description}
              </span>
              {step.issueType && (
                <span style={{
                  fontSize: tokens.fontSizeBase100,
                  color: tokens.colorNeutralForeground3,
                  backgroundColor: tokens.colorNeutralBackground2,
                  borderRadius: tokens.borderRadiusSmall,
                  padding: '0 6px'
                }}>
                  {ISSUE_TYPE_LABELS[step.issueType] || step.issueType}
                </span>
              )}
            </div>

            {(step.sourceIssueText || step.locationHint) && (
              <div style={{
                marginTop: tokens.spacingVerticalXXS,
                marginLeft: '28px',
                fontSize: tokens.fontSizeBase200,
                color: tokens.colorNeutralForeground3
              }}>
                来源：{step.sourceIssueText || '审查问题'}
                {step.locationHint ? `（${step.locationHint}）` : ''}
              </div>
            )}

            {step.expectedTools?.length ? (
              <div style={{
                marginTop: tokens.spacingVerticalXXS,
                marginLeft: '28px',
                fontSize: tokens.fontSizeBase200,
                color: tokens.colorNeutralForeground3
              }}>
                建议工具：{step.expectedTools.join('、')}
              </div>
            ) : null}

            {step.dependsOn?.length ? (
              <div style={{
                marginTop: tokens.spacingVerticalXXS,
                marginLeft: '28px',
                fontSize: tokens.fontSizeBase200,
                color: tokens.colorNeutralForeground3
              }}>
                依赖步骤：
                {step.dependsOn
                  .map(dep => dep.startsWith('issue-') ? `#${dep.split('-')[1]}` : dep)
                  .join('、')}
              </div>
            ) : null}
            
            {/* 展开的详情 */}
            {isStepExpanded && (step.resultSummary || step.error) && (
              <div style={{
                marginTop: tokens.spacingVerticalS,
                marginLeft: '28px',
                padding: tokens.spacingVerticalS,
                backgroundColor: step.error 
                  ? tokens.colorPaletteRedBackground1 
                  : tokens.colorNeutralBackground1,
                borderRadius: tokens.borderRadiusSmall,
                fontSize: tokens.fontSizeBase200,
                color: step.error 
                  ? tokens.colorPaletteRedForeground1 
                  : tokens.colorNeutralForeground2
              }}>
                {step.error || step.resultSummary}
              </div>
            )}
          </div>
          
          {/* 跳过按钮 */}
          {step.status === 'in_progress' && onSkipStep && (
            <Tooltip content="跳过此步骤" relationship="label">
              <Button
                appearance="subtle"
                size="small"
                icon={<SkipForward10Regular style={{ width: 14, height: 14 }} />}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  onSkipStep(step.id)
                }}
              />
            </Tooltip>
          )}
          
          {/* 展开/收起指示器 */}
          {(step.resultSummary || step.error) && (
            <div style={{ marginLeft: tokens.spacingHorizontalXS }}>
              {isStepExpanded ? <ChevronDownRegular style={{ width: 14, height: 14 }} /> : <ChevronRightRegular style={{ width: 14, height: 14 }} />}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderActions = () => {
    if (planStatus === 'completed' || planStatus === 'cancelled') {
      return null
    }

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: tokens.spacingHorizontalS,
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
        borderTop: `1px solid ${tokens.colorNeutralStroke2}`
      }}>
        {planStatus === 'ready' && requiresConfirmation && !userConfirmed && (
          <>
            <Button
              appearance="subtle"
              size="small"
              onClick={onCancelTask}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              appearance="primary"
              size="small"
              icon={<PlayRegular style={{ width: 14, height: 14 }} />}
              onClick={handleStartExecution}
              disabled={isLoading}
            >
              开始执行
            </Button>
          </>
        )}
        
        {planStatus === 'executing' && onPauseExecution && (
          <Button
            appearance="subtle"
            size="small"
            icon={<PauseRegular style={{ width: 14, height: 14 }} />}
            onClick={onPauseExecution}
            disabled={isLoading}
          >
            暂停
          </Button>
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorNeutralBackground1,
        overflow: 'hidden',
        marginBottom: tokens.spacingVerticalM
      }}
    >
      {renderHeader()}
      
      {isExpanded && (
        <>
          {renderProgressBar()}
          
          {description && (
            <div style={{
              padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
              fontSize: tokens.fontSizeBase200,
              color: tokens.colorNeutralForeground2,
              borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
            }}>
              {description}
            </div>
          )}
          
          <div style={{ 
            maxHeight: '300px', 
            overflowY: 'auto' 
          }}>
            {steps.map((step, index) => renderStep(step, index))}
          </div>
          
          {renderActions()}
        </>
      )}
    </div>
  )
}

export default TaskPlanView
