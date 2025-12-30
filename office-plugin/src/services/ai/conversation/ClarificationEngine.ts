/**
 * 澄清引擎
 * 
 * 检测模糊请求，生成澄清问题
 * 帮助 AI 更准确理解用户意图
 */

import Logger from '../../../utils/logger'
import {
  ClarificationQuestion,
  ClarificationOption,
  createClarificationQuestion
} from './ConversationState'

const logger = new Logger('ClarificationEngine')

/**
 * 澄清场景配置
 */
interface ClarificationScenario {
  /** 场景关键词 */
  keywords: string[]
  /** 场景描述 */
  description: string
  /** 澄清问题 */
  question: string
  /** 预定义选项 */
  options: ClarificationOption[]
  /** 问题类型 */
  type: ClarificationQuestion['type']
}

/**
 * 预定义的澄清场景
 * 针对教师用户的常见模糊请求
 */
const CLARIFICATION_SCENARIOS: ClarificationScenario[] = [
  // ==================== 文档整理类 ====================
  {
    keywords: ['整理', '整理一下', '帮我整理'],
    description: '文档整理',
    question: '您希望如何整理这份文档？',
    type: 'single_choice',
    options: [
      { id: 'sort', text: '按某列排序', icon: '📊', suggestedTools: ['excel_sort_range'] },
      { id: 'format', text: '统一格式和样式', icon: '🎨', suggestedTools: ['word_apply_style', 'word_set_paragraph_alignment'] },
      { id: 'clean', text: '清理重复或空白', icon: '🧹', suggestedTools: ['excel_remove_duplicates'] },
      { id: 'structure', text: '调整结构和布局', icon: '📐', suggestedTools: ['word_set_paragraph_spacing'] },
      { id: 'all', text: '全面整理（以上全部）', icon: '✨' }
    ]
  },

  // ==================== 美化类 ====================
  {
    keywords: ['美化', '好看', '漂亮', '美观'],
    description: '文档美化',
    question: '您希望怎样美化这份文档？',
    type: 'single_choice',
    options: [
      { id: 'professional', text: '专业商务风格', icon: '💼', suggestedTools: ['word_apply_style'] },
      { id: 'academic', text: '学术论文风格', icon: '📚', suggestedTools: ['word_set_heading', 'word_add_page_numbers'] },
      { id: 'colorful', text: '色彩丰富活泼', icon: '🌈', suggestedTools: ['word_set_font_color', 'word_set_highlight'] },
      { id: 'minimal', text: '简约清爽风格', icon: '✨', suggestedTools: ['word_apply_style'] },
      { id: 'template', text: '应用预设模板', icon: '📄' }
    ]
  },

  // ==================== 优化类 ====================
  {
    keywords: ['优化', '改进', '提升', '改善'],
    description: '文档优化',
    question: '请告诉我您想优化哪些方面：',
    type: 'multiple_choice',
    options: [
      { id: 'readability', text: '可读性（字体、间距）', icon: '📖', suggestedTools: ['word_set_font_size', 'word_set_line_spacing'] },
      { id: 'layout', text: '排版结构', icon: '📐', suggestedTools: ['word_set_paragraph_alignment', 'word_set_paragraph_spacing'] },
      { id: 'data', text: '数据展示（图表）', icon: '📊', suggestedTools: ['excel_create_chart'] },
      { id: 'concise', text: '内容精简', icon: '⚡' },
      { id: 'consistency', text: '格式一致性', icon: '🎯', suggestedTools: ['word_apply_style'] }
    ]
  },

  // ==================== 表格处理类 ====================
  {
    keywords: ['表格', '成绩表', '数据表', '统计表'],
    description: '表格处理',
    question: '您想对表格进行什么操作？',
    type: 'single_choice',
    options: [
      { id: 'sort', text: '排序（按成绩、姓名等）', icon: '🔢', suggestedTools: ['excel_sort_range'] },
      { id: 'filter', text: '筛选特定数据', icon: '🔍', suggestedTools: ['excel_filter_data'] },
      { id: 'format', text: '美化表格样式', icon: '🎨', suggestedTools: ['excel_format_cells'] },
      { id: 'chart', text: '生成图表', icon: '📈', suggestedTools: ['excel_create_chart'] },
      { id: 'calculate', text: '添加统计计算', icon: '🧮', suggestedTools: ['excel_set_formula'] }
    ]
  },

  // ==================== 教案/课件类 ====================
  {
    keywords: ['教案', '课件', '讲义', 'ppt', 'PPT'],
    description: '教案课件处理',
    question: '您希望如何处理这份教案/课件？',
    type: 'single_choice',
    options: [
      { id: 'format', text: '统一格式排版', icon: '📝', suggestedTools: ['word_apply_style', 'ppt_apply_theme'] },
      { id: 'outline', text: '生成大纲目录', icon: '📋', suggestedTools: ['word_insert_toc'] },
      { id: 'visual', text: '增加视觉元素', icon: '🖼️', suggestedTools: ['ppt_add_image', 'word_insert_image'] },
      { id: 'notes', text: '添加备注说明', icon: '💬', suggestedTools: ['ppt_add_notes'] },
      { id: 'print', text: '优化打印效果', icon: '🖨️' }
    ]
  },

  // ==================== 修改类（模糊） ====================
  {
    keywords: ['修改', '改一下', '调整', '处理'],
    description: '通用修改',
    question: '请告诉我您具体想修改什么：',
    type: 'free_text',
    options: []
  }
]

/**
 * 模糊请求检测模式
 */
const VAGUE_PATTERNS = [
  /^帮我(.{0,4})(整理|美化|优化|处理|修改|改一下)/,
  /^(整理|美化|优化|处理|修改)一下/,
  /(美化|优化|整理).*(文档|表格|课件|这个)/,
  /让(它|这个|文档|表格|课件)更?(好|专业|美观|整齐)/,
  /^(这个|这份).*(怎么|如何|能不能)/,
  /^帮我看看/,
  /^处理一下/
]

/**
 * 直接命令模式（不需要澄清）
 */
const DIRECT_COMMAND_PATTERNS = [
  /把.*(加粗|变红|变蓝|居中|左对齐|右对齐)/,
  /将.*(字号|字体|颜色|文字).*(改为|变|设为|变红|变蓝)/,
  /删除.*(第.段|第.行|表格)/,
  /插入.*(表格|图片|链接)/,
  /替换.*为/,
  /查找.*替换/
]

/**
 * 澄清引擎类
 */
export class ClarificationEngine {
  /**
   * 检查是否需要澄清
   */
  needsClarification(input: string): boolean {
    // 先检查是否是直接命令
    if (this.isDirectCommand(input)) {
      logger.debug('[ClarificationEngine] Direct command detected, no clarification needed', {
        input: input.substring(0, 50)
      })
      return false
    }

    // 检查是否匹配模糊请求模式
    const isVague = VAGUE_PATTERNS.some(pattern => pattern.test(input))
    
    if (isVague) {
      logger.info('[ClarificationEngine] Vague request detected', {
        input: input.substring(0, 50)
      })
    }

    return isVague
  }

  /**
   * 检查是否是直接命令
   */
  isDirectCommand(input: string): boolean {
    return DIRECT_COMMAND_PATTERNS.some(pattern => pattern.test(input))
  }

  /**
   * 生成澄清问题
   */
  generateClarificationQuestion(input: string): ClarificationQuestion {
    // 查找匹配的场景
    const scenario = this.findMatchingScenario(input)

    if (scenario) {
      logger.info('[ClarificationEngine] Matched scenario', {
        scenario: scenario.description,
        input: input.substring(0, 50)
      })

      return createClarificationQuestion(
        scenario.question,
        scenario.type,
        scenario.options
      )
    }

    // 没有匹配的场景，生成通用问题
    logger.info('[ClarificationEngine] No matching scenario, using generic question', {
      input: input.substring(0, 50)
    })

    return createClarificationQuestion(
      '请告诉我您具体想要进行什么操作？\n\n例如：\n- 具体要修改的内容\n- 想要达到的效果\n- 涉及的范围（全文/选中部分）',
      'free_text'
    )
  }

  /**
   * 查找匹配的澄清场景
   */
  private findMatchingScenario(input: string): ClarificationScenario | null {
    const lowerInput = input.toLowerCase()

    for (const scenario of CLARIFICATION_SCENARIOS) {
      if (scenario.keywords.some(keyword => lowerInput.includes(keyword))) {
        return scenario
      }
    }

    return null
  }

  /**
   * 根据用户选择获取推荐工具
   */
  getRecommendedTools(selectedOptionId: string): string[] {
    for (const scenario of CLARIFICATION_SCENARIOS) {
      const option = scenario.options.find(opt => opt.id === selectedOptionId)
      if (option?.suggestedTools) {
        return option.suggestedTools
      }
    }
    return []
  }

  /**
   * 解析用户回答，提取结构化信息
   */
  parseUserAnswer(
    question: ClarificationQuestion,
    answer: string
  ): {
    intent: string
    suggestedTools: string[]
    additionalContext: string
  } {
    // 如果是选择题且有选中的选项
    if (question.selectedOptionId && question.options) {
      const selectedOption = question.options.find(opt => opt.id === question.selectedOptionId)
      if (selectedOption) {
        return {
          intent: selectedOption.text,
          suggestedTools: selectedOption.suggestedTools || [],
          additionalContext: answer
        }
      }
    }

    // 自由文本回答
    return {
      intent: answer,
      suggestedTools: [],
      additionalContext: ''
    }
  }

  /**
   * 构建增强的用户意图（结合澄清结果）
   */
  buildEnhancedIntent(
    originalIntent: string,
    clarifications: ClarificationQuestion[]
  ): string {
    if (clarifications.length === 0) {
      return originalIntent
    }

    const answeredClarifications = clarifications.filter(c => c.answered)
    if (answeredClarifications.length === 0) {
      return originalIntent
    }

    // 构建增强意图
    const clarificationContext = answeredClarifications
      .map(c => {
        if (c.selectedOptionId && c.options) {
          const option = c.options.find(opt => opt.id === c.selectedOptionId)
          return option ? option.text : c.answer
        }
        return c.answer
      })
      .filter(Boolean)
      .join('，')

    return `${originalIntent}（具体要求：${clarificationContext}）`
  }

  /**
   * 获取所有可用的澄清场景（用于调试或配置）
   */
  getAvailableScenarios(): { keyword: string; description: string }[] {
    return CLARIFICATION_SCENARIOS.map(s => ({
      keyword: s.keywords[0],
      description: s.description
    }))
  }
}

// 导出单例
export const clarificationEngine = new ClarificationEngine()
