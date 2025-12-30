/**
 * Excel 编辑 Hook
 * 管理 Excel 单元格修改的状态和操作
 * 
 * @deprecated 此 Hook 使用已废弃的 ExcelService，建议使用 MCP 工具
 * 注意：ExcelService 已被移除，此 Hook 暂时不可用
 */

import { useCallback, useState } from 'react'

// import { excelService } from '../services/deprecated/ExcelService'
import type {
  ExcelBatchChangeResult,
  ExcelCellChange,
  ExcelWorksheetContent} from '../types/excel'
import Logger from '../utils/logger'

const logger = new Logger('useExcelEdit')

// 模拟 excelService 接口，避免编译错误
const excelService = {
  readWorksheet: async (): Promise<ExcelWorksheetContent> => {
    throw new Error('ExcelService has been deprecated. Please use MCP tools instead.')
  },
  applyConditionalFormat: async (_address: string, _format: { backgroundColor: string }) => {},
  writeCell: async (_address: string, _value: unknown, _formula?: string) => {},
  clearConditionalFormat: async (_address: string) => {},
  applyConditionalFormats: async (_addresses: string[], _format: { backgroundColor: string }) => {},
  writeCells: async (changes: ExcelCellChange[]): Promise<ExcelBatchChangeResult> => ({
    total: changes.length,
    success: 0,
    failed: changes.length,
    failedCells: changes.map(c => c.address),
    errors: changes.map(c => ({ address: c.address, error: 'ExcelService has been deprecated' }))
  }),
  navigateToCell: async (_address: string) => {},
  addComment: async (_address: string, _comment: { content: string }) => {},
  deleteComment: async (_address: string) => {}
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `excel-change-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Excel 编辑 Hook
 */
export function useExcelEdit() {
  const [worksheetContent, setWorksheetContent] = useState<ExcelWorksheetContent | null>(
    null
  )
  const [cellChanges, setCellChanges] = useState<ExcelCellChange[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 读取工作表内容
   */
  const readWorksheet = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const content = await excelService.readWorksheet()
      setWorksheetContent(content)

      logger.info('Worksheet loaded', {
        worksheetName: content.name,
        rowCount: content.usedRange.rowCount,
        columnCount: content.usedRange.columnCount
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      logger.error('Failed to read worksheet', { error: err })
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 添加单元格修改建议
   */
  const addCellChange = useCallback((change: Omit<ExcelCellChange, 'id' | 'status'>) => {
    const newChange: ExcelCellChange = {
      ...change,
      id: generateId(),
      status: 'pending'
    }

    setCellChanges((prev) => [...prev, newChange])

    logger.info('Cell change added', { address: change.address })
  }, [])

  /**
   * 批量添加单元格修改建议
   */
  const addCellChanges = useCallback(
    (changes: Array<Omit<ExcelCellChange, 'id' | 'status'>>) => {
      const newChanges: ExcelCellChange[] = changes.map((change) => ({
        ...change,
        id: generateId(),
        status: 'pending'
      }))

      setCellChanges((prev) => [...prev, ...newChanges])

      logger.info('Cell changes added in batch', { count: changes.length })
    },
    []
  )

  /**
   * 接受单个单元格修改
   */
  const acceptChange = useCallback(async (changeId: string) => {
    try {
      const change = cellChanges.find((c) => c.id === changeId)
      if (!change) {
        throw new Error(`Change not found: ${changeId}`)
      }

      // 高亮单元格为绿色
      await excelService.applyConditionalFormat(change.address, {
        backgroundColor: '#90EE90' // 浅绿色
      })

      // 应用修改
      await excelService.writeCell(change.address, change.newValue, change.formula)

      // 清除高亮
      await excelService.clearConditionalFormat(change.address)

      // 更新状态
      setCellChanges((prev) =>
        prev.map((c) => (c.id === changeId ? { ...c, status: 'accepted' as const } : c))
      )

      logger.info('Change accepted', { changeId, address: change.address })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      logger.error('Failed to accept change', { error: err, changeId })
    }
  }, [cellChanges])

  /**
   * 拒绝单个单元格修改
   */
  const rejectChange = useCallback(async (changeId: string) => {
    try {
      const change = cellChanges.find((c) => c.id === changeId)
      if (!change) {
        throw new Error(`Change not found: ${changeId}`)
      }

      // 清除高亮(如果有)
      await excelService.clearConditionalFormat(change.address)

      // 更新状态
      setCellChanges((prev) =>
        prev.map((c) => (c.id === changeId ? { ...c, status: 'rejected' as const } : c))
      )

      logger.info('Change rejected', { changeId, address: change.address })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      logger.error('Failed to reject change', { error: err, changeId })
    }
  }, [cellChanges])

  /**
   * 接受所有修改
   */
  const acceptAllChanges = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const pendingChanges = cellChanges.filter((c) => c.status === 'pending')

      if (pendingChanges.length === 0) {
        logger.info('No pending changes to accept')
        return
      }

      // 高亮所有待修改的单元格
      const addresses = pendingChanges.map((c) => c.address)
      await excelService.applyConditionalFormats(addresses, {
        backgroundColor: '#FFFF99' // 浅黄色
      })

      // 批量应用修改
      const result: ExcelBatchChangeResult = await excelService.writeCells(pendingChanges)

      // 清除高亮
      for (const address of addresses) {
        await excelService.clearConditionalFormat(address)
      }

      // 更新状态
      setCellChanges((prev) =>
        prev.map((c) =>
          c.status === 'pending' && !result.failedCells.includes(c.address)
            ? { ...c, status: 'accepted' as const }
            : c
        )
      )

      if (result.failed > 0) {
        setError(`${result.failed} 个单元格修改失败`)
      }

      logger.info('All changes accepted', {
        total: result.total,
        success: result.success,
        failed: result.failed
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      logger.error('Failed to accept all changes', { error: err })
    } finally {
      setIsLoading(false)
    }
  }, [cellChanges])

  /**
   * 拒绝所有修改
   */
  const rejectAllChanges = useCallback(() => {
    setCellChanges((prev) =>
      prev.map((c) =>
        c.status === 'pending' ? { ...c, status: 'rejected' as const } : c
      )
    )

    logger.info('All changes rejected')
  }, [])

  /**
   * 定位到单元格
   */
  const navigateToCell = useCallback(async (address: string) => {
    try {
      await excelService.navigateToCell(address)

      logger.info('Navigated to cell', { address })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      logger.error('Failed to navigate to cell', { error: err, address })
    }
  }, [])

  /**
   * 高亮所有待修改的单元格
   */
  const highlightPendingChanges = useCallback(async () => {
    try {
      const pendingChanges = cellChanges.filter((c) => c.status === 'pending')
      const addresses = pendingChanges.map((c) => c.address)

      if (addresses.length === 0) {
        logger.info('No pending changes to highlight')
        return
      }

      await excelService.applyConditionalFormats(addresses, {
        backgroundColor: '#FFFF99' // 浅黄色
      })

      // 为每个单元格添加批注显示建议值
      for (const change of pendingChanges) {
        const commentContent = `建议修改为: ${change.newValue}\n${change.description || ''}`
        await excelService.addComment(change.address, {
          content: commentContent
        })
      }

      logger.info('Pending changes highlighted', { count: addresses.length })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      logger.error('Failed to highlight pending changes', { error: err })
    }
  }, [cellChanges])

  /**
   * 清除所有高亮
   */
  const clearHighlights = useCallback(async () => {
    try {
      const addresses = cellChanges.map((c) => c.address)

      for (const address of addresses) {
        await excelService.clearConditionalFormat(address)
        await excelService.deleteComment(address)
      }

      logger.info('Highlights cleared')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      logger.error('Failed to clear highlights', { error: err })
    }
  }, [cellChanges])

  /**
   * 清空所有修改
   */
  const clearChanges = useCallback(() => {
    setCellChanges([])
    logger.info('Changes cleared')
  }, [])

  return {
    // 状态
    worksheetContent,
    cellChanges,
    isLoading,
    error,

    // 统计
    totalChanges: cellChanges.length,
    pendingChanges: cellChanges.filter((c) => c.status === 'pending').length,
    acceptedChanges: cellChanges.filter((c) => c.status === 'accepted').length,
    rejectedChanges: cellChanges.filter((c) => c.status === 'rejected').length,

    // 操作
    readWorksheet,
    addCellChange,
    addCellChanges,
    acceptChange,
    rejectChange,
    acceptAllChanges,
    rejectAllChanges,
    navigateToCell,
    highlightPendingChanges,
    clearHighlights,
    clearChanges
  }
}
