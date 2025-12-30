/**
 * 消息块类型定义
 * 参考主应用的 src/renderer/src/types/newMessage.ts
 */

/**
 * 消息块类型枚举
 */
export enum MessageBlockType {
  UNKNOWN = 'unknown',
  MAIN_TEXT = 'main_text',
  THINKING = 'thinking',
  TRANSLATION = 'translation',
  IMAGE = 'image',
  CODE = 'code',
  TOOL = 'tool',
  FILE = 'file',
  ERROR = 'error',
  CITATION = 'citation',
  VIDEO = 'video',
  /** 澄清问题块 - 用于多轮对话中的意图澄清 */
  CLARIFICATION = 'clarification',
  /** 任务计划块 - 用于显示任务拆分和执行进度 */
  TASK_PLAN = 'task_plan'
}

/**
 * 消息块状态枚举
 */
export enum MessageBlockStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  STREAMING = 'streaming',
  SUCCESS = 'success',
  ERROR = 'error',
  PAUSED = 'paused'
}

/**
 * 基础消息块接口
 */
export interface BaseMessageBlock {
  id: string
  messageId: string
  type: MessageBlockType
  createdAt: string
  updatedAt?: string
  status: MessageBlockStatus
  model?: {
    id: string
    name: string
    provider?: string
  }
  metadata?: Record<string, unknown>
  error?: {
    message: string
    code?: string
    type?: string
  }
}

/**
 * 主文本消息块
 */
export interface MainTextMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.MAIN_TEXT
  content: string
  knowledgeBaseIds?: string[]
  citationReferences?: {
    citationBlockId?: string
    citationBlockSource?: string
  }[]
}

/**
 * 思考消息块
 */
export interface ThinkingMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.THINKING
  content: string
  thinking_millsec: number
}

/**
 * 工具调用消息块
 */
export interface ToolMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.TOOL
  toolId: string
  toolName?: string
  arguments?: Record<string, unknown>
  content?: string | object
  metadata?: BaseMessageBlock['metadata'] & {
    rawMcpToolResponse?: unknown
    serverName?: string
  }
}

/**
 * 引用项接口
 */
export interface Citation {
  id: string
  title: string
  url?: string
  content: string
  source?: string
  score?: number
}

/**
 * 引用消息块
 */
export interface CitationMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.CITATION
  citations?: Citation[]
  response?: {
    results?: Array<{
      title?: string
      url?: string
      content: string
      source?: string
      score?: number
    }>
  }
  knowledge?: Array<{
    id: string
    name?: string
    title?: string
    content: string
    score?: number
    metadata?: Record<string, unknown>
  }>
  memories?: Array<{
    id: string
    content: string
    timestamp: string
  }>
}

/**
 * 错误消息块
 */
export interface ErrorMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.ERROR
  content: string
  errorCode?: string
  errorType?: string
}

/**
 * 代码消息块
 */
export interface CodeMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.CODE
  content: string
  language?: string
}

/**
 * 图像消息块
 */
export interface ImageMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.IMAGE
  url?: string
  alt?: string
  caption?: string
  metadata?: BaseMessageBlock['metadata'] & {
    width?: number
    height?: number
    format?: string
    model?: string
    prompt?: string
  }
}

/**
 * 澄清问题消息块 - 用于多轮对话中的意图澄清
 */
export interface ClarificationMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.CLARIFICATION
  /** 澄清问题 ID */
  questionId: string
  /** 问题内容 */
  question: string
  /** 问题类型 */
  questionType: 'single_choice' | 'multiple_choice' | 'free_text' | 'yes_no'
  /** 选项列表 */
  options?: Array<{
    id: string
    text: string
    icon?: string
  }>
  /** 用户回答 */
  answer?: string
  /** 选中的选项 ID */
  selectedOptionId?: string
  /** 是否已回答 */
  answered: boolean
  /** 会话 ID */
  sessionId?: string
}

/**
 * 任务计划消息块 - 用于显示任务拆分和执行进度
 * 注意：状态类型扩展以兼容 TaskPlanStatus 和 TaskStepStatus 的别名
 */
export interface TaskPlanMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.TASK_PLAN
  /** 任务计划 ID */
  planId: string
  /** 任务标题 */
  title: string
  /** 任务描述 */
  description?: string
  /** 计划状态（兼容 TaskPlanStatus 类型） */
  planStatus: 'planning' | 'draft' | 'ready' | 'confirmed' | 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled'
  /** 任务步骤列表 */
  steps: Array<{
    id: string
    index: number
    description: string
    /** 步骤状态（兼容 TaskStepStatus 类型） */
    status: 'pending' | 'in_progress' | 'running' | 'executing' | 'completed' | 'failed' | 'skipped'
    resultSummary?: string
    error?: string
    expectedTools?: string[]
    sourceIssueId?: string
    sourceIssueText?: string
    issueType?: 'format' | 'content' | 'style' | 'structure' | 'other'
    locationHint?: string
    dependsOn?: string[]
  }>
  /** 当前步骤索引 */
  currentStepIndex: number
  /** 总步骤数 */
  totalSteps: number
  /** 已完成步骤数 */
  completedSteps: number
  /** 进度百分比 */
  progress: number
  /** 是否需要用户确认 */
  requiresConfirmation?: boolean
  /** 用户是否已确认 */
  userConfirmed?: boolean
}

/**
 * 消息块联合类型
 */
export type MessageBlock =
  | MainTextMessageBlock
  | ThinkingMessageBlock
  | ToolMessageBlock
  | CitationMessageBlock
  | ErrorMessageBlock
  | CodeMessageBlock
  | ImageMessageBlock
  | ClarificationMessageBlock
  | TaskPlanMessageBlock
  | BaseMessageBlock

/**
 * 消息接口
 */
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content?: string
  blocks: MessageBlock[]
  createdAt: string
  updatedAt?: string
  error?: boolean
  metadata?: Record<string, unknown>
  model?: {
    id: string
    name: string
    provider?: string
  }
}
