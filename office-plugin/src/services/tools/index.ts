/**
 * Office 工具注册中心
 * 汇总所有 Office 工具模块并导出统一的工具注册表
 *
 * 工具数量统计（更新于 2025-12-27 - 压缩版本）:
 *
 * 【MCP Server 压缩版工具】
 * - Word: 28 个压缩工具（原 160 个，压缩率 82.5%）
 * - Excel: 19 个压缩工具（原 162 个，压缩率 88.3%）
 * - PowerPoint: 12 个压缩工具（原 87 个，压缩率 86.2%）
 * - 总计: 59 个压缩工具（原 409 个）
 *
 * 【本地工具定义】（保持旧版工具名，通过 MCP Server 兼容层转换）
 * - Word: ~160 个工具（包含 P0/P1/P2 阶段）
 * - Excel: ~132 个工具（包含 P0/P1/P2 阶段）
 * - PowerPoint: ~83 个工具（包含 P0/P1/P2 阶段）
 * - 总计: ~375 个工具
 *
 * 注意：
 * 1. MCP Server 已切换到压缩版工具，使用 action 参数模式
 * 2. 旧版工具名通过 MCP Server 的向后兼容层自动转换
 * 3. 本地工具定义仅用于元数据获取，实际执行通过 MCP Server
 */

import type { ToolDefinition, ToolRegistry, ToolHandler } from './types'
import { allWordTools, createWordToolRegistry } from './word'
import { allExcelTools, createExcelToolRegistry } from './excel'
import { allPowerPointTools, createPowerPointToolRegistry } from './powerpoint'
import Logger from '../../utils/logger'

const logger = new Logger('ToolRegistry')

/**
 * 所有 Office 工具定义
 */
export const allOfficeTools: ToolDefinition[] = [
  ...allWordTools,
  ...allExcelTools,
  ...allPowerPointTools
]

/**
 * 创建完整的工具注册表
 */
export function createOfficeToolRegistry(): ToolRegistry {
  const registry: ToolRegistry = new Map()
  
  // 合并所有工具
  for (const tool of allOfficeTools) {
    if (registry.has(tool.name)) {
      logger.warn(`Duplicate tool name: ${tool.name}`)
    }
    registry.set(tool.name, tool.handler)
  }
  
  return registry
}

/**
 * 获取工具处理器
 */
export function getToolHandler(toolName: string): ToolHandler | undefined {
  const tool = allOfficeTools.find(t => t.name === toolName)
  return tool?.handler
}

/**
 * 获取工具分类
 */
export function getToolsByCategory(category: string): ToolDefinition[] {
  return allOfficeTools.filter(t => t.category === category)
}

/**
 * 获取按应用分组的工具
 */
export function getToolsByApplication(): {
  word: ToolDefinition[]
  excel: ToolDefinition[]
  powerpoint: ToolDefinition[]
} {
  return {
    word: allWordTools,
    excel: allExcelTools,
    powerpoint: allPowerPointTools
  }
}

/**
 * 获取工具统计信息
 */
export function getToolStats(): {
  total: number
  word: number
  excel: number
  powerpoint: number
  byCategory: Record<string, number>
} {
  const byCategory: Record<string, number> = {}
  
  for (const tool of allOfficeTools) {
    byCategory[tool.category] = (byCategory[tool.category] || 0) + 1
  }
  
  return {
    total: allOfficeTools.length,
    word: allWordTools.length,
    excel: allExcelTools.length,
    powerpoint: allPowerPointTools.length,
    byCategory
  }
}

/**
 * 获取所有工具名称（用于调试）
 */
export function getAllToolNames(): string[] {
  return allOfficeTools.map(t => t.name)
}

/**
 * 检查工具是否存在
 */
export function hasToolHandler(toolName: string): boolean {
  return allOfficeTools.some(t => t.name === toolName)
}

// 导出类型
export type { ToolDefinition, ToolRegistry, ToolHandler } from './types'
export { successResult, errorResult } from './types'

// 导出子模块
export { allWordTools, createWordToolRegistry } from './word'
export { allExcelTools, createExcelToolRegistry } from './excel'
export { allPowerPointTools, createPowerPointToolRegistry } from './powerpoint'
