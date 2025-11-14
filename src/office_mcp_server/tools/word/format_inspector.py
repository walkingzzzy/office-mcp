"""Word文档格式检查工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from office_mcp_server.handlers.word_handler import WordHandler


def register_format_inspector_tools(mcp: FastMCP, word_handler: WordHandler) -> None:
    """注册格式检查工具.

    Args:
        mcp: FastMCP实例
        word_handler: Word处理器实例
    """

    @mcp.tool()
    def get_word_paragraph_format(
        filename: str,
        paragraph_index: int,
    ) -> dict[str, Any]:
        """获取Word文档指定段落的详细格式信息.

        Args:
            filename: 文件名
            paragraph_index: 段落索引（从0开始）

        Returns:
            dict: 段落格式信息，包含文本、样式、字体、段落格式等
        """
        return word_handler.get_paragraph_format(filename, paragraph_index)

    @mcp.tool()
    def check_word_document_formatting(
        filename: str,
        check_items: Optional[list[str]] = None,
    ) -> dict[str, Any]:
        """批量检查Word文档所有段落的格式一致性.

        Args:
            filename: 文件名
            check_items: 要检查的项目列表（可选），如["font", "alignment", "spacing"]
                        默认检查所有项目

        Returns:
            dict: 格式检查结果，包含使用的字体、字号、对齐方式等统计信息
        """
        return word_handler.check_document_formatting(filename, check_items)

    @mcp.tool()
    def get_word_table_format(
        filename: str,
        table_index: int,
    ) -> dict[str, Any]:
        """获取Word文档表格的格式信息.

        Args:
            filename: 文件名
            table_index: 表格索引（从0开始）

        Returns:
            dict: 表格格式信息，包含行数、列数、样式、单元格格式等
        """
        return word_handler.get_table_format(filename, table_index)

