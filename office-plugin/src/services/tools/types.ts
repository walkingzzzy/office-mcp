/**
 * Office 工具处理器类型定义
 */

import type { FunctionResult } from '../ai/types'

/**
 * 工具执行结果类型
 * 用于替代 { success: boolean; message: string; data?: any }
 */
export interface ToolResult {
  success: boolean
  message: string
  data?: Record<string, unknown>
}

/**
 * 工具处理函数类型
 */
export type ToolHandler = (args: Record<string, unknown>) => Promise<FunctionResult>

/**
 * 工具分类类型
 */
export type ToolCategory =
  | 'text'
  | 'read'
  | 'formatting'
  | 'table'
  | 'image'
  | 'selection'
  | 'style'
  | 'hyperlink'
  | 'chart'
  | 'worksheet'
  | 'slide'
  | 'shape'
  | 'media'
  | 'animation'
  // Word 扩展类别
  | 'word'
  | 'document'
  | 'canvas'
  | 'coauthoring'
  | 'conflict'
  | 'annotation'
  | 'comment'
  | 'trackChanges'
  | 'field'
  | 'bookmark'
  | 'save'
  | 'headerFooter'
  | 'pageSetup'
  | 'contentControl'
  // Excel 扩展类别
  | 'excel'
  | 'cell'
  | 'formula'
  | 'data'
  | 'pivotTable'
  | 'pivotHierarchy'
  | 'conditionalFormat'
  | 'dataValidation'
  | 'slicer'
  | 'tableEnhanced'
  | 'pivot'
  // PowerPoint 扩展类别
  | 'powerpoint'
  | 'master'
  | 'notes'
  | 'export'
  | 'layout'
  | 'slideshow'
  | 'education'

/**
 * 工具定义
 */
export interface ToolDefinition {
  /** 工具名称 */
  name: string
  /** 工具处理函数 */
  handler: ToolHandler
  /** 工具分类 */
  category: ToolCategory
  /** 工具描述（可选） */
  description?: string
}

/**
 * 工具注册表
 */
export type ToolRegistry = Map<string, ToolHandler>

/**
 * 创建成功结果的辅助函数
 */
export function successResult(message: string, data?: Record<string, unknown>): FunctionResult {
  return { success: true, message, data }
}

/**
 * 创建失败结果的辅助函数
 */
export function errorResult(message: string, error?: Error): FunctionResult {
  return { success: false, message, error }
}

// ==================== 类型安全的参数提取辅助函数 ====================

/**
 * 从 args 中提取字符串参数
 */
export function getString(args: Record<string, unknown>, key: string, defaultValue?: string): string {
  const value = args[key]
  if (value === undefined || value === null) {
    return defaultValue ?? ''
  }
  return String(value)
}

/**
 * 从 args 中提取可选字符串参数
 */
export function getOptionalString(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key]
  if (value === undefined || value === null) {
    return undefined
  }
  return String(value)
}

/**
 * 从 args 中提取数字参数
 */
export function getNumber(args: Record<string, unknown>, key: string, defaultValue: number = 0): number {
  const value = args[key]
  if (value === undefined || value === null) {
    return defaultValue
  }
  const num = Number(value)
  return isNaN(num) ? defaultValue : num
}

/**
 * 从 args 中提取布尔参数
 */
export function getBoolean(args: Record<string, unknown>, key: string, defaultValue: boolean = false): boolean {
  const value = args[key]
  if (value === undefined || value === null) {
    return defaultValue
  }
  return Boolean(value)
}

/**
 * 从 args 中提取数组参数
 */
export function getArray<T = unknown>(args: Record<string, unknown>, key: string, defaultValue: T[] = []): T[] {
  const value = args[key]
  if (!Array.isArray(value)) {
    return defaultValue
  }
  return value as T[]
}

/**
 * 格式化错误消息
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

