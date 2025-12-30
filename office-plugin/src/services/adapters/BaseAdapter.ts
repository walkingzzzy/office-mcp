/**
 * Office App 基础适配器
 *
 * 实现通用逻辑，子类只需覆盖应用特定的方法
 *
 * @architecture Core + Adapters 分层架构的基类
 * - 提供所有接口方法的默认实现
 * - 子类可选择性覆盖需要定制的方法
 */

import Logger from '../../utils/logger'
import { officeToolExecutor } from '../OfficeToolExecutor'
import type { FormattingFunction, FunctionResult, JsonSchemaProperty, SelectionContext } from '../ai/types'

/** 默认缓存 TTL（毫秒） */
const DEFAULT_CACHE_TTL_MS = 5000
import type {
  AdapterCreateOptions,
  AgentPromptTemplates,
  ClarificationPolicy,
  DocumentContextInfo,
  IOfficeAppAdapter,
  OfficeAppType,
  PromptContext,
  RetryPromptContext,
  SelectionInfo,
  SelectionType,
  ToolFilterContext,
  ToolFilterCriteria
} from './types'

/**
 * 默认澄清策略
 */
const DEFAULT_CLARIFICATION_POLICY: ClarificationPolicy = {
  allowAskingUser: true,
  allowedScenarios: ['missing_params', 'ambiguous_intent'],
  preferDefaults: true
}

/**
 * 基础适配器抽象类
 * 
 * 提供通用逻辑的默认实现，子类可按需覆盖
 */
export abstract class BaseOfficeAppAdapter implements IOfficeAppAdapter {
  protected readonly logger: Logger
  protected _isAvailable: boolean = false
  protected _isInitialized: boolean = false
  protected readonly options: AdapterCreateOptions

  // 缓存
  protected selectionContextCache: { data: SelectionContext; timestamp: number } | null = null
  protected documentContextCache: { data: DocumentContextInfo; timestamp: number } | null = null

  constructor(
    public readonly appType: OfficeAppType,
    options: AdapterCreateOptions = {}
  ) {
    this.logger = new Logger(`${appType}Adapter`)
    this.options = {
      logLevel: 'info',
      enableCache: true,
      cacheTTL: DEFAULT_CACHE_TTL_MS,
      ...options
    }
  }

  get isAvailable(): boolean {
    return this._isAvailable
  }

  /**
   * 设置适配器可用状态
   * 用于外部服务注入后标记适配器已就绪
   */
  setAvailable(available: boolean): void {
    this._isAvailable = available
  }

  // ==================== 抽象方法（子类必须实现） ====================

  /**
   * 检测选区类型（应用特定）
   */
  abstract detectSelectionType(): Promise<SelectionType>

  /**
   * 获取工具前缀
   */
  abstract getToolPrefix(): string

  /**
   * 获取应用特定的系统提示词片段
   */
  abstract getSystemPromptFragment(context: PromptContext): string

  // ==================== 通用实现（子类可覆盖） ====================

  /**
   * 获取选区上下文
   * 通用实现：检测类型 + 构建上下文
   */
  async getSelectionContext(): Promise<SelectionContext> {
    // 检查缓存
    if (this.options.enableCache && this.selectionContextCache) {
      const age = Date.now() - this.selectionContextCache.timestamp
      if (age < (this.options.cacheTTL || DEFAULT_CACHE_TTL_MS)) {
        this.logger.debug('Using cached selection context')
        return this.selectionContextCache.data
      }
    }

    try {
      const selectionType = await this.detectSelectionType()
      const hasSelection = selectionType !== 'none'

      const context: SelectionContext = {
        hasSelection,
        selectionType,
        documentType: this.appType === 'none' ? 'word' : this.appType as 'word' | 'excel' | 'powerpoint'
      }

      // 更新缓存
      if (this.options.enableCache) {
        this.selectionContextCache = {
          data: context,
          timestamp: Date.now()
        }
      }

      this.logger.info('Selection context retrieved', { context })
      return context
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error('Failed to get selection context', { error: errorMessage })
      return this.getDefaultSelectionContext()
    }
  }

  /**
   * 获取选区信息（轻量版）
   */
  async getSelectionInfo(): Promise<SelectionInfo> {
    const selectionType = await this.detectSelectionType()
    return {
      hasSelection: selectionType !== 'none',
      selectionType
    }
  }

  /**
   * 获取文档上下文
   */
  async getDocumentContext(): Promise<DocumentContextInfo> {
    // 检查缓存
    if (this.options.enableCache && this.documentContextCache) {
      const age = Date.now() - this.documentContextCache.timestamp
      if (age < (this.options.cacheTTL || DEFAULT_CACHE_TTL_MS)) {
        return this.documentContextCache.data
      }
    }

    // 默认实现：返回基础信息
    const context: DocumentContextInfo = {
      hasDocument: this._isAvailable
    }

    if (this.options.enableCache) {
      this.documentContextCache = {
        data: context,
        timestamp: Date.now()
      }
    }

    return context
  }

  /**
   * 读取文档内容
   */
  async readDocumentContent(options?: {
    maxLength?: number
    includeFormatting?: boolean
  }): Promise<string> {
    // 默认实现：返回空字符串，子类应覆盖
    this.logger.warn('readDocumentContent not implemented for this adapter')
    return ''
  }

  /**
   * 获取支持的工具类别
   */
  getSupportedToolCategories(): string[] {
    // 默认类别，子类可覆盖
    return ['paragraph', 'font', 'style', 'table', 'image', 'layout']
  }

  /**
   * 判断工具是否属于该应用
   */
  isToolForThisApp(toolName: string): boolean {
    const prefix = this.getToolPrefix()
    return toolName.startsWith(prefix)
  }

  /**
   * 获取工具过滤条件
   */
  getToolFilterCriteria(selectionInfo: SelectionInfo): ToolFilterCriteria {
    return {
      appType: this.appType,
      selectionType: selectionInfo.selectionType
    }
  }

  /**
   * 获取工具使用提示
   */
  getToolUsageHints(toolNames: string[]): string {
    const myTools = toolNames.filter(name => this.isToolForThisApp(name))
    if (myTools.length === 0) {
      return ''
    }
    return `可用的 ${this.getAppDisplayName()} 工具: ${myTools.join(', ')}`
  }

  // ==================== 🆕 Agent 提示词相关（默认实现） ====================

  /**
   * 获取 Agent 模式提示词模板
   * 子类应覆盖此方法提供应用特定的模板
   */
  getAgentPromptTemplates(): AgentPromptTemplates {
    return {
      base: `你是 ${this.getAppDisplayName()} 文档编辑助手。你必须使用工具来完成用户的请求，而不是仅仅描述如何操作。`,
      selectionHint: `用户当前已选中内容，请优先对选中内容进行操作。`,
      toolGuide: `请使用可用的工具完成用户请求。`,
      selectionTypePrompts: {
        text: '用户当前选中了文本。',
        image: '用户当前选中了图片。',
        table: '用户当前选中了表格。'
      }
    }
  }

  /**
   * 构建完整的 Agent 系统提示词
   */
  buildAgentSystemPrompt(context: PromptContext, policy?: ClarificationPolicy): string {
    const templates = this.getAgentPromptTemplates()
    const parts: string[] = []

    // 1. 基础指令
    parts.push('[Agent 模式]')
    parts.push(templates.base)

    // 2. 选区提示
    if (context.hasSelection) {
      parts.push(templates.selectionHint)

      // 选区类型特定提示
      const typePrompt = templates.selectionTypePrompts?.[context.selectionType]
      if (typePrompt) {
        parts.push(typePrompt)
      }
    }

    // 3. 工具指南
    parts.push(templates.toolGuide)

    // 4. 澄清策略
    const clarificationPolicy = policy || this.getDefaultClarificationPolicy()
    parts.push(this.buildClarificationInstruction(clarificationPolicy))

    // 5. 执行强调
    parts.push('\n重要：你必须调用工具来完成操作，不能只回复文本。')

    return parts.join('\n')
  }

  /**
   * 生成重试强化提示词
   */
  buildRetryPrompt(context: RetryPromptContext): string {
    const diagnosis = '【系统诊断】上一轮模型未执行任何工具调用，但用户请求需要直接修改文档。'

    const previousSection = context.previousOutput?.trim()
      ? `上一轮输出：${context.previousOutput.trim().slice(0, 100)}...`
      : ''

    const toolExamples = this.generateToolExamples(context.candidateTools.slice(0, 3))

    const retryInstruction = `
请严格按照以下要求重新执行：
1. 必须返回至少一个 tool_calls，调用能完成任务的工具
2. 工具参数必须符合其 schema 定义（参考下方示例）
3. 完成工具调用后可给出简短说明

用户原始指令：${context.userMessage}

${toolExamples}`

    return [diagnosis, previousSection, retryInstruction].filter(Boolean).join('\n')
  }

  /**
   * 获取默认澄清策略
   */
  getDefaultClarificationPolicy(): ClarificationPolicy {
    return DEFAULT_CLARIFICATION_POLICY
  }

  // ==================== 🆕 工具过滤相关（默认实现） ====================

  /**
   * 根据意图过滤工具
   * 默认实现：仅保留属于当前应用的工具
   */
  filterToolsByIntent(tools: FormattingFunction[], context: ToolFilterContext): FormattingFunction[] {
    // 默认：过滤出属于当前应用的工具
    return tools.filter(tool => this.isToolForThisApp(tool.name))
  }

  /**
   * 获取应用特定的关键词到工具映射
   * 子类应覆盖此方法
   */
  getKeywordToolMappings(): Record<string, string[]> {
    // 默认返回空映射，子类覆盖
    return {}
  }

  /**
   * 初始化适配器
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing adapter')
    this._isInitialized = true
    // 子类可覆盖添加初始化逻辑
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.logger.info('Disposing adapter')
    this.selectionContextCache = null
    this.documentContextCache = null
    this._isInitialized = false
  }

  // ==================== 辅助方法 ====================

  /**
   * 获取默认选区上下文
   */
  protected getDefaultSelectionContext(): SelectionContext {
    return {
      hasSelection: false,
      selectionType: 'none',
      documentType: this.appType === 'none' ? 'word' : this.appType as 'word' | 'excel' | 'powerpoint'
    }
  }

  /**
   * 获取应用显示名称
   */
  protected getAppDisplayName(): string {
    switch (this.appType) {
      case 'word': return 'Word'
      case 'excel': return 'Excel'
      case 'powerpoint': return 'PowerPoint'
      default: return 'Office'
    }
  }

  /**
   * 执行工具调用
   */
  protected async executeTool(toolName: string, args: Record<string, unknown>): Promise<FunctionResult> {
    return officeToolExecutor.executeTool(toolName, args)
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.selectionContextCache = null
    this.documentContextCache = null
  }

  /**
   * 检测是否涉及教育场景
   * 子类可覆盖此方法提供应用特定的关键词列表
   *
   * @param userMessage - 用户消息
   * @returns 是否匹配教育场景
   */
  protected detectEducationScenario(userMessage: string | undefined): boolean {
    if (!userMessage) return false
    const keywords = this.getEducationKeywords()
    return keywords.some(kw => userMessage.includes(kw))
  }

  /**
   * 获取教育场景关键词列表
   * 子类应覆盖此方法提供应用特定的关键词
   */
  protected getEducationKeywords(): string[] {
    // 默认通用教育关键词
    return ['课件', '教案', '讲义', '知识点']
  }

  /**
   * 构建澄清指令
   */
  protected buildClarificationInstruction(policy: ClarificationPolicy): string {
    if (!policy.allowAskingUser) {
      return '【重要】当参数不完整时，请使用合理的默认值，不要询问用户。'
    }

    const scenarios: string[] = []
    if (policy.allowedScenarios.includes('missing_params')) {
      scenarios.push('关键参数缺失')
    }
    if (policy.allowedScenarios.includes('ambiguous_intent')) {
      scenarios.push('意图不明确')
    }
    if (policy.allowedScenarios.includes('confirmation_needed')) {
      scenarios.push('需要确认重要操作')
    }

    if (scenarios.length === 0) {
      return ''
    }

    const preferDefaultHint = policy.preferDefaults
      ? '优先使用合理默认值。'
      : ''

    return `【澄清规则】仅在以下情况可以询问用户：${scenarios.join('、')}。${preferDefaultHint}`
  }

  /**
   * 生成工具调用示例
   */
  protected generateToolExamples(tools: FormattingFunction[]): string {
    if (tools.length === 0) {
      return ''
    }

    const examples = tools.map(tool => {
      const params = this.getExampleParams(tool)
      return `工具：${tool.name}\n参数示例：${JSON.stringify(params, null, 2)}`
    })

    return `可用工具示例：\n${examples.join('\n\n')}`
  }

  /**
   * 获取工具的示例参数
   */
  protected getExampleParams(tool: FormattingFunction): Record<string, unknown> {
    const schema = tool.inputSchema
    if (!schema || !schema.properties) {
      return {}
    }

    const params: Record<string, unknown> = {}
    const required = schema.required || []

    for (const [key, prop] of Object.entries(schema.properties)) {
      // 优先生成必填参数的示例
      if (required.includes(key)) {
        params[key] = this.getExampleValue(prop)
      }
    }

    return params
  }

  /**
   * 根据类型生成示例值
   */
  protected getExampleValue(propDef: JsonSchemaProperty): unknown {
    if (propDef.enum && propDef.enum.length > 0) {
      return propDef.enum[0]
    }
    if (propDef.default !== undefined) {
      return propDef.default
    }
    switch (propDef.type) {
      case 'string':
        return propDef.description?.slice(0, 20) || '示例文本'
      case 'number':
      case 'integer':
        return propDef.minimum || 1
      case 'boolean':
        return true
      case 'array':
        return []
      case 'object':
        return {}
      default:
        return null
    }
  }
}
