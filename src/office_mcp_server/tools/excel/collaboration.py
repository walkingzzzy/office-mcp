"""Excel 协作工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.excel_handler import ExcelHandler


def register_collaboration_tools(mcp: FastMCP, excel_handler: ExcelHandler) -> None:
    """注册 Excel 协作工具."""

    @mcp.tool()
    def add_excel_comment(
        filename: str,
        sheet_name: str,
        cell: str,
        comment: str,
        author: Optional[str] = None,
    ) -> dict[str, Any]:
        """添加 Excel 批注."""
        logger.info(f"MCP工具调用: add_excel_comment(filename={filename}, cell={cell})")
        return excel_handler.add_comment(filename, sheet_name, cell, comment, author)

    @mcp.tool()
    def get_excel_comment(
        filename: str, sheet_name: str, cell: str
    ) -> dict[str, Any]:
        """获取 Excel 批注."""
        logger.info(f"MCP工具调用: get_excel_comment(filename={filename}, cell={cell})")
        return excel_handler.get_comment(filename, sheet_name, cell)

    @mcp.tool()
    def delete_excel_comment(
        filename: str, sheet_name: str, cell: str
    ) -> dict[str, Any]:
        """删除 Excel 批注."""
        logger.info(f"MCP工具调用: delete_excel_comment(filename={filename}, cell={cell})")
        return excel_handler.delete_comment(filename, sheet_name, cell)

    @mcp.tool()
    def list_all_excel_comments(
        filename: str, sheet_name: Optional[str] = None
    ) -> dict[str, Any]:
        """列出 Excel 所有批注."""
        logger.info(f"MCP工具调用: list_all_excel_comments(filename={filename})")
        return excel_handler.list_all_comments(filename, sheet_name)
