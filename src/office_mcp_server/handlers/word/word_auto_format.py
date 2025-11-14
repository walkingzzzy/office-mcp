"""Word 智能自动格式化操作模块."""

from typing import Any, Optional

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt, RGBColor
from loguru import logger

from office_mcp_server.config import config
from office_mcp_server.utils.file_manager import FileManager
from office_mcp_server.utils.format_helper import ColorUtils


class WordAutoFormatOperations:
    """Word 智能自动格式化操作类."""

    def __init__(self) -> None:
        """初始化自动格式化操作类."""
        self.file_manager = FileManager()

    # 预设格式方案
    PRESETS = {
        "professional": {
            "name": "专业商务",
            "heading1": {
                "font_name": "微软雅黑",
                "font_size": 22,
                "bold": True,
                "color": "#1F4E78",
                "alignment": "center",
                "line_spacing": 1.5,
                "space_before": 24,
                "space_after": 18,
            },
            "heading2": {
                "font_name": "微软雅黑",
                "font_size": 18,
                "bold": True,
                "color": "#2E75B5",
                "alignment": "left",
                "line_spacing": 1.5,
                "space_before": 18,
                "space_after": 12,
            },
            "heading3": {
                "font_name": "微软雅黑",
                "font_size": 14,
                "bold": True,
                "color": "#4472C4",
                "alignment": "left",
                "line_spacing": 1.3,
                "space_before": 12,
                "space_after": 6,
            },
            "heading4": {
                "font_name": "微软雅黑",
                "font_size": 12,
                "bold": True,
                "color": "#5B9BD5",
                "alignment": "left",
                "line_spacing": 1.3,
                "space_before": 6,
                "space_after": 6,
            },
            "body": {
                "font_name": "宋体",
                "font_size": 12,
                "alignment": "justify",
                "line_spacing": 1.5,
                "first_line_indent": 0.28,
            },
        },
        "academic": {
            "name": "学术论文",
            "heading1": {
                "font_name": "宋体",
                "font_size": 22,
                "bold": True,
                "alignment": "center",
                "line_spacing": 1.5,
                "space_before": 24,
                "space_after": 18,
            },
            "heading2": {
                "font_name": "黑体",
                "font_size": 16,
                "bold": True,
                "alignment": "left",
                "line_spacing": 1.5,
                "space_before": 18,
                "space_after": 12,
            },
            "heading3": {
                "font_name": "黑体",
                "font_size": 14,
                "bold": True,
                "alignment": "left",
                "line_spacing": 1.5,
                "space_before": 12,
                "space_after": 6,
            },
            "body": {
                "font_name": "宋体",
                "font_size": 12,
                "alignment": "justify",
                "line_spacing": 1.5,
                "first_line_indent": 0.28,
            },
        },
        "simple": {
            "name": "简洁风格",
            "heading1": {
                "font_name": "微软雅黑",
                "font_size": 20,
                "bold": True,
                "alignment": "left",
                "line_spacing": 1.5,
                "space_before": 18,
                "space_after": 12,
            },
            "heading2": {
                "font_name": "微软雅黑",
                "font_size": 16,
                "bold": True,
                "alignment": "left",
                "line_spacing": 1.5,
                "space_before": 12,
                "space_after": 6,
            },
            "heading3": {
                "font_name": "微软雅黑",
                "font_size": 14,
                "bold": True,
                "alignment": "left",
                "line_spacing": 1.3,
                "space_before": 6,
                "space_after": 6,
            },
            "body": {
                "font_name": "微软雅黑",
                "font_size": 11,
                "alignment": "left",
                "line_spacing": 1.5,
            },
        },
        "compact": {
            "name": "紧凑排版",
            "description": "专门用于减少文档页数，适合需要压缩页面的场景",
            "heading1": {
                "font_name": "微软雅黑",
                "font_size": 16,
                "bold": True,
                "color": "#1F4E78",
                "alignment": "center",
                "line_spacing": 1.2,
                "space_before": 12,
                "space_after": 6,
            },
            "heading2": {
                "font_name": "微软雅黑",
                "font_size": 14,
                "bold": True,
                "color": "#2E75B5",
                "alignment": "left",
                "line_spacing": 1.2,
                "space_before": 6,
                "space_after": 3,
            },
            "heading3": {
                "font_name": "微软雅黑",
                "font_size": 12,
                "bold": True,
                "color": "#4472C4",
                "alignment": "left",
                "line_spacing": 1.15,
                "space_before": 3,
                "space_after": 0,
            },
            "heading4": {
                "font_name": "微软雅黑",
                "font_size": 11,
                "bold": True,
                "color": "#5B9BD5",
                "alignment": "left",
                "line_spacing": 1.15,
                "space_before": 0,
                "space_after": 0,
            },
            "body": {
                "font_name": "宋体",
                "font_size": 11,
                "alignment": "justify",
                "line_spacing": 1.2,
                "space_before": 0,
                "space_after": 0,
                "first_line_indent": 0.28,
            },
        },
    }

    def auto_format_document(
        self,
        filename: str,
        format_preset: str = "professional",
    ) -> dict[str, Any]:
        """自动格式化整个文档.

        Args:
            filename: 文件名
            format_preset: 格式预设 ('professional'专业商务, 'academic'学术论文, 'simple'简洁风格, 'compact'紧凑排版, 默认 'professional')
                - professional: 专业商务风格，蓝色系渐变，适合商业文档
                - academic: 学术论文风格，黑体宋体，适合学术文档
                - simple: 简洁风格，微软雅黑，适合内部文档
                - compact: 紧凑排版，专门用于减少页数，适合需要压缩页面的场景

        Returns:
            dict: 操作结果
        """
        try:
            if format_preset not in self.PRESETS:
                raise ValueError(f"不支持的格式预设: {format_preset}")

            file_path = config.paths.output_dir / filename
            self.file_manager.validate_file_path(file_path, must_exist=True)

            doc = Document(str(file_path))
            preset = self.PRESETS[format_preset]

            stats = {
                "heading1": 0,
                "heading2": 0,
                "heading3": 0,
                "heading4": 0,
                "body": 0,
            }

            # 遍历所有段落并应用格式
            for para in doc.paragraphs:
                style_name = para.style.name

                # 根据样式名称应用对应格式
                if style_name == "Heading 1" and "heading1" in preset:
                    self._apply_format(para, preset["heading1"])
                    stats["heading1"] += 1
                elif style_name == "Heading 2" and "heading2" in preset:
                    self._apply_format(para, preset["heading2"])
                    stats["heading2"] += 1
                elif style_name == "Heading 3" and "heading3" in preset:
                    self._apply_format(para, preset["heading3"])
                    stats["heading3"] += 1
                elif style_name == "Heading 4" and "heading4" in preset:
                    self._apply_format(para, preset["heading4"])
                    stats["heading4"] += 1
                elif style_name == "Normal" and "body" in preset:
                    self._apply_format(para, preset["body"])
                    stats["body"] += 1

            doc.save(str(file_path))

            logger.info(f"自动格式化成功: {file_path}, 预设: {format_preset}")
            return {
                "success": True,
                "message": f"自动格式化成功 (预设: {preset['name']})",
                "filename": str(file_path),
                "preset": format_preset,
                "stats": stats,
            }

        except Exception as e:
            logger.error(f"自动格式化失败: {e}")
            return {"success": False, "message": f"操作失败: {str(e)}"}

    def _apply_format(self, para, format_spec: dict) -> None:
        """应用格式到段落.

        Args:
            para: 段落对象
            format_spec: 格式规范字典
        """
        # 应用文本格式
        for run in para.runs:
            if "font_name" in format_spec:
                run.font.name = format_spec["font_name"]
            if "font_size" in format_spec:
                run.font.size = Pt(format_spec["font_size"])
            if "bold" in format_spec:
                run.font.bold = format_spec["bold"]
            if "italic" in format_spec:
                run.font.italic = format_spec["italic"]
            if "color" in format_spec:
                r, g, b = ColorUtils.hex_to_rgb(format_spec["color"])
                run.font.color.rgb = RGBColor(r, g, b)

        # 应用段落格式
        para_format = para.paragraph_format

        if "alignment" in format_spec:
            alignment_map = {
                'left': WD_ALIGN_PARAGRAPH.LEFT,
                'center': WD_ALIGN_PARAGRAPH.CENTER,
                'right': WD_ALIGN_PARAGRAPH.RIGHT,
                'justify': WD_ALIGN_PARAGRAPH.JUSTIFY,
            }
            if format_spec["alignment"] in alignment_map:
                para_format.alignment = alignment_map[format_spec["alignment"]]

        if "line_spacing" in format_spec:
            para_format.line_spacing = format_spec["line_spacing"]
        if "space_before" in format_spec:
            para_format.space_before = Pt(format_spec["space_before"])
        if "space_after" in format_spec:
            para_format.space_after = Pt(format_spec["space_after"])
        if "first_line_indent" in format_spec:
            para_format.first_line_indent = Inches(format_spec["first_line_indent"])
        if "left_indent" in format_spec:
            para_format.left_indent = Inches(format_spec["left_indent"])
        if "right_indent" in format_spec:
            para_format.right_indent = Inches(format_spec["right_indent"])

