/**
 * 工具注册系统 - Phase 2 核心组件
 */

import type { ToolDefinition } from '../tools/types.js'
import { logger } from '@office-mcp/shared'

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>()
  private categories = new Map<string, Set<string>>()

  /**
   * 注册单个工具
   */
  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool)

    const category = tool.category || 'common'
    if (!this.categories.has(category)) {
      this.categories.set(category, new Set())
    }
    this.categories.get(category)!.add(tool.name)

    logger.info(`Tool registered: ${tool.name} (${category})`)
  }

  /**
   * 批量注册工具
   */
  registerBatch(tools: ToolDefinition[]): void {
    tools.forEach((tool) => this.register(tool))
  }

  /**
   * 获取工具
   */
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name)
  }

  /**
   * 获取所有工具
   */
  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  async executeTool(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name)
    if (!tool) {
      throw new Error(`Tool not found: ${name}`)
    }
    return await tool.handler(args)
  }

  getToolCount(): number {
    return this.tools.size
  }

  clear(): void {
    this.tools.clear()
    this.categories.clear()
  }

  /**
   * 按分类获取工具
   */
  getByCategory(category: string): ToolDefinition[] {
    const toolNames = this.categories.get(category)
    if (!toolNames) return []

    return Array.from(toolNames)
      .map((name) => this.tools.get(name)!)
      .filter(Boolean)
  }

  /**
   * 卸载工具
   */
  unregister(name: string): boolean {
    const tool = this.tools.get(name)
    if (!tool) return false

    this.tools.delete(name)
    const category = tool.category || 'common'
    this.categories.get(category)?.delete(name)

    logger.info(`Tool unregistered: ${name}`)
    return true
  }

  /**
   * 获取统计信息
   */
  getStats(): { total: number; byCategory: Record<string, number> } {
    const byCategory: Record<string, number> = {}

    for (const [category, tools] of this.categories) {
      byCategory[category] = tools.size
    }

    return {
      total: this.tools.size,
      byCategory
    }
  }
}
