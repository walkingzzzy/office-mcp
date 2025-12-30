/**
 * Word 压缩工具索引
 * 将 160 个原工具压缩为 28 个统一工具
 *
 * 压缩统计：
 * - 原工具数：160
 * - 压缩后：28
 * - 压缩率：82.5%
 */

import type { ToolDefinition } from './types.js'

// 核心文档操作 (5个)
import { wordDocumentTool } from './document.js'
import { wordReadTool } from './read.js'
import { wordTextTool } from './text.js'
import { wordParagraphTool } from './paragraph.js'
import { wordFormattingTool } from './formatting.js'

// 内容与样式 (5个)
import { wordStyleTool } from './style.js'
import { wordTableTool } from './table.js'
import { wordImageTool } from './image.js'
import { wordShapeTool } from './shape.js'
import { wordChartTool } from './chart.js'

// 页面与布局 (3个)
import { wordPageSetupTool } from './pageSetup.js'
import { wordHeaderFooterTool } from './headerFooter.js'
import { wordAdvancedTool } from './advanced.js'

// 引用与导航 (3个)
import { wordReferenceTool } from './reference.js'
import { wordBookmarkTool } from './bookmark.js'
import { wordFieldTool } from './field.js'

// 协作与审阅 (4个)
import { wordCommentTool } from './comment.js'
import { wordTrackChangesTool } from './trackChanges.js'
import { wordCoauthoringTool } from './coauthoring.js'
import { wordConflictTool } from './conflict.js'

// 高级功能 (3个)
import { wordContentControlTool } from './contentControl.js'
import { wordAnnotationTool } from './annotation.js'
import { wordCanvasTool } from './canvas.js'

// 教育场景 (5个，保持独立)
import {
  wordMailMergeTool,
  wordExamHeaderTool,
  wordQuestionSectionTool,
  wordLessonPlanTool,
  wordOfficialHeaderTool
} from './education.js'

/**
 * 获取所有 Word 工具（压缩版）
 * 总计 28 个工具（原 160 个）
 *
 * 注意：这是压缩版工具，使用 action 参数模式
 */
export function getWordTools(): ToolDefinition[] {
  return [
    // 核心文档操作 (5个) - 合并 51 个原工具
    wordDocumentTool,      // 合并 12 个
    wordReadTool,          // 合并 7 个
    wordTextTool,          // 合并 10 个
    wordParagraphTool,     // 合并 10 个
    wordFormattingTool,    // 合并 12 个

    // 内容与样式 (5个) - 合并 45 个原工具
    wordStyleTool,         // 合并 10 个
    wordTableTool,         // 合并 15 个
    wordImageTool,         // 合并 10 个
    wordShapeTool,         // 合并 8 个
    wordChartTool,         // 合并 2 个

    // 页面与布局 (3个) - 合并 16 个原工具
    wordPageSetupTool,     // 合并 6 个
    wordHeaderFooterTool,  // 合并 6 个
    wordAdvancedTool,      // 合并 4 个

    // 引用与导航 (3个) - 合并 22 个原工具
    wordReferenceTool,     // 合并 8 个
    wordBookmarkTool,      // 合并 6 个
    wordFieldTool,         // 合并 8 个

    // 协作与审阅 (4个) - 合并 27 个原工具
    wordCommentTool,       // 合并 6 个
    wordTrackChangesTool,  // 合并 8 个
    wordCoauthoringTool,   // 合并 6 个
    wordConflictTool,      // 合并 7 个

    // 高级功能 (3个) - 合并 18 个原工具
    wordContentControlTool, // 合并 6 个
    wordAnnotationTool,    // 合并 6 个
    wordCanvasTool,        // 合并 6 个

    // 教育场景 (5个，保持独立)
    wordMailMergeTool,
    wordExamHeaderTool,
    wordQuestionSectionTool,
    wordLessonPlanTool,
    wordOfficialHeaderTool
  ]
}

/**
 * 工具压缩映射表
 * 用于向后兼容，将旧工具名映射到新工具
 */
export const toolCompressionMap: Record<string, { newTool: string; action: string }> = {
  // 文档操作
  'word_open_document': { newTool: 'word_document', action: 'open' },
  'word_close_document': { newTool: 'word_document', action: 'close' },
  'word_save_document': { newTool: 'word_document', action: 'save' },
  'word_save_as_document': { newTool: 'word_document', action: 'saveAs' },
  'word_get_save_status': { newTool: 'word_document', action: 'getSaveStatus' },
  'word_print_document': { newTool: 'word_document', action: 'print' },
  'word_print_preview': { newTool: 'word_document', action: 'printPreview' },
  'word_close_print_preview': { newTool: 'word_document', action: 'closePrintPreview' },
  'word_get_document_properties': { newTool: 'word_document', action: 'getProperties' },
  'word_set_document_properties': { newTool: 'word_document', action: 'setProperties' },
  'word_get_document_statistics': { newTool: 'word_document', action: 'getStatistics' },
  'word_get_document_path': { newTool: 'word_document', action: 'getPath' },

  // 文本操作
  'word_insert_text': { newTool: 'word_text', action: 'insert' },
  'word_replace_text': { newTool: 'word_text', action: 'replace' },
  'word_delete_text': { newTool: 'word_text', action: 'delete' },
  'word_search_text': { newTool: 'word_text', action: 'search' },
  'word_get_selected_text': { newTool: 'word_text', action: 'getSelected' },
  'word_select_text_range': { newTool: 'word_text', action: 'select' },
  'word_clear_formatting': { newTool: 'word_text', action: 'clearFormat' },
  'word_copy_text': { newTool: 'word_text', action: 'copy' },
  'word_cut_text': { newTool: 'word_text', action: 'cut' },
  'word_paste_text': { newTool: 'word_text', action: 'paste' },

  // 段落操作
  'word_add_paragraph': { newTool: 'word_paragraph', action: 'add' },
  'word_insert_paragraph_at': { newTool: 'word_paragraph', action: 'insertAt' },
  'word_delete_paragraph': { newTool: 'word_paragraph', action: 'delete' },
  'word_get_paragraphs': { newTool: 'word_paragraph', action: 'get' },
  'word_set_paragraph_spacing': { newTool: 'word_paragraph', action: 'setSpacing' },
  'word_set_paragraph_alignment': { newTool: 'word_paragraph', action: 'setAlignment' },
  'word_set_paragraph_indent': { newTool: 'word_paragraph', action: 'setIndent' },
  'word_merge_paragraphs': { newTool: 'word_paragraph', action: 'merge' },
  'word_split_paragraph': { newTool: 'word_paragraph', action: 'split' },
  'word_move_paragraph': { newTool: 'word_paragraph', action: 'move' },

  // 表格操作
  'word_insert_table': { newTool: 'word_table', action: 'insert' },
  'word_delete_table': { newTool: 'word_table', action: 'delete' },
  'word_add_row': { newTool: 'word_table', action: 'addRow' },
  'word_add_column': { newTool: 'word_table', action: 'addColumn' },
  'word_delete_row': { newTool: 'word_table', action: 'deleteRow' },
  'word_delete_column': { newTool: 'word_table', action: 'deleteColumn' },
  'word_merge_cells': { newTool: 'word_table', action: 'mergeCells' },
  'word_split_cell': { newTool: 'word_table', action: 'splitCell' },
  'word_set_cell_value': { newTool: 'word_table', action: 'setCellValue' },
  'word_get_cell_value': { newTool: 'word_table', action: 'getCellValue' },
  'word_format_table': { newTool: 'word_table', action: 'format' },
  'word_set_table_style': { newTool: 'word_table', action: 'setStyle' },
  'word_set_cell_border': { newTool: 'word_table', action: 'setCellBorder' },
  'word_set_cell_shading': { newTool: 'word_table', action: 'setCellShading' },
  'word_table_to_text': { newTool: 'word_table', action: 'toText' },

  // 样式操作
  'word_apply_style': { newTool: 'word_style', action: 'apply' },
  'word_create_style': { newTool: 'word_style', action: 'create' },
  'word_list_styles': { newTool: 'word_style', action: 'list' },
  'word_set_heading': { newTool: 'word_style', action: 'setHeading' },
  'word_apply_list_style': { newTool: 'word_style', action: 'applyList' },
  'word_set_line_spacing': { newTool: 'word_style', action: 'setLineSpacing' },
  'word_set_background_color': { newTool: 'word_style', action: 'setBackgroundColor' },
  'word_apply_theme': { newTool: 'word_style', action: 'applyTheme' },
  'word_reset_style': { newTool: 'word_style', action: 'reset' },
  'word_copy_format': { newTool: 'word_style', action: 'copyFormat' },

  // 读取操作
  'word_get_document_content': { newTool: 'word_read', action: 'getContent' },
  'word_get_paragraph_count': { newTool: 'word_read', action: 'getParagraphCount' },
  'word_get_word_count': { newTool: 'word_read', action: 'getWordCount' },
  'word_get_tables': { newTool: 'word_read', action: 'getTables' },
  'word_get_images': { newTool: 'word_read', action: 'getImages' },
  'word_get_styles': { newTool: 'word_read', action: 'getStyles' }
}

// 导出所有工具定义
export {
  wordDocumentTool,
  wordReadTool,
  wordTextTool,
  wordParagraphTool,
  wordFormattingTool,
  wordStyleTool,
  wordTableTool,
  wordImageTool,
  wordShapeTool,
  wordChartTool,
  wordPageSetupTool,
  wordHeaderFooterTool,
  wordAdvancedTool,
  wordReferenceTool,
  wordBookmarkTool,
  wordFieldTool,
  wordCommentTool,
  wordTrackChangesTool,
  wordCoauthoringTool,
  wordConflictTool,
  wordContentControlTool,
  wordAnnotationTool,
  wordCanvasTool,
  wordMailMergeTool,
  wordExamHeaderTool,
  wordQuestionSectionTool,
  wordLessonPlanTool,
  wordOfficialHeaderTool
}

// 导出类型
export type { ToolDefinition, ToolCategory, ApplicationType } from './types.js'

// 兼容别名：保留原压缩函数名以便向后兼容
export const getWordToolsCompressed = getWordTools
