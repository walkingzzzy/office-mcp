/**
 * 工具映射模块入口
 * 
 * 合并所有应用的关键词映射，提供统一的导出接口
 */

import { WORD_TOOL_MAPPINGS } from './wordToolMappings'
import { EXCEL_TOOL_MAPPINGS } from './excelToolMappings'
import { PPT_TOOL_MAPPINGS } from './pptToolMappings'
import { CROSS_APP_MAPPINGS } from './crossAppMappings'

// 导出各应用映射（用于单独访问）
export { WORD_TOOL_MAPPINGS } from './wordToolMappings'
export { EXCEL_TOOL_MAPPINGS } from './excelToolMappings'
export { PPT_TOOL_MAPPINGS } from './pptToolMappings'
export { CROSS_APP_MAPPINGS } from './crossAppMappings'

/**
 * 合并所有关键词到工具的映射
 * 
 * 注意：跨应用映射会覆盖单应用映射中的同名键
 * 这确保了跨应用关键词能正确映射到所有相关工具
 */
export const KEYWORD_TO_TOOLS_MAPPING: Record<string, string[]> = {
  ...WORD_TOOL_MAPPINGS,
  ...EXCEL_TOOL_MAPPINGS,
  ...PPT_TOOL_MAPPINGS,
  ...CROSS_APP_MAPPINGS  // 最后合并，覆盖单应用中的重复键
}

/**
 * 获取特定应用的工具映射
 */
export function getToolMappingsByApp(app: 'word' | 'excel' | 'ppt' | 'all'): Record<string, string[]> {
  switch (app) {
    case 'word':
      return { ...WORD_TOOL_MAPPINGS }
    case 'excel':
      return { ...EXCEL_TOOL_MAPPINGS }
    case 'ppt':
      return { ...PPT_TOOL_MAPPINGS }
    case 'all':
    default:
      return KEYWORD_TO_TOOLS_MAPPING
  }
}

/**
 * 统计各应用的映射数量
 */
export function getToolMappingStats(): { word: number; excel: number; ppt: number; crossApp: number; total: number } {
  return {
    word: Object.keys(WORD_TOOL_MAPPINGS).length,
    excel: Object.keys(EXCEL_TOOL_MAPPINGS).length,
    ppt: Object.keys(PPT_TOOL_MAPPINGS).length,
    crossApp: Object.keys(CROSS_APP_MAPPINGS).length,
    total: Object.keys(KEYWORD_TO_TOOLS_MAPPING).length
  }
}
