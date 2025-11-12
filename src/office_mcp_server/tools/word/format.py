"""Word 格式化工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.word_handler import WordHandler


def register_format_tools(mcp: FastMCP, word_handler: WordHandler) -> None:
    """注册 Word 格式化工具."""

    @mcp.tool()
    def apply_style_to_word(
        filename: str, paragraph_index: int, style_name: str
    ) -> dict[str, Any]:
        """应用样式到 Word 文档段落.

        Args:
            filename: 文件名
            paragraph_index: 段落索引 (从0开始)
            style_name: 样式名称 ('Normal'正文, 'Quote'引用, 'List Bullet'项目符号, 'List Number'编号列表, 'Intense Quote'强烈引用)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: apply_style_to_word(filename={filename})")
        return word_handler.apply_style(filename, paragraph_index, style_name)

    @mcp.tool()
    def add_list_to_word(
        filename: str, text: str, list_type: str = "bullet", level: int = 0
    ) -> dict[str, Any]:
        """向 Word 文档添加列表段落.

        Args:
            filename: 文件名
            text: 段落文本
            list_type: 列表类型 ('bullet'项目符号 或 'number'编号, 默认 'bullet')
            level: 列表级别 (0-8, 默认 0)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_list_to_word(filename={filename})")
        return word_handler.add_list_paragraph(filename, text, list_type, level)

    @mcp.tool()
    def format_word_paragraph(
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
        """格式化 Word 文档段落.

        Args:
            filename: 文件名
            paragraph_index: 段落索引 (从0开始)
            alignment: 对齐方式 ('left'左对齐, 'center'居中, 'right'右对齐, 'justify'两端对齐, 可选)
            line_spacing: 行距倍数 (如 1.0单倍, 1.5倍, 2.0双倍, 可选)
            space_before: 段前间距磅值 (可选)
            space_after: 段后间距磅值 (可选)
            left_indent: 左缩进英寸 (可选)
            right_indent: 右缩进英寸 (可选)
            first_line_indent: 首行缩进英寸 (负值为悬挂缩进, 可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: format_word_paragraph(filename={filename})")
        return word_handler.format_paragraph(
            filename, paragraph_index, alignment, line_spacing,
            space_before, space_after, left_indent, right_indent, first_line_indent
        )

    @mcp.tool()
    def insert_special_character_to_word(filename: str, paragraph_index: int, character_name: str, position: Optional[int] = None) -> dict[str, Any]:
        """向 Word 文档插入特殊字符.

        Args:
            filename: 文件名
            paragraph_index: 段落索引
            character_name: 字符名称 (如 'copyright', 'trademark', 'degree', 'arrow_right' 等)
            position: 插入位置 (可选,默认在段落末尾)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: insert_special_character_to_word(filename={filename})")
        return word_handler.insert_special_character(filename, paragraph_index, character_name, position)

    @mcp.tool()
    def add_multilevel_list_to_word(filename: str, items: list[dict[str, Any]], list_type: str = "bullet") -> dict[str, Any]:
        """向 Word 文档添加多级列表.

        Args:
            filename: 文件名
            items: 列表项数组,每项包含 'text' 和 'level' (0-8)
            list_type: 列表类型 ('bullet' 或 'number')

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_multilevel_list_to_word(filename={filename})")
        return word_handler.add_multilevel_list(filename, items, list_type)

    @mcp.tool()
    def add_word_header_footer(
        filename: str,
        header_text: Optional[str] = None,
        footer_text: Optional[str] = None,
        add_page_number: bool = False,
        page_number_position: str = "footer_center",
        different_first_page: bool = False,
    ) -> dict[str, Any]:
        """添加 Word 文档页眉页脚.

        Args:
            filename: 文件名
            header_text: 页眉文本 (可选)
            footer_text: 页脚文本 (可选)
            add_page_number: 是否添加页码 (默认 False)
            page_number_position: 页码位置 ('header_left', 'header_center', 'header_right',
                                          'footer_left', 'footer_center', 'footer_right', 默认 'footer_center')
            different_first_page: 首页是否不同 (默认 False)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_word_header_footer(filename={filename})")
        return word_handler.add_header_footer(
            filename, header_text, footer_text, add_page_number,
            page_number_position, different_first_page
        )
