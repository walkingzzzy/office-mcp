"""测试 PowerPoint 演示文稿处理器."""

import pytest
from pathlib import Path

from office_mcp_server.handlers.ppt_handler import PowerPointHandler
from office_mcp_server.config import config


@pytest.fixture
def ppt_handler() -> PowerPointHandler:
    """创建 PowerPoint 处理器实例."""
    return PowerPointHandler()


@pytest.fixture
def test_filename() -> str:
    """测试文件名."""
    return "test_presentation.pptx"


@pytest.fixture(autouse=True)
def cleanup_output(test_filename: str) -> None:
    """测试后清理输出文件."""
    yield
    # 清理测试文件
    output_file = config.paths.output_dir / test_filename
    if output_file.exists():
        output_file.unlink()


def test_create_presentation(ppt_handler: PowerPointHandler, test_filename: str) -> None:
    """测试创建 PowerPoint 演示文稿."""
    result = ppt_handler.create_presentation(test_filename, title="测试演示")

    assert result["success"] is True
    assert "filename" in result
    assert Path(result["filename"]).exists()
    assert result["title"] == "测试演示"


def test_create_presentation_without_title(
    ppt_handler: PowerPointHandler, test_filename: str
) -> None:
    """测试创建无标题演示文稿."""
    result = ppt_handler.create_presentation(test_filename)

    assert result["success"] is True
    assert Path(result["filename"]).exists()


def test_add_slide(ppt_handler: PowerPointHandler, test_filename: str) -> None:
    """测试添加幻灯片."""
    # 先创建演示文稿
    ppt_handler.create_presentation(test_filename, title="测试")

    # 添加幻灯片
    result = ppt_handler.add_slide(test_filename, layout_index=1, title="第一页")

    assert result["success"] is True
    assert "slide_count" in result
    assert result["slide_count"] >= 1


def test_add_slide_title_layout(
    ppt_handler: PowerPointHandler, test_filename: str
) -> None:
    """测试添加标题布局幻灯片."""
    ppt_handler.create_presentation(test_filename)

    result = ppt_handler.add_slide(test_filename, layout_index=0, title="标题页")

    assert result["success"] is True


def test_add_slide_without_title(
    ppt_handler: PowerPointHandler, test_filename: str
) -> None:
    """测试添加无标题幻灯片."""
    ppt_handler.create_presentation(test_filename)

    result = ppt_handler.add_slide(test_filename, layout_index=1)

    assert result["success"] is True


def test_add_text(ppt_handler: PowerPointHandler, test_filename: str) -> None:
    """测试添加文本框."""
    ppt_handler.create_presentation(test_filename, title="测试")

    result = ppt_handler.add_text(
        test_filename,
        slide_index=0,
        text="这是一段测试文本",
        left_inches=2.0,
        top_inches=2.0,
        width_inches=6.0,
        height_inches=1.5,
    )

    assert result["success"] is True


def test_add_text_default_position(
    ppt_handler: PowerPointHandler, test_filename: str
) -> None:
    """测试使用默认位置添加文本框."""
    ppt_handler.create_presentation(test_filename, title="测试")

    result = ppt_handler.add_text(test_filename, slide_index=0, text="默认位置文本")

    assert result["success"] is True


def test_add_text_invalid_slide_index(
    ppt_handler: PowerPointHandler, test_filename: str
) -> None:
    """测试无效幻灯片索引."""
    ppt_handler.create_presentation(test_filename, title="测试")

    result = ppt_handler.add_text(test_filename, slide_index=999, text="测试文本")

    assert result["success"] is False


def test_add_table(ppt_handler: PowerPointHandler, test_filename: str) -> None:
    """测试添加表格."""
    ppt_handler.create_presentation(test_filename, title="测试")

    data = [
        ["姓名", "职位", "部门"],
        ["张三", "工程师", "研发部"],
        ["李四", "经理", "市场部"],
    ]

    result = ppt_handler.add_table(test_filename, slide_index=0, rows=3, cols=3, data=data)

    assert result["success"] is True
    assert result["rows"] == 3
    assert result["cols"] == 3


def test_add_table_without_data(
    ppt_handler: PowerPointHandler, test_filename: str
) -> None:
    """测试添加空表格."""
    ppt_handler.create_presentation(test_filename, title="测试")

    result = ppt_handler.add_table(test_filename, slide_index=0, rows=2, cols=4)

    assert result["success"] is True


def test_add_table_invalid_slide(
    ppt_handler: PowerPointHandler, test_filename: str
) -> None:
    """测试在无效幻灯片上添加表格."""
    ppt_handler.create_presentation(test_filename, title="测试")

    result = ppt_handler.add_table(test_filename, slide_index=100, rows=2, cols=2)

    assert result["success"] is False


def test_get_presentation_info(
    ppt_handler: PowerPointHandler, test_filename: str
) -> None:
    """测试获取演示文稿信息."""
    ppt_handler.create_presentation(test_filename, title="测试")
    ppt_handler.add_slide(test_filename, layout_index=1, title="第一页")
    ppt_handler.add_slide(test_filename, layout_index=1, title="第二页")

    result = ppt_handler.get_presentation_info(test_filename)

    assert result["success"] is True
    assert "slide_count" in result
    assert result["slide_count"] >= 2


def test_get_presentation_info_nonexistent(ppt_handler: PowerPointHandler) -> None:
    """测试获取不存在演示文稿的信息."""
    result = ppt_handler.get_presentation_info("nonexistent.pptx")

    assert result["success"] is False


def test_invalid_file_extension(ppt_handler: PowerPointHandler) -> None:
    """测试无效文件扩展名."""
    result = ppt_handler.create_presentation("test.txt")

    assert result["success"] is False


def test_multiple_operations(ppt_handler: PowerPointHandler, test_filename: str) -> None:
    """测试多个操作组合."""
    # 创建演示文稿
    result = ppt_handler.create_presentation(test_filename, title="综合测试")
    assert result["success"] is True

    # 添加幻灯片
    result = ppt_handler.add_slide(test_filename, layout_index=1, title="内容页")
    assert result["success"] is True

    # 添加文本
    result = ppt_handler.add_text(
        test_filename, slide_index=1, text="这是内容页的文本"
    )
    assert result["success"] is True

    # 添加表格
    data = [["列1", "列2"], ["数据1", "数据2"]]
    result = ppt_handler.add_table(test_filename, slide_index=1, rows=2, cols=2, data=data)
    assert result["success"] is True

    # 获取信息
    result = ppt_handler.get_presentation_info(test_filename)
    assert result["success"] is True
    assert result["slide_count"] >= 2
