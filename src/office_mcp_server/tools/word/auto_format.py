"""Word 智能自动格式化工具."""

from typing import Any

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.word_handler import WordHandler


def register_auto_format_tools(mcp: FastMCP, word_handler: WordHandler) -> None:
    """注册 Word 智能自动格式化工具."""

    @mcp.tool()
    def auto_format_word_document(
        filename: str,
        format_preset: str = "professional",
    ) -> dict[str, Any]:
        """智能自动格式化 Word 文档.

        根据预设方案自动格式化整个文档，包括：
        - 识别标题（Heading 1-4）并应用统一格式
        - 格式化正文段落（Normal）
        - 应用专业的字体、颜色、间距方案

        Args:
            filename: 文件名
            format_preset: 格式预设 ('professional'专业商务, 'academic'学术论文, 'simple'简洁风格, 'compact'紧凑排版, 默认 'professional')

        预设方案说明:
            - professional (专业商务):
                * 标题: 微软雅黑, 蓝色系渐变 (#1F4E78 → #2E75B5 → #4472C4 → #5B9BD5)
                * 正文: 宋体12pt, 两端对齐, 1.5倍行距, 首行缩进2字符
                * 适用于: 商业计划书、项目方案、工作报告

            - academic (学术论文):
                * 标题: 宋体/黑体, 黑色, 层次分明
                * 正文: 宋体12pt, 两端对齐, 1.5倍行距, 首行缩进2字符
                * 适用于: 学术论文、研究报告、毕业论文

            - simple (简洁风格):
                * 标题: 微软雅黑, 黑色, 简洁明快
                * 正文: 微软雅黑11pt, 左对齐, 1.5倍行距
                * 适用于: 内部文档、会议纪要、简报

            - compact (紧凑排版):
                * 标题: 微软雅黑, 蓝色系渐变, 字号较小(16/14/12/11pt)
                * 正文: 宋体11pt, 两端对齐, 1.2倍行距, 首行缩进2字符
                * 间距: 大幅减少段前段后间距和行距
                * 适用于: 需要压缩页数的场景，可将文档页数减少30-50%
                * 效果: 保持可读性的同时最大化页面利用率

        Returns:
            dict: 操作结果，包含格式化统计信息
        """
        logger.info(f"MCP工具调用: auto_format_word_document(filename={filename}, preset={format_preset})")
        return word_handler.auto_format_document(filename, format_preset)

