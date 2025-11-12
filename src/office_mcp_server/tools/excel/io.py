"""Excel 导入导出工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.excel_handler import ExcelHandler


def register_io_tools(mcp: FastMCP, excel_handler: ExcelHandler) -> None:
    """注册 Excel 导入导出工具."""

    @mcp.tool()
    def import_excel_from_csv(
        filename: str,
        sheet_name: str,
        csv_file: str,
        start_cell: str = "A1",
        has_header: bool = True,
    ) -> dict[str, Any]:
        """从 CSV 导入数据到 Excel."""
        logger.info(f"MCP工具调用: import_excel_from_csv(filename={filename}, csv_file={csv_file})")
        return excel_handler.import_from_csv(filename, sheet_name, csv_file, start_cell, has_header)

    @mcp.tool()
    def import_excel_from_json(
        filename: str,
        sheet_name: str,
        json_file: str,
        start_cell: str = "A1",
        json_path: Optional[str] = None,
    ) -> dict[str, Any]:
        """从 JSON 导入数据到 Excel."""
        logger.info(f"MCP工具调用: import_excel_from_json(filename={filename}, json_file={json_file})")
        return excel_handler.import_from_json(filename, sheet_name, json_file, start_cell, json_path)

    @mcp.tool()
    def export_excel_to_csv(
        filename: str, sheet_name: str, csv_file: str, cell_range: Optional[str] = None
    ) -> dict[str, Any]:
        """导出 Excel 数据为 CSV."""
        logger.info(f"MCP工具调用: export_excel_to_csv(filename={filename}, csv_file={csv_file})")
        return excel_handler.export_to_csv(filename, sheet_name, csv_file, cell_range)

    @mcp.tool()
    def export_excel_to_json(
        filename: str,
        sheet_name: str,
        json_file: str,
        cell_range: Optional[str] = None,
        has_header: bool = True,
        orient: str = "records",
    ) -> dict[str, Any]:
        """导出 Excel 数据为 JSON.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            json_file: JSON文件名
            cell_range: 单元格范围 (可选, 默认整表)
            has_header: 是否有表头 (默认 True)
            orient: JSON格式 ('records'记录数组, 'columns'列字典, 'index'索引字典, 默认 'records')
        """
        logger.info(f"MCP工具调用: export_excel_to_json(filename={filename}, json_file={json_file})")
        return excel_handler.export_to_json(filename, sheet_name, json_file, cell_range, has_header, orient)

    @mcp.tool()
    def export_excel_to_pdf(
        filename: str, sheet_name: str, pdf_file: str, cell_range: Optional[str] = None
    ) -> dict[str, Any]:
        """导出 Excel 数据为 PDF."""
        logger.info(f"MCP工具调用: export_excel_to_pdf(filename={filename}, pdf_file={pdf_file})")
        return excel_handler.export_to_pdf(filename, sheet_name, pdf_file, cell_range)

    @mcp.tool()
    def export_excel_to_html(
        filename: str,
        sheet_name: str,
        html_file: str,
        cell_range: Optional[str] = None,
        include_style: bool = True,
    ) -> dict[str, Any]:
        """导出 Excel 数据为 HTML."""
        logger.info(f"MCP工具调用: export_excel_to_html(filename={filename}, html_file={html_file})")
        return excel_handler.export_to_html(filename, sheet_name, html_file, cell_range, include_style)

    @mcp.tool()
    def create_excel_from_template(
        template_file: str, new_filename: str, sheet_name: Optional[str] = None
    ) -> dict[str, Any]:
        """基于模板创建 Excel 工作簿."""
        logger.info(f"MCP工具调用: create_excel_from_template(template={template_file}, new={new_filename})")
        return excel_handler.create_from_template(template_file, new_filename, sheet_name)

    @mcp.tool()
    def copy_excel_workbook(source_file: str, new_filename: str) -> dict[str, Any]:
        """复制 Excel 工作簿."""
        logger.info(f"MCP工具调用: copy_excel_workbook(source={source_file}, new={new_filename})")
        return excel_handler.copy_workbook(source_file, new_filename)

    @mcp.tool()
    def protect_excel_sheet(
        filename: str,
        sheet_name: str,
        password: Optional[str] = None,
        enable: bool = True,
    ) -> dict[str, Any]:
        """保护/取消保护 Excel 工作表."""
        logger.info(f"MCP工具调用: protect_excel_sheet(filename={filename}, sheet={sheet_name}, enable={enable})")
        return excel_handler.protect_sheet(filename, sheet_name, password, enable)
