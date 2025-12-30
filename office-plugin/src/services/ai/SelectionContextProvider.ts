/**
 * SelectionContextProvider
 * 提供选区上下文信息，用于工具选择
 *
 * 支持 Word/Excel/PowerPoint 三种应用
 * 通过 Adapter 模式，将应用特定逻辑完全委托给对应的适配器
 *
 * 🆕 重构说明：
 * 选区检测逻辑已完全迁移至各 Adapter 实现（WordAdapter、ExcelAdapter、PowerPointAdapter）
 * 此文件仅保留统一的入口函数和向后兼容的接口
 */

import Logger from '../../utils/logger'
import { getAdapter, type OfficeAppType } from '../adapters'
import type { WordService } from '../WordService'
import type { SelectionContext } from './types'

const logger = new Logger('SelectionContextProvider')

// 重新导出 OfficeAppType 以保持向后兼容
export type { OfficeAppType }

/**
 * 统一的选区上下文获取函数（支持 Word/Excel/PowerPoint）
 *
 * 通过 Adapter 获取选区上下文，所有应用特定逻辑由 Adapter 处理
 *
 * @param officeApp - Office 应用类型
 * @param wordService - Word 服务实例（可选，已废弃，仅保留向后兼容）
 * @returns 选区上下文信息
 */
export async function getSelectionContextForApp(
  officeApp: OfficeAppType,
  wordService?: WordService
): Promise<SelectionContext> {
  const operationId = `get-selection-context-${officeApp}-${Date.now()}`
  logger.info(`[${operationId}] Getting selection context for ${officeApp}`)

  try {
    // 使用 Adapter 模式获取选区上下文
    const adapter = getAdapter(officeApp)

    if (adapter) {
      logger.debug(`[${operationId}] Using ${officeApp} adapter`)
      return await adapter.getSelectionContext()
    }

    // Adapter 不可用时返回默认上下文
    logger.warn(`[${operationId}] No adapter found for ${officeApp}, returning default context`)
    return getDefaultContext(officeApp === 'none' ? 'word' : officeApp)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`[${operationId}] Failed to get selection context`, {
      officeApp,
      error: errorMessage
    })
    return getDefaultContext(officeApp === 'none' ? 'word' : officeApp)
  }
}

/**
 * 获取当前选区上下文（向后兼容的旧函数）
 * @deprecated 请使用 getSelectionContextForApp
 *
 * @param wordService - Word 服务实例（已废弃，不再使用）
 * @returns 选区上下文信息
 */
export async function getSelectionContext(
  wordService: WordService
): Promise<SelectionContext> {
  return getSelectionContextForApp('word', wordService)
}

/**
 * 获取默认上下文 (当无法获取实际上下文时使用)
 * @param documentType - 文档类型，默认 'word'
 */
function getDefaultContext(documentType: 'word' | 'excel' | 'powerpoint' = 'word'): SelectionContext {
  return {
    hasSelection: false,
    selectionType: 'none',
    documentType
  }
}

