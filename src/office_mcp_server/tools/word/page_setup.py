"""Word 页面设置工具."""

from typing import Any

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.word_handler import WordHandler


def register_page_setup_tools(mcp: FastMCP, word_handler: WordHandler) -> None:
    """注册 Word 页面设置工具."""

    @mcp.tool()
    def set_word_page_setup(
        filename: str,
        orientation: str = "portrait",
        paper_size: str = "A4",
        left_margin: float = 1.0,
        right_margin: float = 1.0,
        top_margin: float = 1.0,
        bottom_margin: float = 1.0,
    ) -> dict[str, Any]:
        """设置 Word 页面属性.

        Args:
            filename: 文件名
            orientation: 页面方向 ('portrait'纵向, 'landscape'横向, 默认 'portrait')
            paper_size: 纸张大小 ('A4', 'A3', 'Letter', 'Legal', 默认 'A4')
            left_margin: 左边距英寸 (默认 1.0)
            right_margin: 右边距英寸 (默认 1.0)
            top_margin: 上边距英寸 (默认 1.0)
            bottom_margin: 下边距英寸 (默认 1.0)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: set_word_page_setup(filename={filename})")
        return word_handler.set_page_setup(
            filename, orientation, paper_size, left_margin, right_margin, top_margin, bottom_margin
        )

    @mcp.tool()
    def set_word_page_margins(
        filename: str,
        left: float = 1.0,
        right: float = 1.0,
        top: float = 1.0,
        bottom: float = 1.0,
        gutter: float = 0.0,
        header: float = 0.5,
        footer: float = 0.5,
    ) -> dict[str, Any]:
        """设置 Word 页边距.

        Args:
            filename: 文件名
            left: 左边距英寸 (默认 1.0)
            right: 右边距英寸 (默认 1.0)
            top: 上边距英寸 (默认 1.0)
            bottom: 下边距英寸 (默认 1.0)
            gutter: 装订线边距英寸 (默认 0.0)
            header: 页眉边距英寸 (默认 0.5)
            footer: 页脚边距英寸 (默认 0.5)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: set_word_page_margins(filename={filename})")
        return word_handler.set_page_margins(
            filename, left, right, top, bottom, gutter, header, footer
        )

