"""Excel 结构操作工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.excel_handler import ExcelHandler


def register_structure_tools(mcp: FastMCP, excel_handler: ExcelHandler) -> None:
    """注册 Excel 结构操作工具."""

    @mcp.tool()
    def insert_excel_rows(
        filename: str, sheet_name: str, row_index: int, count: int = 1
    ) -> dict[str, Any]:
        """插入 Excel 行."""
        logger.info(f"MCP工具调用: insert_excel_rows(filename={filename}, row_index={row_index}, count={count})")
        return excel_handler.insert_rows(filename, sheet_name, row_index, count)

    @mcp.tool()
    def delete_excel_rows(
        filename: str, sheet_name: str, row_index: int, count: int = 1
    ) -> dict[str, Any]:
        """删除 Excel 行."""
        logger.info(f"MCP工具调用: delete_excel_rows(filename={filename}, row_index={row_index}, count={count})")
        return excel_handler.delete_rows(filename, sheet_name, row_index, count)

    @mcp.tool()
    def insert_excel_cols(
        filename: str, sheet_name: str, col_index: int, count: int = 1
    ) -> dict[str, Any]:
        """插入 Excel 列."""
        logger.info(f"MCP工具调用: insert_excel_cols(filename={filename}, col_index={col_index}, count={count})")
        return excel_handler.insert_cols(filename, sheet_name, col_index, count)

    @mcp.tool()
    def delete_excel_cols(
        filename: str, sheet_name: str, col_index: int, count: int = 1
    ) -> dict[str, Any]:
        """删除 Excel 列."""
        logger.info(f"MCP工具调用: delete_excel_cols(filename={filename}, col_index={col_index}, count={count})")
        return excel_handler.delete_cols(filename, sheet_name, col_index, count)

    @mcp.tool()
    def hide_excel_rows(
        filename: str, sheet_name: str, row_start: int, row_end: Optional[int] = None
    ) -> dict[str, Any]:
        """隐藏 Excel 行."""
        logger.info(f"MCP工具调用: hide_excel_rows(filename={filename}, row_start={row_start}, row_end={row_end})")
        return excel_handler.hide_rows(filename, sheet_name, row_start, row_end)

    @mcp.tool()
    def show_excel_rows(
        filename: str, sheet_name: str, row_start: int, row_end: Optional[int] = None
    ) -> dict[str, Any]:
        """显示 Excel 行."""
        logger.info(f"MCP工具调用: show_excel_rows(filename={filename}, row_start={row_start}, row_end={row_end})")
        return excel_handler.show_rows(filename, sheet_name, row_start, row_end)

    @mcp.tool()
    def hide_excel_cols(
        filename: str, sheet_name: str, col_start: int, col_end: Optional[int] = None
    ) -> dict[str, Any]:
        """隐藏 Excel 列."""
        logger.info(f"MCP工具调用: hide_excel_cols(filename={filename}, col_start={col_start}, col_end={col_end})")
        return excel_handler.hide_cols(filename, sheet_name, col_start, col_end)

    @mcp.tool()
    def show_excel_cols(
        filename: str, sheet_name: str, col_start: int, col_end: Optional[int] = None
    ) -> dict[str, Any]:
        """显示 Excel 列."""
        logger.info(f"MCP工具调用: show_excel_cols(filename={filename}, col_start={col_start}, col_end={col_end})")
        return excel_handler.show_cols(filename, sheet_name, col_start, col_end)

    @mcp.tool()
    def set_excel_row_height(
        filename: str, sheet_name: str, row_index: int, height: float
    ) -> dict[str, Any]:
        """设置 Excel 行高."""
        logger.info(f"MCP工具调用: set_excel_row_height(filename={filename}, row_index={row_index}, height={height})")
        return excel_handler.set_row_height(filename, sheet_name, row_index, height)

    @mcp.tool()
    def set_excel_col_width(
        filename: str, sheet_name: str, col_index: int, width: float
    ) -> dict[str, Any]:
        """设置 Excel 列宽."""
        logger.info(f"MCP工具调用: set_excel_col_width(filename={filename}, col_index={col_index}, width={width})")
        return excel_handler.set_col_width(filename, sheet_name, col_index, width)

    @mcp.tool()
    def merge_excel_cells(
        filename: str, sheet_name: str, cell_range: str
    ) -> dict[str, Any]:
        """合并 Excel 单元格."""
        logger.info(f"MCP工具调用: merge_excel_cells(filename={filename}, cell_range={cell_range})")
        return excel_handler.merge_cells(filename, sheet_name, cell_range)

    @mcp.tool()
    def unmerge_excel_cells(
        filename: str, sheet_name: str, cell_range: str
    ) -> dict[str, Any]:
        """取消合并 Excel 单元格."""
        logger.info(f"MCP工具调用: unmerge_excel_cells(filename={filename}, cell_range={cell_range})")
        return excel_handler.unmerge_cells(filename, sheet_name, cell_range)

    @mcp.tool()
    def insert_excel_cells(
        filename: str,
        sheet_name: str,
        cell: str,
        shift: str = "down",
    ) -> dict[str, Any]:
        """插入 Excel 单元格并移动其他单元格.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            cell: 起始单元格 (如 'B2')
            shift: 移动方向 ('down'向下, 'right'向右, 默认 'down')

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: insert_excel_cells(filename={filename}, cell={cell}, shift={shift})")
        return excel_handler.insert_cells(filename, sheet_name, cell, shift)

    @mcp.tool()
    def delete_excel_cells(
        filename: str,
        sheet_name: str,
        cell: str,
        shift: str = "up",
    ) -> dict[str, Any]:
        """删除 Excel 单元格并移动其他单元格.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            cell: 起始单元格 (如 'B2')
            shift: 移动方向 ('up'向上, 'left'向左, 默认 'up')

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: delete_excel_cells(filename={filename}, cell={cell}, shift={shift})")
        return excel_handler.delete_cells(filename, sheet_name, cell, shift)

    @mcp.tool()
    def insert_excel_cell_range(
        filename: str,
        sheet_name: str,
        start_cell: str,
        end_cell: str,
        shift: str = "down",
    ) -> dict[str, Any]:
        """插入 Excel 单元格范围并移动其他单元格.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            start_cell: 起始单元格 (如 'B2')
            end_cell: 结束单元格 (如 'D4')
            shift: 移动方向 ('down'向下, 'right'向右, 默认 'down')

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: insert_excel_cell_range(filename={filename}, range={start_cell}:{end_cell}, shift={shift})")
        return excel_handler.insert_cell_range(filename, sheet_name, start_cell, end_cell, shift)

    @mcp.tool()
    def delete_excel_cell_range(
        filename: str,
        sheet_name: str,
        start_cell: str,
        end_cell: str,
        shift: str = "up",
    ) -> dict[str, Any]:
        """删除 Excel 单元格范围并移动其他单元格.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            start_cell: 起始单元格 (如 'B2')
            end_cell: 结束单元格 (如 'D4')
            shift: 移动方向 ('up'向上, 'left'向左, 默认 'up')

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: delete_excel_cell_range(filename={filename}, range={start_cell}:{end_cell}, shift={shift})")
        return excel_handler.delete_cell_range(filename, sheet_name, start_cell, end_cell, shift)

    @mcp.tool()
    def copy_excel_rows(
        filename: str, sheet_name: str, source_row: int, target_row: int, count: int = 1
    ) -> dict[str, Any]:
        """复制 Excel 行."""
        logger.info(f"MCP工具调用: copy_excel_rows(filename={filename}, source={source_row}, target={target_row})")
        return excel_handler.copy_rows(filename, sheet_name, source_row, target_row, count)

    @mcp.tool()
    def copy_excel_cols(
        filename: str, sheet_name: str, source_col: int, target_col: int, count: int = 1
    ) -> dict[str, Any]:
        """复制 Excel 列."""
        logger.info(f"MCP工具调用: copy_excel_cols(filename={filename}, source={source_col}, target={target_col})")
        return excel_handler.copy_cols(filename, sheet_name, source_col, target_col, count)

    @mcp.tool()
    def move_excel_rows(
        filename: str, sheet_name: str, source_row: int, target_row: int, count: int = 1
    ) -> dict[str, Any]:
        """移动 Excel 行."""
        logger.info(f"MCP工具调用: move_excel_rows(filename={filename}, source={source_row}, target={target_row})")
        return excel_handler.move_rows(filename, sheet_name, source_row, target_row, count)

    @mcp.tool()
    def move_excel_cols(
        filename: str, sheet_name: str, source_col: int, target_col: int, count: int = 1
    ) -> dict[str, Any]:
        """移动 Excel 列."""
        logger.info(f"MCP工具调用: move_excel_cols(filename={filename}, source={source_col}, target={target_col})")
        return excel_handler.move_cols(filename, sheet_name, source_col, target_col, count)

    @mcp.tool()
    def freeze_excel_panes(
        filename: str,
        sheet_name: str,
        cell: Optional[str] = None,
        freeze_rows: int = 0,
        freeze_cols: int = 0,
    ) -> dict[str, Any]:
        """冻结 Excel 窗格.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            cell: 冻结单元格位置 (如 'B2'表示冻结第1行和第1列, 可选)
            freeze_rows: 冻结行数 (默认 0)
            freeze_cols: 冻结列数 (默认 0)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: freeze_excel_panes(filename={filename}, cell={cell}, rows={freeze_rows}, cols={freeze_cols})")
        return excel_handler.freeze_panes(filename, sheet_name, cell, freeze_rows, freeze_cols)
