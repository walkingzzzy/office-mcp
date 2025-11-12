"""Office MCP Server 主入口.

基于 FastMCP 的 Office 文档智能处理服务。
"""

import sys
from typing import Any

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.config import config
from office_mcp_server.tools.word_tools import register_word_tools
from office_mcp_server.tools.excel_tools import register_excel_tools
from office_mcp_server.tools.ppt_tools import register_ppt_tools

# 配置日志
logger.remove()
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level=config.server.log_level,
)

# 创建 MCP 服务器实例
mcp = FastMCP(config.server.server_name)

# 注册所有工具
register_word_tools(mcp)
register_excel_tools(mcp)
register_ppt_tools(mcp)


# ============================================
# 服务器信息工具
# ============================================


@mcp.tool()
def get_server_info() -> dict[str, Any]:
    """获取服务器信息.

    Returns:
        dict: 服务器配置信息
    """
    return {
        "name": config.server.server_name,
        "version": config.server.version,
        "log_level": config.server.log_level,
        "supported_formats": {
            "word": [".docx", ".doc"],
            "excel": [".xlsx", ".xls"],
            "powerpoint": [".pptx", ".ppt"],
        },
    }


def main() -> None:
    """主函数."""
    logger.info(f"启动 {config.server.server_name} v{config.server.version}")
    logger.info(f"日志级别: {config.server.log_level}")
    logger.info("Word 工具已注册")
    logger.info("Excel 工具已注册")
    logger.info("PowerPoint 工具已注册")
    logger.info("所有 Office MCP 工具注册完成")

    try:
        # 运行 MCP 服务器
        mcp.run()
    except KeyboardInterrupt:
        logger.info("服务器已停止")
    except Exception as e:
        logger.error(f"服务器运行错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
