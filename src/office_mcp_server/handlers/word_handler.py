"""Word 处理器主模块 - 门面模式."""

from typing import Any, Optional, List

from loguru import logger

from office_mcp_server.handlers.word.word_basic import WordBasicOperations
from office_mcp_server.handlers.word.word_format import WordFormatOperations
from office_mcp_server.handlers.word.word_structure import WordStructureOperations
from office_mcp_server.handlers.word.word_advanced import WordAdvancedOperations
from office_mcp_server.handlers.word.word_edit import WordEditOperations
from office_mcp_server.handlers.word.word_table_format import WordTableFormatOperations
from office_mcp_server.handlers.word.word_bookmark_hyperlink import WordBookmarkHyperlinkOperations
from office_mcp_server.handlers.word.word_content_extraction import WordContentExtractionOperations
from office_mcp_server.handlers.word.word_enhanced import WordEnhancedOperations
from office_mcp_server.handlers.word.word_image import WordImageOperations
from office_mcp_server.handlers.word.word_style_management import WordStyleManagement


class WordHandler:
    """Word 处理器类 - 门面模式.

    将所有Word操作委托给相应的子模块处理。
    """

    def __init__(self) -> None:
        """初始化 Word 处理器."""
        self.basic_ops = WordBasicOperations()
        self.format_ops = WordFormatOperations()
        self.structure_ops = WordStructureOperations()
        self.advanced_ops = WordAdvancedOperations()
        self.edit_ops = WordEditOperations()
        self.table_format_ops = WordTableFormatOperations()
        self.bookmark_hyperlink_ops = WordBookmarkHyperlinkOperations()
        self.content_extraction_ops = WordContentExtractionOperations()
        self.enhanced_ops = WordEnhancedOperations()
        self.image_ops = WordImageOperations()
        self.style_mgmt = WordStyleManagement()
        logger.info("Word 处理器初始化完成 - 已加载所有功能模块")

    # ========== 基础操作 ==========
    def create_document(
        self, filename: str, title: str = "", content: str = ""
    ) -> dict[str, Any]:
        """创建文档."""
        return self.basic_ops.create_document(filename, title, content)

    def insert_text(
        self, filename: str, text: str, position: str = "end"
    ) -> dict[str, Any]:
        """插入文本."""
        return self.basic_ops.insert_text(filename, text, position)

    def add_heading(
        self, filename: str, text: str, level: int = 1
    ) -> dict[str, Any]:
        """添加标题."""
        return self.basic_ops.add_heading(filename, text, level)

    def add_page_break(self, filename: str) -> dict[str, Any]:
        """添加分页符."""
        return self.basic_ops.add_page_break(filename)

    def insert_image(
        self, filename: str, image_path: str, width_inches: Optional[float] = None
    ) -> dict[str, Any]:
        """插入图片."""
        return self.basic_ops.insert_image(filename, image_path, width_inches)

    def get_document_info(self, filename: str) -> dict[str, Any]:
        """获取文档信息."""
        return self.basic_ops.get_document_info(filename)

    # ========== 格式化操作 ==========
    def format_text(
        self,
        filename: str,
        paragraph_index: int,
        font_name: Optional[str] = None,
        font_size: Optional[int] = None,
        bold: bool = False,
        italic: bool = False,
        color: Optional[str] = None,
        underline: Optional[str] = None,
        strike: bool = False,
        double_strike: bool = False,
        superscript: bool = False,
        subscript: bool = False,
        highlight: Optional[str] = None,
        spacing: Optional[float] = None,
        shadow: bool = False,
    ) -> dict[str, Any]:
        """格式化文本."""
        return self.format_ops.format_text(
            filename, paragraph_index, font_name, font_size, bold, italic, color,
            underline, strike, double_strike, superscript, subscript, highlight, spacing, shadow
        )

    def format_paragraph(
        self,
        filename: str,
        paragraph_index: int,
        alignment: Optional[str] = None,
        line_spacing: Optional[float] = None,
        space_before: Optional[float] = None,
        space_after: Optional[float] = None,
        left_indent: Optional[float] = None,
        right_indent: Optional[float] = None,
        first_line_indent: Optional[float] = None,
    ) -> dict[str, Any]:
        """格式化段落."""
        return self.format_ops.format_paragraph(
            filename, paragraph_index, alignment, line_spacing,
            space_before, space_after, left_indent, right_indent, first_line_indent
        )

    def apply_style(
        self, filename: str, paragraph_index: int, style_name: str
    ) -> dict[str, Any]:
        """应用样式."""
        return self.format_ops.apply_style(filename, paragraph_index, style_name)

    # ========== 结构操作 ==========
    def create_table(
        self, filename: str, rows: int, cols: int, data: Optional[list[list[str]]] = None
    ) -> dict[str, Any]:
        """创建表格."""
        return self.structure_ops.create_table(filename, rows, cols, data)

    def edit_table(
        self,
        filename: str,
        table_index: int,
        operation: str,
        row_index: Optional[int] = None,
        col_index: Optional[int] = None,
    ) -> dict[str, Any]:
        """编辑表格."""
        return self.structure_ops.edit_table(
            filename, table_index, operation, row_index, col_index
        )

    def merge_table_cells(
        self,
        filename: str,
        table_index: int,
        start_row: int,
        start_col: int,
        end_row: int,
        end_col: int,
    ) -> dict[str, Any]:
        """合并表格单元格."""
        return self.structure_ops.merge_table_cells(
            filename, table_index, start_row, start_col, end_row, end_col
        )

    def add_list_paragraph(
        self, filename: str, text: str, list_type: str = "bullet", level: int = 0
    ) -> dict[str, Any]:
        """添加列表段落."""
        return self.structure_ops.add_list_paragraph(filename, text, list_type, level)

    # ========== 高级功能 ==========
    def add_header_footer(
        self,
        filename: str,
        header_text: Optional[str] = None,
        footer_text: Optional[str] = None,
        add_page_number: bool = False,
        page_number_position: str = "footer_center",
        different_first_page: bool = False,
    ) -> dict[str, Any]:
        """添加页眉页脚."""
        return self.advanced_ops.add_header_footer(
            filename, header_text, footer_text, add_page_number,
            page_number_position, different_first_page
        )

    def generate_table_of_contents(
        self,
        filename: str,
        title: str = "目录",
        max_level: int = 3,
        hyperlink: bool = True,
    ) -> dict[str, Any]:
        """生成目录."""
        return self.advanced_ops.generate_table_of_contents(
            filename, title, max_level, hyperlink
        )

    def export_document(
        self,
        filename: str,
        export_format: str = "pdf",
        output_filename: Optional[str] = None,
    ) -> dict[str, Any]:
        """导出文档."""
        return self.advanced_ops.export_document(filename, export_format, output_filename)

    def add_comment(
        self,
        filename: str,
        paragraph_index: int,
        comment_text: str,
        author: str = "User",
        date: Optional[str] = None,
    ) -> dict[str, Any]:
        """添加批注."""
        return self.advanced_ops.add_comment(
            filename, paragraph_index, comment_text, author, date
        )

    def mail_merge(
        self,
        template_filename: str,
        data_source: list[dict[str, str]],
        output_pattern: str = "output_{index}.docx",
        merge_fields: Optional[list[str]] = None,
    ) -> dict[str, Any]:
        """邮件合并."""
        return self.advanced_ops.mail_merge(
            template_filename, data_source, output_pattern, merge_fields
        )

    # ========== 文本编辑操作 ==========
    def find_text(
        self,
        filename: str,
        search_text: str,
        case_sensitive: bool = False,
        whole_word: bool = False,
    ) -> dict[str, Any]:
        """查找文本."""
        return self.edit_ops.find_text(filename, search_text, case_sensitive, whole_word)

    def replace_text(
        self,
        filename: str,
        search_text: str,
        replace_text: str,
        case_sensitive: bool = False,
        whole_word: bool = False,
        max_replacements: Optional[int] = None,
    ) -> dict[str, Any]:
        """替换文本."""
        return self.edit_ops.replace_text(
            filename, search_text, replace_text, case_sensitive, whole_word, max_replacements
        )

    def delete_text(
        self,
        filename: str,
        search_text: str,
        case_sensitive: bool = False,
        whole_word: bool = False,
    ) -> dict[str, Any]:
        """删除文本."""
        return self.edit_ops.delete_text(filename, search_text, case_sensitive, whole_word)

    # ========== 表格格式化操作 ==========
    def format_table_cell(
        self,
        filename: str,
        table_index: int,
        row: int,
        col: int,
        alignment: Optional[str] = None,
        background_color: Optional[str] = None,
        text_color: Optional[str] = None,
        bold: bool = False,
        font_size: Optional[int] = None,
    ) -> dict[str, Any]:
        """格式化表格单元格."""
        return self.table_format_ops.format_table_cell(
            filename, table_index, row, col, alignment, background_color, text_color, bold, font_size
        )

    def apply_table_style(
        self,
        filename: str,
        table_index: int,
        style_name: str = "Table Grid",
    ) -> dict[str, Any]:
        """应用表格样式."""
        return self.table_format_ops.apply_table_style(filename, table_index, style_name)

    def set_table_borders(
        self,
        filename: str,
        table_index: int,
        border_style: str = "single",
        border_size: int = 4,
        border_color: str = "#000000",
    ) -> dict[str, Any]:
        """设置表格边框."""
        return self.table_format_ops.set_table_borders(
            filename, table_index, border_style, border_size, border_color
        )

    def set_column_width(
        self,
        filename: str,
        table_index: int,
        col_index: int,
        width_inches: float,
    ) -> dict[str, Any]:
        """设置列宽."""
        return self.table_format_ops.set_column_width(filename, table_index, col_index, width_inches)

    def set_row_height(
        self,
        filename: str,
        table_index: int,
        row_index: int,
        height_inches: float,
    ) -> dict[str, Any]:
        """设置行高."""
        return self.table_format_ops.set_row_height(filename, table_index, row_index, height_inches)

    def read_table_data(
        self,
        filename: str,
        table_index: int,
    ) -> dict[str, Any]:
        """读取表格数据."""
        return self.table_format_ops.read_table_data(filename, table_index)

    # ========== 书签和超链接操作 ==========
    def add_bookmark(
        self,
        filename: str,
        paragraph_index: int,
        bookmark_name: str,
    ) -> dict[str, Any]:
        """添加书签."""
        return self.bookmark_hyperlink_ops.add_bookmark(filename, paragraph_index, bookmark_name)

    def list_bookmarks(
        self,
        filename: str,
    ) -> dict[str, Any]:
        """列出所有书签."""
        return self.bookmark_hyperlink_ops.list_bookmarks(filename)

    def add_hyperlink(
        self,
        filename: str,
        paragraph_index: int,
        text: str,
        url: str,
        link_type: str = "url",
    ) -> dict[str, Any]:
        """添加超链接."""
        return self.bookmark_hyperlink_ops.add_hyperlink(
            filename, paragraph_index, text, url, link_type
        )

    def extract_hyperlinks(
        self,
        filename: str,
    ) -> dict[str, Any]:
        """提取所有超链接."""
        return self.bookmark_hyperlink_ops.extract_hyperlinks(filename)

    # ========== 内容提取操作 ==========
    def extract_text(
        self,
        filename: str,
        include_tables: bool = False,
    ) -> dict[str, Any]:
        """提取所有文本."""
        return self.content_extraction_ops.extract_text(filename, include_tables)

    def extract_headings(
        self,
        filename: str,
        max_level: int = 9,
    ) -> dict[str, Any]:
        """提取所有标题."""
        return self.content_extraction_ops.extract_headings(filename, max_level)

    def extract_tables(
        self,
        filename: str,
    ) -> dict[str, Any]:
        """提取所有表格数据."""
        return self.content_extraction_ops.extract_tables(filename)

    def extract_images(
        self,
        filename: str,
    ) -> dict[str, Any]:
        """提取所有图片信息."""
        return self.content_extraction_ops.extract_images(filename)

    def get_document_statistics(
        self,
        filename: str,
    ) -> dict[str, Any]:
        """获取文档统计信息."""
        return self.content_extraction_ops.get_document_statistics(filename)

    # ========== 批量操作 ==========
    def batch_replace_text(
        self,
        filenames: List[str],
        search_text: str,
        replace_text: str,
    ) -> dict[str, Any]:
        """批量替换文本."""
        return self.enhanced_ops.batch_replace_text(filenames, search_text, replace_text)

    def batch_apply_style(
        self,
        filenames: List[str],
        style_name: str,
        apply_to: str = "body",
    ) -> dict[str, Any]:
        """批量应用样式."""
        return self.enhanced_ops.batch_apply_style(filenames, style_name, apply_to)

    def merge_documents(
        self,
        source_filenames: List[str],
        output_filename: str,
        add_page_breaks: bool = True,
    ) -> dict[str, Any]:
        """合并多个文档."""
        return self.enhanced_ops.merge_documents(source_filenames, output_filename, add_page_breaks)

    def split_document_by_headings(
        self,
        filename: str,
        heading_level: int = 1,
        output_pattern: str = "section_{index}.docx",
    ) -> dict[str, Any]:
        """按标题拆分文档."""
        return self.enhanced_ops.split_document_by_headings(filename, heading_level, output_pattern)

    # ========== 新增功能 ==========
    # 文本编辑增强
    def find_text_regex(self, filename: str, regex_pattern: str, case_sensitive: bool = False) -> dict[str, Any]:
        """使用正则表达式查找文本."""
        return self.edit_ops.find_text_regex(filename, regex_pattern, case_sensitive)

    def replace_text_regex(self, filename: str, regex_pattern: str, replacement: str, case_sensitive: bool = False, max_replacements: Optional[int] = None) -> dict[str, Any]:
        """使用正则表达式替换文本."""
        return self.edit_ops.replace_text_regex(filename, regex_pattern, replacement, case_sensitive, max_replacements)

    def insert_special_character(self, filename: str, paragraph_index: int, character_name: str, position: Optional[int] = None) -> dict[str, Any]:
        """插入特殊字符."""
        return self.edit_ops.insert_special_character(filename, paragraph_index, character_name, position)

    # 多级列表
    def add_multilevel_list(self, filename: str, items: list[dict[str, Any]], list_type: str = "bullet") -> dict[str, Any]:
        """添加多级列表."""
        return self.structure_ops.add_multilevel_list(filename, items, list_type)

    # 表格增强
    def sort_table(self, filename: str, table_index: int, column_index: int, reverse: bool = False, has_header: bool = True) -> dict[str, Any]:
        """对表格排序."""
        return self.structure_ops.sort_table(filename, table_index, column_index, reverse, has_header)

    def import_table_data(self, filename: str, data: list[list[str]], has_header: bool = True, table_style: str = "Table Grid") -> dict[str, Any]:
        """从数据导入创建表格."""
        return self.structure_ops.import_table_data(filename, data, has_header, table_style)

    # 图片增强
    def insert_image_from_url(self, filename: str, image_url: str, width_inches: Optional[float] = None, height_inches: Optional[float] = None, alignment: str = "left") -> dict[str, Any]:
        """从 URL 插入图片."""
        return self.image_ops.insert_image_from_url(filename, image_url, width_inches, height_inches, alignment)

    def insert_image_with_size(self, filename: str, image_path: str, width_inches: Optional[float] = None, height_inches: Optional[float] = None, alignment: str = "left", keep_aspect_ratio: bool = True) -> dict[str, Any]:
        """插入图片并设置完整的大小和对齐方式."""
        return self.image_ops.insert_image_with_size(filename, image_path, width_inches, height_inches, alignment, keep_aspect_ratio)

    # 样式管理
    def list_styles(self, filename: str, style_type: Optional[str] = None) -> dict[str, Any]:
        """列出文档中的所有样式."""
        return self.style_mgmt.list_styles(filename, style_type)

    def create_paragraph_style(self, filename: str, style_name: str, base_style: str = "Normal", font_name: Optional[str] = None, font_size: Optional[int] = None, font_color: Optional[str] = None, bold: bool = False, italic: bool = False) -> dict[str, Any]:
        """创建段落样式."""
        return self.style_mgmt.create_paragraph_style(filename, style_name, base_style, font_name, font_size, font_color, bold, italic)

    # 文档元数据
    def get_document_properties(self, filename: str) -> dict[str, Any]:
        """获取文档属性（元数据）."""
        return self.basic_ops.get_document_properties(filename)

    def set_document_properties(self, filename: str, author: Optional[str] = None, title: Optional[str] = None, subject: Optional[str] = None, keywords: Optional[str] = None, comments: Optional[str] = None, category: Optional[str] = None) -> dict[str, Any]:
        """设置文档属性（元数据）."""
        return self.basic_ops.set_document_properties(filename, author, title, subject, keywords, comments, category)

    # 书签和超链接管理
    def delete_bookmark(self, filename: str, bookmark_name: str) -> dict[str, Any]:
        """删除书签."""
        return self.bookmark_hyperlink_ops.delete_bookmark(filename, bookmark_name)

    def batch_update_hyperlinks(self, filename: str, old_domain: str, new_domain: str) -> dict[str, Any]:
        """批量更新超链接中的域名."""
        return self.bookmark_hyperlink_ops.batch_update_hyperlinks(filename, old_domain, new_domain)

    # 页眉页脚增强
    def add_header_footer_different_odd_even(self, filename: str, odd_header: Optional[str] = None, even_header: Optional[str] = None, odd_footer: Optional[str] = None, even_footer: Optional[str] = None) -> dict[str, Any]:
        """添加奇偶页不同的页眉页脚."""
        return self.advanced_ops.add_header_footer_different_odd_even(filename, odd_header, even_header, odd_footer, even_footer)

    def insert_datetime_field(self, filename: str, paragraph_index: int, format_string: str = "yyyy-MM-dd", field_type: str = "date") -> dict[str, Any]:
        """插入日期时间域."""
        return self.advanced_ops.insert_datetime_field(filename, paragraph_index, format_string, field_type)

    # 批量操作增强
    def batch_convert_format(self, filenames: List[str], output_format: str = "pdf") -> dict[str, Any]:
        """批量转换文档格式."""
        return self.enhanced_ops.batch_convert_format(filenames, output_format)

    def batch_add_header_footer(self, filenames: List[str], header_text: Optional[str] = None, footer_text: Optional[str] = None, add_page_number: bool = False) -> dict[str, Any]:
        """批量添加页眉页脚."""
        return self.enhanced_ops.batch_add_header_footer(filenames, header_text, footer_text, add_page_number)

    def batch_insert_content(self, filenames: List[str], content: str, position: str = "end", paragraph_index: Optional[int] = None) -> dict[str, Any]:
        """批量插入内容."""
        return self.enhanced_ops.batch_insert_content(filenames, content, position, paragraph_index)

