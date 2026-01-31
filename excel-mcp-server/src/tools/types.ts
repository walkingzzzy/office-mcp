/**
 * Excel 工具类型定义
 * 支持压缩版工具和原始工具的类型兼容性
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
// 从 shared 包导入工具工厂函数
export { validateAction, unsupportedActionError } from '@office-mcp/shared'

export type ToolCategory =
  // 应用级类别
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'common'
  // 压缩工具类别
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
  // 原始类别（兼容性）
  | 'track_changes'
  | 'annotation'
  | 'canvas'
  | 'coauthoring'
  | 'conditional_format'
  | 'conflict'
  | 'document'
  | 'field'
  | 'layout'
  | 'pivot_table'
  | 'slideshow'

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
  supportedActions?: readonly string[]
}

export interface ToolExample {
  description: string
  input: Record<string, any>
  output: Record<string, any>
}

export interface ToolDefinition extends Tool {
  category?: ToolCategory
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
