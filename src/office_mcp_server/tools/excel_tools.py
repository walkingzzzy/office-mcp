"""Excel MCP 工具定义模块."""

from typing import Any, Optional, Union

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.excel_handler import ExcelHandler

# 创建 Excel 处理器实例
excel_handler = ExcelHandler()


def register_excel_tools(mcp: FastMCP) -> None:
    """注册 Excel 工具到 MCP 服务器."""

    @mcp.tool()
    def create_excel_workbook(filename: str, sheet_name: Optional[str] = None) -> dict[str, Any]:
        """创建 Excel 工作簿."""
        logger.info(f"MCP工具调用: create_excel_workbook(filename={filename})")
        return excel_handler.create_workbook(filename, sheet_name)

    @mcp.tool()
    def write_excel_cell(
        filename: str, sheet_name: str, cell: str, value: Union[str, int, float]
    ) -> dict[str, Any]:
        """写入 Excel 单元格数据."""
        logger.info(f"MCP工具调用: write_excel_cell(filename={filename}, cell={cell})")
        return excel_handler.write_cell(filename, sheet_name, cell, value)

    @mcp.tool()
    def write_excel_range(
        filename: str, sheet_name: str, start_cell: str, data: list[list[Any]]
    ) -> dict[str, Any]:
        """批量写入 Excel 数据."""
        logger.info(f"MCP工具调用: write_excel_range(filename={filename})")
        return excel_handler.write_range(filename, sheet_name, start_cell, data)

    @mcp.tool()
    def read_excel_cell(filename: str, sheet_name: str, cell: str) -> dict[str, Any]:
        """读取 Excel 单元格数据."""
        logger.info(f"MCP工具调用: read_excel_cell(filename={filename}, cell={cell})")
        return excel_handler.read_cell(filename, sheet_name, cell)

    @mcp.tool()
    def format_excel_cell(
        filename: str,
        sheet_name: str,
        cell: str,
        font_name: Optional[str] = None,
        font_size: Optional[int] = None,
        bold: bool = False,
        color: Optional[str] = None,
        bg_color: Optional[str] = None,
        number_format: Optional[str] = None,
        horizontal_alignment: Optional[str] = None,
        vertical_alignment: Optional[str] = None,
        wrap_text: bool = False,
        border_style: Optional[str] = None,
        border_color: Optional[str] = None,
    ) -> dict[str, Any]:
        """格式化 Excel 单元格.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            cell: 单元格引用 (如 'A1')
            font_name: 字体名称 (可选)
            font_size: 字号 (可选)
            bold: 是否加粗 (默认 False)
            color: 文字颜色 HEX格式 (如 '#FF0000', 可选)
            bg_color: 背景颜色 HEX格式 (如 '#FFFF00', 可选)
            number_format: 数字格式 ('0.00'小数, '#,##0'千分位, '0%'百分比, 'yyyy-mm-dd'日期, '$#,##0.00'货币, '@'文本, 可选)
            horizontal_alignment: 水平对齐 ('left', 'center', 'right', 'justify', 可选)
            vertical_alignment: 垂直对齐 ('top', 'center', 'bottom', 可选)
            wrap_text: 是否自动换行 (默认 False)
            border_style: 边框样式 ('thin', 'medium', 'thick', 'double', 可选)
            border_color: 边框颜色 HEX格式 (可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: format_excel_cell(filename={filename}, cell={cell})")
        return excel_handler.format_cell(
            filename, sheet_name, cell, font_name, font_size, bold, color, bg_color,
            number_format, horizontal_alignment, vertical_alignment, wrap_text,
            border_style, border_color
        )

    @mcp.tool()
    def create_excel_chart(
        filename: str,
        sheet_name: str,
        chart_type: str,
        data_range: str,
        title: str = "",
        position: str = "E5",
        x_axis_title: Optional[str] = None,
        y_axis_title: Optional[str] = None,
        legend_position: Optional[str] = None,
        show_data_labels: bool = False,
    ) -> dict[str, Any]:
        """创建 Excel 图表.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            chart_type: 图表类型 ('bar'柱状图, 'line'折线图, 'pie'饼图, 'area'面积图,
                       'scatter'散点图, 'bubble'气泡图, 'radar'雷达图, 'doughnut'圆环图)
            data_range: 数据范围 (如 'A1:B10')
            title: 图表标题 (默认 '')
            position: 图表位置 (默认 'E5')
            x_axis_title: X轴标题 (可选)
            y_axis_title: Y轴标题 (可选)
            legend_position: 图例位置 ('r'右, 'l'左, 't'上, 'b'下, 可选)
            show_data_labels: 是否显示数据标签 (默认 False)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: create_excel_chart(filename={filename})")
        return excel_handler.create_chart(
            filename, sheet_name, chart_type, data_range, title, position,
            x_axis_title, y_axis_title, legend_position, show_data_labels
        )

    @mcp.tool()
    def get_excel_workbook_info(filename: str) -> dict[str, Any]:
        """获取 Excel 工作簿信息."""
        logger.info(f"MCP工具调用: get_excel_workbook_info(filename={filename})")
        return excel_handler.get_workbook_info(filename)

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

    # ========== 行列操作工具 ==========
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

    # ========== 单元格合并工具 ==========
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

    # ========== 数据读取增强工具 ==========
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

    # ========== 自动填充工具 ==========
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

    # ========== 数据导入导出工具 ==========
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

    # ========== 工作簿高级操作工具 ==========
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

    # ========== 图表高级操作工具 ==========
    @mcp.tool()
    def format_excel_chart(
        filename: str,
        sheet_name: str,
        chart_index: int = 0,
        title_font_size: Optional[int] = None,
        title_font_bold: bool = False,
        chart_style: Optional[int] = None,
        color_scheme: Optional[list[str]] = None,
    ) -> dict[str, Any]:
        """格式化 Excel 图表."""
        logger.info(f"MCP工具调用: format_excel_chart(filename={filename}, chart_index={chart_index})")
        return excel_handler.format_chart(
            filename, sheet_name, chart_index, title_font_size, title_font_bold, chart_style, color_scheme
        )

    @mcp.tool()
    def create_excel_combination_chart(
        filename: str,
        sheet_name: str,
        data_range1: str,
        data_range2: str,
        chart_type1: str = "bar",
        chart_type2: str = "line",
        title: str = "",
        position: str = "E5",
    ) -> dict[str, Any]:
        """创建 Excel 组合图表."""
        logger.info(f"MCP工具调用: create_excel_combination_chart(filename={filename})")
        return excel_handler.create_combination_chart(
            filename, sheet_name, data_range1, data_range2, chart_type1, chart_type2, title, position
        )

    # ========== 打印设置工具 ==========
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
        filename: str, sheet_name: str, print_area: Optional[str] = None
    ) -> dict[str, Any]:
        """设置 Excel 打印区域."""
        logger.info(f"MCP工具调用: set_excel_print_area(filename={filename}, area={print_area})")
        return excel_handler.set_print_area(filename, sheet_name, print_area)

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
        filename: str, sheet_name: str, break_type: str, position: int
    ) -> dict[str, Any]:
        """插入 Excel 分页符.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            break_type: 分页符类型 ('row'行分页符, 'col'列分页符)
            position: 位置索引
        """
        logger.info(f"MCP工具调用: insert_excel_page_break(filename={filename}, type={break_type})")
        return excel_handler.insert_page_break(filename, sheet_name, break_type, position)

    # ========== 批量处理工具 ==========
    @mcp.tool()
    def batch_process_excel_files(
        pattern: str, operation: str, **kwargs: Any
    ) -> dict[str, Any]:
        """批量处理 Excel 文件.

        Args:
            pattern: 文件匹配模式 (如 '*.xlsx', 'report_*.xlsx')
            operation: 操作类型 ('format'格式化, 'export'导出)
            kwargs: 其他参数
        """
        logger.info(f"MCP工具调用: batch_process_excel_files(pattern={pattern}, operation={operation})")
        return excel_handler.batch_process_files(pattern, operation, **kwargs)

    @mcp.tool()
    def merge_excel_workbooks(
        source_files: list[str], output_file: str, merge_mode: str = "sheets"
    ) -> dict[str, Any]:
        """合并多个 Excel 工作簿.

        Args:
            source_files: 源文件列表
            output_file: 输出文件名
            merge_mode: 合并模式 ('sheets'合并为多个工作表, 'append'追加到同一工作表)
        """
        logger.info(f"MCP工具调用: merge_excel_workbooks(output={output_file}, mode={merge_mode})")
        return excel_handler.merge_workbooks(source_files, output_file, merge_mode)

    # ========== 数据分析工具 ==========
    @mcp.tool()
    def excel_descriptive_statistics(
        filename: str, sheet_name: str, data_range: str
    ) -> dict[str, Any]:
        """Excel 描述性统计分析."""
        logger.info(f"MCP工具调用: excel_descriptive_statistics(filename={filename}, range={data_range})")
        return excel_handler.descriptive_statistics(filename, sheet_name, data_range)

    @mcp.tool()
    def excel_correlation_analysis(
        filename: str, sheet_name: str, data_range1: str, data_range2: str
    ) -> dict[str, Any]:
        """Excel 相关性分析."""
        logger.info(f"MCP工具调用: excel_correlation_analysis(filename={filename})")
        return excel_handler.correlation_analysis(filename, sheet_name, data_range1, data_range2)

    @mcp.tool()
    def excel_goal_seek(
        filename: str,
        sheet_name: str,
        target_cell: str,
        target_value: float,
        variable_cell: str,
        max_iterations: int = 100,
        tolerance: float = 0.001,
    ) -> dict[str, Any]:
        """Excel 单变量求解 (目标搜索)."""
        logger.info(f"MCP工具调用: excel_goal_seek(filename={filename}, target={target_cell})")
        return excel_handler.goal_seek(
            filename, sheet_name, target_cell, target_value, variable_cell, max_iterations, tolerance
        )

    # ========== 协作功能工具 ==========
    @mcp.tool()
    def add_excel_comment(
        filename: str, sheet_name: str, cell: str, comment_text: str, author: str = "User"
    ) -> dict[str, Any]:
        """添加 Excel 批注."""
        logger.info(f"MCP工具调用: add_excel_comment(filename={filename}, cell={cell})")
        return excel_handler.add_comment(filename, sheet_name, cell, comment_text, author)

    @mcp.tool()
    def get_excel_comment(filename: str, sheet_name: str, cell: str) -> dict[str, Any]:
        """获取 Excel 批注."""
        logger.info(f"MCP工具调用: get_excel_comment(filename={filename}, cell={cell})")
        return excel_handler.get_comment(filename, sheet_name, cell)

    @mcp.tool()
    def delete_excel_comment(filename: str, sheet_name: str, cell: str) -> dict[str, Any]:
        """删除 Excel 批注."""
        logger.info(f"MCP工具调用: delete_excel_comment(filename={filename}, cell={cell})")
        return excel_handler.delete_comment(filename, sheet_name, cell)

    @mcp.tool()
    def list_all_excel_comments(filename: str, sheet_name: str) -> dict[str, Any]:
        """列出所有 Excel 批注."""
        logger.info(f"MCP工具调用: list_all_excel_comments(filename={filename})")
        return excel_handler.list_all_comments(filename, sheet_name)

    # ========== 安全功能工具 ==========
    @mcp.tool()
    def encrypt_excel_workbook(filename: str, password: str) -> dict[str, Any]:
        """加密 Excel 工作簿."""
        logger.info(f"MCP工具调用: encrypt_excel_workbook(filename={filename})")
        return excel_handler.encrypt_workbook(filename, password)

    @mcp.tool()
    def lock_excel_cells(
        filename: str, sheet_name: str, cell_range: str, locked: bool = True
    ) -> dict[str, Any]:
        """锁定/解锁 Excel 单元格."""
        logger.info(f"MCP工具调用: lock_excel_cells(filename={filename}, range={cell_range}, locked={locked})")
        return excel_handler.lock_cells(filename, sheet_name, cell_range, locked)

    @mcp.tool()
    def hide_excel_formulas(
        filename: str, sheet_name: str, cell_range: str, hidden: bool = True
    ) -> dict[str, Any]:
        """隐藏/显示 Excel 公式."""
        logger.info(f"MCP工具调用: hide_excel_formulas(filename={filename}, range={cell_range}, hidden={hidden})")
        return excel_handler.hide_formulas(filename, sheet_name, cell_range, hidden)

    # ========== 报表自动化工具 ==========
    @mcp.tool()
    def generate_excel_report_from_template(
        template_file: str,
        output_file: str,
        data: dict[str, Any],
        mappings: Optional[dict[str, str]] = None,
    ) -> dict[str, Any]:
        """基于模板生成 Excel 报表."""
        logger.info(f"MCP工具调用: generate_excel_report_from_template(template={template_file})")
        return excel_handler.generate_report_from_template(template_file, output_file, data, mappings)

    @mcp.tool()
    def update_excel_report_data(
        filename: str, sheet_name: str, updates: dict[str, Any]
    ) -> dict[str, Any]:
        """更新 Excel 报表数据."""
        logger.info(f"MCP工具调用: update_excel_report_data(filename={filename})")
        return excel_handler.update_report_data(filename, sheet_name, updates)

    @mcp.tool()
    def consolidate_excel_reports(
        source_files: list[str],
        output_file: str,
        sheet_name: str = "Consolidated",
        include_source_name: bool = True,
    ) -> dict[str, Any]:
        """合并多个 Excel 报表."""
        logger.info(f"MCP工具调用: consolidate_excel_reports(output={output_file})")
        return excel_handler.consolidate_reports(source_files, output_file, sheet_name, include_source_name)

    @mcp.tool()
    def schedule_excel_report_generation(
        template_file: str, output_pattern: str, data_source: str, frequency: str = "daily"
    ) -> dict[str, Any]:
        """计划 Excel 报表生成."""
        logger.info(f"MCP工具调用: schedule_excel_report_generation(template={template_file})")
        return excel_handler.schedule_report_generation(template_file, output_pattern, data_source, frequency)

    # ========== 高级统计分析工具 ==========
    @mcp.tool()
    def excel_regression_analysis(
        filename: str,
        sheet_name: str,
        x_range: str,
        y_range: str,
        regression_type: str = "linear",
    ) -> dict[str, Any]:
        """Excel 回归分析.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            x_range: 自变量范围 (如 'A1:A100')
            y_range: 因变量范围 (如 'B1:B100')
            regression_type: 回归类型 ('linear'线性回归, 'polynomial'多项式回归, 默认 'linear')

        Returns:
            dict: 回归分析结果,包括系数、R²、方程等
        """
        logger.info(f"MCP工具调用: excel_regression_analysis(filename={filename}, type={regression_type})")
        return excel_handler.regression_analysis(filename, sheet_name, x_range, y_range, regression_type)

    @mcp.tool()
    def excel_anova(
        filename: str,
        sheet_name: str,
        group_ranges: list[str],
    ) -> dict[str, Any]:
        """Excel 方差分析 (ANOVA).

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            group_ranges: 各组数据范围列表 (如 ['A1:A10', 'B1:B10', 'C1:C10'])

        Returns:
            dict: 方差分析结果,包括F统计量、p值、显著性判断等
        """
        logger.info(f"MCP工具调用: excel_anova(filename={filename}, groups={len(group_ranges)})")
        return excel_handler.anova_analysis(filename, sheet_name, *group_ranges)

    @mcp.tool()
    def excel_t_test(
        filename: str,
        sheet_name: str,
        group1_range: str,
        group2_range: str,
        test_type: str = "independent",
    ) -> dict[str, Any]:
        """Excel t检验.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            group1_range: 第一组数据范围 (如 'A1:A20')
            group2_range: 第二组数据范围 (如 'B1:B20')
            test_type: 检验类型 ('independent'独立样本t检验, 'paired'配对样本t检验, 默认 'independent')

        Returns:
            dict: t检验结果,包括t统计量、p值、显著性判断等
        """
        logger.info(f"MCP工具调用: excel_t_test(filename={filename}, type={test_type})")
        return excel_handler.t_test(filename, sheet_name, group1_range, group2_range, test_type)

    @mcp.tool()
    def excel_chi_square_test(
        filename: str,
        sheet_name: str,
        observed_range: str,
    ) -> dict[str, Any]:
        """Excel 卡方检验.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            observed_range: 观测频数范围 (如 'A1:B2' 代表2x2列联表)

        Returns:
            dict: 卡方检验结果,包括卡方统计量、p值、期望频数等
        """
        logger.info(f"MCP工具调用: excel_chi_square_test(filename={filename})")
        return excel_handler.chi_square_test(filename, sheet_name, observed_range)

    @mcp.tool()
    def excel_trend_analysis(
        filename: str,
        sheet_name: str,
        data_range: str,
        periods_ahead: int = 5,
    ) -> dict[str, Any]:
        """Excel 趋势分析和预测.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            data_range: 时间序列数据范围 (如 'A1:A50')
            periods_ahead: 预测未来期数 (默认 5)

        Returns:
            dict: 趋势分析结果,包括趋势方向、预测值、R²等
        """
        logger.info(f"MCP工具调用: excel_trend_analysis(filename={filename}, periods={periods_ahead})")
        return excel_handler.trend_analysis(filename, sheet_name, data_range, periods_ahead)

    @mcp.tool()
    def excel_moving_average(
        filename: str,
        sheet_name: str,
        data_range: str,
        window: int = 3,
        output_cell: Optional[str] = None,
    ) -> dict[str, Any]:
        """Excel 移动平均计算.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            data_range: 数据范围 (如 'A1:A50')
            window: 移动窗口大小 (默认 3)
            output_cell: 输出起始单元格 (如 'B1', 可选)

        Returns:
            dict: 移动平均结果
        """
        logger.info(f"MCP工具调用: excel_moving_average(filename={filename}, window={window})")
        return excel_handler.moving_average(filename, sheet_name, data_range, window, output_cell)

    @mcp.tool()
    def excel_exponential_smoothing(
        filename: str,
        sheet_name: str,
        data_range: str,
        alpha: float = 0.3,
        output_cell: Optional[str] = None,
    ) -> dict[str, Any]:
        """Excel 指数平滑计算.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            data_range: 数据范围 (如 'A1:A50')
            alpha: 平滑系数 (0-1之间, 默认 0.3)
            output_cell: 输出起始单元格 (如 'B1', 可选)

        Returns:
            dict: 指数平滑结果
        """
        logger.info(f"MCP工具调用: excel_exponential_smoothing(filename={filename}, alpha={alpha})")
        return excel_handler.exponential_smoothing(filename, sheet_name, data_range, alpha, output_cell)

    # ========== 行列操作补充工具 ==========
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

    # ========== 图表趋势线工具 ==========
    @mcp.tool()
    def add_excel_chart_trendline(
        filename: str,
        sheet_name: str,
        chart_index: int = 0,
        series_index: int = 0,
        trendline_type: str = "linear",
        display_equation: bool = False,
        display_r_squared: bool = False,
    ) -> dict[str, Any]:
        """为 Excel 图表添加趋势线.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            chart_index: 图表索引 (默认 0)
            series_index: 系列索引 (默认 0)
            trendline_type: 趋势线类型 ('linear'线性, 'exp'指数, 'log'对数,
                           'poly'多项式, 'power'幂, 'movingAvg'移动平均, 默认 'linear')
            display_equation: 是否显示趋势线方程 (默认 False)
            display_r_squared: 是否显示R²值 (默认 False)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_excel_chart_trendline(filename={filename}, type={trendline_type})")
        return excel_handler.add_trendline_to_chart(
            filename, sheet_name, chart_index, series_index,
            trendline_type, display_equation, display_r_squared
        )

    # ========== 工作簿高级操作补充工具 ==========
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

    # ========== 单元格高级操作工具 ==========
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

    # ========== 数据透视表增强工具 ==========
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

    # ========== 数据脱敏工具 ==========
    @mcp.tool()
    def mask_excel_data(
        filename: str,
        sheet_name: str,
        cell_range: str,
        mask_type: str,
        mask_char: str = "*",
        keep_first: int = 0,
        keep_last: int = 0,
        custom_pattern: Optional[str] = None,
    ) -> dict[str, Any]:
        """Excel 数据脱敏处理.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            cell_range: 单元格范围
            mask_type: 脱敏类型 ('phone'手机号, 'email'邮箱, 'id_card'身份证,
                      'credit_card'信用卡, 'name'姓名, 'custom'自定义)
            mask_char: 脱敏字符 (默认 '*')
            keep_first: 保留前N位 (用于custom类型)
            keep_last: 保留后N位 (用于custom类型)
            custom_pattern: 自定义正则表达式模式 (可选)

        Returns:
            dict: 操作结果

        Examples:
            phone: 138****5678
            email: abc***@example.com
            id_card: 110***********1234
            credit_card: 6222 **** **** 1234
            name: 张* 或 李**
        """
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
        """检测 Excel 中的敏感数据.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            cell_range: 单元格范围 (可选, 默认检测整表)

        Returns:
            dict: 检测结果,包含敏感数据的位置和类型
        """
        logger.info(f"MCP工具调用: detect_excel_sensitive_data(filename={filename})")
        return excel_handler.detect_sensitive_data(filename, sheet_name, cell_range)

    @mcp.tool()
    def hash_excel_data(
        filename: str,
        sheet_name: str,
        cell_range: str,
        algorithm: str = "sha256",
    ) -> dict[str, Any]:
        """Excel 数据哈希加密.

        Args:
            filename: 文件名
            sheet_name: 工作表名称
            cell_range: 单元格范围
            algorithm: 哈希算法 ('md5', 'sha256', 默认 'sha256')

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: hash_excel_data(filename={filename}, algorithm={algorithm})")
        return excel_handler.hash_data(filename, sheet_name, cell_range, algorithm)

    logger.info("Excel MCP 工具注册完成")
