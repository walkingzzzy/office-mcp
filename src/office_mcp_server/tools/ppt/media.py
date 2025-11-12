"""PowerPoint 媒体操作工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.ppt_handler import PowerPointHandler


def register_media_tools(mcp: FastMCP, ppt_handler: PowerPointHandler) -> None:
    """注册 PowerPoint 媒体操作工具."""

    @mcp.tool()
    def add_image_to_ppt(
        filename: str,
        slide_index: int,
        image_path: str,
        left_inches: float = 1.0,
        top_inches: float = 1.0,
        width_inches: Optional[float] = None,
    ) -> dict[str, Any]:
        """向 PowerPoint 幻灯片添加图片.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引 (从0开始)
            image_path: 图片文件路径
            left_inches: 左边距 (英寸, 默认 1.0)
            top_inches: 上边距 (英寸, 默认 1.0)
            width_inches: 图片宽度 (英寸, 可选)

        Returns:
            dict: 操作结果
        """
        logger.info(
            f"MCP工具调用: add_image_to_ppt(filename={filename}, slide={slide_index})"
        )
        return ppt_handler.add_image(
            filename, slide_index, image_path, left_inches, top_inches, width_inches
        )

    @mcp.tool()
    def add_ppt_speaker_notes(
        filename: str,
        slide_index: int,
        notes_text: str,
    ) -> dict[str, Any]:
        """向 PowerPoint 幻灯片添加演讲者备注.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引（从0开始）
            notes_text: 备注文本

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_ppt_speaker_notes(filename={filename})")
        return ppt_handler.add_speaker_notes(filename, slide_index, notes_text)

    @mcp.tool()
    def get_ppt_speaker_notes(
        filename: str,
        slide_index: int,
    ) -> dict[str, Any]:
        """获取 PowerPoint 幻灯片的演讲者备注.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引（从0开始）

        Returns:
            dict: 备注内容
        """
        logger.info(f"MCP工具调用: get_ppt_speaker_notes(filename={filename})")
        return ppt_handler.get_speaker_notes(filename, slide_index)

    @mcp.tool()
    def add_ppt_hyperlink(
        filename: str,
        slide_index: int,
        shape_index: int,
        url: str,
        text: Optional[str] = None,
    ) -> dict[str, Any]:
        """向 PowerPoint 添加超链接.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引（从0开始）
            shape_index: 形状索引（从0开始）
            url: 链接地址
            text: 链接文本 (可选,如果不提供则使用URL本身)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_ppt_hyperlink(filename={filename})")
        return ppt_handler.add_hyperlink(filename, slide_index, shape_index, url, text)
