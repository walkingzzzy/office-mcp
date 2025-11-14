"""Word 页面设置操作模块."""

from typing import Any, Optional

from docx import Document
from docx.enum.section import WD_ORIENT, WD_SECTION
from docx.shared import Inches, Pt
from loguru import logger

from office_mcp_server.config import config
from office_mcp_server.utils.file_manager import FileManager


class WordPageSetupOperations:
    """Word 页面设置操作类."""

    def __init__(self) -> None:
        """初始化页面设置操作类."""
        self.file_manager = FileManager()

    def set_page_setup(
        self,
        filename: str,
        orientation: str = "portrait",
        paper_size: str = "A4",
        left_margin: float = 1.0,
        right_margin: float = 1.0,
        top_margin: float = 1.0,
        bottom_margin: float = 1.0,
    ) -> dict[str, Any]:
        """设置 Word 页面属性.

        Args:
            filename: 文件名
            orientation: 页面方向 ('portrait'纵向, 'landscape'横向, 默认 'portrait')
            paper_size: 纸张大小 ('A4', 'A3', 'Letter', 'Legal', 默认 'A4')
            left_margin: 左边距英寸 (默认 1.0)
            right_margin: 右边距英寸 (默认 1.0)
            top_margin: 上边距英寸 (默认 1.0)
            bottom_margin: 下边距英寸 (默认 1.0)

        Returns:
            dict: 操作结果
        """
        try:
            file_path = config.paths.output_dir / filename
            self.file_manager.validate_file_path(file_path, must_exist=True)

            doc = Document(str(file_path))

            # 纸张尺寸映射 (宽度, 高度) 单位: 英寸
            paper_sizes = {
                'A4': (8.27, 11.69),
                'A3': (11.69, 16.54),
                'Letter': (8.5, 11.0),
                'Legal': (8.5, 14.0),
            }

            if paper_size not in paper_sizes:
                raise ValueError(f"不支持的纸张大小: {paper_size}")

            width, height = paper_sizes[paper_size]

            # 设置所有节的页面属性
            for section in doc.sections:
                # 设置页面方向
                if orientation == "landscape":
                    section.orientation = WD_ORIENT.LANDSCAPE
                    section.page_width = Inches(height)
                    section.page_height = Inches(width)
                else:
                    section.orientation = WD_ORIENT.PORTRAIT
                    section.page_width = Inches(width)
                    section.page_height = Inches(height)

                # 设置页边距
                section.left_margin = Inches(left_margin)
                section.right_margin = Inches(right_margin)
                section.top_margin = Inches(top_margin)
                section.bottom_margin = Inches(bottom_margin)

            doc.save(str(file_path))

            logger.info(f"页面设置成功: {file_path}")
            return {
                "success": True,
                "message": "页面设置成功",
                "filename": str(file_path),
                "orientation": orientation,
                "paper_size": paper_size,
                "margins": {
                    "left": left_margin,
                    "right": right_margin,
                    "top": top_margin,
                    "bottom": bottom_margin,
                },
            }

        except Exception as e:
            logger.error(f"页面设置失败: {e}")
            return {"success": False, "message": f"操作失败: {str(e)}"}

    def set_page_margins(
        self,
        filename: str,
        left: float = 1.0,
        right: float = 1.0,
        top: float = 1.0,
        bottom: float = 1.0,
        gutter: float = 0.0,
        header: float = 0.5,
        footer: float = 0.5,
    ) -> dict[str, Any]:
        """设置 Word 页边距.

        Args:
            filename: 文件名
            left: 左边距英寸 (默认 1.0)
            right: 右边距英寸 (默认 1.0)
            top: 上边距英寸 (默认 1.0)
            bottom: 下边距英寸 (默认 1.0)
            gutter: 装订线边距英寸 (默认 0.0)
            header: 页眉边距英寸 (默认 0.5)
            footer: 页脚边距英寸 (默认 0.5)

        Returns:
            dict: 操作结果
        """
        try:
            file_path = config.paths.output_dir / filename
            self.file_manager.validate_file_path(file_path, must_exist=True)

            doc = Document(str(file_path))

            # 设置所有节的页边距
            for section in doc.sections:
                section.left_margin = Inches(left)
                section.right_margin = Inches(right)
                section.top_margin = Inches(top)
                section.bottom_margin = Inches(bottom)
                section.gutter = Inches(gutter)
                section.header_distance = Inches(header)
                section.footer_distance = Inches(footer)

            doc.save(str(file_path))

            logger.info(f"页边距设置成功: {file_path}")
            return {
                "success": True,
                "message": "页边距设置成功",
                "filename": str(file_path),
                "margins": {
                    "left": left,
                    "right": right,
                    "top": top,
                    "bottom": bottom,
                    "gutter": gutter,
                    "header": header,
                    "footer": footer,
                },
            }

        except Exception as e:
            logger.error(f"页边距设置失败: {e}")
            return {"success": False, "message": f"操作失败: {str(e)}"}

