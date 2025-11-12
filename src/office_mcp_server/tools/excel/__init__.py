"""Excel 工具模块 - 临时测试版本."""

from fastmcp import FastMCP

from office_mcp_server.handlers.excel_handler import ExcelHandler
from office_mcp_server.tools.excel.basic import register_basic_tools
from office_mcp_server.tools.excel.data import register_data_tools
from office_mcp_server.tools.excel.format import register_format_tools


def register_excel_tools(mcp: FastMCP) -> None:
    """注册所有 Excel 工具到 MCP 服务器."""
    # 创建 Excel 处理器实例
    excel_handler = ExcelHandler()

    # 注册各模块的工具
    register_basic_tools(mcp, excel_handler)
    register_data_tools(mcp, excel_handler)
    register_format_tools(mcp, excel_handler)
