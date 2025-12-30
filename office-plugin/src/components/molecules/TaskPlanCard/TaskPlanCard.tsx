/**
 * TaskPlanCard - 任务计划卡片
 * 展示步骤进度与操作控制
 */

import {
  CheckmarkCircleRegular,
  ClockRegular,
  DismissCircleRegular,
  PauseRegular,
  PlayRegular,
  SkipForward10Regular,
  SquareRegular,
  TaskListSquareAddRegular,
  WarningRegular
} from '@fluentui/react-icons'
import React, { useMemo } from 'react'

import { cn } from '@/lib/utils'
import type { TaskPlan, TaskStepStatus } from '../../../services/ai/conversation'
import { Button } from '../../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip'

const ISSUE_TYPE_LABELS: Record<string, string> = {
  structure: '结构问题',
  format: '格式问题',
  content: '内容问题',
  style: '风格问题',
  other: '其他问题'
}

export interface TaskPlanCardProps {
  plan: TaskPlan
  currentStepIndex?: number
  isExecuting?: boolean
  isPaused?: boolean
  onStart?: () => void
  onPause?: () => void
  onResume?: () => void
  onCancel?: () => void
  onSkipStep?: (stepIndex: number) => void
  onModifyPlan?: () => void
  onConfirmPlan?: () => void
}

const statusIcon = (status: TaskStepStatus, isCurrent: boolean) => {
  switch (status) {
    case 'completed':
      return <CheckmarkCircleRegular className="h-4 w-4 text-green-500" />
    case 'failed':
      return <DismissCircleRegular className="h-4 w-4 text-destructive" />
    case 'skipped':
      return <SkipForward10Regular className="h-4 w-4 text-muted-foreground" />
    case 'executing':
      return <SquareRegular className="h-3 w-3 animate-pulse text-primary" />
    default:
      return <div className={cn('h-2 w-2 rounded-full border', isCurrent ? 'border-primary' : 'border-border/60')} />
  }
}

const formatTime = (ms = 0) => {
  if (ms < 1000) return `${ms}ms`
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}分${rest ? `${rest}秒` : ''}`
}

export const TaskPlanCard: React.FC<TaskPlanCardProps> = ({
  plan,
  currentStepIndex = -1,
  isExecuting = false,
  isPaused = false,
  onStart,
  onPause,
  onResume,
  onCancel,
  onSkipStep,
  onModifyPlan,
  onConfirmPlan,
}) => {
  const progress = useMemo(() => {
    const completed = plan.steps.filter((step) => step.status === 'completed').length
    return plan.steps.length > 0 ? completed / plan.steps.length : 0
  }, [plan.steps])

  const estimatedTime = useMemo(() => plan.steps.reduce((total, step) => total + (step.estimatedTime || 2000), 0), [plan.steps])
  const actualTime = useMemo(() => plan.steps.reduce((total, step) => total + (step.actualTime || 0), 0), [plan.steps])

  return (
    <div className="glass w-full rounded-2xl border border-border/60 bg-card/85 px-5 py-5 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <TaskListSquareAddRegular className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{plan.title}</p>
          <p className="text-xs text-muted-foreground">
            共 {plan.steps.length} 个步骤 · 预计 {formatTime(estimatedTime)}
          </p>
        </div>
        {plan.status === 'draft' && onConfirmPlan && (
          <Button type="button" size="sm" className="ml-auto" onClick={onConfirmPlan}>
            确认执行
          </Button>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <div className="h-2 w-full rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{Math.round(progress * 100)}% 完成</span>
          {actualTime > 0 && (
            <span className="flex items-center gap-1">
              <ClockRegular className="h-3.5 w-3.5" />
              {formatTime(actualTime)}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {plan.steps.map((step, index) => {
          const isCurrent = index === currentStepIndex
          return (
            <div
              key={step.id}
              className={cn(
                'rounded-2xl border border-border/40 px-4 py-3 text-sm transition',
                isCurrent && 'border-primary/60 bg-primary/5',
                step.status === 'failed' && 'border-destructive/30 bg-destructive/5',
              )}>
              <div className="flex items-center gap-3">
                {statusIcon(step.status, isCurrent)}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{step.description}</p>
                    {step.issueType && (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        {ISSUE_TYPE_LABELS[step.issueType] || step.issueType}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {step.estimatedTime ? `预计 ${formatTime(step.estimatedTime)}` : '持续时间动态'}
                    {step.riskLevel === 'high' && <span className="ml-2 text-amber-500">高风险</span>}
                  </div>
                  {(step.sourceIssueText || step.locationHint) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      来源：{step.sourceIssueText || '审查问题'}
                      {step.locationHint && <span className="ml-1">({step.locationHint})</span>}
                    </p>
                  )}
                  {step.expectedTools?.length ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      建议工具：{step.expectedTools.join('、')}
                    </p>
                  ) : null}
                  {step.dependsOn?.length ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      依赖步骤：
                      {step.dependsOn
                        .map((dep) => (dep.startsWith('issue-') ? `#${dep.split('-')[1]}` : dep))
                        .join('、')}
                    </p>
                  ) : null}
                </div>
                {isCurrent && isExecuting && onSkipStep && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => onSkipStep(index)}
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary">
                        <SkipForward10Regular className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">跳过步骤</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
        {!isExecuting && plan.status !== 'completed' && plan.status !== 'cancelled' && plan.status !== 'confirmed' && (
          <>
            {onModifyPlan && (
              <Button type="button" variant="ghost" onClick={onModifyPlan}>
                调整计划
              </Button>
            )}
            {onStart && (
              <Button type="button" onClick={onStart}>
                <PlayRegular className="mr-2 h-4 w-4" /> 开始执行
              </Button>
            )}
          </>
        )}

        {isExecuting && (
          <>
            {isPaused ? (
              <Button type="button" variant="secondary" onClick={onResume}>
                <PlayRegular className="mr-2 h-4 w-4" /> 继续
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={onPause}>
                <PauseRegular className="mr-2 h-4 w-4" /> 暂停
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={onCancel} className="text-destructive">
              <DismissCircleRegular className="mr-2 h-4 w-4" /> 取消
            </Button>
          </>
        )}

        {plan.status === 'completed' && (
          <span className="text-sm text-green-500">任务已完成</span>
        )}
        {plan.status === 'cancelled' && <span className="text-sm text-muted-foreground">任务已取消</span>}
      </div>
    </div>
  )
}

export default TaskPlanCard
