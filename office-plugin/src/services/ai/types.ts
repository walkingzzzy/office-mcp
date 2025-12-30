/**
 * Function Calling 相关类型定义
 * 为 Word 格式化功能设计
 */

/**
 * JSON Schema 属性定义
 * 用于描述工具参数的类型信息
 */
export interface JsonSchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object'
  description?: string
  enum?: (string | number | boolean)[]
  default?: unknown
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  items?: JsonSchemaProperty
  properties?: Record<string, JsonSchemaProperty>
  required?: string[]
  additionalProperties?: boolean
}

/**
 * 对话消息类型
 * 用于对话历史记录
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  name?: string
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: {
      name: string
      arguments: string
    }
  }>
  tool_call_id?: string
}

/**
 * 函数类别枚举
 */
export enum FunctionCategory {
  FONT = 'font',
  PARAGRAPH = 'paragraph',
  STYLE = 'style',
  SMART = 'smart',
  IMAGE = 'image',
  COMMENT = 'comment',
  TABLE = 'table',
  LIST = 'list',
  LAYOUT = 'layout',
  REFERENCE = 'reference'
}

/**
 * 格式化目标范围
 */
export type FormattingTarget = 'selection' | 'document' | 'paragraph' | 'paragraphs' | 'table' | 'cell'

/**
 * 对齐方式
 */
export type AlignmentType = 'left' | 'centered' | 'right' | 'justified'

/**
 * 下划线样式
 */
export type UnderlineStyle = 'none' | 'single' | 'double' | 'dotted' | 'dashed'

/**
 * 行距规则
 */
export type LineSpacingRule = 'single' | 'onePointFive' | 'double' | 'atLeast' | 'exactly'

/**
 * 列表类型
 */
export type ListType = 'bullet' | 'number' | 'multilevel'

/**
 * 文档类型（用于智能优化）
 */
export type DocumentType = 'academic' | 'business' | 'casual'

/**
 * 函数执行结果
 */
export interface FunctionResult {
  /**
   * 是否成功
   */
  success: boolean

  /**
   * 结果消息
   */
  message: string

  /**
   * 附加数据
   */
  data?: Record<string, unknown> | unknown

  /**
   * 错误对象（如果失败）
   */
  error?: Error | unknown

  /**
   * 执行时间（毫秒）
   */
  executionTime?: number

  /**
   * 受影响的对象数量
   */
  affectedCount?: number
}

/**
 * 格式化函数定义
 */
export interface FormattingFunction {
  /**
   * 函数名称
   */
  name: string

  /**
   * 函数描述（简洁版，< 100 字符）
   */
  description: string

  /**
   * 函数类别
   */
  category: FunctionCategory

  /**
   * 输入参数 Schema（符合 JSON Schema）
   */
  inputSchema: {
    type: 'object'
    properties: Record<string, JsonSchemaProperty>
    required?: string[]
    additionalProperties?: boolean
  }

  /**
   * 输出结果 Schema（可选）
   */
  outputSchema?: {
    type: 'object'
    properties: Record<string, JsonSchemaProperty>
  }

  /**
   * 处理函数（异步）
   */
  handler: (args: Record<string, unknown>) => Promise<FunctionResult>

  /**
   * 执行函数（异步）- handler 的别名
   */
  executor?: (args: Record<string, unknown>) => Promise<FunctionResult>

  /**
   * Schema 定义（可选）
   */
  schema?: {
    type: 'object'
    properties: Record<string, JsonSchemaProperty>
    required?: string[]
  }

  /**
   * 是否需要用户确认
   */
  needsConfirmation?: boolean

  /**
   * 确认提示消息生成器（可选）
   */
  confirmMessage?: (args: Record<string, unknown>) => string

  /**
   * 函数优先级（数字越小优先级越高）
   */
  priority?: number

  /**
   * 最小 API 版本要求
   */
  minApiVersion?: string

  /**
   * 是否仅通过 MCP 执行
   * 标记为 true 的工具不会在本地执行，必须通过 McpToolExecutor 调用
   */
  mcpOnly?: boolean

  /**
   * 示例（可选）
   */
  examples?: Array<{
    input: Record<string, unknown>
    output?: unknown
    description?: string
  }> | string[]

  metadata?: {
    scenario?: string
    contextTip?: string
    intentKeywords?: string[]
    applicableSelection?: Array<'text' | 'image' | 'table' | 'none'>
    documentTypes?: Array<'word' | 'excel' | 'powerpoint'>
    priorityLabel?: 'P0' | 'P1' | 'P2'
    tags?: string[]
  }
}

/**
 * Tool Call 数据结构（来自 AI）
 */
export interface ToolCall {
  /**
   * 调用 ID
   */
  id: string

  /**
   * 类型，固定值 'function'
   */
  type: 'function'

  /**
   * 函数信息
   */
  function: {
    /**
     * 函数名称
     */
    name: string

    /**
     * 函数参数（JSON 字符串）
     */
    arguments: string
  }
}

/**
 * Tool Call 执行结果（返回给 AI）
 */
export interface ToolCallResult {
  /**
   * 对应的调用 ID
   */
  tool_call_id: string

  /**
   * 角色，固定值 'tool'
   */
  role: 'tool'

  /**
   * 结果内容（JSON 字符串）
   */
  content: string
}

/**
 * 流式 Tool Call 增量数据
 */
export interface ToolCallDelta {
  /**
   * 索引（用于并行工具调用）
   */
  index: number

  /**
   * 调用 ID（可选）
   */
  id?: string

  /**
   * 类型（可选）
   */
  type?: 'function'

  /**
   * 函数信息（可选）
   */
  function?: {
    /**
     * 函数名称（可选）
     */
    name?: string

    /**
     * 函数参数（可选，增量）
     */
    arguments?: string
  }
}

/**
 * 累积的 Tool Call
 */
export interface AccumulatedToolCall {
  /**
   * 调用 ID
   */
  id: string

  /**
   * 函数名称
   */
  name: string

  /**
   * 累积的参数字符串
   */
  arguments: string

  /**
   * 是否完整
   */
  isComplete: boolean
}

/**
 * 编排步骤定义
 */
export interface OrchestrationStep {
  /**
   * 函数名称
   */
  functionName: string

  /**
   * 函数参数
   */
  arguments: Record<string, unknown>

  /**
   * 失败时是否继续
   */
  skipOnError?: boolean

  /**
   * 步骤描述（用于进度显示）
   */
  description?: string

  /**
   * 步骤序号
   */
  stepNumber?: number
}

/**
 * 执行报告
 */
export interface ExecutionReport {
  /**
   * 总步骤数
   */
  totalSteps: number

  /**
   * 成功步骤数
   */
  successfulSteps: number

  /**
   * 失败步骤数
   */
  failedSteps: number

  /**
   * 总执行时间（毫秒）
   */
  totalExecutionTime: number

  /**
   * 详细步骤结果
   */
  stepResults: Array<{
    stepNumber: number
    functionName: string
    success: boolean
    message: string
    executionTime: number
    error?: Error
  }>

  /**
   * 总体成功状态
   */
  overallSuccess: boolean
}

/**
 * 进度信息接口
 */
export interface ProgressInfo {
  /**
   * 当前步骤
   */
  currentStep: number

  /**
   * 总步骤数
   */
  totalSteps: number

  /**
   * 当前步骤描述
   */
  stepDescription?: string

  /**
   * 当前函数名称
   */
  functionName?: string

  /**
   * 进度百分比（0-100）
   */
  percentage: number
}

/**
 * 进度回调函数类型
 */
export type ProgressCallback = (progress: ProgressInfo) => void

/**
 * 确认请求回调
 */
export type ConfirmRequestCallback = (message: string, confirmText?: string, cancelText?: string) => Promise<boolean>

/**
 * 工具操作预览项
 */
export interface ToolOperationPreview {
  /** 工具调用ID */
  id: string
  /** 工具名称 */
  toolName: string
  /** 工具描述（用户友好） */
  description: string
  /** 操作参数摘要 */
  parametersSummary: string
  /** 是否为高危操作 */
  isHighRisk: boolean
  /** 预估执行时间(ms) */
  estimatedTime: number
  /** 是否被选中执行 */
  selected: boolean
}

/**
 * 批量确认选项
 */
export interface BatchConfirmOptions {
  /** 对话框标题 */
  title?: string
  /** 操作列表 */
  operations: ToolOperationPreview[]
  /** 总预估时间 */
  totalEstimatedTime: number
  /** 高危操作数量 */
  highRiskCount: number
}

/**
 * 批量确认结果
 */
export interface BatchConfirmResult {
  /** 是否确认执行 */
  confirmed: boolean
  /** 选中的操作ID列表 */
  selectedIds: string[]
}

/**
 * 批量确认回调
 */
export type BatchConfirmCallback = (options: BatchConfirmOptions) => Promise<BatchConfirmResult>

/**
 * 选区上下文信息 (用于工具选择)
 * 基于架构文档设计,用于动态工具选择
 */
export interface SelectionContext {
  /** 是否有选区 */
  hasSelection: boolean

  /** 选区类型 */
  selectionType: 'text' | 'image' | 'table' | 'none'

  /** 文档类型 */
  documentType: 'word' | 'excel' | 'powerpoint'

  /** 文档中是否有图片 */
  hasImages?: boolean

  /** 文档中是否有表格 */
  hasTables?: boolean

  /** 最近使用的工具 */
  recentTools?: string[]

  /** 对话历史 (可选) */
  conversationHistory?: ConversationMessage[]
}

/**
 * 文档上下文信息
 */
export interface DocumentContext {
  /**
   * 当前选区信息
   */
  selection?: {
    /**
     * 选中的文本
     */
    text?: string

    /**
     * 选区长度
     */
    length: number

    /**
     * 当前格式信息
     */
    formatting?: {
      fontName?: string
      fontSize?: number
      bold?: boolean
      italic?: boolean
      color?: string
      alignment?: AlignmentType
    }
  }

  /**
   * 文档整体信息
   */
  document?: {
    /**
     * 总段落数
     */
    paragraphCount: number

    /**
     * 总字数
     */
    wordCount: number

    /**
     * 当前样式列表
     */
    styles?: string[]

    /**
     * 主要字体
     */
    primaryFont?: string
  }

  /**
   * 最近使用的格式
   */
  recentFormatting?: {
    fontName?: string
    fontSize?: number
    color?: string
    bold?: boolean
    italic?: boolean
  }
}

/**
 * 工具选择结果
 */
export interface ToolSelectionResult {
  /**
   * 选中的工具列表
   */
  selectedTools: FormattingFunction[]

  /**
   * 匹配的关键词
   */
  matchedKeywords: string[]

  /**
   * 匹配的类别
   */
  matchedCategories: FunctionCategory[]

  /**
   * 选择置信度（0-1）
   */
  confidence: number
}
/**
 * 字体格式选项
 * 统一使用与Word types一致的属性名
 */
export interface FontFormatOptions {
  /** 字体名称 */
  name?: string
  /** 字体大小（磅） */
  size?: number
  /** 字体颜色 */
  color?: string
  /** 粗体 */
  bold?: boolean
  /** 斜体 */
  italic?: boolean
  /** 下划线类型 */
  underline?: UnderlineStyle
}

/**
 * 段落格式选项
 */
export interface ParagraphFormatOptions {
  alignment?: AlignmentType
  lineSpacing?: number
  lineSpacingRule?: LineSpacingRule
  spaceAfter?: number
  spaceBefore?: number
  firstLineIndent?: number
  leftIndent?: number
  rightIndent?: number
}

/**
 * 修订跟踪变更信息
 */
export interface TrackedChangeInfo {
  id: string
  type: 'insert' | 'delete' | 'format'
  author: string
  date: Date
  text?: string
}

/**
 * 视觉增强选项
 */
export interface VisualEnhancementOptions {
  highlightKeywords?: boolean
  addIcons?: boolean
  improveLayout?: boolean
  addBorders?: boolean
}

/**
 * 工具输入 Schema 定义
 * 用于描述工具参数的类型信息
 */
export interface ToolInputSchema {
  type: 'object'
  properties: Record<string, JsonSchemaProperty>
  required?: string[]
  additionalProperties?: boolean
}
