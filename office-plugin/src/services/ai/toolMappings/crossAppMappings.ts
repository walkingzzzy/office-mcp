/**
 * 跨应用通用关键词映射
 * 
 * 包含同时映射到多个应用工具的关键词
 * ⚠️ 注意：所有工具名必须与 MCP Server (office_mcp_server_js) 中的定义一致
 */

export const CROSS_APP_MAPPINGS: Record<string, string[]> = {
  // ==================== 跨应用图片操作 ====================
  '插入图片': ['word_insert_image', 'ppt_insert_image'],

  // ==================== 跨应用对齐操作 ====================
  '对齐': ['word_set_paragraph_alignment', 'ppt_align_shapes'],

  // ==================== 跨应用查找操作 ====================
  '查找': ['word_search_text', 'excel_insert_vlookup', 'excel_find_cell'],

  // ==================== 跨应用单元格操作 ====================
  '合并单元格': ['word_merge_cells', 'excel_merge_cells']
}
