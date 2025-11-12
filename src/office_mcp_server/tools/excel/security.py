"""Excel 安全工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.excel_handler import ExcelHandler


def register_security_tools(mcp: FastMCP, excel_handler: ExcelHandler) -> None:
    """注册 Excel 安全工具."""

    @mcp.tool()
    def encrypt_excel_workbook(
        filename: str, password: str
    ) -> dict[str, Any]:
        """加密 Excel 工作簿."""
        logger.info(f"MCP工具调用: encrypt_excel_workbook(filename={filename})")
        return excel_handler.encrypt_workbook(filename, password)

    @mcp.tool()
    def lock_excel_cells(
        filename: str, sheet_name: str, cell_range: str, lock: bool = True
    ) -> dict[str, Any]:
        """锁定/解锁 Excel 单元格."""
        logger.info(f"MCP工具调用: lock_excel_cells(filename={filename}, cell_range={cell_range}, lock={lock})")
        return excel_handler.lock_cells(filename, sheet_name, cell_range, lock)

    @mcp.tool()
    def hide_excel_formulas(
        filename: str, sheet_name: str, cell_range: str, hide: bool = True
    ) -> dict[str, Any]:
        """隐藏/显示 Excel 公式."""
        logger.info(f"MCP工具调用: hide_excel_formulas(filename={filename}, cell_range={cell_range}, hide={hide})")
        return excel_handler.hide_formulas(filename, sheet_name, cell_range, hide)

    @mcp.tool()
    def mask_excel_data(
        filename: str,
        sheet_name: str,
        cell_range: str,
        mask_type: str = "partial",
        mask_char: str = "*",
        keep_first: int = 0,
        keep_last: int = 0,
        custom_pattern: Optional[str] = None,
    ) -> dict[str, Any]:
        """Excel 数据脱敏."""
        logger.info(f"MCP工具调用: mask_excel_data(filename={filename}, type={mask_type})")
        return excel_handler.mask_data(
            filename, sheet_name, cell_range, mask_type, mask_char, keep_first, keep_last, custom_pattern
        )

    @mcp.tool()
    def detect_excel_sensitive_data(
        filename: str,
        sheet_name: str,
        cell_range: Optional[str] = None,
    ) -> dict[str, Any]:
        """检测 Excel 中的敏感数据."""
        logger.info(f"MCP工具调用: detect_excel_sensitive_data(filename={filename})")
        return excel_handler.detect_sensitive_data(filename, sheet_name, cell_range)

    @mcp.tool()
    def hash_excel_data(
        filename: str,
        sheet_name: str,
        cell_range: str,
        algorithm: str = "sha256",
    ) -> dict[str, Any]:
        """Excel 数据哈希加密."""
        logger.info(f"MCP工具调用: hash_excel_data(filename={filename}, algorithm={algorithm})")
        return excel_handler.hash_data(filename, sheet_name, cell_range, algorithm)
