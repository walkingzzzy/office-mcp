/**
 * PowerPoint 工具 Metadata 配置
 * 
 * 为 ToolSelector 提供 documentTypes、intentKeywords 等信息
 */

import type { ToolMetadata } from './types.js'

/**
 * PowerPoint 工具 metadata 映射表
 */
export const PPT_TOOL_METADATA: Record<string, ToolMetadata> = {
  // ==================== 幻灯片操作 (P0) ====================
  'ppt_add_slide': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['幻灯片', '添加', '新建', 'slide', 'add', '插入页'],
    applicableFor: ['none'],
    priority: 'P0',
    scenario: '添加新幻灯片'
  },
  'ppt_delete_slide': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['删除', '幻灯片', 'delete', 'slide', '移除'],
    applicableFor: ['none'],
    priority: 'P1',
    scenario: '删除幻灯片'
  },
  'ppt_duplicate_slide': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['复制', '幻灯片', 'duplicate', 'copy', '克隆'],
    applicableFor: ['none'],
    priority: 'P1',
    scenario: '复制幻灯片'
  },
  'ppt_move_slide': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['移动', '幻灯片', 'move', '顺序', '调整位置'],
    applicableFor: ['none'],
    priority: 'P2',
    scenario: '移动幻灯片位置'
  },
  'ppt_get_slides': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['获取', '幻灯片', '列表', 'slides', '所有'],
    applicableFor: ['none'],
    priority: 'P2',
    scenario: '获取所有幻灯片'
  },

  // ==================== 内容操作 (P0) ====================
  'ppt_add_text_box': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['文本框', '添加', 'textbox', '文字', '输入'],
    applicableFor: ['none'],
    priority: 'P0',
    scenario: '添加文本框'
  },
  'ppt_set_text': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['文本', '设置', '修改', 'text', '文字'],
    applicableFor: ['text', 'none'],
    priority: 'P0',
    scenario: '设置文本内容'
  },
  'ppt_insert_image': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['图片', '插入', 'image', '照片', '图像'],
    applicableFor: ['none'],
    priority: 'P0',
    scenario: '插入图片'
  },

  // ==================== 形状操作 (P1) ====================
  'ppt_add_shape': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['形状', '添加', 'shape', '图形', '矩形', '圆形'],
    applicableFor: ['none'],
    priority: 'P1',
    scenario: '添加形状'
  },
  'ppt_delete_shape': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['删除', '形状', 'delete shape', '移除'],
    applicableFor: ['text', 'image', 'none'],
    priority: 'P1',
    scenario: '删除形状'
  },
  'ppt_format_shape': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['形状', '格式', '样式', 'format', '填充', '边框'],
    applicableFor: ['text', 'image', 'none'],
    priority: 'P1',
    scenario: '设置形状格式'
  },
  'ppt_resize_shape': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['大小', '调整', 'resize', '尺寸', '缩放'],
    applicableFor: ['text', 'image', 'none'],
    priority: 'P2',
    scenario: '调整形状大小'
  },
  'ppt_move_shape': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['移动', '位置', 'move', '拖动'],
    applicableFor: ['text', 'image', 'none'],
    priority: 'P2',
    scenario: '移动形状位置'
  },

  // ==================== 动画 (P2) ====================
  'ppt_add_animation': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['动画', 'animation', '效果', '进入', '退出'],
    applicableFor: ['text', 'image', 'none'],
    priority: 'P2',
    scenario: '添加动画效果'
  },
  'ppt_remove_animation': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['删除', '动画', 'remove animation', '取消'],
    applicableFor: ['text', 'image', 'none'],
    priority: 'P2',
    scenario: '删除动画效果'
  },

  // ==================== 母版和布局 (P2) ====================
  'ppt_set_slide_layout': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['布局', 'layout', '版式', '模板'],
    applicableFor: ['none'],
    priority: 'P2',
    scenario: '设置幻灯片布局'
  },
  'ppt_set_background': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['背景', 'background', '底图', '颜色'],
    applicableFor: ['none'],
    priority: 'P2',
    scenario: '设置幻灯片背景'
  },

  // ==================== 媒体 (P1) ====================
  'ppt_insert_video': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['视频', 'video', '插入', '媒体'],
    applicableFor: ['none'],
    priority: 'P1',
    scenario: '插入视频'
  },
  'ppt_insert_audio': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['音频', 'audio', '插入', '声音', '音乐'],
    applicableFor: ['none'],
    priority: 'P1',
    scenario: '插入音频'
  },

  // ==================== 表格 (P1) ====================
  'ppt_insert_table': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['表格', 'table', '插入', '行列'],
    applicableFor: ['none'],
    priority: 'P1',
    scenario: '插入表格'
  },
  'ppt_set_table_cell': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['表格', '单元格', 'cell', '设置'],
    applicableFor: ['table', 'none'],
    priority: 'P1',
    scenario: '设置表格单元格'
  },

  // ==================== 备注和批注 (P2) ====================
  'ppt_set_notes': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['备注', 'notes', '演讲者备注', '注释'],
    applicableFor: ['none'],
    priority: 'P2',
    scenario: '设置演讲者备注'
  },
  'ppt_get_notes': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['获取', '备注', 'notes', '查看'],
    applicableFor: ['none'],
    priority: 'P2',
    scenario: '获取演讲者备注'
  },
  'ppt_add_comment': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['批注', 'comment', '评论', '注释'],
    applicableFor: ['none'],
    priority: 'P2',
    scenario: '添加批注'
  },

  // ==================== 超链接 (P2) ====================
  'ppt_add_hyperlink': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['链接', 'hyperlink', 'link', '超链接'],
    applicableFor: ['text', 'none'],
    priority: 'P2',
    scenario: '添加超链接'
  },

  // ==================== 导出 (P1) ====================
  'ppt_export_pdf': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['导出', 'PDF', 'export', '转换'],
    applicableFor: ['none'],
    priority: 'P1',
    scenario: '导出为 PDF'
  },
  'ppt_export_images': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['导出', '图片', 'export', '图像'],
    applicableFor: ['none'],
    priority: 'P2',
    scenario: '导出为图片'
  },

  // ==================== 幻灯片放映 (P2) ====================
  'ppt_start_slideshow': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['放映', '播放', 'slideshow', '演示'],
    applicableFor: ['none'],
    priority: 'P2',
    scenario: '开始幻灯片放映'
  },
  'ppt_set_slideshow_settings': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['放映设置', '演示设置', 'slideshow settings'],
    applicableFor: ['none'],
    priority: 'P2',
    scenario: '设置放映选项'
  },

  // ==================== 教育功能 (P1) ====================
  'ppt_create_quiz_slide': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['测验', '题目', 'quiz', '问题'],
    applicableFor: ['none'],
    priority: 'P1',
    scenario: '创建测验幻灯片'
  },
  'ppt_create_flashcard': {
    documentTypes: ['powerpoint'],
    intentKeywords: ['闪卡', 'flashcard', '记忆卡'],
    applicableFor: ['none'],
    priority: 'P2',
    scenario: '创建闪卡'
  }
}

/**
 * 为工具添加 metadata
 */
export function applyPptMetadata<T extends { name: string; metadata?: any }>(tool: T): T {
  const metadata = PPT_TOOL_METADATA[tool.name]
  if (metadata) {
    return {
      ...tool,
      metadata: {
        ...tool.metadata,
        ...metadata
      }
    }
  }
  // 没有配置的工具，添加默认 metadata
  return {
    ...tool,
    metadata: {
      ...tool.metadata,
      documentTypes: ['powerpoint'],
      priority: 'P2'
    }
  }
}

/**
 * 批量为工具添加 metadata
 */
export function applyPptMetadataToAll<T extends { name: string; metadata?: any }>(tools: T[]): T[] {
  return tools.map(applyPptMetadata)
}
