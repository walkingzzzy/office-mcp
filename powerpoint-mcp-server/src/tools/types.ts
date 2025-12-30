/**
 * PowerPoint 工具类型定义
 * 支持压缩版工具和原始工具的类型兼容性
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'

export type ToolCategory =
  // 应用级类别
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'common'
  // 压缩工具类别
  | 'slide'
  | 'shape'
  | 'media'
  | 'animation'
  | 'master'
  | 'customLayout'
  | 'notes'
  | 'hyperlink'
  | 'export'
  | 'comment'
  | 'slideshowSettings'
  | 'mediaPlayback'
  | 'education'
  // 原始类别（兼容性）
  | 'track_changes'
  | 'annotation'
  | 'canvas'
  | 'coauthoring'
  | 'conflict'
  | 'document'
  | 'field'
  | 'layout'
  | 'slideshow'
  | 'table'

export type ApplicationType = 'word' | 'excel' | 'powerpoint' | 'common'

export interface ToolMetadata {
  version?: string
  author?: string
  tags?: string[]
  deprecated?: boolean
  experimental?: boolean
  scenario?: string
  contextTip?: string
  audience?: string
  intentKeywords?: string[]
  applicableFor?: Array<'text' | 'image' | 'table' | 'none'> | string[]
  documentTypes?: ToolCategory[]
  priority?: 'P0' | 'P1' | 'P2' | 'P3'
  mergedTools?: string[]
  supportedActions?: string[]
}

export interface ToolExample {
  description: string
  input: Record<string, any>
  output: Record<string, any>
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
  error?: string
  data?: any
  action?: string
  stack?: string
  metadata?: {
    executionTime?: number
    memoryUsage?: number
    timestamp?: number
  }
}

export interface ToolValidationError {
  field: string
  message: string
  value?: any
}

export interface ToolValidationResult {
  valid: boolean
  errors: ToolValidationError[]
}

/**
 * 验证 action 是否在支持列表中
 */
export function validateAction(action: string, supportedActions: string[]): boolean {
  return supportedActions.includes(action)
}

/**
 * 生成不支持的 action 错误响应
 */
export function unsupportedActionError(action: string, supportedActions: string[]): ToolExecutionResult {
  return {
    success: false,
    error: `不支持的操作: ${action}`,
    message: `支持的操作: ${supportedActions.join(', ')}`,
    action
  }
}
