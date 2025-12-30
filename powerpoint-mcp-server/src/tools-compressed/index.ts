/**
 * PowerPoint MCP Server 压缩工具索引
 * 将 87 个原工具压缩为 12 个统一工具
 */

// 导出类型定义
export * from './types.js'

// 导出所有压缩工具
export { pptSlideTool } from './slide.js'
export { pptShapeTool } from './shape.js'
export { pptMediaTool } from './media.js'
export { pptAnimationTool } from './animation.js'
export { pptMasterTool } from './master.js'
export { pptCustomLayoutTool } from './customLayout.js'
export { pptNotesTool } from './notes.js'
export { pptHyperlinkTool } from './hyperlink.js'
export { pptExportTool } from './export.js'
export { pptCommentTool } from './comment.js'
export { pptSlideshowSettingsTool } from './slideshowSettings.js'
export { pptEducationTool } from './education.js'

// 导入所有工具用于统一导出
import { pptSlideTool } from './slide.js'
import { pptShapeTool } from './shape.js'
import { pptMediaTool } from './media.js'
import { pptAnimationTool } from './animation.js'
import { pptMasterTool } from './master.js'
import { pptCustomLayoutTool } from './customLayout.js'
import { pptNotesTool } from './notes.js'
import { pptHyperlinkTool } from './hyperlink.js'
import { pptExportTool } from './export.js'
import { pptCommentTool } from './comment.js'
import { pptSlideshowSettingsTool } from './slideshowSettings.js'
import { pptEducationTool } from './education.js'
import type { ToolDefinition } from './types.js'

/**
 * 所有压缩后的 PowerPoint 工具列表
 */
export const compressedPowerPointTools: ToolDefinition[] = [
  // 核心幻灯片操作
  pptSlideTool,      // 幻灯片管理 (10 actions)
  pptShapeTool,      // 形状与文本 (12 actions)
  pptMediaTool,      // 图片与媒体 (10 actions)
  pptAnimationTool,  // 动画与放映 (8 actions)

  // 母版与布局
  pptMasterTool,       // 母版管理 (6 actions)
  pptCustomLayoutTool, // 自定义布局 (7 actions)

  // 内容与导航
  pptNotesTool,     // 备注管理 (5 actions)
  pptHyperlinkTool, // 超链接 (5 actions)
  pptExportTool,    // 导出功能 (3 actions)

  // 协作与设置
  pptCommentTool,          // 批注管理 (9 actions)
  pptSlideshowSettingsTool, // 放映设置 (10 actions)

  // 教育场景
  pptEducationTool  // 教育工具 (2 actions)
]

/**
 * 工具名称到工具定义的映射
 */
export const toolMap: Record<string, ToolDefinition> = Object.fromEntries(
  compressedPowerPointTools.map(tool => [tool.name, tool])
)

/**
 * 获取工具定义
 */
export function getTool(name: string): ToolDefinition | undefined {
  return toolMap[name]
}

/**
 * 获取所有工具名称
 */
export function getToolNames(): string[] {
  return compressedPowerPointTools.map(tool => tool.name)
}

/**
 * 压缩统计信息
 */
export const compressionStats = {
  originalToolCount: 87,
  compressedToolCount: compressedPowerPointTools.length,
  compressionRate: `${Math.round((1 - compressedPowerPointTools.length / 87) * 100)}%`,
  totalActions: compressedPowerPointTools.reduce((sum, tool) => {
    const actions = tool.metadata?.supportedActions?.length || 0
    return sum + actions
  }, 0)
}

export default compressedPowerPointTools
