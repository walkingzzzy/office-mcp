/**
 * Word 压缩工具类型定义
 * 支持 Action 参数模式的统一工具接口
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'

export type ToolCategory =
  | 'word'
  | 'document'
  | 'text'
  | 'paragraph'
  | 'formatting'
  | 'style'
  | 'table'
  | 'image'
  | 'page'
  | 'reference'
  | 'collaboration'
  | 'education'
  | 'shape'
  | 'canvas'
  | 'chart'
  | 'annotation'
  | 'bookmark'
  | 'field'
  | 'headerFooter'
  | 'advanced'
  | 'coauthoring'
  | 'conflict'
  | 'trackChanges'
  | 'contentControl'
  | 'comment'
  | 'read'

export type ApplicationType = 'word'

export interface ToolExample {
  description: string
  input: Record<string, any>
  output: Record<string, any>
}

export interface ToolMetadata {
  version?: string
  priority?: 'P0' | 'P1' | 'P2'
  intentKeywords?: string[]
  applicableFor?: Array<'text' | 'image' | 'table' | 'none'>
  documentTypes?: string[]
  scenario?: string
  contextTip?: string
  /** 合并的原工具列表 */
  mergedTools?: string[]
  /** 支持的 action 列表 */
  supportedActions?: string[]
}

export interface ToolDefinition extends Tool {
  category: ToolCategory
  application?: ApplicationType
  handler: (args: Record<string, any>) => Promise<any>
  metadata?: ToolMetadata
  examples?: ToolExample[]
}

export interface ToolExecutionResult {
  success: boolean
  message?: string
  data?: any
  error?: string
  action?: string
}

/** Action 参数基础接口 */
export interface ActionBasedInput {
  action: string
  [key: string]: any
}

/** 验证 action 是否在支持列表中 */
export function validateAction(action: string, supportedActions: string[]): boolean {
  return supportedActions.includes(action)
}

/** 创建 action 不支持的错误响应 */
export function unsupportedActionError(action: string, supportedActions: string[]): ToolExecutionResult {
  return {
    success: false,
    error: `不支持的操作: ${action}`,
    message: `支持的操作: ${supportedActions.join(', ')}`,
    action
  }
}
