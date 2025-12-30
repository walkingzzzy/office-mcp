/**
 * ClarificationCard - 澄清问题卡片
 * 玻璃拟态布局 + Fluent 图标
 */

import {
  CheckmarkCircleRegular,
  CommentRegular,
  DismissRegular
} from '@fluentui/react-icons'
import React, { useCallback, useState } from 'react'

import { cn } from '@/lib/utils'
import type { ClarificationQuestion } from '../../../services/ai/conversation'
import { Button } from '../../ui/button'

export interface ClarificationCardProps {
  question: ClarificationQuestion
  onAnswer: (answer: string, selectedOptionId?: string) => void
  onSkip?: () => void
  allowSkip?: boolean
  isSubmitting?: boolean
}

export const ClarificationCard: React.FC<ClarificationCardProps> = ({
  question,
  onAnswer,
  onSkip,
  allowSkip = true,
  isSubmitting = false,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>()
  const [freeTextAnswer, setFreeTextAnswer] = useState('')

  const handleSubmit = useCallback(() => {
    if (question.type === 'free_text') {
      if (freeTextAnswer.trim()) {
        onAnswer(freeTextAnswer.trim())
      }
    } else if (selectedOptionId) {
      const option = question.options?.find((opt) => opt.id === selectedOptionId)
      onAnswer(option?.text || selectedOptionId, selectedOptionId)
    }
  }, [question, freeTextAnswer, selectedOptionId, onAnswer])

  const canSubmit = question.type === 'free_text' ? freeTextAnswer.trim().length > 0 : !!selectedOptionId

  return (
    <div className="glass w-full rounded-2xl border border-border/50 bg-card/85 px-5 py-5 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CommentRegular className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">需要更多信息</p>
          <p className="text-xs text-muted-foreground">回答以下问题以便更好地帮助您</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-sm font-medium text-foreground">{question.question}</p>

        {question.type === 'free_text' ? (
          <textarea
            className="h-28 w-full rounded-2xl border border-border/40 bg-background/60 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
            placeholder="请输入您的需求..."
            value={freeTextAnswer}
            onChange={(e) => setFreeTextAnswer(e.target.value)}
            disabled={isSubmitting}
          />
        ) : (
          <div className="grid gap-2">
            {question.options?.map((option) => (
              <button
                key={option.id}
                type="button"
                className={cn(
                  'flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition',
                  selectedOptionId === option.id
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-border/40 hover:border-border/70',
                )}
                onClick={() => setSelectedOptionId(option.id)}
                disabled={isSubmitting}>
                <span className="text-sm font-medium text-foreground">{option.text}</span>
                <CheckmarkCircleRegular
                  className={cn(
                    'h-5 w-5 text-primary transition-opacity',
                    selectedOptionId === option.id ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        {allowSkip && onSkip && (
          <Button
            type="button"
            variant="ghost"
            disabled={isSubmitting}
            onClick={onSkip}
            className="gap-1 text-muted-foreground">
            <DismissRegular className="h-4 w-4" />
            跳过
          </Button>
        )}
        <Button type="button" onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? '处理中...' : '确认'}
        </Button>
      </div>
    </div>
  )
}

export default ClarificationCard
