/**
 * SearchResultCard - 搜索结果卡片组件
 * 显示单个搜索结果，包括标题、摘要和可点击的链接
 */

import {
  LinkRegular
} from '@fluentui/react-icons'
import { FC } from 'react'

import { cn } from '@/lib/utils'

export interface SearchResult {
  title: string
  url: string
  content: string
  score?: number
}

export interface SearchResultCardProps {
  result: SearchResult
  index?: number
  className?: string
}

export const SearchResultCard: FC<SearchResultCardProps> = ({ result, index, className }) => {
  const handleClick = () => {
    window.open(result.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'group w-full rounded-2xl border border-border/50 bg-card/90 px-4 py-3 text-left shadow-lg shadow-black/5 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-card',
        className,
      )}
      aria-label={`搜索结果 ${index !== undefined ? index + 1 : ''}: ${result.title}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-start gap-2">
            <span className="line-clamp-2 text-sm font-semibold text-foreground">{result.title}</span>
            <LinkRegular className="mt-0.5 h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{result.url}</p>
        </div>
      </div>

      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground/90">{result.content}</p>

      {result.score !== undefined && (
        <p className="mt-2 text-xs text-muted-foreground">
          相关度: {(result.score * 100).toFixed(0)}%
        </p>
      )}
    </button>
  )
}
