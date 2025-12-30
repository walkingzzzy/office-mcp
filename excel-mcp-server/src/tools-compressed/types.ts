/**
 * Excel 压缩工具类型定义
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'

export type ToolCategory =
  | 'cell'
  | 'format'
  | 'formula'
  | 'worksheet'
  | 'workbook'
  | 'data'
  | 'chart'
  | 'table'
  | 'pivot'
  | 'pivotTable'
  | 'pivotHierarchy'
  | 'validation'
  | 'dataValidation'
  | 'comment'
  | 'shape'
  | 'image'
  | 'slicer'
  | 'education'
  | 'conditionalFormat'
  | 'range'
  | 'print'

export type ApplicationType = 'excel'

export interface ToolMetadata {
  version: string
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  intentKeywords?: string[]
  applicableFor?: string[]
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
