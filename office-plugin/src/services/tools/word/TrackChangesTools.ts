/**
 * Word 修订跟踪工具实现
 * 使用 Office.js API (WordApi 1.4+) 实现修订跟踪操作
 * P1 阶段功能
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 启用修订跟踪
 */
export async function wordEnableTrackChanges(args: {}): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    return await Word.run(async (context) => {
      const document = context.document
      document.changeTrackingMode = Word.ChangeTrackingMode.trackAll
      await context.sync()

      return {
        success: true,
        message: '成功启用修订跟踪',
        data: { enabled: true }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `启用修订跟踪失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 禁用修订跟踪
 */
export async function wordDisableTrackChanges(args: {}): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    return await Word.run(async (context) => {
      const document = context.document
      document.changeTrackingMode = Word.ChangeTrackingMode.off
      await context.sync()

      return {
        success: true,
        message: '成功禁用修订跟踪',
        data: { enabled: false }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `禁用修订跟踪失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取修订跟踪状态
 */
export async function wordGetTrackChangesStatus(args: {}): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    return await Word.run(async (context) => {
      const document = context.document
      document.load('changeTrackingMode')
      await context.sync()

      const enabled = document.changeTrackingMode === Word.ChangeTrackingMode.trackAll

      return {
        success: true,
        message: enabled ? '修订跟踪已启用' : '修订跟踪已禁用',
        data: { enabled }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取修订跟踪状态失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取所有修订
 */
export async function wordGetTrackChanges(args: {
  includeAccepted?: boolean
  includeRejected?: boolean
}): Promise<ToolResult> {
  const { includeAccepted = false, includeRejected = false } = args

  try {
    return await Word.run(async (context) => {
      const trackedChanges = context.document.body.getTrackedChanges()
      trackedChanges.load('items')
      await context.sync()

      const changes: Array<{
        id: string
        type: string
        text: string
        author: string
        date: string
      }> = []

      for (let i = 0; i < trackedChanges.items.length; i++) {
        const change = trackedChanges.items[i]
        // 注意：TrackedChange 没有 id 和 state 属性
        change.load('type, text, author, date')
        await context.sync()

        changes.push({
          id: `change_${i}`,
          type: change.type,
          text: change.text,
          author: change.author,
          date: change.date.toISOString()
        })
      }

      return {
        success: true,
        message: `成功获取 ${changes.length} 条修订`,
        data: {
          changes,
          total: changes.length
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取修订失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 接受修订
 */
export async function wordAcceptTrackChange(args: {
  changeId: string
}): Promise<ToolResult> {
  const { changeId } = args

  try {
    return await Word.run(async (context) => {
      const trackedChanges = context.document.body.getTrackedChanges()
      trackedChanges.load('items')
      await context.sync()

      // 解析 changeId 获取索引
      const match = changeId.match(/change_(\d+)/)
      if (!match) {
        return {
          success: false,
          message: `无效的修订ID格式: ${changeId}`
        }
      }
      const index = parseInt(match[1], 10)

      if (index < 0 || index >= trackedChanges.items.length) {
        return {
          success: false,
          message: `未找到修订: ${changeId}`
        }
      }

      const targetChange = trackedChanges.items[index]

      // 接受修订
      targetChange.accept()
      await context.sync()

      return {
        success: true,
        message: `成功接受修订`,
        data: { changeId }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `接受修订失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 拒绝修订
 */
export async function wordRejectTrackChange(args: {
  changeId: string
}): Promise<ToolResult> {
  const { changeId } = args

  try {
    return await Word.run(async (context) => {
      const trackedChanges = context.document.body.getTrackedChanges()
      trackedChanges.load('items')
      await context.sync()

      // 解析 changeId 获取索引
      const match = changeId.match(/change_(\d+)/)
      if (!match) {
        return {
          success: false,
          message: `无效的修订ID格式: ${changeId}`
        }
      }
      const index = parseInt(match[1], 10)

      if (index < 0 || index >= trackedChanges.items.length) {
        return {
          success: false,
          message: `未找到修订: ${changeId}`
        }
      }

      const targetChange = trackedChanges.items[index]

      // 拒绝修订
      targetChange.reject()
      await context.sync()

      return {
        success: true,
        message: `成功拒绝修订`,
        data: { changeId }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `拒绝修订失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 接受所有修订
 */
export async function wordAcceptAllTrackChanges(args: {}): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    return await Word.run(async (context) => {
      const trackedChanges = context.document.body.getTrackedChanges()
      trackedChanges.load('items')
      await context.sync()

      let acceptedCount = 0

      for (const change of trackedChanges.items) {
        change.accept()
        acceptedCount++
      }

      await context.sync()

      return {
        success: true,
        message: `成功接受 ${acceptedCount} 条修订`,
        data: { count: acceptedCount }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `接受所有修订失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 拒绝所有修订
 */
export async function wordRejectAllTrackChanges(args: {}): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    return await Word.run(async (context) => {
      const trackedChanges = context.document.body.getTrackedChanges()
      trackedChanges.load('items')
      await context.sync()

      let rejectedCount = 0

      for (const change of trackedChanges.items) {
        change.reject()
        rejectedCount++
      }

      await context.sync()

      return {
        success: true,
        message: `成功拒绝 ${rejectedCount} 条修订`,
        data: { count: rejectedCount }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `拒绝所有修订失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 导出修订跟踪工具定义
 */
export const trackChangesTools: ToolDefinition[] = [
  { name: 'word_enable_track_changes', handler: wordEnableTrackChanges, category: 'text', description: '启用修订跟踪' },
  { name: 'word_disable_track_changes', handler: wordDisableTrackChanges, category: 'text', description: '禁用修订跟踪' },
  { name: 'word_get_track_changes_status', handler: wordGetTrackChangesStatus, category: 'text', description: '获取修订跟踪状态' },
  { name: 'word_get_track_changes', handler: wordGetTrackChanges, category: 'text', description: '获取所有修订' },
  { name: 'word_accept_track_change', handler: wordAcceptTrackChange, category: 'text', description: '接受修订' },
  { name: 'word_reject_track_change', handler: wordRejectTrackChange, category: 'text', description: '拒绝修订' },
  { name: 'word_accept_all_track_changes', handler: wordAcceptAllTrackChanges, category: 'text', description: '接受所有修订' },
  { name: 'word_reject_all_track_changes', handler: wordRejectAllTrackChanges, category: 'text', description: '拒绝所有修订' }
]
