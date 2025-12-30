/**
 * ErrorBlock - 错误信息块组件
 * 已迁移到 Tailwind
 */

import {
  ArrowResetRegular,
  ErrorCircleRegular
} from '@fluentui/react-icons'
import { FC } from 'react'

import { Button } from '@/components/ui/button'
import type { ErrorMessageBlock } from '../../../types/messageBlock'

export interface ErrorBlockProps {
  block: ErrorMessageBlock
  onRetry?: () => void
}

export const ErrorBlock: FC<ErrorBlockProps> = ({ block, onRetry }) => {
  return (
    <div className="my-2 rounded-lg bg-red-50 border-l-4 border-red-500">
      <div className="flex items-center gap-2 p-2 border-b border-red-200">
        <ErrorCircleRegular className="h-4 w-4 text-red-500" />
        <span className="flex-1 font-semibold text-red-600">错误</span>
      </div>

      <div className="p-2">
        <p className="text-foreground mb-1">{block.content}</p>

        {(block.errorCode || block.errorType) && (
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {block.errorType && `类型: ${block.errorType}`}
            {block.errorType && block.errorCode && ' | '}
            {block.errorCode && `代码: ${block.errorCode}`}
          </p>
        )}

        {onRetry && (
          <div className="mt-2">
            <Button size="sm" onClick={onRetry}>
              <ArrowResetRegular className="h-3.5 w-3.5 mr-1" />
              重试
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
