/**
 * ConnectionBanner - 连接状态横幅
 * 已迁移到 Tailwind
 */

import {
  ArrowResetRegular,
  DismissRegular
} from '@fluentui/react-icons'
import { FC } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ConnectionBannerProps {
  error?: string
  retrying?: boolean
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export const ConnectionBanner: FC<ConnectionBannerProps> = ({
  error = '无法连接到 office-local-bridge 服务，请确保服务正在运行',
  retrying = false,
  onRetry,
  onDismiss,
  className,
}) => {
  return (
    <div className={cn(
      'flex items-center justify-between py-2 px-4 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900 gap-4',
      className
    )}>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="font-semibold text-sm text-foreground">连接失败</span>
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onRetry && (
          <Button
            size="sm"
            onClick={onRetry}
            disabled={retrying}
          >
            <ArrowResetRegular className={cn('h-3.5 w-3.5 mr-1', retrying && 'animate-spin')} />
            {retrying ? '重试中...' : '重试'}
          </Button>
        )}
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDismiss}
            aria-label="关闭"
          >
            <DismissRegular className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
