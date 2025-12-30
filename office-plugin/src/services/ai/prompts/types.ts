/**
 * 提示词模板类型定义
 */

export interface PromptTemplate {
  id: string
  content: string
  conditions?: string[]
  priority: number
  tokenCount?: number
}

/**
 * 基础意图类型（向后兼容）
 */
export enum IntentType {
  IMAGE_FORMATTING = 'image_formatting',
  TEXT_FORMATTING = 'text_formatting',
  TABLE_OPERATIONS = 'table_operations',
  MULTI_TASK = 'multi_task',
  SEARCH_REPLACE = 'search_replace',
  HYPERLINK_OPERATIONS = 'hyperlink_operations'
}

/**
 * 增强的意图类型（多轮对话支持）
 * 用于区分直接命令、模糊请求和对话控制
 */
export enum EnhancedIntentType {
  // ==================== 执行类意图 ====================
  /** 直接命令 - 可直接执行，如 "把标题加粗" */
  DIRECT_COMMAND = 'direct_command',
  /** 模糊请求 - 需要澄清，如 "帮我整理一下" */
  VAGUE_REQUEST = 'vague_request',
  /** 复杂任务 - 需要分解，如 "帮我制作一份专业简历" */
  COMPLEX_TASK = 'complex_task',
  
  // ==================== 查询类意图 ====================
  /** 查询 - 不需要执行操作，如 "这份文档有多少段落?" */
  QUERY = 'query',
  
  // ==================== 对话控制类意图 ====================
  /** 确认 - 用户确认，如 "好的"、"可以" */
  CONFIRMATION = 'confirmation',
  /** 否定 - 用户否定，如 "不对"、"不是" */
  NEGATION = 'negation',
  /** 修改 - 用户要求修改，如 "改成蓝色" */
  MODIFICATION = 'modification',
  /** 撤销请求 - 如 "撤销"、"恢复" */
  UNDO_REQUEST = 'undo_request',
  /** 取消请求 - 如 "取消"、"不要了" */
  CANCEL_REQUEST = 'cancel_request',
  /** 继续请求 - 如 "继续"、"下一步" */
  CONTINUE_REQUEST = 'continue_request',
  /** 暂停请求 - 如 "等一下"、"暂停" */
  PAUSE_REQUEST = 'pause_request'
}

export interface UserIntent {
  cleanedInput: string
  detectedIntent: IntentType
  requiredPromptLevel: 1 | 2 | 3
  confidence: number
}

/**
 * 增强的用户意图（多轮对话支持）
 */
export interface EnhancedUserIntent extends UserIntent {
  /** 增强意图类型 */
  enhancedType: EnhancedIntentType
  /** 是否需要澄清 */
  needsClarification: boolean
  /** 建议的澄清问题 */
  suggestedClarifications?: string[]
  /** 是否是对话控制指令 */
  isDialogControl: boolean
  /** 原始意图（如果是对上一轮的回复） */
  referencedIntent?: string
}

export interface PromptSelectionContext {
  selectionType: 'text' | 'image' | 'table' | 'none'
  toolCount: number
  userIntent: IntentType
  hasMultipleTasks: boolean
}