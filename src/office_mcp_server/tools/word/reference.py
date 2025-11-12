"""Word 引用工具（书签、超链接、批注）."""

from typing import Any

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.word_handler import WordHandler


def register_reference_tools(mcp: FastMCP, word_handler: WordHandler) -> None:
    """注册 Word 引用工具."""

    @mcp.tool()
    def add_word_bookmark(
        filename: str,
        paragraph_index: int,
        bookmark_name: str,
    ) -> dict[str, Any]:
        """向 Word 文档添加书签.

        Args:
            filename: 文件名
            paragraph_index: 段落索引 (从0开始)
            bookmark_name: 书签名称

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_word_bookmark(filename={filename})")
        return word_handler.add_bookmark(filename, paragraph_index, bookmark_name)

    @mcp.tool()
    def list_word_bookmarks(
        filename: str,
    ) -> dict[str, Any]:
        """列出 Word 文档中的所有书签.

        Args:
            filename: 文件名

        Returns:
            dict: 书签列表
        """
        logger.info(f"MCP工具调用: list_word_bookmarks(filename={filename})")
        return word_handler.list_bookmarks(filename)

    @mcp.tool()
    def delete_word_bookmark(filename: str, bookmark_name: str) -> dict[str, Any]:
        """删除 Word 文档中的书签.

        Args:
            filename: 文件名
            bookmark_name: 书签名称

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: delete_word_bookmark(filename={filename})")
        return word_handler.delete_bookmark(filename, bookmark_name)

    @mcp.tool()
    def add_word_hyperlink(
        filename: str,
        paragraph_index: int,
        text: str,
        url: str,
        link_type: str = "url",
    ) -> dict[str, Any]:
        """向 Word 文档添加超链接.

        Args:
            filename: 文件名
            paragraph_index: 段落索引 (从0开始)
            text: 链接文本
            url: 链接地址
            link_type: 链接类型 ('url'网址, 'email'邮箱, 'bookmark'书签)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_word_hyperlink(filename={filename})")
        return word_handler.add_hyperlink(filename, paragraph_index, text, url, link_type)

    @mcp.tool()
    def extract_word_hyperlinks(
        filename: str,
    ) -> dict[str, Any]:
        """提取 Word 文档中的所有超链接.

        Args:
            filename: 文件名

        Returns:
            dict: 超链接列表
        """
        logger.info(f"MCP工具调用: extract_word_hyperlinks(filename={filename})")
        return word_handler.extract_hyperlinks(filename)

    @mcp.tool()
    def batch_update_word_hyperlinks(filename: str, old_domain: str, new_domain: str) -> dict[str, Any]:
        """批量更新 Word 文档中的超链接域名.

        Args:
            filename: 文件名
            old_domain: 旧域名
            new_domain: 新域名

        Returns:
            dict: 操作结果,包含更新数量
        """
        logger.info(f"MCP工具调用: batch_update_word_hyperlinks(filename={filename})")
        return word_handler.batch_update_hyperlinks(filename, old_domain, new_domain)
