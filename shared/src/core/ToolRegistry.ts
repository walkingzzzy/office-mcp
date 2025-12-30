/**
 * 工具注册系统
 * 提供类型安全的工具注册、查询和执行
 */

import type {
  ToolDefinition,
  ToolExecutionResult,
  ToolRegistryStats
} from '../types/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('ToolRegistry')

/**
 * 类型安全的工具注册表
 */
export class ToolRegistry {
  private tools = new Map<string, ToolDefinition<unknown, unknown>>()
  private categories = new Map<string, Set<string>>()
  private tags = new Map<string, Set<string>>()

  /**
   * 注册单个工具
   */
  register<TArgs, TResult>(tool: ToolDefinition<TArgs, TResult>): void {
    if (this.tools.has(tool.name)) {
      logger.warn(`工具已存在，将被覆盖: ${tool.name}`)
    }

    this.tools.set(tool.name, tool as ToolDefinition<unknown, unknown>)

    // 分类索引
    if (!this.categories.has(tool.category)) {
      this.categories.set(tool.category, new Set())
    }
    this.categories.get(tool.category)!.add(tool.name)

    // 标签索引
    if (tool.tags) {
      for (const tag of tool.tags) {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, new Set())
        }
        this.tags.get(tag)!.add(tool.name)
      }
    }

    logger.debug(`工具已注册: ${tool.name}`, { category: tool.category })
  }

  /**
   * 批量注册工具
   */
  registerBatch(tools: ToolDefinition<unknown, unknown>[]): void {
    for (const tool of tools) {
      this.register(tool)
    }
    logger.info(`批量注册完成: ${tools.length} 个工具`)
  }

  /**
   * 获取工具
   */
  get<TArgs = unknown, TResult = unknown>(name: string): ToolDefinition<TArgs, TResult> | undefined {
    return this.tools.get(name) as ToolDefinition<TArgs, TResult> | undefined
  }

  /**
   * 检查工具是否存在
   */
  has(name: string): boolean {
    return this.tools.has(name)
  }

  /**
   * 获取所有工具
   */
  getAll(): ToolDefinition<unknown, unknown>[] {
    return Array.from(this.tools.values())
  }

  /**
   * 获取所有启用的工具
   */
  getEnabled(): ToolDefinition<unknown, unknown>[] {
    return this.getAll().filter(tool => tool.enabled !== false)
  }

  /**
   * 按分类获取工具
   */
  getByCategory(category: string): ToolDefinition<unknown, unknown>[] {
    const toolNames = this.categories.get(category)
    if (!toolNames) return []

    return Array.from(toolNames)
      .map(name => this.tools.get(name)!)
      .filter(Boolean)
  }

  /**
   * 按标签获取工具
   */
  getByTag(tag: string): ToolDefinition<unknown, unknown>[] {
    const toolNames = this.tags.get(tag)
    if (!toolNames) return []

    return Array.from(toolNames)
      .map(name => this.tools.get(name)!)
      .filter(Boolean)
  }

  /**
   * 执行工具（类型安全）
   */
  async execute<TArgs, TResult>(
    name: string,
    args: TArgs
  ): Promise<ToolExecutionResult<TResult>> {
    const tool = this.tools.get(name)

    if (!tool) {
      return {
        success: false,
        message: `工具未找到: ${name}`,
        error: `Tool not found: ${name}`
      }
    }

    if (tool.enabled === false) {
      return {
        success: false,
        message: `工具已禁用: ${name}`,
        error: `Tool is disabled: ${name}`
      }
    }

    const startTime = Date.now()

    try {
      logger.debug(`执行工具: ${name}`, { args })
      const result = await tool.handler(args)
      const executionTime = Date.now() - startTime

      logger.debug(`工具执行完成: ${name}`, {
        success: result.success,
        executionTime
      })

      return {
        ...result,
        executionTime
      } as ToolExecutionResult<TResult>
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)

      logger.error(`工具执行失败: ${name}`, {
        error: errorMessage,
        executionTime
      })

      return {
        success: false,
        message: `工具执行失败: ${errorMessage}`,
        error: errorMessage,
        executionTime
      }
    }
  }

  /**
   * 卸载工具
   */
  unregister(name: string): boolean {
    const tool = this.tools.get(name)
    if (!tool) return false

    this.tools.delete(name)
    this.categories.get(tool.category)?.delete(name)

    if (tool.tags) {
      for (const tag of tool.tags) {
        this.tags.get(tag)?.delete(name)
      }
    }

    logger.info(`工具已卸载: ${name}`)
    return true
  }

  /**
   * 获取工具数量
   */
  getToolCount(): number {
    return this.tools.size
  }

  /**
   * 获取分类列表
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys())
  }

  /**
   * 获取标签列表
   */
  getTags(): string[] {
    return Array.from(this.tags.keys())
  }

  /**
   * 获取统计信息
   */
  getStats(): ToolRegistryStats {
    const byCategory: Record<string, number> = {}
    const byPriority: Record<string, number> = {}

    for (const [category, tools] of this.categories) {
      byCategory[category] = tools.size
    }

    for (const tool of this.tools.values()) {
      const priority = tool.priority ?? 'unknown'
      byPriority[priority] = (byPriority[priority] ?? 0) + 1
    }

    return {
      total: this.tools.size,
      byCategory,
      byPriority
    }
  }

  /**
   * 清空所有工具
   */
  clear(): void {
    this.tools.clear()
    this.categories.clear()
    this.tags.clear()
    logger.info('工具注册表已清空')
  }

  /**
   * 导出工具定义（用于 MCP 协议）
   */
  exportForMCP(): Array<{
    name: string
    description: string
    inputSchema: unknown
  }> {
    return this.getEnabled().map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  }
}

/**
 * 创建工具注册表
 */
export function createToolRegistry(): ToolRegistry {
  return new ToolRegistry()
}
