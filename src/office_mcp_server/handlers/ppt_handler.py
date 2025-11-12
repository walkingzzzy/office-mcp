"""PowerPoint 处理器主模块 - 门面模式."""

from typing import Any, Optional, List

from loguru import logger

from office_mcp_server.handlers.ppt.ppt_basic import PowerPointBasicOperations
from office_mcp_server.handlers.ppt.ppt_content import PowerPointContentOperations
from office_mcp_server.handlers.ppt.ppt_style import PowerPointStyleOperations
from office_mcp_server.handlers.ppt.ppt_export import PowerPointExportOperations
from office_mcp_server.handlers.ppt.ppt_animation import PowerPointAnimationOperations
from office_mcp_server.handlers.ppt.ppt_content_advanced import PowerPointContentAdvancedOperations
from office_mcp_server.handlers.ppt.ppt_notes_comments import PowerPointNotesCommentsOperations
from office_mcp_server.handlers.ppt.ppt_advanced_features import PowerPointAdvancedFeatures
from office_mcp_server.handlers.ppt.ppt_content_extraction import PowerPointContentExtraction


class PowerPointHandler:
    """PowerPoint 处理器类 - 门面模式.

    将所有PowerPoint操作委托给相应的子模块处理。
    """

    def __init__(self) -> None:
        """初始化 PowerPoint 处理器."""
        self.basic_ops = PowerPointBasicOperations()
        self.content_ops = PowerPointContentOperations()
        self.style_ops = PowerPointStyleOperations()
        self.export_ops = PowerPointExportOperations()
        self.animation_ops = PowerPointAnimationOperations()
        self.content_advanced_ops = PowerPointContentAdvancedOperations()
        self.notes_comments_ops = PowerPointNotesCommentsOperations()
        self.advanced_features_ops = PowerPointAdvancedFeatures()
        self.content_extraction_ops = PowerPointContentExtraction()
        logger.info("PowerPoint 处理器初始化完成 - 已加载所有功能模块")

    # ========== 基础操作 ==========
    def create_presentation(
        self, filename: str, title: str = "", template_path: Optional[str] = None
    ) -> dict[str, Any]:
        """创建演示文稿."""
        return self.basic_ops.create_presentation(filename, title, template_path)

    def add_slide(
        self, filename: str, layout_index: int = 1, title: str = ""
    ) -> dict[str, Any]:
        """添加幻灯片."""
        return self.basic_ops.add_slide(filename, layout_index, title)

    def delete_slide(self, filename: str, slide_index: int) -> dict[str, Any]:
        """删除幻灯片."""
        return self.basic_ops.delete_slide(filename, slide_index)

    def move_slide(
        self, filename: str, from_index: int, to_index: int
    ) -> dict[str, Any]:
        """移动幻灯片."""
        return self.basic_ops.move_slide(filename, from_index, to_index)

    def duplicate_slide(self, filename: str, slide_index: int) -> dict[str, Any]:
        """复制幻灯片."""
        return self.basic_ops.duplicate_slide(filename, slide_index)

    def get_presentation_info(self, filename: str) -> dict[str, Any]:
        """获取演示文稿信息."""
        return self.basic_ops.get_presentation_info(filename)

    # ========== 内容操作 ==========
    def add_text(
        self,
        filename: str,
        slide_index: int,
        text: str,
        left_inches: float = 1.0,
        top_inches: float = 1.0,
        width_inches: float = 8.0,
        height_inches: float = 1.0,
    ) -> dict[str, Any]:
        """添加文本框."""
        return self.content_ops.add_text(
            filename, slide_index, text, left_inches, top_inches, width_inches, height_inches
        )

    def add_image(
        self,
        filename: str,
        slide_index: int,
        image_path: str,
        left_inches: float = 1.0,
        top_inches: float = 1.0,
        width_inches: Optional[float] = None,
    ) -> dict[str, Any]:
        """添加图片."""
        return self.content_ops.add_image(
            filename, slide_index, image_path, left_inches, top_inches, width_inches
        )

    def add_table(
        self,
        filename: str,
        slide_index: int,
        rows: int,
        cols: int,
        data: Optional[list[list[str]]] = None,
    ) -> dict[str, Any]:
        """添加表格."""
        return self.content_ops.add_table(filename, slide_index, rows, cols, data)

    # ========== 样式操作 ==========
    def format_text(
        self,
        filename: str,
        slide_index: int,
        shape_index: int,
        font_name: Optional[str] = None,
        font_size: Optional[int] = None,
        bold: bool = False,
        italic: bool = False,
        underline: bool = False,
        color: Optional[str] = None,
        alignment: Optional[str] = None,
    ) -> dict[str, Any]:
        """格式化文本."""
        return self.style_ops.format_text(
            filename, slide_index, shape_index, font_name, font_size,
            bold, italic, underline, color, alignment
        )

    def apply_theme(
        self,
        filename: str,
        theme_name: str,
        apply_to_all: bool = True,
    ) -> dict[str, Any]:
        """应用主题."""
        return self.style_ops.apply_theme(filename, theme_name, apply_to_all)

    def set_transition(
        self,
        filename: str,
        slide_index: int,
        transition_type: str = "fade",
        duration: float = 1.0,
        apply_to_all: bool = False,
    ) -> dict[str, Any]:
        """设置过渡效果."""
        return self.style_ops.set_transition(
            filename, slide_index, transition_type, duration, apply_to_all
        )

    # ========== 导出操作 ==========
    def export_presentation(
        self,
        filename: str,
        export_format: str = "pdf",
        output_filename: Optional[str] = None,
    ) -> dict[str, Any]:
        """导出演示文稿."""
        return self.export_ops.export_presentation(filename, export_format, output_filename)

    # ========== 动画操作 ==========
    def add_animation(
        self,
        filename: str,
        slide_index: int,
        shape_index: int,
        animation_type: str = "fade",
        duration: float = 0.5,
        delay: float = 0.0,
        trigger: str = "onclick",
    ) -> dict[str, Any]:
        """添加动画效果."""
        return self.animation_ops.add_animation(
            filename, slide_index, shape_index, animation_type,
            duration, delay, trigger
        )

    # ========== 文本高级格式化 ==========
    def add_bullet_points(
        self, filename: str, slide_index: int, shape_index: int,
        bullet_type: str = "bullet", level: int = 0
    ) -> dict[str, Any]:
        """添加项目符号."""
        return self.style_ops.add_bullet_points(filename, slide_index, shape_index, bullet_type, level)

    def set_paragraph_format(
        self, filename: str, slide_index: int, shape_index: int,
        line_spacing: Optional[float] = None, space_before: Optional[float] = None,
        space_after: Optional[float] = None, indent_level: int = 0
    ) -> dict[str, Any]:
        """设置段落格式."""
        return self.style_ops.set_paragraph_format(
            filename, slide_index, shape_index, line_spacing, space_before, space_after, indent_level
        )

    def set_slide_background(
        self, filename: str, slide_index: int, background_type: str = "solid",
        color: Optional[str] = None, image_path: Optional[str] = None, apply_to_all: bool = False
    ) -> dict[str, Any]:
        """设置幻灯片背景."""
        return self.style_ops.set_slide_background(
            filename, slide_index, background_type, color, image_path, apply_to_all
        )

    # ========== 表格高级操作 ==========
    def insert_table_row(
        self, filename: str, slide_index: int, table_index: int,
        row_index: int, data: Optional[List[str]] = None
    ) -> dict[str, Any]:
        """插入表格行."""
        return self.content_advanced_ops.insert_table_row(filename, slide_index, table_index, row_index, data)

    def merge_table_cells(
        self, filename: str, slide_index: int, table_index: int,
        start_row: int, start_col: int, end_row: int, end_col: int
    ) -> dict[str, Any]:
        """合并表格单元格."""
        return self.content_advanced_ops.merge_table_cells(
            filename, slide_index, table_index, start_row, start_col, end_row, end_col
        )

    def format_table_cell(
        self, filename: str, slide_index: int, table_index: int, row: int, col: int,
        fill_color: Optional[str] = None, text_color: Optional[str] = None,
        bold: bool = False, font_size: Optional[int] = None
    ) -> dict[str, Any]:
        """格式化表格单元格."""
        return self.content_advanced_ops.format_table_cell(
            filename, slide_index, table_index, row, col, fill_color, text_color, bold, font_size
        )

    # ========== 形状操作 ==========
    def add_shape(
        self, filename: str, slide_index: int, shape_type: str,
        left_inches: float, top_inches: float, width_inches: float, height_inches: float,
        text: Optional[str] = None, fill_color: Optional[str] = None, line_color: Optional[str] = None
    ) -> dict[str, Any]:
        """添加形状."""
        return self.content_advanced_ops.add_shape(
            filename, slide_index, shape_type, left_inches, top_inches,
            width_inches, height_inches, text, fill_color, line_color
        )

    # ========== 图表操作 ==========
    def add_chart(
        self, filename: str, slide_index: int, chart_type: str,
        categories: List[str], series_data: dict[str, List[float]],
        left_inches: float = 1.0, top_inches: float = 1.5,
        width_inches: float = 8.0, height_inches: float = 5.0, title: Optional[str] = None
    ) -> dict[str, Any]:
        """添加图表."""
        return self.content_advanced_ops.add_chart(
            filename, slide_index, chart_type, categories, series_data,
            left_inches, top_inches, width_inches, height_inches, title
        )

    # ========== 备注和批注 ==========
    def add_speaker_notes(
        self, filename: str, slide_index: int, notes_text: str
    ) -> dict[str, Any]:
        """添加演讲者备注."""
        return self.notes_comments_ops.add_speaker_notes(filename, slide_index, notes_text)

    def get_speaker_notes(
        self, filename: str, slide_index: int
    ) -> dict[str, Any]:
        """获取演讲者备注."""
        return self.notes_comments_ops.get_speaker_notes(filename, slide_index)

    # ========== 页眉页脚 ==========
    def set_header_footer(
        self, filename: str, show_date: bool = False, show_slide_number: bool = True,
        footer_text: Optional[str] = None, apply_to_all: bool = True
    ) -> dict[str, Any]:
        """设置页眉页脚."""
        return self.advanced_features_ops.set_header_footer(
            filename, show_date, show_slide_number, footer_text, apply_to_all
        )

    # ========== 超链接 ==========
    def add_hyperlink(
        self, filename: str, slide_index: int, shape_index: int,
        url: str, link_type: str = "url"
    ) -> dict[str, Any]:
        """添加超链接."""
        return self.advanced_features_ops.add_hyperlink(filename, slide_index, shape_index, url, link_type)

    # ========== 批量操作 ==========
    def batch_set_transition(
        self, filename: str, slide_indices: Optional[List[int]],
        transition_type: str, duration: float = 1.0
    ) -> dict[str, Any]:
        """批量设置过渡效果."""
        return self.advanced_features_ops.batch_set_transition(filename, slide_indices, transition_type, duration)

    def batch_add_footer(
        self, filename: str, footer_text: str, slide_indices: Optional[List[int]] = None
    ) -> dict[str, Any]:
        """批量添加页脚."""
        return self.advanced_features_ops.batch_add_footer(filename, footer_text, slide_indices)

    # ========== 内容提取 ==========
    def extract_all_text(self, filename: str) -> dict[str, Any]:
        """提取所有文本内容."""
        return self.content_extraction_ops.extract_all_text(filename)

    def extract_titles(self, filename: str) -> dict[str, Any]:
        """提取所有幻灯片标题."""
        return self.content_extraction_ops.extract_titles(filename)

    def extract_notes(self, filename: str) -> dict[str, Any]:
        """提取所有演讲者备注."""
        return self.content_extraction_ops.extract_notes(filename)

    def extract_images(self, filename: str) -> dict[str, Any]:
        """提取图片信息列表."""
        return self.content_extraction_ops.extract_images(filename)

    def extract_hyperlinks(self, filename: str) -> dict[str, Any]:
        """提取超链接列表."""
        return self.content_extraction_ops.extract_hyperlinks(filename)

    def extract_all_content(self, filename: str) -> dict[str, Any]:
        """提取所有内容（文本、标题、备注、图片、超链接）."""
        return self.content_extraction_ops.extract_all_content(filename)

