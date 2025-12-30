/**
 * AI 响应意图检测工具
 * 基于 AI 的实际响应内容来检测意图类型，比基于用户输入更准确
 */

import type { MainTextMessageBlock, Message, MessageBlock, ToolMessageBlock } from '../types/messageBlock'
import { MessageBlockStatus,MessageBlockType } from '../types/messageBlock'
import { UserIntent } from './intentDetection'
import Logger from './logger'

const logger = new Logger('ResponseIntentDetection')

/**
 * 工具建议接口
 */
interface ToolSuggestion {
  toolName: string
  [key: string]: unknown
}

/**
 * 分析结果接口
 */
interface AnalysisResult {
  suggestions?: ToolSuggestion[]
  [key: string]: unknown
}

/**
 * 主文本块元数据接口
 */
interface MainTextMetadata {
  response_type?: string
  tool_executed?: boolean
  analysis_result?: AnalysisResult
  [key: string]: unknown
}

/**
 * 文本内容分析结果接口
 */
interface TextContentAnalysis {
  isQuestion: boolean
  isSuggestion: boolean
  hasDirectAnswer: boolean
  hasActionableContent: boolean
  length: number
  wordCount: number
  sentences: string[]
  hasNumbers: boolean
  hasFormatting: boolean
  hasQuotes: boolean
}

/**
 * 检测 AI 响应的意图类型
 * @param message AI 消息
 * @returns 意图类型
 */
export function detectResponseIntent(message: Message): UserIntent {
  // 1. 检查是否有成功的工具调用 - 命令意图的最强指标
  const hasSuccessfulToolCall = message.blocks.some(
    block => block.type === MessageBlockType.TOOL && 
      (block as ToolMessageBlock).status === MessageBlockStatus.SUCCESS
  )

  if (hasSuccessfulToolCall) {
    logger.debug('Detected command intent from successful tool calls', {
      messageId: message.id,
      toolCount: message.blocks.filter(b => b.type === MessageBlockType.TOOL).length
    })
    return UserIntent.COMMAND
  }

  // 2. 检查主文本块的元数据
  const mainTextBlock = message.blocks.find(
    block => block.type === MessageBlockType.MAIN_TEXT
  ) as MainTextMessageBlock | undefined

  const mainTextMetadata = mainTextBlock?.metadata as MainTextMetadata | undefined

  if (mainTextMetadata) {
    const { response_type, tool_executed, analysis_result } = mainTextMetadata

    // 元数据明确标识了意图类型
    if (response_type === 'command' || tool_executed) {
      logger.debug('Detected command intent from metadata', {
        messageId: message.id,
        metadata: mainTextMetadata
      })
      return UserIntent.COMMAND
    }

    // 🎯 修复：检查是否有工具建议但未执行 - 这表明应该是命令意图
    if (analysis_result?.suggestions && analysis_result.suggestions.length > 0) {
      const hasToolSuggestions = analysis_result.suggestions.some((s: ToolSuggestion) =>
        s.toolName === 'align_images' || s.toolName === 'adjust_images_size'
      )
      if (hasToolSuggestions) {
        logger.debug('Detected command intent from tool suggestions', {
          messageId: message.id,
          suggestions: analysis_result.suggestions.map((s: ToolSuggestion) => s.toolName)
        })
        return UserIntent.COMMAND
      }
    }
  }

  // 3. 分析文本内容特征
  const mainTextContent = mainTextBlock?.content || ''
  const textAnalysis = analyzeTextContent(mainTextContent)

  // 🎯 修复：检查内容中是否包含工具建议提示
  if (mainTextContent.includes('💡 建议:') &&
      (mainTextContent.includes('align_images') || mainTextContent.includes('图片对齐'))) {
    logger.debug('Detected command intent from tool suggestion text', {
      messageId: message.id
    })
    return UserIntent.COMMAND
  }

  // 4. 综合判断
  return determineIntentFromContent(textAnalysis, message, mainTextContent)
}

/**
 * 分析文本内容的特征
 */
function analyzeTextContent(content: string): TextContentAnalysis {
  const analysis: TextContentAnalysis = {
    isQuestion: false,
    isSuggestion: false,
    hasDirectAnswer: false,
    hasActionableContent: false,
    length: content.length,
    wordCount: content.split(/\s+/).length,
    sentences: content.split(/[.!?。！？]/).filter(s => s.trim().length > 0),
    hasNumbers: /\d/.test(content),
    hasFormatting: /[*_`~]/.test(content),
    hasQuotes: content.includes('"') || content.includes('"') || content.includes('"')
  }

  // 检查是否是问题
  analysis.isQuestion = content.includes('?') || content.includes('？') ||
                         content.toLowerCase().includes('what') ||
                         content.toLowerCase().includes('how') ||
                         content.toLowerCase().includes('why') ||
                         content.includes('什么') || content.includes('怎么') || content.includes('为什么')

  // 检查是否是建议
  const suggestionPhrases = [
    '建议', '推荐', '可以考虑', '或许', '可能',
    'suggest', 'recommend', 'might', 'could', 'perhaps',
    '我建议', '我觉得', '在我看来', '从...角度看'
  ]
  analysis.isSuggestion = suggestionPhrases.some(phrase => content.includes(phrase))

  // 检查是否有直接答案
  const answerPhrases = [
    '答案是', '结果是', '总的来说', '简而言之', '核心是',
    'the answer is', 'in summary', 'in conclusion', 'the key is'
  ]
  analysis.hasDirectAnswer = answerPhrases.some(phrase => content.includes(phrase))

  // 检查是否包含可操作的内容
  const actionablePhrases = [
    '请', '点击', '选择', '输入', '执行', '操作',
    'please', 'click', 'select', 'enter', 'execute'
  ]
  analysis.hasActionableContent = actionablePhrases.some(phrase => content.includes(phrase))

  return analysis
}

/**
 * 根据内容分析确定意图
 */
function determineIntentFromContent(analysis: TextContentAnalysis, message: Message, content: string): UserIntent {
  // 如果内容很短且是问题，倾向于查询
  if (analysis.length < 200 && analysis.isQuestion) {
    logger.debug('Detected query intent from short question', {
      messageId: message.id,
      length: analysis.length
    })
    return UserIntent.QUERY
  }

  // 如果内容包含建议性的措辞，倾向于编辑
  if (analysis.isSuggestion && analysis.wordCount > 20) {
    logger.debug('Detected edit intent from suggestion content', {
      messageId: message.id,
      hasSuggestions: analysis.isSuggestion
    })
    return UserIntent.EDIT
  }

  // 如果内容包含直接答案，倾向于查询
  if (analysis.hasDirectAnswer) {
    logger.debug('Detected query intent from direct answer', {
      messageId: message.id
    })
    return UserIntent.QUERY
  }

  // 如果内容很长且包含详细说明，根据特征判断
  if (analysis.length > 500) {
    if (analysis.hasFormatting || analysis.hasQuotes) {
      // 有格式化或引用，可能是改写建议
      logger.debug('Detected edit intent from long formatted content', {
        messageId: message.id,
        hasFormatting: analysis.hasFormatting,
        hasQuotes: analysis.hasQuotes
      })
      return UserIntent.EDIT
    } else {
      // 长文本但无特殊格式，可能是查询结果
      logger.debug('Detected query intent from long plain content', {
        messageId: message.id,
        length: analysis.length
      })
      return UserIntent.QUERY
    }
  }

  // 检查是否是简短的对话性内容（问候、确认等）
  const conversationalPhrases = [
    '你好', '您好', '嗨', 'hi', 'hello', 'hey',
    '请问', '有什么可以帮', '需要帮助', '可以帮您',
    '好的', '没问题', '明白', '了解', '收到',
    '谢谢', '感谢', 'thanks', 'thank you',
    '当然', '可以', '是的', '对',
    '还有其他', '还需要', '随时'
  ]
  
  // 短内容且包含对话性短语，倾向于普通对话
  if (analysis.length < 100 && conversationalPhrases.some(phrase => 
    content.toLowerCase().includes(phrase.toLowerCase())
  )) {
    logger.debug('Detected chat intent from conversational phrases', {
      messageId: message.id,
      length: analysis.length
    })
    return UserIntent.CHAT
  }
  
  // 非常短的内容（少于50字符）且不是问题，倾向于普通对话
  if (analysis.length < 50 && !analysis.isQuestion && !analysis.hasDirectAnswer) {
    logger.debug('Detected chat intent from very short content', {
      messageId: message.id,
      length: analysis.length
    })
    return UserIntent.CHAT
  }

  // 默认倾向于普通对话（更安全，避免误判为查询结果）
  logger.debug('Defaulted to chat intent', {
    messageId: message.id
  })
  return UserIntent.CHAT
}

/**
 * 检测消息是否为命令执行型
 * @param message 消息
 * @returns 是否为命令执行型
 */
export function isCommandMessage(message: Message): boolean {
  return detectResponseIntent(message) === UserIntent.COMMAND
}

/**
 * 检测消息是否为建议提供型
 * @param message 消息
 * @returns 是否为建议提供型
 */
export function isEditMessage(message: Message): boolean {
  return detectResponseIntent(message) === UserIntent.EDIT
}

/**
 * 检测消息是否为查询结果型
 * @param message 消息
 * @returns 是否为查询结果型
 */
export function isQueryMessage(message: Message): boolean {
  return detectResponseIntent(message) === UserIntent.QUERY
}

/**
 * 获取消息的意图分析报告
 * @param message 消息
 * @returns 详细的分析报告
 */
export function getIntentAnalysisReport(message: Message) {
  const intent = detectResponseIntent(message)
  const mainTextBlock = message.blocks.find(
    block => block.type === MessageBlockType.MAIN_TEXT
  ) as MainTextMessageBlock | undefined
  const content = mainTextBlock?.content || ''
  const analysis = analyzeTextContent(content)
  const toolBlocks = message.blocks.filter(
    block => block.type === MessageBlockType.TOOL
  ) as ToolMessageBlock[]
  const mainTextMetadata = mainTextBlock?.metadata as MainTextMetadata | undefined

  return {
    intent,
    confidence: getConfidenceScore(intent, analysis, toolBlocks),
    analysis: {
      content: analysis,
      hasToolCalls: toolBlocks.length > 0,
      successfulToolCalls: toolBlocks.filter(b => b.status === MessageBlockStatus.SUCCESS).length,
      hasCommandMetadata: mainTextMetadata?.response_type === 'command' ||
                         mainTextMetadata?.tool_executed === true
    },
    reasoning: getIntentReasoning(intent, analysis, toolBlocks, mainTextMetadata)
  }
}

/**
 * 获取意图检测的置信度
 */
function getConfidenceScore(
  intent: UserIntent, 
  analysis: TextContentAnalysis, 
  toolBlocks: ToolMessageBlock[]
): number {
  // 如果有成功的工具调用，命令意图的置信度最高
  if (intent === UserIntent.COMMAND && toolBlocks.some(b => b.status === MessageBlockStatus.SUCCESS)) {
    return 0.95
  }

  // 基于内容特征的置信度
  if (analysis.isQuestion && intent === UserIntent.QUERY) {
    return 0.8
  }

  if (analysis.isSuggestion && intent === UserIntent.EDIT) {
    return 0.7
  }

  if (analysis.hasDirectAnswer && intent === UserIntent.QUERY) {
    return 0.75
  }

  // 默认置信度
  return 0.6
}

/**
 * 获取意图判断的理由
 */
function getIntentReasoning(
  intent: UserIntent, 
  analysis: TextContentAnalysis, 
  toolBlocks: ToolMessageBlock[], 
  metadata?: MainTextMetadata
): string {
  switch (intent) {
    case UserIntent.COMMAND:
      if (toolBlocks.some(b => b.status === MessageBlockStatus.SUCCESS)) {
        return '检测到成功的工具调用执行'
      }
      if (metadata?.response_type === 'command') {
        return '消息元数据标识为命令执行类型'
      }
      return '基于内容分析判断为命令执行'

    case UserIntent.QUERY:
      if (analysis.isQuestion) {
        return '内容包含问题或查询特征'
      }
      if (analysis.hasDirectAnswer) {
        return '内容提供直接答案或总结'
      }
      return '基于内容分析判断为查询结果'

    case UserIntent.EDIT:
      if (analysis.isSuggestion) {
        return '内容包含建议性措辞'
      }
      if (analysis.hasFormatting && analysis.length > 500) {
        return '长文本且包含格式化特征，可能是改写建议'
      }
      return '基于内容分析判断为编辑建议'

    default:
      return '无法确定意图类型'
  }
}