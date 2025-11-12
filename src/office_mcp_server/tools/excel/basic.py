"""Excel 基础操作工具."""

from typing import Any, Optional, Union

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.excel_handler import ExcelHandler


def register_basic_tools(mcp: FastMCP, excel_handler: ExcelHandler) -> None:
    """注册 Excel 基础操作工具."""

    @mcp.tool()
    def create_excel_workbook(filename: str, sheet_name: Optional[str] = None) -> dict[str, Any]:
        """创建 Excel 工作簿."""
        logger.info(f"MCP工具调用: create_excel_workbook(filename={filename})")
        return excel_handler.create_workbook(filename, sheet_name)

    @mcp.tool()
    def write_excel_cell(
        filename: str, sheet_name: str, cell: str, value: Union[str, int, float]
    ) -> dict[str, Any]:
        """写入 Excel 单元格数据."""
        logger.info(f"MCP工具调用: write_excel_cell(filename={filename}, cell={cell})")
        return excel_handler.write_cell(filename, sheet_name, cell, value)

    @mcp.tool()
    def write_excel_range(
        filename: str, sheet_name: str, start_cell: str, data: list[list[Any]]
    ) -> dict[str, Any]:
        """批量写入 Excel 数据."""
        logger.info(f"MCP工具调用: write_excel_range(filename={filename})")
        return excel_handler.write_range(filename, sheet_name, start_cell, data)

    @mcp.tool()
    def read_excel_cell(filename: str, sheet_name: str, cell: str) -> dict[str, Any]:
        """读取 Excel 单元格数据."""
        logger.info(f"MCP工具调用: read_excel_cell(filename={filename}, cell={cell})")
        return excel_handler.read_cell(filename, sheet_name, cell)

    @mcp.tool()
    def format_excel_cell(
        filename: str,
        sheet_name: str,
        cell: str,
        font_name: Optional[str] = None,
        font_size: Optional[int] = None,
        bold: bool = False,
        color: Optional[str] = None,
        bg_color: Optional[str] = None,
        number_format: Optional[str] = None,
        horizontal_alignment: Optional[str] = None,
        vertical_alignment: Optional[str] = None,
        wrap_text: bool = False,
        border_style: Optional[str] = None,
        border_color: Optional[str] = None,
    ) -> dict[str, Any]:
        """格式化 Excel 单元格.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            cell: 单元格引用 (如 'A1')
            font_name: 字体名称 (可选)
            font_size: 字号 (可选)
            bold: 是否加粗 (默认 False)
            color: 文字颜色 HEX格式 (如 '#FF0000', 可选)
            bg_color: 背景颜色 HEX格式 (如 '#FFFF00', 可选)
            number_format: 数字格式 ('0.00'小数, '#,##0'千分位, '0%'百分比, 'yyyy-mm-dd'日期, '$#,##0.00'货币, '@'文本, 可选)
            horizontal_alignment: 水平对齐 ('left', 'center', 'right', 'justify', 可选)
            vertical_alignment: 垂直对齐 ('top', 'center', 'bottom', 可选)
            wrap_text: 是否自动换行 (默认 False)
            border_style: 边框样式 ('thin', 'medium', 'thick', 'double', 可选)
            border_color: 边框颜色 HEX格式 (可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: format_excel_cell(filename={filename}, cell={cell})")
        return excel_handler.format_cell(
            filename, sheet_name, cell, font_name, font_size, bold, color, bg_color,
            number_format, horizontal_alignment, vertical_alignment, wrap_text,
            border_style, border_color
        )

    @mcp.tool()
    def create_excel_chart(
        filename: str,
        sheet_name: str,
        chart_type: str,
        data_range: str,
        title: str = "",
        position: str = "E5",
        x_axis_title: Optional[str] = None,
        y_axis_title: Optional[str] = None,
        legend_position: Optional[str] = None,
        show_data_labels: bool = False,
    ) -> dict[str, Any]:
        """创建 Excel 图表.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            chart_type: 图表类型 ('bar'柱状图, 'line'折线图, 'pie'饼图, 'area'面积图,
                       'scatter'散点图, 'bubble'气泡图, 'radar'雷达图, 'doughnut'圆环图)
            data_range: 数据范围 (如 'A1:B10')
            title: 图表标题 (默认 '')
            position: 图表位置 (默认 'E5')
            x_axis_title: X轴标题 (可选)
            y_axis_title: Y轴标题 (可选)
            legend_position: 图例位置 ('r'右, 'l'左, 't'上, 'b'下, 可选)
            show_data_labels: 是否显示数据标签 (默认 False)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: create_excel_chart(filename={filename})")
        return excel_handler.create_chart(
            filename, sheet_name, chart_type, data_range, title, position,
            x_axis_title, y_axis_title, legend_position, show_data_labels
        )

    @mcp.tool()
    def get_excel_workbook_info(filename: str) -> dict[str, Any]:
        """获取 Excel 工作簿信息."""
        logger.info(f"MCP工具调用: get_excel_workbook_info(filename={filename})")
        return excel_handler.get_workbook_info(filename)
