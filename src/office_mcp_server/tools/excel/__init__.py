"""Excel 工具模块."""

from fastmcp import FastMCP

from office_mcp_server.handlers.excel_handler import ExcelHandler
from office_mcp_server.tools.excel.basic import register_basic_tools
from office_mcp_server.tools.excel.data import register_data_tools
from office_mcp_server.tools.excel.format import register_format_tools
from office_mcp_server.tools.excel.structure import register_structure_tools
from office_mcp_server.tools.excel.chart import register_chart_tools
from office_mcp_server.tools.excel.io import register_io_tools
from office_mcp_server.tools.excel.automation import register_automation_tools
from office_mcp_server.tools.excel.analysis import register_analysis_tools
from office_mcp_server.tools.excel.collaboration import register_collaboration_tools
from office_mcp_server.tools.excel.security import register_security_tools
from office_mcp_server.tools.excel.print import register_print_tools


def register_excel_tools(mcp: FastMCP) -> None:
    """注册所有 Excel 工具到 MCP 服务器.

    模块化架构：
    - basic: 基础操作 (7个工具)
    - data: 数据操作 (12个工具)
    - format: 格式化 (3个工具)
    - structure: 结构操作 (20个工具)
    - chart: 图表 (3个工具)
    - io: 导入导出 (9个工具)
    - automation: 自动化 (10个工具)
    - analysis: 数据分析 (10个工具)
    - collaboration: 协作 (4个工具)
    - security: 安全 (6个工具)
    - print: 打印 (5个工具)

    总计：91个工具
    """
    # 创建 Excel 处理器实例
    excel_handler = ExcelHandler()

    # 注册各模块的工具
    register_basic_tools(mcp, excel_handler)
    register_data_tools(mcp, excel_handler)
    register_format_tools(mcp, excel_handler)
    register_structure_tools(mcp, excel_handler)
    register_chart_tools(mcp, excel_handler)
    register_io_tools(mcp, excel_handler)
    register_automation_tools(mcp, excel_handler)
    register_analysis_tools(mcp, excel_handler)
    register_collaboration_tools(mcp, excel_handler)
    register_security_tools(mcp, excel_handler)
    register_print_tools(mcp, excel_handler)
