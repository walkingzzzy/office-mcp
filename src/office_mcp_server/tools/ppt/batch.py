"""PowerPoint 批量操作工具."""

from typing import Any, Optional, List

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.ppt_handler import PowerPointHandler


def register_batch_tools(mcp: FastMCP, ppt_handler: PowerPointHandler) -> None:
    """注册 PowerPoint 批量操作工具."""

    @mcp.tool()
    def batch_set_ppt_transition(
        filename: str,
        slide_indices: Optional[List[int]],
        transition_type: str,
        duration: float = 1.0,
    ) -> dict[str, Any]:
        """批量设置 PowerPoint 幻灯片过渡效果.

        Args:
            filename: 文件名
            slide_indices: 幻灯片索引列表 (None 表示所有幻灯片)
            transition_type: 过渡类型 ('fade'淡出, 'push'推进, 'wipe'擦除, 'split'分割, 'reveal'揭开, 'random'随机, 'none'无)
            duration: 过渡时长（秒, 默认 1.0）

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: batch_set_ppt_transition(filename={filename})")
        return ppt_handler.batch_set_transition(filename, slide_indices, transition_type, duration)

    @mcp.tool()
    def batch_add_ppt_footer(
        filename: str,
        footer_text: str,
        slide_indices: Optional[List[int]] = None,
    ) -> dict[str, Any]:
        """批量向 PowerPoint 幻灯片添加页脚.

        Args:
            filename: 文件名
            footer_text: 页脚文本
            slide_indices: 幻灯片索引列表 (None 表示所有幻灯片)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: batch_add_ppt_footer(filename={filename})")
        return ppt_handler.batch_add_footer(filename, footer_text, slide_indices)
