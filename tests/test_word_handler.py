"""测试 Word 文档处理器."""

import pytest
from pathlib import Path

from office_mcp_server.handlers.word_handler import WordHandler
from office_mcp_server.config import config


@pytest.fixture
def word_handler() -> WordHandler:
    """创建 Word 处理器实例."""
    return WordHandler()


@pytest.fixture
def test_filename() -> str:
    """测试文件名."""
    return "test_document.docx"


@pytest.fixture(autouse=True)
def cleanup_output(test_filename: str) -> None:
    """测试后清理输出文件."""
    yield
    # 清理测试文件
    output_file = config.paths.output_dir / test_filename
    if output_file.exists():
        output_file.unlink()


def test_create_document(word_handler: WordHandler, test_filename: str) -> None:
    """测试创建 Word 文档."""
    result = word_handler.create_document(
        test_filename, title="测试文档", content="这是测试内容"
    )

    assert result["success"] is True
    assert "filename" in result
    assert Path(result["filename"]).exists()


def test_create_document_without_content(
    word_handler: WordHandler, test_filename: str
) -> None:
    """测试创建空文档."""
    result = word_handler.create_document(test_filename)

    assert result["success"] is True
    assert Path(result["filename"]).exists()


def test_insert_text(word_handler: WordHandler, test_filename: str) -> None:
    """测试插入文本."""
    # 先创建文档
    word_handler.create_document(test_filename, content="初始内容")

    # 插入文本
    result = word_handler.insert_text(test_filename, "新增内容", position="end")

    assert result["success"] is True


def test_add_heading(word_handler: WordHandler, test_filename: str) -> None:
    """测试添加标题."""
    # 先创建文档
    word_handler.create_document(test_filename)

    # 添加标题
    result = word_handler.add_heading(test_filename, "一级标题", level=1)

    assert result["success"] is True
    assert result["level"] == 1


def test_add_heading_invalid_level(
    word_handler: WordHandler, test_filename: str
) -> None:
    """测试无效标题级别."""
    word_handler.create_document(test_filename)

    result = word_handler.add_heading(test_filename, "标题", level=10)

    assert result["success"] is False


def test_format_text(word_handler: WordHandler, test_filename: str) -> None:
    """测试格式化文本."""
    # 创建文档
    word_handler.create_document(test_filename, content="测试内容")

    # 格式化第一段
    result = word_handler.format_text(
        test_filename,
        paragraph_index=0,
        font_name="黑体",
        font_size=14,
        bold=True,
        color="#FF0000",
    )

    assert result["success"] is True


def test_format_text_invalid_index(
    word_handler: WordHandler, test_filename: str
) -> None:
    """测试无效段落索引."""
    word_handler.create_document(test_filename, content="测试内容")

    result = word_handler.format_text(test_filename, paragraph_index=999)

    assert result["success"] is False


def test_create_table(word_handler: WordHandler, test_filename: str) -> None:
    """测试创建表格."""
    word_handler.create_document(test_filename)

    data = [
        ["姓名", "年龄", "城市"],
        ["张三", "25", "北京"],
        ["李四", "30", "上海"],
    ]

    result = word_handler.create_table(test_filename, rows=3, cols=3, data=data)

    assert result["success"] is True
    assert result["rows"] == 3
    assert result["cols"] == 3


def test_create_table_without_data(
    word_handler: WordHandler, test_filename: str
) -> None:
    """测试创建空表格."""
    word_handler.create_document(test_filename)

    result = word_handler.create_table(test_filename, rows=2, cols=3)

    assert result["success"] is True


def test_add_page_break(word_handler: WordHandler, test_filename: str) -> None:
    """测试添加分页符."""
    word_handler.create_document(test_filename, content="第一页")

    result = word_handler.add_page_break(test_filename)

    assert result["success"] is True


def test_get_document_info(word_handler: WordHandler, test_filename: str) -> None:
    """测试获取文档信息."""
    word_handler.create_document(test_filename, title="测试", content="测试内容")
    word_handler.add_heading(test_filename, "标题", level=1)

    result = word_handler.get_document_info(test_filename)

    assert result["success"] is True
    assert "paragraph_count" in result
    assert "table_count" in result
    assert "word_count" in result
    assert result["paragraph_count"] > 0


def test_get_document_info_nonexistent(
    word_handler: WordHandler,
) -> None:
    """测试获取不存在文档的信息."""
    result = word_handler.get_document_info("nonexistent.docx")

    assert result["success"] is False


def test_invalid_file_extension(word_handler: WordHandler) -> None:
    """测试无效文件扩展名."""
    result = word_handler.create_document("test.txt")

    assert result["success"] is False
