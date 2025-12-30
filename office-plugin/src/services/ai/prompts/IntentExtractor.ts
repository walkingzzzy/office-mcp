/**
 * 用户意图提取器 - 从复杂输入中提取真实用户意图
 * 
 * 支持多轮对话的增强意图识别：
 * - 直接命令 vs 模糊请求
 * - 对话控制指令（确认、取消、继续等）
 * - 复杂任务识别
 */

import Logger from '../../../utils/logger'
import { 
  IntentType, 
  EnhancedIntentType,
  type UserIntent,
  type EnhancedUserIntent
} from './types'

const logger = new Logger('IntentExtractor')

export class IntentExtractor {
  /**
   * 提取用户意图
   */
  extractUserIntent(rawInput: string): UserIntent {
    const cleanedInput = this.cleanInput(rawInput)
    const detectedIntent = this.detectIntent(cleanedInput)
    const requiredPromptLevel = this.determinePromptLevel(cleanedInput, detectedIntent)
    const confidence = this.calculateConfidence(cleanedInput, detectedIntent)

    logger.debug('User intent extracted', {
      originalLength: rawInput.length,
      cleanedLength: cleanedInput.length,
      detectedIntent,
      confidence
    })

    return {
      cleanedInput,
      detectedIntent,
      requiredPromptLevel,
      confidence
    }
  }

  /**
   * 清理输入，移除系统生成的冗余信息
   */
  private cleanInput(rawInput: string): string {
    // 移除系统提示词标记
    let cleaned = rawInput
      .replace(/你是一个专业的文档格式化助手.*?【操作说明】/s, '')
      .replace(/【选中的.*?信息】.*?【操作说明】/s, '')
      .replace(/【.*?】/g, '')
      .replace(/\n+/g, ' ')
      .trim()

    // 如果清理后为空，尝试提取最后一行用户输入
    if (!cleaned) {
      const lines = rawInput.split('\n').filter(line => line.trim())
      cleaned = lines[lines.length - 1]?.trim() || rawInput
    }

    // 🎯 修复：从复杂上下文中提取真实用户意图
    // 检查是否包含图片格式化关键词，如果有则直接返回格式化命令
    if (rawInput.includes('图片') && (rawInput.includes('居中') || rawInput.includes('对齐'))) {
      if (rawInput.includes('居中')) {
        cleaned = '图片居中'
      } else if (rawInput.includes('左对齐')) {
        cleaned = '图片左对齐'
      } else if (rawInput.includes('右对齐')) {
        cleaned = '图片右对齐'
      } else {
        cleaned = '图片对齐'
      }
    }

    return cleaned
  }

  /**
   * 检测用户意图类型 - 增强版
   */
  private detectIntent(input: string): IntentType {
    const lowerInput = input.toLowerCase()

    // 多任务检测（优先级最高）
    const actionWords = ['居中', '加粗', '颜色', '边框', '对齐', '插入', '删除', '格式', '替换', '查找']
    const actionCount = actionWords.filter(word => lowerInput.includes(word)).length
    const hasConjunctions = this.hasKeywords(lowerInput, ['并且', '同时', '还要', '以及', '和', '，'])

    if (actionCount > 1 || hasConjunctions) {
      return 'multi_task' as IntentType
    }

    // 超链接相关关键词（高优先级）- 需要在图片检测之前，避免误判
    const hasUrlPattern = /https?:\/\//.test(lowerInput) || /www\./i.test(lowerInput)
    if (hasUrlPattern || this.hasKeywords(lowerInput, ['超链接', '添加链接', '插入链接', '链接到', 'hyperlink', 'link to', 'add link'])) {
      return 'hyperlink_operations' as IntentType
    }

    // 图片相关关键词（高优先级）
    if (this.hasKeywords(lowerInput, ['图片', '图像', '照片', 'image', 'picture'])) {
      return 'image_formatting' as IntentType
    }

    // 查找替换关键词（中优先级）
    if (this.hasKeywords(lowerInput, ['替换', '查找', '修改', '改为', '换成', 'replace', 'find'])) {
      return 'search_replace' as IntentType
    }

    // 表格相关关键词
    if (this.hasKeywords(lowerInput, ['表格', 'table', '插入表格', '创建表格'])) {
      return 'table_operations' as IntentType
    }

    // 文本相关关键词（默认）
    return 'text_formatting' as IntentType
  }

  /**
   * 确定所需提示词详细程度
   */
  private determinePromptLevel(input: string, intent: IntentType): 1 | 2 | 3 {
    // L1: 简单单一操作
    if (input.length < 10 || intent === 'text_formatting') {
      return 1
    }

    // L3: 复杂多任务操作
    if (intent === 'multi_task' || input.includes('并且') || input.includes('同时')) {
      return 3
    }

    // L2: 中等复杂度
    return 2
  }

  /**
   * 计算意图识别置信度
   */
  private calculateConfidence(input: string, intent: IntentType): number {
    const intentKeywords = {
      image_formatting: ['图片', '图像', '照片', 'image'],
      text_formatting: ['字体', '文字', '文本', 'font', 'text'],
      table_operations: ['表格', 'table'],
      search_replace: ['替换', '查找', 'replace', 'find'],
      hyperlink_operations: ['超链接', '链接', 'http', 'https', 'www', 'hyperlink', 'link'],
      multi_task: ['并且', '同时', '还要', '以及']
    }

    const keywords = intentKeywords[intent] || []
    const matchCount = keywords.filter(keyword =>
      input.toLowerCase().includes(keyword)
    ).length

    return Math.min(0.5 + (matchCount * 0.2), 1.0)
  }

  /**
   * 检查是否包含关键词
   */
  private hasKeywords(input: string, keywords: string[]): boolean {
    return keywords.some(keyword => input.includes(keyword))
  }

  // ==================== 增强意图识别（多轮对话支持） ====================

  /**
   * 提取增强用户意图（多轮对话支持）
   */
  extractEnhancedIntent(rawInput: string): EnhancedUserIntent {
    // 先获取基础意图
    const baseIntent = this.extractUserIntent(rawInput)
    
    // 检测增强意图类型
    const enhancedType = this.detectEnhancedIntent(baseIntent.cleanedInput)
    const isDialogControl = this.isDialogControlIntent(enhancedType)
    const needsClarification = enhancedType === EnhancedIntentType.VAGUE_REQUEST

    const enhancedIntent: EnhancedUserIntent = {
      ...baseIntent,
      enhancedType,
      needsClarification,
      isDialogControl
    }

    // 如果需要澄清，添加建议的澄清问题
    if (needsClarification) {
      enhancedIntent.suggestedClarifications = this.getSuggestedClarifications(baseIntent.cleanedInput)
    }

    logger.info('[ENHANCED_INTENT] Intent extracted', {
      input: rawInput.substring(0, 50),
      baseIntent: baseIntent.detectedIntent,
      enhancedType,
      needsClarification,
      isDialogControl,
      confidence: baseIntent.confidence
    })

    return enhancedIntent
  }

  /**
   * 检测增强意图类型
   */
  private detectEnhancedIntent(input: string): EnhancedIntentType {
    const lowerInput = input.toLowerCase()

    // ==================== 对话控制类（最高优先级） ====================
    
    // 撤销请求
    if (this.hasKeywords(lowerInput, ['撤销', '撤回', '恢复', '还原', 'undo', 'revert'])) {
      return EnhancedIntentType.UNDO_REQUEST
    }

    // 取消请求
    if (this.hasKeywords(lowerInput, ['取消', '不要了', '算了', '停止', 'cancel', 'stop', 'abort'])) {
      return EnhancedIntentType.CANCEL_REQUEST
    }

    // 继续请求
    if (this.hasKeywords(lowerInput, ['继续', '下一步', '接着', '然后呢', 'continue', 'next', 'proceed'])) {
      return EnhancedIntentType.CONTINUE_REQUEST
    }

    // 暂停请求
    if (this.hasKeywords(lowerInput, ['暂停', '等一下', '稍等', '停一下', 'pause', 'wait', 'hold'])) {
      return EnhancedIntentType.PAUSE_REQUEST
    }

    // 确认
    if (this.isConfirmation(lowerInput)) {
      return EnhancedIntentType.CONFIRMATION
    }

    // 否定
    if (this.isNegation(lowerInput)) {
      return EnhancedIntentType.NEGATION
    }

    // 修改请求（基于上一轮结果的调整）
    if (this.isModificationRequest(lowerInput)) {
      return EnhancedIntentType.MODIFICATION
    }

    // ==================== 查询类 ====================
    if (this.isQuery(lowerInput)) {
      return EnhancedIntentType.QUERY
    }

    // ==================== 简单问候/闲聊类 ====================
    // 在执行类之前检测，避免将问候语误判为命令
    if (this.isSimpleGreetingOrChat(lowerInput)) {
      return EnhancedIntentType.QUERY
    }

    // ==================== 执行类 ====================
    
    // 模糊请求检测
    if (this.isVagueRequest(lowerInput)) {
      return EnhancedIntentType.VAGUE_REQUEST
    }

    // 复杂任务检测
    if (this.isComplexTask(lowerInput)) {
      return EnhancedIntentType.COMPLEX_TASK
    }

    // 检查是否包含明确的文档操作关键词
    if (!this.hasDocumentOperationKeywords(lowerInput)) {
      // 没有文档操作关键词，当作普通对话/查询
      return EnhancedIntentType.QUERY
    }

    // 默认：直接命令
    return EnhancedIntentType.DIRECT_COMMAND
  }

  /**
   * 检查是否是确认
   */
  private isConfirmation(input: string): boolean {
    const confirmPatterns = [
      /^(好的?|可以|行|嗯|对|是的?|没问题|确认|确定|ok|yes|sure|right)$/i,
      /^(好的?|可以|行)，?继续/,
      /^执行吧/,
      /^就这样/
    ]
    return confirmPatterns.some(p => p.test(input.trim()))
  }

  /**
   * 检查是否是否定
   */
  private isNegation(input: string): boolean {
    const negationPatterns = [
      /^(不|不是|不对|不行|不要|错了|no|nope|wrong)$/i,
      /^不是这样/,
      /^这不是我想要的/,
      // 🔧 修复：只匹配"重新来/做/试"等否定性请求，不匹配"重新排版/整理"等操作命令
      /^重新(来|做|试|开始)$/
    ]
    return negationPatterns.some(p => p.test(input.trim()))
  }

  /**
   * 检查是否是修改请求
   */
  private isModificationRequest(input: string): boolean {
    const modificationPatterns = [
      /^(改|换|变)(成|为|换)/,
      /^把.*(改|换|变)(成|为)/,
      /^(颜色|字体|大小|样式)(改|换|变)/,
      /^不要.*要/,
      /^用.*代替/
    ]
    return modificationPatterns.some(p => p.test(input))
  }

  /**
   * 检查是否是查询
   * 
   * 🆕 优化：更精确地区分"查询/分析"和"执行/修改"意图
   * 关键逻辑：如果用户只是想了解信息而不是执行操作，应该返回 true
   */
  private isQuery(input: string): boolean {
    const lowerInput = input.toLowerCase()
    
    // 🔴 首先检查是否包含执行关键词 - 如果有，直接返回 false
    const executeKeywords = [
      '修改', '调整', '执行', '应用', '修复', '处理', '更新', '设置',
      '删除', '添加', '插入', '替换', '移除', '改为', '换成', '设为',
      '格式化', '重新排版', '重新整理', '优化', '美化',
      '解决', '纠正', '改正', '完善', '整改',  // 🆕 新增解决类关键词
      'modify', 'fix', 'update', 'apply', 'execute', 'change', 'set',
      'delete', 'add', 'insert', 'replace', 'remove', 'format', 'solve', 'resolve'
    ]
    
    const hasExecuteKeyword = executeKeywords.some(kw => lowerInput.includes(kw.toLowerCase()))
    if (hasExecuteKeyword) {
      logger.debug('[IntentExtractor] isQuery: false (contains execute keyword)', {
        input: input.substring(0, 50)
      })
      return false
    }
    
    // 🆕 检查是否是纯查询意图
    if (this.isQueryOnlyIntent(input)) {
      return true
    }
    
    const queryPatterns = [
      // 问号结尾
      /[？?]$/,
      // 疑问词开头
      /^(有多少|是什么|怎么|如何|为什么|什么是)/,
      /^(how|what|why|when|where|which|who)/i,
      // 数量询问
      /(几个|多少个|有没有)/,
      // 🆕 分析/查看/了解类请求（不修改文档，只是查询信息）
      /^(告诉我|说说|讲讲|分析|检查|查看|看看|了解|说明|解释|描述)/,
      /(问题|情况|状态|信息|内容|结构|概况|摘要|总结)$/,
      /存在(什么|哪些|的)?(问题|错误|缺陷)/,
      /(有什么|有哪些|存在哪些)(问题|错误|需要改进)/,
      // 🆕 英文分析请求
      /^(tell me|show me|analyze|check|review|explain|describe)/i,
      /(issues?|problems?|errors?|status|info|summary)$/i
    ]
    return queryPatterns.some(p => p.test(input))
  }

  /**
   * 🆕 检查是否是纯查询意图（不包含执行动词）
   * 
   * 这是一个更严格的检查，用于区分：
   * - "告诉我文档有什么问题" → 纯查询
   * - "修改文档中的问题" → 执行操作
   * - "分析并修改文档" → 执行操作（包含执行动词）
   */
  private isQueryOnlyIntent(input: string): boolean {
    const lowerInput = input.toLowerCase()
    
    // 🔴 执行类关键词（最高优先级 - 如果包含这些，绝对不是纯查询）
    const executeKeywords = [
      '修改', '调整', '执行', '应用', '修复', '处理', '更新', '设置',
      '删除', '添加', '插入', '替换', '移除', '改为', '换成', '设为',
      '格式化', '重新排版', '重新整理', '优化', '美化',
      '解决', '纠正', '改正', '完善', '整改',  // 🆕 新增解决类关键词
      'modify', 'fix', 'update', 'apply', 'execute', 'change', 'set',
      'delete', 'add', 'insert', 'replace', 'remove', 'format', 'solve', 'resolve'
    ]
    
    // 🔴 首先检查是否包含执行关键词 - 如果有，直接返回 false
    const hasExecuteKeyword = executeKeywords.some(kw => lowerInput.includes(kw.toLowerCase()))
    if (hasExecuteKeyword) {
      logger.debug('[IntentExtractor] Not query-only: contains execute keyword', {
        input: input.substring(0, 50)
      })
      return false
    }
    
    // 查询类关键词
    const queryKeywords = [
      '告诉我', '说说', '讲讲', '了解', '查看', '看看', '检查', '分析',
      '说明', '解释', '描述', '列出', '显示', '展示',
      '有什么', '有哪些', '存在什么', '存在哪些',
      '问题', '情况', '状态', '概况', '摘要', '总结',
      'tell me', 'show me', 'list', 'display', 'describe', 'explain',
      'what are', 'what is', 'how many', 'check', 'review', 'analyze'
    ]
    
    // 检查是否包含查询关键词
    const hasQueryKeyword = queryKeywords.some(kw => lowerInput.includes(kw.toLowerCase()))
    
    // 🆕 特殊模式：明确的查询请求
    const explicitQueryPatterns = [
      // "对...进行深入了解" - 纯查询
      /对.*(进行|做).*(了解|分析|检查|审查)/,
      // "告诉我...问题" - 纯查询
      /告诉我.*(问题|情况|状态)/,
      // "...存在的问题" - 纯查询
      /存在的?(问题|错误|缺陷)/,
      // "查看/检查...问题" - 纯查询
      /(查看|检查|审查|分析).*(问题|情况|状态|格式|排版)/,
      // "有什么问题" - 纯查询
      /有(什么|哪些)(问题|错误|需要改进)/,
      // "文档的问题" - 纯查询
      /(文档|文件|内容).*(问题|情况|状态)/,
      // 英文查询模式
      /what.*(issues?|problems?|errors?)/i,
      /check.*(for|the).*(issues?|problems?)/i,
      /review.*(the|this).*(document|file)/i
    ]
    
    const isExplicitQuery = explicitQueryPatterns.some(p => p.test(input))
    
    // 如果是明确的查询模式，则是纯查询（已经排除了执行关键词）
    if (isExplicitQuery) {
      logger.debug('[IntentExtractor] Detected query-only intent (explicit pattern)', {
        input: input.substring(0, 50),
        hasQueryKeyword
      })
      return true
    }
    
    // 如果包含查询关键词，也是纯查询（已经排除了执行关键词）
    if (hasQueryKeyword) {
      logger.debug('[IntentExtractor] Detected query-only intent (keyword match)', {
        input: input.substring(0, 50),
        hasQueryKeyword
      })
      return true
    }
    
    return false
  }

  /**
   * 检查是否是模糊请求
   */
  private isVagueRequest(input: string): boolean {
    const vaguePatterns = [
      /^帮我(.{0,4})(整理|美化|优化|处理|修改|改一下)/,
      /^(整理|美化|优化|处理|修改)一下/,
      /让(它|这个|文档|表格)更?(好|专业|美观|整齐)/,
      /^(这个|这份).*(怎么|如何|能不能)/,
      /^帮我看看/,
      /^处理一下/,
      /^弄一下/
    ]
    return vaguePatterns.some(p => p.test(input))
  }

  /**
   * 检查是否是复杂任务
   */
  private isComplexTask(input: string): boolean {
    const complexPatterns = [
      /制作.*(简历|报告|方案|计划|总结)/,
      /创建.*(模板|文档|表格)/,
      /生成.*(报告|分析|总结)/,
      /帮我(写|做|完成).{4,}/,
      /从头.*(开始|创建|制作)/,
      // 🆕 读取+操作模式
      /读取.*(然后|并|再|接着)/,
      /根据.*(内容|文档).*(进行|执行|完成)/,
      // 🆕 多步骤任务
      /(首先|然后|最后|接着).*(然后|并且|再|接着)/,
      /需要你.*(读取|分析|整理|排版|格式化)/,
      // 🆕 重新/重做模式
      /重新(排版|整理|格式化|编辑|修改)/
    ]
    return complexPatterns.some(p => p.test(input)) || input.length > 50
  }

  /**
   * 检查是否是简单问候或闲聊
   */
  private isSimpleGreetingOrChat(input: string): boolean {
    const greetingPatterns = [
      // 中文问候
      /^(你好|您好|嗨|哈喽|早上好|下午好|晚上好|早安|晚安)$/,
      /^(hi|hello|hey|good morning|good afternoon|good evening)$/i,
      // 简单闲聊
      /^(在吗|你在吗|在不在|你是谁|你叫什么|你会什么)$/,
      /^(谢谢|感谢|多谢|thank|thanks)$/i,
      /^(再见|拜拜|bye|goodbye)$/i,
      // 带问候语的短句
      /^(你好|您好|嗨).{0,5}$/
    ]
    return greetingPatterns.some(p => p.test(input.trim()))
  }

  /**
   * 检查是否包含文档操作关键词
   */
  private hasDocumentOperationKeywords(input: string): boolean {
    const documentKeywords = [
      // 格式化操作
      '加粗', '斜体', '下划线', '字体', '字号', '颜色', '对齐', '缩进', '行距',
      'bold', 'italic', 'underline', 'font', 'size', 'color', 'align', 'indent',
      // 颜色词汇
      '红色', '蓝色', '绿色', '黄色', '黑色', '白色', '灰色', '紫色', '橙色',
      'red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'purple', 'orange',
      // 结构操作
      '插入', '删除', '添加', '移除', '替换', '修改', '复制', '粘贴',
      'insert', 'delete', 'add', 'remove', 'replace', 'modify', 'copy', 'paste',
      // 🆕 执行类操作动词
      '修复', '执行', '应用', '处理', '更新', '设置',
      '解决', '纠正', '改正', '完善', '整改',  // 🆕 新增解决类关键词
      'fix', 'execute', 'apply', 'process', 'update', 'set', 'solve', 'resolve',
      // 中文操作动词
      '设为', '设置为', '改为', '换成', '调整为',
      // 文档元素
      '段落', '标题', '列表', '表格', '图片', '链接', '页眉', '页脚',
      'paragraph', 'heading', 'list', 'table', 'image', 'link', 'header', 'footer',
      // 选择操作
      '选中', '全选', '选择', 'select', 'selected',
      // 文档操作
      '保存', '导出', '打印', 'save', 'export', 'print',
      // 🆕 排版/整理相关操作
      '排版', '整理', '格式化', '美化', '优化', '重新排版', '重新整理',
      'format', 'layout', 'organize', 'beautify', 'optimize',
      // 🆕 读取/分析相关操作
      '读取', '分析', '查看', '获取', '提取',
      'read', 'analyze', 'view', 'get', 'extract',
      // 🆕 编辑相关操作
      '编辑', '调整', '更新', '改写', '重写', '润色',
      'edit', 'adjust', 'update', 'rewrite', 'polish',
      // 🆕 内容操作
      '内容', '文本', '文字', '正文', '章节',
      'content', 'text', 'body', 'section', 'chapter',
      // 🆕 文档相关
      '文档', '文件',
      'document', 'file'
    ]
    return documentKeywords.some(keyword => input.includes(keyword))
  }

  /**
   * 判断是否是对话控制意图
   */
  private isDialogControlIntent(type: EnhancedIntentType): boolean {
    const dialogControlTypes = [
      EnhancedIntentType.CONFIRMATION,
      EnhancedIntentType.NEGATION,
      EnhancedIntentType.UNDO_REQUEST,
      EnhancedIntentType.CANCEL_REQUEST,
      EnhancedIntentType.CONTINUE_REQUEST,
      EnhancedIntentType.PAUSE_REQUEST
    ]
    return dialogControlTypes.includes(type)
  }

  /**
   * 获取建议的澄清问题
   */
  private getSuggestedClarifications(input: string): string[] {
    const suggestions: string[] = []
    
    if (input.includes('整理')) {
      suggestions.push('您希望按什么方式整理？（排序/格式化/清理）')
    }
    if (input.includes('美化')) {
      suggestions.push('您想要什么风格？（专业/学术/简约）')
    }
    if (input.includes('优化')) {
      suggestions.push('您想优化哪些方面？（可读性/排版/数据展示）')
    }
    if (input.includes('表格') || input.includes('成绩')) {
      suggestions.push('您想对表格进行什么操作？（排序/筛选/图表）')
    }

    // 通用建议
    if (suggestions.length === 0) {
      suggestions.push('请告诉我具体想要进行什么操作？')
    }

    return suggestions
  }
}