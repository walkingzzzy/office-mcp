/**
 * 文本差异计算工具
 * 使用 diff-match-patch 库计算文本差异，生成 Diff 列表
 */

import DiffMatchPatch from 'diff-match-patch'

import type { DiffItem, DiffResult } from '../types/word'
import Logger from './logger'

const logger = new Logger('DiffUtils')

// 创建 diff-match-patch 实例
const dmp = new DiffMatchPatch()

/**
 * 计算两段文本的差异
 * @param originalText 原始文本
 * @param modifiedText 修改后的文本
 * @param options 选项
 */
export function calculateDiff(
  originalText: string,
  modifiedText: string,
  options: {
    contextLines?: number
    mergeSimilar?: boolean
  } = {}
): DiffResult {
  const operationId = `calc-diff-${Date.now()}`
  logger.info(`[${operationId}] Calculating diff`, {
    originalLength: originalText.length,
    modifiedLength: modifiedText.length,
    options
  })

  const startTime = Date.now()

  // 使用 diff-match-patch 计算差异
  const diffs = dmp.diff_main(originalText, modifiedText)

  // 优化差异（合并相似的差异）
  if (options.mergeSimilar !== false) {
    dmp.diff_cleanupSemantic(diffs)
  }

  // 转换为 DiffItem 格式
  const diffItems: DiffItem[] = []
  let insertions = 0
  let deletions = 0
  let unchanged = 0
  let currentPosition = 0

  for (let i = 0; i < diffs.length; i++) {
    const [operation, text] = diffs[i]
    const diffId = `diff-${Date.now()}-${i}`

    // 计算上下文
    const context = extractContext(originalText, currentPosition, text.length, options.contextLines || 30)

    let type: 'insert' | 'delete' | 'equal'
    switch (operation) {
      case DiffMatchPatch.DIFF_INSERT:
        type = 'insert'
        insertions += text.length
        break
      case DiffMatchPatch.DIFF_DELETE:
        type = 'delete'
        deletions += text.length
        currentPosition += text.length
        break
      case DiffMatchPatch.DIFF_EQUAL:
        type = 'equal'
        unchanged += text.length
        currentPosition += text.length
        break
      default:
        type = 'equal'
    }

    // 只添加插入和删除的差异项（忽略 equal）
    if (type !== 'equal') {
      diffItems.push({
        id: diffId,
        type,
        content: text,
        text,
        context,
        position: i, // 添加必需的 position 属性
        applied: false,
        status: 'pending'
      })
    }
  }

  const duration = Date.now() - startTime

  logger.info(`[${operationId}] Diff calculation completed`, {
    diffCount: diffItems.length,
    insertions,
    deletions,
    unchanged,
    durationMs: duration
  })

  return {
    changes: diffItems,
    diffs: diffItems,
    totalChanges: diffItems.length,
    hasChanges: diffItems.length > 0,
    statistics: {
      insertions,
      deletions,
      modifications: 0,
      total: diffItems.length,
      applied: false,
      unchanged: unchanged > 0
    },
    originalText
  }
}

/**
 * 提取差异的上下文（前后文本）
 */
function extractContext(
  text: string,
  position: number,
  length: number,
  contextChars: number = 30
): { before: string; after: string } {
  const beforeStart = Math.max(0, position - contextChars)
  const beforeText = text.slice(beforeStart, position)

  const afterEnd = Math.min(text.length, position + length + contextChars)
  const afterText = text.slice(position + length, afterEnd)

  return {
    before: beforeText.trim(),
    after: afterText.trim()
  }
}

/**
 * 合并相邻的相同类型差异
 * @param diffs 差异列表
 */
export function mergeSimilarDiffs(diffs: DiffItem[]): DiffItem[] {
  if (diffs.length === 0) return diffs

  const merged: DiffItem[] = []
  let current = { ...diffs[0] }

  for (let i = 1; i < diffs.length; i++) {
    const next = diffs[i]

    // 如果类型相同且文本连续，合并
    if (current.type === next.type && shouldMerge(current.text, next.text)) {
      current.text += next.text
      current.id = `${current.id}-merged`
    } else {
      merged.push(current)
      current = { ...next }
    }
  }

  merged.push(current)

  logger.debug('Merged similar diffs', {
    originalCount: diffs.length,
    mergedCount: merged.length
  })

  return merged
}

/**
 * 判断两个文本是否应该合并
 */
function shouldMerge(text1: string, text2: string): boolean {
  // 如果两个文本都很短（< 3 字符），合并
  if (text1.length < 3 && text2.length < 3) {
    return true
  }

  // 如果文本之间没有空格或换行，合并
  const lastChar = text1[text1.length - 1]
  const firstChar = text2[0]

  return lastChar !== ' ' && lastChar !== '\n' && firstChar !== ' ' && firstChar !== '\n'
}

/**
 * 过滤掉微小的差异（例如仅空格的差异）
 * @param diffs 差异列表
 * @param minLength 最小文本长度
 */
export function filterTinyDiffs(diffs: DiffItem[], minLength: number = 2): DiffItem[] {
  return diffs.filter((diff) => {
    // 保留所有删除操作
    if (diff.type === 'delete') return true

    // 过滤掉纯空格或换行的插入
    const trimmed = diff.text.trim()
    return trimmed.length >= minLength
  })
}

/**
 * 按类型分组差异
 */
export function groupDiffsByType(diffs: DiffItem[]): {
  insertions: DiffItem[]
  deletions: DiffItem[]
} {
  const insertions = diffs.filter((d) => d.type === 'insert')
  const deletions = diffs.filter((d) => d.type === 'delete')

  return { insertions, deletions }
}

/**
 * 应用差异到文本（模拟）
 * @param originalText 原始文本
 * @param acceptedDiffs 接受的差异列表
 */
export function applyDiffsToText(originalText: string, acceptedDiffs: DiffItem[]): string {
  let result = originalText

  // 先处理删除（从后往前处理，避免位置偏移）
  const deletions = acceptedDiffs.filter((d) => d.type === 'delete').reverse()
  for (const diff of deletions) {
    result = result.replace(diff.text, '')
  }

  // 再处理插入
  const insertions = acceptedDiffs.filter((d) => d.type === 'insert')
  for (const diff of insertions) {
    // 简单追加到末尾（实际应用中需要更智能的位置判断）
    result += diff.text
  }

  return result
}

/**
 * 计算差异的统计信息
 */
export function calculateDiffStatistics(diffs: DiffItem[]): {
  totalChanges: number
  insertionCount: number
  deletionCount: number
  insertionChars: number
  deletionChars: number
} {
  const insertions = diffs.filter((d) => d.type === 'insert')
  const deletions = diffs.filter((d) => d.type === 'delete')

  return {
    totalChanges: diffs.length,
    insertionCount: insertions.length,
    deletionCount: deletions.length,
    insertionChars: insertions.reduce((sum, d) => sum + d.text.length, 0),
    deletionChars: deletions.reduce((sum, d) => sum + d.text.length, 0)
  }
}

/**
 * 格式化差异为人类可读的字符串
 */
export function formatDiffForDisplay(diff: DiffItem): string {
  const prefix = diff.type === 'insert' ? '+ ' : '- '
  const lines = diff.text.split('\n')

  if (lines.length === 1) {
    return `${prefix}${diff.text}`
  }

  return lines.map((line) => `${prefix}${line}`).join('\n')
}
