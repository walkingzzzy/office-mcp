/**
 * 格式化函数注册中心
 * 管理 AI Function Calling 的工具元数据（Schema、描述等）
 * 
 * ⚠️ 重要：此注册表仅存储工具元数据，不执行任何本地操作
 * 所有工具执行必须通过 MCP 架构处理（McpToolExecutor）
 */

import Logger from '../../utils/logger'
import { FormattingFunction, FunctionCategory, FunctionResult } from './types'

const logger = new Logger('FormattingFunctionRegistry')

/**
 * MCP-Only 执行错误
 * 当尝试通过本地 handler 执行工具时抛出此错误
 */
const MCP_ONLY_ERROR = (toolName: string): FunctionResult => ({
  success: false,
  message: `工具 "${toolName}" 只能通过 MCP 执行。请使用 McpToolExecutor 调用此工具。`,
  error: new Error(`Tool "${toolName}" is MCP-only. Use McpToolExecutor instead.`)
})

/**
 * 格式化函数注册中心类
 * 
 * 职责：
 * - 存储工具元数据（名称、描述、输入 Schema）
 * - 提供工具列表供 AI 选择
 * - 参数验证
 * 
 * ⚠️ 不负责执行：所有工具执行通过 McpToolExecutor → MCP Server 完成
 */
export class FormattingFunctionRegistry {
  private functions = new Map<string, FormattingFunction>()
  private initialized = false

  constructor() {
    // 构造函数现在为空，因为不再需要依赖服务
  }

  /**
   * 初始化所有格式化函数
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('Registry already initialized')
      return
    }

    logger.info('Initializing formatting function registry')

    // ==================== 工具元数据注册 ====================
    // 注意：所有 handler 都返回 MCP_ONLY_ERROR，实际执行通过 McpToolExecutor

    // word_insert_text - 文本插入工具
    this.register({
      name: 'word_insert_text',
      description: '向文档插入文本内容（支持写入、添加、生成文本）',
      category: FunctionCategory.PARAGRAPH,
      mcpOnly: true,
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: '要插入的文本内容' },
          location: { type: 'string', enum: ['start', 'end', 'after', 'before', 'replace'], description: '插入位置' }
        },
        required: ['text']
      },
      handler: async () => MCP_ONLY_ERROR('word_insert_text')
    })

    // word_add_paragraph - 段落添加工具
    this.register({
      name: 'word_add_paragraph',
      description: '向文档添加段落',
      category: FunctionCategory.PARAGRAPH,
      mcpOnly: true,
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: '要添加的文本内容' },
          location: { type: 'string', enum: ['start', 'end', 'after', 'before'], description: '插入位置' }
        },
        required: ['text']
      },
      handler: async () => MCP_ONLY_ERROR('word_add_paragraph')
    })

    // word_get_selected_text - 获取选中文本
    this.register({
      name: 'word_get_selected_text',
      description: '获取当前选中文本',
      category: FunctionCategory.SMART,
      mcpOnly: true,
      inputSchema: {
        type: 'object',
        properties: {
          includeFormatting: { type: 'boolean', description: '是否包含格式信息' }
        }
      },
      handler: async () => MCP_ONLY_ERROR('word_get_selected_text')
    })

    // word_read_document - 读取文档内容
    this.register({
      name: 'word_read_document',
      description: '读取整个文档内容',
      category: FunctionCategory.SMART,
      mcpOnly: true,
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => MCP_ONLY_ERROR('word_read_document')
    })

    this.initialized = true
    logger.info(`Registry initialized with ${this.functions.size} functions`)
  }

  /**
   * 注册单个函数
   */
  register(func: FormattingFunction): void {
    if (this.functions.has(func.name)) {
      logger.warn(`Function ${func.name} already registered, overwriting`)
    }

    this.functions.set(func.name, func)
    logger.debug(`Registered function: ${func.name}`)
  }

  /**
   * 获取函数定义
   */
  getFunction(name: string): FormattingFunction | undefined {
    return this.functions.get(name)
  }

  /**
   * 获取所有函数
   */
  getAllFunctions(): FormattingFunction[] {
    return Array.from(this.functions.values())
  }

  /**
   * 按类别获取函数
   */
  getFunctionsByCategory(category: FunctionCategory): FormattingFunction[] {
    return this.getAllFunctions().filter((func) => func.category === category)
  }

  /**
   * 转换为 OpenAI tools 格式
   */
  getAllFunctionsAsTools(): Array<{ type: 'function'; function: { name: string; description: string; parameters: FormattingFunction['inputSchema'] } }> {
    return this.getAllFunctions().map((func) => ({
      type: 'function' as const,
      function: {
        name: func.name,
        description: func.description,
        parameters: func.inputSchema
      }
    }))
  }

  /**
   * 按优先级获取函数（用于动态工具选择）
   */
  getFunctionsByPriority(maxCount: number = 10, categories?: FunctionCategory[]): FormattingFunction[] {
    let functions = this.getAllFunctions()

    // 按类别过滤
    if (categories && categories.length > 0) {
      functions = functions.filter((func) => categories.includes(func.category))
    }

    // 按优先级排序
    functions.sort((a, b) => (a.priority || 999) - (b.priority || 999))

    return functions.slice(0, maxCount)
  }

  /**
   * 执行函数
   *
   * @deprecated 此方法已废弃，所有工具执行应通过 McpToolExecutor
   * 保留此方法仅用于向后兼容，会记录警告并返回 MCP_ONLY_ERROR
   */
  async executeFunction(name: string, args: Record<string, unknown>): Promise<FunctionResult> {
    const startTime = Date.now()

    logger.warn('[REGISTRY_DEPRECATED] ⚠️ 直接调用 executeFunction 已废弃，请使用 McpToolExecutor', {
      functionName: name,
      args: JSON.stringify(args).substring(0, 200),
      suggestion: '使用 McpToolExecutor.executeTool() 替代'
    })

    const func = this.getFunction(name)
    if (!func) {
      logger.error('[REGISTRY_DEPRECATED] ❌ 函数未找到', {
        functionName: name,
        registeredFunctions: Array.from(this.functions.keys())
      })
      return {
        success: false,
        message: `Function not found: ${name}. 请使用 McpToolExecutor 执行 MCP 工具。`,
        error: new Error(`Function not found: ${name}`),
        executionTime: Date.now() - startTime
      }
    }

    // 验证参数（仍然执行验证，便于早期发现问题）
    try {
      this.validateArguments(func, args)
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? error : new Error(String(error)),
        executionTime: Date.now() - startTime
      }
    }

    // 检查是否为 MCP-only 工具
    if (func.mcpOnly) {
      logger.error('[REGISTRY_DEPRECATED] ❌ 此工具只能通过 MCP 执行', {
        functionName: name,
        mcpOnly: true
      })
      return {
        ...MCP_ONLY_ERROR(name),
        executionTime: Date.now() - startTime
      }
    }

    // 如果有自定义执行器（来自 MCP 同步），使用它
    if (func.executor) {
      logger.info('[REGISTRY] 使用 MCP 同步的执行器', { functionName: name })
      try {
        const result = await func.executor(args)
        return {
          ...result,
          executionTime: Date.now() - startTime
        }
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : String(error),
          error: error instanceof Error ? error : new Error(String(error)),
          executionTime: Date.now() - startTime
        }
      }
    }

    // 默认返回 MCP_ONLY_ERROR
    return {
      ...MCP_ONLY_ERROR(name),
      executionTime: Date.now() - startTime
    }
  }

  /**
   * 验证函数参数
   */
  private validateArguments(func: FormattingFunction, args: Record<string, unknown>): void {
    const schema = func.inputSchema
    const required = schema.required || []

    // 检查必需参数
    for (const paramName of required) {
      if (!(paramName in args)) {
        throw new Error(`Missing required parameter: ${paramName}`)
      }
    }

    // 检查参数类型（基础验证）
    for (const [paramName, paramValue] of Object.entries(args)) {
      const paramSchema = schema.properties[paramName]
      if (!paramSchema) continue

      const expectedType = paramSchema.type
      const actualType = typeof paramValue

      // 类型检查
      if (expectedType === 'number' && actualType !== 'number') {
        throw new Error(`Parameter ${paramName} must be a number`)
      }
      if (expectedType === 'string' && actualType !== 'string') {
        throw new Error(`Parameter ${paramName} must be a string`)
      }
      if (expectedType === 'boolean' && actualType !== 'boolean') {
        throw new Error(`Parameter ${paramName} must be a boolean`)
      }

      // 枚举值检查
      if (paramSchema.enum && !paramSchema.enum.includes(paramValue as string | number | boolean)) {
        throw new Error(`Parameter ${paramName} must be one of: ${paramSchema.enum.join(', ')}`)
      }
    }
  }

  /**
   * 获取注册统计信息
   */
  getStats() {
    const stats = {
      totalFunctions: this.functions.size,
      categoryBreakdown: {} as Record<string, number>,
      priorityBreakdown: {} as Record<number, number>
    }

    this.getAllFunctions().forEach((func) => {
      // 按类别统计
      const category = func.category || 'unknown'
      stats.categoryBreakdown[category] = (stats.categoryBreakdown[category] || 0) + 1

      // 按优先级统计
      const priority = func.priority || 999
      stats.priorityBreakdown[priority] = (stats.priorityBreakdown[priority] || 0) + 1
    })

    return stats
  }
}

/**
 * 获取函数注册中心实例（单例模式）
 */
let registryInstance: FormattingFunctionRegistry | null = null

export function getFunctionRegistry(): FormattingFunctionRegistry {
  if (!registryInstance) {
    registryInstance = new FormattingFunctionRegistry()
  }
  return registryInstance
}
