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

    @mcp.tool()
    def get_word_page_count(filename: str) -> dict[str, Any]:
        """获取 Word 文档页数（估算值）.

        使用跨平台兼容的估算方法，基于文档内容（字数、段落数、表格数、图片数）估算页数。

        估算公式：
        - 基础页数 = 字数 / 每页平均字数（中文约550字/页）
        - 段落修正 = 段落数 * 0.02（每个段落约占0.02页）
        - 表格修正 = 表格数 * 0.3（每个表格约占0.3页）
        - 图片修正 = 图片数 * 0.2（每张图片约占0.2页）
        - 预估页数 = 基础页数 + 段落修正 + 表格修正 + 图片修正

        Args:
            filename: 文件名

        Returns:
            dict: 页数统计结果，包含：
                - estimated_pages: 估算的页数（整数）
                - is_estimated: true（标记为估算值）
                - confidence_level: 置信度（"low"/"medium"/"high"）
                - estimation_basis: 估算依据（字数、段落数、表格数、图片数）
                - details: 详细计算过程

        注意:
            这是估算值，实际页数可能因字体、字号、行距、段落间距、页边距等因素有所不同。
            误差范围通常在±2页以内。

        使用场景:
            - 验证文档优化效果（优化前后页数对比）
            - 评估文档长度
            - 预估打印成本
            - 检查文档是否符合页数要求

        提示:
            如果需要精确页数，建议在Windows系统上使用Word应用程序打开文档查看。
        """
        logger.info(f"MCP工具调用: get_word_page_count(filename={filename})")
        return word_handler.get_page_count(filename)
