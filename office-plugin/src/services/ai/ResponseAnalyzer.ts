/**
 * 🎯 方案5: 后处理工具补充 - 智能补充机制
 * 分析AI响应，检测是否需要补充调用其他工具
 */

import Logger from '../../utils/logger'
import type { FormattingFunction } from './types'

const logger = new Logger('ResponseAnalyzer')

export interface ToolSuggestion {
  toolName: string
  reason: string
  confidence: number
  suggestedArgs?: Record<string, any>
}

export interface ResponseAnalysisResult {
  isComplete: boolean
  suggestions: ToolSuggestion[]
  analysisReason: string
}

/**
 * 响应分析器 - 检测AI响应是否完整，建议补充工具
 */
export class ResponseAnalyzer {
  private functions: FormattingFunction[]

  constructor(functions: FormattingFunction[]) {
    this.functions = functions
  }

  /**
   * 分析AI响应和已调用的工具，建议补充工具
   */
  analyzeResponse(
    userRequest: string,
    aiResponse: string,
    calledTools: string[]
  ): ResponseAnalysisResult {
    const suggestions: ToolSuggestion[] = []

    // 🎯 图片格式化场景检测
    if (this.isImageFormattingRequest(userRequest)) {
      const imageSuggestions = this.analyzeImageFormatting(userRequest, calledTools)
      suggestions.push(...imageSuggestions)
    }

    // 🎯 文本格式化场景检测
    if (this.isTextFormattingRequest(userRequest)) {
      const textSuggestions = this.analyzeTextFormatting(userRequest, calledTools)
      suggestions.push(...textSuggestions)
    }

    // 🎯 表格操作场景检测
    if (this.isTableOperationRequest(userRequest)) {
      const tableSuggestions = this.analyzeTableOperation(userRequest, calledTools)
      suggestions.push(...tableSuggestions)
    }

    // 🎯 查找替换场景检测
    if (this.isFindReplaceRequest(userRequest)) {
      const findReplaceSuggestions = this.analyzeFindReplace(userRequest, calledTools)
      suggestions.push(...findReplaceSuggestions)
    }

    const isComplete = suggestions.length === 0
    const analysisReason = isComplete
      ? '响应完整，无需补充工具'
      : `检测到${suggestions.length}个可能的补充工具`

    logger.info('Response analysis completed', {
      userRequest,
      calledTools,
      suggestionsCount: suggestions.length,
      isComplete
    })

    return {
      isComplete,
      suggestions,
      analysisReason
    }
  }

  /**
   * 检测是否为图片格式化请求
   */
  private isImageFormattingRequest(userRequest: string): boolean {
    const imageKeywords = ['图片', '图像', '照片', 'image', 'picture']
    const formatKeywords = ['居中', '对齐', '边框', '格式', '调整', '设置']

    return imageKeywords.some(keyword => userRequest.includes(keyword)) &&
           formatKeywords.some(keyword => userRequest.includes(keyword))
  }

  /**
   * 分析图片格式化场景
   */
  private analyzeImageFormatting(userRequest: string, calledTools: string[]): ToolSuggestion[] {
    const suggestions: ToolSuggestion[] = []

    // 检查是否需要图片对齐
    if (userRequest.includes('居中') || userRequest.includes('对齐')) {
      if (!calledTools.includes('align_images')) {
        suggestions.push({
          toolName: 'align_images',
          reason: '用户请求图片对齐，但未调用align_images工具',
          confidence: 0.9,
          suggestedArgs: {
            target: 'selected',
            alignment: userRequest.includes('居中') ? 'center' : 'left'
          }
        })
      }
    }

    // 检查是否需要段落格式化（边框等）
    if (userRequest.includes('边框') || userRequest.includes('格式')) {
      if (!calledTools.includes('apply_paragraph_formatting')) {
        suggestions.push({
          toolName: 'apply_paragraph_formatting',
          reason: '用户请求图片边框/格式化，建议使用段落格式化工具',
          confidence: 0.8,
          suggestedArgs: {
            target: 'selection'
          }
        })
      }
    }

    return suggestions
  }

  /**
   * 检测是否为文本格式化请求
   */
  private isTextFormattingRequest(userRequest: string): boolean {
    const textKeywords = ['文字', '文本', '标题', '段落']
    const formatKeywords = ['加粗', '颜色', '字体', '大小', '居中', '格式']

    return textKeywords.some(keyword => userRequest.includes(keyword)) &&
           formatKeywords.some(keyword => userRequest.includes(keyword))
  }

  /**
   * 分析文本格式化场景
   */
  private analyzeTextFormatting(userRequest: string, calledTools: string[]): ToolSuggestion[] {
    const suggestions: ToolSuggestion[] = []

    // 检查字体格式化
    const fontKeywords = ['加粗', '颜色', '字体', '大小', '斜体']
    if (fontKeywords.some(keyword => userRequest.includes(keyword))) {
      if (!calledTools.includes('apply_font_formatting')) {
        suggestions.push({
          toolName: 'apply_font_formatting',
          reason: '用户请求字体格式化，但未调用apply_font_formatting工具',
          confidence: 0.9
        })
      }
    }

    // 检查段落格式化
    const paragraphKeywords = ['居中', '对齐', '缩进', '行距']
    if (paragraphKeywords.some(keyword => userRequest.includes(keyword))) {
      if (!calledTools.includes('apply_paragraph_formatting')) {
        suggestions.push({
          toolName: 'apply_paragraph_formatting',
          reason: '用户请求段落格式化，但未调用apply_paragraph_formatting工具',
          confidence: 0.9
        })
      }
    }

    return suggestions
  }

  /**
   * 检测是否为表格操作请求
   */
  private isTableOperationRequest(userRequest: string): boolean {
    return userRequest.includes('表格')
  }

  /**
   * 分析表格操作场景
   */
  private analyzeTableOperation(userRequest: string, calledTools: string[]): ToolSuggestion[] {
    const suggestions: ToolSuggestion[] = []

    // 检查表格插入
    if (userRequest.includes('插入') || userRequest.includes('创建')) {
      if (!calledTools.includes('insert_table')) {
        suggestions.push({
          toolName: 'insert_table',
          reason: '用户请求插入表格，但未调用insert_table工具',
          confidence: 0.9
        })
      }
    }

    // 检查表格格式化
    if (userRequest.includes('格式') || userRequest.includes('样式') || userRequest.includes('边框')) {
      if (!calledTools.includes('apply_table_style')) {
        suggestions.push({
          toolName: 'apply_table_style',
          reason: '用户请求表格格式化，建议调用apply_table_style工具',
          confidence: 0.8
        })
      }
    }

    return suggestions
  }

  /**
   * 检测是否为查找替换请求
   */
  private isFindReplaceRequest(userRequest: string): boolean {
    const findReplaceKeywords = ['替换', '查找', '修改', '改为', '换成']
    return findReplaceKeywords.some(keyword => userRequest.includes(keyword))
  }

  /**
   * 分析查找替换场景
   */
  private analyzeFindReplace(userRequest: string, calledTools: string[]): ToolSuggestion[] {
    const suggestions: ToolSuggestion[] = []

    // 检查查找替换（兼容 word_replace_text 和 find_and_replace_text）
    const hasReplaceToolCall = calledTools.includes('word_replace_text') || 
                               calledTools.includes('find_and_replace_text')
    if (!hasReplaceToolCall) {
      suggestions.push({
        toolName: 'word_replace_text',
        reason: '用户请求查找替换，但未调用替换工具',
        confidence: 0.9
      })
    }

    // 检查是否需要后续格式化
    const formatKeywords = ['格式', '颜色', '字体', '加粗']
    if (formatKeywords.some(keyword => userRequest.includes(keyword))) {
      if (!calledTools.includes('apply_font_formatting')) {
        suggestions.push({
          toolName: 'apply_font_formatting',
          reason: '查找替换后可能需要格式化，建议调用字体格式化工具',
          confidence: 0.7
        })
      }
    }

    return suggestions
  }

  /**
   * 更新可用函数列表
   */
  updateFunctions(functions: FormattingFunction[]): void {
    this.functions = functions
    logger.debug('Functions updated', { count: functions.length })
  }
}