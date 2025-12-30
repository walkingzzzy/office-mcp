/**
 * Excel 工具 Metadata 配置
 * 
 * 为 ToolSelector 提供 documentTypes、intentKeywords 等信息
 */

import type { ToolMetadata } from './types.js'

/**
 * Excel 工具 metadata 映射表
 */
export const EXCEL_TOOL_METADATA: Record<string, ToolMetadata> = {
  // ==================== 单元格操作 (P0) ====================
  'excel_set_cell_value': {
    documentTypes: ['excel'],
    intentKeywords: ['单元格', '写入', '设置值', 'cell', 'value', '填入', '输入', '赋值'],
    applicableFor: ['table', 'none'],
    priority: 'P0',
    scenario: '在 Excel 单元格中设置值'
  },
  'excel_get_cell_value': {
    documentTypes: ['excel'],
    intentKeywords: ['获取', '读取', '单元格', 'cell', 'value', '查看'],
    applicableFor: ['table', 'none'],
    priority: 'P0',
    scenario: '读取 Excel 单元格的值'
  },
  'excel_set_range_values': {
    documentTypes: ['excel'],
    intentKeywords: ['区域', '范围', '批量', 'range', '多个单元格', '填充'],
    applicableFor: ['table', 'none'],
    priority: 'P0',
    scenario: '批量设置 Excel 区域的值'
  },
  'excel_get_range_values': {
    documentTypes: ['excel'],
    intentKeywords: ['获取', '读取', '区域', 'range', '范围'],
    applicableFor: ['table', 'none'],
    priority: 'P1',
    scenario: '读取 Excel 区域的值'
  },
  'excel_clear_range': {
    documentTypes: ['excel'],
    intentKeywords: ['清空', '清除', '删除内容', 'clear', '清理'],
    applicableFor: ['table', 'none'],
    priority: 'P1',
    scenario: '清空 Excel 区域'
  },

  // ==================== 格式化 (P1) ====================
  'excel_set_font': {
    documentTypes: ['excel'],
    intentKeywords: ['字体', '字号', '颜色', 'font', '加粗', '斜体'],
    applicableFor: ['table', 'none'],
    priority: 'P1',
    scenario: '设置 Excel 字体格式'
  },
  'excel_set_fill_color': {
    documentTypes: ['excel'],
    intentKeywords: ['背景色', '填充', '颜色', 'fill', 'background', '底色'],
    applicableFor: ['table', 'none'],
    priority: 'P1',
    scenario: '设置单元格背景色'
  },
  'excel_set_border': {
    documentTypes: ['excel'],
    intentKeywords: ['边框', 'border', '框线', '线条'],
    applicableFor: ['table', 'none'],
    priority: 'P1',
    scenario: '设置单元格边框'
  },
  'excel_set_alignment': {
    documentTypes: ['excel'],
    intentKeywords: ['对齐', 'alignment', '居中', '左对齐', '右对齐'],
    applicableFor: ['table', 'none'],
    priority: 'P1',
    scenario: '设置单元格对齐方式'
  },
  'excel_set_number_format': {
    documentTypes: ['excel'],
    intentKeywords: ['数字格式', '格式化', '百分比', '货币', 'format'],
    applicableFor: ['table', 'none'],
    priority: 'P1',
    scenario: '设置数字格式'
  },
  'excel_conditional_format': {
    documentTypes: ['excel'],
    intentKeywords: ['条件格式', '高亮', '规则', 'conditional', '标记'],
    applicableFor: ['table', 'none'],
    priority: 'P1',
    scenario: '设置条件格式'
  },

  // ==================== 图表 (P1) ====================
  'excel_insert_chart': {
    documentTypes: ['excel'],
    intentKeywords: ['图表', '柱状图', '折线图', '饼图', 'chart', '可视化'],
    applicableFor: ['table', 'none'],
    priority: 'P1',
    scenario: '插入图表'
  },
  'excel_set_chart_title': {
    documentTypes: ['excel'],
    intentKeywords: ['图表标题', 'chart title', '标题'],
    applicableFor: ['image', 'none'],
    priority: 'P2',
    scenario: '设置图表标题'
  },
  'excel_set_chart_type': {
    documentTypes: ['excel'],
    intentKeywords: ['图表类型', '更改图表', 'chart type'],
    applicableFor: ['image', 'none'],
    priority: 'P2',
    scenario: '更改图表类型'
  },

  // ==================== 公式 (P0) ====================
  'excel_set_formula': {
    documentTypes: ['excel'],
    intentKeywords: ['公式', 'formula', '计算', '函数'],
    applicableFor: ['table', 'none'],
    priority: 'P0',
    scenario: '设置单元格公式'
  },
  'excel_insert_sum': {
    documentTypes: ['excel'],
    intentKeywords: ['求和', 'SUM', '总计', '合计', '加总'],
    applicableFor: ['table', 'none'],
    priority: 'P0',
    scenario: '插入 SUM 求和公式'
  },
  'excel_insert_average': {
    documentTypes: ['excel'],
    intentKeywords: ['平均', 'AVERAGE', '均值', '平均分'],
    applicableFor: ['table', 'none'],
    priority: 'P0',
    scenario: '插入 AVERAGE 平均值公式'
  },
  'excel_insert_count': {
    documentTypes: ['excel'],
    intentKeywords: ['计数', 'COUNT', '数量', '个数'],
    applicableFor: ['table', 'none'],
    priority: 'P1',
    scenario: '插入 COUNT 计数公式'
  },
  'excel_insert_if': {
    documentTypes: ['excel'],
    intentKeywords: ['条件', 'IF', '如果', '判断'],
    applicableFor: ['table', 'none'],
    priority: 'P1',
    scenario: '插入 IF 条件公式'
  },
  'excel_insert_vlookup': {
    documentTypes: ['excel'],
    intentKeywords: ['查找', 'VLOOKUP', '搜索', '匹配'],
    applicableFor: ['table', 'none'],
    priority: 'P1',
    scenario: '插入 VLOOKUP 查找公式'
  },

  // ==================== 工作表 (P1) ====================
  'excel_add_worksheet': {
    documentTypes: ['excel'],
    intentKeywords: ['工作表', '新建', 'sheet', '添加表'],
    applicableFor: ['none'],
    priority: 'P1',
    scenario: '添加新工作表'
  },
  'excel_rename_worksheet': {
    documentTypes: ['excel'],
    intentKeywords: ['重命名', '工作表名', 'rename', 'sheet'],
    applicableFor: ['none'],
    priority: 'P2',
    scenario: '重命名工作表'
  },
  'excel_delete_worksheet': {
    documentTypes: ['excel'],
    intentKeywords: ['删除', '工作表', 'delete sheet'],
    applicableFor: ['none'],
    priority: 'P2',
    scenario: '删除工作表'
  },
  'excel_get_sheet_names': {
    documentTypes: ['excel'],
    intentKeywords: ['工作表', '列表', 'sheet names', '所有表'],
    applicableFor: ['none'],
    priority: 'P2',
    scenario: '获取所有工作表名称'
  },

  // ==================== 数据操作 (P1) ====================
  'excel_sort_range': {
    documentTypes: ['excel'],
    intentKeywords: ['排序', 'sort', '升序', '降序', '排列'],
    applicableFor: ['table', 'none'],
    priority: 'P1',
    scenario: '对数据进行排序'
  },
  'excel_filter_range': {
    documentTypes: ['excel'],
    intentKeywords: ['筛选', 'filter', '过滤', '查找'],
    applicableFor: ['table', 'none'],
    priority: 'P1',
    scenario: '筛选数据'
  },
  'excel_remove_duplicates': {
    documentTypes: ['excel'],
    intentKeywords: ['去重', '重复', 'duplicate', '唯一'],
    applicableFor: ['table', 'none'],
    priority: 'P2',
    scenario: '删除重复数据'
  },
  'excel_merge_cells': {
    documentTypes: ['excel'],
    intentKeywords: ['合并', 'merge', '单元格合并'],
    applicableFor: ['table', 'none'],
    priority: 'P1',
    scenario: '合并单元格'
  },
  'excel_unmerge_cells': {
    documentTypes: ['excel'],
    intentKeywords: ['取消合并', 'unmerge', '拆分'],
    applicableFor: ['table', 'none'],
    priority: 'P2',
    scenario: '取消合并单元格'
  },

  // ==================== 透视表 (P2) ====================
  'excel_insert_pivot_table': {
    documentTypes: ['excel'],
    intentKeywords: ['透视表', 'pivot', '数据透视', '汇总'],
    applicableFor: ['table', 'none'],
    priority: 'P2',
    scenario: '创建数据透视表'
  },
  'excel_refresh_pivot': {
    documentTypes: ['excel'],
    intentKeywords: ['刷新', 'refresh', '透视表', '更新'],
    applicableFor: ['table', 'none'],
    priority: 'P2',
    scenario: '刷新透视表'
  },

  // ==================== 教育功能 (P0) ====================
  'excel_class_stats': {
    documentTypes: ['excel'],
    intentKeywords: ['班级', '统计', '成绩', '分析', '学生'],
    applicableFor: ['table', 'none'],
    priority: 'P0',
    scenario: '班级成绩统计分析'
  },
  'excel_generate_ranking': {
    documentTypes: ['excel'],
    intentKeywords: ['排名', '名次', 'ranking', '成绩排序'],
    applicableFor: ['table', 'none'],
    priority: 'P1',
    scenario: '生成成绩排名'
  },
  'excel_attendance_stats': {
    documentTypes: ['excel'],
    intentKeywords: ['考勤', '出勤', 'attendance', '签到'],
    applicableFor: ['table', 'none'],
    priority: 'P1',
    scenario: '考勤统计'
  }
}

/**
 * 为工具添加 metadata
 */
export function applyExcelMetadata<T extends { name: string; metadata?: any }>(tool: T): T {
  const metadata = EXCEL_TOOL_METADATA[tool.name]
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
      documentTypes: ['excel'],
      priority: 'P2'
    }
  }
}

/**
 * 批量为工具添加 metadata
 */
export function applyExcelMetadataToAll<T extends { name: string; metadata?: any }>(tools: T[]): T[] {
  return tools.map(applyExcelMetadata)
}
