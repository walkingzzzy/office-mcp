/**
 * useDocumentContext Hook
 * 处理 Office 文档内容读取、用户意图检测和提示词构造
 */

import { useCallback } from 'react'

import { wordService } from '../../../../services/WordService'
import type { WordParagraph } from '../../../../types/word'
import { detectUserIntent, UserIntent } from '../../../../utils/intentDetection'
import Logger from '../../../../utils/logger'
import { useChatContext } from './useChatContext'
import type { OfficeApp } from './useOfficeContext'

const logger = new Logger('useDocumentContext')

export interface DocumentContextResult {
  /** 文档上下文文本 */
  documentContext: string
  /** 是否有文档 */
  hasDocument: boolean
  /** 是否为选中模式 */
  isSelectionMode: boolean
  /** 上下文是否被截断 */
  isContextTruncated: boolean
  /** 上下文来源 */
  contextSource: 'selection' | 'document' | null
  /** 上下文限制字符数 */
  contextLimit: number
  /** 截断信息 */
  truncationInfo: {
    originalLength?: number
    paragraphCount?: number
    includedParagraphs?: number
    remainingParagraphs?: number
  }
}

export interface PromptBuildResult {
  /** 最终用户输入（可能包含文档上下文） */
  finalUserInput: string
  /** 用户意图 */
  userIntent: UserIntent
}

export interface UseDocumentContextOptions {
  /** 最大文档上下文字符数 */
  maxDocumentContextChars?: number
  /** 最大选中文本上下文字符数 */
  maxSelectionContextChars?: number
}

export interface UseDocumentContextReturn {
  /** 读取文档上下文 */
  readDocumentContext: (officeApp: OfficeApp) => Promise<DocumentContextResult>
  /** 构建带上下文的提示词 */
  buildPromptWithContext: (
    userInput: string,
    contextResult: DocumentContextResult
  ) => PromptBuildResult
}

export function useDocumentContext(
  options: UseDocumentContextOptions = {}
): UseDocumentContextReturn {
  const {
    maxDocumentContextChars = 7000,
    maxSelectionContextChars = 4000
  } = options

  const { trimContext } = useChatContext()

  /**
   * 读取文档上下文
   */
  const readDocumentContext = useCallback(async (
    officeApp: OfficeApp
  ): Promise<DocumentContextResult> => {
    let documentContext = ''
    let hasDocument = false
    let isSelectionMode = false
    let isContextTruncated = false
    let contextLimit = 0
    let contextSource: 'selection' | 'document' | null = null
    let truncationInfo: {
      originalLength?: number
      paragraphCount?: number
      includedParagraphs?: number
      remainingParagraphs?: number
    } = {}

    if (officeApp === 'word') {
      try {
        logger.info('Detected Word environment, checking for selection')

        // 检查是否有选中文本
        const hasSelection = await wordService.hasSelection()

        if (hasSelection) {
          // 优先使用选中文本
          const selection = await wordService.readSelection()
          documentContext = selection.text

          if (selection.tableSummary) {
            documentContext = documentContext.trim().length
              ? `${selection.tableSummary}\n\n${documentContext}`
              : selection.tableSummary
          }

          hasDocument = documentContext.trim().length > 0
          isSelectionMode = true

          logger.info('Selection content loaded', {
            length: documentContext.length,
            isSelection: true,
            tableCount: selection.tables?.length ?? 0
          })

          const trimmed = trimContext(documentContext, maxSelectionContextChars)
          if (trimmed.truncated) {
            documentContext = trimmed.text
            isContextTruncated = true
            contextLimit = maxSelectionContextChars
            contextSource = 'selection'
            truncationInfo = {
              originalLength: trimmed.originalLength
            }

            logger.info('Selection context truncated', {
              limit: maxSelectionContextChars,
              originalLength: trimmed.originalLength,
              remainingChars: trimmed.originalLength - trimmed.text.length
            })
          }
        } else {
          // 没有选中，读取整个文档
          const docContent = await wordService.readDocument()
          documentContext = docContent.text
          hasDocument = documentContext.trim().length > 0

          logger.info('Document content loaded', {
            length: documentContext.length,
            paragraphCount: docContent.paragraphs.length,
            isSelection: false
          })

          const trimmed = trimContext(
            documentContext,
            maxDocumentContextChars,
            docContent.paragraphs as WordParagraph[]
          )

          if (trimmed.truncated) {
            documentContext = trimmed.text
            isContextTruncated = true
            contextLimit = maxDocumentContextChars
            contextSource = 'document'
            truncationInfo = {
              originalLength: trimmed.originalLength,
              paragraphCount: trimmed.paragraphCount,
              includedParagraphs: trimmed.includedParagraphs,
              remainingParagraphs: trimmed.remainingParagraphs
            }

            logger.info('Document context truncated', {
              limit: maxDocumentContextChars,
              originalLength: trimmed.originalLength,
              paragraphCount: trimmed.paragraphCount,
              includedParagraphs: trimmed.includedParagraphs,
              remainingParagraphs: trimmed.remainingParagraphs
            })
          }
        }
      } catch (error) {
        logger.error('Failed to read document content', { error })
        // 继续执行但不包含文档内容
        hasDocument = false
      }
    }

    return {
      documentContext,
      hasDocument,
      isSelectionMode,
      isContextTruncated,
      contextSource,
      contextLimit,
      truncationInfo
    }
  }, [maxDocumentContextChars, maxSelectionContextChars, trimContext])

  /**
   * 构建带上下文的提示词
   */
  const buildPromptWithContext = useCallback((
    userInput: string,
    contextResult: DocumentContextResult
  ): PromptBuildResult => {
    const {
      documentContext,
      hasDocument,
      isSelectionMode,
      isContextTruncated,
      contextSource,
      contextLimit,
      truncationInfo
    } = contextResult

    let finalUserInput = userInput
    let userIntent = UserIntent.CHAT

    if (!hasDocument || !documentContext) {
      return {
        finalUserInput,
        userIntent
      }
    }

    // 检测用户意图
    userIntent = detectUserIntent(userInput, hasDocument)

    logger.info('User intent detected', {
      intent: userIntent,
      inputLength: userInput.length,
      hasDocument,
      isSelectionMode
    })

    // 根据意图构造不同的提示词
    if (userIntent === UserIntent.EDIT) {
      // 编辑意图：使用工具修改文档
      if (isSelectionMode) {
        finalUserInput = `【选中的文本内容】
---选中开始---
${documentContext}
---选中结束---

【用户请求】
${userInput}

【执行要求】
1. 分析用户的修改需求，理解需要做哪些具体改动
2. 如果对话历史中有之前的文档审查/分析结果，请基于这些结果来执行修改
3. 使用合适的工具（如 word_replace_text、word_insert_text 等）逐步修改文档
4. 每次修改后简要说明做了什么改动
5. 如果需要多个步骤，请依次执行

请使用工具来修改文档：`
      } else {
        finalUserInput = `【当前文档内容】
---文档开始---
${documentContext}
---文档结束---

【用户请求】
${userInput}

【执行要求】
1. 分析用户的修改需求，理解需要做哪些具体改动
2. 如果对话历史中有之前的文档审查/分析结果，请基于这些结果来执行修改
3. 使用合适的工具（如 word_replace_text、word_insert_text、word_format_paragraph 等）逐步修改文档
4. 每次修改后简要说明做了什么改动
5. 如果需要多个步骤，请依次执行

请使用工具来修改文档：`
      }
    } else if (userIntent === UserIntent.QUERY) {
      // 查询意图：提供文档上下文，但让 AI 自由回答
      if (isSelectionMode) {
        finalUserInput = `【选中的文本内容】
---选中开始---
${documentContext}
---选中结束---

【用户问题】
${userInput}

请基于上述选中的文本内容，回答用户的问题。`
      } else {
        finalUserInput = `【当前文档内容】
---文档开始---
${documentContext}
---文档结束---

【用户问题】
${userInput}

请基于上述文档内容，回答用户的问题。`
      }
    }

    // 添加截断提示
    if (isContextTruncated && contextSource && truncationInfo) {
      if (contextSource === 'selection') {
        finalUserInput += `\n\n【重要提示】
- 选中的文本已被截断，仅提供前 ${contextLimit} 个字符
- 原始长度: ${truncationInfo.originalLength} 字符
- 如需处理完整内容，请建议用户分段选择或缩小选区`
      } else if (truncationInfo.remainingParagraphs !== undefined && truncationInfo.includedParagraphs !== undefined) {
        finalUserInput += `\n\n【重要提示】
- 文档内容已按段落智能截断
- 已包含段落: ${truncationInfo.includedParagraphs}/${truncationInfo.paragraphCount}
- 剩余段落: ${truncationInfo.remainingParagraphs}
- 建议用户按段落分批处理，或使用选区模式处理特定部分`
      } else {
        finalUserInput += `\n\n【重要提示】
- 文档内容已截断，仅提供前 ${contextLimit} 个字符
- 原始长度: ${truncationInfo.originalLength} 字符
- 建议用户分段处理或缩小处理范围`
      }
    }

    logger.info('Constructed prompt with document context', {
      originalLength: userInput.length,
      finalLength: finalUserInput.length,
      isSelection: isSelectionMode
    })

    return {
      finalUserInput,
      userIntent
    }
  }, [])

  return {
    readDocumentContext,
    buildPromptWithContext
  }
}
