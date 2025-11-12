"""Word MCP 工具定义模块.

定义所有 Word 相关的 MCP 工具。
"""

from typing import Any, Optional, List

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.word_handler import WordHandler

# 创建 Word 处理器实例
word_handler = WordHandler()


def register_word_tools(mcp: FastMCP) -> None:
    """注册 Word 工具到 MCP 服务器.

    Args:
        mcp: FastMCP 服务器实例
    """

    @mcp.tool()
    def create_word_document(filename: str, title: str = "", content: str = "") -> dict[str, Any]:
        """创建 Word 文档.

        Args:
            filename: 文件名 (如 'document.docx')
            title: 文档标题 (可选)
            content: 文档内容 (可选)

        Returns:
            dict: 操作结果,包含文件路径和状态
        """
        logger.info(f"MCP工具调用: create_word_document(filename={filename})")
        return word_handler.create_document(filename, title, content)

    @mcp.tool()
    def insert_text_to_word(
        filename: str, text: str, position: str = "end"
    ) -> dict[str, Any]:
        """向 Word 文档插入文本.

        Args:
            filename: 文件名
            text: 要插入的文本
            position: 插入位置 ('start' 或 'end', 默认 'end')

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: insert_text_to_word(filename={filename})")
        return word_handler.insert_text(filename, text, position)

    @mcp.tool()
    def format_word_text(
        filename: str,
        paragraph_index: int,
        font_name: Optional[str] = None,
        font_size: Optional[int] = None,
        bold: bool = False,
        italic: bool = False,
        color: Optional[str] = None,
        underline: Optional[str] = None,
        strike: bool = False,
        double_strike: bool = False,
        superscript: bool = False,
        subscript: bool = False,
        highlight: Optional[str] = None,
        spacing: Optional[float] = None,
        shadow: bool = False,
    ) -> dict[str, Any]:
        """格式化 Word 文档中的文本.

        Args:
            filename: 文件名
            paragraph_index: 段落索引 (从0开始)
            font_name: 字体名称 (可选)
            font_size: 字号 (可选)
            bold: 是否加粗 (默认 False)
            italic: 是否斜体 (默认 False)
            color: 文字颜色 HEX格式 (如 '#FF0000', 可选)
            underline: 下划线样式 ('single', 'double', 'thick', 'dotted', 'dash', 'wave', 可选)
            strike: 是否删除线 (默认 False)
            double_strike: 是否双删除线 (默认 False)
            superscript: 是否上标 (默认 False)
            subscript: 是否下标 (默认 False)
            highlight: 高亮颜色 ('yellow', 'green', 'cyan', 'magenta', 'blue', 'red', 等, 可选)
            spacing: 字符间距 (磅值, 可选)
            shadow: 是否文字阴影 (默认 False)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: format_word_text(filename={filename})")
        return word_handler.format_text(
            filename, paragraph_index, font_name, font_size, bold, italic, color,
            underline, strike, double_strike, superscript, subscript, highlight, spacing, shadow
        )

    @mcp.tool()
    def add_heading_to_word(filename: str, text: str, level: int = 1) -> dict[str, Any]:
        """向 Word 文档添加标题.

        Args:
            filename: 文件名
            text: 标题文本
            level: 标题级别 (1-9, 默认 1)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_heading_to_word(filename={filename})")
        return word_handler.add_heading(filename, text, level)

    @mcp.tool()
    def create_word_table(
        filename: str, rows: int, cols: int, data: Optional[list[list[str]]] = None
    ) -> dict[str, Any]:
        """在 Word 文档中创建表格.

        Args:
            filename: 文件名
            rows: 行数
            cols: 列数
            data: 表格数据 (可选, 二维列表)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: create_word_table(filename={filename})")
        return word_handler.create_table(filename, rows, cols, data)

    @mcp.tool()
    def insert_image_to_word(
        filename: str, image_path: str, width_inches: Optional[float] = None
    ) -> dict[str, Any]:
        """向 Word 文档插入图片.

        Args:
            filename: 文件名
            image_path: 图片文件路径
            width_inches: 图片宽度 (英寸, 可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: insert_image_to_word(filename={filename})")
        return word_handler.insert_image(filename, image_path, width_inches)

    @mcp.tool()
    def add_page_break_to_word(filename: str) -> dict[str, Any]:
        """向 Word 文档添加分页符.

        Args:
            filename: 文件名

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_page_break_to_word(filename={filename})")
        return word_handler.add_page_break(filename)

    @mcp.tool()
    def get_word_document_info(filename: str) -> dict[str, Any]:
        """获取 Word 文档信息.

        Args:
            filename: 文件名

        Returns:
            dict: 文档信息 (段落数、表格数、字数等)
        """
        logger.info(f"MCP工具调用: get_word_document_info(filename={filename})")
        return word_handler.get_document_info(filename)

    @mcp.tool()
    def apply_style_to_word(
        filename: str, paragraph_index: int, style_name: str
    ) -> dict[str, Any]:
        """应用样式到 Word 文档段落.

        Args:
            filename: 文件名
            paragraph_index: 段落索引 (从0开始)
            style_name: 样式名称 ('Normal'正文, 'Quote'引用, 'List Bullet'项目符号, 'List Number'编号列表, 'Intense Quote'强烈引用)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: apply_style_to_word(filename={filename})")
        return word_handler.apply_style(filename, paragraph_index, style_name)

    @mcp.tool()
    def add_list_to_word(
        filename: str, text: str, list_type: str = "bullet", level: int = 0
    ) -> dict[str, Any]:
        """向 Word 文档添加列表段落.

        Args:
            filename: 文件名
            text: 段落文本
            list_type: 列表类型 ('bullet'项目符号 或 'number'编号, 默认 'bullet')
            level: 列表级别 (0-8, 默认 0)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_list_to_word(filename={filename})")
        return word_handler.add_list_paragraph(filename, text, list_type, level)

    @mcp.tool()
    def edit_word_table(
        filename: str,
        table_index: int,
        operation: str,
        row_index: Optional[int] = None,
        col_index: Optional[int] = None,
    ) -> dict[str, Any]:
        """编辑 Word 文档中的表格(插入/删除行列).

        Args:
            filename: 文件名
            table_index: 表格索引 (从0开始)
            operation: 操作类型 ('add_row'添加行, 'delete_row'删除行, 'add_column'添加列, 'delete_column'删除列)
            row_index: 行索引 (用于删除行, 可选)
            col_index: 列索引 (用于删除列, 可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: edit_word_table(filename={filename})")
        return word_handler.edit_table(filename, table_index, operation, row_index, col_index)

    @mcp.tool()
    def merge_word_table_cells(
        filename: str,
        table_index: int,
        start_row: int,
        start_col: int,
        end_row: int,
        end_col: int,
    ) -> dict[str, Any]:
        """合并 Word 文档表格中的单元格.

        Args:
            filename: 文件名
            table_index: 表格索引 (从0开始)
            start_row: 起始行索引
            start_col: 起始列索引
            end_row: 结束行索引
            end_col: 结束列索引

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: merge_word_table_cells(filename={filename})")
        return word_handler.merge_table_cells(
            filename, table_index, start_row, start_col, end_row, end_col
        )

    @mcp.tool()
    def format_word_paragraph(
        filename: str,
        paragraph_index: int,
        alignment: Optional[str] = None,
        line_spacing: Optional[float] = None,
        space_before: Optional[float] = None,
        space_after: Optional[float] = None,
        left_indent: Optional[float] = None,
        right_indent: Optional[float] = None,
        first_line_indent: Optional[float] = None,
    ) -> dict[str, Any]:
        """格式化 Word 文档段落.

        Args:
            filename: 文件名
            paragraph_index: 段落索引 (从0开始)
            alignment: 对齐方式 ('left'左对齐, 'center'居中, 'right'右对齐, 'justify'两端对齐, 可选)
            line_spacing: 行距倍数 (如 1.0单倍, 1.5倍, 2.0双倍, 可选)
            space_before: 段前间距磅值 (可选)
            space_after: 段后间距磅值 (可选)
            left_indent: 左缩进英寸 (可选)
            right_indent: 右缩进英寸 (可选)
            first_line_indent: 首行缩进英寸 (负值为悬挂缩进, 可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: format_word_paragraph(filename={filename})")
        return word_handler.format_paragraph(
            filename, paragraph_index, alignment, line_spacing,
            space_before, space_after, left_indent, right_indent, first_line_indent
        )

    @mcp.tool()
    def add_word_header_footer(
        filename: str,
        header_text: Optional[str] = None,
        footer_text: Optional[str] = None,
        add_page_number: bool = False,
        page_number_position: str = "footer_center",
        different_first_page: bool = False,
    ) -> dict[str, Any]:
        """添加 Word 文档页眉页脚.

        Args:
            filename: 文件名
            header_text: 页眉文本 (可选)
            footer_text: 页脚文本 (可选)
            add_page_number: 是否添加页码 (默认 False)
            page_number_position: 页码位置 ('header_left', 'header_center', 'header_right',
                                          'footer_left', 'footer_center', 'footer_right', 默认 'footer_center')
            different_first_page: 首页是否不同 (默认 False)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_word_header_footer(filename={filename})")
        return word_handler.add_header_footer(
            filename, header_text, footer_text, add_page_number,
            page_number_position, different_first_page
        )

    @mcp.tool()
    def export_word_document(
        filename: str,
        export_format: str = "pdf",
        output_filename: Optional[str] = None,
    ) -> dict[str, Any]:
        """导出 Word 文档到其他格式.

        Args:
            filename: 源文件名
            export_format: 导出格式 ('pdf'PDF, 'html'HTML网页, 'txt'纯文本, 'markdown'Markdown, 默认 'pdf')
            output_filename: 输出文件名 (可选,默认与源文件同名)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: export_word_document(filename={filename}, format={export_format})")
        return word_handler.export_document(filename, export_format, output_filename)

    @mcp.tool()
    def generate_word_table_of_contents(
        filename: str,
        title: str = "目录",
        max_level: int = 3,
        hyperlink: bool = True,
    ) -> dict[str, Any]:
        """生成 Word 文档目录.

        Args:
            filename: 文件名
            title: 目录标题 (默认 '目录')
            max_level: 最大标题级别 (1-9, 默认 3)
            hyperlink: 是否包含超链接样式 (默认 True)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: generate_word_table_of_contents(filename={filename})")
        return word_handler.generate_table_of_contents(filename, title, max_level, hyperlink)

    @mcp.tool()
    def add_word_comment(
        filename: str,
        paragraph_index: int,
        comment_text: str,
        author: str = "User",
        date: Optional[str] = None,
    ) -> dict[str, Any]:
        """添加 Word 文档批注.

        Args:
            filename: 文件名
            paragraph_index: 段落索引（从0开始）
            comment_text: 批注内容
            author: 批注作者 (默认 'User')
            date: 批注日期 (可选, 格式如 '2024-01-01')

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_word_comment(filename={filename}, paragraph={paragraph_index})")
        return word_handler.add_comment(filename, paragraph_index, comment_text, author, date)

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

    # ========== 文本编辑功能 ==========
    @mcp.tool()
    def find_text_in_word(
        filename: str,
        search_text: str,
        case_sensitive: bool = False,
        whole_word: bool = False,
    ) -> dict[str, Any]:
        """在 Word 文档中查找文本.

        Args:
            filename: 文件名
            search_text: 要查找的文本
            case_sensitive: 是否区分大小写 (默认 False)
            whole_word: 是否全字匹配 (默认 False)

        Returns:
            dict: 查找结果,包含所有匹配位置和上下文
        """
        logger.info(f"MCP工具调用: find_text_in_word(filename={filename})")
        return word_handler.find_text(filename, search_text, case_sensitive, whole_word)

    @mcp.tool()
    def replace_text_in_word(
        filename: str,
        search_text: str,
        replace_text: str,
        case_sensitive: bool = False,
        whole_word: bool = False,
        max_replacements: Optional[int] = None,
    ) -> dict[str, Any]:
        """在 Word 文档中替换文本.

        Args:
            filename: 文件名
            search_text: 要查找的文本
            replace_text: 替换为的文本
            case_sensitive: 是否区分大小写 (默认 False)
            whole_word: 是否全字匹配 (默认 False)
            max_replacements: 最大替换次数 (None表示全部替换)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: replace_text_in_word(filename={filename})")
        return word_handler.replace_text(filename, search_text, replace_text, case_sensitive, whole_word, max_replacements)

    @mcp.tool()
    def delete_text_in_word(
        filename: str,
        search_text: str,
        case_sensitive: bool = False,
        whole_word: bool = False,
    ) -> dict[str, Any]:
        """在 Word 文档中删除指定文本.

        Args:
            filename: 文件名
            search_text: 要删除的文本
            case_sensitive: 是否区分大小写 (默认 False)
            whole_word: 是否全字匹配 (默认 False)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: delete_text_in_word(filename={filename})")
        return word_handler.delete_text(filename, search_text, case_sensitive, whole_word)

    # ========== 表格格式化功能 ==========
    @mcp.tool()
    def format_word_table_cell(
        filename: str,
        table_index: int,
        row: int,
        col: int,
        alignment: Optional[str] = None,
        background_color: Optional[str] = None,
        text_color: Optional[str] = None,
        bold: bool = False,
        font_size: Optional[int] = None,
    ) -> dict[str, Any]:
        """格式化 Word 表格单元格.

        Args:
            filename: 文件名
            table_index: 表格索引 (从0开始)
            row: 行索引
            col: 列索引
            alignment: 对齐方式 ('left', 'center', 'right')
            background_color: 背景颜色 HEX格式 (如 '#FF0000')
            text_color: 文字颜色 HEX格式
            bold: 是否加粗
            font_size: 字号

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: format_word_table_cell(filename={filename})")
        return word_handler.format_table_cell(filename, table_index, row, col, alignment, background_color, text_color, bold, font_size)

    @mcp.tool()
    def apply_word_table_style(
        filename: str,
        table_index: int,
        style_name: str = "Table Grid",
    ) -> dict[str, Any]:
        """应用 Word 表格样式.

        Args:
            filename: 文件名
            table_index: 表格索引 (从0开始)
            style_name: 样式名称 ('Table Grid', 'Light Shading', 'Medium Shading 1', 等)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: apply_word_table_style(filename={filename})")
        return word_handler.apply_table_style(filename, table_index, style_name)

    @mcp.tool()
    def set_word_table_borders(
        filename: str,
        table_index: int,
        border_style: str = "single",
        border_size: int = 4,
        border_color: str = "#000000",
    ) -> dict[str, Any]:
        """设置 Word 表格边框.

        Args:
            filename: 文件名
            table_index: 表格索引 (从0开始)
            border_style: 边框样式 ('single', 'double', 'dotted', 'dashed')
            border_size: 边框粗细 (1-96)
            border_color: 边框颜色 HEX格式

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: set_word_table_borders(filename={filename})")
        return word_handler.set_table_borders(filename, table_index, border_style, border_size, border_color)

    @mcp.tool()
    def set_word_column_width(
        filename: str,
        table_index: int,
        col_index: int,
        width_inches: float,
    ) -> dict[str, Any]:
        """设置 Word 表格列宽.

        Args:
            filename: 文件名
            table_index: 表格索引 (从0开始)
            col_index: 列索引
            width_inches: 列宽 (英寸)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: set_word_column_width(filename={filename})")
        return word_handler.set_column_width(filename, table_index, col_index, width_inches)

    @mcp.tool()
    def set_word_row_height(
        filename: str,
        table_index: int,
        row_index: int,
        height_inches: float,
    ) -> dict[str, Any]:
        """设置 Word 表格行高.

        Args:
            filename: 文件名
            table_index: 表格索引 (从0开始)
            row_index: 行索引
            height_inches: 行高 (英寸)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: set_word_row_height(filename={filename})")
        return word_handler.set_row_height(filename, table_index, row_index, height_inches)

    @mcp.tool()
    def read_word_table_data(
        filename: str,
        table_index: int,
    ) -> dict[str, Any]:
        """读取 Word 表格数据.

        Args:
            filename: 文件名
            table_index: 表格索引 (从0开始)

        Returns:
            dict: 表格数据
        """
        logger.info(f"MCP工具调用: read_word_table_data(filename={filename})")
        return word_handler.read_table_data(filename, table_index)

    # ========== 书签和超链接功能 ==========
    @mcp.tool()
    def add_word_bookmark(
        filename: str,
        paragraph_index: int,
        bookmark_name: str,
    ) -> dict[str, Any]:
        """向 Word 文档添加书签.

        Args:
            filename: 文件名
            paragraph_index: 段落索引 (从0开始)
            bookmark_name: 书签名称

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_word_bookmark(filename={filename})")
        return word_handler.add_bookmark(filename, paragraph_index, bookmark_name)

    @mcp.tool()
    def list_word_bookmarks(
        filename: str,
    ) -> dict[str, Any]:
        """列出 Word 文档中的所有书签.

        Args:
            filename: 文件名

        Returns:
            dict: 书签列表
        """
        logger.info(f"MCP工具调用: list_word_bookmarks(filename={filename})")
        return word_handler.list_bookmarks(filename)

    @mcp.tool()
    def add_word_hyperlink(
        filename: str,
        paragraph_index: int,
        text: str,
        url: str,
        link_type: str = "url",
    ) -> dict[str, Any]:
        """向 Word 文档添加超链接.

        Args:
            filename: 文件名
            paragraph_index: 段落索引 (从0开始)
            text: 链接文本
            url: 链接地址
            link_type: 链接类型 ('url'网址, 'email'邮箱, 'bookmark'书签)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_word_hyperlink(filename={filename})")
        return word_handler.add_hyperlink(filename, paragraph_index, text, url, link_type)

    @mcp.tool()
    def extract_word_hyperlinks(
        filename: str,
    ) -> dict[str, Any]:
        """提取 Word 文档中的所有超链接.

        Args:
            filename: 文件名

        Returns:
            dict: 超链接列表
        """
        logger.info(f"MCP工具调用: extract_word_hyperlinks(filename={filename})")
        return word_handler.extract_hyperlinks(filename)

    # ========== 内容提取功能 ==========
    @mcp.tool()
    def extract_word_text(
        filename: str,
        include_tables: bool = False,
    ) -> dict[str, Any]:
        """提取 Word 文档中的所有文本.

        Args:
            filename: 文件名
            include_tables: 是否包含表格文本 (默认 False)

        Returns:
            dict: 文本内容
        """
        logger.info(f"MCP工具调用: extract_word_text(filename={filename})")
        return word_handler.extract_text(filename, include_tables)

    @mcp.tool()
    def extract_word_headings(
        filename: str,
        max_level: int = 9,
    ) -> dict[str, Any]:
        """提取 Word 文档中的所有标题.

        Args:
            filename: 文件名
            max_level: 最大标题级别 (1-9)

        Returns:
            dict: 标题列表
        """
        logger.info(f"MCP工具调用: extract_word_headings(filename={filename})")
        return word_handler.extract_headings(filename, max_level)

    @mcp.tool()
    def extract_word_tables(
        filename: str,
    ) -> dict[str, Any]:
        """提取 Word 文档中的所有表格数据.

        Args:
            filename: 文件名

        Returns:
            dict: 表格数据列表
        """
        logger.info(f"MCP工具调用: extract_word_tables(filename={filename})")
        return word_handler.extract_tables(filename)

    @mcp.tool()
    def extract_word_images(
        filename: str,
    ) -> dict[str, Any]:
        """提取 Word 文档中的所有图片信息.

        Args:
            filename: 文件名

        Returns:
            dict: 图片信息列表
        """
        logger.info(f"MCP工具调用: extract_word_images(filename={filename})")
        return word_handler.extract_images(filename)

    @mcp.tool()
    def get_word_statistics(
        filename: str,
    ) -> dict[str, Any]:
        """获取 Word 文档统计信息.

        Args:
            filename: 文件名

        Returns:
            dict: 统计信息(段落数、表格数、字数等)
        """
        logger.info(f"MCP工具调用: get_word_statistics(filename={filename})")
        return word_handler.get_document_statistics(filename)

    # ========== 批量操作功能 ==========
    @mcp.tool()
    def batch_replace_word_text(
        filenames: List[str],
        search_text: str,
        replace_text: str,
    ) -> dict[str, Any]:
        """批量替换多个 Word 文档中的文本.

        Args:
            filenames: 文件名列表
            search_text: 要查找的文本
            replace_text: 替换为的文本

        Returns:
            dict: 批量操作结果
        """
        logger.info(f"MCP工具调用: batch_replace_word_text(files={len(filenames)})")
        return word_handler.batch_replace_text(filenames, search_text, replace_text)

    @mcp.tool()
    def batch_apply_word_style(
        filenames: List[str],
        style_name: str,
        apply_to: str = "body",
    ) -> dict[str, Any]:
        """批量应用样式到多个 Word 文档.

        Args:
            filenames: 文件名列表
            style_name: 样式名称
            apply_to: 应用范围 ('body'正文 或 'headings'标题)

        Returns:
            dict: 批量操作结果
        """
        logger.info(f"MCP工具调用: batch_apply_word_style(files={len(filenames)})")
        return word_handler.batch_apply_style(filenames, style_name, apply_to)

    @mcp.tool()
    def merge_word_documents(
        source_filenames: List[str],
        output_filename: str,
        add_page_breaks: bool = True,
    ) -> dict[str, Any]:
        """合并多个 Word 文档.

        Args:
            source_filenames: 源文件名列表
            output_filename: 输出文件名
            add_page_breaks: 是否在文档间添加分页符 (默认 True)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: merge_word_documents(sources={len(source_filenames)})")
        return word_handler.merge_documents(source_filenames, output_filename, add_page_breaks)

    @mcp.tool()
    def split_word_document(
        filename: str,
        heading_level: int = 1,
        output_pattern: str = "section_{index}.docx",
    ) -> dict[str, Any]:
        """按标题拆分 Word 文档.

        Args:
            filename: 文件名
            heading_level: 标题级别 (1-9)
            output_pattern: 输出文件名模式 (可使用 {index} 占位符)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: split_word_document(filename={filename})")
        return word_handler.split_document_by_headings(filename, heading_level, output_pattern)

    # ========== 新增功能工具 ==========
    @mcp.tool()
    def find_text_regex_in_word(filename: str, regex_pattern: str, case_sensitive: bool = False) -> dict[str, Any]:
        """使用正则表达式在 Word 文档中查找文本.

        Args:
            filename: 文件名
            regex_pattern: 正则表达式模式
            case_sensitive: 是否区分大小写 (默认 False)

        Returns:
            dict: 查找结果,包含匹配的段落和位置
        """
        logger.info(f"MCP工具调用: find_text_regex_in_word(filename={filename})")
        return word_handler.find_text_regex(filename, regex_pattern, case_sensitive)

    @mcp.tool()
    def replace_text_regex_in_word(filename: str, regex_pattern: str, replacement: str, case_sensitive: bool = False, max_replacements: Optional[int] = None) -> dict[str, Any]:
        """使用正则表达式在 Word 文档中替换文本.

        Args:
            filename: 文件名
            regex_pattern: 正则表达式模式
            replacement: 替换文本 (支持反向引用 \\1, \\2 等)
            case_sensitive: 是否区分大小写 (默认 False)
            max_replacements: 最大替换次数 (可选,默认全部替换)

        Returns:
            dict: 替换结果
        """
        logger.info(f"MCP工具调用: replace_text_regex_in_word(filename={filename})")
        return word_handler.replace_text_regex(filename, regex_pattern, replacement, case_sensitive, max_replacements)

    @mcp.tool()
    def insert_special_character_to_word(filename: str, paragraph_index: int, character_name: str, position: Optional[int] = None) -> dict[str, Any]:
        """向 Word 文档插入特殊字符.

        Args:
            filename: 文件名
            paragraph_index: 段落索引
            character_name: 字符名称 (如 'copyright', 'trademark', 'degree', 'arrow_right' 等)
            position: 插入位置 (可选,默认在段落末尾)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: insert_special_character_to_word(filename={filename})")
        return word_handler.insert_special_character(filename, paragraph_index, character_name, position)

    @mcp.tool()
    def add_multilevel_list_to_word(filename: str, items: list[dict[str, Any]], list_type: str = "bullet") -> dict[str, Any]:
        """向 Word 文档添加多级列表.

        Args:
            filename: 文件名
            items: 列表项数组,每项包含 'text' 和 'level' (0-8)
            list_type: 列表类型 ('bullet' 或 'number')

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_multilevel_list_to_word(filename={filename})")
        return word_handler.add_multilevel_list(filename, items, list_type)

    @mcp.tool()
    def sort_word_table(filename: str, table_index: int, column_index: int, reverse: bool = False, has_header: bool = True) -> dict[str, Any]:
        """对 Word 表格进行排序.

        Args:
            filename: 文件名
            table_index: 表格索引
            column_index: 排序列索引
            reverse: 是否降序 (默认 False 升序)
            has_header: 是否有表头 (默认 True)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: sort_word_table(filename={filename})")
        return word_handler.sort_table(filename, table_index, column_index, reverse, has_header)

    @mcp.tool()
    def import_word_table_data(filename: str, data: list[list[str]], has_header: bool = True, table_style: str = "Table Grid") -> dict[str, Any]:
        """从数据导入创建 Word 表格.

        Args:
            filename: 文件名
            data: 二维数组数据
            has_header: 第一行是否为表头 (默认 True)
            table_style: 表格样式 (默认 'Table Grid')

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: import_word_table_data(filename={filename})")
        return word_handler.import_table_data(filename, data, has_header, table_style)

    @mcp.tool()
    def insert_image_from_url_to_word(filename: str, image_url: str, width_inches: Optional[float] = None, height_inches: Optional[float] = None, alignment: str = "left") -> dict[str, Any]:
        """从 URL 插入图片到 Word 文档.

        Args:
            filename: 文件名
            image_url: 图片 URL
            width_inches: 宽度(英寸,可选)
            height_inches: 高度(英寸,可选)
            alignment: 对齐方式 ('left', 'center', 'right')

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: insert_image_from_url_to_word(filename={filename})")
        return word_handler.insert_image_from_url(filename, image_url, width_inches, height_inches, alignment)

    @mcp.tool()
    def insert_image_with_size_to_word(filename: str, image_path: str, width_inches: Optional[float] = None, height_inches: Optional[float] = None, alignment: str = "left", keep_aspect_ratio: bool = True) -> dict[str, Any]:
        """插入图片到 Word 文档并设置完整的大小和对齐方式.

        Args:
            filename: 文件名
            image_path: 图片路径
            width_inches: 宽度(英寸,可选)
            height_inches: 高度(英寸,可选)
            alignment: 对齐方式 ('left', 'center', 'right')
            keep_aspect_ratio: 是否保持宽高比 (默认 True)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: insert_image_with_size_to_word(filename={filename})")
        return word_handler.insert_image_with_size(filename, image_path, width_inches, height_inches, alignment, keep_aspect_ratio)

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
    def delete_word_bookmark(filename: str, bookmark_name: str) -> dict[str, Any]:
        """删除 Word 文档中的书签.

        Args:
            filename: 文件名
            bookmark_name: 书签名称

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: delete_word_bookmark(filename={filename})")
        return word_handler.delete_bookmark(filename, bookmark_name)

    @mcp.tool()
    def batch_update_word_hyperlinks(filename: str, old_domain: str, new_domain: str) -> dict[str, Any]:
        """批量更新 Word 文档中的超链接域名.

        Args:
            filename: 文件名
            old_domain: 旧域名
            new_domain: 新域名

        Returns:
            dict: 操作结果,包含更新数量
        """
        logger.info(f"MCP工具调用: batch_update_word_hyperlinks(filename={filename})")
        return word_handler.batch_update_hyperlinks(filename, old_domain, new_domain)

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
        return word_handler.add_header_footer_different_odd_even(filename, odd_header, even_header, odd_footer, even_footer)

    @mcp.tool()
    def insert_datetime_field_to_word(filename: str, paragraph_index: int, format_string: str = "yyyy-MM-dd", field_type: str = "date") -> dict[str, Any]:
        """插入日期时间域到 Word 文档.

        Args:
            filename: 文件名
            paragraph_index: 段落索引
            format_string: 日期时间格式 (默认 'yyyy-MM-dd')
            field_type: 域类型 ('date' 或 'time')

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: insert_datetime_field_to_word(filename={filename})")
        return word_handler.insert_datetime_field(filename, paragraph_index, format_string, field_type)

    @mcp.tool()
    def batch_convert_word_format(filenames: List[str], output_format: str = "pdf") -> dict[str, Any]:
        """批量转换 Word 文档格式.

        Args:
            filenames: 文件名列表
            output_format: 输出格式 ('pdf', 'html', 'txt', 'markdown')

        Returns:
            dict: 批量操作结果
        """
        logger.info(f"MCP工具调用: batch_convert_word_format(files={len(filenames)})")
        return word_handler.batch_convert_format(filenames, output_format)

    @mcp.tool()
    def batch_add_word_header_footer(filenames: List[str], header_text: Optional[str] = None, footer_text: Optional[str] = None, add_page_number: bool = False) -> dict[str, Any]:
        """批量添加页眉页脚到多个 Word 文档.

        Args:
            filenames: 文件名列表
            header_text: 页眉文本 (可选)
            footer_text: 页脚文本 (可选)
            add_page_number: 是否添加页码 (默认 False)

        Returns:
            dict: 批量操作结果
        """
        logger.info(f"MCP工具调用: batch_add_word_header_footer(files={len(filenames)})")
        return word_handler.batch_add_header_footer(filenames, header_text, footer_text, add_page_number)

    @mcp.tool()
    def batch_insert_word_content(filenames: List[str], content: str, position: str = "end", paragraph_index: Optional[int] = None) -> dict[str, Any]:
        """批量插入内容到多个 Word 文档.

        Args:
            filenames: 文件名列表
            content: 要插入的内容
            position: 插入位置 ('start', 'end', 'index')
            paragraph_index: 段落索引 (当 position='index' 时使用)

        Returns:
            dict: 批量操作结果
        """
        logger.info(f"MCP工具调用: batch_insert_word_content(files={len(filenames)})")
        return word_handler.batch_insert_content(filenames, content, position, paragraph_index)

    logger.info("Word MCP 工具注册完成 - 包含 55+ 工具")
