/**
 * Word 批注工具实现
 * 使用 Office.js API (WordApi 1.4+) 实现批注操作
 * P1 阶段功能
 */

import type { ToolDefinition, ToolResult } from '../types'

/**
 * 添加批注
 */
export async function wordAddComment(args: {
  text?: string
  comment: string
  author?: string
}): Promise<ToolResult> {
  const { text, comment, author } = args

  try {
    return await Word.run(async (context) => {
      let range: Word.Range

      if (text) {
        // 搜索指定文本并添加批注
        const searchResults = context.document.body.search(text, { matchCase: false })
        searchResults.load('items')
        await context.sync()

        if (searchResults.items.length === 0) {
          return {
            success: false,
            message: `未找到文本: ${text}`
          }
        }

        range = searchResults.items[0]
      } else {
        // 在当前选区添加批注
        range = context.document.getSelection()
      }

      // 使用 WordApi 1.4+ 的批注功能
      const commentObj = range.insertComment(comment)

      // 注意：authorName 是只读属性，由系统自动设置

      commentObj.load('id, content, authorName, creationDate')
      await context.sync()

      return {
        success: true,
        message: `成功添加批注`,
        data: {
          id: commentObj.id,
          content: commentObj.content,
          author: commentObj.authorName,
          date: commentObj.creationDate
        }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `添加批注失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取所有批注
 */
export async function wordGetComments(args: {
  includeResolved?: boolean
}): Promise<ToolResult> {
  const { includeResolved = false } = args

  try {
    return await Word.run(async (context) => {
      const comments = context.document.body.getComments()
      comments.load('items')
      await context.sync()

      const commentList: Array<{
        id: string
        content: string
        author: string
        date: string
        resolved: boolean
        replies: number
      }> = []

      for (const comment of comments.items) {
        comment.load('id, content, authorName, creationDate, resolved, replies')
        await context.sync()

        // 根据 includeResolved 参数过滤
        if (!includeResolved && comment.resolved) {
          continue
        }

        commentList.push({
          id: comment.id,
          content: comment.content,
          author: comment.authorName,
          date: comment.creationDate.toISOString(),
          resolved: comment.resolved,
          replies: comment.replies.items.length
        })
      }

      return {
        success: true,
        message: `成功获取 ${commentList.length} 条批注`,
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
      message: `获取批注失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 回复批注
 */
export async function wordReplyComment(args: {
  commentId: string
  reply: string
  author?: string
}): Promise<ToolResult> {
  const { commentId, reply, author } = args

  try {
    return await Word.run(async (context) => {
      const comments = context.document.body.getComments()
      comments.load('items')
      await context.sync()

      let targetComment: Word.Comment | null = null

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
          message: `未找到批注: ${commentId}`
        }
      }

      // 添加回复
      const replyObj = targetComment.reply(reply)

      // 注意：authorName 是只读属性，由系统自动设置

      replyObj.load('id, content, authorName, creationDate')
      await context.sync()

      return {
        success: true,
        message: `成功回复批注`,
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
      message: `回复批注失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 解决批注
 */
export async function wordResolveComment(args: {
  commentId: string
}): Promise<ToolResult> {
  const { commentId } = args

  try {
    return await Word.run(async (context) => {
      const comments = context.document.body.getComments()
      comments.load('items')
      await context.sync()

      let targetComment: Word.Comment | null = null

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
          message: `未找到批注: ${commentId}`
        }
      }

      // 标记为已解决
      targetComment.resolved = true
      await context.sync()

      return {
        success: true,
        message: `成功解决批注`,
        data: { commentId }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `解决批注失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 删除批注
 */
export async function wordDeleteComment(args: {
  commentId: string
}): Promise<ToolResult> {
  const { commentId } = args

  try {
    return await Word.run(async (context) => {
      const comments = context.document.body.getComments()
      comments.load('items')
      await context.sync()

      let targetComment: Word.Comment | null = null

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
          message: `未找到批注: ${commentId}`
        }
      }

      // 删除批注
      targetComment.delete()
      await context.sync()

      return {
        success: true,
        message: `成功删除批注`,
        data: { commentId }
      }
    })
  } catch (error: unknown) {
    const err = error as Error
    return {
      success: false,
      message: `删除批注失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 获取批注详情
 */
export async function wordGetCommentDetail(args: {
  commentId: string
}): Promise<ToolResult> {
  const { commentId } = args

  try {
    return await Word.run(async (context) => {
      const comments = context.document.body.getComments()
      comments.load('items')
      await context.sync()

      let targetComment: Word.Comment | null = null

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
          message: `未找到批注: ${commentId}`
        }
      }

      // 加载批注详情
      targetComment.load('id, content, authorName, creationDate, resolved, replies')
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
        message: `成功获取批注详情`,
        data: {
          id: targetComment.id,
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
      message: `获取批注详情失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 导出批注工具定义
 */
export const commentTools: ToolDefinition[] = [
  { name: 'word_add_comment', handler: wordAddComment, category: 'text', description: '添加批注' },
  { name: 'word_get_comments', handler: wordGetComments, category: 'text', description: '获取所有批注' },
  { name: 'word_reply_comment', handler: wordReplyComment, category: 'text', description: '回复批注' },
  { name: 'word_resolve_comment', handler: wordResolveComment, category: 'text', description: '解决批注' },
  { name: 'word_delete_comment', handler: wordDeleteComment, category: 'text', description: '删除批注' },
  { name: 'word_get_comment_detail', handler: wordGetCommentDetail, category: 'text', description: '获取批注详情' }
]
