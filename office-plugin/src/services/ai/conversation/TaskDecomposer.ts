/**
 * 任务分解器
 * 
 * 将复杂任务分解为可执行的步骤序列
 * 参考 LangGraph Plan-and-Execute 模式
 */

import Logger from '../../../utils/logger'
import {
  TaskPlan,
  TaskStep,
  createTaskPlan,
  createTaskStep
} from './ConversationState'
import type { ReviewResult, ReviewIssue } from './ReviewContextExtractor'

const logger = new Logger('TaskDecomposer')

/**
 * 任务模板接口
 */
interface TaskTemplate {
  /** 模板名称 */
  name: string
  /** 匹配关键词 */
  keywords: string[]
  /** 模板描述 */
  description: string
  /** 步骤模板 */
  steps: Array<{
    description: string
    toolName: string
    toolArgsTemplate: Record<string, unknown>
    riskLevel?: 'low' | 'medium' | 'high'
    needsConfirmation?: boolean
    estimatedTime?: number
  }>
}

/**
 * 预定义的任务模板
 * 针对教师用户的常见复杂任务
 */
const TASK_TEMPLATES: TaskTemplate[] = [
  // ==================== 文档格式化模板 ====================
  {
    name: '文档全面整理',
    keywords: ['整理文档', '格式化文档', '全面整理', '整理一下'],
    description: '对文档进行全面的格式整理',
    steps: [
      {
        description: '统一标题样式',
        toolName: 'word_apply_style',
        toolArgsTemplate: { styleName: 'Heading 1' },
        riskLevel: 'low',
        estimatedTime: 2000
      },
      {
        description: '调整段落间距',
        toolName: 'word_set_paragraph_spacing',
        toolArgsTemplate: { beforeSpacing: 6, afterSpacing: 6 },
        riskLevel: 'low',
        estimatedTime: 1500
      },
      {
        description: '统一字体格式',
        toolName: 'word_set_font',
        toolArgsTemplate: { name: '微软雅黑', size: 12 },
        riskLevel: 'low',
        estimatedTime: 2000
      },
      {
        description: '调整页边距',
        toolName: 'word_set_page_margins',
        toolArgsTemplate: { top: 2.54, bottom: 2.54, left: 3.17, right: 3.17 },
        riskLevel: 'low',
        estimatedTime: 1000
      }
    ]
  },

  // ==================== 成绩表处理模板 ====================
  {
    name: '成绩表处理',
    keywords: ['成绩表', '学生成绩', '成绩排序', '成绩统计'],
    description: '处理学生成绩表格',
    steps: [
      {
        description: '按成绩排序',
        toolName: 'excel_sort_range',
        toolArgsTemplate: { column: 'B', ascending: false },
        riskLevel: 'medium',
        needsConfirmation: true,
        estimatedTime: 3000
      },
      {
        description: '添加平均分计算',
        toolName: 'excel_set_formula',
        toolArgsTemplate: { formula: 'AVERAGE' },
        riskLevel: 'low',
        estimatedTime: 2000
      },
      {
        description: '添加最高/最低分',
        toolName: 'excel_set_formula',
        toolArgsTemplate: { formula: 'MAX,MIN' },
        riskLevel: 'low',
        estimatedTime: 2000
      },
      {
        description: '美化表格样式',
        toolName: 'excel_format_cells',
        toolArgsTemplate: { style: 'professional' },
        riskLevel: 'low',
        estimatedTime: 2000
      }
    ]
  },

  // ==================== 教案制作模板 ====================
  {
    name: '教案格式化',
    keywords: ['教案', '课件', '讲义', '备课'],
    description: '格式化教案文档',
    steps: [
      {
        description: '设置标题层级',
        toolName: 'word_set_heading',
        toolArgsTemplate: { level: 1 },
        riskLevel: 'low',
        estimatedTime: 2000
      },
      {
        description: '添加页码',
        toolName: 'word_add_page_numbers',
        toolArgsTemplate: { position: 'bottom', alignment: 'center' },
        riskLevel: 'low',
        estimatedTime: 1500
      },
      {
        description: '生成目录',
        toolName: 'word_insert_toc',
        toolArgsTemplate: {},
        riskLevel: 'medium',
        needsConfirmation: true,
        estimatedTime: 3000
      },
      {
        description: '统一段落格式',
        toolName: 'word_set_paragraph_alignment',
        toolArgsTemplate: { alignment: 'justify' },
        riskLevel: 'low',
        estimatedTime: 1500
      }
    ]
  },

  // ==================== 报告美化模板 ====================
  {
    name: '报告美化',
    keywords: ['报告', '美化报告', '专业报告', '工作报告'],
    description: '美化专业报告文档',
    steps: [
      {
        description: '应用专业主题',
        toolName: 'word_apply_style',
        toolArgsTemplate: { styleName: 'Professional' },
        riskLevel: 'low',
        estimatedTime: 2000
      },
      {
        description: '设置页眉页脚',
        toolName: 'word_set_header_footer',
        toolArgsTemplate: { includeDate: true, includePageNumber: true },
        riskLevel: 'low',
        estimatedTime: 2000
      },
      {
        description: '调整图片布局',
        toolName: 'word_set_image_position',
        toolArgsTemplate: { imageIndex: 0, positionType: 'inline', alignment: 'center' },
        riskLevel: 'medium',
        estimatedTime: 3000
      },
      {
        description: '添加封面',
        toolName: 'word_insert_cover_page',
        toolArgsTemplate: { template: 'professional' },
        riskLevel: 'medium',
        needsConfirmation: true,
        estimatedTime: 3000
      }
    ]
  },

  // ==================== 简历制作模板 ====================
  {
    name: '简历制作',
    keywords: ['简历', '制作简历', '个人简历', 'resume'],
    description: '创建专业简历',
    steps: [
      {
        description: '设置页面布局',
        toolName: 'word_set_page_margins',
        toolArgsTemplate: { top: 1.27, bottom: 1.27, left: 1.27, right: 1.27 },
        riskLevel: 'low',
        estimatedTime: 1000
      },
      {
        description: '设置个人信息区域',
        toolName: 'word_apply_style',
        toolArgsTemplate: { styleName: 'Title' },
        riskLevel: 'low',
        estimatedTime: 1500
      },
      {
        description: '添加分隔线',
        toolName: 'word_insert_horizontal_line',
        toolArgsTemplate: {},
        riskLevel: 'low',
        estimatedTime: 1000
      },
      {
        description: '格式化各部分标题',
        toolName: 'word_set_heading',
        toolArgsTemplate: { level: 2 },
        riskLevel: 'low',
        estimatedTime: 2000
      }
    ]
  }
]

/**
 * 动态任务分解配置
 */
interface DecomposeOptions {
  /** 最大步骤数 */
  maxSteps?: number
  /** 是否需要用户确认每一步 */
  requireStepConfirmation?: boolean
  /** 用户偏好 */
  userPreferences?: Record<string, unknown>
}

/**
 * 任务分解器类
 */
export class TaskDecomposer {
  /**
   * 分解任务为可执行步骤
   */
  decompose(
    userIntent: string,
    options: DecomposeOptions = {}
  ): TaskPlan | null {
    const { maxSteps = 10, requireStepConfirmation = false } = options

    // 查找匹配的模板
    const template = this.findMatchingTemplate(userIntent)

    if (template) {
      logger.info('[TaskDecomposer] Found matching template', {
        templateName: template.name,
        stepCount: template.steps.length,
        userIntent: userIntent.substring(0, 50)
      })

      return this.createPlanFromTemplate(template, userIntent, requireStepConfirmation)
    }

    // 尝试动态分解
    const dynamicPlan = this.dynamicDecompose(userIntent, maxSteps)
    if (dynamicPlan) {
      logger.info('[TaskDecomposer] Created dynamic plan', {
        stepCount: dynamicPlan.steps.length,
        userIntent: userIntent.substring(0, 50)
      })
      return dynamicPlan
    }

    logger.info('[TaskDecomposer] Could not decompose task', {
      userIntent: userIntent.substring(0, 50)
    })

    return null
  }

  /**
   * 查找匹配的任务模板
   */
  private findMatchingTemplate(userIntent: string): TaskTemplate | null {
    const lowerIntent = userIntent.toLowerCase()

    for (const template of TASK_TEMPLATES) {
      if (template.keywords.some(keyword => lowerIntent.includes(keyword))) {
        return template
      }
    }

    return null
  }

  /**
   * 从模板创建任务计划
   */
  private createPlanFromTemplate(
    template: TaskTemplate,
    userIntent: string,
    requireStepConfirmation: boolean
  ): TaskPlan {
    const steps = template.steps.map((stepTemplate, index) => ({
      description: stepTemplate.description,
      toolName: stepTemplate.toolName,
      toolArgs: { ...stepTemplate.toolArgsTemplate },
      riskLevel: stepTemplate.riskLevel,
      needsConfirmation: requireStepConfirmation || stepTemplate.needsConfirmation,
      estimatedTime: stepTemplate.estimatedTime
    }))

    return createTaskPlan(template.name, userIntent, steps)
  }

  /**
   * 动态分解任务（基于关键词分析）
   */
  private dynamicDecompose(userIntent: string, maxSteps: number): TaskPlan | null {
    const steps: Array<{
      description: string
      toolName: string
      toolArgs: Record<string, unknown>
      riskLevel?: 'low' | 'medium' | 'high'
      needsConfirmation?: boolean
      estimatedTime?: number
    }> = []

    const lowerIntent = userIntent.toLowerCase()

    // 分析意图中的动作词
    const actionAnalysis = this.analyzeActions(lowerIntent)

    // 根据分析结果生成步骤
    for (const action of actionAnalysis) {
      if (steps.length >= maxSteps) break

      steps.push({
        description: action.description,
        toolName: action.toolName,
        toolArgs: action.defaultArgs,
        riskLevel: action.riskLevel,
        estimatedTime: action.estimatedTime
      })
    }

    if (steps.length === 0) {
      return null
    }

    return createTaskPlan('动态任务计划', userIntent, steps)
  }

  /**
   * 分析意图中的动作
   */
  private analyzeActions(intent: string): Array<{
    description: string
    toolName: string
    defaultArgs: Record<string, unknown>
    riskLevel: 'low' | 'medium' | 'high'
    estimatedTime: number
  }> {
    const actions: Array<{
      description: string
      toolName: string
      defaultArgs: Record<string, unknown>
      riskLevel: 'low' | 'medium' | 'high'
      estimatedTime: number
    }> = []

    // 格式化相关
    if (intent.includes('格式') || intent.includes('美化') || intent.includes('排版')) {
      actions.push({
        description: '统一文档格式',
        toolName: 'word_apply_style',
        defaultArgs: { styleName: 'Normal' },
        riskLevel: 'low',
        estimatedTime: 2000
      })
    }

    // 字体相关
    if (intent.includes('字体') || intent.includes('字号')) {
      actions.push({
        description: '设置字体样式',
        toolName: 'word_set_font',
        defaultArgs: { name: '微软雅黑' },
        riskLevel: 'low',
        estimatedTime: 1500
      })
    }

    // 颜色相关
    if (intent.includes('颜色') || intent.includes('红') || intent.includes('蓝') || intent.includes('绿')) {
      actions.push({
        description: '设置文字颜色',
        toolName: 'word_set_font_color',
        defaultArgs: {},
        riskLevel: 'low',
        estimatedTime: 1000
      })
    }

    // 对齐相关
    if (intent.includes('居中') || intent.includes('对齐')) {
      actions.push({
        description: '调整文本对齐',
        toolName: 'word_set_paragraph_alignment',
        defaultArgs: { alignment: 'center' },
        riskLevel: 'low',
        estimatedTime: 1000
      })
    }

    // 间距相关
    if (intent.includes('间距') || intent.includes('行距')) {
      actions.push({
        description: '调整段落间距',
        toolName: 'word_set_paragraph_spacing',
        defaultArgs: {},
        riskLevel: 'low',
        estimatedTime: 1500
      })
    }

    // 排序相关
    if (intent.includes('排序') || intent.includes('排列')) {
      actions.push({
        description: '数据排序',
        toolName: 'excel_sort_range',
        defaultArgs: {},
        riskLevel: 'medium',
        estimatedTime: 2000
      })
    }

    // 图表相关
    if (intent.includes('图表') || intent.includes('柱状图') || intent.includes('饼图')) {
      actions.push({
        description: '创建图表',
        toolName: 'excel_create_chart',
        defaultArgs: {},
        riskLevel: 'medium',
        estimatedTime: 3000
      })
    }

    // 目录相关
    if (intent.includes('目录') || intent.includes('大纲')) {
      actions.push({
        description: '生成目录',
        toolName: 'word_insert_toc',
        defaultArgs: {},
        riskLevel: 'medium',
        estimatedTime: 2500
      })
    }

    // 页码相关
    if (intent.includes('页码') || intent.includes('页号')) {
      actions.push({
        description: '添加页码',
        toolName: 'word_add_page_numbers',
        defaultArgs: { position: 'bottom' },
        riskLevel: 'low',
        estimatedTime: 1500
      })
    }

    return actions
  }

  /**
   * 检查是否可以分解
   */
  canDecompose(userIntent: string): boolean {
    // 检查是否匹配模板
    if (this.findMatchingTemplate(userIntent)) {
      return true
    }

    // 检查是否包含可分解的动作词
    const actionKeywords = [
      '整理', '美化', '格式', '排版', '排序', '统计',
      '制作', '创建', '生成', '添加', '设置'
    ]

    const lowerIntent = userIntent.toLowerCase()
    const hasActionKeyword = actionKeywords.some(k => lowerIntent.includes(k))
    
    // 任务长度超过一定阈值也认为是复杂任务
    const isLongTask = userIntent.length > 30

    return hasActionKeyword || isLongTask
  }

  /**
   * 获取可用的任务模板列表
   */
  getAvailableTemplates(): Array<{ name: string; description: string; keywords: string[] }> {
    return TASK_TEMPLATES.map(t => ({
      name: t.name,
      description: t.description,
      keywords: t.keywords
    }))
  }

  /**
   * 估算任务总时间
   */
  estimateTotalTime(plan: TaskPlan): number {
    return plan.steps.reduce((total, step) => total + (step.estimatedTime || 2000), 0)
  }

  /**
   * 从审查结果生成任务计划
   * 
   * 将审查发现的问题转换为可执行的修改步骤
   * 
   * 🆕 优化：如果用户意图是纯查询（只想了解问题，不想执行修改），则不生成任务计划
   */
  decomposeFromReviewResults(
    reviewResult: ReviewResult,
    userIntent: string
  ): TaskPlan | null {
    // 🆕 检查是否是纯查询意图（只想了解问题，不想执行修改）
    if (this.isQueryOnlyRequest(userIntent)) {
      logger.info('[TaskDecomposer] Query-only request detected, skipping task decomposition', {
        userIntent: userIntent.substring(0, 50)
      })
      return null
    }
    
    if (!reviewResult.issues || reviewResult.issues.length === 0) {
      logger.warn('[TaskDecomposer] No issues found in review result')
      return null
    }

    const steps: Array<{
      description: string
      toolName?: string
      toolArgs?: Record<string, any>
      expectedTools?: string[]
      riskLevel?: 'low' | 'medium' | 'high'
      needsConfirmation?: boolean
      estimatedTime?: number
      // 🆕 来源追溯
      sourceIssueId?: string
      sourceIssueText?: string
      issueType?: 'format' | 'content' | 'style' | 'structure' | 'other'
      locationHint?: string
      dependsOn?: string[]
    }> = []

    // 将每个问题转换为修改步骤
    for (const issue of reviewResult.issues) {
      const step = this.createStepFromIssue(issue)
      if (step) {
        steps.push(step)
      }
    }

    if (steps.length === 0) {
      logger.warn('[TaskDecomposer] Could not create any steps from review issues')
      return null
    }

    // 按问题类型排序：结构 > 格式 > 内容 > 其他
    steps.sort((a, b) => {
      const typeOrder: Record<string, number> = {
        structure: 1,
        format: 2,
        content: 3,
        other: 4
      }
      const aOrder = typeOrder[a.issueType || 'other'] || 4
      const bOrder = typeOrder[b.issueType || 'other'] || 4
      return aOrder - bOrder
    })

    // 🆕 计算步骤依赖关系
    this.computeDependencies(steps)

    const planTitle = this.generatePlanTitle(reviewResult)
    // 使用 ConversationState 版本的 createTaskPlan（3 参数版本）
    const plan = createTaskPlan(planTitle, userIntent, steps)

    // 🆕 添加元数据（直接修改 plan 对象）
    plan.source = 'review'
    plan.sourceIssueCount = reviewResult.issues.length
    plan.originalRequest = userIntent

    logger.info('[TaskDecomposer] Created task plan from review results', {
      planId: plan.id,
      stepCount: steps.length,
      issueCount: reviewResult.issues.length,
      reviewType: reviewResult.type
    })

    return plan
  }

  /**
   * 🆕 计算步骤之间的依赖关系
   * 
   * 规则：
   * 1. 结构类步骤（如目录）依赖格式类步骤（如标题样式）
   * 2. 同一位置的步骤按类型优先级串联
   */
  private computeDependencies(steps: Array<{
    sourceIssueId?: string
    issueType?: string
    locationHint?: string
    dependsOn?: string[]
    description?: string
  }>): void {
    // 按类型分组
    const structureSteps = steps.filter(s => s.issueType === 'structure')
    const formatSteps = steps.filter(s => s.issueType === 'format')

    // 目录相关步骤依赖标题样式步骤
    for (const structureStep of structureSteps) {
      if (structureStep.sourceIssueId?.includes('目录') ||
          structureStep.description?.includes('目录')) {
        // 找到所有标题样式相关的格式步骤
        const headingSteps = formatSteps.filter(s =>
          s.sourceIssueId?.includes('标题') ||
          s.description?.includes('标题')
        )
        if (headingSteps.length > 0) {
          structureStep.dependsOn = headingSteps
            .map(s => s.sourceIssueId)
            .filter(Boolean) as string[]
        }
      }
    }
  }

  /**
   * 从单个问题创建修改步骤
   */
  private createStepFromIssue(issue: ReviewIssue): {
    description: string
    toolName?: string
    toolArgs?: Record<string, any>
    expectedTools?: string[]
    riskLevel?: 'low' | 'medium' | 'high'
    needsConfirmation?: boolean
    estimatedTime?: number
    sourceIssueId?: string
    sourceIssueText?: string
    issueType?: 'format' | 'content' | 'style' | 'structure' | 'other'
    locationHint?: string
    dependsOn?: string[]
  } | null {
    const issueText = issue.issue.toLowerCase()

    // 标题格式问题
    if (/标题|章节|大纲/.test(issueText)) {
      const searchText = this.extractSearchTextFromIssue(issue)
      const styleName = this.extractStyleFromIssue(issue) || 'Heading 1'
      
      // 🆕 如果没有明确的目标位置，跳过此步骤（避免把所有段落都设为标题）
      if (!searchText) {
        logger.info('[TaskDecomposer] Skipping style step - no target text found', {
          issue: issue.issue,
          styleName
        })
        return null
      }
      
      return {
        description: `修复: ${issue.issue}`,
        toolName: issue.expectedTools?.[0] || 'word_apply_style',
        expectedTools: issue.expectedTools,
        toolArgs: { styleName, searchText },
        riskLevel: 'low',
        estimatedTime: 2000,
        issueType: 'structure',
        sourceIssueId: `issue-${issue.index}`,
        sourceIssueText: issue.issue,
        locationHint: issue.location
      }
    }

    // 目录问题
    if (/目录/.test(issueText)) {
      if (/页码/.test(issueText)) {
        return {
          description: `修复: ${issue.issue}`,
          toolName: 'word_update_toc',
          expectedTools: ['word_update_toc'],
          toolArgs: { includePageNumbers: true },
          riskLevel: 'medium',
          needsConfirmation: true,
          estimatedTime: 3000,
          issueType: 'structure',
          sourceIssueId: `issue-${issue.index}`,
          sourceIssueText: issue.issue,
          locationHint: issue.location
        }
      }
      return {
        description: `修复: ${issue.issue}`,
        toolName: 'word_insert_toc',
        expectedTools: ['word_insert_toc'],
        toolArgs: {},
        riskLevel: 'medium',
        needsConfirmation: true,
        estimatedTime: 3000,
        issueType: 'structure',
        sourceIssueId: `issue-${issue.index}`,
        sourceIssueText: issue.issue,
        locationHint: issue.location
      }
    }

    // 段落间距问题
    if (/间距|行距/.test(issueText)) {
      const spacing = this.extractSpacingFromIssue(issue)
      return {
        description: `修复: ${issue.issue}`,
        toolName: issue.expectedTools?.[0] || 'word_set_paragraph_spacing',
        expectedTools: issue.expectedTools || ['word_set_paragraph_spacing'],
        toolArgs: spacing,
        riskLevel: 'low',
        estimatedTime: 1500,
        issueType: 'format',
        sourceIssueId: `issue-${issue.index}`,
        sourceIssueText: issue.issue,
        locationHint: issue.location
      }
    }

    // 字体问题
    if (/字体|字号|粗体|斜体/.test(issueText)) {
      const fontSettings = this.extractFontFromIssue(issue)
      return {
        description: `修复: ${issue.issue}`,
        toolName: issue.expectedTools?.[0] || 'word_set_font',
        expectedTools: issue.expectedTools || ['word_set_font'],
        toolArgs: fontSettings,
        riskLevel: 'low',
        estimatedTime: 1500,
        issueType: 'format',
        sourceIssueId: `issue-${issue.index}`,
        sourceIssueText: issue.issue,
        locationHint: issue.location
      }
    }

    // 对齐问题
    if (/对齐|居中|靠左|靠右/.test(issueText)) {
      const alignment = this.extractAlignmentFromIssue(issue)
      return {
        description: `修复: ${issue.issue}`,
        toolName: issue.expectedTools?.[0] || 'word_set_paragraph_alignment',
        expectedTools: issue.expectedTools || ['word_set_paragraph_alignment'],
        toolArgs: { alignment },
        riskLevel: 'low',
        estimatedTime: 1000,
        issueType: 'format',
        sourceIssueId: `issue-${issue.index}`,
        sourceIssueText: issue.issue,
        locationHint: issue.location
      }
    }

    // 格式一致性问题
    if (/格式|样式|不一致/.test(issueText)) {
      const searchText = this.extractSearchTextFromIssue(issue)
      
      // 🆕 如果没有明确的目标位置，跳过此步骤
      if (!searchText) {
        logger.info('[TaskDecomposer] Skipping format step - no target text found', {
          issue: issue.issue
        })
        return null
      }
      
      return {
        description: `修复: ${issue.issue}`,
        toolName: issue.expectedTools?.[0] || 'word_apply_style',
        expectedTools: issue.expectedTools || ['word_apply_style'],
        toolArgs: { styleName: 'Normal', searchText },
        riskLevel: 'low',
        estimatedTime: 2000,
        issueType: 'format',
        sourceIssueId: `issue-${issue.index}`,
        sourceIssueText: issue.issue,
        locationHint: issue.location
      }
    }

    // 页码问题
    if (/页码/.test(issueText)) {
      return {
        description: `修复: ${issue.issue}`,
        toolName: 'word_add_page_numbers',
        expectedTools: ['word_add_page_numbers'],
        toolArgs: { position: 'bottom', alignment: 'center' },
        riskLevel: 'low',
        estimatedTime: 1500,
        issueType: 'structure',
        sourceIssueId: `issue-${issue.index}`,
        sourceIssueText: issue.issue,
        locationHint: issue.location
      }
    }

    // 图片问题
    if (/图片|图表|图示/.test(issueText)) {
      return {
        description: `修复: ${issue.issue}`,
        toolName: issue.expectedTools?.[0] || 'word_set_image_position',
        expectedTools: issue.expectedTools || ['word_set_image_position'],
        toolArgs: { imageIndex: 0, positionType: 'inline', alignment: 'center' },
        riskLevel: 'medium',
        estimatedTime: 2500,
        issueType: 'content',
        sourceIssueId: `issue-${issue.index}`,
        sourceIssueText: issue.issue,
        locationHint: issue.location
      }
    }

    // 表格问题
    if (/表格/.test(issueText)) {
      return {
        description: `修复: ${issue.issue}`,
        toolName: issue.expectedTools?.[0] || 'word_format_table',
        expectedTools: issue.expectedTools || ['word_format_table'],
        toolArgs: {},
        riskLevel: 'medium',
        estimatedTime: 2500,
        issueType: 'content',
        sourceIssueId: `issue-${issue.index}`,
        sourceIssueText: issue.issue,
        locationHint: issue.location
      }
    }

    // 内容/文字问题 - 使用通用的替换工具
    if (/内容|文字|重复|修改|调整/.test(issueText)) {
      const searchText = this.buildSearchText(issue)
      const replaceText = this.buildReplaceText(issue, searchText)
      return {
        description: `修复: ${issue.issue}`,
        toolName: 'word_replace_text',
        expectedTools: ['word_replace_text'],
        toolArgs: {
          searchText,
          replaceText,
          replaceAll: false
        },
        riskLevel: 'medium',
        needsConfirmation: true,
        estimatedTime: 2000,
        issueType: 'content',
        sourceIssueId: `issue-${issue.index}`,
        sourceIssueText: issue.issue,
        locationHint: issue.location
      }
    }

    // 默认情况 - 创建一个通用修改步骤
    const fallbackTool = issue.expectedTools?.[0] || 'word_format_text'
    
    // 🆕 对于需要 searchText 的工具，检查是否有有效的目标
    if (fallbackTool === 'word_format_text') {
      const searchText = this.extractSearchTextFromIssue(issue)
      if (!searchText) {
        logger.info('[TaskDecomposer] Skipping default step - no valid searchText', {
          issue: issue.issue,
          tool: fallbackTool
        })
        return null
      }
      
      return {
        description: `修复: ${issue.issue}`,
        toolName: fallbackTool,
        expectedTools: issue.expectedTools || ['word_format_text'],
        toolArgs: {
          searchText,
          ...this.buildFormatArgs(issue)
        },
        riskLevel: 'low',
        estimatedTime: 2000,
        issueType: 'other',
        sourceIssueId: `issue-${issue.index}`,
        sourceIssueText: issue.issue,
        locationHint: issue.location
      }
    }

    // 其他工具的默认处理
    return {
      description: `修复: ${issue.issue}`,
      toolName: fallbackTool,
      expectedTools: issue.expectedTools || ['word_format_text'],
      toolArgs: {},
      riskLevel: 'low',
      estimatedTime: 2000,
      issueType: 'other',
      sourceIssueId: `issue-${issue.index}`,
      sourceIssueText: issue.issue,
      locationHint: issue.location
    }
  }

  /**
   * 从问题中提取搜索文本（用于定位目标内容）
   */
  private extractSearchTextFromIssue(issue: ReviewIssue): string | null {
    // 优先从引号内容提取
    const quoted = this.extractQuotedSegments(issue)
    if (quoted.length > 0) {
      return quoted[0]
    }
    
    // 从位置描述提取
    if (issue.location) {
      const locationText = this.normalizeSnippet(issue.location)
      if (locationText && locationText.length > 3) {
        return locationText
      }
    }
    
    return null
  }

  /**
   * 从问题中提取样式名称
   */
  private extractStyleFromIssue(issue: ReviewIssue): string | null {
    const text = issue.issue + (issue.suggestion || '')
    
    // 检查常见的中文标题样式
    if (/一级标题|标题1|Heading\s*1/i.test(text)) return 'Heading 1'
    if (/二级标题|标题2|Heading\s*2/i.test(text)) return 'Heading 2'
    if (/三级标题|标题3|Heading\s*3/i.test(text)) return 'Heading 3'
    if (/正文/.test(text)) return 'Normal'
    
    return null
  }

  /**
   * 从问题中提取间距设置
   */
  private extractSpacingFromIssue(issue: ReviewIssue): Record<string, number> {
    const text = issue.issue + (issue.suggestion || '')
    const result: Record<string, number> = {}
    
    // 尝试提取具体数值
    const spacingMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:倍|磅|pt|px)/)
    if (spacingMatch) {
      const value = parseFloat(spacingMatch[1])
      if (/行距/.test(text)) {
        result.lineSpacing = value
      } else {
        result.beforeSpacing = value
        result.afterSpacing = value
      }
    } else {
      // 默认值
      result.beforeSpacing = 6
      result.afterSpacing = 6
    }
    
    return result
  }

  /**
   * 从问题中提取字体设置
   */
  private extractFontFromIssue(issue: ReviewIssue): Record<string, unknown> {
    const text = issue.issue + (issue.suggestion || '')
    const result: Record<string, unknown> = {}

    // 提取字体名称
    const fontMatch = text.match(/(微软雅黑|宋体|黑体|楷体|仿宋|Arial|Times New Roman)/i)
    if (fontMatch) {
      result.name = fontMatch[1]
    }

    // 提取字号
    const sizeMatch = text.match(/(\d+)\s*(?:号|pt|px)/i)
    if (sizeMatch) {
      result.size = parseInt(sizeMatch[1])
    }
    
    // 检查粗体/斜体
    if (/粗体|加粗|bold/i.test(text)) {
      result.bold = true
    }
    if (/斜体|italic/i.test(text)) {
      result.italic = true
    }
    
    return result
  }

  /**
   * 从问题中提取对齐方式
   */
  private extractAlignmentFromIssue(issue: ReviewIssue): string {
    const text = issue.issue + (issue.suggestion || '')
    
    if (/居中|center/i.test(text)) return 'center'
    if (/靠右|右对齐|right/i.test(text)) return 'right'
    if (/两端|justify/i.test(text)) return 'justify'
    
    return 'left'
  }

  /**
   * 提取带引号的关键文本
   */
  private extractQuotedSegments(issue: ReviewIssue): string[] {
    const text = `${issue.issue || ''} ${issue.suggestion || ''}`
    const pattern = /[“"『「']([^“"』「']{1,80})[”"』」']/g
    const segments: string[] = []
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text)) !== null) {
      const normalized = this.normalizeSnippet(match[1])
      if (normalized) {
        segments.push(normalized)
      }
    }
    return segments
  }

  /**
   * 规范化片段文本
   */
  private normalizeSnippet(text?: string | null): string {
    if (!text) return ''
    return text.replace(/\s+/g, ' ').trim().slice(0, 40)
  }

  /**
   * 构造查找文本
   */
  private buildSearchText(issue: ReviewIssue): string {
    const [quoted] = this.extractQuotedSegments(issue)
    if (quoted) return quoted

    const candidates = [
      this.normalizeSnippet(issue.location),
      this.normalizeSnippet(issue.issue),
      this.normalizeSnippet(issue.suggestion)
    ].filter(Boolean)

    return candidates[0] || `问题${issue.index}`
  }

  /**
   * 构造替换文本
   */
  private buildReplaceText(issue: ReviewIssue, searchText: string): string {
    const segments = this.extractQuotedSegments(issue)
    if (segments.length >= 2) {
      return segments[1]
    }

    const combined = `${issue.issue || ''} ${issue.suggestion || ''}`
    const replacePattern = /(?:改为|替换为|换成|调整为)\s*([^\s，。、；：]{1,80})/i
    const match = combined.match(replacePattern)
    if (match) {
      const normalized = this.normalizeSnippet(match[1])
      if (normalized) {
        return normalized
      }
    }

    const suggestion = this.normalizeSnippet(issue.suggestion)
    return suggestion || searchText
  }

  /**
   * 推断格式需求
   */
  private buildFormatArgs(issue: ReviewIssue): Record<string, unknown> {
    const text = `${issue.issue || ''} ${issue.suggestion || ''}`
    const args: Record<string, unknown> = {}

    if (/加粗|粗体|bold/i.test(text)) {
      args.bold = true
    }
    if (/斜体|italic/i.test(text)) {
      args.italic = true
    }
    if (/下划线/.test(text)) {
      args.underline = true
    }
    if (/红色|red/i.test(text)) {
      args.color = 'red'
    } else if (/蓝色|blue/i.test(text)) {
      args.color = 'blue'
    } else if (/绿色|green/i.test(text)) {
      args.color = 'green'
    }

    return args
  }

  /**
   * 生成任务计划标题
   */
  private generatePlanTitle(reviewResult: ReviewResult): string {
    switch (reviewResult.type) {
      case 'format_check':
        return `文档格式修复 (${reviewResult.issues.length} 项)`
      case 'content_analysis':
        return `文档内容修改 (${reviewResult.issues.length} 项)`
      case 'document_review':
        return `文档问题修复 (${reviewResult.issues.length} 项)`
      default:
        return `文档修改任务 (${reviewResult.issues.length} 项)`
    }
  }

  /**
   * 检查是否可以从审查结果分解
   */
  canDecomposeFromReview(reviewResult: ReviewResult | null | undefined): boolean {
    return !!(reviewResult && reviewResult.issues && reviewResult.issues.length > 0)
  }

  /**
   * 🆕 检查是否是纯查询请求（只想了解问题，不想执行修改）
   * 
   * 这个方法用于区分：
   * - "告诉我文档有什么问题" → 纯查询，不应该生成任务计划
   * - "修改文档中的问题" → 执行操作，应该生成任务计划
   * - "根据审查结果修改" → 执行操作，应该生成任务计划
   */
  private isQueryOnlyRequest(userIntent: string): boolean {
    const lowerIntent = userIntent.toLowerCase()
    
    // 查询类关键词模式
    const queryPatterns = [
      // "了解/查看/检查...问题" - 纯查询
      /对.*(进行|做).*(了解|分析|检查|审查)/,
      /告诉我.*(问题|情况|状态|格式|排版)/,
      /(查看|检查|审查|分析).*(问题|情况|状态|格式|排版)/,
      /存在的?(问题|错误|缺陷)/,
      /有(什么|哪些)(问题|错误|需要改进)/,
      /(文档|文件|内容).*(问题|情况|状态)/,
      // 英文查询模式
      /what.*(issues?|problems?|errors?)/i,
      /check.*(for|the).*(issues?|problems?)/i,
      /review.*(the|this).*(document|file)/i,
      /tell me.*(about|what)/i,
      /show me.*(issues?|problems?)/i
    ]
    
    // 执行类关键词（如果包含这些，就不是纯查询）
    const executeKeywords = [
      '修改', '调整', '执行', '应用', '修复', '处理', '更新', '设置',
      '删除', '添加', '插入', '替换', '移除', '改为', '换成', '设为',
      '格式化', '重新排版', '重新整理', '优化', '美化',
      '根据审查', '根据分析', '按照建议', '执行修改', '进行修改',
      '解决', '纠正', '改正', '完善', '整改',  // 🆕 新增解决类关键词
      'modify', 'fix', 'update', 'apply', 'execute', 'change', 'set',
      'delete', 'add', 'insert', 'replace', 'remove', 'format',
      'based on review', 'fix the issues', 'make changes', 'solve', 'resolve'
    ]
    
    // 检查是否匹配查询模式
    const matchesQueryPattern = queryPatterns.some(p => p.test(userIntent))
    
    // 检查是否包含执行关键词
    const hasExecuteKeyword = executeKeywords.some(kw => lowerIntent.includes(kw.toLowerCase()))
    
    // 如果匹配查询模式且不包含执行关键词，则是纯查询
    if (matchesQueryPattern && !hasExecuteKeyword) {
      logger.info('[TaskDecomposer] Detected query-only request', {
        userIntent: userIntent.substring(0, 50),
        matchesQueryPattern,
        hasExecuteKeyword
      })
      return true
    }
    
    return false
  }
}

// 导出单例
export const taskDecomposer = new TaskDecomposer()
