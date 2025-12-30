/**
 * PowerPoint MCP Server 压缩工具类型定义
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'

export type ToolCategory =
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

export type ApplicationType = 'powerpoint'

export interface ToolMetadata {
  version: string
  priority: 'P0' | 'P1' | 'P2'
  intentKeywords: string[]
  mergedTools: string[]
  supportedActions: string[]
}

export interface ToolExample {
  description: string
  input: Record<string, any>
  output: Record<string, any>
}

export interface ToolExecutionResult {
  success: boolean
  message?: string
  error?: string
  data?: any
  action?: string
}

export interface ToolDefinition extends Tool {
  category: ToolCategory
  application?: ApplicationType
  handler: (args: Record<string, any>) => Promise<ToolExecutionResult>
  metadata?: ToolMetadata
  examples?: ToolExample[]
}

/**
 * 验证 action 是否在支持列表中
 */
export function validateAction(action: string, supportedActions: string[]): boolean {
  return supportedActions.includes(action)
}

/**
 * 生成不支持的 action 错误
 */
export function unsupportedActionError(action: string, supportedActions: string[]): ToolExecutionResult {
  return {
    success: false,
    error: `不支持的操作: ${action}`,
    message: `支持的操作: ${supportedActions.join(', ')}`,
    action
  }
}
