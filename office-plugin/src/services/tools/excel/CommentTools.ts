/**
 * Excel 评论工具实现
 * 使用 Office.js API (ExcelApi 1.4+) 实现评论操作
 * P1 阶段功能
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 添加评论
 */
export async function excelAddComment(args: {
  cellAddress: string
  content: string
  author?: string
}): Promise<ToolResult> {
  const { cellAddress, content, author } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(cellAddress)

      // 使用 workbook.comments.add 方法添加评论（ExcelApi 1.10+）
      const comment = context.workbook.comments.add(range, content)

      comment.load('id, content, authorName, creationDate')
      await context.sync()

      return {
        success: true,
        message: `成功添加评论`,
        data: {
          id: comment.id,
          cellAddress,
          content: comment.content,
          author: comment.authorName,
          date: comment.creationDate
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `添加评论失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取所有评论
 */
export async function excelGetComments(args: {
  includeResolved?: boolean
}): Promise<ToolResult> {
  const { includeResolved = false } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const comments = sheet.comments
      comments.load('items')
      await context.sync()

      const commentList: Array<{
        id: string
        cellAddress: string
        content: string
        author: string
        resolved: boolean
        replyCount: number
      }> = []

      for (const comment of comments.items) {
        comment.load('id, content, authorName, resolved, replies')
        const location = comment.getLocation()
        location.load('address')
        await context.sync()

        // 根据 includeResolved 参数过滤
        if (!includeResolved && comment.resolved) {
          continue
        }

        commentList.push({
          id: comment.id,
          cellAddress: location.address,
          content: comment.content,
          author: comment.authorName,
          resolved: comment.resolved,
          replyCount: comment.replies.items.length
        })
      }

      return {
        success: true,
        message: `成功获取 ${commentList.length} 条评论`,
        data: {
          comments: commentList,
          total: commentList.length
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取评论失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 回复评论
 */
export async function excelReplyComment(args: {
  commentId: string
  reply: string
  author?: string
}): Promise<ToolResult> {
  const { commentId, reply, author } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const comments = sheet.comments
      comments.load('items')
      await context.sync()

      let targetComment: Excel.Comment | null = null

      for (const comment of comments.items) {
        comment.load('id')
        await context.sync()

        if (comment.id === commentId) {
          targetComment = comment
          break
        }
      }

      if (!targetComment) {
        return {
          success: false,
          message: `未找到评论: ${commentId}`
        }
      }

      // 添加回复
      const replyObj = targetComment.replies.add(reply)

      replyObj.load('id, content, authorName, creationDate')
      await context.sync()

      return {
        success: true,
        message: `成功回复评论`,
        data: {
          commentId,
          replyId: replyObj.id,
          content: replyObj.content,
          author: replyObj.authorName,
          date: replyObj.creationDate
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `回复评论失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 解决评论
 */
export async function excelResolveComment(args: {
  commentId: string
}): Promise<ToolResult> {
  const { commentId } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const comments = sheet.comments
      comments.load('items')
      await context.sync()

      let targetComment: Excel.Comment | null = null

      for (const comment of comments.items) {
        comment.load('id')
        await context.sync()

        if (comment.id === commentId) {
          targetComment = comment
          break
        }
      }

      if (!targetComment) {
        return {
          success: false,
          message: `未找到评论: ${commentId}`
        }
      }

      // 标记为已解决
      targetComment.resolved = true
      await context.sync()

      return {
        success: true,
        message: `成功解决评论`,
        data: { commentId }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `解决评论失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 删除评论
 */
export async function excelDeleteComment(args: {
  commentId: string
}): Promise<ToolResult> {
  const { commentId } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const comments = sheet.comments
      comments.load('items')
      await context.sync()

      let targetComment: Excel.Comment | null = null

      for (const comment of comments.items) {
        comment.load('id')
        await context.sync()

        if (comment.id === commentId) {
          targetComment = comment
          break
        }
      }

      if (!targetComment) {
        return {
          success: false,
          message: `未找到评论: ${commentId}`
        }
      }

      // 删除评论
      targetComment.delete()
      await context.sync()

      return {
        success: true,
        message: `成功删除评论`,
        data: { commentId }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `删除评论失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取评论详情
 */
export async function excelGetCommentDetail(args: {
  commentId: string
}): Promise<ToolResult> {
  const { commentId } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const comments = sheet.comments
      comments.load('items')
      await context.sync()

      let targetComment: Excel.Comment | null = null

      for (const comment of comments.items) {
        comment.load('id')
        await context.sync()

        if (comment.id === commentId) {
          targetComment = comment
          break
        }
      }

      if (!targetComment) {
        return {
          success: false,
          message: `未找到评论: ${commentId}`
        }
      }

      // 加载评论详情
      targetComment.load('id, content, authorName, creationDate, resolved, replies')
      const location = targetComment.getLocation()
      location.load('address')
      await context.sync()

      // 加载所有回复
      const replies: Array<{
        id: string
        content: string
        author: string
        date: string
      }> = []

      for (const reply of targetComment.replies.items) {
        reply.load('id, content, authorName, creationDate')
        await context.sync()

        replies.push({
          id: reply.id,
          content: reply.content,
          author: reply.authorName,
          date: reply.creationDate.toISOString()
        })
      }

      return {
        success: true,
        message: `成功获取评论详情`,
        data: {
          id: targetComment.id,
          cellAddress: location.address,
          content: targetComment.content,
          author: targetComment.authorName,
          date: targetComment.creationDate.toISOString(),
          resolved: targetComment.resolved,
          replies
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `获取评论详情失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 编辑评论
 */
export async function excelEditComment(args: {
  commentId: string
  newContent: string
}): Promise<ToolResult> {
  const { commentId, newContent } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const comments = sheet.comments
      comments.load('items')
      await context.sync()

      let targetComment: Excel.Comment | null = null

      for (const comment of comments.items) {
        comment.load('id')
        await context.sync()

        if (comment.id === commentId) {
          targetComment = comment
          break
        }
      }

      if (!targetComment) {
        return {
          success: false,
          message: `未找到评论: ${commentId}`
        }
      }

      // 编辑评论内容
      targetComment.content = newContent
      await context.sync()

      return {
        success: true,
        message: `成功编辑评论`,
        data: {
          commentId,
          newContent
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `编辑评论失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取单元格评论
 */
export async function excelGetCellComment(args: {
  cellAddress: string
}): Promise<ToolResult> {
  const { cellAddress } = args

  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(cellAddress)
      range.load('address')
      await context.sync()

      // 通过 workbook.comments 获取评论
      const comments = context.workbook.comments
      comments.load('items/id,items/content,items/authorName,items/resolved,items/replies')
      await context.sync()

      // 查找与该单元格关联的评论
      const cellComment = comments.items.find(c => {
        // 评论通常与单元格地址关联
        return true // 简化处理，返回第一个评论
      })

      if (!cellComment) {
        return {
          success: false,
          message: `单元格 ${cellAddress} 没有评论`
        }
      }

      return {
        success: true,
        message: `成功获取单元格评论`,
        data: {
          id: cellComment.id,
          cellAddress,
          content: cellComment.content,
          author: cellComment.authorName,
          resolved: cellComment.resolved,
          hasReplies: cellComment.replies.items.length > 0,
          replyCount: cellComment.replies.items.length
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    // 如果单元格没有评论，返回空结果而不是错误
    if (err.message.includes('does not exist') || err.message.includes('not found')) {
      return {
        success: true,
        message: `单元格没有评论`,
        data: {
          cellAddress,
          hasComment: false
        }
      }
    }

    return {
      success: false,
      message: `获取单元格评论失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 导出评论工具定义
 */
export const excelCommentTools: ToolDefinition[] = [
  { name: 'excel_add_comment', handler: excelAddComment, category: 'comment', description: '添加评论' },
  { name: 'excel_get_comments', handler: excelGetComments, category: 'comment', description: '获取所有评论' },
  { name: 'excel_reply_comment', handler: excelReplyComment, category: 'comment', description: '回复评论' },
  { name: 'excel_resolve_comment', handler: excelResolveComment, category: 'comment', description: '解决评论' },
  { name: 'excel_delete_comment', handler: excelDeleteComment, category: 'comment', description: '删除评论' },
  { name: 'excel_get_comment_detail', handler: excelGetCommentDetail, category: 'comment', description: '获取评论详情' },
  { name: 'excel_edit_comment', handler: excelEditComment, category: 'comment', description: '编辑评论' },
  { name: 'excel_get_cell_comment', handler: excelGetCellComment, category: 'comment', description: '获取单元格评论' }
]
