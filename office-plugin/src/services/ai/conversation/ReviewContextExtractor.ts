/**
 * ReviewContextExtractor - 审查上下文提取器
 * 
 * 功能：
 * 1. 识别用户输入中的指代性表达（"这些"、"刚才的"等）
 * 2. 从对话历史中提取相关的审查结果、建议内容
 * 3. 将提取的上下文格式化为可注入 prompt 的结构
 */

import Logger from '../../../utils/logger'
import { MessageBlockType, type Message, type MessageBlock } from '../../../types/messageBlock'

const logger = new Logger('ReviewContextExtractor')

/**
 * 审查问题项
 */
export interface ReviewIssue {
  /** 问题序号 */
  index: number
  /** 问题描述 */
  issue: string
  /** 问题位置 */
  location?: string
  /** 修改建议 */
  suggestion?: string
  /** 问题类型 */
  type?: 'format' | 'content' | 'style' | 'structure' | 'other'
  /** 对应的工具 */
  expectedTools?: string[]
}

/**
 * 审查结果
 */
export interface ReviewResult {
  /** 审查消息 ID */
  messageId: string
  /** 审查时间 */
  timestamp: Date
  /** 审查类型 */
  type: 'document_review' | 'format_check' | 'content_analysis' | 'general'
  /** 问题列表 */
  issues: ReviewIssue[]
  /** 原始审查文本 */
  rawText: string
  /** 总结 */
  summary?: string
}

/**
 * 上下文提取结果
 */
export interface ContextExtractionResult {
  /** 是否检测到上下文引用 */
  hasContextReference: boolean
  /** 引用类型 */
  referenceType: 'review' | 'suggestion' | 'task' | 'previous' | 'none'
  /** 检测到的指代词 */
  detectedReferences: string[]
  /** 提取的审查结果 */
  reviewResult?: ReviewResult
  /** 格式化的上下文（用于注入 prompt） */
  formattedContext?: string
  /** 置信度 (0-1) */
  confidence: number
}

/**
 * 指代性表达模式
 */
const REFERENCE_PATTERNS = {
  // 指代词 - 指向之前的内容
  demonstrative: [
    '这些', '那些', '这个', '那个', '上述', '以上', '上面的', '刚才的',
    '之前的', '前面的', '上一个', '上一条', '这几个', '这几处',
    'these', 'those', 'this', 'that', 'above', 'previous', 'earlier'
  ],
  
  // 应用类动词 - 表示执行操作
  applyVerbs: [
    '应用', '执行', '实施', '采纳', '修改', '调整', '修复', '处理',
    '按照', '根据', '基于', '依据', '遵循',
    'apply', 'execute', 'implement', 'fix', 'modify', 'adjust'
  ],
  
  // 审查关联词 - 明确引用审查结果
  reviewRelated: [
    '审查结果', '审查发现', '检查结果', '分析结果', '诊断结果',
    '发现的问题', '存在的问题', '提出的建议', '给出的建议',
    '根据审查', '按照建议', '根据分析', '根据检查',
    'review results', 'issues found', 'based on review', 'as suggested'
  ],
  
  // 任务关联词
  taskRelated: [
    '任务列表', '任务计划', '修改计划', '步骤', '下一步',
    'task list', 'task plan', 'steps', 'next step'
  ]
}

/**
 * 审查结果提取模式
 */
const REVIEW_EXTRACTION_PATTERNS = {
  // 编号列表模式 (1. xxx  2. xxx)
  numberedList: /(?:^|\n)\s*(\d+)[.、)\]]\s*([^\n]+)/g,
  
  // 问题标记模式 (问题: xxx / 建议: xxx)
  labeledItem: /(?:问题|建议|发现|修改|调整|注意)[：:]\s*([^\n]+)/gi,
  
  // 冒号列表模式 (xxx: yyy)
  colonList: /^([^：:]+)[：:]([^\n]+)$/gm,
  
  // 类别标题模式 (xxx问题 / xxx建议)
  categoryTitle: /([\u4e00-\u9fa5]+)(问题|建议|格式|内容|结构)[：:]/g,
  
  // 修复/调整建议模式
  fixSuggestion: /(?:建议|应该|需要|可以)(?:将|把)?([^，。\n]+)(?:改为|替换为|调整为|设置为)([^，。\n]+)/g
}

/**
 * 工具映射表 - 根据问题类型推断工具
 */
const TOOL_MAPPING: Record<string, string[]> = {
  // 格式类
  '标题': ['word_apply_style', 'word_set_heading'],
  '字体': ['word_set_font', 'word_format_text'],
  '字号': ['word_set_font'],
  '颜色': ['word_set_font_color'],
  '对齐': ['word_set_paragraph_alignment'],
  '居中': ['word_set_paragraph_alignment'],
  '间距': ['word_set_paragraph_spacing'],
  '行距': ['word_set_line_spacing'],
  '缩进': ['word_set_paragraph_indent'],
  '边距': ['word_set_page_margins'],
  '页边距': ['word_set_page_margins'],
  
  // 结构类
  '目录': ['word_insert_toc', 'word_update_toc'],
  '页码': ['word_add_page_numbers'],
  '页眉': ['word_set_header'],
  '页脚': ['word_set_footer'],
  '分页': ['word_insert_page_break'],
  '章节': ['word_apply_style'],
  
  // 内容类
  '段落': ['word_format_paragraph', 'word_replace_text'],
  '文字': ['word_replace_text', 'word_insert_text'],
  '表格': ['word_format_table', 'word_insert_table'],
  '图片': ['word_set_image_position', 'word_wrap_text_around_image'],
  
  // 通用
  '格式': ['word_apply_style', 'word_format_text'],
  '样式': ['word_apply_style'],
  '排版': ['word_format_paragraph', 'word_set_paragraph_spacing']
}

/**
 * ReviewContextExtractor 类
 */
export class ReviewContextExtractor {
  /**
   * 检测用户输入是否包含上下文引用
   */
  detectContextReference(userInput: string): {
    hasReference: boolean
    referenceType: 'review' | 'suggestion' | 'task' | 'previous' | 'none'
    detectedReferences: string[]
    confidence: number
  } {
    const lowerInput = userInput.toLowerCase()
    const detected: string[] = []
    let confidence = 0
    let referenceType: 'review' | 'suggestion' | 'task' | 'previous' | 'none' = 'none'
    
    // 检查审查关联词（最高优先级）
    for (const pattern of REFERENCE_PATTERNS.reviewRelated) {
      if (lowerInput.includes(pattern.toLowerCase())) {
        detected.push(pattern)
        confidence += 0.4
        referenceType = 'review'
      }
    }
    
    // 检查任务关联词
    for (const pattern of REFERENCE_PATTERNS.taskRelated) {
      if (lowerInput.includes(pattern.toLowerCase())) {
        detected.push(pattern)
        confidence += 0.3
        if (referenceType === 'none') referenceType = 'task'
      }
    }
    
    // 检查指代词
    for (const pattern of REFERENCE_PATTERNS.demonstrative) {
      if (lowerInput.includes(pattern.toLowerCase())) {
        detected.push(pattern)
        confidence += 0.2
        if (referenceType === 'none') referenceType = 'previous'
      }
    }
    
    // 检查应用类动词（配合指代词时增加置信度）
    for (const pattern of REFERENCE_PATTERNS.applyVerbs) {
      if (lowerInput.includes(pattern.toLowerCase())) {
        detected.push(pattern)
        if (detected.length > 1) {
          confidence += 0.15
        }
        if (referenceType === 'none') referenceType = 'suggestion'
      }
    }
    
    // 归一化置信度
    confidence = Math.min(confidence, 1)
    
    const hasReference = confidence >= 0.3
    
    logger.info('[ReviewContextExtractor] Context reference detected', {
      userInput: userInput.substring(0, 50),
      hasReference,
      referenceType,
      detectedReferences: detected,
      confidence
    })
    
    return {
      hasReference,
      referenceType,
      detectedReferences: detected,
      confidence
    }
  }
  
  /**
   * 从对话历史中提取审查结果
   */
  extractReviewFromHistory(messages: Message[]): ReviewResult | null {
    // 从最近的消息开始查找
    const reversedMessages = [...messages].reverse()
    
    for (const message of reversedMessages) {
      // 只检查 assistant 消息
      if (message.role !== 'assistant') continue
      
      // 获取消息文本内容
      const textContent = this.getMessageTextContent(message)
      if (!textContent) continue
      
      // 检查是否是审查结果
      const reviewResult = this.parseReviewContent(textContent, message.id)
      if (reviewResult && reviewResult.issues.length > 0) {
        logger.info('[ReviewContextExtractor] Found review result in history', {
          messageId: message.id,
          issueCount: reviewResult.issues.length
        })
        return reviewResult
      }
    }
    
    logger.info('[ReviewContextExtractor] No review result found in history')
    return null
  }
  
  /**
   * 获取消息的文本内容
   */
  private getMessageTextContent(message: Message): string {
    if (!message.blocks) return ''
    
    const textBlocks = message.blocks.filter(
      (block: MessageBlock) => block.type === MessageBlockType.MAIN_TEXT
    )
    
    return textBlocks
      .map((block: MessageBlock) => (block as any).content || '')
      .join('\n')
  }
  
  /**
   * 解析审查内容
   */
  private parseReviewContent(content: string, messageId: string): ReviewResult | null {
    const issues: ReviewIssue[] = []
    let reviewType: ReviewResult['type'] = 'general'
    
    // 检测审查类型
    if (/格式|排版|样式/.test(content)) {
      reviewType = 'format_check'
    } else if (/内容|文字|段落/.test(content)) {
      reviewType = 'content_analysis'
    } else if (/审查|检查|分析/.test(content)) {
      reviewType = 'document_review'
    }
    
    // 检查是否像审查结果（包含问题描述的特征）
    const hasReviewIndicators = (
      /问题|建议|发现|需要|应该|可以|注意/.test(content) &&
      (
        /\d+[.、)\]]\s*/.test(content) ||  // 编号列表
        /[：:]\s*\n/.test(content) ||       // 冒号后换行（类别标题）
        content.split('\n').length >= 3     // 多行内容
      )
    )
    
    if (!hasReviewIndicators) {
      return null
    }
    
    // 提取编号列表项
    const numberedMatches = content.matchAll(REVIEW_EXTRACTION_PATTERNS.numberedList)
    for (const match of numberedMatches) {
      const index = parseInt(match[1])
      const text = match[2].trim()
      
      if (text.length > 5) {  // 过滤太短的项
        const issue = this.parseIssueText(text, index)
        issues.push(issue)
      }
    }
    
    // 如果没有找到编号列表，尝试解析标签项
    if (issues.length === 0) {
      const labeledMatches = content.matchAll(REVIEW_EXTRACTION_PATTERNS.labeledItem)
      let index = 1
      for (const match of labeledMatches) {
        const text = match[1].trim()
        if (text.length > 5) {
          const issue = this.parseIssueText(text, index++)
          issues.push(issue)
        }
      }
    }
    
    // 如果还是没有，尝试按行解析
    if (issues.length === 0) {
      const lines = content.split('\n').filter(line => line.trim().length > 10)
      let index = 1
      for (const line of lines) {
        // 跳过标题行和太通用的行
        if (/^(审查结果|文档审查|格式问题|内容问题)[：:]*$/i.test(line.trim())) continue
        if (/^(总的来说|综上所述|建议|需要|总之)/.test(line.trim())) continue
        
        // 检查是否是问题描述
        if (/问题|需要|应该|可以|建议|调整|修改|不一致|过大|过小|缺少|缺失/.test(line)) {
          const issue = this.parseIssueText(line.trim(), index++)
          issues.push(issue)
        }
      }
    }
    
    if (issues.length === 0) {
      return null
    }
    
    // 生成摘要
    const summary = `发现 ${issues.length} 处问题需要修改`
    
    return {
      messageId,
      timestamp: new Date(),
      type: reviewType,
      issues,
      rawText: content,
      summary
    }
  }
  
  /**
   * 解析问题文本
   */
  private parseIssueText(text: string, index: number): ReviewIssue {
    const issue: ReviewIssue = {
      index,
      issue: text,
      type: 'other',
      expectedTools: []
    }
    
    // 提取位置信息
    const locationMatch = text.match(/(?:第|在)?([一二三四五六七八九十\d]+)[页节章段处]/)
    if (locationMatch) {
      issue.location = locationMatch[0]
    }
    
    // 提取建议（如果包含）
    const suggestionMatch = text.match(/(?:建议|应该|需要|可以)(.+)/)
    if (suggestionMatch) {
      issue.suggestion = suggestionMatch[1].trim()
    }
    
    // 判断问题类型并推断工具
    const lowerText = text.toLowerCase()
    
    if (/标题|章节|大纲/.test(lowerText)) {
      issue.type = 'structure'
      issue.expectedTools = TOOL_MAPPING['标题']
    } else if (/字体|字号|粗体|斜体/.test(lowerText)) {
      issue.type = 'format'
      issue.expectedTools = TOOL_MAPPING['字体']
    } else if (/间距|行距|段落/.test(lowerText)) {
      issue.type = 'format'
      issue.expectedTools = TOOL_MAPPING['间距']
    } else if (/对齐|居中|靠左|靠右/.test(lowerText)) {
      issue.type = 'format'
      issue.expectedTools = TOOL_MAPPING['对齐']
    } else if (/目录/.test(lowerText)) {
      issue.type = 'structure'
      issue.expectedTools = TOOL_MAPPING['目录']
    } else if (/页码/.test(lowerText)) {
      issue.type = 'structure'
      issue.expectedTools = TOOL_MAPPING['页码']
    } else if (/格式|样式|排版/.test(lowerText)) {
      issue.type = 'format'
      issue.expectedTools = TOOL_MAPPING['格式']
    } else if (/内容|文字|文本/.test(lowerText)) {
      issue.type = 'content'
      issue.expectedTools = TOOL_MAPPING['文字']
    } else if (/表格/.test(lowerText)) {
      issue.type = 'content'
      issue.expectedTools = TOOL_MAPPING['表格']
    } else if (/图片|图表/.test(lowerText)) {
      issue.type = 'content'
      issue.expectedTools = TOOL_MAPPING['图片']
    }
    
    return issue
  }
  
  /**
   * 格式化审查结果为可注入 prompt 的文本
   */
  formatReviewForPrompt(reviewResult: ReviewResult): string {
    const lines: string[] = [
      '【之前的审查结果】',
      `发现了以下 ${reviewResult.issues.length} 处需要修改的问题：`,
      ''
    ]
    
    for (const issue of reviewResult.issues) {
      let line = `${issue.index}. ${issue.issue}`
      if (issue.location) {
        line += ` (位置: ${issue.location})`
      }
      lines.push(line)
    }
    
    lines.push('')
    lines.push('请根据以上审查结果，逐一执行修改操作。')
    
    return lines.join('\n')
  }
  
  /**
   * 完整的上下文提取流程
   */
  extractContext(
    userInput: string,
    messageHistory: Message[]
  ): ContextExtractionResult {
    // 1. 检测上下文引用
    const referenceDetection = this.detectContextReference(userInput)
    
    if (!referenceDetection.hasReference) {
      return {
        hasContextReference: false,
        referenceType: 'none',
        detectedReferences: [],
        confidence: 0
      }
    }
    
    // 2. 从历史中提取审查结果
    const reviewResult = this.extractReviewFromHistory(messageHistory)
    
    if (!reviewResult) {
      return {
        hasContextReference: true,
        referenceType: referenceDetection.referenceType,
        detectedReferences: referenceDetection.detectedReferences,
        confidence: referenceDetection.confidence * 0.5  // 降低置信度，因为没找到具体结果
      }
    }
    
    // 3. 格式化上下文
    const formattedContext = this.formatReviewForPrompt(reviewResult)
    
    logger.info('[ReviewContextExtractor] Context extracted successfully', {
      userInput: userInput.substring(0, 50),
      issueCount: reviewResult.issues.length,
      referenceType: referenceDetection.referenceType
    })
    
    return {
      hasContextReference: true,
      referenceType: 'review',
      detectedReferences: referenceDetection.detectedReferences,
      reviewResult,
      formattedContext,
      confidence: referenceDetection.confidence
    }
  }
}

// 导出单例
export const reviewContextExtractor = new ReviewContextExtractor()
