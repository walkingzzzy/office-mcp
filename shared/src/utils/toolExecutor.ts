/**
 * 工具执行包装器
 * 提供统一的参数验证和错误处理
 */

import { sendIPCCommand, IPCToolExecutionResult, IPCConfig } from './ipc.js'
import { ErrorCode, formatErrorMessage, getErrorSuggestion, isRetryable } from './ErrorCodes.js'
import { logger } from './logger.js'

/**
 * 工具执行选项
 */
export interface ToolExecutorOptions {
  /** 工具名称（用于日志和错误消息） */
  toolName: string
  /** IPC 命令名称 */
  command: string
  /** 工具参数 */
  args: Record<string, unknown>
  /** 必需参数列表 */
  requiredParams?: string[]
  /** 可选的 IPC 配置覆盖 */
  ipcConfig?: Partial<IPCConfig>
}

/**
 * 工具执行结果（统一格式）
 */
export interface ToolExecutionResponse {
  /** 是否成功 */
  success: boolean
  /** 成功时的结果数据 */
  result?: unknown
  /** 失败时的错误信息 */
  error?: string
  /** 错误码（失败时） */
  errorCode?: ErrorCode
  /** 恢复建议（失败时） */
  suggestion?: string
  /** 是否可重试（失败时） */
  retryable?: boolean
}

/**
 * 验证必需参数
 * @param args 参数对象
 * @param requiredParams 必需参数列表
 * @returns 缺少的参数列表（空数组表示验证通过）
 */
function validateRequiredParams(
  args: Record<string, unknown>,
  requiredParams: string[]
): string[] {
  const missingParams: string[] = []
  
  for (const param of requiredParams) {
    const value = args[param]
    if (value === undefined || value === null) {
      missingParams.push(param)
    }
  }
  
  return missingParams
}

/**
 * 将 IPC 错误转换为工具执行响应
 * @param toolName 工具名称
 * @param errorMessage 原始错误消息
 * @returns 工具执行响应
 */
function mapIPCErrorToResponse(toolName: string, errorMessage: string): ToolExecutionResponse {
  // 根据错误消息内容推断错误类型
  let errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR
  let details = errorMessage
  
  // 检查是否是超时错误
  if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
    errorCode = ErrorCode.API_TIMEOUT
    details = `工具 ${toolName} 执行超时`
  }
  // 检查是否是连接错误
  else if (
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('fetch failed')
  ) {
    errorCode = ErrorCode.IPC_COMMUNICATION_ERROR
    details = `无法连接到 Office 插件：${errorMessage}`
  }
  // 检查是否是网络错误
  else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
    errorCode = ErrorCode.NETWORK_REQUEST_FAILED
    details = errorMessage
  }
  // 检查是否是权限错误
  else if (
    errorMessage.includes('permission') ||
    errorMessage.includes('Permission') ||
    errorMessage.includes('denied')
  ) {
    errorCode = ErrorCode.PERMISSION_DENIED
    details = errorMessage
  }
  // 检查是否是文档相关错误
  else if (errorMessage.includes('document') || errorMessage.includes('Document')) {
    if (errorMessage.includes('not open') || errorMessage.includes('未打开')) {
      errorCode = ErrorCode.DOCUMENT_NOT_OPEN
      details = '文档未打开'
    } else if (errorMessage.includes('readonly') || errorMessage.includes('只读')) {
      errorCode = ErrorCode.DOCUMENT_READONLY
      details = '文档为只读模式'
    } else if (errorMessage.includes('protected') || errorMessage.includes('保护')) {
      errorCode = ErrorCode.DOCUMENT_PROTECTED
      details = '文档已被保护'
    }
  }
  // 检查是否是资源不存在错误
  else if (
    errorMessage.includes('not found') ||
    errorMessage.includes('Not found') ||
    errorMessage.includes('不存在')
  ) {
    errorCode = ErrorCode.RESOURCE_NOT_FOUND
    details = errorMessage
  }
  
  return {
    success: false,
    error: formatErrorMessage(errorCode, { details, toolName }),
    errorCode,
    suggestion: getErrorSuggestion(errorCode),
    retryable: isRetryable(errorCode)
  }
}

/**
 * 执行工具并统一处理错误
 * 
 * 该函数提供以下功能：
 * 1. 验证必需参数是否存在
 * 2. 调用 IPC 命令执行工具
 * 3. 捕获并转换错误为友好格式
 * 4. 使用 ErrorCodes 体系格式化错误信息
 * 
 * @param options 工具执行选项
 * @returns 统一格式的执行结果
 * 
 * @example
 * ```typescript
 * // 在工具 handler 中使用
 * handler: async (args: any) => executeToolWithErrorHandling({
 *   toolName: 'excel_add_worksheet',
 *   command: 'excel_add_worksheet',
 *   args,
 *   requiredParams: ['name']
 * })
 * ```
 */
export async function executeToolWithErrorHandling(
  options: ToolExecutorOptions
): Promise<ToolExecutionResponse> {
  const { toolName, command, args, requiredParams = [], ipcConfig } = options
  
  logger.debug(`[ToolExecutor] 开始执行工具: ${toolName}`, {
    command,
    requiredParams,
    argKeys: Object.keys(args)
  })
  
  // 1. 参数验证
  const missingParams = validateRequiredParams(args, requiredParams)
  if (missingParams.length > 0) {
    const errorMessage = formatErrorMessage(ErrorCode.MISSING_REQUIRED_PARAM, {
      param: missingParams.join(', ')
    })
    
    logger.warn(`[ToolExecutor] 工具 ${toolName} 缺少必需参数`, {
      missingParams
    })
    
    return {
      success: false,
      error: errorMessage,
      errorCode: ErrorCode.MISSING_REQUIRED_PARAM,
      suggestion: getErrorSuggestion(ErrorCode.MISSING_REQUIRED_PARAM),
      retryable: false
    }
  }
  
  // 2. 执行 IPC 命令
  try {
    const result: IPCToolExecutionResult = await sendIPCCommand(command, args, ipcConfig)
    
    // 3. 处理执行结果
    if (result.success) {
      logger.debug(`[ToolExecutor] 工具 ${toolName} 执行成功`)
      return {
        success: true,
        result: result.data
      }
    } else {
      // IPC 返回了失败结果
      logger.warn(`[ToolExecutor] 工具 ${toolName} 执行失败`, {
        error: result.error
      })
      
      return mapIPCErrorToResponse(toolName, result.error || '未知错误')
    }
  } catch (error: unknown) {
    // 4. 捕获意外异常
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    logger.error(`[ToolExecutor] 工具 ${toolName} 执行异常`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return mapIPCErrorToResponse(toolName, errorMessage)
  }
}

/**
 * 创建工具执行器的便捷工厂函数
 * 
 * 用于创建预配置的工具执行函数，减少重复代码
 * 
 * @param toolName 工具名称
 * @param command IPC 命令名称
 * @param requiredParams 必需参数列表
 * @returns 工具处理函数
 * 
 * @example
 * ```typescript
 * // 创建工具执行器
 * const executeExcelAddWorksheet = createToolExecutor(
 *   'excel_add_worksheet',
 *   'excel_add_worksheet',
 *   ['name']
 * )
 * 
 * // 在工具定义中使用
 * {
 *   name: 'excel_add_worksheet',
 *   handler: (args) => executeExcelAddWorksheet(args)
 * }
 * ```
 */
export function createToolExecutor(
  toolName: string,
  command: string,
  requiredParams: string[] = []
): (args: Record<string, unknown>) => Promise<ToolExecutionResponse> {
  return (args: Record<string, unknown>) =>
    executeToolWithErrorHandling({
      toolName,
      command,
      args,
      requiredParams
    })
}
