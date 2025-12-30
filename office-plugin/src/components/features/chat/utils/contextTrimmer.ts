/**
 * 上下文截断工具
 * 智能截断文档/选区上下文，优先按段落结构裁剪
 */

import type { WordParagraph } from '../../../../types/word'

export interface TrimContextResult {
  /** 截断后的文本 */
  text: string
  /** 是否被截断 */
  truncated: boolean
  /** 原始文本长度 */
  originalLength: number
  /** 总段落数 */
  paragraphCount: number
  /** 包含的段落数（仅在按段落截断时） */
  includedParagraphs?: number
  /** 剩余的段落数（仅在按段落截断时） */
  remainingParagraphs?: number
}

/**
 * 智能截断上下文，优先按段落结构裁剪
 * @param text 原始文本
 * @param maxChars 最大字符数
 * @param paragraphs 段落数组(可选)
 * @returns 截断后的文本和元信息
 */
export function trimContext(
  text: string,
  maxChars: number,
  paragraphs?: WordParagraph[]
): TrimContextResult {
  // 如果文本未超限，直接返回
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
}
