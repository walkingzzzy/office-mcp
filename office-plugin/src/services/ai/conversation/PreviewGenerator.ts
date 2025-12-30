/**
 * 操作预览生成器
 * 
 * 为用户生成操作预览，让用户在执行前了解将要发生的变化
 * 支持文本差异展示、格式变化预览等
 */

import Logger from '../../../utils/logger'
import type { TaskStep, TaskPlan } from './ConversationState'

const logger = new Logger('PreviewGenerator')

/**
 * 预览类型
 */
export type PreviewType = 
  | 'text_change'      // 文本内容变化
  | 'format_change'    // 格式变化（字体、颜色等）
  | 'structure_change' // 结构变化（添加/删除段落等）
  | 'data_change'      // 数据变化（排序、计算等）
  | 'mixed'            // 混合变化

/**
 * 风险等级
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

/**
 * 文本差异项
 */
export interface TextDiff {
  /** 差异类型 */
  type: 'add' | 'remove' | 'modify' | 'unchanged'
  /** 原始文本 */
  original?: string
  /** 修改后文本 */
  modified?: string
  /** 行号 */
  lineNumber?: number
  /** 段落索引 */
  paragraphIndex?: number
}

/**
 * 格式变化项
 */
export interface FormatChange {
  /** 变化类型 */
  type: 'font' | 'color' | 'size' | 'alignment' | 'spacing' | 'style'
  /** 属性名称 */
  property: string
  /** 原始值 */
  originalValue?: string | number
  /** 新值 */
  newValue: string | number
  /** 影响范围描述 */
  scope: string
}

/**
 * 操作预览
 */
export interface OperationPreview {
  /** 预览 ID */
  id: string
  /** 操作描述 */
  description: string
  /** 预览类型 */
  type: PreviewType
  /** 工具名称 */
  toolName: string
  /** 工具参数 */
  toolArgs: Record<string, any>
  /** 风险等级 */
  riskLevel: RiskLevel
  /** 是否可撤销 */
  canUndo: boolean
  /** 预估执行时间 (毫秒) */
  estimatedTime: number
  /** 文本差异（如果有） */
  textDiffs?: TextDiff[]
  /** 格式变化（如果有） */
  formatChanges?: FormatChange[]
  /** 影响范围描述 */
  affectedScope: string
  /** 警告信息 */
  warnings?: string[]
  /** 需要用户确认 */
  requiresConfirmation: boolean
}

/**
 * 计划预览
 */
export interface PlanPreview {
  /** 计划 ID */
  planId: string
  /** 计划标题 */
  title: string
  /** 总体描述 */
  description: string
  /** 步骤预览列表 */
  stepPreviews: OperationPreview[]
  /** 总体风险评估 */
  overallRisk: RiskLevel
  /** 预估总时间 */
  totalEstimatedTime: number
  /** 可撤销的步骤数 */
  undoableSteps: number
  /** 需要确认的步骤数 */
  confirmationRequired: number
  /** 总体警告 */
  warnings: string[]
}

/**
 * 工具风险配置
 */
const TOOL_RISK_CONFIG: Record<string, { risk: RiskLevel; canUndo: boolean; type: PreviewType }> = {
  // 低风险 - 格式变化
  'word_set_font_color': { risk: 'low', canUndo: true, type: 'format_change' },
  'word_set_font_size': { risk: 'low', canUndo: true, type: 'format_change' },
  'word_set_font': { risk: 'low', canUndo: true, type: 'format_change' },
  'word_set_bold': { risk: 'low', canUndo: true, type: 'format_change' },
  'word_set_italic': { risk: 'low', canUndo: true, type: 'format_change' },
  'word_set_underline': { risk: 'low', canUndo: true, type: 'format_change' },
  'word_set_highlight': { risk: 'low', canUndo: true, type: 'format_change' },
  'word_set_paragraph_alignment': { risk: 'low', canUndo: true, type: 'format_change' },
  'word_set_paragraph_spacing': { risk: 'low', canUndo: true, type: 'format_change' },
  'word_set_line_spacing': { risk: 'low', canUndo: true, type: 'format_change' },
  'word_apply_style': { risk: 'low', canUndo: true, type: 'format_change' },
  
  // 中等风险 - 结构变化
  'word_set_heading': { risk: 'medium', canUndo: true, type: 'structure_change' },
  'word_insert_toc': { risk: 'medium', canUndo: true, type: 'structure_change' },
  'word_add_page_numbers': { risk: 'medium', canUndo: true, type: 'structure_change' },
  'word_set_header_footer': { risk: 'medium', canUndo: true, type: 'structure_change' },
  'word_insert_horizontal_line': { risk: 'medium', canUndo: true, type: 'structure_change' },
  'word_insert_image': { risk: 'medium', canUndo: true, type: 'structure_change' },
  'word_insert_table': { risk: 'medium', canUndo: true, type: 'structure_change' },
  
  // 数据操作
  'excel_sort_range': { risk: 'medium', canUndo: true, type: 'data_change' },
  'excel_filter_data': { risk: 'low', canUndo: true, type: 'data_change' },
  'excel_set_formula': { risk: 'medium', canUndo: true, type: 'data_change' },
  'excel_format_cells': { risk: 'low', canUndo: true, type: 'format_change' },
  'excel_create_chart': { risk: 'medium', canUndo: true, type: 'structure_change' },
  
  // 高风险 - 内容删除/替换
  'word_delete_paragraph': { risk: 'high', canUndo: true, type: 'text_change' },
  'word_find_replace': { risk: 'high', canUndo: true, type: 'text_change' },
  'word_clear_formatting': { risk: 'high', canUndo: true, type: 'format_change' },
  'excel_remove_duplicates': { risk: 'high', canUndo: false, type: 'data_change' },
  'excel_delete_rows': { risk: 'high', canUndo: true, type: 'data_change' },
  
  // 关键风险 - 不可逆操作
  'word_insert_cover_page': { risk: 'critical', canUndo: false, type: 'structure_change' }
}

/**
 * 预览生成器类
 */
export class PreviewGenerator {
  /**
   * 为单个操作生成预览
   */
  generateOperationPreview(
    toolName: string,
    toolArgs: Record<string, any>,
    description?: string
  ): OperationPreview {
    const config = TOOL_RISK_CONFIG[toolName] || { risk: 'medium', canUndo: true, type: 'mixed' }
    
    const preview: OperationPreview = {
      id: `preview-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      description: description || this.generateDescription(toolName, toolArgs),
      type: config.type,
      toolName,
      toolArgs,
      riskLevel: config.risk,
      canUndo: config.canUndo,
      estimatedTime: this.estimateExecutionTime(toolName),
      affectedScope: this.determineScope(toolName, toolArgs),
      warnings: this.generateWarnings(toolName, toolArgs, config.risk),
      requiresConfirmation: config.risk === 'high' || config.risk === 'critical'
    }

    // 生成格式变化预览
    if (config.type === 'format_change') {
      preview.formatChanges = this.generateFormatChanges(toolName, toolArgs)
    }

    logger.debug('[PreviewGenerator] Generated operation preview', {
      toolName,
      riskLevel: preview.riskLevel,
      requiresConfirmation: preview.requiresConfirmation
    })

    return preview
  }

  /**
   * 为任务计划生成预览
   */
  generatePlanPreview(plan: TaskPlan): PlanPreview {
    const stepPreviews = plan.steps.map(step => 
      this.generateOperationPreview(step.toolName, step.toolArgs, step.description)
    )

    const overallRisk = this.calculateOverallRisk(stepPreviews)
    const warnings = this.aggregateWarnings(stepPreviews)

    const preview: PlanPreview = {
      planId: plan.id,
      title: plan.title,
      description: plan.description,
      stepPreviews,
      overallRisk,
      totalEstimatedTime: stepPreviews.reduce((sum, p) => sum + p.estimatedTime, 0),
      undoableSteps: stepPreviews.filter(p => p.canUndo).length,
      confirmationRequired: stepPreviews.filter(p => p.requiresConfirmation).length,
      warnings
    }

    logger.info('[PreviewGenerator] Generated plan preview', {
      planId: plan.id,
      stepCount: stepPreviews.length,
      overallRisk,
      confirmationRequired: preview.confirmationRequired
    })

    return preview
  }

  /**
   * 生成操作描述
   */
  private generateDescription(toolName: string, toolArgs: Record<string, any>): string {
    const descriptions: Record<string, (args: Record<string, any>) => string> = {
      'word_set_font_color': (args) => `将文字颜色设置为 ${args.color || '指定颜色'}`,
      'word_set_font_size': (args) => `将字号设置为 ${args.size || '指定字号'}`,
      'word_set_font': (args) => `将字体设置为 ${args.name || '指定字体'}`,
      'word_set_bold': () => '设置文字加粗',
      'word_set_italic': () => '设置文字斜体',
      'word_set_underline': () => '设置文字下划线',
      'word_set_paragraph_alignment': (args) => `设置段落${this.getAlignmentName(args.alignment)}对齐`,
      'word_set_paragraph_spacing': (args) => `调整段落间距`,
      'word_apply_style': (args) => `应用样式: ${args.styleName || '指定样式'}`,
      'word_set_heading': (args) => `设置为 ${args.level || 1} 级标题`,
      'word_insert_toc': () => '插入目录',
      'word_add_page_numbers': (args) => `添加页码 (${args.position || '底部'})`,
      'word_find_replace': (args) => `将 "${args.find}" 替换为 "${args.replace}"`,
      'word_delete_paragraph': (args) => `删除第 ${args.paragraphIndex || 1} 段`,
      'excel_sort_range': (args) => `按 ${args.column || '指定列'} 排序`,
      'excel_set_formula': (args) => `添加公式计算`,
      'excel_format_cells': () => '格式化单元格',
      'excel_create_chart': (args) => `创建${args.type || ''}图表`
    }

    const generator = descriptions[toolName]
    return generator ? generator(toolArgs) : `执行 ${toolName}`
  }

  /**
   * 获取对齐方式名称
   */
  private getAlignmentName(alignment: string): string {
    const names: Record<string, string> = {
      'left': '左',
      'center': '居中',
      'right': '右',
      'justify': '两端'
    }
    return names[alignment] || alignment
  }

  /**
   * 估算执行时间
   */
  private estimateExecutionTime(toolName: string): number {
    const times: Record<string, number> = {
      'word_set_font_color': 1000,
      'word_set_font_size': 1000,
      'word_set_bold': 800,
      'word_set_paragraph_alignment': 1000,
      'word_apply_style': 1500,
      'word_insert_toc': 3000,
      'word_add_page_numbers': 2000,
      'word_find_replace': 2500,
      'excel_sort_range': 2000,
      'excel_create_chart': 3500
    }
    return times[toolName] || 1500
  }

  /**
   * 确定影响范围
   */
  private determineScope(toolName: string, toolArgs: Record<string, any>): string {
    if (toolArgs.selection || toolArgs.range) {
      return '选中区域'
    }
    if (toolArgs.paragraphIndex !== undefined) {
      return `第 ${toolArgs.paragraphIndex + 1} 段`
    }
    if (toolName.startsWith('excel_')) {
      return toolArgs.range || '当前工作表'
    }
    return '整个文档'
  }

  /**
   * 生成警告信息
   */
  private generateWarnings(
    toolName: string, 
    toolArgs: Record<string, any>,
    riskLevel: RiskLevel
  ): string[] {
    const warnings: string[] = []

    if (riskLevel === 'high') {
      warnings.push('此操作风险较高，请仔细确认')
    }

    if (riskLevel === 'critical') {
      warnings.push('⚠️ 此操作可能无法完全撤销')
    }

    if (toolName === 'word_find_replace' && !toolArgs.matchCase) {
      warnings.push('替换将不区分大小写')
    }

    if (toolName === 'excel_remove_duplicates') {
      warnings.push('删除重复项后无法自动恢复')
    }

    if (toolName === 'word_clear_formatting') {
      warnings.push('将清除所有格式设置')
    }

    return warnings
  }

  /**
   * 生成格式变化列表
   */
  private generateFormatChanges(
    toolName: string,
    toolArgs: Record<string, any>
  ): FormatChange[] {
    const changes: FormatChange[] = []

    if (toolName === 'word_set_font_color' && toolArgs.color) {
      changes.push({
        type: 'color',
        property: '文字颜色',
        newValue: toolArgs.color,
        scope: this.determineScope(toolName, toolArgs)
      })
    }

    if (toolName === 'word_set_font_size' && toolArgs.size) {
      changes.push({
        type: 'size',
        property: '字号',
        newValue: toolArgs.size,
        scope: this.determineScope(toolName, toolArgs)
      })
    }

    if (toolName === 'word_set_font' && toolArgs.name) {
      changes.push({
        type: 'font',
        property: '字体',
        newValue: toolArgs.name,
        scope: this.determineScope(toolName, toolArgs)
      })
    }

    if (toolName === 'word_set_paragraph_alignment' && toolArgs.alignment) {
      changes.push({
        type: 'alignment',
        property: '对齐方式',
        newValue: this.getAlignmentName(toolArgs.alignment),
        scope: this.determineScope(toolName, toolArgs)
      })
    }

    return changes
  }

  /**
   * 计算总体风险等级
   */
  private calculateOverallRisk(previews: OperationPreview[]): RiskLevel {
    const riskOrder: RiskLevel[] = ['low', 'medium', 'high', 'critical']
    let maxRiskIndex = 0

    for (const preview of previews) {
      const index = riskOrder.indexOf(preview.riskLevel)
      if (index > maxRiskIndex) {
        maxRiskIndex = index
      }
    }

    // 如果有多个高风险操作，提升为 critical
    const highRiskCount = previews.filter(p => p.riskLevel === 'high').length
    if (highRiskCount >= 3) {
      return 'critical'
    }

    return riskOrder[maxRiskIndex]
  }

  /**
   * 聚合所有警告
   */
  private aggregateWarnings(previews: OperationPreview[]): string[] {
    const allWarnings: string[] = []
    const seenWarnings = new Set<string>()

    for (const preview of previews) {
      for (const warning of preview.warnings || []) {
        if (!seenWarnings.has(warning)) {
          seenWarnings.add(warning)
          allWarnings.push(warning)
        }
      }
    }

    // 添加汇总警告
    const criticalCount = previews.filter(p => p.riskLevel === 'critical').length
    const highCount = previews.filter(p => p.riskLevel === 'high').length
    const nonUndoableCount = previews.filter(p => !p.canUndo).length

    if (criticalCount > 0) {
      allWarnings.unshift(`包含 ${criticalCount} 个关键风险操作`)
    }
    if (highCount > 0) {
      allWarnings.unshift(`包含 ${highCount} 个高风险操作`)
    }
    if (nonUndoableCount > 0) {
      allWarnings.unshift(`有 ${nonUndoableCount} 个操作无法撤销`)
    }

    return allWarnings
  }
}

// 导出单例
export const previewGenerator = new PreviewGenerator()
