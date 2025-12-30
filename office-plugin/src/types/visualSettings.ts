/**
 * 视觉增强配置类型定义
 */

export interface VisualEnhancementSettings {
  /** 是否启用视觉增强 */
  enabled: boolean
  /** 插入文本的高亮颜色 */
  insertionColor: string
  /** 删除文本的高亮颜色 */
  deletionColor: string
  /** 是否使用删除线 */
  useStrikethrough: boolean
  /** 是否使用下划线 */
  useUnderline: boolean
}

/** 默认视觉增强配置 */
export const DEFAULT_VISUAL_SETTINGS: VisualEnhancementSettings = {
  enabled: true,
  insertionColor: '#90EE90', // Light green
  deletionColor: '#FFB6C1', // Light pink
  useStrikethrough: true,
  useUnderline: true
}

/** 预设配色方案 */
export const PRESET_COLOR_SCHEMES = {
  default: {
    name: '默认',
    insertionColor: '#90EE90',
    deletionColor: '#FFB6C1'
  },
  highContrast: {
    name: '高对比度',
    insertionColor: '#00FF00',
    deletionColor: '#FF0000'
  },
  subtle: {
    name: '柔和',
    insertionColor: '#D4EDDA',
    deletionColor: '#F8D7DA'
  },
  professional: {
    name: '专业',
    insertionColor: '#C3E6CB',
    deletionColor: '#F5C6CB'
  }
}

/** 本地存储键名 */
export const VISUAL_SETTINGS_STORAGE_KEY = 'word-edit-visual-settings'
