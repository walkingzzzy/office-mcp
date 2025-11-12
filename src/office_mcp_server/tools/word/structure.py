"""Word 文档结构操作工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.word_handler import WordHandler


def register_structure_tools(mcp: FastMCP, word_handler: WordHandler) -> None:
    """注册 Word 文档结构操作工具."""

    @mcp.tool()
    def generate_word_table_of_contents(
        filename: str,
        title: str = "目录",
        max_level: int = 3,
        hyperlink: bool = True,
    ) -> dict[str, Any]:
        """生成 Word 文档目录.

        Args:
            filename: 文件名
            title: 目录标题 (默认 '目录')
            max_level: 最大标题级别 (1-9, 默认 3)
            hyperlink: 是否包含超链接样式 (默认 True)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: generate_word_table_of_contents(filename={filename})")
        return word_handler.generate_table_of_contents(filename, title, max_level, hyperlink)

    @mcp.tool()
    def add_word_comment(
        filename: str,
        paragraph_index: int,
        comment_text: str,
        author: str = "User",
        date: Optional[str] = None,
    ) -> dict[str, Any]:
        """添加 Word 文档批注.

        Args:
            filename: 文件名
            paragraph_index: 段落索引（从0开始）
            comment_text: 批注内容
            author: 作者名称（默认 'User'）
            date: 日期（可选，格式 'YYYY-MM-DD'）

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_word_comment(filename={filename})")
        return word_handler.add_comment(filename, paragraph_index, comment_text, author, date)

    @mcp.tool()
    def split_word_document(
        filename: str,
        split_by: str = "page",
        output_dir: Optional[str] = None,
    ) -> dict[str, Any]:
        """拆分 Word 文档.

        Args:
            filename: 文件名
            split_by: 拆分方式 ('page'按页, 'section'按节, 'heading'按标题, 默认 'page')
            output_dir: 输出目录 (可选,默认为源文件目录)

        Returns:
            dict: 拆分后的文件列表
        """
        logger.info(f"MCP工具调用: split_word_document(filename={filename})")
        return word_handler.split_document(filename, split_by, output_dir)

    @mcp.tool()
    def insert_datetime_field_to_word(filename: str, paragraph_index: int, format_string: str = "yyyy-MM-dd", field_type: str = "date") -> dict[str, Any]:
        """向 Word 文档插入日期时间域.

        Args:
            filename: 文件名
            paragraph_index: 段落索引
            format_string: 格式字符串 (默认 'yyyy-MM-dd')
            field_type: 域类型 ('date'日期, 'time'时间, 'datetime'日期时间)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: insert_datetime_field_to_word(filename={filename})")
        return word_handler.insert_datetime_field(filename, paragraph_index, format_string, field_type)
