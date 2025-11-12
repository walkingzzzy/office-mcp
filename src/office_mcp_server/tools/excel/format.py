"""Excel 格式化工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.excel_handler import ExcelHandler


def register_format_tools(mcp: FastMCP, excel_handler: ExcelHandler) -> None:
    """注册 Excel 格式化工具."""

    @mcp.tool()
    def create_excel_table(
        filename: str,
        sheet_name: str,
        table_range: str,
        table_name: str,
        style: str = "TableStyleMedium9",
        show_header: bool = True,
        show_totals: bool = False,
    ) -> dict[str, Any]:
        """创建 Excel 表格样式.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            table_range: 表格范围 (如 'A1:D10')
            table_name: 表格名称 (必须唯一)
            style: 表格样式名称 (如 'TableStyleMedium9', 'TableStyleLight1', 'TableStyleDark5' 等, 默认 'TableStyleMedium9')
            show_header: 是否显示表头 (默认 True)
            show_totals: 是否显示汇总行 (默认 False)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: create_excel_table(filename={filename}, table_name={table_name})")
        return excel_handler.create_table(
            filename, sheet_name, table_range, table_name,
            style, show_header, show_totals
        )

    @mcp.tool()
    def create_excel_pivot_table(
        filename: str,
        source_sheet: str,
        source_range: str,
        pivot_sheet: str,
        pivot_location: str,
        row_fields: list[str],
        col_fields: Optional[list[str]] = None,
        data_fields: Optional[list[dict[str, str]]] = None,
        filter_fields: Optional[list[str]] = None,
    ) -> dict[str, Any]:
        """创建 Excel 数据透视表.

        Args:
            filename: 文件名
            source_sheet: 源数据工作表名称
            source_range: 源数据范围 (如 'A1:E100')
            pivot_sheet: 透视表工作表名称 (如果不存在则创建)
            pivot_location: 透视表位置 (如 'A3')
            row_fields: 行字段列表 (字段名称)
            col_fields: 列字段列表 (可选)
            data_fields: 数据字段列表，每个元素为 {"field": "字段名", "function": "sum/average/count/max/min"} (可选)
            filter_fields: 筛选字段列表 (可选)

        Returns:
            dict: 操作结果

        Note:
            此功能需要 Windows 环境和 Microsoft Excel 应用程序，或安装 pywin32 库
        """
        logger.info(f"MCP工具调用: create_excel_pivot_table(filename={filename})")
        return excel_handler.create_pivot_table(
            filename, source_sheet, source_range, pivot_sheet, pivot_location,
            row_fields, col_fields, data_fields, filter_fields
        )

    @mcp.tool()
    def change_excel_pivot_data_source(
        filename: str,
        pivot_sheet: str,
        pivot_table_name: str,
        new_source_range: str,
    ) -> dict[str, Any]:
        """更改 Excel 数据透视表数据源.

        Args:
            filename: 文件名
            pivot_sheet: 数据透视表所在工作表
            pivot_table_name: 数据透视表名称
            new_source_range: 新数据源范围 (如 'Sheet1!A1:E100')

        Returns:
            dict: 操作结果

        Note:
            此功能需要 Windows 环境和 Microsoft Excel 应用程序，或安装 pywin32 库
        """
        logger.info(f"MCP工具调用: change_excel_pivot_data_source(filename={filename}, pivot_table={pivot_table_name})")
        return excel_handler.change_pivot_data_source(filename, pivot_sheet, pivot_table_name, new_source_range)
