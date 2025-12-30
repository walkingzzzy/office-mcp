/**
 * Office App Adapter 类型定义
 *
 * 定义应用无关的通用接口，让 Word/Excel/PPT 各自实现
 * 确保架构可扩展，避免后续大面积返工
 *
 * @architecture Core + Adapters 分层架构
 * - Core 层：应用无关的通用逻辑（提示词编排、工具选择策略、执行流程）
 * - Adapter 层：应用特定实现（Word/Excel/PPT 的提示词、工具、选区检测）
 */

import type { SelectionContext, FormattingFunction } from '../ai/types'

/** Office 应用类型 */
export type OfficeAppType = 'word' | 'excel' | 'powerpoint' | 'none'

/** 选区类型 */
export type SelectionType = 'text' | 'image' | 'table' | 'none'

/**
 * 文档上下文信息
 */
export interface DocumentContextInfo {
  /** 是否有打开的文档 */
  hasDocument: boolean
  /** 文档标题/文件名 */
  title?: string
  /** 文档内容摘要 */
  contentSummary?: string
  /** 段落数量（Word）/ 工作表数（Excel）/ 幻灯片数（PPT） */
  itemCount?: number
  /** 应用特定的元数据 */
  metadata?: Record<string, unknown>
}

/**
 * Agent 提示词模板集合
 * 每个 Adapter 返回自己的提示词模板
 */
export interface AgentPromptTemplates {
  /** 基础系统提示词 */
  base: string
  /** 选区提示词（有选区时使用） */
  selectionHint: string
  /** 工具使用指南 */
  toolGuide: string
  /** 特定选区类型的提示词 */
  selectionTypePrompts?: Partial<Record<SelectionType, string>>
  /** 场景特定提示词（如教育场景） */
  scenarioPrompts?: Record<string, string>
}

/**
 * 澄清策略配置
 */
export interface ClarificationPolicy {
  /** 是否允许模型询问用户 */
  allowAskingUser: boolean
  /** 允许询问的场景 */
  allowedScenarios: ('missing_params' | 'ambiguous_intent' | 'confirmation_needed')[]
  /** 是否优先使用默认值 */
  preferDefaults: boolean
}

/**
 * 重试提示词上下文
 */
export interface RetryPromptContext {
  /** 用户原始消息 */
  userMessage: string
  /** 候选工具 */
  candidateTools: FormattingFunction[]
  /** 上一轮输出 */
  previousOutput?: string
}

/**
 * 工具过滤上下文
 */
export interface ToolFilterContext {
  /** 用户输入/意图 */
  userIntent: string
  /** 选区类型 */
  selectionType: SelectionType
  /** 是否有选区 */
  hasSelection: boolean
  /** 用户消息中的关键词 */
  keywords?: string[]
}

/**
 * 选区信息
 */
export interface SelectionInfo {
  /** 是否有选区 */
  hasSelection: boolean
  /** 选区类型 */
  selectionType: SelectionType
  /** 选中的文本内容（如果是文本选区） */
  selectedText?: string
  /** 选区范围描述（如 "A1:B10" 或 "第1段"） */
  rangeDescription?: string
  /** 应用特定的元数据 */
  metadata?: Record<string, unknown>
}

/**
 * 工具执行上下文
 */
export interface ToolExecutionContext {
  /** 当前应用类型 */
  appType: OfficeAppType
  /** 文档上下文 */
  documentContext: DocumentContextInfo
  /** 选区信息 */
  selectionInfo: SelectionInfo
  /** 用户意图 */
  userIntent?: 'edit' | 'query' | 'command'
  /** 最近使用的工具 */
  recentTools?: string[]
}

/**
 * 提示词上下文
 */
export interface PromptContext {
  /** 应用类型 */
  appType: OfficeAppType
  /** 是否有选区 */
  hasSelection: boolean
  /** 选区类型 */
  selectionType: SelectionType
  /** 用户消息 */
  userMessage?: string
  /** 可用工具列表 */
  availableTools?: string[]
  /** 是否使用高级提示词 */
  useAdvancedPrompt?: boolean
}

/**
 * 工具过滤条件
 */
export interface ToolFilterCriteria {
  /** 目标应用类型 */
  appType: OfficeAppType
  /** 选区类型 */
  selectionType: SelectionType
  /** 用户意图关键词 */
  intentKeywords?: string[]
  /** 包含的工具分类 */
  includeCategories?: string[]
  /** 排除的工具分类 */
  excludeCategories?: string[]
}

/**
 * Office App Adapter 核心接口
 * 
 * 每个 Office 应用（Word/Excel/PPT）必须实现此接口
 * 通用逻辑在基类/调用方处理，应用特定逻辑在 Adapter 中实现
 */
export interface IOfficeAppAdapter {
  /** 应用类型标识 */
  readonly appType: OfficeAppType

  /** 应用是否可用/已初始化 */
  readonly isAvailable: boolean

  // ==================== 选区操作 ====================

  /**
   * 获取当前选区上下文
   * 
   * @returns 选区上下文信息
   */
  getSelectionContext(): Promise<SelectionContext>

  /**
   * 获取选区信息（轻量版，不包含完整内容）
   * 
   * @returns 选区信息
   */
  getSelectionInfo(): Promise<SelectionInfo>

  /**
   * 检测选区类型
   * 
   * @returns 选区类型
   */
  detectSelectionType(): Promise<SelectionType>

  // ==================== 文档操作 ====================

  /**
   * 获取文档上下文信息
   * 
   * @returns 文档上下文
   */
  getDocumentContext(): Promise<DocumentContextInfo>

  /**
   * 读取文档内容
   * 
   * @param options - 读取选项
   * @returns 文档内容
   */
  readDocumentContent(options?: {
    maxLength?: number
    includeFormatting?: boolean
  }): Promise<string>

  // ==================== 工具相关 ====================

  /**
   * 获取工具前缀（如 'word_', 'excel_', 'ppt_'）
   */
  getToolPrefix(): string

  /**
   * 获取该应用支持的工具类别
   */
  getSupportedToolCategories(): string[]

  /**
   * 判断工具是否属于该应用
   * 
   * @param toolName - 工具名称
   * @returns 是否属于该应用
   */
  isToolForThisApp(toolName: string): boolean

  /**
   * 获取工具过滤条件
   * 
   * @param selectionInfo - 当前选区信息
   * @returns 工具过滤条件
   */
  getToolFilterCriteria(selectionInfo: SelectionInfo): ToolFilterCriteria

  // ==================== 提示词相关 ====================

  /**
   * 获取应用特定的系统提示词片段
   * 
   * @param context - 提示词上下文
   * @returns 系统提示词
   */
  getSystemPromptFragment(context: PromptContext): string

  /**
   * 获取应用特定的工具使用提示
   *
   * @param toolNames - 工具名称列表
   * @returns 工具提示
   */
  getToolUsageHints(toolNames: string[]): string

  // ==================== 🆕 Agent 提示词相关 ====================

  /**
   * 获取 Agent 模式提示词模板
   *
   * 返回该应用的完整提示词模板集合，用于 Agent 模式
   * 替代 AgentPromptManager 中的硬编码模板
   *
   * @returns Agent 提示词模板
   */
  getAgentPromptTemplates(): AgentPromptTemplates

  /**
   * 构建完整的 Agent 系统提示词
   *
   * 根据上下文组合提示词模板，生成最终系统提示词
   *
   * @param context - 提示词上下文
   * @param policy - 澄清策略（可选）
   * @returns 完整的系统提示词
   */
  buildAgentSystemPrompt(context: PromptContext, policy?: ClarificationPolicy): string

  /**
   * 生成重试强化提示词
   *
   * 当模型未执行工具调用时，生成重试提示
   *
   * @param context - 重试上下文
   * @returns 重试提示词
   */
  buildRetryPrompt(context: RetryPromptContext): string

  /**
   * 获取默认澄清策略
   *
   * @returns 该应用的默认澄清策略
   */
  getDefaultClarificationPolicy(): ClarificationPolicy

  // ==================== 🆕 工具过滤相关 ====================

  /**
   * 根据意图过滤工具
   *
   * 使用应用特定的规则过滤工具列表
   *
   * @param tools - 候选工具列表
   * @param context - 过滤上下文
   * @returns 过滤后的工具列表
   */
  filterToolsByIntent(tools: FormattingFunction[], context: ToolFilterContext): FormattingFunction[]

  /**
   * 获取应用特定的关键词到工具映射
   *
   * 用于工具选择器的关键词匹配
   *
   * @returns 关键词到工具名称的映射
   */
  getKeywordToolMappings(): Record<string, string[]>

  // ==================== 生命周期 ====================

  /**
   * 初始化适配器
   */
  initialize(): Promise<void>

  /**
   * 清理资源
   */
  dispose(): void
}

/**
 * Adapter 注册表类型
 */
export interface IAdapterRegistry {
  /**
   * 注册适配器
   */
  register(adapter: IOfficeAppAdapter): void

  /**
   * 获取适配器
   */
  get(appType: OfficeAppType): IOfficeAppAdapter | undefined

  /**
   * 获取当前活跃的适配器
   */
  getActive(): IOfficeAppAdapter | undefined

  /**
   * 设置当前活跃的应用类型
   */
  setActiveApp(appType: OfficeAppType): void

  /**
   * 获取所有已注册的适配器
   */
  getAll(): IOfficeAppAdapter[]
}

/**
 * 适配器创建选项
 */
export interface AdapterCreateOptions {
  /** 日志级别 */
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
  /** 是否启用缓存 */
  enableCache?: boolean
  /** 缓存 TTL（毫秒） */
  cacheTTL?: number
}
