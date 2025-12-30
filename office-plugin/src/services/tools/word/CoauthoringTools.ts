/**
 * Word 协作工具实现
 * 使用 Office.js API (WordApi 1.4+) 实现协作编辑功能
 * 注意：协作功能为 BETA 状态，API 可能变更
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 获取协作状态
 */
export async function wordGetCoauthoringStatus(args: Record<string, never>): Promise<ToolResult> {
  try {
    return await Word.run(async (context) => {
      const document = context.document
      document.load('saved')
      await context.sync()

      return {
        success: true,
        message: '成功获取协作状态',
        data: {
          isCoauthoring: false,
          note: 'Office.js API 限制：完整协作状态需要 WordApi BETA',
          isSaved: document.saved
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取协作状态失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取协作者列表
 */
export async function wordGetCoauthors(args: Record<string, never>): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：获取协作者列表需要 WordApi BETA'
  }
}

/**
 * 获取协作锁定区域
 */
export async function wordGetCoauthoringLocks(args: Record<string, never>): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：获取锁定区域需要 WordApi BETA'
  }
}

/**
 * 请求锁定区域
 */
export async function wordRequestCoauthoringLock(args: {
  rangeStart: number
  rangeEnd: number
  lockType?: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：请求锁定区域需要 WordApi BETA'
  }
}

/**
 * 释放锁定区域
 */
export async function wordReleaseCoauthoringLock(args: {
  lockId: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: 'Office.js API 限制：释放锁定区域需要 WordApi BETA'
  }
}

/**
 * 同步协作更改
 */
export async function wordSyncCoauthoringChanges(args: Record<string, never>): Promise<ToolResult> {
  try {
    return await Word.run(async (context) => {
      await context.sync()
      return {
        success: true,
        message: '已同步文档状态',
        data: {
          note: 'Office.js API 限制：完整协作同步需要 WordApi BETA'
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `同步失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 导出协作工具定义
 */
export const coauthoringTools: ToolDefinition[] = [
  { name: 'word_get_coauthoring_status', handler: wordGetCoauthoringStatus, category: 'coauthoring', description: '获取协作状态' },
  { name: 'word_get_coauthors', handler: wordGetCoauthors, category: 'coauthoring', description: '获取协作者列表' },
  { name: 'word_get_coauthoring_locks', handler: wordGetCoauthoringLocks, category: 'coauthoring', description: '获取锁定区域' },
  { name: 'word_request_coauthoring_lock', handler: wordRequestCoauthoringLock, category: 'coauthoring', description: '请求锁定区域' },
  { name: 'word_release_coauthoring_lock', handler: wordReleaseCoauthoringLock, category: 'coauthoring', description: '释放锁定区域' },
  { name: 'word_sync_coauthoring_changes', handler: wordSyncCoauthoringChanges, category: 'coauthoring', description: '同步协作更改' }
]

