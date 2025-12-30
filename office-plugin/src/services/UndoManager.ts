/**
 * 撤销管理器
 *
 * 负责管理文档操作的撤销功能
 * 支持记录操作历史、执行撤销操作、状态管理
 * 
 * @updated 2025-12-29 - 使用 MCP 工具替代废弃的 WordService 方法 (修复 P9)
 */

import Logger from '../utils/logger'
import type { WordService } from './WordService'
import { McpToolExecutor } from './ai/McpToolExecutor'

const logger = new Logger('UndoManager')

// MCP 工具执行器实例
const mcpToolExecutor = new McpToolExecutor()

/**
 * 操作记录接口
 */
export interface OperationRecord {
  /** 操作ID */
  id: string
  /** 操作时间 */
  timestamp: Date
  /** 操作类型 */
  operationType: 'find_and_replace' | 'delete_text' | 'insert_text' | 'format_text' | 'custom'
  /** 操作描述 */
  description: string
  /** 操作参数 */
  parameters: Record<string, unknown>
  /** 操作前的状态 */
  beforeState: {
    content: string
    selection?: {
      start: number
      end: number
    }
  }
  /** 操作后的状态 */
  afterState: {
    content: string
    selection?: {
      start: number
      end: number
    }
  }
  /** 关联的消息ID */
  messageId: string
  /** 是否可以撤销 */
  canUndo: boolean
  /** 撤销操作 */
  undoAction?: () => Promise<void>
  /** 会话 ID（多轮对话支持） */
  sessionId?: string
  /** 步骤索引（分步执行支持） */
  stepIndex?: number
  /** 计划 ID（分步执行支持） */
  planId?: string
  /** 工具名称 */
  toolName?: string
}

/**
 * 步骤撤销组
 */
export interface UndoGroup {
  /** 组 ID */
  id: string
  /** 会话 ID */
  sessionId: string
  /** 计划 ID */
  planId?: string
  /** 组内操作 ID 列表 */
  operationIds: string[]
  /** 创建时间 */
  createdAt: Date
  /** 描述 */
  description: string
}

/**
 * 撤销管理器类
 */
export class UndoManager {
  private operations: OperationRecord[] = []
  private undoGroups: UndoGroup[] = []
  private maxHistorySize = 50 // 最大保留 50 个操作记录
  private wordService: WordService

  constructor(wordService: WordService) {
    this.wordService = wordService
  }

  /**
   * 通过快照方式捕获一次操作
   * 用于外部已经有明确执行逻辑时，仅需统一记录前后状态
   */
  async captureOperationWithSnapshot<T>(
    operationType: OperationRecord['operationType'],
    description: string,
    parameters: Record<string, unknown>,
    messageId: string | undefined,
    executor: () => Promise<T>,
    customUndoAction?: () => Promise<void>
  ): Promise<{ result: T; record?: OperationRecord }> {
    let beforeContent: string | null = null
    let beforeSelection: { start: number; end: number } | undefined

    try {
      const beforeDoc = await this.wordService.readDocument()
      beforeContent = beforeDoc.text
      beforeSelection = await this.getCurrentSelection()
    } catch (error) {
      logger.warn('Failed to capture before snapshot; undo record skipped', { error })
    }

    const result = await executor()

    if (!beforeContent) {
      return { result }
    }

    try {
      const afterDoc = await this.wordService.readDocument()
      const afterSelection = await this.getCurrentSelection()

      const operation: OperationRecord = {
        id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        timestamp: new Date(),
        operationType,
        description,
        parameters,
        beforeState: {
          content: beforeContent,
          selection: beforeSelection
        },
        afterState: {
          content: afterDoc.text,
          selection: afterSelection
        },
        messageId: messageId ?? 'unknown',
        canUndo: true,
        undoAction:
          customUndoAction ??
          (async () => {
            // 使用 MCP 工具替换文档内容
            await mcpToolExecutor.executeTool('word_insert_text', {
              text: beforeContent!,
              location: 'replace'
            })
            if (beforeSelection) {
              await this.restoreSelection(beforeSelection)
            }
          })
      }

      this.addToHistory(operation)

      logger.info('Operation recorded via snapshot', {
        operationId: operation.id,
        operationType: operation.operationType,
        messageId: operation.messageId
      })

      return { result, record: operation }
    } catch (error) {
      logger.warn('Failed to capture after snapshot; undo record skipped', { error })
      return { result }
    }
  }
  /**
   * 记录一个操作
   */
  async recordOperation(
    operationType: OperationRecord['operationType'],
    description: string,
    parameters: Record<string, unknown>,
    messageId: string,
    undoAction?: () => Promise<void>
  ): Promise<OperationRecord> {
    try {
      // 获取当前文档状态
      const beforeContent = await this.wordService.readDocument()
      const currentSelection = await this.getCurrentSelection()

      const operation: OperationRecord = {
        id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        timestamp: new Date(),
        operationType,
        description,
        parameters,
        beforeState: {
          content: beforeContent.text,
          selection: currentSelection
        },
        afterState: {
          content: '', // 将在操作完成后更新
          selection: currentSelection
        },
        messageId,
        canUndo: true,
        undoAction
      }

      // 执行操作并记录结果
      await this.executeOperation(operation)

      // 获取操作后的状态
      const afterContent = await this.wordService.readDocument()
      operation.afterState = {
        content: afterContent.text,
        selection: await this.getCurrentSelection()
      }

      // 添加到历史记录
      this.addToHistory(operation)

      logger.info('Operation recorded successfully', {
        operationId: operation.id,
        operationType,
        description,
        messageId
      })

      return operation
    } catch (error) {
      logger.error('Failed to record operation', {
        operationType,
        description,
        messageId,
        error
      })
      throw error
    }
  }

  /**
   * 撤销操作
   */
  async undoOperation(operationId: string): Promise<boolean> {
    try {
      const operation = this.operations.find(op => op.id === operationId && op.canUndo)

      if (!operation) {
        logger.warn('Operation not found or cannot be undone', { operationId })
        return false
      }

      // 如果有自定义撤销操作，优先使用
      if (operation.undoAction) {
        await operation.undoAction()
      } else {
        // 使用通用撤销逻辑
        await this.performGenericUndo(operation)
      }

      // 标记为已撤销
      operation.canUndo = false

      logger.info('Operation undone successfully', {
        operationId,
        operationType: operation.operationType,
        description: operation.description
      })

      return true
    } catch (error) {
      logger.error('Failed to undo operation', {
        operationId,
        error
      })
      return false
    }
  }

  /**
   * 撤销指定消息的所有操作
   */
  async undoMessageOperations(messageId: string): Promise<number> {
    const messageOperations = this.operations.filter(
      op => op.messageId === messageId && op.canUndo
    )

    let successCount = 0
    for (const operation of messageOperations.reverse()) {
      if (await this.undoOperation(operation.id)) {
        successCount++
      }
    }

    logger.info('Message operations undone', {
      messageId,
      totalOperations: messageOperations.length,
      successCount
    })

    return successCount
  }

  /**
   * 获取操作历史
   */
  getOperationHistory(limit?: number): OperationRecord[] {
    const history = [...this.operations].reverse()
    return limit ? history.slice(0, limit) : history
  }

  /**
   * 获取指定消息的操作历史
   */
  getMessageOperations(messageId: string): OperationRecord[] {
    return this.operations
      .filter(op => op.messageId === messageId)
      .reverse()
  }

  /**
   * 清空操作历史
   */
  clearHistory(): void {
    this.operations = []
    logger.info('Operation history cleared')
  }

  /**
   * 获取当前选区
   */
  private async getCurrentSelection(): Promise<undefined> {
    try {
      // 这里需要实现获取当前选区的逻辑
      // 暂时返回 undefined，实际实现需要调用 Word API
      return undefined
    } catch (error) {
      logger.warn('Failed to get current selection', { error })
      return undefined
    }
  }

  /**
   * 执行操作
   */
  private async executeOperation(operation: OperationRecord): Promise<void> {
    // 根据操作类型执行不同的操作
    switch (operation.operationType) {
      case 'find_and_replace':
        // 查找替换操作已在调用前执行，这里只记录
        break

      case 'delete_text':
        // 删除文本操作已在调用前执行
        break

      case 'insert_text':
        // 插入文本操作已在调用前执行
        break

      case 'format_text':
        // 格式化操作已在调用前执行
        break

      default:
        logger.warn('Unknown operation type', { operationType: operation.operationType })
    }
  }

  /**
   * 执行通用撤销逻辑
   */
  private async performGenericUndo(operation: OperationRecord): Promise<void> {
    try {
      // 使用 MCP 工具恢复到操作前的状态
      await mcpToolExecutor.executeTool('word_insert_text', {
        text: operation.beforeState.content,
        location: 'replace'
      })

      // 如果有选区信息，恢复选区
      if (operation.beforeState.selection) {
        await this.restoreSelection(operation.beforeState.selection)
      }

      logger.info('Generic undo completed', {
        operationId: operation.id,
        operationType: operation.operationType
      })
    } catch (error) {
      logger.error('Failed to perform generic undo', {
        operationId: operation.id,
        error
      })
      throw error
    }
  }

  /**
   * 恢复选区
   */
  private async restoreSelection(selection: { start: number; end: number }): Promise<void> {
    try {
      // 这里需要实现恢复选区的逻辑
      // 实际实现需要调用 Word API 来设置选区
      logger.debug('Restoring selection', { selection })
    } catch (error) {
      logger.warn('Failed to restore selection', { selection, error })
    }
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(operation: OperationRecord): void {
    this.operations.push(operation)

    // 限制历史记录大小
    if (this.operations.length > this.maxHistorySize) {
      this.operations = this.operations.slice(-this.maxHistorySize)
    }

    logger.debug('Operation added to history', {
      operationId: operation.id,
      historySize: this.operations.length
    })
  }

  /**
   * 获取撤销统计信息
   */
  getUndoStatistics() {
    const total = this.operations.length
    const undoable = this.operations.filter(op => op.canUndo).length
    const byType = this.operations.reduce((acc, op) => {
      acc[op.operationType] = (acc[op.operationType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      undoable,
      undone: total - undoable,
      byType
    }
  }

  /**
   * 导出操作历史
   */
  exportHistory(): string {
    const history = this.operations.map(op => ({
      id: op.id,
      timestamp: op.timestamp.toISOString(),
      operationType: op.operationType,
      description: op.description,
      messageId: op.messageId,
      canUndo: op.canUndo
    }))

    return JSON.stringify(history, null, 2)
  }

  /**
   * 导入操作历史
   */
  importHistory(historyJson: string): boolean {
    try {
      const history = JSON.parse(historyJson) as Array<{
        id: string
        timestamp: string
        operationType: OperationRecord['operationType']
        description: string
        parameters: Record<string, unknown>
        messageId: string
      }>
      this.operations = history.map((op): OperationRecord => ({
        ...op,
        timestamp: new Date(op.timestamp),
        beforeState: {
          content: '',
          selection: undefined as { start: number; end: number } | undefined
        },
        afterState: {
          content: '',
          selection: undefined as { start: number; end: number } | undefined
        },
        canUndo: false // 导入的历史记录默认不可撤销
      }))

      logger.info('History imported successfully', {
        operationCount: this.operations.length
      })

      return true
    } catch (error) {
      logger.error('Failed to import history', { error })
      return false
    }
  }

  // ==================== 步骤级撤销支持 ====================

  /**
   * 记录带会话信息的操作
   */
  async recordSessionOperation(
    operationType: OperationRecord['operationType'],
    description: string,
    parameters: Record<string, unknown>,
    messageId: string,
    sessionInfo: {
      sessionId: string
      planId?: string
      stepIndex?: number
      toolName?: string
    },
    undoAction?: () => Promise<void>
  ): Promise<OperationRecord> {
    const record = await this.recordOperation(
      operationType,
      description,
      parameters,
      messageId,
      undoAction
    )

    // 添加会话信息
    record.sessionId = sessionInfo.sessionId
    record.planId = sessionInfo.planId
    record.stepIndex = sessionInfo.stepIndex
    record.toolName = sessionInfo.toolName

    logger.info('Session operation recorded', {
      operationId: record.id,
      sessionId: sessionInfo.sessionId,
      stepIndex: sessionInfo.stepIndex
    })

    return record
  }

  /**
   * 创建撤销组
   */
  createUndoGroup(
    sessionId: string,
    description: string,
    planId?: string
  ): UndoGroup {
    const group: UndoGroup = {
      id: `group-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sessionId,
      planId,
      operationIds: [],
      createdAt: new Date(),
      description
    }

    this.undoGroups.push(group)

    logger.info('Undo group created', {
      groupId: group.id,
      sessionId,
      planId
    })

    return group
  }

  /**
   * 将操作添加到撤销组
   */
  addToUndoGroup(groupId: string, operationId: string): boolean {
    const group = this.undoGroups.find(g => g.id === groupId)
    if (!group) {
      logger.warn('Undo group not found', { groupId })
      return false
    }

    group.operationIds.push(operationId)
    return true
  }

  /**
   * 撤销整个组的操作
   */
  async undoGroup(groupId: string): Promise<{
    success: boolean
    undoneCount: number
    errors: string[]
  }> {
    const group = this.undoGroups.find(g => g.id === groupId)
    if (!group) {
      logger.warn('Undo group not found', { groupId })
      return { success: false, undoneCount: 0, errors: ['撤销组不存在'] }
    }

    const errors: string[] = []
    let undoneCount = 0

    // 按照逆序撤销操作
    for (const operationId of [...group.operationIds].reverse()) {
      try {
        const success = await this.undoOperation(operationId)
        if (success) {
          undoneCount++
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        errors.push(`操作 ${operationId} 撤销失败: ${errorMessage}`)
      }
    }

    logger.info('Undo group executed', {
      groupId,
      totalOperations: group.operationIds.length,
      undoneCount,
      errors: errors.length
    })

    return {
      success: errors.length === 0,
      undoneCount,
      errors
    }
  }

  /**
   * 按会话撤销操作
   */
  async undoSessionOperations(sessionId: string): Promise<{
    success: boolean
    undoneCount: number
    errors: string[]
  }> {
    const sessionOperations = this.operations.filter(
      op => op.sessionId === sessionId && op.canUndo
    )

    const errors: string[] = []
    let undoneCount = 0

    // 按照逆序撤销
    for (const operation of [...sessionOperations].reverse()) {
      try {
        const success = await this.undoOperation(operation.id)
        if (success) {
          undoneCount++
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        errors.push(`操作 ${operation.id} 撤销失败: ${errorMessage}`)
      }
    }

    logger.info('Session operations undone', {
      sessionId,
      totalOperations: sessionOperations.length,
      undoneCount,
      errors: errors.length
    })

    return {
      success: errors.length === 0,
      undoneCount,
      errors
    }
  }

  /**
   * 撤销特定步骤（按步骤索引）
   */
  async undoStep(sessionId: string, stepIndex: number): Promise<boolean> {
    const stepOperations = this.operations.filter(
      op => op.sessionId === sessionId && op.stepIndex === stepIndex && op.canUndo
    )

    if (stepOperations.length === 0) {
      logger.warn('No operations found for step', { sessionId, stepIndex })
      return false
    }

    let allSuccess = true
    for (const operation of [...stepOperations].reverse()) {
      const success = await this.undoOperation(operation.id)
      if (!success) {
        allSuccess = false
      }
    }

    logger.info('Step undone', {
      sessionId,
      stepIndex,
      operationCount: stepOperations.length,
      success: allSuccess
    })

    return allSuccess
  }

  /**
   * 获取会话的操作历史
   */
  getSessionOperations(sessionId: string): OperationRecord[] {
    return this.operations
      .filter(op => op.sessionId === sessionId)
      .reverse()
  }

  /**
   * 获取计划的操作历史
   */
  getPlanOperations(planId: string): OperationRecord[] {
    return this.operations
      .filter(op => op.planId === planId)
      .reverse()
  }

  /**
   * 获取撤销组列表
   */
  getUndoGroups(sessionId?: string): UndoGroup[] {
    if (sessionId) {
      return this.undoGroups.filter(g => g.sessionId === sessionId)
    }
    return [...this.undoGroups]
  }

  /**
   * 检查是否可以撤销会话
   */
  canUndoSession(sessionId: string): boolean {
    return this.operations.some(op => op.sessionId === sessionId && op.canUndo)
  }

  /**
   * 检查是否可以撤销步骤
   */
  canUndoStep(sessionId: string, stepIndex: number): boolean {
    return this.operations.some(
      op => op.sessionId === sessionId && op.stepIndex === stepIndex && op.canUndo
    )
  }

  /**
   * 获取会话撤销统计
   */
  getSessionUndoStats(sessionId: string): {
    totalOperations: number
    undoableOperations: number
    undoneOperations: number
    byStep: Record<number, { total: number; undoable: number }>
  } {
    const sessionOps = this.operations.filter(op => op.sessionId === sessionId)
    const byStep: Record<number, { total: number; undoable: number }> = {}

    for (const op of sessionOps) {
      if (op.stepIndex !== undefined) {
        if (!byStep[op.stepIndex]) {
          byStep[op.stepIndex] = { total: 0, undoable: 0 }
        }
        byStep[op.stepIndex].total++
        if (op.canUndo) {
          byStep[op.stepIndex].undoable++
        }
      }
    }

    return {
      totalOperations: sessionOps.length,
      undoableOperations: sessionOps.filter(op => op.canUndo).length,
      undoneOperations: sessionOps.filter(op => !op.canUndo).length,
      byStep
    }
  }
}

/**
 * 创建撤销管理器实例
 */
export function createUndoManager(wordService: WordService): UndoManager {
  return new UndoManager(wordService)
}

export default UndoManager
