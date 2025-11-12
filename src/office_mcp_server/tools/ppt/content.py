"""PowerPoint 内容操作工具."""

from typing import Any, Optional, List

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.ppt_handler import PowerPointHandler


def register_content_tools(mcp: FastMCP, ppt_handler: PowerPointHandler) -> None:
    """注册 PowerPoint 内容操作工具."""

    @mcp.tool()
    def add_text_to_ppt(
        filename: str,
        slide_index: int,
        text: str,
        left_inches: float = 1.0,
        top_inches: float = 1.0,
        width_inches: float = 8.0,
        height_inches: float = 1.0,
    ) -> dict[str, Any]:
        """向 PowerPoint 幻灯片添加文本框.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引 (从0开始)
            text: 文本内容
            left_inches: 左边距 (英寸, 默认 1.0)
            top_inches: 上边距 (英寸, 默认 1.0)
            width_inches: 宽度 (英寸, 默认 8.0)
            height_inches: 高度 (英寸, 默认 1.0)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_text_to_ppt(filename={filename}, slide={slide_index})")
        return ppt_handler.add_text(
            filename, slide_index, text, left_inches, top_inches, width_inches, height_inches
        )

    @mcp.tool()
    def add_table_to_ppt(
        filename: str,
        slide_index: int,
        rows: int,
        cols: int,
        data: Optional[list[list[str]]] = None,
    ) -> dict[str, Any]:
        """向 PowerPoint 幻灯片添加表格.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引 (从0开始)
            rows: 行数
            cols: 列数
            data: 表格数据 (可选, 二维列表)

        Returns:
            dict: 操作结果
        """
        logger.info(
            f"MCP工具调用: add_table_to_ppt(filename={filename}, slide={slide_index})"
        )
        return ppt_handler.add_table(filename, slide_index, rows, cols, data)

    @mcp.tool()
    def insert_ppt_table_row(
        filename: str,
        slide_index: int,
        table_index: int,
        row_index: int,
        data: Optional[List[str]] = None,
    ) -> dict[str, Any]:
        """向 PowerPoint 表格插入行.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引（从0开始）
            table_index: 表格索引（从0开始）
            row_index: 插入位置索引
            data: 行数据列表 (可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: insert_ppt_table_row(filename={filename})")
        return ppt_handler.insert_table_row(filename, slide_index, table_index, row_index, data)

    @mcp.tool()
    def merge_ppt_table_cells(
        filename: str,
        slide_index: int,
        table_index: int,
        start_row: int,
        start_col: int,
        end_row: int,
        end_col: int,
    ) -> dict[str, Any]:
        """合并 PowerPoint 表格单元格.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引（从0开始）
            table_index: 表格索引（从0开始）
            start_row: 起始行索引
            start_col: 起始列索引
            end_row: 结束行索引
            end_col: 结束列索引

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: merge_ppt_table_cells(filename={filename})")
        return ppt_handler.merge_table_cells(
            filename, slide_index, table_index, start_row, start_col, end_row, end_col
        )

    @mcp.tool()
    def format_ppt_table_cell(
        filename: str,
        slide_index: int,
        table_index: int,
        row: int,
        col: int,
        fill_color: Optional[str] = None,
        text_color: Optional[str] = None,
        bold: bool = False,
        font_size: Optional[int] = None,
    ) -> dict[str, Any]:
        """格式化 PowerPoint 表格单元格.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引（从0开始）
            table_index: 表格索引（从0开始）
            row: 行索引
            col: 列索引
            fill_color: 填充颜色 HEX格式 (如 '#FF0000', 可选)
            text_color: 文字颜色 HEX格式 (可选)
            bold: 是否加粗 (默认 False)
            font_size: 字号 (可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: format_ppt_table_cell(filename={filename})")
        return ppt_handler.format_table_cell(
            filename, slide_index, table_index, row, col, fill_color, text_color, bold, font_size
        )

    @mcp.tool()
    def add_ppt_shape(
        filename: str,
        slide_index: int,
        shape_type: str,
        left_inches: float,
        top_inches: float,
        width_inches: float,
        height_inches: float,
        text: Optional[str] = None,
        fill_color: Optional[str] = None,
        line_color: Optional[str] = None,
    ) -> dict[str, Any]:
        """向 PowerPoint 幻灯片添加形状.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引（从0开始）
            shape_type: 形状类型 ('rectangle'矩形, 'oval'椭圆, 'triangle'三角形, 'arrow'箭头, 'rounded_rectangle'圆角矩形)
            left_inches: 左边距（英寸）
            top_inches: 上边距（英寸）
            width_inches: 宽度（英寸）
            height_inches: 高度（英寸）
            text: 形状中的文本 (可选)
            fill_color: 填充颜色 HEX格式 (可选)
            line_color: 线条颜色 HEX格式 (可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_ppt_shape(filename={filename}, type={shape_type})")
        return ppt_handler.add_shape(
            filename, slide_index, shape_type, left_inches, top_inches,
            width_inches, height_inches, text, fill_color, line_color
        )

    @mcp.tool()
    def add_ppt_chart(
        filename: str,
        slide_index: int,
        chart_type: str,
        categories: List[str],
        series_data: dict[str, List[float]],
        left_inches: float = 1.0,
        top_inches: float = 1.5,
        width_inches: float = 8.0,
        height_inches: float = 5.0,
        title: Optional[str] = None,
    ) -> dict[str, Any]:
        """向 PowerPoint 幻灯片添加图表.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引（从0开始）
            chart_type: 图表类型 ('column'柱状图, 'bar'条形图, 'line'折线图, 'pie'饼图, 'area'面积图)
            categories: 分类标签列表
            series_data: 系列数据字典 {"系列名": [数据列表]}
            left_inches: 左边距（英寸, 默认 1.0）
            top_inches: 上边距（英寸, 默认 1.5）
            width_inches: 宽度（英寸, 默认 8.0）
            height_inches: 高度（英寸, 默认 5.0）
            title: 图表标题 (可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_ppt_chart(filename={filename}, type={chart_type})")
        return ppt_handler.add_chart(
            filename, slide_index, chart_type, categories, series_data,
            left_inches, top_inches, width_inches, height_inches, title
        )
