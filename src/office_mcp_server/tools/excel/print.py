"""Excel 打印工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.excel_handler import ExcelHandler


def register_print_tools(mcp: FastMCP, excel_handler: ExcelHandler) -> None:
    """注册 Excel 打印工具."""

    @mcp.tool()
    def set_excel_page_setup(
        filename: str,
        sheet_name: str,
        orientation: str = "portrait",
        paper_size: int = 9,
        scale: int = 100,
        fit_to_width: Optional[int] = None,
        fit_to_height: Optional[int] = None,
    ) -> dict[str, Any]:
        """设置 Excel 页面属性.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            orientation: 页面方向 ('portrait'纵向, 'landscape'横向, 默认 'portrait')
            paper_size: 纸张大小 (1=Letter, 5=Legal, 8=A3, 9=A4, 默认 9)
            scale: 缩放比例 (默认 100)
            fit_to_width: 调整为指定页宽 (可选)
            fit_to_height: 调整为指定页高 (可选)
        """
        logger.info(f"MCP工具调用: set_excel_page_setup(filename={filename})")
        return excel_handler.set_page_setup(
            filename, sheet_name, orientation, paper_size, scale, fit_to_width, fit_to_height
        )

    @mcp.tool()
    def set_excel_page_margins(
        filename: str,
        sheet_name: str,
        left: float = 0.75,
        right: float = 0.75,
        top: float = 1.0,
        bottom: float = 1.0,
        header: float = 0.5,
        footer: float = 0.5,
    ) -> dict[str, Any]:
        """设置 Excel 页边距."""
        logger.info(f"MCP工具调用: set_excel_page_margins(filename={filename})")
        return excel_handler.set_page_margins(filename, sheet_name, left, right, top, bottom, header, footer)

    @mcp.tool()
    def set_excel_print_area(
        filename: str, sheet_name: str, cell_range: str
    ) -> dict[str, Any]:
        """设置 Excel 打印区域."""
        logger.info(f"MCP工具调用: set_excel_print_area(filename={filename}, range={cell_range})")
        return excel_handler.set_print_area(filename, sheet_name, cell_range)

    @mcp.tool()
    def set_excel_print_titles(
        filename: str,
        sheet_name: str,
        rows: Optional[str] = None,
        cols: Optional[str] = None,
    ) -> dict[str, Any]:
        """设置 Excel 打印标题."""
        logger.info(f"MCP工具调用: set_excel_print_titles(filename={filename})")
        return excel_handler.set_print_titles(filename, sheet_name, rows, cols)

    @mcp.tool()
    def insert_excel_page_break(
        filename: str,
        sheet_name: str,
        cell: str,
        break_type: str = "row",
    ) -> dict[str, Any]:
        """插入 Excel 分页符."""
        logger.info(f"MCP工具调用: insert_excel_page_break(filename={filename}, cell={cell}, type={break_type})")
        return excel_handler.insert_page_break(filename, sheet_name, cell, break_type)
