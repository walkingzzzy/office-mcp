"""Word 内容提取工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.word_handler import WordHandler


def register_extract_tools(mcp: FastMCP, word_handler: WordHandler) -> None:
    """注册 Word 内容提取工具."""

    @mcp.tool()
    def extract_word_text(
        filename: str,
        include_tables: bool = False,
    ) -> dict[str, Any]:
        """提取 Word 文档中的所有文本.

        Args:
            filename: 文件名
            include_tables: 是否包含表格文本 (默认 False)

        Returns:
            dict: 文本内容
        """
        logger.info(f"MCP工具调用: extract_word_text(filename={filename})")
        return word_handler.extract_text(filename, include_tables)

    @mcp.tool()
    def extract_word_headings(
        filename: str,
        max_level: int = 9,
    ) -> dict[str, Any]:
        """提取 Word 文档中的所有标题.

        Args:
            filename: 文件名
            max_level: 最大标题级别 (1-9)

        Returns:
            dict: 标题列表
        """
        logger.info(f"MCP工具调用: extract_word_headings(filename={filename})")
        return word_handler.extract_headings(filename, max_level)

    @mcp.tool()
    def extract_word_tables(
        filename: str,
    ) -> dict[str, Any]:
        """提取 Word 文档中的所有表格数据.

        Args:
            filename: 文件名

        Returns:
            dict: 表格数据列表
        """
        logger.info(f"MCP工具调用: extract_word_tables(filename={filename})")
        return word_handler.extract_tables(filename)

    @mcp.tool()
    def get_word_statistics(
        filename: str,
    ) -> dict[str, Any]:
        """获取 Word 文档统计信息.

        Args:
            filename: 文件名

        Returns:
            dict: 统计信息(字数、段落数、表格数等)
        """
        logger.info(f"MCP工具调用: get_word_statistics(filename={filename})")
        return word_handler.get_statistics(filename)
