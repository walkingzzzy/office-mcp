"""Excel 数据操作工具."""

from typing import Any, Optional, Union

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.excel_handler import ExcelHandler


def register_data_tools(mcp: FastMCP, excel_handler: ExcelHandler) -> None:
    """注册 Excel 数据操作工具."""

    @mcp.tool()
    def insert_excel_formula(
        filename: str, sheet_name: str, cell: str, formula: str
    ) -> dict[str, Any]:
        """插入 Excel 公式.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            cell: 单元格引用 (如 'A1')
            formula: 公式 (如 '=SUM(A1:A10)', '=AVERAGE(B1:B5)', '=IF(A1>10,"大","小")')

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: insert_excel_formula(filename={filename})")
        return excel_handler.insert_formula(filename, sheet_name, cell, formula)

    @mcp.tool()
    def sort_excel_data(
        filename: str,
        sheet_name: str,
        data_range: str,
        sort_by_column: int = 0,
        ascending: bool = True,
    ) -> dict[str, Any]:
        """对 Excel 数据进行排序.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            data_range: 数据范围 (如 'A1:C10')
            sort_by_column: 排序列索引 (从0开始, 默认 0)
            ascending: 是否升序 (默认 True)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: sort_excel_data(filename={filename})")
        return excel_handler.sort_data(filename, sheet_name, data_range, sort_by_column, ascending)

    @mcp.tool()
    def manage_excel_worksheets(
        filename: str,
        operation: str,
        sheet_name: Optional[str] = None,
        new_name: Optional[str] = None,
        target_index: Optional[int] = None,
    ) -> dict[str, Any]:
        """管理 Excel 工作表.

        Args:
            filename: 文件名
            operation: 操作类型 ('create'创建, 'delete'删除, 'rename'重命名, 'copy'复制, 'move'移动)
            sheet_name: 工作表名称 (可选)
            new_name: 新名称 (用于重命名和复制, 可选)
            target_index: 目标位置索引 (用于移动, 可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: manage_excel_worksheets(filename={filename})")
        return excel_handler.manage_worksheets(
            filename, operation, sheet_name, new_name, target_index
        )

    @mcp.tool()
    def apply_excel_function(
        filename: str,
        sheet_name: str,
        cell: str,
        function_name: str,
        range1: Optional[str] = None,
        range2: Optional[str] = None,
        condition: Optional[str] = None,
        value_if_true: Optional[str] = None,
        value_if_false: Optional[str] = None,
        lookup_value: Optional[str] = None,
        table_array: Optional[str] = None,
        col_index: Optional[int] = None,
        range_lookup: bool = False,
    ) -> dict[str, Any]:
        """应用常用 Excel 函数.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            cell: 结果单元格引用 (如 'A1')
            function_name: 函数名称 ('SUM'求和, 'AVERAGE'平均值, 'MAX'最大值, 'MIN'最小值, 'COUNT'计数,
                          'COUNTA'非空计数, 'IF'条件, 'SUMIF'条件求和, 'COUNTIF'条件计数,
                          'VLOOKUP'纵向查找, 'HLOOKUP'横向查找, 'CONCATENATE'连接,
                          'LEFT'左侧文本, 'RIGHT'右侧文本, 'MID'中间文本, 'LEN'文本长度,
                          'UPPER'大写, 'LOWER'小写, 'TRIM'去除空格)
            range1: 第一个范围 (如 'A1:A10', 用于大多数函数, 可选)
            range2: 第二个范围 (用于 SUMIF, COUNTIF 等, 可选)
            condition: 条件 (用于 IF, SUMIF, COUNTIF, 如 '>10', '="Text"', 可选)
            value_if_true: IF函数真值返回 (可选)
            value_if_false: IF函数假值返回 (可选)
            lookup_value: 查找值 (用于 VLOOKUP, HLOOKUP, 可选)
            table_array: 查找表范围 (用于 VLOOKUP, HLOOKUP, 可选)
            col_index: 返回列索引 (用于 VLOOKUP, HLOOKUP, 可选)
            range_lookup: 是否近似匹配 (默认 False, 用于 VLOOKUP, HLOOKUP)

        Returns:
            dict: 操作结果,包含生成的公式
        """
        logger.info(f"MCP工具调用: apply_excel_function(filename={filename}, function={function_name})")
        return excel_handler.apply_function(
            filename, sheet_name, cell, function_name, range1, range2,
            condition, value_if_true, value_if_false, lookup_value,
            table_array, col_index, range_lookup
        )

    @mcp.tool()
    def filter_excel_data(
        filename: str,
        sheet_name: str,
        data_range: str,
        filter_column: Optional[int] = None,
        filter_value: Optional[str] = None,
        filter_operator: str = "equals",
        enable_autofilter: bool = True,
    ) -> dict[str, Any]:
        """对 Excel 数据进行筛选.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            data_range: 数据范围 (如 'A1:D10')
            filter_column: 筛选列索引 (从0开始, 可选)
            filter_value: 筛选值 (可选)
            filter_operator: 筛选操作符 ('equals'等于, 'notEquals'不等于, 'greaterThan'大于,
                           'lessThan'小于, 'greaterThanOrEqual'大于等于, 'lessThanOrEqual'小于等于,
                           'contains'包含, 'notContains'不包含, 'beginsWith'开头为, 'endsWith'结尾为,
                           默认 'equals')
            enable_autofilter: 是否启用自动筛选 (默认 True)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: filter_excel_data(filename={filename})")
        return excel_handler.filter_data(
            filename, sheet_name, data_range, filter_column,
            filter_value, filter_operator, enable_autofilter
        )

    @mcp.tool()
    def apply_excel_conditional_formatting(
        filename: str,
        sheet_name: str,
        cell_range: str,
        rule_type: str,
        format_type: str = "fill",
        color: Optional[str] = None,
        operator: Optional[str] = None,
        formula: Optional[str] = None,
        value1: Optional[Union[str, int, float]] = None,
        value2: Optional[Union[str, int, float]] = None,
    ) -> dict[str, Any]:
        """应用 Excel 条件格式.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            cell_range: 单元格范围 (如 'A1:D10')
            rule_type: 规则类型 ('cellIs'单元格值, 'colorScale'色阶, 'dataBar'数据条,
                      'iconSet'图标集, 'aboveAverage'高于平均值,
                      'duplicateValues'重复值, 'uniqueValues'唯一值, 'expression'公式)
            format_type: 格式类型 ('fill'填充, 'font'字体, 默认 'fill')
            color: 颜色 HEX格式 (如 '#FF0000', 可选)
            operator: 操作符 (用于cellIs规则: 'greaterThan', 'lessThan', 'between', 'equal', 'notEqual', 可选)
            formula: 公式 (用于expression规则, 可选)
            value1: 第一个值 (用于cellIs规则, 可选)
            value2: 第二个值 (用于between操作符, 可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: apply_excel_conditional_formatting(filename={filename})")
        return excel_handler.apply_conditional_formatting(
            filename, sheet_name, cell_range, rule_type, format_type,
            color, operator, formula, value1, value2
        )

    @mcp.tool()
    def set_excel_data_validation(
        filename: str,
        sheet_name: str,
        cell_range: str,
        validation_type: str,
        operator: Optional[str] = None,
        formula1: Optional[str] = None,
        formula2: Optional[str] = None,
        allow_blank: bool = True,
        show_dropdown: bool = True,
        prompt_title: Optional[str] = None,
        prompt: Optional[str] = None,
        error_title: Optional[str] = None,
        error: Optional[str] = None,
    ) -> dict[str, Any]:
        """设置 Excel 数据验证.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            cell_range: 单元格范围 (如 'A1:A10')
            validation_type: 验证类型 ('whole'整数, 'decimal'小数, 'list'列表,
                           'date'日期, 'time'时间, 'textLength'文本长度, 'custom'自定义)
            operator: 操作符 ('between'介于, 'notBetween'不介于, 'equal'等于, 'notEqual'不等于,
                     'greaterThan'大于, 'lessThan'小于, 'greaterThanOrEqual'大于等于,
                     'lessThanOrEqual'小于等于, 可选)
            formula1: 公式1或最小值或列表(逗号分隔) (可选)
            formula2: 公式2或最大值 (可选)
            allow_blank: 是否允许空值 (默认 True)
            show_dropdown: 是否显示下拉列表 (默认 True, 仅用于list类型)
            prompt_title: 输入提示标题 (可选)
            prompt: 输入提示内容 (可选)
            error_title: 错误提示标题 (可选)
            error: 错误提示内容 (可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: set_excel_data_validation(filename={filename})")
        return excel_handler.set_data_validation(
            filename, sheet_name, cell_range, validation_type, operator,
            formula1, formula2, allow_blank, show_dropdown,
            prompt_title, prompt, error_title, error
        )

    @mcp.tool()
    def read_excel_range(
        filename: str, sheet_name: str, cell_range: str
    ) -> dict[str, Any]:
        """读取 Excel 单元格范围数据."""
        logger.info(f"MCP工具调用: read_excel_range(filename={filename}, cell_range={cell_range})")
        return excel_handler.read_range(filename, sheet_name, cell_range)

    @mcp.tool()
    def read_excel_row(
        filename: str, sheet_name: str, row_index: int
    ) -> dict[str, Any]:
        """读取 Excel 整行数据."""
        logger.info(f"MCP工具调用: read_excel_row(filename={filename}, row_index={row_index})")
        return excel_handler.read_row(filename, sheet_name, row_index)

    @mcp.tool()
    def read_excel_column(
        filename: str, sheet_name: str, col_index: int
    ) -> dict[str, Any]:
        """读取 Excel 整列数据."""
        logger.info(f"MCP工具调用: read_excel_column(filename={filename}, col_index={col_index})")
        return excel_handler.read_column(filename, sheet_name, col_index)

    @mcp.tool()
    def read_all_excel_data(
        filename: str, sheet_name: str, include_empty: bool = False
    ) -> dict[str, Any]:
        """读取 Excel 整表数据."""
        logger.info(f"MCP工具调用: read_all_excel_data(filename={filename}, sheet_name={sheet_name})")
        return excel_handler.read_all_data(filename, sheet_name, include_empty)

    @mcp.tool()
    def clear_excel_cell(
        filename: str, sheet_name: str, cell: str
    ) -> dict[str, Any]:
        """清除 Excel 单元格内容."""
        logger.info(f"MCP工具调用: clear_excel_cell(filename={filename}, cell={cell})")
        return excel_handler.clear_cell(filename, sheet_name, cell)

    @mcp.tool()
    def clear_excel_range(
        filename: str, sheet_name: str, cell_range: str
    ) -> dict[str, Any]:
        """清除 Excel 单元格范围内容."""
        logger.info(f"MCP工具调用: clear_excel_range(filename={filename}, cell_range={cell_range})")
        return excel_handler.clear_range(filename, sheet_name, cell_range)
