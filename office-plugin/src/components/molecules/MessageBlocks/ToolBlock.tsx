/**
 * ToolBlock - MCP 工具调用块组件
 * 显示工具调用的输入、输出和状态
 * 支持特殊处理联网搜索结果（显示可点击的链接卡片）
 */

import {
  CheckmarkCircleRegular,
  ClockRegular,
  ErrorCircleRegular,
  SpinnerIosRegular,
  WrenchRegular
} from '@fluentui/react-icons'
import { FC, useMemo } from 'react'

import { cn } from '@/lib/utils'
import type { MessageBlockStatus, ToolMessageBlock } from '../../../types/messageBlock'
import { Badge } from '../../ui/badge'
import { type SearchResult, SearchResultCard } from '../SearchResultCard'

export interface ToolBlockProps {
  block: ToolMessageBlock
}

const STATUS_CONFIG: Record<MessageBlockStatus, { label: string; badgeClass: string }> = {
  pending: { label: '等待中', badgeClass: 'bg-muted/80 text-muted-foreground' },
  paused: { label: '已暂停', badgeClass: 'bg-muted/80 text-muted-foreground' },
  processing: { label: '执行中', badgeClass: 'bg-primary/10 text-primary' },
  streaming: { label: '执行中', badgeClass: 'bg-primary/10 text-primary' },
  success: {
    label: '成功',
    badgeClass: 'bg-emerald-500/10 text-emerald-500',
  },
  error: {
    label: '失败',
    badgeClass: 'bg-red-500/10 text-red-500',
  },
}

const getStatusIndicator = (status: MessageBlockStatus) => {
  switch (status) {
    case 'success':
      return <CheckmarkCircleRegular className="h-4 w-4 text-emerald-400" />
    case 'error':
      return <ErrorCircleRegular className="h-4 w-4 text-red-400" />
    case 'processing':
    case 'streaming':
      return <SpinnerIosRegular className="h-4 w-4 animate-spin text-primary" />
    case 'pending':
    case 'paused':
    default:
      return <ClockRegular className="h-4 w-4 text-muted-foreground" />
  }
}

const parseSearchResults = (content: any): SearchResult[] | null => {
  try {
    let data = content
    if (typeof content === 'string') {
      try {
        data = JSON.parse(content)
      } catch {
        return null
      }
    }

    if (data && typeof data === 'object') {
      if (Array.isArray(data.results)) {
        return data.results.filter((r: any) => r.title && r.url && r.content)
      }
      if (Array.isArray(data)) {
        return data.filter((r: any) => r.title && r.url && r.content)
      }
    }

    return null
  } catch {
    return null
  }
}

export const ToolBlock: FC<ToolBlockProps> = ({ block }) => {
  const statusConfig = STATUS_CONFIG[block.status]

  const isWebSearchTool =
    block.toolName === 'builtin_web_search' || block.toolId?.includes('web_search')

  const searchResults = useMemo(() => {
    if (!isWebSearchTool || !block.content) return null
    return parseSearchResults(block.content)
  }, [isWebSearchTool, block.content])

  return (
    <div className="glass mt-3 rounded-2xl border border-border/60 bg-card/90 text-foreground shadow-lg shadow-black/10">
      <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <WrenchRegular className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{block.toolName || block.toolId}</p>
          <p className="text-xs text-muted-foreground">
            {block.toolId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIndicator(block.status)}
          <Badge className={cn('rounded-full px-3 py-0.5 text-xs font-medium', statusConfig.badgeClass)}>
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {block.arguments && Object.keys(block.arguments).length > 0 && (
        <section className="space-y-2 border-b border-border/30 px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground">
            {isWebSearchTool ? '搜索关键词' : '输入参数'}
          </p>
          <pre className="max-h-48 overflow-y-auto rounded-2xl bg-muted/60 p-3 text-xs text-muted-foreground">
            {JSON.stringify(block.arguments, null, 2)}
          </pre>
        </section>
      )}

      {searchResults && searchResults.length > 0 ? (
        <section className="space-y-3 border-b border-border/30 px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground">
            搜索结果（{searchResults.length}条）
          </p>
          <div className="space-y-2">
            {searchResults.map((result, index) => (
              <SearchResultCard key={`${result.url}-${index}`} result={result} index={index} />
            ))}
          </div>
        </section>
      ) : (
        block.content && (
          <section className="space-y-2 border-b border-border/30 px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground">输出结果</p>
            <pre className="max-h-60 overflow-y-auto rounded-2xl bg-muted/60 p-3 text-xs text-muted-foreground">
              {typeof block.content === 'string'
                ? block.content
                : JSON.stringify(block.content, null, 2)}
            </pre>
          </section>
        )
      )}

      {block.error && (
        <section className="px-4 py-3">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            错误：{block.error.message}
            {block.error.code && <span className="ml-2 text-xs">代码: {block.error.code}</span>}
          </div>
        </section>
      )}
    </div>
  )
}
