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
 * 获取所有 PowerPoint 工具（压缩版）
 * 总计 12 个工具（原 87 个）
 *
 * 注意：这是压缩版工具，使用 action 参数模式
 */
export function getPowerPointTools(): ToolDefinition[] {
  return [
    // 核心幻灯片操作
    pptSlideTool as ToolDefinition,      // 幻灯片管理 (10 actions)
    pptShapeTool as ToolDefinition,      // 形状与文本 (12 actions)
    pptMediaTool as ToolDefinition,      // 图片与媒体 (10 actions)
    pptAnimationTool as ToolDefinition,  // 动画与放映 (8 actions)

    // 母版与布局
    pptMasterTool as ToolDefinition,       // 母版管理 (6 actions)
    pptCustomLayoutTool as ToolDefinition, // 自定义布局 (7 actions)

    // 内容与导航
    pptNotesTool as ToolDefinition,     // 备注管理 (5 actions)
    pptHyperlinkTool as ToolDefinition, // 超链接 (5 actions)
    pptExportTool as ToolDefinition,    // 导出功能 (3 actions)

    // 协作与设置
    pptCommentTool as ToolDefinition,          // 批注管理 (9 actions)
    pptSlideshowSettingsTool as ToolDefinition, // 放映设置 (10 actions)

    // 教育场景
    pptEducationTool as ToolDefinition  // 教育工具 (2 actions)
  ]
}

/**
 * 工具压缩映射表
 * 用于向后兼容，将旧工具名映射到新工具
 */
export const toolCompressionMap: Record<string, { newTool: string; action: string }> = {
  // 幻灯片操作
  'ppt_add_slide': { newTool: 'ppt_slide', action: 'add' },
  'ppt_delete_slide': { newTool: 'ppt_slide', action: 'delete' },
  'ppt_duplicate_slide': { newTool: 'ppt_slide', action: 'duplicate' },
  'ppt_move_slide': { newTool: 'ppt_slide', action: 'move' },
  'ppt_set_slide_layout': { newTool: 'ppt_slide', action: 'setLayout' },
  'ppt_get_slide_count': { newTool: 'ppt_slide', action: 'getCount' },
  'ppt_navigate_to_slide': { newTool: 'ppt_slide', action: 'navigate' },
  'ppt_hide_slide': { newTool: 'ppt_slide', action: 'hide' },
  'ppt_unhide_slide': { newTool: 'ppt_slide', action: 'unhide' },
  'ppt_set_slide_transition': { newTool: 'ppt_slide', action: 'setTransition' },

  // 形状操作
  'ppt_add_text_box': { newTool: 'ppt_shape', action: 'addTextBox' },
  'ppt_add_shape': { newTool: 'ppt_shape', action: 'addShape' },
  'ppt_delete_shape': { newTool: 'ppt_shape', action: 'delete' },
  'ppt_move_shape': { newTool: 'ppt_shape', action: 'move' },
  'ppt_resize_shape': { newTool: 'ppt_shape', action: 'resize' },
  'ppt_set_shape_fill': { newTool: 'ppt_shape', action: 'setFill' },
  'ppt_set_shape_outline': { newTool: 'ppt_shape', action: 'setOutline' },
  'ppt_set_text_format': { newTool: 'ppt_shape', action: 'setTextFormat' },
  'ppt_align_shapes': { newTool: 'ppt_shape', action: 'align' },
  'ppt_group_shapes': { newTool: 'ppt_shape', action: 'group' },
  'ppt_ungroup_shapes': { newTool: 'ppt_shape', action: 'ungroup' },
  'ppt_rotate_shape': { newTool: 'ppt_shape', action: 'rotate' },

  // 媒体操作
  'ppt_insert_image': { newTool: 'ppt_media', action: 'insertImage' },
  'ppt_insert_video': { newTool: 'ppt_media', action: 'insertVideo' },
  'ppt_insert_audio': { newTool: 'ppt_media', action: 'insertAudio' },
  'ppt_crop_image': { newTool: 'ppt_media', action: 'cropImage' },
  'ppt_compress_media': { newTool: 'ppt_media', action: 'compress' },
  'ppt_set_image_effects': { newTool: 'ppt_media', action: 'setImageEffects' },
  'ppt_set_media_playback': { newTool: 'ppt_media', action: 'setPlayback' },
  'ppt_get_media_info': { newTool: 'ppt_media', action: 'getInfo' },
  'ppt_delete_media': { newTool: 'ppt_media', action: 'delete' },
  'ppt_set_media_timeline': { newTool: 'ppt_media', action: 'setTimeline' },

  // 动画操作
  'ppt_add_animation': { newTool: 'ppt_animation', action: 'add' },
  'ppt_remove_animation': { newTool: 'ppt_animation', action: 'remove' },
  'ppt_set_animation_timing': { newTool: 'ppt_animation', action: 'setTiming' },
  'ppt_set_animation_trigger': { newTool: 'ppt_animation', action: 'setTrigger' },
  'ppt_preview_animation': { newTool: 'ppt_animation', action: 'preview' },
  'ppt_set_slide_timing': { newTool: 'ppt_animation', action: 'setSlideTiming' },
  'ppt_start_slideshow': { newTool: 'ppt_animation', action: 'startSlideshow' },
  'ppt_end_slideshow': { newTool: 'ppt_animation', action: 'endSlideshow' },

  // 母版操作
  'ppt_get_slide_masters': { newTool: 'ppt_master', action: 'getMasters' },
  'ppt_get_master_layouts': { newTool: 'ppt_master', action: 'getLayouts' },
  'ppt_apply_slide_master': { newTool: 'ppt_master', action: 'apply' },
  'ppt_copy_slide_master': { newTool: 'ppt_master', action: 'copy' },
  'ppt_delete_slide_master': { newTool: 'ppt_master', action: 'delete' },
  'ppt_rename_slide_master': { newTool: 'ppt_master', action: 'rename' },

  // 备注操作
  'ppt_add_slide_notes': { newTool: 'ppt_notes', action: 'add' },
  'ppt_get_slide_notes': { newTool: 'ppt_notes', action: 'get' },
  'ppt_update_slide_notes': { newTool: 'ppt_notes', action: 'update' },
  'ppt_delete_slide_notes': { newTool: 'ppt_notes', action: 'delete' },
  'ppt_get_all_slide_notes': { newTool: 'ppt_notes', action: 'getAll' },

  // 超链接操作
  'ppt_add_hyperlink_to_shape': { newTool: 'ppt_hyperlink', action: 'addToShape' },
  'ppt_add_hyperlink_to_text': { newTool: 'ppt_hyperlink', action: 'addToText' },
  'ppt_get_hyperlinks': { newTool: 'ppt_hyperlink', action: 'getAll' },
  'ppt_remove_hyperlink': { newTool: 'ppt_hyperlink', action: 'remove' },
  'ppt_update_hyperlink': { newTool: 'ppt_hyperlink', action: 'update' },

  // 导出操作
  'ppt_export_to_pdf': { newTool: 'ppt_export', action: 'toPdf' },
  'ppt_export_slides_to_images': { newTool: 'ppt_export', action: 'toImages' },
  'ppt_export_to_video': { newTool: 'ppt_export', action: 'toVideo' },

  // 批注操作
  'ppt_add_comment': { newTool: 'ppt_comment', action: 'add' },
  'ppt_get_comments': { newTool: 'ppt_comment', action: 'getAll' },
  'ppt_get_comment_detail': { newTool: 'ppt_comment', action: 'getDetail' },
  'ppt_reply_comment': { newTool: 'ppt_comment', action: 'reply' },
  'ppt_resolve_comment': { newTool: 'ppt_comment', action: 'resolve' },
  'ppt_reopen_comment': { newTool: 'ppt_comment', action: 'reopen' },
  'ppt_delete_comment': { newTool: 'ppt_comment', action: 'delete' },
  'ppt_delete_comment_reply': { newTool: 'ppt_comment', action: 'deleteReply' },
  'ppt_delete_all_comments': { newTool: 'ppt_comment', action: 'deleteAll' }
}

/**
 * 所有压缩后的 PowerPoint 工具列表
 */
export const compressedPowerPointTools: ToolDefinition[] = [
  // 核心幻灯片操作
  pptSlideTool as ToolDefinition,      // 幻灯片管理 (10 actions)
  pptShapeTool as ToolDefinition,      // 形状与文本 (12 actions)
  pptMediaTool as ToolDefinition,      // 图片与媒体 (10 actions)
  pptAnimationTool as ToolDefinition,  // 动画与放映 (8 actions)

  // 母版与布局
  pptMasterTool as ToolDefinition,       // 母版管理 (6 actions)
  pptCustomLayoutTool as ToolDefinition, // 自定义布局 (7 actions)

  // 内容与导航
  pptNotesTool as ToolDefinition,     // 备注管理 (5 actions)
  pptHyperlinkTool as ToolDefinition, // 超链接 (5 actions)
  pptExportTool as ToolDefinition,    // 导出功能 (3 actions)

  // 协作与设置
  pptCommentTool as ToolDefinition,          // 批注管理 (9 actions)
  pptSlideshowSettingsTool as ToolDefinition, // 放映设置 (10 actions)

  // 教育场景
  pptEducationTool as ToolDefinition  // 教育工具 (2 actions)
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
