"""Word 样式管理模块 - 创建、修改和管理样式."""

from typing import Any, Optional

from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.style import WD_STYLE_TYPE
from loguru import logger

from office_mcp_server.config import config
from office_mcp_server.utils.file_manager import FileManager


class WordStyleManagement:
    """Word 样式管理类."""

    def __init__(self) -> None:
        """初始化样式管理类."""
        self.file_manager = FileManager()

    def list_styles(
        self,
        filename: str,
        style_type: Optional[str] = None,
    ) -> dict[str, Any]:
        """列出文档中的所有样式.

        Args:
            filename: 文件名
            style_type: 样式类型筛选 ('paragraph', 'character', 'table', 'list', None表示全部)

        Returns:
            dict: 样式列表
        """
        try:
            file_path = config.paths.output_dir / filename
            self.file_manager.validate_file_path(file_path, must_exist=True)

            doc = Document(str(file_path))

            style_type_map = {
                'paragraph': WD_STYLE_TYPE.PARAGRAPH,
                'character': WD_STYLE_TYPE.CHARACTER,
                'table': WD_STYLE_TYPE.TABLE,
                'list': WD_STYLE_TYPE.LIST,
            }

            styles_list = []
            for style in doc.styles:
                # 筛选样式类型
                if style_type and style.type != style_type_map.get(style_type.lower()):
                    continue

                style_info = {
                    "name": style.name,
                    "type": str(style.type),
                    "builtin": style.builtin,
                    "hidden": style.hidden,
                }

                # 获取样式详细信息
                if hasattr(style, 'font'):
                    style_info["font_name"] = style.font.name
                    style_info["font_size"] = style.font.size.pt if style.font.size else None

                styles_list.append(style_info)

            logger.info(f"列出样式成功: {file_path}, 共 {len(styles_list)} 个样式")
            return {
                "success": True,
                "message": f"找到 {len(styles_list)} 个样式",
                "filename": str(file_path),
                "styles": styles_list,
                "count": len(styles_list)
            }

        except Exception as e:
            logger.error(f"列出样式失败: {e}")
            return {"success": False, "message": f"操作失败: {str(e)}"}

    def create_paragraph_style(
        self,
        filename: str,
        style_name: str,
        base_style: str = "Normal",
        font_name: Optional[str] = None,
        font_size: Optional[int] = None,
        font_color: Optional[str] = None,
        bold: bool = False,
        italic: bool = False,
    ) -> dict[str, Any]:
        """创建段落样式.

        Args:
            filename: 文件名
            style_name: 新样式名称
            base_style: 基础样式名称
            font_name: 字体名称
            font_size: 字号
            font_color: 字体颜色（HEX格式，如 '#FF0000'）
            bold: 是否加粗
            italic: 是否斜体

        Returns:
            dict: 操作结果
        """
        try:
            file_path = config.paths.output_dir / filename
            self.file_manager.validate_file_path(file_path, must_exist=True)

            doc = Document(str(file_path))

            # 检查样式是否已存在
            if style_name in [s.name for s in doc.styles]:
                return {
                    "success": False,
                    "message": f"样式 '{style_name}' 已存在"
                }

            # 创建新样式
            styles = doc.styles
            style = styles.add_style(style_name, WD_STYLE_TYPE.PARAGRAPH)

            # 设置基础样式
            if base_style in [s.name for s in doc.styles]:
                style.base_style = doc.styles[base_style]

            # 设置字体属性
            if font_name:
                style.font.name = font_name

            if font_size:
                style.font.size = Pt(font_size)

            if font_color:
                # 解析HEX颜色
                color_hex = font_color.lstrip('#')
                r, g, b = tuple(int(color_hex[i:i+2], 16) for i in (0, 2, 4))
                style.font.color.rgb = RGBColor(r, g, b)

            style.font.bold = bold
            style.font.italic = italic

            doc.save(str(file_path))

            logger.info(f"创建段落样式成功: {file_path}, 样式: {style_name}")
            return {
                "success": True,
                "message": f"成功创建样式 '{style_name}'",
                "filename": str(file_path),
                "style_name": style_name
            }

        except Exception as e:
            logger.error(f"创建段落样式失败: {e}")
            return {"success": False, "message": f"操作失败: {str(e)}"}

