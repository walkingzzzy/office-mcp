"""测试文件管理器."""

import pytest
from pathlib import Path

from office_mcp_server.utils.file_manager import FileManager


def test_validate_file_path_valid() -> None:
    """测试验证有效文件路径."""
    path = FileManager.validate_file_path("test.docx")
    assert isinstance(path, Path)
    assert path.name == "test.docx"


def test_validate_file_path_invalid() -> None:
    """测试验证无效文件路径."""
    with pytest.raises(ValueError):
        FileManager.validate_file_path("")


def test_validate_file_extension_valid() -> None:
    """测试验证有效文件扩展名."""
    assert FileManager.validate_file_extension("test.docx", [".docx", ".doc"])


def test_validate_file_extension_invalid() -> None:
    """测试验证无效文件扩展名."""
    with pytest.raises(ValueError):
        FileManager.validate_file_extension("test.pdf", [".docx", ".doc"])


def test_get_temp_file_path() -> None:
    """测试获取临时文件路径."""
    temp_path = FileManager.get_temp_file_path(prefix="test_", suffix=".tmp")
    assert temp_path.name.startswith("test_")
    assert temp_path.suffix == ".tmp"
