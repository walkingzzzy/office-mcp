"""Word 批量操作工具."""

from typing import Any, List, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.word_handler import WordHandler


def register_batch_tools(mcp: FastMCP, word_handler: WordHandler) -> None:
    """注册 Word 批量操作工具."""

    @mcp.tool()
    def batch_replace_word_text(
        filenames: List[str],
        search_text: str,
        replace_text: str,
    ) -> dict[str, Any]:
        """批量替换多个 Word 文档中的文本.

        Args:
            filenames: 文件名列表
            search_text: 要查找的文本
            replace_text: 替换为的文本

        Returns:
            dict: 批量操作结果
        """
        logger.info(f"MCP工具调用: batch_replace_word_text(files={len(filenames)})")
        return word_handler.batch_replace_text(filenames, search_text, replace_text)

    @mcp.tool()
    def batch_apply_word_style(
        filenames: List[str],
        style_name: str,
        apply_to: str = "body",
    ) -> dict[str, Any]:
        """批量应用样式到多个 Word 文档.

        Args:
            filenames: 文件名列表
            style_name: 样式名称
            apply_to: 应用范围 ('body'正文 或 'headings'标题)

        Returns:
            dict: 批量操作结果
        """
        logger.info(f"MCP工具调用: batch_apply_word_style(files={len(filenames)})")
        return word_handler.batch_apply_style(filenames, style_name, apply_to)

    @mcp.tool()
    def merge_word_documents(
        source_filenames: List[str],
        output_filename: str,
        add_page_breaks: bool = True,
    ) -> dict[str, Any]:
        """合并多个 Word 文档.

        Args:
            source_filenames: 源文件名列表
            output_filename: 输出文件名
            add_page_breaks: 是否在文档间添加分页符 (默认 True)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: merge_word_documents(sources={len(source_filenames)})")
        return word_handler.merge_documents(source_filenames, output_filename, add_page_breaks)

    @mcp.tool()
    def batch_add_word_header_footer(filenames: List[str], header_text: Optional[str] = None, footer_text: Optional[str] = None, add_page_number: bool = False) -> dict[str, Any]:
        """批量添加页眉页脚到多个 Word 文档.

        Args:
            filenames: 文件名列表
            header_text: 页眉文本 (可选)
            footer_text: 页脚文本 (可选)
            add_page_number: 是否添加页码 (默认 False)

        Returns:
            dict: 批量操作结果
        """
        logger.info(f"MCP工具调用: batch_add_word_header_footer(files={len(filenames)})")
        return word_handler.batch_add_header_footer(filenames, header_text, footer_text, add_page_number)

    @mcp.tool()
    def batch_insert_word_content(filenames: List[str], content: str, position: str = "end", paragraph_index: Optional[int] = None) -> dict[str, Any]:
        """批量插入内容到多个 Word 文档.

        Args:
            filenames: 文件名列表
            content: 要插入的内容
            position: 插入位置 ('start', 'end', 'index')
            paragraph_index: 段落索引 (当 position='index' 时使用)

        Returns:
            dict: 批量操作结果
        """
        logger.info(f"MCP工具调用: batch_insert_word_content(files={len(filenames)})")
        return word_handler.batch_insert_content(filenames, content, position, paragraph_index)
