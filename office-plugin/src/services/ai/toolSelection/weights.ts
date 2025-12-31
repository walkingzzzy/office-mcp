/**
 * 工具类别权重配置
 * 
 * 用于在工具选择时根据类别调整优先级
 */

import { FunctionCategory } from '../types'

/**
 * 类别权重配置
 * 
 * 权重值说明：
 * - 1.0: 标准权重
 * - > 1.0: 优先级提升
 * - < 1.0: 优先级降低
 */
export const CATEGORY_WEIGHTS: Record<FunctionCategory, number> = {
  [FunctionCategory.FONT]: 1.0,
  [FunctionCategory.PARAGRAPH]: 1.0,
  [FunctionCategory.STYLE]: 0.9,
  [FunctionCategory.SMART]: 1.2,      // 智能功能权重稍高
  [FunctionCategory.IMAGE]: 1.3,      // 图片功能权重高
  [FunctionCategory.COMMENT]: 1.1,    // 批注功能权重
  [FunctionCategory.TABLE]: 1.3,      // 表格权重高，确保表格相关需求优先匹配
  [FunctionCategory.LIST]: 1.1,       // 列表功能权重提升，优先于样式
  [FunctionCategory.LAYOUT]: 0.6,
  [FunctionCategory.REFERENCE]: 0.8   // 引用功能权重
}

/**
 * 获取类别权重
 * 
 * @param category - 功能类别
 * @returns 权重值，未知类别返回 1.0
 */
export function getCategoryWeight(category: FunctionCategory): number {
  return CATEGORY_WEIGHTS[category] ?? 1.0
}

/**
 * 优先级标签到数值的映射
 */
export const PRIORITY_LABEL_TO_VALUE: Record<string, number> = {
  'P0': 0,  // 最高优先级
  'P1': 1,
  'P2': 2   // 最低优先级
}

/**
 * 根据优先级标签获取数值
 */
export function getPriorityValue(label: string | undefined): number | undefined {
  if (!label) return undefined
  return PRIORITY_LABEL_TO_VALUE[label]
}
