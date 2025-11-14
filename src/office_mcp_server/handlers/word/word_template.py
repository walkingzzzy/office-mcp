"""Word 教育场景模板操作模块."""

from typing import Any

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt, RGBColor
from loguru import logger

from office_mcp_server.config import config
from office_mcp_server.utils.file_manager import FileManager
from office_mcp_server.utils.format_helper import ColorUtils


class WordTemplateOperations:
    """Word 教育场景模板操作类."""

    def __init__(self) -> None:
        """初始化模板操作类."""
        self.file_manager = FileManager()

    # 教育场景专用模板预设
    EDUCATION_TEMPLATES = {
        "teaching_plan": {
            "name": "教学计划/教案",
            "description": "适用于教学计划、教案、课程设计",
            "heading1": {
                "font_name": "黑体",
                "font_size": 16,
                "bold": True,
                "alignment": "center",
                "line_spacing": 1.5,
                "space_before": 12,
                "space_after": 6,
            },
            "heading2": {
                "font_name": "黑体",
                "font_size": 14,
                "bold": True,
                "alignment": "left",
                "line_spacing": 1.5,
                "space_before": 6,
                "space_after": 3,
            },
            "heading3": {
                "font_name": "楷体",
                "font_size": 12,
                "bold": True,
                "alignment": "left",
                "line_spacing": 1.5,
                "space_before": 3,
                "space_after": 0,
            },
            "body": {
                "font_name": "宋体",
                "font_size": 12,
                "alignment": "justify",
                "line_spacing": 1.5,
                "first_line_indent": 0.28,
            },
        },
        "student_report": {
            "name": "学生报告/作业",
            "description": "适用于学生作业、实验报告、课程论文",
            "heading1": {
                "font_name": "宋体",
                "font_size": 18,
                "bold": True,
                "alignment": "center",
                "line_spacing": 1.5,
                "space_before": 18,
                "space_after": 12,
            },
            "heading2": {
                "font_name": "宋体",
                "font_size": 14,
                "bold": True,
                "alignment": "left",
                "line_spacing": 1.5,
                "space_before": 12,
                "space_after": 6,
            },
            "heading3": {
                "font_name": "宋体",
                "font_size": 12,
                "bold": True,
                "alignment": "left",
                "line_spacing": 1.5,
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
        "school_notice": {
            "name": "学校通知/公告",
            "description": "适用于学校通知、公告、文件",
            "heading1": {
                "font_name": "黑体",
                "font_size": 22,
                "bold": True,
                "color": "#C00000",
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
                "space_before": 12,
                "space_after": 6,
            },
            "heading3": {
                "font_name": "黑体",
                "font_size": 14,
                "bold": True,
                "alignment": "left",
                "line_spacing": 1.5,
                "space_before": 6,
                "space_after": 6,
            },
            "body": {
                "font_name": "仿宋",
                "font_size": 12,
                "alignment": "justify",
                "line_spacing": 1.5,
            },
        },
        "exam_paper": {
            "name": "试卷模板",
            "description": "适用于考试试卷、练习题、测验卷",
            "heading1": {
                "font_name": "黑体",
                "font_size": 18,
                "bold": True,
                "alignment": "center",
                "line_spacing": 1.5,
                "space_before": 12,
                "space_after": 12,
            },
            "heading2": {
                "font_name": "黑体",
                "font_size": 14,
                "bold": True,
                "alignment": "left",
                "line_spacing": 1.5,
                "space_before": 6,
                "space_after": 3,
            },
            "heading3": {
                "font_name": "宋体",
                "font_size": 12,
                "bold": True,
                "alignment": "left",
                "line_spacing": 1.5,
                "space_before": 0,
                "space_after": 0,
            },
            "body": {
                "font_name": "宋体",
                "font_size": 12,
                "alignment": "left",
                "line_spacing": 1.5,
                "space_before": 0,
                "space_after": 0,
            },
        },
        "meeting_minutes": {
            "name": "会议纪要",
            "description": "适用于教研会议纪要、家长会记录、工作会议",
            "heading1": {
                "font_name": "黑体",
                "font_size": 16,
                "bold": True,
                "alignment": "center",
                "line_spacing": 1.5,
                "space_before": 12,
                "space_after": 6,
            },
            "heading2": {
                "font_name": "黑体",
                "font_size": 14,
                "bold": True,
                "alignment": "left",
                "line_spacing": 1.5,
                "space_before": 6,
                "space_after": 3,
            },
            "heading3": {
                "font_name": "黑体",
                "font_size": 12,
                "bold": True,
                "alignment": "left",
                "line_spacing": 1.5,
                "space_before": 3,
                "space_after": 0,
            },
            "body": {
                "font_name": "仿宋",
                "font_size": 12,
                "alignment": "justify",
                "line_spacing": 1.5,
                "first_line_indent": 0.28,
            },
        },
        "work_summary": {
            "name": "工作总结/计划",
            "description": "适用于学期总结、年度计划、述职报告",
            "heading1": {
                "font_name": "黑体",
                "font_size": 22,
                "bold": True,
                "alignment": "center",
                "line_spacing": 1.5,
                "space_before": 18,
                "space_after": 12,
            },
            "heading2": {
                "font_name": "黑体",
                "font_size": 16,
                "bold": True,
                "alignment": "left",
                "line_spacing": 1.5,
                "space_before": 12,
                "space_after": 6,
            },
            "heading3": {
                "font_name": "黑体",
                "font_size": 14,
                "bold": True,
                "alignment": "left",
                "line_spacing": 1.5,
                "space_before": 6,
                "space_after": 6,
            },
            "body": {
                "font_name": "仿宋",
                "font_size": 12,
                "alignment": "justify",
                "line_spacing": 1.5,
                "first_line_indent": 0.28,
            },
        },
    }

    def list_templates(self) -> dict[str, Any]:
        """列出所有可用的教育场景模板.

        Returns:
            dict: 模板列表，包含每个模板的名称、描述、适用场景
        """
        try:
            templates = []
            for template_id, template_config in self.EDUCATION_TEMPLATES.items():
                templates.append({
                    "id": template_id,
                    "name": template_config["name"],
                    "description": template_config["description"],
                })

            logger.info(f"列出教育场景模板成功，共 {len(templates)} 个模板")
            return {
                "success": True,
                "message": f"共有 {len(templates)} 个教育场景模板可用",
                "templates": templates,
                "total_count": len(templates),
            }

        except Exception as e:
            logger.error(f"列出模板失败: {e}")
            return {"success": False, "message": f"操作失败: {str(e)}"}

    def apply_template(
        self,
        filename: str,
        template_name: str,
    ) -> dict[str, Any]:
        """应用教育场景模板到文档.

        Args:
            filename: 文件名
            template_name: 模板名称 (teaching_plan, student_report, school_notice, exam_paper, meeting_minutes, work_summary)

        Returns:
            dict: 操作结果，包含应用的格式统计信息
        """
        try:
            if template_name not in self.EDUCATION_TEMPLATES:
                available = ", ".join(self.EDUCATION_TEMPLATES.keys())
                raise ValueError(
                    f"不支持的模板: {template_name}。可用模板: {available}"
                )

            file_path = config.paths.output_dir / filename
            self.file_manager.validate_file_path(file_path, must_exist=True)

            doc = Document(str(file_path))
            template = self.EDUCATION_TEMPLATES[template_name]

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
                if style_name == "Heading 1" and "heading1" in template:
                    self._apply_format(para, template["heading1"])
                    stats["heading1"] += 1
                elif style_name == "Heading 2" and "heading2" in template:
                    self._apply_format(para, template["heading2"])
                    stats["heading2"] += 1
                elif style_name == "Heading 3" and "heading3" in template:
                    self._apply_format(para, template["heading3"])
                    stats["heading3"] += 1
                elif style_name == "Heading 4" and "heading4" in template:
                    self._apply_format(para, template["heading4"])
                    stats["heading4"] += 1
                elif style_name == "Normal" and "body" in template:
                    self._apply_format(para, template["body"])
                    stats["body"] += 1

            doc.save(str(file_path))

            logger.info(f"应用教育模板成功: {file_path}, 模板: {template_name}")
            return {
                "success": True,
                "message": f"成功应用教育模板: {template['name']}",
                "filename": str(file_path),
                "template": template_name,
                "template_name": template["name"],
                "stats": stats,
                "total_formatted": sum(stats.values()),
            }

        except Exception as e:
            logger.error(f"应用模板失败: {e}")
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

