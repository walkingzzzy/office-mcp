/**
 * 智能工具筛选服务
 * 根据用户意图动态筛选相关工具类别,减少系统提示词 token 消耗
 *
 * 目标: 减少 60-80% token 消耗,同时保持 AI 功能完整性
 */

import Logger from '../../utils/logger'

const logger = new Logger('ToolCategoryFilter')

/**
 * 工具类别定义
 */
export enum ToolCategory {
  // Word 类别
  WORD_TEXT = 'word_text',                    // 文本操作
  WORD_FORMATTING = 'word_formatting',        // 格式化
  WORD_PARAGRAPH = 'word_paragraph',          // 段落操作
  WORD_STYLE = 'word_style',                  // 样式操作
  WORD_TABLE = 'word_table',                  // 表格操作
  WORD_IMAGE = 'word_image',                  // 图片操作
  WORD_HYPERLINK = 'word_hyperlink',          // 超链接和引用
  WORD_ADVANCED = 'word_advanced',            // 高级操作

  // Excel 类别
  EXCEL_CELL = 'excel_cell',                  // 单元格操作
  EXCEL_FORMAT = 'excel_format',              // 格式化操作
  EXCEL_FORMULA = 'excel_formula',            // 公式操作
  EXCEL_CHART = 'excel_chart',                // 图表操作
  EXCEL_WORKSHEET = 'excel_worksheet',        // 工作表操作
  EXCEL_DATA = 'excel_data',                  // 数据分析
  EXCEL_ADVANCED = 'excel_advanced',          // 高级操作

  // PowerPoint 类别
  PPT_SLIDE = 'ppt_slide',                    // 幻灯片操作
  PPT_SHAPE = 'ppt_shape',                    // 形状和文本
  PPT_MEDIA = 'ppt_media',                    // 图片和媒体
  PPT_ANIMATION = 'ppt_animation'             // 动画和切换
}

/**
 * 类别到关键词的映射
 * 用于从用户消息中识别意图
 */
const CATEGORY_KEYWORDS: Record<ToolCategory, string[]> = {
  // Word 类别关键词
  [ToolCategory.WORD_TEXT]: [
    '插入', '添加', '写入', '输入', '生成', '创建', '文本', '内容', '段落',
    '删除', '移除', '清除', '替换', '查找', '搜索', '复制', '粘贴', '剪切'
  ],
  [ToolCategory.WORD_FORMATTING]: [
    '加粗', '斜体', '下划线', '删除线', '上标', '下标', '字体', '字号',
    '颜色', '高亮', '格式', '清除格式', '复制格式'
  ],
  [ToolCategory.WORD_PARAGRAPH]: [
    '段落', '对齐', '缩进', '行距', '间距', '左对齐', '右对齐', '居中',
    '两端对齐', '合并段落', '分割段落', '移动段落'
  ],
  [ToolCategory.WORD_STYLE]: [
    '样式', '标题', '正文', '列表', '编号', '项目符号', '主题',
    '背景色', '应用样式', '创建样式'
  ],
  [ToolCategory.WORD_TABLE]: [
    '表格', '行', '列', '单元格', '合并', '分割', '边框', '底纹',
    '表格样式', '表格转文本'
  ],
  [ToolCategory.WORD_IMAGE]: [
    '图片', '图像', '插图', '照片', '截图', '裁剪', '旋转', '压缩',
    '环绕', '标题', '替换图片'
  ],
  [ToolCategory.WORD_HYPERLINK]: [
    '链接', '超链接', '书签', '交叉引用', '脚注', '尾注', '引文', '参考文献'
  ],
  [ToolCategory.WORD_ADVANCED]: [
    '目录', '分页符', '分节符', '更新目录'
  ],

  // Excel 类别关键词
  [ToolCategory.EXCEL_CELL]: [
    '单元格', '格子', '值', '数据', '填写', '设置', '获取', '清空',
    '区域', '范围', '合并', '拆分', '插入行', '插入列', '删除行', '删除列',
    '列宽', '行高', '自动调整'
  ],
  [ToolCategory.EXCEL_FORMAT]: [
    '格式', '字体', '填充', '边框', '对齐', '数字格式', '加粗', '斜体',
    '下划线', '字号', '颜色', '清除格式', '复制格式', '样式'
  ],
  [ToolCategory.EXCEL_FORMULA]: [
    '公式', '函数', '计算', '求和', '平均', '计数', '最大值', '最小值',
    'IF', 'VLOOKUP', 'HLOOKUP', 'INDEX', 'MATCH', '连接', '追踪'
  ],
  [ToolCategory.EXCEL_CHART]: [
    '图表', '柱状图', '折线图', '饼图', '条形图', '面积图', '散点图',
    '图表类型', '图表标题', '图例', '坐标轴', '系列'
  ],
  [ToolCategory.EXCEL_WORKSHEET]: [
    '工作表', '表', 'Sheet', '添加表', '删除表', '重命名', '复制表',
    '移动表', '隐藏', '显示', '保护', '取消保护'
  ],
  [ToolCategory.EXCEL_DATA]: [
    '排序', '筛选', '删除重复', '数据透视表', '透视表', '条件格式',
    '数据验证', '查找', '替换', '冻结窗格'
  ],
  [ToolCategory.EXCEL_ADVANCED]: [
    '命名区域', '批注', '注释', '超链接', '保护工作簿', '保存', '关闭', '属性'
  ],

  // PowerPoint 类别关键词
  [ToolCategory.PPT_SLIDE]: [
    '幻灯片', '页面', '演示', 'PPT', 'slide', '添加页', '删除页',
    '复制页', '移动页', '布局', '页数', '导航', '隐藏', '切换'
  ],
  [ToolCategory.PPT_SHAPE]: [
    '文本框', '形状', '矩形', '圆形', '三角形', '箭头', '星形',
    '删除形状', '移动', '大小', '填充', '轮廓', '格式', '对齐',
    '组合', '取消组合', '旋转'
  ],
  [ToolCategory.PPT_MEDIA]: [
    '图片', '视频', '音频', '媒体', '插图', '裁剪', '压缩', '效果'
  ],
  [ToolCategory.PPT_ANIMATION]: [
    '动画', '切换', '效果', '时间', '触发', '预览', '放映', '演示'
  ]
}

/**
 * 类别分组 - 用于默认策略
 */
const CATEGORY_GROUPS = {
  word: [
    ToolCategory.WORD_TEXT,
    ToolCategory.WORD_FORMATTING,
    ToolCategory.WORD_PARAGRAPH,
    ToolCategory.WORD_STYLE,
    ToolCategory.WORD_TABLE,
    ToolCategory.WORD_IMAGE,
    ToolCategory.WORD_HYPERLINK,
    ToolCategory.WORD_ADVANCED
  ],
  excel: [
    ToolCategory.EXCEL_CELL,
    ToolCategory.EXCEL_FORMAT,
    ToolCategory.EXCEL_FORMULA,
    ToolCategory.EXCEL_CHART,
    ToolCategory.EXCEL_WORKSHEET,
    ToolCategory.EXCEL_DATA,
    ToolCategory.EXCEL_ADVANCED
  ],
  powerpoint: [
    ToolCategory.PPT_SLIDE,
    ToolCategory.PPT_SHAPE,
    ToolCategory.PPT_MEDIA,
    ToolCategory.PPT_ANIMATION
  ]
}

/**
 * 意图识别结果
 */
export interface IntentAnalysis {
  /** 识别到的类别 */
  categories: ToolCategory[]
  /** 置信度 (0-1) */
  confidence: number
  /** 识别到的关键词 */
  matchedKeywords: string[]
  /** 是否使用默认策略 */
  isDefault: boolean
}

/**
 * 智能工具筛选服务
 */
export class ToolCategoryFilter {
  /**
   * 分析用户消息,识别意图和相关类别
   */
  analyzeIntent(userMessage: string): IntentAnalysis {
    const normalizedMessage = userMessage.toLowerCase()
    const matchedCategories = new Set<ToolCategory>()
    const matchedKeywords: string[] = []

    // 遍历所有类别,查找匹配的关键词
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (normalizedMessage.includes(keyword)) {
          matchedCategories.add(category as ToolCategory)
          if (!matchedKeywords.includes(keyword)) {
            matchedKeywords.push(keyword)
          }
        }
      }
    }

    // 如果没有匹配到任何类别,使用默认策略 (Word 全部工具)
    if (matchedCategories.size === 0) {
      logger.info('未识别到明确意图,使用默认策略 (Word 全部工具)')
      return {
        categories: CATEGORY_GROUPS.word,
        confidence: 0.3,
        matchedKeywords: [],
        isDefault: true
      }
    }

    // 计算置信度 (基于匹配关键词数量)
    const confidence = Math.min(matchedKeywords.length / 3, 1.0)

    logger.info('意图识别完成', {
      categoriesCount: matchedCategories.size,
      confidence,
      matchedKeywords: matchedKeywords.slice(0, 5) // 只记录前5个
    })

    return {
      categories: Array.from(matchedCategories),
      confidence,
      matchedKeywords,
      isDefault: false
    }
  }

  /**
   * 根据类别筛选工具列表
   * 返回应该包含在系统提示词中的类别
   */
  filterCategories(userMessage: string): ToolCategory[] {
    const analysis = this.analyzeIntent(userMessage)
    return analysis.categories
  }

  /**
   * 获取类别的可读名称
   */
  getCategoryName(category: ToolCategory): string {
    const names: Record<ToolCategory, string> = {
      [ToolCategory.WORD_TEXT]: 'Word 文本操作',
      [ToolCategory.WORD_FORMATTING]: 'Word 格式化操作',
      [ToolCategory.WORD_PARAGRAPH]: 'Word 段落操作',
      [ToolCategory.WORD_STYLE]: 'Word 样式操作',
      [ToolCategory.WORD_TABLE]: 'Word 表格操作',
      [ToolCategory.WORD_IMAGE]: 'Word 图片操作',
      [ToolCategory.WORD_HYPERLINK]: 'Word 超链接和引用',
      [ToolCategory.WORD_ADVANCED]: 'Word 高级操作',

      [ToolCategory.EXCEL_CELL]: 'Excel 单元格操作',
      [ToolCategory.EXCEL_FORMAT]: 'Excel 格式化操作',
      [ToolCategory.EXCEL_FORMULA]: 'Excel 公式操作',
      [ToolCategory.EXCEL_CHART]: 'Excel 图表操作',
      [ToolCategory.EXCEL_WORKSHEET]: 'Excel 工作表操作',
      [ToolCategory.EXCEL_DATA]: 'Excel 数据分析',
      [ToolCategory.EXCEL_ADVANCED]: 'Excel 高级操作',

      [ToolCategory.PPT_SLIDE]: 'PowerPoint 幻灯片操作',
      [ToolCategory.PPT_SHAPE]: 'PowerPoint 形状和文本',
      [ToolCategory.PPT_MEDIA]: 'PowerPoint 图片和媒体',
      [ToolCategory.PPT_ANIMATION]: 'PowerPoint 动画和切换'
    }
    return names[category]
  }

  /**
   * 估算 token 节省
   * 基于筛选后的类别数量
   */
  estimateTokenSavings(filteredCategories: ToolCategory[]): {
    totalCategories: number
    filteredCategories: number
    estimatedSavings: number // 百分比
  } {
    const totalCategories = Object.keys(ToolCategory).length
    const filtered = filteredCategories.length
    const savings = Math.round(((totalCategories - filtered) / totalCategories) * 100)

    return {
      totalCategories,
      filteredCategories: filtered,
      estimatedSavings: savings
    }
  }
}

/** 单例实例 */
export const toolCategoryFilter = new ToolCategoryFilter()
