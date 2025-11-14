"""Word 批量格式化工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.word_handler import WordHandler


def register_batch_format_tools(mcp: FastMCP, word_handler: WordHandler) -> None:
    """注册 Word 批量格式化工具."""

    @mcp.tool()
    def batch_format_word_text(
        filename: str,
        paragraph_indices: list[int],
        font_name: Optional[str] = None,
        font_size: Optional[int] = None,
        bold: bool = False,
        italic: bool = False,
        color: Optional[str] = None,
        underline: Optional[str] = None,
    ) -> dict[str, Any]:
        """批量格式化 Word 文档文本.

        Args:
            filename: 文件名
            paragraph_indices: 段落索引列表 (从0开始)
            font_name: 字体名称 (可选)
            font_size: 字号 (可选)
            bold: 是否加粗 (默认 False)
            italic: 是否斜体 (默认 False)
            color: 文字颜色 HEX格式 (如 '#FF0000', 可选)
            underline: 下划线样式 ('single', 'double', 'thick', 可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: batch_format_word_text(filename={filename}, count={len(paragraph_indices)})")
        return word_handler.batch_format_text(
            filename, paragraph_indices, font_name, font_size, bold, italic, color, underline
        )

    @mcp.tool()
    def batch_format_word_paragraph(
        filename: str,
        paragraph_indices: list[int],
        alignment: Optional[str] = None,
        line_spacing: Optional[float] = None,
        space_before: Optional[float] = None,
        space_after: Optional[float] = None,
        left_indent: Optional[float] = None,
        right_indent: Optional[float] = None,
        first_line_indent: Optional[float] = None,
    ) -> dict[str, Any]:
        """批量格式化 Word 文档段落.

        Args:
            filename: 文件名
            paragraph_indices: 段落索引列表 (从0开始)
            alignment: 对齐方式 ('left', 'center', 'right', 'justify', 可选)
            line_spacing: 行距倍数 (可选)
            space_before: 段前间距磅值 (可选)
            space_after: 段后间距磅值 (可选)
            left_indent: 左缩进英寸 (可选)
            right_indent: 右缩进英寸 (可选)
            first_line_indent: 首行缩进英寸 (可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: batch_format_word_paragraph(filename={filename}, count={len(paragraph_indices)})")
        return word_handler.batch_format_paragraph(
            filename, paragraph_indices, alignment, line_spacing, space_before, space_after,
            left_indent, right_indent, first_line_indent
        )

    @mcp.tool()
    def batch_format_word_combined(
        filename: str,
        paragraph_indices: list[int],
        font_name: Optional[str] = None,
        font_size: Optional[int] = None,
        bold: bool = False,
        italic: bool = False,
        color: Optional[str] = None,
        alignment: Optional[str] = None,
        line_spacing: Optional[float] = None,
        space_before: Optional[float] = None,
        space_after: Optional[float] = None,
        first_line_indent: Optional[float] = None,
    ) -> dict[str, Any]:
        """批量格式化 Word 文档文本和段落（组合操作）.

        Args:
            filename: 文件名
            paragraph_indices: 段落索引列表 (从0开始)
            font_name: 字体名称 (可选)
            font_size: 字号 (可选)
            bold: 是否加粗 (默认 False)
            italic: 是否斜体 (默认 False)
            color: 文字颜色 HEX格式 (可选)
            alignment: 对齐方式 (可选)
            line_spacing: 行距倍数 (可选)
            space_before: 段前间距磅值 (可选)
            space_after: 段后间距磅值 (可选)
            first_line_indent: 首行缩进英寸 (可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: batch_format_word_combined(filename={filename}, count={len(paragraph_indices)})")
        return word_handler.batch_format_combined(
            filename, paragraph_indices, font_name, font_size, bold, italic, color,
            alignment, line_spacing, space_before, space_after, first_line_indent
        )

