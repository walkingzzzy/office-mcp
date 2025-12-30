/**
 * Word 注释工具实现
 * 使用 Office.js API (WordApi 1.7+) 实现墨迹注释功能
 * 注意：注释功能为 BETA 状态，API 可能变更
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 添加墨迹注释
 */
export async function wordAddInkAnnotation(args: {
  rangeStart: number
  rangeEnd: number
  inkData: string
  color?: string
  thickness?: number
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：墨迹注释需要 WordApi BETA'
  }
}

/**
 * 获取所有墨迹注释
 */
export async function wordGetInkAnnotations(args: Record<string, never>): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：获取墨迹注释需要 WordApi BETA'
  }
}

/**
 * 获取墨迹注释详情
 */
export async function wordGetInkAnnotationDetail(args: {
  annotationId: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：获取墨迹注释详情需要 WordApi BETA'
  }
}

/**
 * 删除墨迹注释
 */
export async function wordDeleteInkAnnotation(args: {
  annotationId: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：删除墨迹注释需要 WordApi BETA'
  }
}

/**
 * 删除所有墨迹注释
 */
export async function wordDeleteAllInkAnnotations(args: Record<string, never>): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：删除所有墨迹注释需要 WordApi BETA'
  }
}

/**
 * 更新墨迹注释
 */
export async function wordUpdateInkAnnotation(args: {
  annotationId: string
  color?: string
  thickness?: number
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：更新墨迹注释需要 WordApi BETA'
  }
}

/**
 * 导出注释工具定义
 */
export const annotationTools: ToolDefinition[] = [
  { name: 'word_add_ink_annotation', handler: wordAddInkAnnotation, category: 'annotation', description: '添加墨迹注释' },
  { name: 'word_get_ink_annotations', handler: wordGetInkAnnotations, category: 'annotation', description: '获取所有墨迹注释' },
  { name: 'word_get_ink_annotation_detail', handler: wordGetInkAnnotationDetail, category: 'annotation', description: '获取墨迹注释详情' },
  { name: 'word_delete_ink_annotation', handler: wordDeleteInkAnnotation, category: 'annotation', description: '删除墨迹注释' },
  { name: 'word_delete_all_ink_annotations', handler: wordDeleteAllInkAnnotations, category: 'annotation', description: '删除所有墨迹注释' },
  { name: 'word_update_ink_annotation', handler: wordUpdateInkAnnotation, category: 'annotation', description: '更新墨迹注释' }
]

