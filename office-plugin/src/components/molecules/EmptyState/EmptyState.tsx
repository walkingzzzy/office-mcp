/**
 * EmptyState - 空状态组件
 * 玻璃拟态欢迎卡 + 建议卡片
 */

import {
  ChatRegular,
  DocumentTextRegular,
  SearchRegular,
  SparkleRegular
} from '@fluentui/react-icons'
import React from 'react'

import { cn } from '@/lib/utils'
import { BrandAvatar } from '../../atoms/BrandAvatar'

export interface SuggestionCard {
  id: string
  title: string
  icon: 'sparkles' | 'file' | 'message' | 'search'
  prompt?: string
}

export interface EmptyStateProps {
  title?: string
  subtitle?: string
  description?: string
  suggestions?: SuggestionCard[]
  onSuggestionClick?: (suggestion: SuggestionCard) => void
  className?: string
}

const iconMap = {
  sparkles: SparkleRegular,
  file: DocumentTextRegular,
  message: ChatRegular,
  search: SearchRegular,
}

const defaultSuggestions: SuggestionCard[] = [
  {
    id: '1',
    title: '介绍一下问津职校的专业设置',
    icon: 'message',
    prompt: '介绍一下问津职校的专业设置',
  },
  {
    id: '2',
    title: '如何提升专业技能水平',
    icon: 'search',
    prompt: '如何提升专业技能水平',
  },
  {
    id: '3',
    title: '帮我写一份实习报告',
    icon: 'file',
    prompt: '帮我写一份实习报告',
  },
  {
    id: '4',
    title: '职业规划与就业建议',
    icon: 'sparkles',
    prompt: '职业规划与就业建议',
  },
]

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = '欢迎使用问津AI助手',
  subtitle = '武汉问津职业学校 · 始于1958',
  description = '我是您的智能学习伙伴，可以帮助您解答学业问题、提供职业规划建议、辅助完成作业等。开始对话吧！',
  suggestions = defaultSuggestions,
  onSuggestionClick,
  className,
}) => {
  return (
    <div className={cn('relative flex w-full flex-1 flex-col items-center justify-center gap-8 px-6 py-8 text-center', className)}>
      {/* 欢迎区域 - 居中显示，匹配设计稿 */}
      <div className="flex flex-col items-center gap-4">
        {/* Logo - 匹配设计稿样式 */}
        <div className="relative">
          <BrandAvatar size={96} isAI useLogo showGlow />
        </div>

        {/* 标题 */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-sm text-primary">{subtitle}</p>
        </div>

        {/* 描述 */}
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>

      {/* 建议卡片 - 2x2网格布局匹配设计稿 */}
      <div className="grid w-full max-w-lg grid-cols-2 gap-3">
        {suggestions.map((suggestion, index) => {
          const Icon = iconMap[suggestion.icon]
          return (
            <button
              key={suggestion.id}
              onClick={() => onSuggestionClick?.(suggestion)}
              className={cn(
                'group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left shadow-sm transition duration-200',
                'hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5',
                'dark:border-gray-700 dark:bg-gray-800',
              )}
              style={{ animationDelay: `${index * 80}ms` }}>
              <div className={cn(
                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
                index === 0 && 'bg-blue-100 text-blue-600',
                index === 1 && 'bg-cyan-100 text-cyan-600', 
                index === 2 && 'bg-green-100 text-green-600',
                index === 3 && 'bg-amber-100 text-amber-600',
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-foreground leading-snug">{suggestion.title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default EmptyState
