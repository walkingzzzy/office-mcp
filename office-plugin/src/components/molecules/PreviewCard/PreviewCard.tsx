/**
 * PreviewCard - 操作预览卡片
 * 展示计划/操作的风险与步骤
 */

import {
  CheckmarkCircleRegular,
  DismissRegular,
  EyeRegular,
  WarningRegular
} from '@fluentui/react-icons'
import React, { useMemo } from 'react'

import { cn } from '@/lib/utils'
import type { OperationPreview, PlanPreview, RiskLevel } from '../../../services/ai/conversation/PreviewGenerator'
import { Button } from '../../ui/button'

export interface PreviewCardProps {
  preview?: OperationPreview
  planPreview?: PlanPreview
  onConfirm?: () => void
  onCancel?: () => void
  isExecuting?: boolean
}

const riskConfig: Record<RiskLevel, { label: string; className: string }> = {
  low: { label: '低风险', className: 'text-green-500 bg-green-500/10' },
  medium: { label: '中风险', className: 'text-amber-500 bg-amber-500/10' },
  high: { label: '高风险', className: 'text-red-500 bg-red-500/10' },
  critical: { label: '关键风险', className: 'text-red-600 bg-red-500/15' },
}

export const PreviewCard: React.FC<PreviewCardProps> = ({ preview, planPreview, onConfirm, onCancel, isExecuting = false }) => {
  const steps = useMemo(() => {
    if (planPreview) return planPreview.stepPreviews
    if (preview) return [preview]
    return []
  }, [preview, planPreview])

  const warnings = planPreview?.warnings || preview?.warnings || []
  const riskLevel = planPreview?.overallRisk || preview?.riskLevel || 'low'
  const summary = planPreview?.description || preview?.description || '系统将执行以下操作'
  const header = planPreview?.title || '操作预览'
  const totalSteps = steps.length
  const totalTime = planPreview?.totalEstimatedTime || preview?.estimatedTime || 0

  if (steps.length === 0) {
    return null
  }

  return (
    <div className="glass w-full rounded-2xl border border-border/60 bg-card/85 px-5 py-5 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <EyeRegular className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{header}</p>
          <p className="text-xs text-muted-foreground">
            {totalSteps} 个操作 · 预计 {Math.round(totalTime / 1000)} 秒
          </p>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', riskConfig[riskLevel].className)}>
          {riskConfig[riskLevel].label}
        </span>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{summary}</p>

      {warnings.length > 0 && (
        <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-500">
          {warnings.map((warning, index) => (
            <div key={index} className="flex items-center gap-2">
              <WarningRegular className="h-3.5 w-3.5" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="rounded-2xl border border-border/40 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="mt-1 text-xs text-muted-foreground">#{index + 1}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{step.description}</p>
                <p className="text-xs text-muted-foreground">
                  预计 {Math.round((step.estimatedTime ?? 0) / 1000)} 秒 · 影响范围：{step.affectedScope}
                </p>
                {step.formatChanges && step.formatChanges.length > 0 && (
                  <div className="mt-2 space-y-1 rounded-2xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                    {step.formatChanges.map((change, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckmarkCircleRegular className="h-3 w-3 text-primary" />
                        <span>
                          {change.property}: {change.originalValue ? `${change.originalValue} → ` : ''}{change.newValue}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isExecuting} className="text-muted-foreground">
            <DismissRegular className="mr-2 h-4 w-4" /> 取消
          </Button>
        )}
        {onConfirm && (
          <Button type="button" onClick={onConfirm} disabled={isExecuting}>
            <CheckmarkCircleRegular className="mr-2 h-4 w-4" /> {isExecuting ? '执行中...' : '确认执行'}
          </Button>
        )}
      </div>
    </div>
  )
}

export default PreviewCard
