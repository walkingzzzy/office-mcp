"""测试 Excel 工作簿处理器."""

import pytest
from pathlib import Path

from office_mcp_server.handlers.excel_handler import ExcelHandler
from office_mcp_server.config import config


@pytest.fixture
def excel_handler() -> ExcelHandler:
    """创建 Excel 处理器实例."""
    return ExcelHandler()


@pytest.fixture
def test_filename() -> str:
    """测试文件名."""
    return "test_workbook.xlsx"


@pytest.fixture(autouse=True)
def cleanup_output(test_filename: str) -> None:
    """测试后清理输出文件."""
    yield
    # 清理测试文件
    output_file = config.paths.output_dir / test_filename
    if output_file.exists():
        output_file.unlink()


def test_create_workbook(excel_handler: ExcelHandler, test_filename: str) -> None:
    """测试创建 Excel 工作簿."""
    result = excel_handler.create_workbook(test_filename, sheet_name="测试表")

    assert result["success"] is True
    assert "filename" in result
    assert Path(result["filename"]).exists()
    assert result["sheet_name"] == "测试表"


def test_create_workbook_default_sheet(
    excel_handler: ExcelHandler, test_filename: str
) -> None:
    """测试创建工作簿使用默认工作表名."""
    result = excel_handler.create_workbook(test_filename)

    assert result["success"] is True
    assert result["sheet_name"] == config.excel.default_sheet_name


def test_write_cell(excel_handler: ExcelHandler, test_filename: str) -> None:
    """测试写入单元格."""
    # 先创建工作簿
    excel_handler.create_workbook(test_filename, sheet_name="Sheet1")

    # 写入单元格
    result = excel_handler.write_cell(test_filename, "Sheet1", "A1", "测试数据")

    assert result["success"] is True
    assert result["cell"] == "A1"
    assert result["value"] == "测试数据"


def test_write_cell_number(excel_handler: ExcelHandler, test_filename: str) -> None:
    """测试写入数字到单元格."""
    excel_handler.create_workbook(test_filename, sheet_name="Sheet1")

    result = excel_handler.write_cell(test_filename, "Sheet1", "B2", 12345)

    assert result["success"] is True
    assert result["value"] == 12345


def test_write_cell_invalid_sheet(
    excel_handler: ExcelHandler, test_filename: str
) -> None:
    """测试写入不存在的工作表."""
    excel_handler.create_workbook(test_filename, sheet_name="Sheet1")

    result = excel_handler.write_cell(test_filename, "NonExistent", "A1", "data")

    assert result["success"] is False


def test_write_range(excel_handler: ExcelHandler, test_filename: str) -> None:
    """测试批量写入数据."""
    excel_handler.create_workbook(test_filename, sheet_name="Sheet1")

    data = [
        ["姓名", "年龄", "城市"],
        ["张三", 25, "北京"],
        ["李四", 30, "上海"],
    ]

    result = excel_handler.write_range(test_filename, "Sheet1", "A1", data)

    assert result["success"] is True
    assert result["rows"] == 3
    assert result["cols"] == 3


def test_write_range_empty_data(
    excel_handler: ExcelHandler, test_filename: str
) -> None:
    """测试批量写入空数据."""
    excel_handler.create_workbook(test_filename, sheet_name="Sheet1")

    result = excel_handler.write_range(test_filename, "Sheet1", "A1", [])

    assert result["success"] is True
    assert result["rows"] == 0
    assert result["cols"] == 0


def test_read_cell(excel_handler: ExcelHandler, test_filename: str) -> None:
    """测试读取单元格."""
    excel_handler.create_workbook(test_filename, sheet_name="Sheet1")
    excel_handler.write_cell(test_filename, "Sheet1", "C3", "测试读取")

    result = excel_handler.read_cell(test_filename, "Sheet1", "C3")

    assert result["success"] is True
    assert result["value"] == "测试读取"


def test_read_cell_empty(excel_handler: ExcelHandler, test_filename: str) -> None:
    """测试读取空单元格."""
    excel_handler.create_workbook(test_filename, sheet_name="Sheet1")

    result = excel_handler.read_cell(test_filename, "Sheet1", "D4")

    assert result["success"] is True
    assert result["value"] is None


def test_format_cell(excel_handler: ExcelHandler, test_filename: str) -> None:
    """测试格式化单元格."""
    excel_handler.create_workbook(test_filename, sheet_name="Sheet1")
    excel_handler.write_cell(test_filename, "Sheet1", "A1", "格式化测试")

    result = excel_handler.format_cell(
        test_filename,
        "Sheet1",
        "A1",
        font_name="黑体",
        font_size=14,
        bold=True,
        color="#FF0000",
        bg_color="#FFFF00",
    )

    assert result["success"] is True


def test_format_cell_partial(excel_handler: ExcelHandler, test_filename: str) -> None:
    """测试部分格式化单元格."""
    excel_handler.create_workbook(test_filename, sheet_name="Sheet1")
    excel_handler.write_cell(test_filename, "Sheet1", "B2", "部分格式化")

    result = excel_handler.format_cell(
        test_filename, "Sheet1", "B2", font_size=16, bold=True
    )

    assert result["success"] is True


def test_create_chart_bar(excel_handler: ExcelHandler, test_filename: str) -> None:
    """测试创建柱状图."""
    excel_handler.create_workbook(test_filename, sheet_name="Sheet1")

    # 准备图表数据
    data = [["类别", "数值"], ["A", 10], ["B", 20], ["C", 30]]
    excel_handler.write_range(test_filename, "Sheet1", "A1", data)

    result = excel_handler.create_chart(
        test_filename,
        "Sheet1",
        "bar",
        "A1:B4",
        title="销售数据",
        position="D2",
    )

    assert result["success"] is True
    assert result["chart_type"] == "bar"


def test_create_chart_line(excel_handler: ExcelHandler, test_filename: str) -> None:
    """测试创建折线图."""
    excel_handler.create_workbook(test_filename, sheet_name="Sheet1")

    data = [["月份", "销量"], ["1月", 100], ["2月", 150], ["3月", 200]]
    excel_handler.write_range(test_filename, "Sheet1", "A1", data)

    result = excel_handler.create_chart(
        test_filename, "Sheet1", "line", "A1:B4", title="月度销量"
    )

    assert result["success"] is True
    assert result["chart_type"] == "line"


def test_create_chart_pie(excel_handler: ExcelHandler, test_filename: str) -> None:
    """测试创建饼图."""
    excel_handler.create_workbook(test_filename, sheet_name="Sheet1")

    data = [["产品", "份额"], ["产品A", 40], ["产品B", 35], ["产品C", 25]]
    excel_handler.write_range(test_filename, "Sheet1", "A1", data)

    result = excel_handler.create_chart(
        test_filename, "Sheet1", "pie", "A1:B4", title="市场份额"
    )

    assert result["success"] is True
    assert result["chart_type"] == "pie"


def test_create_chart_invalid_type(
    excel_handler: ExcelHandler, test_filename: str
) -> None:
    """测试无效图表类型."""
    excel_handler.create_workbook(test_filename, sheet_name="Sheet1")

    data = [["X", "Y"], [1, 2], [3, 4]]
    excel_handler.write_range(test_filename, "Sheet1", "A1", data)

    result = excel_handler.create_chart(
        test_filename, "Sheet1", "invalid_type", "A1:B3"
    )

    assert result["success"] is False


def test_get_workbook_info(excel_handler: ExcelHandler, test_filename: str) -> None:
    """测试获取工作簿信息."""
    excel_handler.create_workbook(test_filename, sheet_name="测试表1")

    result = excel_handler.get_workbook_info(test_filename)

    assert result["success"] is True
    assert result["sheet_count"] == 1
    assert "测试表1" in result["sheet_names"]


def test_get_workbook_info_nonexistent(excel_handler: ExcelHandler) -> None:
    """测试获取不存在工作簿的信息."""
    result = excel_handler.get_workbook_info("nonexistent.xlsx")

    assert result["success"] is False


def test_invalid_file_extension(excel_handler: ExcelHandler) -> None:
    """测试无效文件扩展名."""
    result = excel_handler.create_workbook("test.txt")

    assert result["success"] is False
