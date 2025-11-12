"""Word 图片操作工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.word_handler import WordHandler


def register_image_tools(mcp: FastMCP, word_handler: WordHandler) -> None:
    """注册 Word 图片操作工具."""

    @mcp.tool()
    def insert_image_from_url_to_word(filename: str, image_url: str, width_inches: Optional[float] = None, height_inches: Optional[float] = None, alignment: str = "left") -> dict[str, Any]:
        """从 URL 插入图片到 Word 文档.

        Args:
            filename: 文件名
            image_url: 图片 URL
            width_inches: 宽度(英寸,可选)
            height_inches: 高度(英寸,可选)
            alignment: 对齐方式 ('left', 'center', 'right')

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: insert_image_from_url_to_word(filename={filename})")
        return word_handler.insert_image_from_url(filename, image_url, width_inches, height_inches, alignment)

    @mcp.tool()
    def insert_image_with_size_to_word(filename: str, image_path: str, width_inches: Optional[float] = None, height_inches: Optional[float] = None, alignment: str = "left", keep_aspect_ratio: bool = True) -> dict[str, Any]:
        """插入图片到 Word 文档并设置完整的大小和对齐方式.

        Args:
            filename: 文件名
            image_path: 图片路径
            width_inches: 宽度(英寸,可选)
            height_inches: 高度(英寸,可选)
            alignment: 对齐方式 ('left', 'center', 'right')
            keep_aspect_ratio: 是否保持宽高比 (默认 True)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: insert_image_with_size_to_word(filename={filename})")
        return word_handler.insert_image_with_size(filename, image_path, width_inches, height_inches, alignment, keep_aspect_ratio)

    @mcp.tool()
    def extract_word_images(
        filename: str,
        output_dir: Optional[str] = None,
    ) -> dict[str, Any]:
        """从 Word 文档提取所有图片.

        Args:
            filename: 文件名
            output_dir: 输出目录 (可选,默认为临时目录)

        Returns:
            dict: 提取的图片列表
        """
        logger.info(f"MCP工具调用: extract_word_images(filename={filename})")
        return word_handler.extract_images(filename, output_dir)
