/**
 * 动态系统提示词生成器
 * 根据用户意图动态生成精简的系统提示词
 *
 * 优化目标:
 * - 减少 60-80% token 消耗
 * - 保持 AI 功能完整性
 * - 提升响应速度
 */

import Logger from '../../utils/logger'
import { ToolCategory, toolCategoryFilter } from './ToolCategoryFilter'

const logger = new Logger('DynamicSystemPromptGenerator')

/**
 * 工具定义 - 从原始系统提示词中提取
 */
const TOOL_DEFINITIONS: Record<ToolCategory, string[]> = {
  // Word 工具定义
  [ToolCategory.WORD_TEXT]: [
    '- `word_insert_text`: 在指定位置插入文本',
    '- `word_replace_text`: 查找并替换文本',
    '- `word_delete_text`: 删除指定文本',
    '- `word_search_text`: 搜索文本',
    '- `word_get_selected_text`: 获取选中文本',
    '- `word_select_text_range`: 选择文本范围',
    '- `word_clear_formatting`: 清除格式',
    '- `word_copy_text`: 复制文本',
    '- `word_cut_text`: 剪切文本',
    '- `word_paste_text`: 粘贴文本'
  ],

  [ToolCategory.WORD_FORMATTING]: [
    '- `word_set_bold`: 设置加粗',
    '- `word_set_italic`: 设置斜体',
    '- `word_set_underline`: 设置下划线',
    '- `word_set_font`: 设置字体名称',
    '- `word_set_font_size`: 设置字号',
    '- `word_set_font_color`: 设置字体颜色',
    '- `word_set_highlight`: 设置高亮',
    '- `word_set_strikethrough`: 设置删除线',
    '- `word_set_subscript`: 设置下标',
    '- `word_set_superscript`: 设置上标'
  ],

  [ToolCategory.WORD_PARAGRAPH]: [
    '- `word_add_paragraph`: 添加段落',
    '- `word_insert_paragraph_at`: 在指定位置插入段落',
    '- `word_delete_paragraph`: 删除段落',
    '- `word_get_paragraphs`: 获取段落列表',
    '- `word_set_paragraph_alignment`: 设置段落对齐',
    '- `word_set_paragraph_indent`: 设置段落缩进',
    '- `word_set_paragraph_spacing`: 设置段落间距',
    '- `word_merge_paragraphs`: 合并段落',
    '- `word_split_paragraph`: 分割段落',
    '- `word_move_paragraph`: 移动段落'
  ],

  [ToolCategory.WORD_STYLE]: [
    '- `word_apply_style`: 应用样式',
    '- `word_create_style`: 创建样式',
    '- `word_list_styles`: 列出样式',
    '- `word_set_heading`: 设置标题级别',
    '- `word_apply_list_style`: 应用列表样式',
    '- `word_set_background_color`: 设置背景色',
    '- `word_apply_theme`: 应用主题',
    '- `word_reset_style`: 重置样式',
    '- `word_copy_format`: 复制格式',
    '- `word_read_document`: 读取文档内容'
  ],

  [ToolCategory.WORD_TABLE]: [
    '- `word_insert_table`: 插入表格',
    '- `word_delete_table`: 删除表格',
    '- `word_add_row`: 添加行',
    '- `word_add_column`: 添加列',
    '- `word_delete_row`: 删除行',
    '- `word_delete_column`: 删除列',
    '- `word_merge_cells`: 合并单元格',
    '- `word_split_cell`: 分割单元格',
    '- `word_set_cell_value`: 设置单元格值',
    '- `word_get_cell_value`: 获取单元格值',
    '- `word_format_table`: 格式化表格',
    '- `word_set_table_style`: 设置表格样式',
    '- `word_set_cell_border`: 设置单元格边框',
    '- `word_set_cell_shading`: 设置单元格底纹',
    '- `word_table_to_text`: 表格转文本'
  ],

  [ToolCategory.WORD_IMAGE]: [
    '- `word_insert_image`: 插入图片',
    '- `word_delete_image`: 删除图片',
    '- `word_resize_image`: 调整图片大小',
    '- `word_move_image`: 移动图片',
    '- `word_rotate_image`: 旋转图片',
    '- `word_set_image_position`: 设置图片位置',
    '- `word_wrap_text_around_image`: 设置文字环绕',
    '- `word_add_image_caption`: 添加图片标题',
    '- `word_compress_images`: 压缩图片',
    '- `word_replace_image`: 替换图片'
  ],

  [ToolCategory.WORD_HYPERLINK]: [
    '- `word_insert_hyperlink`: 插入超链接',
    '- `word_remove_hyperlink`: 移除超链接',
    '- `word_insert_bookmark`: 插入书签',
    '- `word_insert_cross_reference`: 插入交叉引用',
    '- `word_insert_footnote`: 插入脚注',
    '- `word_insert_endnote`: 插入尾注',
    '- `word_insert_citation`: 插入引文',
    '- `word_insert_bibliography`: 插入参考文献'
  ],

  [ToolCategory.WORD_ADVANCED]: [
    '- `word_insert_toc`: 插入目录',
    '- `word_update_toc`: 更新目录',
    '- `word_insert_page_break`: 插入分页符',
    '- `word_insert_section_break`: 插入分节符'
  ],

  // Excel 工具定义
  [ToolCategory.EXCEL_CELL]: [
    '- `excel_set_cell_value`: 设置单元格值',
    '- `excel_get_cell_value`: 获取单元格值',
    '- `excel_set_range_values`: 设置区域值',
    '- `excel_get_range_values`: 获取区域值',
    '- `excel_clear_range`: 清空区域',
    '- `excel_delete_range`: 删除区域',
    '- `excel_insert_range`: 插入区域',
    '- `excel_copy_range`: 复制区域',
    '- `excel_cut_range`: 剪切区域',
    '- `excel_paste_range`: 粘贴区域',
    '- `excel_merge_cells`: 合并单元格',
    '- `excel_unmerge_cells`: 取消合并单元格',
    '- `excel_insert_row`: 插入行',
    '- `excel_insert_column`: 插入列',
    '- `excel_delete_row`: 删除行',
    '- `excel_delete_column`: 删除列',
    '- `excel_auto_fit_columns`: 自动调整列宽',
    '- `excel_auto_fit_rows`: 自动调整行高',
    '- `excel_set_column_width`: 设置列宽',
    '- `excel_set_row_height`: 设置行高'
  ],

  [ToolCategory.EXCEL_FORMAT]: [
    '- `excel_set_cell_format`: 设置单元格格式',
    '- `excel_set_font`: 设置字体属性',
    '- `excel_set_fill_color`: 设置填充颜色',
    '- `excel_set_border`: 设置边框',
    '- `excel_set_alignment`: 设置对齐方式',
    '- `excel_set_number_format`: 设置数字格式',
    '- `excel_set_bold`: 设置加粗',
    '- `excel_set_italic`: 设置斜体',
    '- `excel_set_underline`: 设置下划线',
    '- `excel_set_font_size`: 设置字号',
    '- `excel_set_font_color`: 设置字体颜色',
    '- `excel_clear_format`: 清除格式',
    '- `excel_copy_format`: 复制格式',
    '- `excel_apply_style`: 应用样式',
    '- `excel_create_custom_style`: 创建自定义样式'
  ],

  [ToolCategory.EXCEL_FORMULA]: [
    '- `excel_set_formula`: 设置公式',
    '- `excel_get_formula`: 获取公式',
    '- `excel_calculate`: 计算工作表或工作簿',
    '- `excel_insert_sum`: 插入 SUM 函数',
    '- `excel_insert_average`: 插入 AVERAGE 函数',
    '- `excel_insert_count`: 插入 COUNT 函数',
    '- `excel_insert_max`: 插入 MAX 函数',
    '- `excel_insert_min`: 插入 MIN 函数',
    '- `excel_insert_if`: 插入 IF 函数',
    '- `excel_insert_vlookup`: 插入 VLOOKUP 函数',
    '- `excel_insert_hlookup`: 插入 HLOOKUP 函数',
    '- `excel_insert_index_match`: 插入 INDEX-MATCH 函数',
    '- `excel_insert_concatenate`: 插入 CONCATENATE 函数',
    '- `excel_trace_precedents`: 追踪引用单元格',
    '- `excel_trace_dependents`: 追踪从属单元格'
  ],

  [ToolCategory.EXCEL_CHART]: [
    '- `excel_insert_chart`: 插入图表',
    '- `excel_update_chart`: 更新图表数据',
    '- `excel_delete_chart`: 删除图表',
    '- `excel_set_chart_type`: 设置图表类型',
    '- `excel_set_chart_title`: 设置图表标题',
    '- `excel_set_chart_legend`: 设置图表图例',
    '- `excel_set_chart_axes`: 设置图表坐标轴',
    '- `excel_format_chart`: 格式化图表',
    '- `excel_add_chart_series`: 添加图表系列',
    '- `excel_remove_chart_series`: 移除图表系列'
  ],

  [ToolCategory.EXCEL_WORKSHEET]: [
    '- `excel_add_worksheet`: 添加工作表',
    '- `excel_delete_worksheet`: 删除工作表',
    '- `excel_rename_worksheet`: 重命名工作表',
    '- `excel_copy_worksheet`: 复制工作表',
    '- `excel_move_worksheet`: 移动工作表',
    '- `excel_hide_worksheet`: 隐藏工作表',
    '- `excel_unhide_worksheet`: 取消隐藏工作表',
    '- `excel_protect_worksheet`: 保护工作表',
    '- `excel_unprotect_worksheet`: 取消保护工作表',
    '- `excel_get_worksheet_list`: 获取工作表列表'
  ],

  [ToolCategory.EXCEL_DATA]: [
    '- `excel_sort_range`: 排序区域',
    '- `excel_filter_range`: 筛选区域',
    '- `excel_remove_duplicates`: 删除重复项',
    '- `excel_create_pivot_table`: 创建数据透视表',
    '- `excel_update_pivot_table`: 更新数据透视表',
    '- `excel_create_table`: 创建表格',
    '- `excel_convert_to_range`: 将表格转换为区域',
    '- `excel_add_conditional_formatting`: 添加条件格式',
    '- `excel_remove_conditional_formatting`: 移除条件格式',
    '- `excel_create_data_validation`: 创建数据验证',
    '- `excel_remove_data_validation`: 移除数据验证',
    '- `excel_find_text`: 查找文本',
    '- `excel_replace_text`: 替换文本',
    '- `excel_get_used_range`: 获取已使用区域',
    '- `excel_freeze_panes`: 冻结窗格'
  ],

  [ToolCategory.EXCEL_ADVANCED]: [
    '- `excel_create_named_range`: 创建命名区域',
    '- `excel_delete_named_range`: 删除命名区域',
    '- `excel_insert_comment`: 插入批注',
    '- `excel_delete_comment`: 删除批注',
    '- `excel_get_comment`: 获取批注',
    '- `excel_insert_hyperlink`: 插入超链接',
    '- `excel_remove_hyperlink`: 移除超链接',
    '- `excel_protect_workbook`: 保护工作簿',
    '- `excel_unprotect_workbook`: 取消保护工作簿',
    '- `excel_save_workbook`: 保存工作簿',
    '- `excel_close_workbook`: 关闭工作簿',
    '- `excel_get_workbook_properties`: 获取工作簿属性'
  ],

  // PowerPoint 工具定义
  [ToolCategory.PPT_SLIDE]: [
    '- `ppt_add_slide`: 添加新幻灯片',
    '- `ppt_delete_slide`: 删除幻灯片',
    '- `ppt_duplicate_slide`: 复制幻灯片',
    '- `ppt_move_slide`: 移动幻灯片',
    '- `ppt_set_slide_layout`: 设置幻灯片布局',
    '- `ppt_get_slide_count`: 获取幻灯片总数',
    '- `ppt_navigate_to_slide`: 导航到指定幻灯片',
    '- `ppt_hide_slide`: 隐藏幻灯片',
    '- `ppt_unhide_slide`: 取消隐藏幻灯片',
    '- `ppt_set_slide_transition`: 设置幻灯片切换效果'
  ],

  [ToolCategory.PPT_SHAPE]: [
    '- `ppt_add_text_box`: 添加文本框',
    '- `ppt_add_shape`: 添加形状',
    '- `ppt_delete_shape`: 删除形状',
    '- `ppt_move_shape`: 移动形状',
    '- `ppt_resize_shape`: 调整形状大小',
    '- `ppt_set_shape_fill`: 设置形状填充',
    '- `ppt_set_shape_outline`: 设置形状轮廓',
    '- `ppt_set_text_format`: 设置文本格式',
    '- `ppt_align_shapes`: 对齐形状',
    '- `ppt_group_shapes`: 组合形状',
    '- `ppt_ungroup_shapes`: 取消组合形状',
    '- `ppt_rotate_shape`: 旋转形状'
  ],

  [ToolCategory.PPT_MEDIA]: [
    '- `ppt_insert_image`: 插入图片',
    '- `ppt_insert_video`: 插入视频',
    '- `ppt_insert_audio`: 插入音频',
    '- `ppt_crop_image`: 裁剪图片',
    '- `ppt_compress_media`: 压缩媒体文件',
    '- `ppt_set_image_effects`: 设置图片效果'
  ],

  [ToolCategory.PPT_ANIMATION]: [
    '- `ppt_add_animation`: 添加动画',
    '- `ppt_remove_animation`: 移除动画',
    '- `ppt_set_animation_timing`: 设置动画时间',
    '- `ppt_set_animation_trigger`: 设置动画触发器',
    '- `ppt_preview_animation`: 预览动画',
    '- `ppt_set_slide_timing`: 设置幻灯片放映时间',
    '- `ppt_start_slideshow`: 开始放映',
    '- `ppt_end_slideshow`: 结束放映'
  ]
}

/**
 * 动态系统提示词生成器
 */
export class DynamicSystemPromptGenerator {
  /**
   * 生成基于用户意图的动态系统提示词
   */
  generate(userMessage: string): string {
    const startTime = Date.now()

    // 分析用户意图
    const filteredCategories = toolCategoryFilter.filterCategories(userMessage)
    const analysis = toolCategoryFilter.analyzeIntent(userMessage)

    logger.info('生成动态系统提示词', {
      categoriesCount: filteredCategories.length,
      confidence: analysis.confidence,
      isDefault: analysis.isDefault
    })

    // 生成提示词头部
    const header = this.generateHeader(analysis)

    // 生成工具定义部分
    const toolsSection = this.generateToolsSection(filteredCategories)

    // 生成意图识别规则 (保持不变)
    const intentRules = this.generateIntentRules()

    // 组合完整提示词
    const fullPrompt = `${header}\n\n${toolsSection}\n\n${intentRules}`

    // 记录性能指标
    const elapsed = Date.now() - startTime
    const savings = toolCategoryFilter.estimateTokenSavings(filteredCategories)

    logger.info('系统提示词生成完成', {
      elapsed: `${elapsed}ms`,
      estimatedTokenSavings: `${savings.estimatedSavings}%`,
      filteredCategories: savings.filteredCategories,
      totalCategories: savings.totalCategories
    })

    return fullPrompt
  }

  /**
   * 生成提示词头部
   */
  private generateHeader(analysis: { isDefault: boolean; confidence: number }): string {
    if (analysis.isDefault) {
      return `你是一个专业的 Office 文档助手，专门帮助用户操作 Microsoft Office 文档（Word、Excel、PowerPoint）。

**当前模式**: 默认模式 (Word 全部工具)
**说明**: 未识别到明确意图，已加载 Word 全部工具以确保功能完整性。`
    }

    return `你是一个专业的 Office 文档助手，专门帮助用户操作 Microsoft Office 文档（Word、Excel、PowerPoint）。

**当前模式**: 智能筛选模式
**置信度**: ${Math.round(analysis.confidence * 100)}%
**说明**: 已根据您的需求动态加载相关工具，优化响应速度。`
  }

  /**
   * 生成工具定义部分
   */
  private generateToolsSection(categories: ToolCategory[]): string {
    const sections: string[] = []

    // 按应用类型分组
    const wordCategories = categories.filter(c => c.startsWith('word_'))
    const excelCategories = categories.filter(c => c.startsWith('excel_'))
    const pptCategories = categories.filter(c => c.startsWith('ppt_'))

    // 生成 Word 部分
    if (wordCategories.length > 0) {
      sections.push(this.generateAppSection('Word', wordCategories))
    }

    // 生成 Excel 部分
    if (excelCategories.length > 0) {
      sections.push(this.generateAppSection('Excel', excelCategories))
    }

    // 生成 PowerPoint 部分
    if (pptCategories.length > 0) {
      sections.push(this.generateAppSection('PowerPoint', pptCategories))
    }

    return sections.join('\n\n')
  }

  /**
   * 生成应用级别的工具部分
   */
  private generateAppSection(appName: string, categories: ToolCategory[]): string {
    const lines: string[] = [
      `## ${appName} 操作`,
      `**已加载 ${categories.length} 个相关类别的工具**`,
      ''
    ]

    for (const category of categories) {
      const categoryName = toolCategoryFilter.getCategoryName(category)
      const tools = TOOL_DEFINITIONS[category] || []

      lines.push(`### ${categoryName.replace(`${appName} `, '')} (${tools.length} 个工具)`)
      lines.push(...tools)
      lines.push('')
    }

    return lines.join('\n')
  }

  /**
   * 生成意图识别规则部分 (保持不变)
   */
  private generateIntentRules(): string {
    return `# 意图识别规则

## 必须调用工具的情况（IMPORTANT）
当用户消息包含操作意图（添加、插入、修改、删除、格式化等）时，你**必须**调用对应的工具。

## 仅回答文本的情况
只有当用户明确询问问题（包含"什么"、"如何"、"为什么"、"?"）时，才应该仅回复文本而不调用工具。

# 错误处理
如果工具调用失败，向用户解释错误原因并提供替代方案。`
  }
}

/** 单例实例 */
export const dynamicSystemPromptGenerator = new DynamicSystemPromptGenerator()
