"""Word 基础操作工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.word_handler import WordHandler


def register_basic_tools(mcp: FastMCP, word_handler: WordHandler) -> None:
    """注册 Word 基础操作工具."""

    @mcp.tool()
    def create_word_document(filename: str, title: str = "", content: str = "") -> dict[str, Any]:
        """创建 Word 文档.

        Args:
            filename: 文件名 (如 'document.docx')
            title: 文档标题 (可选)
            content: 文档内容 (可选)

        Returns:
            dict: 操作结果,包含文件路径和状态
        """
        logger.info(f"MCP工具调用: create_word_document(filename={filename})")
        return word_handler.create_document(filename, title, content)

    @mcp.tool()
    def insert_text_to_word(
        filename: str, text: str, position: str = "end"
    ) -> dict[str, Any]:
        """向 Word 文档插入文本.

        Args:
            filename: 文件名
            text: 要插入的文本
            position: 插入位置 ('start' 或 'end', 默认 'end')

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: insert_text_to_word(filename={filename})")
        return word_handler.insert_text(filename, text, position)

    @mcp.tool()
    def format_word_text(
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
        """格式化 Word 文档中的文本.

        Args:
            filename: 文件名
            paragraph_index: 段落索引 (从0开始)
            font_name: 字体名称 (可选)
            font_size: 字号 (可选)
            bold: 是否加粗 (默认 False)
            italic: 是否斜体 (默认 False)
            color: 文字颜色 HEX格式 (如 '#FF0000', 可选)
            underline: 下划线样式 ('single', 'double', 'thick', 'dotted', 'dash', 'wave', 可选)
            strike: 是否删除线 (默认 False)
            double_strike: 是否双删除线 (默认 False)
            superscript: 是否上标 (默认 False)
            subscript: 是否下标 (默认 False)
            highlight: 高亮颜色 ('yellow', 'green', 'cyan', 'magenta', 'blue', 'red', 等, 可选)
            spacing: 字符间距 (磅值, 可选)
            shadow: 是否文字阴影 (默认 False)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: format_word_text(filename={filename})")
        return word_handler.format_text(
            filename, paragraph_index, font_name, font_size, bold, italic, color,
            underline, strike, double_strike, superscript, subscript, highlight, spacing, shadow
        )

    @mcp.tool()
    def add_heading_to_word(filename: str, text: str, level: int = 1) -> dict[str, Any]:
        """向 Word 文档添加标题.

        Args:
            filename: 文件名
            text: 标题文本
            level: 标题级别 (1-9, 默认 1)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_heading_to_word(filename={filename})")
        return word_handler.add_heading(filename, text, level)

    @mcp.tool()
    def create_word_table(
        filename: str, rows: int, cols: int, data: Optional[list[list[str]]] = None
    ) -> dict[str, Any]:
        """在 Word 文档中创建表格.

        Args:
            filename: 文件名
            rows: 行数
            cols: 列数
            data: 表格数据 (可选, 二维列表)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: create_word_table(filename={filename})")
        return word_handler.create_table(filename, rows, cols, data)

    @mcp.tool()
    def insert_image_to_word(
        filename: str, image_path: str, width_inches: Optional[float] = None
    ) -> dict[str, Any]:
        """向 Word 文档插入图片.

        Args:
            filename: 文件名
            image_path: 图片文件路径
            width_inches: 图片宽度 (英寸, 可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: insert_image_to_word(filename={filename})")
        return word_handler.insert_image(filename, image_path, width_inches)

    @mcp.tool()
    def add_page_break_to_word(filename: str) -> dict[str, Any]:
        """向 Word 文档添加分页符.

        Args:
            filename: 文件名

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_page_break_to_word(filename={filename})")
        return word_handler.add_page_break(filename)

    @mcp.tool()
    def get_word_document_info(filename: str) -> dict[str, Any]:
        """获取 Word 文档信息.

        Args:
            filename: 文件名

        Returns:
            dict: 文档信息 (段落数、表格数、字数等)
        """
        logger.info(f"MCP工具调用: get_word_document_info(filename={filename})")
        return word_handler.get_document_info(filename)
