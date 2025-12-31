/**
 * 函数调用处理器
 * 处理 AI 返回的 tool_call 事件，执行本地函数调用
 */

import Logger from '../../utils/logger'
import { useAppStore } from '../../store/appStore'
import type { OperationRecord, UndoManager } from '../UndoManager'
import { DynamicToolDiscovery } from './toolSelection'
import { FormattingFunctionRegistry } from './FormattingFunctionRegistry'
import { McpToolExecutor } from './McpToolExecutor'
import { toolCallValidator } from './toolSelection'
import {
  BatchConfirmCallback,
  BatchConfirmResult,
  ConfirmRequestCallback,
  FormattingFunction,
  FunctionCategory,
  FunctionResult,
  ProgressCallback,
  ProgressInfo,
  ToolCall,
  ToolCallResult,
  ToolOperationPreview
} from './types'

const logger = new Logger('FunctionCallHandler')

/**
 * 工具优先级映射
 * 数字越小优先级越高，优先执行
 */
const TOOL_PRIORITY: Record<string, number> = {
  // 高优先级：查找和替换操作（需要先执行，避免后续操作影响位置）
  find_and_replace: 1,
  find_and_replace_all: 1,

  // 中优先级：内容操作
  delete_text: 2,
  insert_text: 2,
  insert_paragraph: 2,

  // 低优先级：格式化操作（在内容确定后执行）
  format_text: 3,
  apply_style: 3,
  set_font: 3,
  set_paragraph_format: 3,

  // 最低优先级：其他操作
  default: 99
}

/**
 * 获取工具调用的优先级
 */
function getToolPriority(toolCall: ToolCall): number {
  const toolName = toolCall.function.name
  return TOOL_PRIORITY[toolName] ?? TOOL_PRIORITY['default']
}

interface ToolCallContext {
  messageId?: string
}

interface FunctionCallHandlerOptions {
  onConfirmRequest?: ConfirmRequestCallback
  onBatchConfirm?: BatchConfirmCallback
  onProgress?: ProgressCallback
  undoManager?: UndoManager
}

/**
 * 函数调用处理器类
 * 处理 AI 返回的本地格式化函数调用
 */
export class FunctionCallHandler {
  private registry: FormattingFunctionRegistry
  private onConfirmRequest?: ConfirmRequestCallback
  private onBatchConfirm?: BatchConfirmCallback
  private onProgress?: ProgressCallback
  private undoManager?: UndoManager
  private dynamicToolDiscovery: DynamicToolDiscovery
  private mcpToolExecutor: McpToolExecutor

  constructor(registry: FormattingFunctionRegistry, options?: FunctionCallHandlerOptions) {
    this.registry = registry
    this.onConfirmRequest = options?.onConfirmRequest
    this.onBatchConfirm = options?.onBatchConfirm
    this.onProgress = options?.onProgress
    this.undoManager = options?.undoManager
    this.dynamicToolDiscovery = new DynamicToolDiscovery()
    this.mcpToolExecutor = new McpToolExecutor()
  }

  /**
   * 处理单个 Tool Call
   * 
   * ⚠️ MCP 优先：所有工具调用统一通过 McpToolExecutor 执行
   * Registry 仅用于获取工具元数据（描述、确认提示等）
   */
  async handleToolCall(toolCall: ToolCall, context?: ToolCallContext): Promise<ToolCallResult> {
    const { id, function: funcInfo } = toolCall
    const { name: functionName, arguments: argsString } = funcInfo

    logger.info('[MCP_FIRST] 🚀 处理工具调用', { functionName, toolCallId: id })

    try {
      // 解析参数
      let args: Record<string, any>
      try {
        // 🔧 修复：在解析前移除 JSON 注释（防御性编程）
        const cleanedArgsString = this.removeJsonComments(argsString)
        args = JSON.parse(cleanedArgsString)
      } catch (parseError) {
        throw new Error(
          `Invalid JSON arguments: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        )
      }

      // 获取函数定义（仅用于元数据，不用于执行）
      const func = this.registry.getFunction(functionName)

      // 🆕 验证并自动修复工具调用参数
      if (func) {
        const { result: validation, fixedToolCall } = toolCallValidator.validateAndFix(toolCall, func)

        if (validation.warnings.length > 0) {
          logger.warn('[TOOL_VALIDATION] 参数警告', {
            functionName,
            warnings: validation.warnings
          })
        }

        if (!validation.valid) {
          if (fixedToolCall) {
            // 使用修复后的参数
            const fixedArgs = JSON.parse(fixedToolCall.function.arguments)
            args = fixedArgs
            logger.info('[TOOL_VALIDATION] ✅ 参数已自动修复', {
              functionName,
              originalErrors: validation.errors
            })
          } else {
            // 无法修复，记录错误但继续尝试执行
            logger.error('[TOOL_VALIDATION] ❌ 参数验证失败且无法修复', {
              functionName,
              errors: validation.errors
            })
          }
        }
      }

      // 检查是否需要用户确认（使用 Registry 中的元数据）
      if (func?.needsConfirmation && this.onConfirmRequest) {
        const confirmMessage = func.confirmMessage
          ? func.confirmMessage(args)
          : `Execute function "${functionName}" with arguments: ${JSON.stringify(args, null, 2)}`

        const confirmed = await this.onConfirmRequest(confirmMessage)
        if (!confirmed) {
          logger.info(`[MCP_FIRST] 用户取消执行: ${functionName}`)
          return {
            tool_call_id: id,
            role: 'tool',
            content: JSON.stringify({
              success: false,
              message: 'Operation cancelled by user'
            })
          }
        }
      }

      // ⚠️ MCP 优先：所有工具调用统一通过 McpToolExecutor 执行
      logger.info('[MCP_FIRST] ✨ 通过 McpToolExecutor 执行工具', {
        functionName,
        toolCallId: id,
        hasRegistryEntry: !!func,
        isMcpOnly: func?.mcpOnly ?? true
      })

      const result = await this.mcpToolExecutor.executeTool(functionName, args, {
        toolCallId: id,
        messageId: context?.messageId
      })

      // 转换结果为 JSON 字符串
      const resultContent = JSON.stringify({
        success: result.success,
        message: result.message,
        data: result.data,
        affectedCount: result.affectedCount,
        executionTime: result.executionTime,
        error: result.error
          ? {
            message: (result.error as Error).message,
            name: (result.error as Error).name
          }
          : undefined
      })

      logger.info(`Tool call completed: ${functionName}`, {
        toolCallId: id,
        success: result.success,
        executionTime: result.executionTime
      })

      // 🎯 追踪文档上下文变化
      if (result.success) {
        this.trackDocumentContextChange(functionName, args, result)
      }

      return {
        tool_call_id: id,
        role: 'tool',
        content: resultContent
      }
    } catch (error) {
      logger.error(`Tool call failed: ${functionName}`, {
        toolCallId: id,
        error: error instanceof Error ? error.message : String(error)
      })

      const errorResult = {
        success: false,
        message: `Function execution failed: ${error instanceof Error ? error.message : String(error)}`,
        error: {
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.constructor.name : 'Error'
        }
      }

      return {
        tool_call_id: id,
        role: 'tool',
        content: JSON.stringify(errorResult)
      }
    }
  }

  /**
   * 生成工具操作预览列表
   * 用于批量确认对话框显示
   */
  generateOperationPreviews(toolCalls: ToolCall[]): ToolOperationPreview[] {
    return toolCalls.map((toolCall) => {
      const func = this.registry.getFunction(toolCall.function.name)
      let args: Record<string, any> = {}
      try {
        args = JSON.parse(this.removeJsonComments(toolCall.function.arguments))
      } catch {
        args = {}
      }

      // 生成参数摘要
      const paramsSummary = this.generateParametersSummary(toolCall.function.name, args)

      // 计算预估时间
      let estimatedTime = 1000
      switch (func?.category) {
        case 'smart':
          estimatedTime = 3000
          break
        case 'layout':
          estimatedTime = 2000
          break
        case 'table':
          estimatedTime = 1500
          break
        case 'list':
          estimatedTime = 1000
          break
        case 'paragraph':
        case 'font':
        case 'style':
          estimatedTime = 500
          break
      }

      return {
        id: toolCall.id,
        toolName: toolCall.function.name,
        description: func?.description || toolCall.function.name,
        parametersSummary: paramsSummary,
        isHighRisk: func?.needsConfirmation === true,
        estimatedTime,
        selected: true
      }
    })
  }

  /**
   * 生成参数摘要（用户友好的描述）
   */
  private generateParametersSummary(toolName: string, args: Record<string, any>): string {
    const summaryParts: string[] = []

    // 根据工具类型生成友好的参数描述
    if (args.text) {
      const text = String(args.text)
      summaryParts.push(`文本: "${text.length > 20 ? text.substring(0, 20) + '...' : text}"`)
    }
    if (args.searchText) {
      summaryParts.push(`查找: "${args.searchText}"`)
    }
    if (args.replaceText !== undefined) {
      summaryParts.push(`替换为: "${args.replaceText}"`)
    }
    if (args.name) {
      summaryParts.push(`字体: ${args.name}`)
    }
    if (args.size) {
      summaryParts.push(`字号: ${args.size}`)
    }
    if (args.bold !== undefined) {
      summaryParts.push(args.bold ? '加粗' : '取消加粗')
    }
    if (args.italic !== undefined) {
      summaryParts.push(args.italic ? '斜体' : '取消斜体')
    }
    if (args.rows && args.columns) {
      summaryParts.push(`${args.rows}行 × ${args.columns}列`)
    }
    if (args.styleName) {
      summaryParts.push(`样式: ${args.styleName}`)
    }
    if (args.alignment) {
      const alignmentMap: Record<string, string> = {
        left: '左对齐',
        center: '居中',
        right: '右对齐',
        justify: '两端对齐'
      }
      summaryParts.push(alignmentMap[args.alignment] || args.alignment)
    }

    return summaryParts.length > 0 ? summaryParts.join(', ') : '无参数'
  }

  /**
   * 处理多个 Tool Calls（批量处理）
   *
   * ⚠️ 重要：Office.js API 要求串行执行，不能并行调用
   * 参考：https://learn.microsoft.com/en-us/office/dev/add-ins/develop/application-specific-api-model#concurrent-operations
   */
  async handleToolCalls(
    toolCalls: ToolCall[],
    context?: ToolCallContext,
    options?: {
      onProgress?: ProgressCallback
      skipBatchConfirm?: boolean
    }
  ): Promise<ToolCallResult[]> {
    if (!toolCalls || toolCalls.length === 0) {
      return []
    }

    logger.info(`Handling ${toolCalls.length} tool calls (serial execution for Office.js compatibility)`)

    // 按优先级排序工具调用（优先级高的先执行）
    let sortedToolCalls = [...toolCalls].sort((a, b) => {
      const priorityA = getToolPriority(a)
      const priorityB = getToolPriority(b)
      return priorityA - priorityB
    })

    if (sortedToolCalls.length > 1) {
      logger.debug('Tool calls sorted by priority', {
        original: toolCalls.map((t) => t.function.name),
        sorted: sortedToolCalls.map((t) => `${t.function.name}(p${getToolPriority(t)})`)
      })
    }

    // 批量确认功能
    if (this.onBatchConfirm && !options?.skipBatchConfirm && sortedToolCalls.length > 0) {
      const previews = this.generateOperationPreviews(sortedToolCalls)
      const estimate = this.getFunctionEstimate(sortedToolCalls)

      const confirmResult = await this.onBatchConfirm({
        title: `即将执行 ${sortedToolCalls.length} 个操作`,
        operations: previews,
        totalEstimatedTime: estimate.estimatedExecutionTime,
        highRiskCount: estimate.needsConfirmation
      })

      if (!confirmResult.confirmed) {
        logger.info('Batch operation cancelled by user')
        return sortedToolCalls.map((tc) => ({
          tool_call_id: tc.id,
          role: 'tool' as const,
          content: JSON.stringify({
            success: false,
            message: '操作已被用户取消'
          })
        }))
      }

      // 过滤只执行用户选中的操作
      if (confirmResult.selectedIds.length < sortedToolCalls.length) {
        sortedToolCalls = sortedToolCalls.filter((tc) => confirmResult.selectedIds.includes(tc.id))
        logger.info(`User selected ${sortedToolCalls.length} operations to execute`)
      }
    }

    const toolCallResults: ToolCallResult[] = []
    const progressCallback = options?.onProgress || this.onProgress
    const totalSteps = sortedToolCalls.length

    // 串行执行所有工具调用（Office.js 要求）
    for (let index = 0; index < sortedToolCalls.length; index++) {
      const toolCall = sortedToolCalls[index]
      const func = this.registry.getFunction(toolCall.function.name)

      // 发送进度更新
      if (progressCallback) {
        const progress: ProgressInfo = {
          currentStep: index + 1,
          totalSteps,
          stepDescription: func?.description || `执行 ${toolCall.function.name}`,
          functionName: toolCall.function.name,
          percentage: Math.round(((index + 1) / totalSteps) * 100)
        }
        progressCallback(progress)
      }

      try {
        const result = await this.handleToolCall(toolCall, context)
        toolCallResults.push(result)

        logger.debug(`Tool call ${index + 1}/${totalSteps} completed successfully`, {
          toolName: toolCall.function.name,
          toolCallId: toolCall.id
        })
      } catch (error) {
        logger.error(`Tool call ${index + 1}/${totalSteps} failed`, {
          toolName: toolCall.function.name,
          toolCallId: toolCall.id,
          error
        })

        // 为失败的工具调用创建错误结果
        toolCallResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content: JSON.stringify({
            success: false,
            message: `Tool call failed: ${error instanceof Error ? error.message : String(error)}`,
            error: {
              message: error instanceof Error ? error.message : String(error),
              name: error instanceof Error ? error.name : 'UnknownError'
            }
          })
        })
      }
    }

    const successCount = toolCallResults.filter((r) => {
      try {
        const content = JSON.parse(r.content)
        return content.success
      } catch {
        return false
      }
    }).length

    logger.info(`Batch tool calls completed`, {
      total: sortedToolCalls.length,
      success: successCount,
      failed: sortedToolCalls.length - successCount
    })

    return toolCallResults
  }

  /**
   * 设置批量确认回调
   */
  setBatchConfirmCallback(callback: BatchConfirmCallback): void {
    this.onBatchConfirm = callback
  }

  /**
   * 设置进度回调
   */
  setProgressCallback(callback: ProgressCallback): void {
    this.onProgress = callback
  }

  /**
   * 设置确认请求回调
   */
  setConfirmRequestCallback(callback: ConfirmRequestCallback): void {
    this.onConfirmRequest = callback
  }

  /**
   * 移除确认请求回调
   */
  removeConfirmRequestCallback(): void {
    this.onConfirmRequest = undefined
  }

  /**
   * 检查是否需要确认的函数数量
   */
  getNeedsConfirmationCount(toolCalls: ToolCall[]): number {
    return toolCalls.filter((toolCall) => {
      const func = this.registry.getFunction(toolCall.function.name)
      return func?.needsConfirmation === true
    }).length
  }

  /**
   * 获取函数执行预估信息
   */
  getFunctionEstimate(toolCalls: ToolCall[]): {
    totalCount: number
    needsConfirmation: number
    highRiskOperations: string[]
    estimatedExecutionTime: number
  } {
    let needsConfirmation = 0
    const highRiskOperations: string[] = []
    let estimatedExecutionTime = 0

    toolCalls.forEach((toolCall) => {
      const func = this.registry.getFunction(toolCall.function.name)

      if (func?.needsConfirmation) {
        needsConfirmation++
        highRiskOperations.push(func.name)
      }

      // 预估执行时间（基于函数类别）
      switch (func?.category) {
        case 'smart':
          estimatedExecutionTime += 3000 // 智能操作通常较慢
          break
        case 'layout':
          estimatedExecutionTime += 2000 // 页面布局操作
          break
        case 'table':
          estimatedExecutionTime += 1500 // 表格操作
          break
        case 'list':
          estimatedExecutionTime += 1000 // 列表操作
          break
        case 'paragraph':
        case 'font':
        case 'style':
          estimatedExecutionTime += 500 // 基础格式化操作
          break
        default:
          estimatedExecutionTime += 1000 // 默认预估时间
      }
    })

    return {
      totalCount: toolCalls.length,
      needsConfirmation,
      highRiskOperations,
      estimatedExecutionTime
    }
  }

  /**
   * 创建执行报告
   */
  async executeWithReport(toolCalls: ToolCall[]): Promise<{
    results: ToolCallResult[]
    report: {
      totalCalls: number
      successfulCalls: number
      failedCalls: number
      totalExecutionTime: number
      averageExecutionTime: number
      callDetails: Array<{
        functionName: string
        success: boolean
        executionTime?: number
        errorMessage?: string
      }>
    }
  }> {
    const startTime = Date.now()

    // 执行所有工具调用
    const results = await this.handleToolCalls(toolCalls)

    const totalExecutionTime = Date.now() - startTime

    // 生成详细报告
    const callDetails = results.map((result, index) => {
      const toolCall = toolCalls[index]
      let success = false
      let executionTime: number | undefined
      let errorMessage: string | undefined

      try {
        const content = JSON.parse(result.content)
        success = content.success
        executionTime = content.executionTime
        if (!success) {
          errorMessage = content.message
        }
      } catch (parseError) {
        errorMessage = `Failed to parse result: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      }

      return {
        functionName: toolCall.function.name,
        success,
        executionTime,
        errorMessage
      }
    })

    const successfulCalls = callDetails.filter((detail) => detail.success).length
    const failedCalls = callDetails.length - successfulCalls
    const averageExecutionTime = totalExecutionTime / toolCalls.length

    const report = {
      totalCalls: toolCalls.length,
      successfulCalls,
      failedCalls,
      totalExecutionTime,
      averageExecutionTime,
      callDetails
    }

    logger.info('Function execution report generated', report)

    return { results, report }
  }

  private mapCategoryToOperationType(
    category: FunctionCategory | undefined,
    functionName: string
  ): OperationRecord['operationType'] {
    if (functionName.includes('replace')) {
      return 'find_and_replace'
    }
    if (functionName.includes('insert')) {
      return 'insert_text'
    }

    switch (category) {
      case FunctionCategory.FONT:
      case FunctionCategory.PARAGRAPH:
      case FunctionCategory.STYLE:
      case FunctionCategory.LAYOUT:
      case FunctionCategory.LIST:
      case FunctionCategory.IMAGE:
      case FunctionCategory.TABLE:
      case FunctionCategory.REFERENCE:
      case FunctionCategory.SMART:
      case FunctionCategory.COMMENT:
        return 'format_text'
      default:
        return 'custom'
    }
  }

  /**
   * 移除 JSON 字符串中的注释
   * 支持单行注释和多行注释
   */
  private removeJsonComments(jsonString: string): string {
    // 移除单行注释 (//)
    // 注意：只移除不在字符串内的注释
    let result = jsonString.replace(/("(?:[^"\\]|\\.)*")|\/\/.*$/gm, (match, stringMatch) => {
      // 如果匹配到的是字符串，保留它；否则移除注释
      return stringMatch || ''
    })

    // 移除多行注释
    // 注意：只移除不在字符串内的注释
    // 使用构造函数创建正则以避免解析器混淆
    const multilineCommentRegex = new RegExp('("(?:[^"\\\\]|\\\\.)*")|\\/\\*[\\s\\S]*?\\*\\/', 'g')
    result = result.replace(multilineCommentRegex, (match, stringMatch) => {
      // 如果匹配到的是字符串，保留它；否则移除注释
      return stringMatch || ''
    })

    return result
  }

  private async executeWithUndoTracking(
    func: FormattingFunction,
    args: Record<string, any>,
    context?: ToolCallContext
  ): Promise<FunctionResult> {
    if (!this.undoManager) {
      return this.registry.executeFunction(func.name, args)
    }

    const operationType = this.mapCategoryToOperationType(func.category, func.name)
    const { result, record } = await this.undoManager.captureOperationWithSnapshot(
      operationType,
      `ToolCall:${func.name}`,
      args,
      context?.messageId,
      () => this.registry.executeFunction(func.name, args)
    )

    if (record && !result.success) {
      record.canUndo = false
    }

    return result
  }

  /**
   * 配置动态工具发现服务
   * @param apiHost 主应用 API 地址
   * @param apiKey API 密钥
   */
  configureDynamicToolDiscovery(apiHost: string, apiKey: string): void {
    this.dynamicToolDiscovery.configure(apiHost, apiKey)
    logger.info('Dynamic tool discovery configured for FunctionCallHandler')
  }

  /**
   * 获取动态工具发现服务实例
   */
  getDynamicToolDiscovery(): DynamicToolDiscovery {
    return this.dynamicToolDiscovery
  }

  /**
   * 追踪文档上下文变化
   * 记录表格、图片等元素的创建/修改，供后续工具选择使用
   */
  private trackDocumentContextChange(
    functionName: string,
    args: Record<string, any>,
    result: FunctionResult
  ): void {
    const store = useAppStore.getState()

    try {
      // 追踪表格插入
      if (functionName === 'word_insert_table' && result.success) {
        const rowCount = args.rows || 3
        const columnCount = args.columns || 3
        // 获取当前表格数量作为 index
        const tableIndex = store.tables.length
        store.recordTableInsert(tableIndex, rowCount, columnCount)
        logger.debug('[DocumentContext] Tracked table insert', { tableIndex, rowCount, columnCount })
      }

      // 追踪单元格写入
      if (functionName === 'word_set_cell_value' && result.success) {
        const tableIndex = args.tableIndex ?? 0
        store.recordCellWrite(tableIndex)
        logger.debug('[DocumentContext] Tracked cell write', { tableIndex })
      }

      // 追踪表格删除
      if (functionName === 'word_delete_table' && result.success) {
        const tableIndex = args.tableIndex ?? 0
        store.recordTableDelete(tableIndex)
        logger.debug('[DocumentContext] Tracked table delete', { tableIndex })
      }
    } catch (error) {
      logger.warn('[DocumentContext] Failed to track context change', {
        functionName,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }
}
