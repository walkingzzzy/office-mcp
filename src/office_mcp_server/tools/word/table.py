"""Word 表格操作工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.word_handler import WordHandler


def register_table_tools(mcp: FastMCP, word_handler: WordHandler) -> None:
    """注册 Word 表格操作工具."""

    @mcp.tool()
    def edit_word_table(
        filename: str,
        table_index: int,
        operation: str,
        row_index: Optional[int] = None,
        col_index: Optional[int] = None,
    ) -> dict[str, Any]:
        """编辑 Word 文档中的表格(插入/删除行列).

        Args:
            filename: 文件名
            table_index: 表格索引 (从0开始)
            operation: 操作类型 ('add_row'添加行, 'delete_row'删除行, 'add_column'添加列, 'delete_column'删除列)
            row_index: 行索引 (用于删除行, 可选)
            col_index: 列索引 (用于删除列, 可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: edit_word_table(filename={filename})")
        return word_handler.edit_table(filename, table_index, operation, row_index, col_index)

    @mcp.tool()
    def merge_word_table_cells(
        filename: str,
        table_index: int,
        start_row: int,
        start_col: int,
        end_row: int,
        end_col: int,
    ) -> dict[str, Any]:
        """合并 Word 文档表格中的单元格.

        Args:
            filename: 文件名
            table_index: 表格索引 (从0开始)
            start_row: 起始行索引
            start_col: 起始列索引
            end_row: 结束行索引
            end_col: 结束列索引

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: merge_word_table_cells(filename={filename})")
        return word_handler.merge_table_cells(
            filename, table_index, start_row, start_col, end_row, end_col
        )

    @mcp.tool()
    def format_word_table_cell(
        filename: str,
        table_index: int,
        row: int,
        col: int,
        alignment: Optional[str] = None,
        background_color: Optional[str] = None,
        text_color: Optional[str] = None,
        bold: bool = False,
        font_size: Optional[int] = None,
    ) -> dict[str, Any]:
        """格式化 Word 表格单元格.

        Args:
            filename: 文件名
            table_index: 表格索引 (从0开始)
            row: 行索引
            col: 列索引
            alignment: 对齐方式 ('left', 'center', 'right')
            background_color: 背景颜色 HEX格式 (如 '#FF0000')
            text_color: 文字颜色 HEX格式
            bold: 是否加粗
            font_size: 字号

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: format_word_table_cell(filename={filename})")
        return word_handler.format_table_cell(filename, table_index, row, col, alignment, background_color, text_color, bold, font_size)

    @mcp.tool()
    def apply_word_table_style(
        filename: str,
        table_index: int,
        style_name: str = "Table Grid",
    ) -> dict[str, Any]:
        """应用 Word 表格样式.

        Args:
            filename: 文件名
            table_index: 表格索引 (从0开始)
            style_name: 样式名称 ('Table Grid', 'Light Shading', 'Medium Shading 1', 等)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: apply_word_table_style(filename={filename})")
        return word_handler.apply_table_style(filename, table_index, style_name)

    @mcp.tool()
    def set_word_table_borders(
        filename: str,
        table_index: int,
        border_style: str = "single",
        border_size: int = 4,
        border_color: str = "#000000",
    ) -> dict[str, Any]:
        """设置 Word 表格边框.

        Args:
            filename: 文件名
            table_index: 表格索引 (从0开始)
            border_style: 边框样式 ('single', 'double', 'dotted', 'dashed')
            border_size: 边框粗细 (1-96)
            border_color: 边框颜色 HEX格式

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: set_word_table_borders(filename={filename})")
        return word_handler.set_table_borders(filename, table_index, border_style, border_size, border_color)

    @mcp.tool()
    def set_word_column_width(
        filename: str,
        table_index: int,
        col_index: int,
        width_inches: float,
    ) -> dict[str, Any]:
        """设置 Word 表格列宽.

        Args:
            filename: 文件名
            table_index: 表格索引 (从0开始)
            col_index: 列索引
            width_inches: 列宽 (英寸)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: set_word_column_width(filename={filename})")
        return word_handler.set_column_width(filename, table_index, col_index, width_inches)

    @mcp.tool()
    def set_word_row_height(
        filename: str,
        table_index: int,
        row_index: int,
        height_inches: float,
    ) -> dict[str, Any]:
        """设置 Word 表格行高.

        Args:
            filename: 文件名
            table_index: 表格索引 (从0开始)
            row_index: 行索引
            height_inches: 行高 (英寸)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: set_word_row_height(filename={filename})")
        return word_handler.set_row_height(filename, table_index, row_index, height_inches)

    @mcp.tool()
    def read_word_table_data(
        filename: str,
        table_index: int,
    ) -> dict[str, Any]:
        """读取 Word 表格数据.

        Args:
            filename: 文件名
            table_index: 表格索引 (从0开始)

        Returns:
            dict: 表格数据
        """
        logger.info(f"MCP工具调用: read_word_table_data(filename={filename})")
        return word_handler.read_table_data(filename, table_index)

    @mcp.tool()
    def sort_word_table(filename: str, table_index: int, column_index: int, reverse: bool = False, has_header: bool = True) -> dict[str, Any]:
        """对 Word 表格进行排序.

        Args:
            filename: 文件名
            table_index: 表格索引
            column_index: 排序列索引
            reverse: 是否降序 (默认 False 升序)
            has_header: 是否有表头 (默认 True)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: sort_word_table(filename={filename})")
        return word_handler.sort_table(filename, table_index, column_index, reverse, has_header)

    @mcp.tool()
    def import_word_table_data(filename: str, data: list[list[str]], has_header: bool = True, table_style: str = "Table Grid") -> dict[str, Any]:
        """从数据导入创建 Word 表格.

        Args:
            filename: 文件名
            data: 二维数组数据
            has_header: 第一行是否为表头 (默认 True)
            table_style: 表格样式 (默认 'Table Grid')

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: import_word_table_data(filename={filename})")
        return word_handler.import_table_data(filename, data, has_header, table_style)
