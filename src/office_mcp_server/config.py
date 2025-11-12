"""配置管理模块.

提供应用配置管理功能,支持环境变量和配置文件。
"""

import os
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, Field
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()


class ServerConfig(BaseModel):
    """MCP 服务器配置."""

    server_name: str = Field(default="office-mcp-server", description="服务器名称")
    version: str = Field(default="1.0.0", description="服务器版本")
    log_level: str = Field(default="INFO", description="日志级别")
    max_file_size: int = Field(default=100 * 1024 * 1024, description="最大文件大小(字节)")


class PathConfig(BaseModel):
    """路径配置."""

    temp_dir: Path = Field(default_factory=lambda: Path("temp"), description="临时文件目录")
    output_dir: Path = Field(
        default_factory=lambda: Path("output"), description="输出文件目录"
    )
    template_dir: Path = Field(
        default_factory=lambda: Path("templates"), description="模板文件目录"
    )

    def __init__(self, **data):
        """初始化路径配置."""
        super().__init__(**data)
        # 确保目录存在
        for directory in [self.temp_dir, self.output_dir, self.template_dir]:
            directory.mkdir(parents=True, exist_ok=True)


class WordConfig(BaseModel):
    """Word 文档处理配置."""

    default_font: str = Field(default="宋体", description="默认字体")
    default_font_size: int = Field(default=12, description="默认字号")
    default_line_spacing: float = Field(default=1.5, description="默认行距")


class ExcelConfig(BaseModel):
    """Excel 表格处理配置."""

    default_sheet_name: str = Field(default="Sheet1", description="默认工作表名称")
    max_rows: int = Field(default=1048576, description="最大行数")
    max_cols: int = Field(default=16384, description="最大列数")


class PowerPointConfig(BaseModel):
    """PowerPoint 演示配置."""

    default_width: int = Field(default=9144000, description="默认宽度(EMU)")
    default_height: int = Field(default=6858000, description="默认高度(EMU)")
    default_theme: str = Field(default="Office Theme", description="默认主题")


class Config(BaseModel):
    """应用总配置."""

    server: ServerConfig = Field(default_factory=ServerConfig)
    paths: PathConfig = Field(default_factory=PathConfig)
    word: WordConfig = Field(default_factory=WordConfig)
    excel: ExcelConfig = Field(default_factory=ExcelConfig)
    powerpoint: PowerPointConfig = Field(default_factory=PowerPointConfig)

    @classmethod
    def load_from_env(cls) -> "Config":
        """从环境变量加载配置.

        Returns:
            Config: 配置对象
        """
        return cls(
            server=ServerConfig(
                server_name=os.getenv("SERVER_NAME", "office-mcp-server"),
                version=os.getenv("SERVER_VERSION", "1.0.0"),
                log_level=os.getenv("LOG_LEVEL", "INFO"),
                max_file_size=int(os.getenv("MAX_FILE_SIZE", str(100 * 1024 * 1024))),
            ),
            paths=PathConfig(
                temp_dir=Path(os.getenv("TEMP_DIR", "temp")),
                output_dir=Path(os.getenv("OUTPUT_DIR", "output")),
                template_dir=Path(os.getenv("TEMPLATE_DIR", "templates")),
            ),
            word=WordConfig(
                default_font=os.getenv("WORD_DEFAULT_FONT", "宋体"),
                default_font_size=int(os.getenv("WORD_DEFAULT_FONT_SIZE", "12")),
                default_line_spacing=float(os.getenv("WORD_DEFAULT_LINE_SPACING", "1.5")),
            ),
            excel=ExcelConfig(
                default_sheet_name=os.getenv("EXCEL_DEFAULT_SHEET_NAME", "Sheet1"),
                max_rows=int(os.getenv("EXCEL_MAX_ROWS", "1048576")),
                max_cols=int(os.getenv("EXCEL_MAX_COLS", "16384")),
            ),
            powerpoint=PowerPointConfig(
                default_width=int(os.getenv("PPT_DEFAULT_WIDTH", "9144000")),
                default_height=int(os.getenv("PPT_DEFAULT_HEIGHT", "6858000")),
                default_theme=os.getenv("PPT_DEFAULT_THEME", "Office Theme"),
            ),
        )


# 全局配置实例
config = Config.load_from_env()
