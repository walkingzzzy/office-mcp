"""Excel 数据分析工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.excel_handler import ExcelHandler


def register_analysis_tools(mcp: FastMCP, excel_handler: ExcelHandler) -> None:
    """注册 Excel 数据分析工具."""

    @mcp.tool()
    def excel_descriptive_statistics(
        filename: str,
        sheet_name: str,
        data_range: str,
        output_cell: Optional[str] = None,
    ) -> dict[str, Any]:
        """Excel 描述性统计分析."""
        logger.info(f"MCP工具调用: excel_descriptive_statistics(filename={filename})")
        return excel_handler.descriptive_statistics(filename, sheet_name, data_range, output_cell)

    @mcp.tool()
    def excel_correlation_analysis(
        filename: str,
        sheet_name: str,
        data_range1: str,
        data_range2: str,
    ) -> dict[str, Any]:
        """Excel 相关性分析 - 计算两组数据的相关系数.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            data_range1: 第一组数据范围 (如 'A1:A10')
            data_range2: 第二组数据范围 (如 'B1:B10')
        """
        logger.info(f"MCP工具调用: excel_correlation_analysis(filename={filename})")
        return excel_handler.correlation_analysis(filename, sheet_name, data_range1, data_range2)

    @mcp.tool()
    def excel_goal_seek(
        filename: str,
        sheet_name: str,
        formula_cell: str,
        target_value: float,
        variable_cell: str,
    ) -> dict[str, Any]:
        """Excel 单变量求解."""
        logger.info(f"MCP工具调用: excel_goal_seek(filename={filename})")
        return excel_handler.goal_seek(filename, sheet_name, formula_cell, target_value, variable_cell)

    @mcp.tool()
    def excel_regression_analysis(
        filename: str,
        sheet_name: str,
        y_range: str,
        x_range: str,
        output_cell: Optional[str] = None,
        confidence_level: float = 0.95,
    ) -> dict[str, Any]:
        """Excel 回归分析."""
        logger.info(f"MCP工具调用: excel_regression_analysis(filename={filename})")
        return excel_handler.regression_analysis(
            filename, sheet_name, y_range, x_range, output_cell, confidence_level
        )

    @mcp.tool()
    def excel_anova(
        filename: str,
        sheet_name: str,
        data_ranges: list[str],
        output_cell: Optional[str] = None,
        alpha: float = 0.05,
    ) -> dict[str, Any]:
        """Excel 方差分析 (ANOVA)."""
        logger.info(f"MCP工具调用: excel_anova(filename={filename})")
        return excel_handler.anova(filename, sheet_name, data_ranges, output_cell, alpha)

    @mcp.tool()
    def excel_t_test(
        filename: str,
        sheet_name: str,
        range1: str,
        range2: str,
        test_type: str = "two-sample",
        output_cell: Optional[str] = None,
        alpha: float = 0.05,
    ) -> dict[str, Any]:
        """Excel t检验."""
        logger.info(f"MCP工具调用: excel_t_test(filename={filename}, type={test_type})")
        return excel_handler.t_test(filename, sheet_name, range1, range2, test_type, output_cell, alpha)

    @mcp.tool()
    def excel_chi_square_test(
        filename: str,
        sheet_name: str,
        observed_range: str,
        expected_range: Optional[str] = None,
        output_cell: Optional[str] = None,
    ) -> dict[str, Any]:
        """Excel 卡方检验."""
        logger.info(f"MCP工具调用: excel_chi_square_test(filename={filename})")
        return excel_handler.chi_square_test(filename, sheet_name, observed_range, expected_range, output_cell)

    @mcp.tool()
    def excel_trend_analysis(
        filename: str,
        sheet_name: str,
        data_range: str,
        forecast_periods: int = 5,
        output_cell: Optional[str] = None,
    ) -> dict[str, Any]:
        """Excel 趋势分析."""
        logger.info(f"MCP工具调用: excel_trend_analysis(filename={filename}, forecast={forecast_periods})")
        return excel_handler.trend_analysis(filename, sheet_name, data_range, forecast_periods, output_cell)

    @mcp.tool()
    def excel_moving_average(
        filename: str,
        sheet_name: str,
        data_range: str,
        window_size: int = 3,
        output_cell: Optional[str] = None,
    ) -> dict[str, Any]:
        """Excel 移动平均."""
        logger.info(f"MCP工具调用: excel_moving_average(filename={filename}, window={window_size})")
        return excel_handler.moving_average(filename, sheet_name, data_range, window_size, output_cell)

    @mcp.tool()
    def excel_exponential_smoothing(
        filename: str,
        sheet_name: str,
        data_range: str,
        alpha: float = 0.3,
        output_cell: Optional[str] = None,
    ) -> dict[str, Any]:
        """Excel 指数平滑."""
        logger.info(f"MCP工具调用: excel_exponential_smoothing(filename={filename}, alpha={alpha})")
        return excel_handler.exponential_smoothing(filename, sheet_name, data_range, alpha, output_cell)
