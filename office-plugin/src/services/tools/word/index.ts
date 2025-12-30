/**
 * Word 工具注册中心
 * 汇总所有 Word 工具模块并导出统一的工具注册表
 *
 * 对应 MCP 服务器定义的 ~200 个 Word 工具
 */

import type { ToolDefinition, ToolRegistry } from '../types'
import { textTools } from './TextTools'
import { readTools } from './ReadTools'
import { formattingTools } from './FormattingTools'
import { tableTools } from './TableTools'
import { imageTools } from './ImageTools'
import { styleTools } from './StyleTools'
import { selectionTools } from './SelectionTools'
import { paragraphTools } from './ParagraphTools'
import { advancedTextTools } from './AdvancedTextTools'
import { advancedFormattingTools } from './AdvancedFormattingTools'
import { advancedStyleTools } from './AdvancedStyleTools'
import { advancedTableTools } from './AdvancedTableTools'
import { advancedImageTools } from './AdvancedImageTools'
import { hyperlinkTools } from './HyperlinkTools'
import { advancedTools } from './AdvancedTools'
import { wordEducationToolDefinitions } from './EducationTools'
import { headerFooterTools } from './HeaderFooterTools'
import { pageSetupTools } from './PageSetupTools'
import { contentControlTools } from './ContentControlTools'
// P1 阶段工具导入
import { saveTools } from './SaveTools'
import { bookmarkTools } from './BookmarkTools'
import { commentTools } from './CommentTools'
import { trackChangesTools } from './TrackChangesTools'
import { fieldTools } from './FieldTools'
// P2 阶段工具导入
import { shapeTools } from './ShapeTools'
import { coauthoringTools } from './CoauthoringTools'
import { annotationTools } from './AnnotationTools'
import { documentTools } from './DocumentTools'
import { conflictTools } from './ConflictTools'
import { canvasTools } from './CanvasTools'
import { chartTools } from './ChartTools'

/**
 * 所有 Word 工具定义
 */
export const allWordTools: ToolDefinition[] = [
  // 基础文本操作 (4)
  ...textTools,
  // 读取操作 (3)
  ...readTools,
  // 基础格式化操作 (11)
  ...formattingTools,
  // 基础表格操作 (4)
  ...tableTools,
  // 基础图片操作 (4)
  ...imageTools,
  // 基础样式操作 (2)
  ...styleTools,
  // 选区检测操作 (3)
  ...selectionTools,
  // 段落操作 (5)
  ...paragraphTools,
  // 高级文本操作 (6)
  ...advancedTextTools,
  // 高级格式化操作 (4)
  ...advancedFormattingTools,
  // 高级样式操作 (8)
  ...advancedStyleTools,
  // 高级表格操作 (11)
  ...advancedTableTools,
  // 高级图片操作 (7)
  ...advancedImageTools,
  // 超链接和引用操作 (8)
  ...hyperlinkTools,
  // 高级操作 (4)
  ...advancedTools,
  // 页眉页脚操作 (6) - P0
  ...headerFooterTools,
  // 页面设置操作 (6) - P0
  ...pageSetupTools,
  // 内容控件操作 (6) - P0
  ...contentControlTools,
  // 教育工具 (5) - P0/P1/P2
  ...wordEducationToolDefinitions,
  // 保存操作 (4) - P0
  ...saveTools,
  // 书签操作 (6) - P1
  ...bookmarkTools,
  // 批注操作 (6) - P1
  ...commentTools,
  // 修订跟踪操作 (8) - P1
  ...trackChangesTools,
  // 域操作 (8) - P1
  ...fieldTools,
  // 形状操作 (8) - P2 (仅桌面版)
  ...shapeTools,
  // 协作操作 (6) - P2 (BETA)
  ...coauthoringTools,
  // 注释操作 (6) - P2 (BETA)
  ...annotationTools,
  // 文档操作 (8) - P2
  ...documentTools,
  // 冲突操作 (7) - P2
  ...conflictTools,
  // 画布操作 (6) - P2 (仅桌面版)
  ...canvasTools,
  // 图表操作 (2) - P1
  ...chartTools
]

/**
 * 创建 Word 工具注册表
 */
export function createWordToolRegistry(): ToolRegistry {
  const registry: ToolRegistry = new Map()
  
  for (const tool of allWordTools) {
    registry.set(tool.name, tool.handler)
  }
  
  return registry
}

/**
 * 获取 Word 工具处理器
 */
export function getWordToolHandler(toolName: string): ((args: Record<string, any>) => Promise<any>) | undefined {
  const tool = allWordTools.find(t => t.name === toolName)
  return tool?.handler
}

/**
 * 获取工具列表（用于调试）
 */
export function getWordToolNames(): string[] {
  return allWordTools.map(t => t.name)
}

/**
 * 按类别分组的工具
 */
export const wordToolsByCategory = {
  text: [...textTools, ...advancedTextTools, ...paragraphTools],
  read: readTools,
  formatting: [...formattingTools, ...advancedFormattingTools],
  table: [...tableTools, ...advancedTableTools],
  image: [...imageTools, ...advancedImageTools],
  style: [...styleTools, ...advancedStyleTools],
  selection: selectionTools,
  hyperlink: hyperlinkTools,
  advanced: advancedTools,
  headerFooter: headerFooterTools,
  pageSetup: pageSetupTools,
  contentControl: contentControlTools,
  education: wordEducationToolDefinitions,
  save: saveTools,
  bookmark: bookmarkTools,
  comment: commentTools,
  trackChanges: trackChangesTools,
  field: fieldTools,
  shape: shapeTools,
  coauthoring: coauthoringTools,
  annotation: annotationTools,
  document: documentTools,
  conflict: conflictTools,
  canvas: canvasTools
}

// 导出各模块供单独使用
export { textTools } from './TextTools'
export { readTools } from './ReadTools'
export { formattingTools } from './FormattingTools'
export { tableTools } from './TableTools'
export { imageTools } from './ImageTools'
export { styleTools } from './StyleTools'
export { selectionTools } from './SelectionTools'
export { paragraphTools } from './ParagraphTools'
export { advancedTextTools } from './AdvancedTextTools'
export { advancedFormattingTools } from './AdvancedFormattingTools'
export { advancedStyleTools } from './AdvancedStyleTools'
export { advancedTableTools } from './AdvancedTableTools'
export { advancedImageTools } from './AdvancedImageTools'
export { hyperlinkTools } from './HyperlinkTools'
export { advancedTools } from './AdvancedTools'
export { headerFooterTools } from './HeaderFooterTools'
export { pageSetupTools } from './PageSetupTools'
export { contentControlTools } from './ContentControlTools'
export { wordEducationToolDefinitions } from './EducationTools'
// P1 阶段工具导出
export { saveTools } from './SaveTools'
export { bookmarkTools } from './BookmarkTools'
export { commentTools } from './CommentTools'
export { trackChangesTools } from './TrackChangesTools'
export { fieldTools } from './FieldTools'
// P2 阶段工具导出
export { shapeTools } from './ShapeTools'
export { coauthoringTools } from './CoauthoringTools'
export { annotationTools } from './AnnotationTools'
export { documentTools } from './DocumentTools'
export { conflictTools } from './ConflictTools'
export { canvasTools } from './CanvasTools'
