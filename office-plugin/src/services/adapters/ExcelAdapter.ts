/**
 * Excel 应用适配器
 *
 * 实现 Excel 特定的选区检测、文档操作和提示词生成
 *
 * @architecture Core + Adapters 分层架构中的 Excel 适配器
 * - 包含 Excel 特定的 Agent 提示词模板
 * - 实现 Excel 特定的工具过滤逻辑
 * - 提供 Excel 特定的选区检测和文档操作
 */

import type { FormattingFunction, SelectionContext } from '../ai/types'
import { BaseOfficeAppAdapter } from './BaseAdapter'
import type {
  AdapterCreateOptions,
  AgentPromptTemplates,
  ClarificationPolicy,
  DocumentContextInfo,
  PromptContext,
  RetryPromptContext,
  SelectionInfo,
  SelectionType,
  ToolFilterContext
} from './types'

/**
 * Excel Agent 提示词模板（从 AgentPromptManager 迁移）
 */
const EXCEL_AGENT_PROMPTS: AgentPromptTemplates = {
  base: `你是 Excel 电子表格编辑助手。你必须使用工具来完成用户的请求，而不是仅仅描述如何操作。

你可以帮助用户：
- 数据输入和编辑（单元格、区域、公式）
- 数据分析（排序、筛选、透视表、统计）
- 格式化（数字格式、条件格式、样式）
- 图表和可视化（柱状图、折线图、饼图）
- 工作表管理（新建、重命名、复制）`,

  selectionHint: `
【重要】用户可能已在工作表中选中了单元格或区域。

📌 **选区操作规则**：
- 对于格式化操作，可直接应用于当前选区
- excel_set_cell_value: 设置单元格值
- excel_set_range_values: 批量设置区域值
- excel_set_font/fill_color/border: 格式化操作`,

  toolGuide: `
📋 **常用工具**：
- excel_set_cell_value: 设置单元格值（address: "A1" 格式）
- excel_set_range_values: 批量设置区域
- excel_set_formula: 设置公式
- excel_insert_row/column: 插入行/列
- excel_sort_range: 排序
- excel_filter_range: 筛选
- excel_insert_chart: 插入图表

📍 **单元格地址格式**：
- 单个单元格: "A1", "B2"
- 区域: "A1:C10"
- 整列: "A:A"
- 整行: "1:1"`,

  selectionTypePrompts: {
    text: '用户当前选中了单元格。',
    image: '用户当前选中了图表，请使用图表相关工具进行操作。',
    table: '用户当前选中了表格区域，可以进行数据分析和格式化操作。'
  },

  scenarioPrompts: {
    education: `
【教育场景专用功能】
- 成绩统计：班级平均分、排名、分数段分布
- 考勤管理：签到记录、出勤率统计
- 数据可视化：成绩趋势图、班级对比图`
  }
}

/**
 * Excel 关键词到工具映射
 */
const EXCEL_KEYWORD_TOOL_MAPPINGS: Record<string, string[]> = {
  // 单元格相关
  '单元格': ['excel_set_cell_value', 'excel_get_cell_value'],
  '区域': ['excel_set_range_values', 'excel_get_range_values'],

  // 公式相关
  '公式': ['excel_set_formula'],
  '求和': ['excel_set_formula'],
  '平均': ['excel_set_formula'],

  // 格式相关
  '格式': ['excel_set_number_format', 'excel_set_font', 'excel_set_fill_color'],
  '颜色': ['excel_set_fill_color', 'excel_set_font_color'],
  '边框': ['excel_set_border'],

  // 数据操作
  '排序': ['excel_sort_range'],
  '筛选': ['excel_filter_range', 'excel_auto_filter'],
  '合并': ['excel_merge_cells'],

  // 结构操作
  '插入行': ['excel_insert_row'],
  '插入列': ['excel_insert_column'],
  '删除行': ['excel_delete_row'],
  '删除列': ['excel_delete_column'],

  // 图表相关
  '图表': ['excel_insert_chart'],
  '柱状图': ['excel_insert_chart'],
  '折线图': ['excel_insert_chart'],
  '饼图': ['excel_insert_chart']
}

export class ExcelAdapter extends BaseOfficeAppAdapter {
  constructor(options: AdapterCreateOptions = {}) {
    super('excel', options)
  }

  /**
   * 检测 Excel 选区类型
   */
  async detectSelectionType(): Promise<SelectionType> {
    try {
      // 尝试调用 Excel 选区检测工具
      const result = await this.executeTool('excel_detect_selection_type', {})
      const data = result.data as Record<string, unknown> | undefined
      
      if (result.success && data?.selectionType) {
        this.logger.debug('Excel selection type detected:', data.selectionType)
        // Excel 的 selectionType 可能是 'cell' | 'range' | 'chart' | 'none'
        // 映射到标准类型
        const mapping: Record<string, SelectionType> = {
          'cell': 'text',
          'range': 'table',
          'chart': 'image',
          'none': 'none'
        }
        return mapping[data.selectionType as string] || 'text'
      }
      
      // 如果工具不存在或失败，尝试获取当前选区信息
      const rangeResult = await this.executeTool('excel_get_selected_range', {})
      const rangeData = rangeResult.data as Record<string, unknown> | undefined
      if (rangeResult.success && rangeData?.address) {
        this.logger.debug('Excel has selected range:', rangeData.address)
        return 'table' // Excel 选区通常视为表格类型
      }
      
      return 'none'
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.warn('Failed to detect Excel selection type, defaulting to none', { error: errorMessage })
      return 'none'
    }
  }

  /**
   * 获取工具前缀
   */
  getToolPrefix(): string {
    return 'excel_'
  }

  /**
   * 获取 Excel 特定的系统提示词片段（简化版）
   */
  getSystemPromptFragment(context: PromptContext): string {
    const templates = this.getAgentPromptTemplates()
    const parts: string[] = [templates.base]

    if (context.hasSelection) {
      const typePrompt = templates.selectionTypePrompts?.[context.selectionType]
      if (typePrompt) {
        parts.push(typePrompt)
      } else {
        parts.push(templates.selectionHint)
      }
    }

    // 检查是否涉及教育场景
    if (context.userMessage && templates.scenarioPrompts?.education) {
      const educationKeywords = ['成绩', '班级', '学生', '考勤', '分数', '排名', '平均分']
      if (educationKeywords.some(kw => context.userMessage?.includes(kw))) {
        parts.push(templates.scenarioPrompts.education)
      }
    }

    return parts.join('\n\n')
  }

  // ==================== 🆕 Agent 提示词相关 ====================

  /**
   * 获取 Agent 模式提示词模板
   */
  override getAgentPromptTemplates(): AgentPromptTemplates {
    return EXCEL_AGENT_PROMPTS
  }

  /**
   * 构建完整的 Agent 系统提示词（Excel 特定增强）
   */
  override buildAgentSystemPrompt(context: PromptContext, policy?: ClarificationPolicy): string {
    let prompt = super.buildAgentSystemPrompt(context, policy)

    // Excel 特定增强：教育场景检测
    if (this.detectEducationScenario(context.userMessage)) {
      const eduPrompt = EXCEL_AGENT_PROMPTS.scenarioPrompts?.education
      if (eduPrompt) {
        prompt += '\n' + eduPrompt
      }
    }

    return prompt
  }

  /**
   * 生成重试强化提示词（Excel 特定增强）
   */
  override buildRetryPrompt(context: RetryPromptContext): string {
    let prompt = super.buildRetryPrompt(context)

    prompt += `\n\n📍 Excel 地址提示：使用 "A1" 格式指定单元格，使用 "A1:C10" 格式指定区域。`

    return prompt
  }

  // ==================== 🆕 工具过滤相关 ====================

  /**
   * 根据意图过滤工具（Excel 特定逻辑）
   */
  override filterToolsByIntent(tools: FormattingFunction[], context: ToolFilterContext): FormattingFunction[] {
    const excelTools = tools.filter(tool => this.isToolForThisApp(tool.name))

    if (context.keywords && context.keywords.length > 0) {
      const matchedToolNames = new Set<string>()

      for (const keyword of context.keywords) {
        const mappedTools = EXCEL_KEYWORD_TOOL_MAPPINGS[keyword]
        if (mappedTools) {
          mappedTools.forEach(name => matchedToolNames.add(name))
        }
      }

      if (matchedToolNames.size > 0) {
        const priorityTools = excelTools.filter(tool => matchedToolNames.has(tool.name))
        if (priorityTools.length > 0) {
          return priorityTools
        }
      }
    }

    // 根据选区类型过滤
    if (context.selectionType === 'image') {
      const chartTools = excelTools.filter(tool => tool.name.includes('chart'))
      if (chartTools.length > 0) {
        return chartTools
      }
    }

    return excelTools
  }

  /**
   * 获取 Excel 特定的关键词到工具映射
   */
  override getKeywordToolMappings(): Record<string, string[]> {
    return EXCEL_KEYWORD_TOOL_MAPPINGS
  }

  /**
   * 获取 Excel 选区上下文
   */
  async getSelectionContext(): Promise<SelectionContext> {
    try {
      const selectionType = await this.detectSelectionType()
      const hasSelection = selectionType !== 'none'

      const context: SelectionContext = {
        hasSelection,
        selectionType,
        documentType: 'excel'
      }

      // 更新缓存
      if (this.options.enableCache) {
        this.selectionContextCache = {
          data: context,
          timestamp: Date.now()
        }
      }

      this.logger.info('Excel selection context retrieved', { context })
      return context
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error('Failed to get Excel selection context', { error: errorMessage })
      return this.getDefaultSelectionContext()
    }
  }

  /**
   * 获取选区信息
   */
  async getSelectionInfo(): Promise<SelectionInfo> {
    const selectionType = await this.detectSelectionType()
    const hasSelection = selectionType !== 'none'

    let rangeDescription: string | undefined
    if (hasSelection) {
      try {
        const result = await this.executeTool('excel_get_selected_range', {})
        const data = result.data as Record<string, unknown> | undefined
        if (result.success && data?.address) {
          rangeDescription = data.address as string // 如 "A1:B10"
        }
      } catch (error) {
        this.logger.warn('Failed to get selected range', { error })
      }
    }

    return {
      hasSelection,
      selectionType,
      rangeDescription
    }
  }

  /**
   * 获取文档上下文
   */
  async getDocumentContext(): Promise<DocumentContextInfo> {
    try {
      const result = await this.executeTool('excel_get_sheet_names', {})
      const data = result.data as Record<string, unknown> | undefined
      
      if (result.success && data?.sheets) {
        return {
          hasDocument: true,
          itemCount: (data.sheets as unknown[]).length,
          metadata: {
            sheetNames: data.sheets,
            activeSheet: data.activeSheet
          }
        }
      }

      return { hasDocument: true }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.warn('Failed to get Excel document context', { error: errorMessage })
      return { hasDocument: this._isAvailable }
    }
  }

  /**
   * 读取工作表内容
   */
  async readDocumentContent(options?: {
    maxLength?: number
    includeFormatting?: boolean
  }): Promise<string> {
    try {
      // 读取当前工作表的使用范围
      const result = await this.executeTool('excel_get_range_values', {
        range: 'A1:Z100' // 默认读取范围
      })
      const data = result.data as Record<string, unknown> | undefined

      if (result.success && data?.values) {
        const values = data.values as unknown[][]
        // 转换为文本格式
        return values
          .filter(row => row.some(cell => cell !== null && cell !== ''))
          .map(row => row.join('\t'))
          .join('\n')
          .slice(0, options?.maxLength || 10000)
      }

      return ''
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error('Failed to read Excel content', { error: errorMessage })
      return ''
    }
  }

  /**
   * 获取 Excel 支持的工具类别
   */
  getSupportedToolCategories(): string[] {
    return [
      'cell',
      'range',
      'formula',
      'chart',
      'format',
      'worksheet',
      'data',
      'pivot',
      'conditional_format',
      'education'
    ]
  }

  /**
   * 获取工具使用提示
   */
  getToolUsageHints(toolNames: string[]): string {
    const excelTools = toolNames.filter(name => name.startsWith('excel_'))
    if (excelTools.length === 0) {
      return ''
    }

    const hints: string[] = ['Excel 工具使用提示:']

    // 按类别分组
    const categories = {
      cell: excelTools.filter(t => t.includes('cell') || t.includes('range')),
      formula: excelTools.filter(t => t.includes('formula') || t.includes('sum') || t.includes('average')),
      chart: excelTools.filter(t => t.includes('chart')),
      format: excelTools.filter(t => t.includes('format') || t.includes('style'))
    }

    if (categories.cell.length > 0) {
      hints.push(`- 单元格操作: ${categories.cell.slice(0, 3).join(', ')}`)
    }
    if (categories.formula.length > 0) {
      hints.push(`- 公式计算: ${categories.formula.slice(0, 3).join(', ')}`)
    }
    if (categories.chart.length > 0) {
      hints.push(`- 图表: ${categories.chart.slice(0, 3).join(', ')}`)
    }

    return hints.join('\n')
  }

  /**
   * 初始化 Excel 适配器
   */
  async initialize(): Promise<void> {
    await super.initialize()
    
    // 检查 Excel 是否可用
    try {
      const result = await this.executeTool('excel_get_sheet_names', {})
      this._isAvailable = result.success
    } catch (error) {
      this._isAvailable = false
    }

    this.logger.info('Excel adapter initialized', { isAvailable: this._isAvailable })
  }

  // ==================== Excel 特定的辅助方法 ====================

  /**
   * 获取 Excel 特定的教育场景关键词
   */
  protected override getEducationKeywords(): string[] {
    return ['成绩', '班级', '学生', '考勤', '分数', '排名', '平均分']
  }
}

// 导出单例
export const excelAdapter = new ExcelAdapter()
