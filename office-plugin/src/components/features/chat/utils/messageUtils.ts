/**
 * 消息处理工具函数
 * 从 ChatInterface.tsx 提取的消息相关工具函数
 */

import type { WordParagraph } from '../../../../types/word'

/**
 * 智能截断上下文，优先按段落结构裁剪
 */
export interface TrimContextResult {
  text: string
  truncated: boolean
  originalLength: number
  paragraphCount?: number
  includedParagraphs?: number
  remainingParagraphs?: number
}

export function trimContext(
  text: string,
  maxChars: number,
  paragraphs?: WordParagraph[]
): TrimContextResult {
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

      // 如果加入当前段落会超限且已经有内容,则停止
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

  // 降级方案:按字符截断
  return {
    text: text.slice(0, maxChars),
    truncated: true,
    originalLength: text.length,
    paragraphCount: 0
  }
}

/**
 * 检测用户是否在询问上传的文件内容（而非当前 Word 文档）
 * 关键词模式：询问词 + 上传文件相关词
 */
export function isAskingAboutUploadedFile(input: string, hasUploadedFiles: boolean): boolean {
  if (!hasUploadedFiles) return false
  
  // 询问/理解类关键词
  const queryKeywords = /了解|理解|分析|查看|阅读|看看|介绍|总结|概括|说明|告诉|内容|是什么|有什么|包含|讲解|读取|解读|描述/
  // 上传文件相关词
  const uploadKeywords = /上传|文件|文档|附件/
  
  return queryKeywords.test(input) && uploadKeywords.test(input)
}

/**
 * 检测是否是简单问候或闲聊（不需要文档上下文）
 * 这类输入应该直接回复，不需要读取文档内容
 */
export function isSimpleGreetingOrChat(input: string): boolean {
  const trimmedInput = input.trim().toLowerCase()
  
  const greetingPatterns = [
    // 中文问候
    /^(你好|您好|嗨|哈喽|早上好|下午好|晚上好|早安|晚安)$/,
    /^(hi|hello|hey|good morning|good afternoon|good evening)$/i,
    // 简单闲聊
    /^(在吗|你在吗|在不在|你是谁|你叫什么|你会什么|能做什么)$/,
    /^(谢谢|感谢|多谢|thank|thanks)$/i,
    /^(再见|拜拜|bye|goodbye)$/i,
    // 带问候语的短句（最多5个字符的后缀）
    /^(你好|您好|嗨).{0,5}$/
  ]
  
  return greetingPatterns.some(p => p.test(trimmedInput))
}

/**
 * 从消息块中提取文本内容
 */
export function extractTextFromBlocks(blocks: Array<{ type: string; content?: string }>): string {
  return blocks
    .filter((b) => b.type === 'main_text')
    .map((b) => b.content || '')
    .join('\n')
    .trim()
}
