/**
 * PowerPoint 批注工具实现
 * 使用 Office.js API (PowerPointApi 1.2+) 实现批注操作
 *
 * ⚠️ 注意：PowerPoint Office.js API 对批注的支持有限
 * 部分功能可能需要使用 OOXML 操作或返回 API 限制提示
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 添加批注
 */
export async function pptAddComment(args: {
  slideIndex: number
  text: string
  position?: { x: number; y: number }
  author?: string
}): Promise<ToolResult> {
  try {
    return await PowerPoint.run(async (context) => {
      // PowerPoint Office.js API 对批注的支持有限
      // 返回 API 限制提示
      return {
        success: false,
        message: '⚠️ PowerPoint Office.js API 不支持直接添加批注。建议使用 PowerPoint 桌面应用程序的批注功能。',
        data: {
          apiLimitation: true,
          suggestion: '请使用 PowerPoint 桌面应用程序手动添加批注'
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `添加批注失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 获取所有批注
 */
export async function pptGetComments(args: {
  slideIndex?: number
  includeResolved?: boolean
}): Promise<ToolResult> {
  try {
    return await PowerPoint.run(async (context) => {
      return {
        success: false,
        message: '⚠️ PowerPoint Office.js API 不支持读取批注。建议使用 PowerPoint 桌面应用程序查看批注。',
        data: {
          apiLimitation: true,
          suggestion: '请使用 PowerPoint 桌面应用程序查看批注'
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: `获取批注失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 获取批注详情
 */
export async function pptGetCommentDetail(args: {
  commentId: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: '⚠️ PowerPoint Office.js API 不支持读取批注详情。',
    data: { apiLimitation: true }
  }
}

/**
 * 回复批注
 */
export async function pptReplyComment(args: {
  commentId: string
  text: string
  author?: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: '⚠️ PowerPoint Office.js API 不支持回复批注。',
    data: { apiLimitation: true }
  }
}

/**
 * 解决批注
 */
export async function pptResolveComment(args: {
  commentId: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: '⚠️ PowerPoint Office.js API 不支持解决批注。',
    data: { apiLimitation: true }
  }
}

/**
 * 重新打开批注
 */
export async function pptReopenComment(args: {
  commentId: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: '⚠️ PowerPoint Office.js API 不支持重新打开批注。',
    data: { apiLimitation: true }
  }
}

/**
 * 删除批注
 */
export async function pptDeleteComment(args: {
  commentId: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: '⚠️ PowerPoint Office.js API 不支持删除批注。',
    data: { apiLimitation: true }
  }
}

/**
 * 删除批注回复
 */
export async function pptDeleteCommentReply(args: {
  commentId: string
  replyId: string
}): Promise<ToolResult> {
  return {
    success: false,
    message: '⚠️ PowerPoint Office.js API 不支持删除批注回复。',
    data: { apiLimitation: true }
  }
}

/**
 * 删除所有批注
 */
export async function pptDeleteAllComments(args: {
  slideIndex?: number
}): Promise<ToolResult> {
  return {
    success: false,
    message: '⚠️ PowerPoint Office.js API 不支持删除所有批注。',
    data: { apiLimitation: true }
  }
}

/**
 * 导出批注工具定义
 */
export const pptCommentTools: ToolDefinition[] = [
  { name: 'ppt_add_comment', handler: pptAddComment, category: 'comment', description: '添加批注（API受限）' },
  { name: 'ppt_get_comments', handler: pptGetComments, category: 'comment', description: '获取所有批注（API受限）' },
  { name: 'ppt_get_comment_detail', handler: pptGetCommentDetail, category: 'comment', description: '获取批注详情（API受限）' },
  { name: 'ppt_reply_comment', handler: pptReplyComment, category: 'comment', description: '回复批注（API受限）' },
  { name: 'ppt_resolve_comment', handler: pptResolveComment, category: 'comment', description: '解决批注（API受限）' },
  { name: 'ppt_reopen_comment', handler: pptReopenComment, category: 'comment', description: '重新打开批注（API受限）' },
  { name: 'ppt_delete_comment', handler: pptDeleteComment, category: 'comment', description: '删除批注（API受限）' },
  { name: 'ppt_delete_comment_reply', handler: pptDeleteCommentReply, category: 'comment', description: '删除批注回复（API受限）' },
  { name: 'ppt_delete_all_comments', handler: pptDeleteAllComments, category: 'comment', description: '删除所有批注（API受限）' }
]
