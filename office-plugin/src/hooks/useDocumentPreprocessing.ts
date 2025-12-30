/**
 * useDocumentPreprocessing Hook - 已注销
 * 自动预处理文档：当插件加载时自动读取文档并让 AI 分析
 * 注意：此功能已被注销，目前用不上
 */

import { useCallback,useEffect, useRef, useState } from 'react'

import { aiService } from '../services/ai'
import { wordService } from '../services/WordService'
import type { WordDocumentContent } from '../types/word'
import Logger from '../utils/logger'

const logger = new Logger('DocumentPreprocessing')

export interface DocumentPreprocessingState {
  /** 文档是否已读取 */
  documentLoaded: boolean
  /** 文档内容 */
  documentContent: WordDocumentContent | null
  /** AI 预处理是否完成 */
  preprocessed: boolean
  /** 预处理中 */
  preprocessing: boolean
  /** AI 分析结果（文档摘要） */
  analysis: string | null
  /** 错误信息 */
  error: string | null
  /** 文档统计 */
  stats: {
    characterCount: number
    paragraphCount: number
    wordCount: number
  } | null
}

export interface UseDocumentPreprocessingOptions {
  /** Office 应用类型 */
  officeApp: 'word' | 'excel' | 'powerpoint' | 'none'
  /** 是否自动预处理（默认 true） */
  autoPreprocess?: boolean
  /** 预处理提示词模板 */
  preprocessPrompt?: string
  /** 是否启用（默认 true） */
  enabled?: boolean
}

/**
 * 默认预处理提示词
 */
const DEFAULT_PREPROCESS_PROMPT = `你是一个专业的文档分析助手。我刚刚打开了一个文档，请帮我分析这个文档的基本情况。

【文档内容】
---文档开始---
{DOCUMENT_CONTENT}
---文档结束---

请用简洁的语言（3-5句话）告诉我：
1. 这个文档的主题是什么
2. 文档的结构和主要部分
3. 有什么特别需要注意的地方

请直接输出分析结果，不要添加额外的客套话。`

/**
 * 文档预处理 Hook
 */
export function useDocumentPreprocessing(options: UseDocumentPreprocessingOptions) {
  const {
    officeApp,
    autoPreprocess = true,
    preprocessPrompt = DEFAULT_PREPROCESS_PROMPT,
    enabled = true
  } = options

  const [state, setState] = useState<DocumentPreprocessingState>({
    documentLoaded: false,
    documentContent: null,
    preprocessed: false,
    preprocessing: false,
    analysis: null,
    error: null,
    stats: null
  })

  const preprocessedRef = useRef(false) // 防止重复预处理

  /**
   * 读取文档内容
   */
  const loadDocument = useCallback(async (): Promise<WordDocumentContent | null> => {
    if (officeApp !== 'word') {
      logger.info('Not in Word environment, skipping document load')
      return null
    }

    try {
      logger.info('Loading document content for preprocessing...')
      const content = await wordService.readDocument()

      // 计算字数（简单的中英文混合计数）
      const wordCount = content.text
        .split(/[\s\n]+/)
        .filter(word => word.length > 0).length

      setState(prev => ({
        ...prev,
        documentLoaded: true,
        documentContent: content,
        stats: {
          characterCount: content.text.length,
          paragraphCount: content.paragraphs.length,
          wordCount
        },
        error: null
      }))

      logger.info('Document loaded successfully', {
        characterCount: content.text.length,
        paragraphCount: content.paragraphs.length,
        wordCount
      })

      return content
    } catch (error) {
      logger.error('Failed to load document', { error })
      setState(prev => ({
        ...prev,
        error: `无法读取文档：${error instanceof Error ? error.message : '未知错误'}`,
        documentLoaded: false
      }))
      return null
    }
  }, [officeApp])

  /**
   * AI 预处理文档
   */
  const preprocessDocument = useCallback(async (
    content?: WordDocumentContent | null
  ): Promise<string | null> => {
    try {
      setState(prev => ({ ...prev, preprocessing: true, error: null }))

      // 如果没有提供内容，先加载
      let documentContent = content || null
      if (!documentContent) {
        documentContent = await loadDocument()
      }

      if (!documentContent || !documentContent.text.trim()) {
        setState(prev => ({
          ...prev,
          preprocessing: false,
          error: '文档内容为空'
        }))
        return null
      }

      logger.info('Starting AI preprocessing...')

      // 构造预处理提示词
      const prompt = preprocessPrompt.replace('{DOCUMENT_CONTENT}', documentContent.text)

      // 调用 AI 进行分析（使用流式接口）
      let analysisResult = ''
      await aiService.createChatCompletionStream(
        {
          model: '', // 使用默认模型
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          onChunk: (chunk) => {
            if (chunk.choices?.[0]?.delta?.content) {
              analysisResult += chunk.choices[0].delta.content
            }
          },
          onComplete: () => {
            logger.info('AI preprocessing completed', {
              analysisLength: analysisResult.length
            })
          }
        }
      )

      setState(prev => ({
        ...prev,
        preprocessing: false,
        preprocessed: true,
        analysis: analysisResult,
        error: null
      }))

      preprocessedRef.current = true
      return analysisResult
    } catch (error) {
      logger.error('AI preprocessing failed', { error })
      setState(prev => ({
        ...prev,
        preprocessing: false,
        error: `AI 分析失败：${error instanceof Error ? error.message : '未知错误'}`
      }))
      return null
    }
  }, [loadDocument, preprocessPrompt])

  /**
   * 手动触发重新预处理
   */
  const reprocess = useCallback(async () => {
    preprocessedRef.current = false
    setState(prev => ({
      ...prev,
      preprocessed: false,
      analysis: null,
      error: null
    }))
    await preprocessDocument()
  }, [preprocessDocument])

  /**
   * 自动预处理：当 Office 应用检测完成且未预处理时
   */
  useEffect(() => {
    if (!enabled || !autoPreprocess || preprocessedRef.current) {
      return
    }

    if (officeApp === 'word') {
      logger.info('Auto-preprocessing enabled, starting document analysis...')

      // 小延迟确保 Office.js 完全初始化
      const timer = setTimeout(() => {
        preprocessDocument().catch(err => {
          logger.error('Auto-preprocessing failed', { error: err })
        })
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [officeApp, enabled, autoPreprocess, preprocessDocument])

  return {
    ...state,
    loadDocument,
    preprocessDocument,
    reprocess
  }
}

export default useDocumentPreprocessing
