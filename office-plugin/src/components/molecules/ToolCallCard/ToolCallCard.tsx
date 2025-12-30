/**
 * ToolCallCard - 工具调用可视化组件
 * 已迁移到 Tailwind
 */

import {
  ArrowResetRegular,
  CheckmarkCircleRegular,
  ChevronDownRegular,
  ChevronUpRegular,
  CodeRegular,
  DocumentTextRegular,
  ErrorCircleRegular,
  SearchRegular,
  SpinnerIosRegular
} from '@fluentui/react-icons'
import React, { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ToolCallStatus = 'pending' | 'running' | 'success' | 'error'

export interface ToolCallCardProps {
  toolName: string
  description?: string
  status: ToolCallStatus
  progress?: number
  executionTime?: number
  errorMessage?: string
  resultSummary?: string
  resultDetails?: string
  onRetry?: () => void
  className?: string
}

// 工具图标映射
const getToolIcon = (toolName: string) => {
  const iconClass = 'h-4 w-4'
  const iconMap: Record<string, React.ReactNode> = {
    'word_insert_text': <DocumentTextRegular className={iconClass} />,
    'word_get_selected_text': <DocumentTextRegular className={iconClass} />,
    'word_find_and_replace': <SearchRegular className={iconClass} />,
    'word_format_text': <DocumentTextRegular className={iconClass} />,
    'code_execute': <CodeRegular className={iconClass} />,
    'web_search': <SearchRegular className={iconClass} />
  }
  return iconMap[toolName] || <CodeRegular className={iconClass} />
}

// 状态配置
const statusConfig: Record<ToolCallStatus, { borderColor: string; badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  pending: { borderColor: 'border-l-muted-foreground', badgeVariant: 'secondary', label: '等待中' },
  running: { borderColor: 'border-l-primary', badgeVariant: 'default', label: '执行中' },
  success: { borderColor: 'border-l-green-500', badgeVariant: 'outline', label: '已完成' },
  error: { borderColor: 'border-l-red-500', badgeVariant: 'destructive', label: '失败' }
}

// 格式化执行时间
const formatExecutionTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export const ToolCallCard: React.FC<ToolCallCardProps> = ({
  toolName,
  description,
  status,
  progress,
  executionTime,
  errorMessage,
  resultSummary,
  resultDetails,
  onRetry,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const config = statusConfig[status]

  return (
    <div
      className={cn(
        'my-2 rounded-lg border border-border/50 glass transition-all duration-200 hover:shadow-md border-l-4',
        config.borderColor,
        status === 'running' && 'animate-pulse',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        <div className={cn(
          status === 'pending' && 'text-muted-foreground',
          status === 'running' && 'text-primary',
          status === 'success' && 'text-green-500',
          status === 'error' && 'text-red-500'
        )}>
          {status === 'running' ? (
            <SpinnerIosRegular className="h-4 w-4 animate-spin" />
          ) : (
            getToolIcon(toolName)
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold truncate">{description || toolName}</span>
            <Badge variant={config.badgeVariant} className="text-[10px] px-1.5 py-0">
              {config.label}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {toolName}
            {executionTime !== undefined && status !== 'running' && (
              <> · {formatExecutionTime(executionTime)}</>
            )}
          </p>
        </div>

        {resultDetails && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUpRegular className="h-4 w-4" /> : <ChevronDownRegular className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {status === 'running' && progress !== undefined && (
        <div className="px-3 pb-2">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(progress * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {status === 'error' && errorMessage && (
        <div className="px-3 pb-2">
          <p className="text-xs text-red-500">{errorMessage}</p>
          {onRetry && (
            <Button size="sm" variant="ghost" onClick={onRetry} className="mt-1 h-6 text-xs">
              <ArrowResetRegular className="h-3 w-3 mr-1" />
              重试
            </Button>
          )}
        </div>
      )}

      {/* Result summary */}
      {status === 'success' && resultSummary && !isExpanded && (
        <div className="px-3 pb-2">
          <p className="text-xs text-muted-foreground">{resultSummary}</p>
        </div>
      )}

      {/* Expanded details */}
      {isExpanded && resultDetails && (
        <div className="px-3 pb-2 border-t border-border mt-1">
          <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto mt-2">
            {resultDetails}
          </pre>
        </div>
      )}
    </div>
  )
}

export default ToolCallCard
