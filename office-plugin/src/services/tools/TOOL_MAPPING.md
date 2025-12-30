# Office 工具映射表

本文档记录 MCP 服务器定义的工具与本地 OfficeToolExecutor 实现的对应关系。

**最后更新**: 2025-12-27

## 🆕 压缩版工具更新

### 工具压缩统计（2025-12-27）

MCP Server 已切换到压缩版本工具，大幅减少了工具数量：

| 应用 | 原工具数 | 压缩后 | 压缩率 |
|------|---------|--------|--------|
| Word | 160 | 28 | 82.5% |
| Excel | 162 | 19 | 88.3% |
| PowerPoint | 87 | 12 | 86.2% |
| **总计** | **409** | **59** | **85.6%** |

### 压缩工具调用方式

压缩版工具使用 `action` 参数来区分不同操作。例如：

```typescript
// 旧版调用（仍然兼容）
{ toolName: 'word_insert_text', args: { text: 'Hello' } }

// 新版调用（推荐）
{ toolName: 'word_text', args: { action: 'insert', text: 'Hello' } }
```

### 向后兼容

MCP Server 内置了向后兼容层，会自动将旧版工具名转换为新版格式：
- `word_insert_text` → `word_text` + `action: 'insert'`
- `excel_set_cell_value` → `excel_cell` + `action: 'setValue'`
- `ppt_add_slide` → `ppt_slide` + `action: 'add'`

详细映射请参考各 MCP Server 的 `toolCompressionMap`。

---

## 原版工具统计信息（参考）

| 应用 | MCP 定义数量 | 完全实现 | 部分实现 | API 限制 |
|------|-------------|----------|----------|----------|
| Word | 77 | ~55 | ~12 | ~10 |
| Excel | 97 | ~75 | ~12 | ~10 |
| PowerPoint | 36 | ~15 | ~5 | ~16 |
| **总计** | **210** | **~145** | **~29** | **~36** |

### 状态说明

- **完全实现**: 功能通过 Office.js API 完整实现
- **部分实现**: 功能实现，但某些参数或场景可能受限
- **API 限制**: Office.js API 不支持该功能，返回友好提示

---

## Word 工具 (77个)

### 段落操作 (10个)
| MCP 工具名 | 状态 | 说明 |
|-----------|------|------|
| `word_add_paragraph` | ✅ 完全实现 | |
| `word_insert_paragraph_at` | ✅ 完全实现 | |
| `word_delete_paragraph` | ✅ 完全实现 | |
| `word_get_paragraphs` | ✅ 完全实现 | |
| `word_set_paragraph_spacing` | ✅ 完全实现 | |
| `word_set_paragraph_alignment` | ✅ 完全实现 | |
| `word_set_paragraph_indent` | ✅ 完全实现 | |
| `word_merge_paragraphs` | ✅ 完全实现 | |
| `word_split_paragraph` | ✅ 完全实现 | |
| `word_move_paragraph` | ✅ 完全实现 | |

### 文本操作 (10个)
| MCP 工具名 | 状态 | 说明 |
|-----------|------|------|
| `word_insert_text` | ✅ 完全实现 | |
| `word_replace_text` | ✅ 完全实现 | |
| `word_delete_text` | ✅ 完全实现 | |
| `word_search_text` | ✅ 完全实现 | |
| `word_get_selected_text` | ✅ 完全实现 | |
| `word_select_text_range` | ✅ 完全实现 | |
| `word_clear_formatting` | ✅ 完全实现 | |
| `word_copy_text` | ✅ 完全实现 | 使用内部剪贴板 |
| `word_cut_text` | ✅ 完全实现 | 使用内部剪贴板 |
| `word_paste_text` | ✅ 完全实现 | 使用内部剪贴板 |

### 格式化操作 (10个)
| MCP 工具名 | 状态 | 说明 |
|-----------|------|------|
| `word_set_font` | ✅ 完全实现 | |
| `word_set_font_size` | ✅ 完全实现 | |
| `word_set_font_color` | ✅ 完全实现 | |
| `word_set_bold` | ✅ 完全实现 | |
| `word_set_italic` | ✅ 完全实现 | |
| `word_set_underline` | ✅ 完全实现 | |
| `word_set_highlight` | ✅ 完全实现 | |
| `word_set_strikethrough` | ✅ 完全实现 | |
| `word_set_subscript` | ✅ 完全实现 | |
| `word_set_superscript` | ✅ 完全实现 | |

### 样式操作 (10个)
| MCP 工具名 | 状态 | 说明 |
|-----------|------|------|
| `word_apply_style` | ✅ 完全实现 | |
| `word_create_style` | ⚠️ API限制 | Office.js 不支持创建自定义样式 |
| `word_list_styles` | ✅ 完全实现 | 返回内置样式列表 |
| `word_set_heading` | ✅ 完全实现 | |
| `word_apply_list_style` | ✅ 完全实现 | |
| `word_set_line_spacing` | ✅ 完全实现 | |
| `word_set_background_color` | ✅ 完全实现 | 使用高亮实现 |
| `word_apply_theme` | ⚠️ API限制 | Office.js 不支持设置主题 |
| `word_reset_style` | ✅ 完全实现 | |
| `word_copy_format` | ✅ 完全实现 | 格式刷功能 |

### 表格操作 (15个)
| MCP 工具名 | 状态 | 说明 |
|-----------|------|------|
| `word_insert_table` | ✅ 完全实现 | |
| `word_delete_table` | ✅ 完全实现 | |
| `word_add_row` | ✅ 完全实现 | |
| `word_add_column` | ✅ 完全实现 | |
| `word_delete_row` | ✅ 完全实现 | |
| `word_delete_column` | ✅ 完全实现 | |
| `word_merge_cells` | ⚠️ API限制 | Office.js 不直接支持 |
| `word_split_cell` | ⚠️ API限制 | Office.js 不直接支持 |
| `word_set_cell_value` | ✅ 完全实现 | |
| `word_get_cell_value` | ✅ 完全实现 | |
| `word_format_table` | ✅ 完全实现 | |
| `word_set_table_style` | ✅ 完全实现 | |
| `word_set_cell_border` | ⚠️ API限制 | 细粒度控制有限 |
| `word_set_cell_shading` | ✅ 完全实现 | |
| `word_table_to_text` | ✅ 完全实现 | |

### 图片操作 (10个)
| MCP 工具名 | 状态 | 说明 |
|-----------|------|------|
| `word_insert_image` | ✅ 完全实现 | |
| `word_delete_image` | ✅ 完全实现 | |
| `word_resize_image` | ✅ 完全实现 | |
| `word_move_image` | ⚠️ API限制 | 内联图片位置由文本流决定 |
| `word_rotate_image` | ⚠️ API限制 | Office.js 不支持 |
| `word_set_image_position` | ⚠️ API限制 | Office.js 不支持更改定位类型 |
| `word_wrap_text_around_image` | ⚠️ API限制 | Office.js 不支持 |
| `word_add_image_caption` | ✅ 完全实现 | |
| `word_compress_images` | ⚠️ API限制 | Office.js 不支持 |
| `word_replace_image` | ✅ 完全实现 | |

### 超链接和引用操作 (8个)
| MCP 工具名 | 状态 | 说明 |
|-----------|------|------|
| `word_insert_hyperlink` | ✅ 完全实现 | |
| `word_remove_hyperlink` | ✅ 完全实现 | |
| `word_insert_bookmark` | ✅ 部分实现 | 使用 ContentControl 实现 |
| `word_insert_cross_reference` | ⚠️ API限制 | Office.js 不支持 |
| `word_insert_footnote` | ✅ 部分实现 | 需要 WordApi 1.5+ |
| `word_insert_endnote` | ✅ 部分实现 | 需要 WordApi 1.5+ |
| `word_insert_citation` | ✅ 部分实现 | 插入文本格式引用 |
| `word_insert_bibliography` | ✅ 部分实现 | 插入标题和占位符 |

### 高级操作 (4个)
| MCP 工具名 | 状态 | 说明 |
|-----------|------|------|
| `word_insert_toc` | ✅ 部分实现 | 生成简化目录 |
| `word_update_toc` | ⚠️ API限制 | Office.js 不支持 |
| `word_insert_page_break` | ✅ 完全实现 | |
| `word_insert_section_break` | ✅ 完全实现 | |

---

## Excel 工具 (97个)

### 单元格操作 (20个)
| MCP 工具名 | 状态 |
|-----------|------|
| `excel_set_cell_value` | ✅ 完全实现 |
| `excel_get_cell_value` | ✅ 完全实现 |
| `excel_set_range_values` | ✅ 完全实现 |
| `excel_get_range_values` | ✅ 完全实现 |
| `excel_clear_range` | ✅ 完全实现 |
| `excel_insert_cells` | ✅ 完全实现 |
| `excel_delete_cells` | ✅ 完全实现 |
| `excel_merge_cells` | ✅ 完全实现 |
| `excel_unmerge_cells` | ✅ 完全实现 |
| `excel_copy_range` | ✅ 完全实现 |
| `excel_cut_range` | ✅ 完全实现 |
| `excel_paste_range` | ✅ 部分实现 |
| `excel_find_cell` | ✅ 完全实现 |
| `excel_replace_cell` | ✅ 完全实现 |
| `excel_sort_range` | ✅ 完全实现 |
| `excel_filter_range` | ✅ 完全实现 |
| `excel_autofit_columns` | ✅ 完全实现 |
| `excel_set_column_width` | ✅ 完全实现 |
| `excel_set_row_height` | ✅ 完全实现 |
| `excel_freeze_panes` | ✅ 完全实现 |

### 格式化操作 (15个) - 全部完全实现
### 公式操作 (15个) - 全部完全实现
### 图表操作 (10个) - 全部完全实现
### 工作表操作 (10个) - 全部完全实现
### 数据分析操作 (15个) - 大部分完全实现

---

## PowerPoint 工具 (36个)

### 幻灯片操作 (10个)
| MCP 工具名 | 状态 | 说明 |
|-----------|------|------|
| `ppt_add_slide` | ✅ 完全实现 | |
| `ppt_delete_slide` | ✅ 完全实现 | |
| `ppt_duplicate_slide` | ⚠️ API限制 | Office.js 支持有限 |
| `ppt_move_slide` | ⚠️ API限制 | Office.js 不直接支持 |
| `ppt_set_slide_layout` | ⚠️ API限制 | Office.js 不直接支持 |
| `ppt_get_slide_count` | ✅ 完全实现 | |
| `ppt_navigate_to_slide` | ⚠️ API限制 | Office.js 不直接支持 |
| `ppt_hide_slide` | ⚠️ API限制 | Office.js 不直接支持 |
| `ppt_unhide_slide` | ⚠️ API限制 | Office.js 不直接支持 |
| `ppt_set_slide_transition` | ⚠️ API限制 | Office.js 不支持 |

### 形状和文本操作 (12个)
| MCP 工具名 | 状态 |
|-----------|------|
| `ppt_add_text_box` | ✅ 完全实现 |
| `ppt_add_shape` | ✅ 完全实现 |
| `ppt_delete_shape` | ✅ 完全实现 |
| `ppt_move_shape` | ✅ 完全实现 |
| `ppt_resize_shape` | ✅ 完全实现 |
| `ppt_set_shape_fill` | ✅ 完全实现 |
| `ppt_set_shape_outline` | ✅ 完全实现 |
| `ppt_set_text_format` | ✅ 完全实现 |
| `ppt_align_shapes` | ⚠️ API限制 |
| `ppt_group_shapes` | ⚠️ API限制 |
| `ppt_ungroup_shapes` | ⚠️ API限制 |
| `ppt_rotate_shape` | ✅ 完全实现 |

### 媒体操作 (6个)
| MCP 工具名 | 状态 |
|-----------|------|
| `ppt_insert_image` | ✅ 完全实现 |
| `ppt_insert_video` | ⚠️ API限制 |
| `ppt_insert_audio` | ⚠️ API限制 |
| `ppt_crop_image` | ⚠️ API限制 |
| `ppt_compress_media` | ⚠️ API限制 |
| `ppt_set_image_effects` | ⚠️ API限制 |

### 动画操作 (8个)
所有动画工具均标记为 ⚠️ API限制，PowerPoint JavaScript API 不支持动画操作。

---

## 文件结构

```
packages/office-plugin/src/services/tools/
├── index.ts                     # 工具注册中心入口
├── types.ts                     # 类型定义
├── TOOL_MAPPING.md              # 本文档
├── word/                        # Word 工具 (77个)
│   ├── index.ts
│   ├── TextTools.ts
│   ├── ReadTools.ts
│   ├── FormattingTools.ts
│   ├── TableTools.ts
│   ├── ImageTools.ts
│   ├── StyleTools.ts
│   ├── SelectionTools.ts
│   ├── ParagraphTools.ts
│   ├── AdvancedTextTools.ts
│   ├── AdvancedFormattingTools.ts
│   ├── AdvancedStyleTools.ts
│   ├── AdvancedTableTools.ts
│   ├── AdvancedImageTools.ts
│   ├── HyperlinkTools.ts
│   └── AdvancedTools.ts
├── excel/                       # Excel 工具 (97个)
│   ├── index.ts
│   ├── CellTools.ts
│   ├── FormatTools.ts
│   ├── FormulaTools.ts
│   ├── ChartTools.ts
│   ├── WorksheetTools.ts
│   └── DataTools.ts
└── powerpoint/                  # PowerPoint 工具 (36个)
    ├── index.ts
    ├── SlideTools.ts
    ├── ShapeTools.ts
    ├── MediaTools.ts
    └── AnimationTools.ts
```

---

## 关于 API 限制

某些功能由于 Office.js JavaScript API 的限制无法直接实现。对于这些功能：

1. 工具已注册，不会报 "Unsupported tool" 错误
2. 调用时返回友好的提示信息，说明限制原因
3. 提供替代方案或建议用户在 Office 应用中手动操作

### Office.js API 版本要求

- 大部分 Word 功能需要 WordApi 1.3+
- 脚注/尾注功能需要 WordApi 1.5+
- Excel 功能需要 ExcelApi 1.7+
- PowerPoint 功能需要 PowerPointApi 1.1+

---

*此文档由代码生成，请勿手动编辑*
