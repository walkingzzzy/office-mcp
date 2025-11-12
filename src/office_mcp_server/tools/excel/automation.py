"""Excel 自动化工具."""

from typing import Any, Optional, Union

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.excel_handler import ExcelHandler


def register_automation_tools(mcp: FastMCP, excel_handler: ExcelHandler) -> None:
    """注册 Excel 自动化工具."""

    @mcp.tool()
    def fill_excel_series(
        filename: str,
        sheet_name: str,
        start_cell: str,
        end_cell: str,
        fill_type: str = "linear",
        start_value: Union[int, float] = 1,
        step: Union[int, float] = 1,
    ) -> dict[str, Any]:
        """Excel 序列填充.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            start_cell: 起始单元格 (如 'A1')
            end_cell: 结束单元格 (如 'A10')
            fill_type: 填充类型 ('linear'线性, 'growth'等比, 'date'日期, 默认 'linear')
            start_value: 起始值 (默认 1)
            step: 步长 (默认 1)
        """
        logger.info(f"MCP工具调用: fill_excel_series(filename={filename}, fill_type={fill_type})")
        return excel_handler.fill_series(filename, sheet_name, start_cell, end_cell, fill_type, start_value, step)

    @mcp.tool()
    def copy_fill_excel(
        filename: str, sheet_name: str, source_cell: str, target_range: str
    ) -> dict[str, Any]:
        """Excel 复制填充."""
        logger.info(f"MCP工具调用: copy_fill_excel(filename={filename}, source={source_cell}, target={target_range})")
        return excel_handler.copy_fill(filename, sheet_name, source_cell, target_range)

    @mcp.tool()
    def formula_fill_excel(
        filename: str,
        sheet_name: str,
        start_cell: str,
        formula: str,
        fill_direction: str = "down",
        count: int = 10,
    ) -> dict[str, Any]:
        """Excel 公式填充.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            start_cell: 起始单元格 (如 'A1')
            formula: 公式 (如 '=SUM(B1:C1)')
            fill_direction: 填充方向 ('down'向下, 'right'向右, 默认 'down')
            count: 填充数量 (默认 10)
        """
        logger.info(f"MCP工具调用: formula_fill_excel(filename={filename}, direction={fill_direction}, count={count})")
        return excel_handler.formula_fill(filename, sheet_name, start_cell, formula, fill_direction, count)

    @mcp.tool()
    def batch_process_excel_files(
        file_patterns: list[str],
        operation: str,
        output_dir: Optional[str] = None,
        **kwargs
    ) -> dict[str, Any]:
        """批量处理 Excel 文件."""
        logger.info(f"MCP工具调用: batch_process_excel_files(operation={operation}, patterns={len(file_patterns)})")
        return excel_handler.batch_process_files(file_patterns, operation, output_dir, **kwargs)

    @mcp.tool()
    def merge_excel_workbooks(
        source_files: list[str],
        output_file: str,
        merge_mode: str = "sheets",
    ) -> dict[str, Any]:
        """合并多个 Excel 工作簿."""
        logger.info(f"MCP工具调用: merge_excel_workbooks(files={len(source_files)}, output={output_file})")
        return excel_handler.merge_workbooks(source_files, output_file, merge_mode)

    @mcp.tool()
    def generate_excel_report_from_template(
        template_file: str,
        data_source: dict[str, Any],
        output_file: str,
    ) -> dict[str, Any]:
        """基于模板生成 Excel 报表."""
        logger.info(f"MCP工具调用: generate_excel_report_from_template(template={template_file})")
        return excel_handler.generate_report_from_template(template_file, data_source, output_file)

    @mcp.tool()
    def update_excel_report_data(
        filename: str,
        data_mappings: dict[str, Any],
    ) -> dict[str, Any]:
        """更新 Excel 报表数据."""
        logger.info(f"MCP工具调用: update_excel_report_data(filename={filename})")
        return excel_handler.update_report_data(filename, data_mappings)

    @mcp.tool()
    def consolidate_excel_reports(
        source_files: list[str],
        output_file: str,
        consolidation_function: str = "sum",
    ) -> dict[str, Any]:
        """合并多个 Excel 报表."""
        logger.info(f"MCP工具调用: consolidate_excel_reports(files={len(source_files)})")
        return excel_handler.consolidate_reports(source_files, output_file, consolidation_function)

    @mcp.tool()
    def schedule_excel_report_generation(
        template_file: str,
        data_source_query: str,
        output_pattern: str,
        schedule_cron: str,
    ) -> dict[str, Any]:
        """定时生成 Excel 报表."""
        logger.info(f"MCP工具调用: schedule_excel_report_generation(template={template_file}, schedule={schedule_cron})")
        return excel_handler.schedule_report_generation(template_file, data_source_query, output_pattern, schedule_cron)

    @mcp.tool()
    def auto_save_excel_workbook(
        filename: str,
        backup_dir: Optional[str] = None,
        version_suffix: Optional[str] = None,
    ) -> dict[str, Any]:
        """自动保存 Excel 工作簿并创建备份.

        Args:
            filename: 文件名
            backup_dir: 备份目录 (可选, 默认为output_dir/backups)
            version_suffix: 版本后缀 (可选, 默认为时间戳)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: auto_save_excel_workbook(filename={filename}, backup_dir={backup_dir})")
        return excel_handler.auto_save_workbook(filename, backup_dir, version_suffix)
