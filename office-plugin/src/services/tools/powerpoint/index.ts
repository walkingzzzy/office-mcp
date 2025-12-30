/**
 * PowerPoint 工具注册中心
 * 汇总所有 PowerPoint 工具模块并导出统一的工具注册表
 *
 * 对应 MCP 服务器定义的 ~119 个 PowerPoint 工具
 */

import type { ToolDefinition, ToolRegistry } from '../types'
import { slideTools } from './SlideTools'
import { shapeTools } from './ShapeTools'
// mediaTools 已被 mediaEnhancementTools (P2) 替代
// import { mediaTools } from './MediaTools'
import { animationTools } from './AnimationTools'
import { pptEducationToolDefinitions } from './EducationTools'
// P1 阶段工具导入
import { masterTools } from './MasterTools'
import { notesTools } from './NotesTools'
import { hyperlinkTools } from './HyperlinkTools'
import { exportTools } from './ExportTools'
// P2 阶段工具导入
import { pptCommentTools } from './CommentTools'
import { customLayoutTools } from './CustomLayoutTools'
import { slideShowSettingsTools } from './SlideShowSettingsTools'
import { mediaEnhancementTools } from './MediaEnhancementTools'

/**
 * 所有 PowerPoint 工具定义
 */
export const allPowerPointTools: ToolDefinition[] = [
  // 幻灯片操作 (10)
  ...slideTools,
  // 形状和文本操作 (12)
  ...shapeTools,
  // 媒体操作 - 已移至 mediaEnhancementTools (P2)
  // 动画操作 (8)
  ...animationTools,
  // 教育工具 (2) - P1
  ...pptEducationToolDefinitions,
  // 母版工具 (6) - P1
  ...masterTools,
  // 备注工具 (5) - P1
  ...notesTools,
  // 超链接工具 (5) - P1
  ...hyperlinkTools,
  // 导出工具 (3) - P1
  ...exportTools,
  // 批注工具 (9) - P2
  ...pptCommentTools,
  // 自定义布局工具 (7) - P2
  ...customLayoutTools,
  // 幻灯片播放设置工具 (10) - P2
  ...slideShowSettingsTools,
  // 媒体增强工具 (6) - P2
  ...mediaEnhancementTools
]

/**
 * 创建 PowerPoint 工具注册表
 */
export function createPowerPointToolRegistry(): ToolRegistry {
  const registry: ToolRegistry = new Map()
  
  for (const tool of allPowerPointTools) {
    registry.set(tool.name, tool.handler)
  }
  
  return registry
}

/**
 * 获取工具列表（用于调试）
 */
export function getPowerPointToolNames(): string[] {
  return allPowerPointTools.map(t => t.name)
}

/**
 * 按类别分组的工具
 */
export const pptToolsByCategory = {
  slide: slideTools,
  shape: shapeTools,
  media: mediaEnhancementTools,
  animation: animationTools,
  education: pptEducationToolDefinitions,
  master: masterTools,
  notes: notesTools,
  hyperlink: hyperlinkTools,
  export: exportTools,
  // P2 阶段工具
  comment: pptCommentTools,
  customLayout: customLayoutTools,
  slideShowSettings: slideShowSettingsTools,
  mediaEnhancement: mediaEnhancementTools
}

// 导出各模块
export { slideTools } from './SlideTools'
export { shapeTools } from './ShapeTools'
// mediaTools 已被 mediaEnhancementTools (P2) 替代
// export { mediaTools } from './MediaTools'
export { animationTools } from './AnimationTools'
export { pptEducationToolDefinitions } from './EducationTools'
// P1 阶段工具导出
export { masterTools } from './MasterTools'
export { notesTools } from './NotesTools'
export { hyperlinkTools } from './HyperlinkTools'
export { exportTools } from './ExportTools'
// P2 阶段工具导出
export { pptCommentTools } from './CommentTools'
export { customLayoutTools } from './CustomLayoutTools'
export { slideShowSettingsTools } from './SlideShowSettingsTools'
export { mediaEnhancementTools } from './MediaEnhancementTools'
