/**
 * Word 文档操作服务 - 精简版本
 *
 * @deprecated 此服务包含浏览器端复杂的文档编辑逻辑，将逐步被 Office MCP Server 替代。
 *
 * **当前状态**：
 * - 仅保留核心读取和插入方法
 * - 编辑操作通过 MCP 工具执行
 *
 * @see BinaryDocumentAdapter
 * @see Office MCP Server
 */

import type { WordDocumentContent, WordSelection } from '../types/word'
import Logger from '../utils/logger'
import useConfigStore from '../store/configStore'

// 导入 MCP 工具执行器
import { McpToolExecutor } from './ai/McpToolExecutor'
// 导入本地 Office 工具执行器（用于读取操作）
import { officeToolExecutor } from './OfficeToolExecutor'

const logger = new Logger('WordService')

/**
 * Word 服务主类 - 精简版
 */
export class WordService {
  private mcpToolExecutor: McpToolExecutor

  constructor() {
    this.mcpToolExecutor = new McpToolExecutor()
    logger.info('[WordService] 初始化，所有操作通过 MCP 执行')

    const mcpStatus = useConfigStore.getState().getMcpStatusSummary?.()
    if (!mcpStatus?.hasActiveServer) {
      logger.warn('[WordService] ⚠️ 未检测到启用的 MCP 服务器，请在设置中添加并启用后重试。')
    } else {
      logger.info('[WordService] ✅ MCP 模式已启用', {
        enabledServers: mcpStatus.enabledServers,
        totalServers: mcpStatus.totalServers
      })
    }
  }

  // ==================== 文档读取 ====================
  async readDocument(): Promise<WordDocumentContent> {
    logger.info('[WordService] 📖 读取文档内容 (本地执行)')
    const result = await officeToolExecutor.executeTool('word_read_document', {})
    if (result.success && result.data) {
      return result.data as WordDocumentContent
    }
    throw new Error(result.message || 'Failed to read document')
  }

  async readSelection(): Promise<WordSelection> {
    logger.info('[WordService] ✂️ 读取选中内容 (本地执行)')
    const result = await officeToolExecutor.executeTool('word_get_selected_text', {})
    if (result.success && result.data) {
      const data = result.data as { text: string }
      return {
        text: data.text,
        hasTables: false,
        hasImages: false
      } as WordSelection
    }
    throw new Error(result.message || 'Failed to read selection')
  }

  // ==================== 文档编辑 ====================
  async insertText(options: { text: string; location?: 'start' | 'end' | 'before' | 'after' | 'replace' | 'cursor'; richText?: boolean }): Promise<void> {
    const text = options?.text
    if (!text || typeof text !== 'string') {
      throw new Error('WordService.insertText: text 不允许为空')
    }

    logger.info('[WordService] ✍️ 插入文本 (via MCP)', {
      location: options.location,
      preview: text.substring(0, 30)
    })

    const result = await this.mcpToolExecutor.executeTool('word_insert_text', {
      text,
      location: options.location || 'end'
    })

    if (!result.success) {
      throw new Error(result.message || 'Failed to insert text')
    }
  }

  async replaceSelection(newContent: string): Promise<void> {
    logger.info('[WordService] ✍️ 替换选中内容 (via MCP)')
    const result = await this.mcpToolExecutor.executeTool('word_insert_text', {
      text: newContent,
      location: 'replace'
    })
    if (!result.success) {
      throw new Error(result.message || 'Failed to replace selection')
    }
  }

  // ==================== 选区检测 ====================
  async hasSelection(): Promise<boolean> {
    try {
      const result = await officeToolExecutor.executeTool('word_detect_selection_type', {})
      if (result.success && result.data) {
        const data = result.data as { selectionType: string }
        return data.selectionType !== 'none'
      }
      return false
    } catch (error) {
      return false
    }
  }

  // ==================== AI 响应处理 ====================
  async applyAIResponseToSelectionSmart(response: string): Promise<void> {
    logger.info('[WordService] 🤖 应用 AI 响应到选区 (via MCP)')
    const result = await this.mcpToolExecutor.executeTool('word_insert_text', {
      text: response,
      location: 'replace'
    })
    if (!result.success) {
      throw new Error(result.message || 'Failed to apply AI response')
    }
  }

  // ==================== 文档替换 ====================
  async replaceDocumentContent(content: string): Promise<void> {
    logger.info('[WordService] 📝 替换文档内容 (via MCP)')
    // 使用 MCP 工具替换整个文档内容
    const result = await this.mcpToolExecutor.executeTool('word_insert_text', {
      text: content,
      location: 'replace'
    })
    if (!result.success) {
      throw new Error(result.message || 'Failed to replace document content')
    }
  }

  // ==================== 撤销操作 ====================
  async undo(): Promise<void> {
    logger.info('[WordService] ↩️ 撤销操作 (via Office API)')
    // 尝试通过 Office API 执行撤销
    try {
      if (typeof Office !== 'undefined' && Office.context?.document) {
        await Word.run(async (context) => {
          // Word API 没有直接的 undo 方法，这里记录警告
          logger.warn('[WordService] Word API 不支持直接撤销，请使用 Ctrl+Z')
        })
      }
    } catch (error) {
      logger.error('[WordService] 撤销操作失败', { error })
      throw new Error('撤销操作失败，请使用 Ctrl+Z 手动撤销')
    }
  }
}

// 导出单例实例
export const wordService = new WordService()
