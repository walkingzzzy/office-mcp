/**
 * useChatContext - 上下文管理 Hook
 * 从 ChatInterface 中提取的上下文构建和裁剪逻辑
 */

import { useCallback } from 'react'

import type { WordParagraph } from '../../../../types/word'

export interface TrimContextResult {
  text: string
  truncated: boolean
  originalLength: number
  paragraphCount: number
  includedParagraphs?: number
  remainingParagraphs?: number
}

export interface UseChatContextReturn {
  trimContext: (text: string, maxChars: number, paragraphs?: WordParagraph[]) => TrimContextResult
  buildContextPrompt: (documentContext: string, userMessage: string) => string
}

export function useChatContext(): UseChatContextReturn {
  /**
   * 智能截断上下文，优先按段落结构裁剪
   */
  const trimContext = useCallback((
    text: string,
    maxChars: number,
    paragraphs?: WordParagraph[]
  ): TrimContextResult => {
    if (text.length <= maxChars) {
      return {
        text,
        truncated: false,
        originalLength: text.length,
        paragraphCount: paragraphs?.length || 0
      }
    }

    // 优先按段落结构裁剪
    if (paragraphs && paragraphs.length > 0) {
      const collected: string[] = []
      let total = 0
      let includedParaCount = 0

      for (const para of paragraphs) {
        const paraText = para.text || ''
        if (!paraText.trim()) {
          continue // 跳过空段落
        }

        // 如果加入当前段落会超限且已经有内容，则停止
        if (total + paraText.length > maxChars && collected.length > 0) {
          break
        }

        collected.push(paraText)
        total += paraText.length + 1 // +1 for newline
        includedParaCount++

        if (total >= maxChars) {
          break
        }
      }

      if (collected.length > 0) {
        return {
          text: collected.join('\n'),
          truncated: true,
          originalLength: text.length,
          paragraphCount: paragraphs.length,
          includedParagraphs: includedParaCount,
          remainingParagraphs: paragraphs.length - includedParaCount
        }
      }
    }

    // 降级方案：按字符截断
    return {
      text: text.slice(0, maxChars),
      truncated: true,
      originalLength: text.length,
      paragraphCount: 0
    }
  }, [])

  /**
   * 构建带上下文的提示词
   */
  const buildContextPrompt = useCallback((
    documentContext: string,
    userMessage: string
  ): string => {
    if (!documentContext.trim()) {
      return userMessage
    }

    return `文档上下文：\n${documentContext}\n\n用户问题：\n${userMessage}`
  }, [])

  return {
    trimContext,
    buildContextPrompt
  }
}
