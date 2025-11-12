"""PowerPoint 基础操作工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.ppt_handler import PowerPointHandler


def register_basic_tools(mcp: FastMCP, ppt_handler: PowerPointHandler) -> None:
    """注册 PowerPoint 基础操作工具."""

    @mcp.tool()
    def create_powerpoint_presentation(
        filename: str, title: str = "", template_path: Optional[str] = None
    ) -> dict[str, Any]:
        """创建 PowerPoint 演示文稿.

        Args:
            filename: 文件名 (如 'presentation.pptx')
            title: 演示标题 (可选)
            template_path: 模板文件路径 (可选，如果提供则基于模板创建)

        Returns:
            dict: 操作结果,包含文件路径和状态
        """
        logger.info(f"MCP工具调用: create_powerpoint_presentation(filename={filename}, template={template_path})")
        return ppt_handler.create_presentation(filename, title, template_path)

    @mcp.tool()
    def add_slide_to_ppt(
        filename: str, layout_index: int = 1, title: str = ""
    ) -> dict[str, Any]:
        """向 PowerPoint 演示文稿添加幻灯片.

        Args:
            filename: 文件名
            layout_index: 布局索引 (0-标题页, 1-标题和内容, 默认 1)
            title: 幻灯片标题 (可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_slide_to_ppt(filename={filename})")
        return ppt_handler.add_slide(filename, layout_index, title)

    @mcp.tool()
    def get_ppt_presentation_info(filename: str) -> dict[str, Any]:
        """获取 PowerPoint 演示文稿信息.

        Args:
            filename: 文件名

        Returns:
            dict: 演示文稿信息 (幻灯片数量等)
        """
        logger.info(f"MCP工具调用: get_ppt_presentation_info(filename={filename})")
        return ppt_handler.get_presentation_info(filename)

    @mcp.tool()
    def delete_ppt_slide(filename: str, slide_index: int) -> dict[str, Any]:
        """删除 PowerPoint 幻灯片.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引 (从0开始)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: delete_ppt_slide(filename={filename}, slide={slide_index})")
        return ppt_handler.delete_slide(filename, slide_index)

    @mcp.tool()
    def move_ppt_slide(
        filename: str, from_index: int, to_index: int
    ) -> dict[str, Any]:
        """移动 PowerPoint 幻灯片位置.

        Args:
            filename: 文件名
            from_index: 源位置索引 (从0开始)
            to_index: 目标位置索引

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: move_ppt_slide(filename={filename}, from={from_index}, to={to_index})")
        return ppt_handler.move_slide(filename, from_index, to_index)

    @mcp.tool()
    def duplicate_ppt_slide(filename: str, slide_index: int) -> dict[str, Any]:
        """复制 PowerPoint 幻灯片.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引 (从0开始)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: duplicate_ppt_slide(filename={filename}, slide={slide_index})")
        return ppt_handler.duplicate_slide(filename, slide_index)
