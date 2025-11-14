"""Word 教育场景模板工具."""

from typing import Any

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.word_handler import WordHandler


def register_template_tools(mcp: FastMCP, word_handler: WordHandler) -> None:
    """注册 Word 教育场景模板工具."""

    @mcp.tool()
    def list_word_templates() -> dict[str, Any]:
        """列出所有可用的 Word 教育场景模板.

        返回所有预设的教育场景模板及其描述信息。

        教育场景模板包括：
        1. teaching_plan - 教学计划/教案
           适用于：教学计划、教案、课程设计
           特点：黑体标题，楷体三级标题，宋体正文，首行缩进

        2. student_report - 学生报告/作业
           适用于：学生作业、实验报告、课程论文
           特点：宋体标题和正文，标准学术格式，首行缩进

        3. school_notice - 学校通知/公告
           适用于：学校通知、公告、文件
           特点：红色黑体大标题，仿宋正文，正式公文风格

        4. exam_paper - 试卷模板
           适用于：考试试卷、练习题、测验卷
           特点：黑体标题，宋体正文，紧凑排版，无首行缩进

        5. meeting_minutes - 会议纪要
           适用于：教研会议纪要、家长会记录、工作会议
           特点：黑体标题，仿宋正文，首行缩进

        6. work_summary - 工作总结/计划
           适用于：学期总结、年度计划、述职报告
           特点：大号黑体标题，仿宋正文，正式公文风格

        Returns:
            dict: 模板列表，包含：
                - templates: 模板信息列表（id、name、description）
                - total_count: 模板总数

        使用场景:
            - 查看所有可用的教育场景模板
            - 了解每个模板的适用场景
            - 选择合适的模板应用到文档

        示例:
            先调用此工具查看可用模板，然后使用 apply_word_template 应用模板
        """
        logger.info("MCP工具调用: list_word_templates()")
        return word_handler.list_templates()

    @mcp.tool()
    def apply_word_template(
        filename: str,
        template_name: str,
    ) -> dict[str, Any]:
        """应用教育场景模板到 Word 文档.

        将预设的教育场景模板格式应用到整个文档，自动格式化所有标题和正文段落。

        Args:
            filename: 文件名
            template_name: 模板名称，可选值：
                - teaching_plan: 教学计划/教案
                - student_report: 学生报告/作业
                - school_notice: 学校通知/公告
                - exam_paper: 试卷模板
                - meeting_minutes: 会议纪要
                - work_summary: 工作总结/计划

        Returns:
            dict: 操作结果，包含：
                - template_name: 应用的模板名称
                - stats: 格式化统计（各级标题和正文的段落数）
                - total_formatted: 总共格式化的段落数

        模板详细说明：

        1. teaching_plan（教学计划/教案）
           - 一级标题：黑体16pt，居中
           - 二级标题：黑体14pt，左对齐
           - 三级标题：楷体12pt，加粗，左对齐
           - 正文：宋体12pt，首行缩进2字符，1.5倍行距

        2. student_report（学生报告/作业）
           - 一级标题：宋体18pt，加粗，居中
           - 二级标题：宋体14pt，加粗，左对齐
           - 三级标题：宋体12pt，加粗，左对齐
           - 正文：宋体12pt，首行缩进2字符，1.5倍行距

        3. school_notice（学校通知/公告）
           - 一级标题：黑体22pt，红色，居中
           - 二级标题：黑体16pt，左对齐
           - 三级标题：黑体14pt，左对齐
           - 正文：仿宋12pt，两端对齐，1.5倍行距

        4. exam_paper（试卷模板）
           - 一级标题：黑体18pt，居中
           - 二级标题：黑体14pt，左对齐
           - 三级标题：宋体12pt，加粗，左对齐
           - 正文：宋体12pt，左对齐，1.5倍行距

        5. meeting_minutes（会议纪要）
           - 一级标题：黑体16pt，居中
           - 二级标题：黑体14pt，左对齐
           - 三级标题：黑体12pt，左对齐
           - 正文：仿宋12pt，首行缩进2字符，1.5倍行距

        6. work_summary（工作总结/计划）
           - 一级标题：黑体22pt，居中
           - 二级标题：黑体16pt，左对齐
           - 三级标题：黑体14pt，左对齐
           - 正文：仿宋12pt，首行缩进2字符，1.5倍行距

        使用场景:
            - 快速创建符合教育行业规范的文档
            - 统一学校文档格式
            - 提升文档专业性和可读性

        注意事项:
            - 模板只会格式化已有的标题样式（Heading 1/2/3/4）和正文（Normal）
            - 如果文档中没有使用标题样式，需要先设置标题样式
            - 建议先使用 list_word_templates 查看所有可用模板

        工作流程:
            1. 调用 list_word_templates 查看可用模板
            2. 选择合适的模板
            3. 调用此工具应用模板到文档
            4. 使用 get_word_document_info 验证格式化效果
        """
        logger.info(f"MCP工具调用: apply_word_template(filename={filename}, template_name={template_name})")
        return word_handler.apply_template(filename, template_name)

