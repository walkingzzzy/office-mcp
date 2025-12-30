/**
 * Type definitions for Office MCP Server - Phase 2 完善
 */

import type { JSONSchema7 } from 'json-schema'

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  success: boolean
  message?: string
  data?: any
  error?: string
  stack?: string
  timestamp?: number
  executionTime?: number
}

/**
 * Tool validation result
 */
export interface ValidationResult {
  valid: boolean
  errors?: string[]
}

/**
 * Tool metadata
 */
export interface ToolMetadata {
  name: string
  description: string
  category: 'word' | 'excel' | 'powerpoint' | 'common'
  version?: string
  deprecated?: boolean
  tags?: string[]
}

/**
 * Enhanced tool definition with validation
 */
export interface EnhancedToolDefinition {
  metadata: ToolMetadata
  inputSchema: JSONSchema7
  outputSchema?: JSONSchema7
  handler: (args: any) => Promise<ToolExecutionResult>
  validator?: (args: any) => ValidationResult
}

/**
 * Word tool arguments
 */
export interface WordAddParagraphArgs {
  text: string
  location?: 'start' | 'end'
  style?: string
}

export interface WordFormatTextArgs {
  searchText: string
  bold?: boolean
  italic?: boolean
  fontSize?: number
  color?: string
  underline?: boolean
}

export interface WordInsertTableArgs {
  rows: number
  columns: number
  location?: 'start' | 'end'
  data?: string[][]
}

/**
 * Excel tool arguments
 */
export interface ExcelSetCellValueArgs {
  cell: string
  value: string | number
  sheet?: string
}

export interface ExcelInsertChartArgs {
  dataRange: string
  chartType: 'ColumnClustered' | 'Line' | 'Pie' | 'BarClustered' | 'Area'
  title?: string
  sheet?: string
}

/**
 * PowerPoint tool arguments
 */
export interface PowerPointAddSlideArgs {
  layoutName?: 'blank' | 'title' | 'titleOnly' | 'titleAndBody' | 'twoColumns'
  index?: number
}

/**
 * IPC Command structure
 */
export interface IPCCommand {
  type: 'execute_tool' | 'health_check' | 'clear_cache'
  toolName: string
  args: any
  callId: string
  timestamp?: number
}

/**
 * IPC Response structure
 */
export interface IPCResponse {
  callId: string
  result?: ToolExecutionResult
  error?: string
  timestamp?: number
}

/**
 * Server configuration
 */
export interface ServerConfig {
  name: string
  version: string
  timeout: number
  maxRetries: number
  enableMetrics: boolean
  enableHealthCheck: boolean
}
