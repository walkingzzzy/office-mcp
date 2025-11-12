"""Word 文本编辑工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.word_handler import WordHandler


def register_edit_tools(mcp: FastMCP, word_handler: WordHandler) -> None:
    """注册 Word 文本编辑工具."""

    @mcp.tool()
    def find_text_in_word(
        filename: str,
        search_text: str,
        case_sensitive: bool = False,
        whole_word: bool = False,
    ) -> dict[str, Any]:
        """在 Word 文档中查找文本.

        Args:
            filename: 文件名
            search_text: 要查找的文本
            case_sensitive: 是否区分大小写 (默认 False)
            whole_word: 是否全字匹配 (默认 False)

        Returns:
            dict: 查找结果,包含所有匹配位置和上下文
        """
        logger.info(f"MCP工具调用: find_text_in_word(filename={filename})")
        return word_handler.find_text(filename, search_text, case_sensitive, whole_word)

    @mcp.tool()
    def replace_text_in_word(
        filename: str,
        search_text: str,
        replace_text: str,
        case_sensitive: bool = False,
        whole_word: bool = False,
        max_replacements: Optional[int] = None,
    ) -> dict[str, Any]:
        """在 Word 文档中替换文本.

        Args:
            filename: 文件名
            search_text: 要查找的文本
            replace_text: 替换为的文本
            case_sensitive: 是否区分大小写 (默认 False)
            whole_word: 是否全字匹配 (默认 False)
            max_replacements: 最大替换次数 (None表示全部替换)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: replace_text_in_word(filename={filename})")
        return word_handler.replace_text(filename, search_text, replace_text, case_sensitive, whole_word, max_replacements)

    @mcp.tool()
    def delete_text_in_word(
        filename: str,
        search_text: str,
        case_sensitive: bool = False,
        whole_word: bool = False,
    ) -> dict[str, Any]:
        """在 Word 文档中删除指定文本.

        Args:
            filename: 文件名
            search_text: 要删除的文本
            case_sensitive: 是否区分大小写 (默认 False)
            whole_word: 是否全字匹配 (默认 False)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: delete_text_in_word(filename={filename})")
        return word_handler.delete_text(filename, search_text, case_sensitive, whole_word)

    @mcp.tool()
    def find_text_regex_in_word(filename: str, regex_pattern: str, case_sensitive: bool = False) -> dict[str, Any]:
        """使用正则表达式在 Word 文档中查找文本.

        Args:
            filename: 文件名
            regex_pattern: 正则表达式模式
            case_sensitive: 是否区分大小写 (默认 False)

        Returns:
            dict: 查找结果
        """
        logger.info(f"MCP工具调用: find_text_regex_in_word(filename={filename})")
        return word_handler.find_text_regex(filename, regex_pattern, case_sensitive)

    @mcp.tool()
    def replace_text_regex_in_word(filename: str, regex_pattern: str, replacement: str, case_sensitive: bool = False, max_replacements: Optional[int] = None) -> dict[str, Any]:
        """使用正则表达式在 Word 文档中替换文本.

        Args:
            filename: 文件名
            regex_pattern: 正则表达式模式
            replacement: 替换文本
            case_sensitive: 是否区分大小写 (默认 False)
            max_replacements: 最大替换次数 (None表示全部)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: replace_text_regex_in_word(filename={filename})")
        return word_handler.replace_text_regex(filename, regex_pattern, replacement, case_sensitive, max_replacements)
