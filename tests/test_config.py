"""测试配置模块."""

import pytest

from office_mcp_server.config import (
    Config,
    ExcelConfig,
    PathConfig,
    PowerPointConfig,
    ServerConfig,
    WordConfig,
)


def test_server_config_defaults() -> None:
    """测试服务器配置默认值."""
    config = ServerConfig()
    assert config.server_name == "office-mcp-server"
    assert config.version == "1.0.0"
    assert config.log_level == "INFO"
    assert config.max_file_size == 100 * 1024 * 1024


def test_word_config_defaults() -> None:
    """测试 Word 配置默认值."""
    config = WordConfig()
    assert config.default_font == "宋体"
    assert config.default_font_size == 12
    assert config.default_line_spacing == 1.5


def test_excel_config_defaults() -> None:
    """测试 Excel 配置默认值."""
    config = ExcelConfig()
    assert config.default_sheet_name == "Sheet1"
    assert config.max_rows == 1048576
    assert config.max_cols == 16384


def test_powerpoint_config_defaults() -> None:
    """测试 PowerPoint 配置默认值."""
    config = PowerPointConfig()
    assert config.default_width == 9144000
    assert config.default_height == 6858000
    assert config.default_theme == "Office Theme"


def test_config_load_from_env() -> None:
    """测试从环境变量加载配置."""
    config = Config.load_from_env()
    assert config.server.server_name == "office-mcp-server"
    assert config.word.default_font == "宋体"
    assert config.excel.default_sheet_name == "Sheet1"
    assert config.powerpoint.default_theme == "Office Theme"
