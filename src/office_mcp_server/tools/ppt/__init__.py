"""PowerPoint 工具模块."""

from fastmcp import FastMCP

from office_mcp_server.handlers.ppt_handler import PowerPointHandler
from office_mcp_server.tools.ppt.basic import register_basic_tools
from office_mcp_server.tools.ppt.content import register_content_tools
from office_mcp_server.tools.ppt.format import register_format_tools
from office_mcp_server.tools.ppt.media import register_media_tools
from office_mcp_server.tools.ppt.animation import register_animation_tools
from office_mcp_server.tools.ppt.extract import register_extract_tools
from office_mcp_server.tools.ppt.batch import register_batch_tools


def register_ppt_tools(mcp: FastMCP) -> None:
    """注册所有 PowerPoint 工具到 MCP 服务器.

    模块化架构：
    - basic: 基础操作 (6个工具)
    - content: 内容操作 (7个工具)
    - format: 格式化 (6个工具)
    - media: 媒体操作 (4个工具)
    - animation: 动画和过渡 (3个工具)
    - extract: 内容提取 (6个工具)
    - batch: 批量操作 (2个工具)

    总计：34个工具
    """
    ppt_handler = PowerPointHandler()

    register_basic_tools(mcp, ppt_handler)
    register_content_tools(mcp, ppt_handler)
    register_format_tools(mcp, ppt_handler)
    register_media_tools(mcp, ppt_handler)
    register_animation_tools(mcp, ppt_handler)
    register_extract_tools(mcp, ppt_handler)
    register_batch_tools(mcp, ppt_handler)
