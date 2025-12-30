/**
 * CitationBlock - 引用来源块组件
 * 已迁移到 Tailwind
 */

import {
  DocumentTextRegular,
  GlobeRegular,
  LinkRegular
} from '@fluentui/react-icons'
import { FC } from 'react'

import { Badge } from '@/components/ui/badge'
import type { CitationMessageBlock } from '../../../types/messageBlock'

export interface CitationBlockProps {
  block: CitationMessageBlock
}

export const CitationBlock: FC<CitationBlockProps> = ({ block }) => {
  const hasKnowledge = block.knowledge && block.knowledge.length > 0
  const hasResponse = block.response?.results && block.response.results.length > 0

  if (!hasKnowledge && !hasResponse) {
    return null
  }

  return (
    <div className="my-2 rounded-lg border border-border bg-muted/30">
      <div className="flex items-center gap-2 p-2 border-b border-border">
        <DocumentTextRegular className="h-4 w-4 text-primary" />
        <span className="flex-1 font-semibold text-sm">引用来源</span>
        <Badge variant="secondary">
          {(block.knowledge?.length || 0) + (block.response?.results?.length || 0)} 条
        </Badge>
      </div>

      <div className="p-2">
        {/* 知识库引用 */}
        {hasKnowledge && (
          <>
            <p className="text-sm font-semibold text-muted-foreground mb-2 px-1">知识库引用</p>
            {block.knowledge!.map((item, index) => (
              <div key={item.id} className="p-2 border-b border-border last:border-b-0">
                <div className="flex items-center gap-2 mb-1">
                  <DocumentTextRegular className="h-3.5 w-3.5" />
                  <span className="flex-1 text-xs font-semibold">
                    [{index + 1}] {item.title}
                  </span>
                  {item.score !== undefined && (
                    <Badge variant="outline" className="text-[10px] px-1">
                      {(item.score * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">{item.content}</p>
              </div>
            ))}
          </>
        )}

        {/* 网络搜索结果 */}
        {hasResponse && (
          <>
            <p className="text-sm font-semibold text-muted-foreground mb-2 px-1">网络搜索</p>
            {block.response!.results!.map((item, index) => (
              <div key={index} className="p-2 border-b border-border last:border-b-0">
                <div className="flex items-center gap-2 mb-1">
                  <GlobeRegular className="h-3.5 w-3.5" />
                  <span className="flex-1 text-xs font-semibold">
                    [{index + 1}] {item.title}
                  </span>
                  {item.score !== undefined && (
                    <Badge variant="outline" className="text-[10px] px-1">
                      {(item.score * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">{item.content}</p>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
                  >
                    <LinkRegular className="h-3 w-3" />
                    查看原文
                  </a>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
