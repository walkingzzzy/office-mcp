"""PowerPoint 内容提取工具."""

from typing import Any

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.ppt_handler import PowerPointHandler


def register_extract_tools(mcp: FastMCP, ppt_handler: PowerPointHandler) -> None:
    """注册 PowerPoint 内容提取工具."""

    @mcp.tool()
    def extract_ppt_text(filename: str) -> dict[str, Any]:
        """提取 PowerPoint 演示文稿中的所有文本内容.

        Args:
            filename: 文件名

        Returns:
            dict: 包含所有文本内容的结果，包括每张幻灯片的文本和汇总的所有文本
        """
        logger.info(f"MCP工具调用: extract_ppt_text(filename={filename})")
        return ppt_handler.extract_all_text(filename)

    @mcp.tool()
    def extract_ppt_titles(filename: str) -> dict[str, Any]:
        """提取 PowerPoint 演示文稿中所有幻灯片的标题.

        Args:
            filename: 文件名

        Returns:
            dict: 包含所有幻灯片标题的结果
        """
        logger.info(f"MCP工具调用: extract_ppt_titles(filename={filename})")
        return ppt_handler.extract_titles(filename)

    @mcp.tool()
    def extract_ppt_notes(filename: str) -> dict[str, Any]:
        """提取 PowerPoint 演示文稿中所有演讲者备注.

        Args:
            filename: 文件名

        Returns:
            dict: 包含所有演讲者备注的结果
        """
        logger.info(f"MCP工具调用: extract_ppt_notes(filename={filename})")
        return ppt_handler.extract_notes(filename)

    @mcp.tool()
    def extract_ppt_images(filename: str) -> dict[str, Any]:
        """提取 PowerPoint 演示文稿中所有图片的信息.

        Args:
            filename: 文件名

        Returns:
            dict: 包含所有图片信息的结果（位置、大小、类型等）
        """
        logger.info(f"MCP工具调用: extract_ppt_images(filename={filename})")
        return ppt_handler.extract_images(filename)

    @mcp.tool()
    def extract_ppt_hyperlinks(filename: str) -> dict[str, Any]:
        """提取 PowerPoint 演示文稿中所有超链接.

        Args:
            filename: 文件名

        Returns:
            dict: 包含所有超链接的结果（链接文本、URL、位置等）
        """
        logger.info(f"MCP工具调用: extract_ppt_hyperlinks(filename={filename})")
        return ppt_handler.extract_hyperlinks(filename)

    @mcp.tool()
    def extract_ppt_all_content(filename: str) -> dict[str, Any]:
        """提取 PowerPoint 演示文稿的所有内容（文本、标题、备注、图片、超链接）.

        Args:
            filename: 文件名

        Returns:
            dict: 包含所有内容的综合结果
        """
        logger.info(f"MCP工具调用: extract_ppt_all_content(filename={filename})")
        return ppt_handler.extract_all_content(filename)
