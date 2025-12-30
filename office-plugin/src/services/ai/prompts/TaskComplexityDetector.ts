/**
 * 任务复杂度检测器
 * 
 * 自动分析用户请求的复杂度，判断是否需要创建任务列表
 * 类似 Cursor、Windsurf 的自动任务规划触发机制
 */

import Logger from '../../../utils/logger'
import type { ReviewResult } from '../conversation/ReviewContextExtractor'

const logger = new Logger('TaskComplexityDetector')

/**
 * 任务复杂度级别
 */
export type TaskComplexity = 'simple' | 'moderate' | 'complex'

/**
 * 复杂度检测结果
 */
export interface ComplexityResult {
  /** 复杂度级别 */
  complexity: TaskComplexity
  /** 是否需要任务规划 */
  needsPlanning: boolean
  /** 检测到的复杂度指标 */
  indicators: string[]
  /** 建议的步骤数（如果需要规划） */
  suggestedStepCount?: number
  /** 置信度 (0-1) */
  confidence: number
  /** 🆕 是否包含上下文引用 */
  hasContextReference?: boolean
  /** 🆕 上下文引用类型 */
  contextReferenceType?: 'review' | 'suggestion' | 'task' | 'previous' | 'none'
  contextReferenceTokens?: string[]
  /** 🆕 是否是纯查询意图（不需要执行操作） */
  isQueryOnly?: boolean
}

/**
 * 多步骤提示词
 */
const MULTI_STEP_KEYWORDS = [
  '然后', '接着', '之后', '首先', '其次', '最后',
  '第一步', '第二步', '第三步', '第一', '第二', '第三',
  '同时', '并且', '以及', '另外', '还要',
  'step 1', 'step 2', 'step 3', 'then', 'after that', 'next', 'first', 'second', 'finally',
  'also', 'additionally', 'furthermore'
]

/**
 * 批量/全局范围提示词
 */
const BATCH_OPERATION_KEYWORDS = [
  '所有', '全部', '每个', '每一处', '整个文档', '全篇', '所有页面', '整个文件', '批量', '通篇',
  'all', 'every', 'each', 'entire', 'whole document', 'all pages', 'throughout', 'batch'
]

/**
 * 复杂修改提示词
 */
const COMPLEX_MODIFICATION_KEYWORDS = [
  '重新排版', '重新格式化', '全面修改', '统一格式', '重构', '优化整体', '彻底调整', '合并', '拆分',
  'reformat', 'restructure', 'overhaul', 'refactor', 'optimize all', 'standardize', 'cleanup'
]

/**
 * 涉及多文档/多部分的提示词
 */
const MULTI_DOCUMENT_KEYWORDS = [
  '多个文档', '多个文件', '跨文档', '跨文件', '所有文档', '全部文件', '所有章节', '整本教材', '所有幻灯片',
  'all documents', 'multiple files', 'across documents', 'across slides', 'entire workbook'
]

/**
 * 复杂任务关键词（中文）- 兼容旧版检测逻辑
 */
const COMPLEX_TASK_KEYWORDS_CN = [
  ...MULTI_STEP_KEYWORDS.filter(k => !k.includes(' ')),
  ...BATCH_OPERATION_KEYWORDS.filter(k => !k.includes(' ')),
  ...COMPLEX_MODIFICATION_KEYWORDS.filter(k => !k.includes(' ')),
  '整个文档', '重新排版'
]

/**
 * 复杂任务关键词（英文）- 兼容旧版检测逻辑
 */
const COMPLEX_TASK_KEYWORDS_EN = [
  ...MULTI_STEP_KEYWORDS.filter(k => k.includes(' ') || /^[a-z]+$/i.test(k)),
  ...BATCH_OPERATION_KEYWORDS.filter(k => k.includes(' ') || /^[a-z]+$/i.test(k)),
  ...COMPLEX_MODIFICATION_KEYWORDS.filter(k => k.includes(' ') || /^[a-z]+$/i.test(k))
]

/**
 * 文档部分关键词
 */
const DOCUMENT_PART_KEYWORDS = [
  '标题', '正文', '段落', '表格', '图片', '页眉', '页脚', '目录', '章节', '封面', '参考文献', '附录',
  'header', 'footer', 'table', 'figure', 'chart', 'toc', 'chapter', 'summary'
]

/**
 * 操作动词
 */
const OPERATION_VERBS = [
  '查找', '替换', '格式化', '保存', '调整', '插入', '删除', '复制', '粘贴', '统计', '分析', '生成', '审核', '更新', '设定', '排序',
  'format', 'replace', 'refactor', 'optimize', 'standardize', 'align', 'sort', 'calculate', 'analyze', 'generate', 'summarize', 'review', 'clean', 'organize'
]

/**
 * 列表/编号结构检测
 */
const NUMBERED_LIST_REGEX = /(^|\s)(\d+[.)、]|[①-⑩]|\*|\-|•|一、|二、|三、)/m

/**
 * 分值阈值
 */
const COMPLEXITY_SCORE_THRESHOLD = 3
const MODERATE_SCORE_THRESHOLD = 1.5

/**
 * 简单任务模式
 */
const SIMPLE_TASK_PATTERNS = [
  // 单一格式操作
  /^(加粗|斜体|下划线|删除线)$/,
  /^(设置|改为|改成|换成).{0,10}(字体|字号|颜色)$/,
  
  // 单一查询
  /^(什么是|有什么|告诉我|解释|说明)/,
  
  // 简单插入
  /^(插入|添加)(一个|一张|一行)/,
  
  // 简单删除
  /^删除(这|这个|选中|当前)/,
  
  // 简单替换
  /^(把|将).{0,20}(改为|替换为|换成)/
]

/**
 * 🆕 纯查询意图模式（不应该触发任务规划）
 */
const QUERY_ONLY_PATTERNS = [
  // "了解/查看/检查...问题" - 纯查询
  /对.*(进行|做).*(了解|分析|检查|审查)/,
  /告诉我.*(问题|情况|状态|格式|排版)/,
  /(查看|检查|审查|分析).*(问题|情况|状态|格式|排版)/,
  /存在的?(问题|错误|缺陷)/,
  /有(什么|哪些)(问题|错误|需要改进)/,
  /(文档|文件|内容).*(问题|情况|状态)/,
  // 🆕 扩展查询模式
  /存在(什么|哪些).*(问题|错误)/,
  /(需要|要)(改进|改善|优化)的(地方|部分|内容)/,
  /有哪些.*(需要|要)(改进|改善)/,
  /(看看|查看|检查).*(存在|有)(什么|哪些)/,
  // 英文查询模式
  /what.*(issues?|problems?|errors?)/i,
  /check.*(for|the).*(issues?|problems?)/i,
  /review.*(the|this).*(document|file)/i,
  /tell me.*(about|what)/i,
  /show me.*(issues?|problems?)/i,
  // 问号结尾的短句
  /^.{0,30}[？?]$/
]

/**
 * 🆕 执行类关键词（如果包含这些，即使匹配查询模式也不是纯查询）
 */
const EXECUTE_KEYWORDS = [
  '修改', '调整', '执行', '应用', '修复', '处理', '更新', '设置',
  '删除', '添加', '插入', '替换', '移除', '改为', '换成', '设为',
  '格式化', '重新排版', '重新整理', '优化', '美化',
  '根据审查', '根据分析', '按照建议', '执行修改', '进行修改',
  '解决', '纠正', '改正', '完善', '整改',  // 🆕 新增解决类关键词
  'modify', 'fix', 'update', 'apply', 'execute', 'change', 'set',
  'delete', 'add', 'insert', 'replace', 'remove', 'format',
  'based on review', 'fix the issues', 'make changes', 'solve', 'resolve'
]

/**
 * 增强检测模式（v2）
 */
const ENHANCED_PATTERNS = {
  // 条件逻辑检测
  conditionalPatterns: [
    /如果.*(就|则)/,
    /当.*时/,
    /若.*则/,
    /if.*then/i,
    /根据.*情况/,
    /视.*而定/
  ],
  
  // 迭代操作检测
  iterationPatterns: [
    /每[一个]?.*(都|均)/,
    /逐[一个]?/,
    /依次/,
    /循环/,
    /for each/i,
    /iterate/i,
    /one by one/i
  ],
  
  // 跨文档/多文件操作检测
  crossDocumentPatterns: [
    /所有文档/,
    /多个文件/,
    /批量处理/,
    /整个项目/,
    /all documents/i,
    /multiple files/i,
    /batch process/i
  ],
  
  // 分析+操作组合模式
  analyzeAndOperatePatterns: [
    /先.*(分析|检查|查看).*(然后|再|接着)/,
    /分析.*后.*(修改|调整|更新)/,
    /读取.*并.*(处理|修改|更新)/,
    /analyze.*then/i,
    /review.*and.*(fix|update|modify)/i
  ],

  // 🆕 上下文引用检测模式
  contextReferencePatterns: {
    // 指代词 - 引用之前的内容
    demonstrative: [
      /这些|那些|这个|那个|上述|以上|上面的|刚才的|之前的|前面的/,
      /these|those|this|that|above|previous|earlier/i
    ],
    // 审查关联词 - 明确引用审查结果
    reviewRelated: [
      /审查结果|审查发现|检查结果|分析结果|诊断结果/,
      /发现的问题|存在的问题|提出的建议|给出的建议/,
      /根据审查|按照建议|根据分析|根据检查|基于.*结果/,
      /review results?|issues? found|based on review|as suggested/i
    ],
    // 应用类动词 - 表示执行操作
    applyVerbs: [
      /应用|执行|实施|采纳|修复|处理/,
      /apply|execute|implement|fix/i
    ]
  }
}

/**
 * 检测上下文引用
 */
function detectContextReference(userInput: string): {
  hasReference: boolean
  referenceType: 'review' | 'suggestion' | 'task' | 'previous' | 'none'
  confidence: number
  tokens: string[]
} {
  let confidence = 0
  let referenceType: 'review' | 'suggestion' | 'task' | 'previous' | 'none' = 'none'
  const detectedTokens: string[] = []
  
  // 检查审查关联词（最高优先级）
  for (const pattern of ENHANCED_PATTERNS.contextReferencePatterns.reviewRelated) {
    const match = userInput.match(pattern)
    if (match) {
      confidence += 0.4
      referenceType = 'review'
      detectedTokens.push(match[0])
    }
  }
  
  // 检查指代词
  for (const pattern of ENHANCED_PATTERNS.contextReferencePatterns.demonstrative) {
    const match = userInput.match(pattern)
    if (match) {
      confidence += 0.25
      if (referenceType === 'none') referenceType = 'previous'
      detectedTokens.push(match[0])
    }
  }
  
  // 检查应用类动词（配合其他检测增加置信度）
  for (const pattern of ENHANCED_PATTERNS.contextReferencePatterns.applyVerbs) {
    const match = userInput.match(pattern)
    if (match) {
      if (confidence > 0) {
        confidence += 0.15
      }
      if (referenceType === 'none') referenceType = 'suggestion'
      detectedTokens.push(match[0])
    }
  }
  
  // 归一化
  confidence = Math.min(confidence, 1)
  const hasReference = confidence >= 0.3
  const normalizedTokens = Array.from(new Set(detectedTokens))
  
  return {
    hasReference,
    referenceType,
    confidence,
    tokens: hasReference ? normalizedTokens : []
  }
}

interface IndicatorDetectionResult {
  detail: string
  weightOverride?: number
}

interface ComplexityIndicatorDefinition {
  name: string
  weight: number
  detect: (normalizedInput: string, rawInput: string) => IndicatorDetectionResult | null
}

const INDICATOR_DEFINITIONS: ComplexityIndicatorDefinition[] = [
  {
    name: 'multi_step_keywords',
    weight: 1.2,
    detect: (normalized) => detectKeywordIndicator(normalized, MULTI_STEP_KEYWORDS, '多步骤关键词')
  },
  {
    name: 'batch_scope',
    weight: 1,
    detect: (normalized) => detectKeywordIndicator(normalized, BATCH_OPERATION_KEYWORDS, '批量/全局范围')
  },
  {
    name: 'complex_modification',
    weight: 1,
    detect: (normalized) => detectKeywordIndicator(normalized, COMPLEX_MODIFICATION_KEYWORDS, '复杂修改请求', { maxExamples: 3 })
  },
  {
    name: 'multi_document',
    weight: 1.3,
    detect: (normalized) => detectKeywordIndicator(normalized, MULTI_DOCUMENT_KEYWORDS, '跨文档/多文件')
  },
  {
    name: 'document_parts',
    weight: 1.2,
    detect: (_, raw) => detectDocumentParts(raw)
  },
  {
    name: 'operation_verbs',
    weight: 1.5,
    detect: (_, raw) => detectVerbDensity(raw)
  },
  {
    name: 'list_structure',
    weight: 1,
    detect: (_, raw) => detectListStructure(raw)
  },
  {
    name: 'conditional_logic',
    weight: 1.2,
    detect: (_, raw) => detectPatternGroup(ENHANCED_PATTERNS.conditionalPatterns, raw, '包含条件逻辑')
  },
  {
    name: 'iteration_patterns',
    weight: 1.2,
    detect: (_, raw) => detectPatternGroup(ENHANCED_PATTERNS.iterationPatterns, raw, '涉及循环/逐项操作')
  },
  {
    name: 'cross_document_patterns',
    weight: 1.3,
    detect: (_, raw) => detectPatternGroup(ENHANCED_PATTERNS.crossDocumentPatterns, raw, '跨文档处理')
  },
  {
    name: 'analysis_operate',
    weight: 1.1,
    detect: (_, raw) => detectPatternGroup(ENHANCED_PATTERNS.analyzeAndOperatePatterns, raw, '分析+执行组合')
  },
  {
    name: 'long_input',
    weight: 1,
    detect: (normalized) => detectLengthIndicator(normalized)
  }
]

function detectKeywordIndicator(
  normalizedInput: string,
  keywords: string[],
  label: string,
  options: { minMatches?: number; maxExamples?: number } = {}
): IndicatorDetectionResult | null {
  const minMatches = options.minMatches ?? 1
  const matches = keywords.filter((keyword) => normalizedInput.includes(keyword.toLowerCase()))
  if (matches.length < minMatches) {
    return null
  }

  const examples = Array.from(new Set(matches)).slice(0, options.maxExamples ?? 3)
  return {
    detail: `${label}: ${examples.join('、')}`,
    weightOverride: undefined
  }
}

function detectDocumentParts(rawInput: string): IndicatorDetectionResult | null {
  const parts = DOCUMENT_PART_KEYWORDS.filter((part) => rawInput.includes(part))
  if (parts.length >= 3) {
    return {
      detail: `涉及多个文档部分 (${parts.slice(0, 4).join('、')})`,
      weightOverride: 1.8
    }
  }
  if (parts.length === 2) {
    return {
      detail: `涉及至少两个文档部分 (${parts.join('、')})`,
      weightOverride: 1
    }
  }
  return null
}

function escapeRegexLiteral(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function detectVerbDensity(rawInput: string): IndicatorDetectionResult | null {
  const verbPattern = new RegExp(OPERATION_VERBS.map(escapeRegexLiteral).join('|'), 'gi')
  const matches = rawInput.match(verbPattern)
  if (!matches) return null

  if (matches.length >= 5) {
    return {
      detail: `多个操作动词 (${matches.length} 个)`,
      weightOverride: 2.2
    }
  }

  if (matches.length >= 3) {
    return {
      detail: `多个操作动词 (${matches.length} 个)`,
      weightOverride: 1.5
    }
  }

  if (matches.length === 2) {
    return {
      detail: '包含两个核心操作',
      weightOverride: 1
    }
  }

  return null
}

function detectListStructure(rawInput: string): IndicatorDetectionResult | null {
  if (NUMBERED_LIST_REGEX.test(rawInput)) {
    return {
      detail: '包含列表或编号结构',
      weightOverride: 1
    }
  }
  return null
}

function detectPatternGroup(patterns: RegExp[], rawInput: string, label: string): IndicatorDetectionResult | null {
  if (patterns.some((pattern) => pattern.test(rawInput))) {
    return { detail: label }
  }
  return null
}

function detectLengthIndicator(normalizedInput: string): IndicatorDetectionResult | null {
  if (normalizedInput.length > 220) {
    return {
      detail: `输入长度 ${normalizedInput.length} 字符，疑似复杂说明`,
      weightOverride: 1.2
    }
  }
  if (normalizedInput.length > 120) {
    return {
      detail: `输入较长 (${normalizedInput.length} 字符)`,
      weightOverride: 0.8
    }
  }
  return null
}

/**
 * 🆕 检查是否是纯查询意图（不应该触发任务规划）
 * 
 * 这个函数用于区分：
 * - "告诉我文档有什么问题" → 纯查询，不应该触发任务规划
 * - "修改文档中的问题" → 执行操作，可能需要任务规划
 */
function isQueryOnlyIntent(userInput: string): boolean {
  const lowerInput = userInput.toLowerCase()
  
  // 🔴 首先检查是否包含执行关键词 - 如果有，直接返回 false
  const hasExecuteKeyword = EXECUTE_KEYWORDS.some(kw => lowerInput.includes(kw.toLowerCase()))
  if (hasExecuteKeyword) {
    return false
  }
  
  // 检查是否匹配查询模式（已经排除了执行关键词）
  const matchesQueryPattern = QUERY_ONLY_PATTERNS.some(p => p.test(userInput))
  
  return matchesQueryPattern
}

/**
 * 检测任务复杂度
 */
export function detectTaskComplexity(userInput: string): ComplexityResult {
  const input = userInput.toLowerCase().trim()
  const indicators: string[] = []
  let complexityScore = 0
  
  // 🆕 0. 首先检查是否是纯查询意图（不应该触发任务规划）
  if (isQueryOnlyIntent(userInput)) {
    logger.info('[COMPLEXITY] Detected query-only intent, skipping planning', {
      input: userInput.substring(0, 50)
    })
    return {
      complexity: 'simple',
      needsPlanning: false,
      indicators: ['纯查询意图（不需要执行操作）'],
      confidence: 0.95,
      isQueryOnly: true
    }
  }
  
  // 1. 检查是否匹配简单任务模式
  for (const pattern of SIMPLE_TASK_PATTERNS) {
    if (pattern.test(userInput)) {
      logger.debug('[COMPLEXITY] Matched simple task pattern', { pattern: pattern.toString() })
      return {
        complexity: 'simple',
        needsPlanning: false,
        indicators: ['匹配简单任务模式'],
        confidence: 0.9
      }
    }
  }
  
  // 2. 检查复杂任务关键词（中文）
  for (const keyword of COMPLEX_TASK_KEYWORDS_CN) {
    if (input.includes(keyword.toLowerCase())) {
      complexityScore += 1
      indicators.push(`关键词: ${keyword}`)
    }
  }
  
  // 3. 检查复杂任务关键词（英文）
  for (const keyword of COMPLEX_TASK_KEYWORDS_EN) {
    if (input.includes(keyword.toLowerCase())) {
      complexityScore += 1
      indicators.push(`Keyword: ${keyword}`)
    }
  }
  
  // 4. 检查输入长度（长请求通常更复杂）
  if (input.length > 100) {
    complexityScore += 1
    indicators.push(`长度: ${input.length}字符`)
  }
  if (input.length > 200) {
    complexityScore += 1
    indicators.push('超长请求')
  }
  
  // 5. 检查是否包含多个动词（表示多步骤）
  const verbPatterns = [
    /修改|更改|调整|设置|添加|删除|插入|替换|移动|复制|格式化|排版|优化|检查|分析/g
  ]
  let verbCount = 0
  for (const pattern of verbPatterns) {
    const matches = input.match(pattern)
    if (matches) {
      verbCount += matches.length
    }
  }
  if (verbCount >= 3) {
    complexityScore += 2
    indicators.push(`多个操作动词: ${verbCount}个`)
  } else if (verbCount >= 2) {
    complexityScore += 1
    indicators.push(`操作动词: ${verbCount}个`)
  }
  
  // 6. 检查是否包含列表或编号（表示多步骤指令）
  if (/[1-9][.、)]\s|①|②|③|•|-\s/.test(input)) {
    complexityScore += 2
    indicators.push('包含列表/编号')
  }
  
  // 7. 检查是否涉及多个文档部分
  const documentParts = ['标题', '正文', '段落', '表格', '图片', '页眉', '页脚', '目录', '章节']
  let partCount = 0
  for (const part of documentParts) {
    if (input.includes(part)) {
      partCount++
    }
  }
  if (partCount >= 3) {
    complexityScore += 2
    indicators.push(`涉及多个文档部分: ${partCount}个`)
  } else if (partCount >= 2) {
    complexityScore += 1
    indicators.push(`文档部分: ${partCount}个`)
  }
  
  // 8. 增强检测：条件逻辑 (+2)
  for (const pattern of ENHANCED_PATTERNS.conditionalPatterns) {
    if (pattern.test(userInput)) {
      complexityScore += 2
      indicators.push('包含条件逻辑')
      break
    }
  }
  
  // 9. 增强检测：迭代操作 (+2)
  for (const pattern of ENHANCED_PATTERNS.iterationPatterns) {
    if (pattern.test(userInput)) {
      complexityScore += 2
      indicators.push('包含迭代操作')
      break
    }
  }
  
  // 10. 增强检测：跨文档操作 (+3)
  for (const pattern of ENHANCED_PATTERNS.crossDocumentPatterns) {
    if (pattern.test(userInput)) {
      complexityScore += 3
      indicators.push('涉及多文档操作')
      break
    }
  }
  
  // 11. 增强检测：分析+操作组合 (+2)
  for (const pattern of ENHANCED_PATTERNS.analyzeAndOperatePatterns) {
    if (pattern.test(userInput)) {
      complexityScore += 2
      indicators.push('分析与操作组合')
      break
    }
  }
  
  // 🆕 12. 上下文引用检测 (+3) - 当用户引用之前的审查结果时
  const contextRef = detectContextReference(userInput)
  let hasContextReference = false
  let contextReferenceType: 'review' | 'suggestion' | 'task' | 'previous' | 'none' = 'none'
  let contextReferenceTokens: string[] | undefined
  
  if (contextRef.hasReference) {
    hasContextReference = true
    contextReferenceType = contextRef.referenceType
    contextReferenceTokens = contextRef.tokens
    
    const tokenSuffix = contextRef.tokens.length ? `（${contextRef.tokens.join('、')}）` : ''
    
    // 审查引用加分最高
    if (contextRef.referenceType === 'review') {
      complexityScore += 3
      indicators.push(`引用审查结果${tokenSuffix}`)
    } else if (contextRef.referenceType === 'suggestion') {
      complexityScore += 2
      indicators.push(`引用建议/修改${tokenSuffix}`)
    } else if (contextRef.referenceType === 'previous') {
      complexityScore += 1
      indicators.push(`引用之前内容${tokenSuffix}`)
    } else if (contextRef.referenceType === 'task') {
      complexityScore += 1.5
      indicators.push(`引用任务计划${tokenSuffix}`)
    }
    
    logger.info('[COMPLEXITY] Context reference detected', {
      referenceType: contextRef.referenceType,
      confidence: contextRef.confidence,
      tokens: contextRef.tokens
    })
  }
  
  // 计算最终复杂度
  let complexity: TaskComplexity
  let needsPlanning: boolean
  let suggestedStepCount: number | undefined
  
  if (complexityScore >= 5) {
    complexity = 'complex'
    needsPlanning = true
    suggestedStepCount = Math.min(Math.ceil(complexityScore / 2) + 2, 8)
  } else if (complexityScore >= 2) {
    complexity = 'moderate'
    needsPlanning = complexityScore >= 3 // 中等复杂度，3分以上才规划
    suggestedStepCount = needsPlanning ? Math.min(complexityScore + 1, 5) : undefined
  } else {
    complexity = 'simple'
    needsPlanning = false
  }
  
  // 🆕 如果检测到上下文引用，即使复杂度较低也应该触发任务规划
  if (hasContextReference && contextReferenceType === 'review' && !needsPlanning) {
    needsPlanning = true
    complexity = 'moderate'
    suggestedStepCount = suggestedStepCount || 3
    indicators.push('上下文引用触发任务规划')
  }
  
  // 计算置信度
  const confidence = Math.min(0.5 + complexityScore * 0.1, 0.95)
  
  const result: ComplexityResult = {
    complexity,
    needsPlanning,
    indicators,
    suggestedStepCount,
    confidence,
    hasContextReference,
    contextReferenceType,
    contextReferenceTokens
  }
  
  logger.info('[COMPLEXITY] Task complexity detected', {
    input: input.substring(0, 50),
    complexityScore,
    result
  })
  
  return result
}

/**
 * 生成任务规划提示词
 * 
 * 当检测到复杂任务时，使用此提示词让 AI 生成任务计划
 * 
 * @param userRequest 用户请求
 * @param documentContext 文档上下文
 * @param suggestedStepCount 建议的步骤数
 * @param reviewHistory 🆕 审查历史（如果有）
 */
export function getTaskPlanningPrompt(
  userRequest: string,
  documentContext?: string,
  suggestedStepCount?: number,
  reviewHistory?: ReviewResult | ReviewResult[],
  formattedContext?: string
): string {
  const stepRange = suggestedStepCount 
    ? `${Math.max(2, suggestedStepCount - 1)}-${Math.min(suggestedStepCount + 2, 8)}`
    : '3-6'
  
  // 🆕 构建审查历史部分
  let reviewSection = ''
  const reviewList = reviewHistory
    ? Array.isArray(reviewHistory) ? reviewHistory : [reviewHistory]
    : []

  if (reviewList.length > 0) {
    reviewSection = '\n【之前的审查发现了以下问题】\n'
    reviewList.forEach((history, historyIndex) => {
      if (!history?.issues?.length) return
      if (reviewList.length > 1) {
        reviewSection += `审查记录 ${historyIndex + 1}（${history.type}）：\n`
      }
      history.issues.forEach((issue, issueIndex) => {
        const displayIndex = issue.index ?? issueIndex + 1
        let line = `${displayIndex}. ${issue.issue}`
        if (issue.location) {
          line += ` (位置: ${issue.location})`
        }
        if (issue.suggestion) {
          line += ` → 建议: ${issue.suggestion}`
        }
        reviewSection += `${line}\n`
      })
    })
    reviewSection += '\n请根据这些审查结果生成具体的修改步骤，使每个问题都能被落实或验证。\n\n'
  }

  const contextSection = formattedContext
    ? `【历史上下文】\n${formattedContext}\n\n`
    : ''
  
  return `你是一个专业的文档编辑助手。用户提出了一个需要多步骤处理的复杂任务。

请分析用户的请求，将任务拆分为可执行的步骤列表。

【用户请求】
${userRequest}

${documentContext ? `【当前文档摘要】\n${documentContext.substring(0, 800)}\n\n` : ''}${reviewSection}${contextSection}
请以 JSON 格式返回任务计划：
\`\`\`json
{
  "title": "任务标题（简短描述，10字以内）",
  "steps": [
    {
      "description": "步骤描述（清晰具体）",
      "tools": ["可能用到的工具"]
    }
  ]
}
\`\`\`

【要求】
1. 步骤数量控制在 ${stepRange} 个
2. 每个步骤独立可执行、可验证
3. 按合理执行顺序排列
4. 步骤描述简洁明了
5. 不要包含"分析"或"理解"这类非执行步骤${reviewList.length > 0 ? '\n6. 必须涵盖审查发现的所有问题，并在步骤描述中点明对应的问题' : ''}`
}

/**
 * 🆕 检测上下文引用（导出供其他模块使用）
 */
export { detectContextReference }

/**
 * 🆕 检测是否是纯查询意图（导出供其他模块使用）
 */
export { isQueryOnlyIntent }

export default {
  detectTaskComplexity,
  getTaskPlanningPrompt,
  detectContextReference,
  isQueryOnlyIntent
}
