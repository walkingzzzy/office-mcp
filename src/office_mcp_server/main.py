"""Office MCP Server 主入口.

基于 FastMCP 的 Office 文档智能处理服务。
"""

import sys
from typing import Any
from datetime import datetime

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.config import config
from office_mcp_server.tools.word import register_word_tools  # 使用模块化版本
from office_mcp_server.tools.excel import register_excel_tools  # 使用模块化版本
from office_mcp_server.tools.ppt import register_ppt_tools  # 使用模块化版本

# 配置日志
logger.remove()

# 控制台日志（彩色输出）
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level=config.server.log_level,
    colorize=True,
)

# 文件日志（如果启用）
if config.server.log_to_file:
    # 主日志文件
    log_file = config.paths.logs_dir / "office_mcp_server.log"
    logger.add(
        str(log_file),
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level=config.server.log_level,
        rotation=config.server.log_rotation,  # 日志轮转
        retention=config.server.log_retention,  # 保留时间
        compression=config.server.log_compression,  # 压缩格式
        encoding="utf-8",
        enqueue=True,  # 异步写入
    )

    # 错误日志文件（单独记录错误）
    error_log_file = config.paths.logs_dir / "error.log"
    logger.add(
        str(error_log_file),
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}\n{exception}",
        level="ERROR",
        rotation=config.server.log_rotation,
        retention=config.server.log_retention,
        compression=config.server.log_compression,
        encoding="utf-8",
        enqueue=True,
        backtrace=True,  # 显示完整堆栈
        diagnose=True,   # 显示变量值
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
    logger.info("=" * 80)
    logger.info(f"启动 {config.server.server_name} v{config.server.version}")
    logger.info(f"启动时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"日志级别: {config.server.log_level}")

    if config.server.log_to_file:
        logger.info(f"日志文件: {config.paths.logs_dir / 'office_mcp_server.log'}")
        logger.info(f"错误日志: {config.paths.logs_dir / 'error.log'}")
        logger.info(f"日志轮转: {config.server.log_rotation}")
        logger.info(f"日志保留: {config.server.log_retention}")

    logger.info("Word 工具已注册")
    logger.info("Excel 工具已注册")
    logger.info("PowerPoint 工具已注册")
    logger.info("所有 Office MCP 工具注册完成")
    logger.info("=" * 80)

    try:
        # 运行 MCP 服务器
        mcp.run()
    except KeyboardInterrupt:
        logger.info("服务器已停止")
    except Exception as e:
        logger.error(f"服务器运行错误: {e}")
        logger.exception("详细错误信息:")
        sys.exit(1)


if __name__ == "__main__":
    main()
