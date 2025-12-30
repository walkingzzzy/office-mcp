/**
 * Office 工具执行器
 * 负责根据 MCP Server 下发的工具名称调用本地 Office API
 *
 * ⚠️ 使用边界说明：
 * 1. **合法使用场景**：
 *    - 单元测试和集成测试（NODE_ENV === 'test'）
 *    - 开发环境快速原型验证（ALLOW_DIRECT_OFFICE_EXECUTOR === 'true'）
 *    - MCP Server 通过 IPC 调用本地 Office.js 执行（生产环境正常路径）
 *
 * 2. **禁止使用场景**：
 *    - 在 Office 插件前端代码中直接调用此类（应通过 McpToolExecutor）
 *    - 绕过 MCP Server 直接执行 Office.js 操作
 *
 * 3. **架构说明**：
 *    用户请求 → ChatInterface → FunctionCallHandler → McpToolExecutor
 *    → MCP Server (IPC) → OfficeToolExecutor (本类) → Office.js API
 *
 * 4. **模块化架构**：
 *    工具实现已拆分到 tools/ 目录下的各个模块：
 *    
 *    Word 工具 (77个):
 *    - tools/word/TextTools.ts - 基础文本操作
 *    - tools/word/ReadTools.ts - 读取操作
 *    - tools/word/FormattingTools.ts - 格式化操作
 *    - tools/word/TableTools.ts - 表格操作
 *    - tools/word/ImageTools.ts - 图片操作
 *    - tools/word/StyleTools.ts - 样式操作
 *    - tools/word/SelectionTools.ts - 选区检测操作
 *    - tools/word/ParagraphTools.ts - 段落操作
 *    - tools/word/AdvancedTextTools.ts - 高级文本操作
 *    - tools/word/AdvancedFormattingTools.ts - 高级格式化
 *    - tools/word/AdvancedStyleTools.ts - 高级样式操作
 *    - tools/word/AdvancedTableTools.ts - 高级表格操作
 *    - tools/word/AdvancedImageTools.ts - 高级图片操作
 *    - tools/word/HyperlinkTools.ts - 超链接和引用
 *    - tools/word/AdvancedTools.ts - 高级操作
 *    
 *    Excel 工具 (97个):
 *    - tools/excel/CellTools.ts - 单元格操作
 *    - tools/excel/FormatTools.ts - 格式化操作
 *    - tools/excel/FormulaTools.ts - 公式操作
 *    - tools/excel/ChartTools.ts - 图表操作
 *    - tools/excel/WorksheetTools.ts - 工作表操作
 *    - tools/excel/DataTools.ts - 数据分析操作
 *    
 *    PowerPoint 工具 (36个):
 *    - tools/powerpoint/SlideTools.ts - 幻灯片操作
 *    - tools/powerpoint/ShapeTools.ts - 形状操作
 *    - tools/powerpoint/MediaTools.ts - 媒体操作
 *    - tools/powerpoint/AnimationTools.ts - 动画操作
 *
 * @see MCP_FULL_INTEGRATION_PLAN.md 架构图
 */

import Logger from '../utils/logger'
import type { FunctionResult } from './ai/types'
import { createOfficeToolRegistry, getToolStats, type ToolRegistry } from './tools'

interface ExecuteContext {
  toolCallId?: string
}

export class OfficeToolExecutor {
  private logger = new Logger('OfficeToolExecutor')
  private isDirectExecutionAllowed: boolean
  private toolRegistry: ToolRegistry

  constructor() {
    // 检查是否允许直接执行（测试环境或明确授权）
    this.isDirectExecutionAllowed =
      typeof process !== 'undefined' && (
        process.env.NODE_ENV === 'test' ||
        process.env.ALLOW_DIRECT_OFFICE_EXECUTOR === 'true'
      )

    if (this.isDirectExecutionAllowed) {
      this.logger.warn('[DIRECT_EXECUTOR] ⚠️ OfficeToolExecutor 直接执行模式已启用', {
        reason: process.env.NODE_ENV === 'test' ? '测试环境' : '明确授权'
      })
    }

    // 初始化工具注册表
    this.toolRegistry = createOfficeToolRegistry()
    
    const stats = getToolStats()
    this.logger.info('[OfficeToolExecutor] 工具注册表初始化完成', {
      totalTools: stats.total,
      wordTools: stats.word,
      excelTools: stats.excel,
      pptTools: stats.powerpoint
    })
  }

  /**
   * 执行工具
   * @param toolName 工具名称
   * @param args 工具参数
   * @param context 执行上下文
   */
  async executeTool(toolName: string, args: Record<string, any>, context?: ExecuteContext): Promise<FunctionResult> {
    const startTime = Date.now()
    this.logger.info('[MCP_EXECUTOR] 🚀 执行工具命令', {
      toolName,
      toolCallId: context?.toolCallId,
      argsPreview: JSON.stringify(args).substring(0, 100),
      executionMode: this.isDirectExecutionAllowed ? 'DIRECT' : 'NORMAL'
    })

    try {
      // 从注册表获取工具处理器
      const handler = this.toolRegistry.get(toolName)
      
      if (!handler) {
          this.logger.warn('[MCP_EXECUTOR] ⚠️ 未支持的工具', { toolName })
        return {
            success: false,
          message: `Unsupported tool: ${toolName}. 请确认工具名称是否正确或联系开发者添加支持。`,
          executionTime: Date.now() - startTime
          }
      }

      // 执行工具
      const result = await handler(args)
      result.executionTime = Date.now() - startTime

      this.logger.info('[MCP_EXECUTOR] ✅ 工具执行完成', {
        toolName,
        success: result.success,
        executionTime: result.executionTime
      })

      return result
    } catch (error) {
      this.logger.error('[MCP_EXECUTOR] ❌ 工具执行失败', {
        toolName,
        toolCallId: context?.toolCallId,
        error: error instanceof Error ? error.message : String(error)
      })

      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? error : new Error(String(error)),
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * 获取已注册的工具列表
   */
  getRegisteredTools(): string[] {
    return Array.from(this.toolRegistry.keys())
  }

  /**
   * 检查工具是否已注册
   */
  hasTools(toolName: string): boolean {
    return this.toolRegistry.has(toolName)
  }

  /**
   * 获取工具统计信息
   */
  getToolStats(): { total: number; word: number; excel: number; powerpoint: number; byCategory: Record<string, number> } {
    return getToolStats()
  }
}

export const officeToolExecutor = new OfficeToolExecutor()
