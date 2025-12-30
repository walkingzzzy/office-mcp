/**
 * Word 冲突解决工具实现
 * 使用 Office.js API (WordApi 1.4+) 实现协作冲突管理
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 获取冲突列表
 */
export async function wordGetConflicts(args: {
  includeResolved?: boolean
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：冲突管理需要 WordApi BETA'
  }
}

/**
 * 获取冲突详情
 */
export async function wordGetConflictDetail(args: {
  conflictId: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：冲突管理需要 WordApi BETA'
  }
}

/**
 * 接受本地版本
 */
export async function wordAcceptLocalVersion(args: {
  conflictId: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：冲突管理需要 WordApi BETA'
  }
}

/**
 * 接受服务器版本
 */
export async function wordAcceptServerVersion(args: {
  conflictId: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：冲突管理需要 WordApi BETA'
  }
}

/**
 * 合并冲突
 */
export async function wordMergeConflict(args: {
  conflictId: string
  mergedContent: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：冲突管理需要 WordApi BETA'
  }
}

/**
 * 接受所有本地版本
 */
export async function wordAcceptAllLocalVersions(args: Record<string, never>): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：冲突管理需要 WordApi BETA'
  }
}

/**
 * 接受所有服务器版本
 */
export async function wordAcceptAllServerVersions(args: Record<string, never>): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：冲突管理需要 WordApi BETA'
  }
}

/**
 * 导出冲突工具定义
 */
export const conflictTools: ToolDefinition[] = [
  { name: 'word_get_conflicts', handler: wordGetConflicts, category: 'conflict', description: '获取冲突列表' },
  { name: 'word_get_conflict_detail', handler: wordGetConflictDetail, category: 'conflict', description: '获取冲突详情' },
  { name: 'word_accept_local_version', handler: wordAcceptLocalVersion, category: 'conflict', description: '接受本地版本' },
  { name: 'word_accept_server_version', handler: wordAcceptServerVersion, category: 'conflict', description: '接受服务器版本' },
  { name: 'word_merge_conflict', handler: wordMergeConflict, category: 'conflict', description: '合并冲突' },
  { name: 'word_accept_all_local_versions', handler: wordAcceptAllLocalVersions, category: 'conflict', description: '接受所有本地版本' },
  { name: 'word_accept_all_server_versions', handler: wordAcceptAllServerVersions, category: 'conflict', description: '接受所有服务器版本' }
]

