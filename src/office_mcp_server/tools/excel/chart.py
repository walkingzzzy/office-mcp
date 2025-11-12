"""Excel 图表工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.excel_handler import ExcelHandler


def register_chart_tools(mcp: FastMCP, excel_handler: ExcelHandler) -> None:
    """注册 Excel 图表工具."""

    @mcp.tool()
    def format_excel_chart(
        filename: str,
        sheet_name: str,
        chart_index: int = 0,
        title_font_size: Optional[int] = None,
        title_font_bold: bool = False,
        chart_style: Optional[int] = None,
        color_scheme: Optional[list[str]] = None,
    ) -> dict[str, Any]:
        """格式化 Excel 图表."""
        logger.info(f"MCP工具调用: format_excel_chart(filename={filename}, chart_index={chart_index})")
        return excel_handler.format_chart(
            filename, sheet_name, chart_index, title_font_size, title_font_bold, chart_style, color_scheme
        )

    @mcp.tool()
    def create_excel_combination_chart(
        filename: str,
        sheet_name: str,
        data_range1: str,
        data_range2: str,
        chart_type1: str = "bar",
        chart_type2: str = "line",
        title: str = "",
        position: str = "E5",
    ) -> dict[str, Any]:
        """创建 Excel 组合图表."""
        logger.info(f"MCP工具调用: create_excel_combination_chart(filename={filename})")
        return excel_handler.create_combination_chart(
            filename, sheet_name, data_range1, data_range2, chart_type1, chart_type2, title, position
        )

    @mcp.tool()
    def add_excel_chart_trendline(
        filename: str,
        sheet_name: str,
        chart_index: int = 0,
        series_index: int = 0,
        trendline_type: str = "linear",
        display_equation: bool = False,
        display_r_squared: bool = False,
    ) -> dict[str, Any]:
        """为 Excel 图表添加趋势线.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            chart_index: 图表索引 (默认 0)
            series_index: 系列索引 (默认 0)
            trendline_type: 趋势线类型 ('linear'线性, 'exp'指数, 'log'对数,
                           'poly'多项式, 'power'幂, 'movingAvg'移动平均, 默认 'linear')
            display_equation: 是否显示趋势线方程 (默认 False)
            display_r_squared: 是否显示R²值 (默认 False)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_excel_chart_trendline(filename={filename}, type={trendline_type})")
        return excel_handler.add_trendline_to_chart(
            filename, sheet_name, chart_index, series_index,
            trendline_type, display_equation, display_r_squared
        )
