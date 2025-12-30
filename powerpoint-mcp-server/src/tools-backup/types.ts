/**
 * Tool Definition Types - Phase 2 完善
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { ToolResult } from '../utils/ToolErrorHandler.js'

export type ToolCategory =
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'common'
  | 'track_changes'
  | 'annotation'
  | 'canvas'
  | 'coauthoring'
  | 'comment'
  | 'conditional_format'
  | 'conflict'
  | 'document'
  | 'education'
  | 'field'
  | 'layout'
  | 'pivot'
  | 'pivot_table'
  | 'shape'
  | 'slicer'
  | 'slideshow'
  | 'table'

export type ApplicationType = 'word' | 'excel' | 'powerpoint' | 'common'

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
  applicableFor?: Array<'text' | 'image' | 'table' | 'none'>
  documentTypes?: ToolCategory[]
  priority?: 'P0' | 'P1' | 'P2'
}

export interface ToolExecutionResult {
  success: boolean
  message?: string
  data?: any
  error?: string
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
