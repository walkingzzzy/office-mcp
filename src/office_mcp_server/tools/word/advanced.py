"""Word 高级功能工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.word_handler import WordHandler


def register_advanced_tools(mcp: FastMCP, word_handler: WordHandler) -> None:
    """注册 Word 高级功能工具."""

    @mcp.tool()
    def word_mail_merge(
        template_filename: str,
        data_source: list[dict[str, str]],
        output_pattern: str = "output_{index}.docx",
        merge_fields: Optional[list[str]] = None,
    ) -> dict[str, Any]:
        """Word 邮件合并 - 批量生成文档.

        Args:
            template_filename: 模板文档文件名
            data_source: 数据源，每个元素是一个字典，键为合并字段名
                        例如：[{"name": "张三", "age": "30"}, {"name": "李四", "age": "25"}]
            output_pattern: 输出文件名模式 (默认 'output_{index}.docx')
                          {index}会被替换为序号
                          {字段名}会被替换为对应值，如 'letter_{name}.docx'
            merge_fields: 需要合并的字段列表 (可选，默认使用data_source中所有字段)

        Returns:
            dict: 操作结果

        Note:
            模板文档中使用 {{field_name}} 格式标记合并字段
            例如：尊敬的{{name}}，您的年龄是{{age}}岁
        """
        logger.info(f"MCP工具调用: word_mail_merge(template={template_filename}, records={len(data_source)})")
        return word_handler.mail_merge(template_filename, data_source, output_pattern, merge_fields)

    @mcp.tool()
    def list_word_styles(filename: str, style_type: Optional[str] = None) -> dict[str, Any]:
        """列出 Word 文档中的所有样式.

        Args:
            filename: 文件名
            style_type: 样式类型过滤 ('paragraph', 'character', 'table', 'list', 可选)

        Returns:
            dict: 样式列表
        """
        logger.info(f"MCP工具调用: list_word_styles(filename={filename})")
        return word_handler.list_styles(filename, style_type)

    @mcp.tool()
    def create_word_paragraph_style(filename: str, style_name: str, base_style: str = "Normal", font_name: Optional[str] = None, font_size: Optional[int] = None, font_color: Optional[str] = None, bold: bool = False, italic: bool = False) -> dict[str, Any]:
        """创建 Word 段落样式.

        Args:
            filename: 文件名
            style_name: 新样式名称
            base_style: 基础样式 (默认 'Normal')
            font_name: 字体名称 (可选)
            font_size: 字号 (可选)
            font_color: 字体颜色 HEX格式 (可选)
            bold: 是否加粗 (默认 False)
            italic: 是否斜体 (默认 False)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: create_word_paragraph_style(filename={filename})")
        return word_handler.create_paragraph_style(filename, style_name, base_style, font_name, font_size, font_color, bold, italic)

    @mcp.tool()
    def get_word_document_properties(filename: str) -> dict[str, Any]:
        """获取 Word 文档属性（元数据）.

        Args:
            filename: 文件名

        Returns:
            dict: 文档属性,包含作者、标题、主题、关键词等
        """
        logger.info(f"MCP工具调用: get_word_document_properties(filename={filename})")
        return word_handler.get_document_properties(filename)

    @mcp.tool()
    def set_word_document_properties(filename: str, author: Optional[str] = None, title: Optional[str] = None, subject: Optional[str] = None, keywords: Optional[str] = None, comments: Optional[str] = None, category: Optional[str] = None) -> dict[str, Any]:
        """设置 Word 文档属性（元数据）.

        Args:
            filename: 文件名
            author: 作者 (可选)
            title: 标题 (可选)
            subject: 主题 (可选)
            keywords: 关键词 (可选)
            comments: 备注 (可选)
            category: 类别 (可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: set_word_document_properties(filename={filename})")
        return word_handler.set_document_properties(filename, author, title, subject, keywords, comments, category)

    @mcp.tool()
    def add_word_header_footer_odd_even(filename: str, odd_header: Optional[str] = None, even_header: Optional[str] = None, odd_footer: Optional[str] = None, even_footer: Optional[str] = None) -> dict[str, Any]:
        """添加奇偶页不同的页眉页脚到 Word 文档.

        Args:
            filename: 文件名
            odd_header: 奇数页页眉 (可选)
            even_header: 偶数页页眉 (可选)
            odd_footer: 奇数页页脚 (可选)
            even_footer: 偶数页页脚 (可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_word_header_footer_odd_even(filename={filename})")
        return word_handler.add_header_footer_odd_even(filename, odd_header, even_header, odd_footer, even_footer)
