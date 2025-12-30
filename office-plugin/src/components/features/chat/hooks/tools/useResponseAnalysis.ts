/**
 * useResponseAnalysis Hook
 * 负责响应分析和智能重试逻辑
 */

import { useCallback } from 'react'

import type { ToolCall } from '../../../../../services/ai/types'
import { EnhancedIntentType } from '../../../../../services/ai/prompts/types'
import Logger from '../../../../../utils/logger'
import type { FunctionCallState } from '../state/useFunctionCallState'

const logger = new Logger('useResponseAnalysis')

// 兼容多种替换工具名称：MCP 版本 (word_replace_text) 和旧版本 (find_and_replace_text)
const REPLACE_TOOL_NAMES = new Set(['word_replace_text', 'find_and_replace_text'])
const IMAGE_KEYWORD_REGEX = /(图片|图像|照片|image|picture|photo|插图|截图)/i
const IMAGE_TOOL_NAMES = new Set(['add_images', 'adjust_images_size', 'align_images'])

export interface ResponseAnalysisResult {
  shouldRetry: boolean
  retryPrompt?: string
  failureMessage?: string
  hasImageIntent: boolean
  hasImageTools: boolean
}

export function useResponseAnalysis(getState: () => FunctionCallState) {
  const analyzeResponseForRetry = useCallback((
    userMessage: string,
    toolCalls: ToolCall[],
    forceRetryAttempt: number = 0
  ): ResponseAnalysisResult => {
    // 检查图片相关意图和工具
    const hasImageIntent = IMAGE_KEYWORD_REGEX.test(userMessage)
    const hasImageTools = toolCalls.some(call => IMAGE_TOOL_NAMES.has(call.function.name))

    // 🔧 改进：更精确的查找替换请求识别
    // 必须同时包含"查找/替换"关键词和明确的替换意图
    const hasReplaceKeyword = userMessage.includes('替换') || userMessage.includes('换成') || userMessage.includes('改为')
    const hasFindKeyword = userMessage.includes('查找') || userMessage.includes('搜索')
    const hasModifyKeyword = userMessage.includes('修改')

    // 🔧 修复：排除样式和格式化操作
    const isStyleOperation = userMessage.includes('样式') ||
                             userMessage.includes('标题') ||
                             userMessage.includes('style') ||
                             userMessage.includes('heading')
    const isFormatOperation = userMessage.includes('格式') ||
                              userMessage.includes('字体') ||
                              userMessage.includes('颜色') ||
                              userMessage.includes('format') ||
                              userMessage.includes('font')
    const isApplyOperation = userMessage.includes('应用') || userMessage.includes('apply')

    // 排除单纯的插入、添加、删除等操作
    const isInsertOnly = userMessage.includes('插入') && !hasReplaceKeyword
    const isAddOnly = userMessage.includes('添加') && !hasReplaceKeyword
    const isDeleteOnly = userMessage.includes('删除') && !hasReplaceKeyword

    // 🔧 修复：只有明确的查找替换意图才算作查找替换请求
    // 排除样式、格式化、应用等操作
    const isFindReplaceRequest = (hasReplaceKeyword || (hasFindKeyword && hasModifyKeyword)) &&
                                  !isInsertOnly && !isAddOnly && !isDeleteOnly &&
                                  !isStyleOperation && !isFormatOperation && !isApplyOperation

    // 检查是否调用了替换相关工具（兼容 word_replace_text 和 find_and_replace_text）
    const hasFindReplaceToolCall = toolCalls.some(call => REPLACE_TOOL_NAMES.has(call.function.name))

    logger.info('[RESPONSE ANALYSIS] Analysis completed', {
      userMessage,
      toolCallNames: toolCalls.map(call => call.function.name),
      forceRetryAttempt,
      isFindReplaceRequest,
      hasFindReplaceToolCall,
      hasReplaceKeyword,
      hasFindKeyword,
      hasModifyKeyword,
      isStyleOperation,
      isFormatOperation,
      isApplyOperation,
      isInsertOnly,
      hasImageIntent,
      hasImageTools
    })

    // 🔧 修复：如果已经成功调用了替换工具，不再强制重试
    // 同时接受 word_replace_text 和 find_and_replace_text 作为有效的替换工具
    if (isFindReplaceRequest && hasFindReplaceToolCall) {
      logger.info('[RESPONSE ANALYSIS] Replace tool called successfully, no retry needed', {
        toolCallNames: toolCalls.map(call => call.function.name)
      })
      return {
        shouldRetry: false,
        hasImageIntent,
        hasImageTools
      }
    }

    return {
      shouldRetry: false,
      hasImageIntent,
      hasImageTools
    }
  }, [getState])

  const shouldTriggerFollowUp = useCallback((
    toolCalls: ToolCall[],
    userMessage: string
  ): boolean => {
    // 检查是否有Office相关的工具调用
    const hasOfficeTools = toolCalls.some(call =>
      call.function.name.includes('word') ||
      call.function.name.includes('excel') ||
      call.function.name.includes('powerpoint') ||
      call.function.name.includes('format') ||
      call.function.name.includes('style')
    )

    if (!hasOfficeTools) {
      return false
    }

    // 简单的后续处理逻辑：如果有Office工具调用但没有明确的完成信号，可能需要后续处理
    // 这里可以根据具体需求扩展
    const shouldFollowUp = false // 默认不触发后续处理

    logger.info('[FOLLOW-UP ANALYSIS] Follow-up decision', {
      userMessage,
      toolCallNames: toolCalls.map(call => call.function.name),
      hasOfficeTools,
      shouldFollowUp
    })

    return shouldFollowUp
  }, [getState])

  const extractUserIntent = useCallback((userMessage: string): 'edit' | 'query' | 'command' => {
    const state = getState()
    
    if (!state.intentExtractor) {
      // 简单的意图识别兜底逻辑
      if (userMessage.includes('?') || userMessage.includes('？') ||
          userMessage.includes('什么') || userMessage.includes('how') ||
          userMessage.includes('why')) {
        return 'query'
      }
      if (userMessage.includes('修改') || userMessage.includes('替换') ||
          userMessage.includes('格式') || userMessage.includes('edit') ||
          userMessage.includes('format')) {
        return 'edit'
      }
      return 'command'
    }

    // 🎯 使用增强意图检测（参考 OpenAI/Claude 最佳实践）
    // 这样可以更准确地区分普通对话和工具调用需求
    const enhancedIntent = state.intentExtractor.extractEnhancedIntent(userMessage)
    const { enhancedType, isDialogControl, needsClarification } = enhancedIntent

    logger.info('[INTENT EXTRACTION] Enhanced intent extracted', {
      userMessage: userMessage.substring(0, 50),
      enhancedType,
      isDialogControl,
      needsClarification,
      confidence: enhancedIntent.confidence
    })

    // 🎯 根据增强意图类型智能映射（像 Cursor/Claude/ChatGPT 一样）
    switch (enhancedType) {
      // ==================== 查询/对话类 → 'query' ====================
      // 这些意图不需要调用工具，让模型自由回复
      case EnhancedIntentType.QUERY:
      case EnhancedIntentType.CONFIRMATION:
      case EnhancedIntentType.NEGATION:
      case EnhancedIntentType.CANCEL_REQUEST:
      case EnhancedIntentType.PAUSE_REQUEST:
        return 'query'

      // ==================== 模糊/修改类 → 'edit' ====================
      // 这些意图可能需要工具，但不强制
      case EnhancedIntentType.VAGUE_REQUEST:
      case EnhancedIntentType.MODIFICATION:
      case EnhancedIntentType.CONTINUE_REQUEST:
      case EnhancedIntentType.UNDO_REQUEST:
        return 'edit'

      // ==================== 明确命令类 → 'command' ====================
      // 这些意图明确需要调用工具来操作文档
      case EnhancedIntentType.DIRECT_COMMAND:
      case EnhancedIntentType.COMPLEX_TASK:
        return 'command'

      default:
        // 兜底：如果有对话控制标记，返回 query
        if (isDialogControl) {
          return 'query'
        }
        return 'command'
    }
  }, [getState])

  return {
    analyzeResponseForRetry,
    shouldTriggerFollowUp,
    extractUserIntent
  }
}
