"""PowerPoint MCP 工具定义模块.

定义所有 PowerPoint 相关的 MCP 工具。
"""

from typing import Any, Optional, List

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.ppt_handler import PowerPointHandler

# 创建 PowerPoint 处理器实例
ppt_handler = PowerPointHandler()


def register_ppt_tools(mcp: FastMCP) -> None:
    """注册 PowerPoint 工具到 MCP 服务器.

    Args:
        mcp: FastMCP 服务器实例
    """

    @mcp.tool()
    def create_powerpoint_presentation(
        filename: str, title: str = "", template_path: Optional[str] = None
    ) -> dict[str, Any]:
        """创建 PowerPoint 演示文稿.

        Args:
            filename: 文件名 (如 'presentation.pptx')
            title: 演示标题 (可选)
            template_path: 模板文件路径 (可选，如果提供则基于模板创建)

        Returns:
            dict: 操作结果,包含文件路径和状态
        """
        logger.info(f"MCP工具调用: create_powerpoint_presentation(filename={filename}, template={template_path})")
        return ppt_handler.create_presentation(filename, title, template_path)

    @mcp.tool()
    def add_slide_to_ppt(
        filename: str, layout_index: int = 1, title: str = ""
    ) -> dict[str, Any]:
        """向 PowerPoint 演示文稿添加幻灯片.

        Args:
            filename: 文件名
            layout_index: 布局索引 (0-标题页, 1-标题和内容, 默认 1)
            title: 幻灯片标题 (可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_slide_to_ppt(filename={filename})")
        return ppt_handler.add_slide(filename, layout_index, title)

    @mcp.tool()
    def add_text_to_ppt(
        filename: str,
        slide_index: int,
        text: str,
        left_inches: float = 1.0,
        top_inches: float = 1.0,
        width_inches: float = 8.0,
        height_inches: float = 1.0,
    ) -> dict[str, Any]:
        """向 PowerPoint 幻灯片添加文本框.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引 (从0开始)
            text: 文本内容
            left_inches: 左边距 (英寸, 默认 1.0)
            top_inches: 上边距 (英寸, 默认 1.0)
            width_inches: 宽度 (英寸, 默认 8.0)
            height_inches: 高度 (英寸, 默认 1.0)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_text_to_ppt(filename={filename}, slide={slide_index})")
        return ppt_handler.add_text(
            filename, slide_index, text, left_inches, top_inches, width_inches, height_inches
        )

    @mcp.tool()
    def add_image_to_ppt(
        filename: str,
        slide_index: int,
        image_path: str,
        left_inches: float = 1.0,
        top_inches: float = 1.0,
        width_inches: Optional[float] = None,
    ) -> dict[str, Any]:
        """向 PowerPoint 幻灯片添加图片.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引 (从0开始)
            image_path: 图片文件路径
            left_inches: 左边距 (英寸, 默认 1.0)
            top_inches: 上边距 (英寸, 默认 1.0)
            width_inches: 图片宽度 (英寸, 可选)

        Returns:
            dict: 操作结果
        """
        logger.info(
            f"MCP工具调用: add_image_to_ppt(filename={filename}, slide={slide_index})"
        )
        return ppt_handler.add_image(
            filename, slide_index, image_path, left_inches, top_inches, width_inches
        )

    @mcp.tool()
    def add_table_to_ppt(
        filename: str,
        slide_index: int,
        rows: int,
        cols: int,
        data: Optional[list[list[str]]] = None,
    ) -> dict[str, Any]:
        """向 PowerPoint 幻灯片添加表格.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引 (从0开始)
            rows: 行数
            cols: 列数
            data: 表格数据 (可选, 二维列表)

        Returns:
            dict: 操作结果
        """
        logger.info(
            f"MCP工具调用: add_table_to_ppt(filename={filename}, slide={slide_index})"
        )
        return ppt_handler.add_table(filename, slide_index, rows, cols, data)

    @mcp.tool()
    def get_ppt_presentation_info(filename: str) -> dict[str, Any]:
        """获取 PowerPoint 演示文稿信息.

        Args:
            filename: 文件名

        Returns:
            dict: 演示文稿信息 (幻灯片数量等)
        """
        logger.info(f"MCP工具调用: get_ppt_presentation_info(filename={filename})")
        return ppt_handler.get_presentation_info(filename)

    @mcp.tool()
    def delete_ppt_slide(filename: str, slide_index: int) -> dict[str, Any]:
        """删除 PowerPoint 幻灯片.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引 (从0开始)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: delete_ppt_slide(filename={filename})")
        return ppt_handler.delete_slide(filename, slide_index)

    @mcp.tool()
    def move_ppt_slide(
        filename: str, from_index: int, to_index: int
    ) -> dict[str, Any]:
        """移动 PowerPoint 幻灯片位置.

        Args:
            filename: 文件名
            from_index: 源位置索引 (从0开始)
            to_index: 目标位置索引 (从0开始)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: move_ppt_slide(filename={filename})")
        return ppt_handler.move_slide(filename, from_index, to_index)

    @mcp.tool()
    def duplicate_ppt_slide(filename: str, slide_index: int) -> dict[str, Any]:
        """复制 PowerPoint 幻灯片.

        Args:
            filename: 文件名
            slide_index: 要复制的幻灯片索引 (从0开始)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: duplicate_ppt_slide(filename={filename})")
        return ppt_handler.duplicate_slide(filename, slide_index)

    @mcp.tool()
    def format_ppt_text(
        filename: str,
        slide_index: int,
        shape_index: int,
        font_name: Optional[str] = None,
        font_size: Optional[int] = None,
        bold: bool = False,
        italic: bool = False,
        underline: bool = False,
        color: Optional[str] = None,
        alignment: Optional[str] = None,
    ) -> dict[str, Any]:
        """格式化 PowerPoint 文本.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引 (从0开始)
            shape_index: 形状索引 (从0开始)
            font_name: 字体名称 (可选)
            font_size: 字号 (可选)
            bold: 是否加粗 (默认 False)
            italic: 是否斜体 (默认 False)
            underline: 是否下划线 (默认 False)
            color: 文字颜色 HEX格式 (如 '#FF0000', 可选)
            alignment: 对齐方式 ('left'左对齐, 'center'居中, 'right'右对齐, 'justify'两端对齐, 可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: format_ppt_text(filename={filename})")
        return ppt_handler.format_text(
            filename, slide_index, shape_index, font_name, font_size,
            bold, italic, underline, color, alignment
        )

    @mcp.tool()
    def apply_ppt_theme(
        filename: str,
        theme_name: str,
        apply_to_all: bool = True,
    ) -> dict[str, Any]:
        """应用 PowerPoint 主题.

        Args:
            filename: 文件名
            theme_name: 主题名称 ('Office'Office主题, 'Facet'刻面, 'Ion'离子, 'Wisp'微风,
                       'Integral'整体, 'Slice'切片, 'Droplet'水滴)
            apply_to_all: 是否应用到所有幻灯片 (默认 True)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: apply_ppt_theme(filename={filename}, theme={theme_name})")
        return ppt_handler.apply_theme(filename, theme_name, apply_to_all)

    @mcp.tool()
    def set_ppt_transition(
        filename: str,
        slide_index: int,
        transition_type: str = "fade",
        duration: float = 1.0,
        apply_to_all: bool = False,
    ) -> dict[str, Any]:
        """设置 PowerPoint 幻灯片过渡效果.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引 (从0开始)
            transition_type: 过渡类型 ('fade'淡出, 'push'推进, 'wipe'擦除, 'split'分割,
                           'reveal'揭开, 'random'随机, 'none'无, 默认 'fade')
            duration: 过渡时长(秒) (默认 1.0)
            apply_to_all: 是否应用到所有幻灯片 (默认 False)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: set_ppt_transition(filename={filename}, type={transition_type})")
        return ppt_handler.set_transition(
            filename, slide_index, transition_type, duration, apply_to_all
        )

    @mcp.tool()
    def export_ppt_presentation(
        filename: str,
        export_format: str = "pdf",
        output_filename: Optional[str] = None,
    ) -> dict[str, Any]:
        """导出 PowerPoint 演示文稿到其他格式.

        Args:
            filename: 源文件名
            export_format: 导出格式 ('pdf'PDF, 'html'HTML网页, 'images'图片序列, 默认 'pdf')
            output_filename: 输出文件名 (可选,默认与源文件同名)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: export_ppt_presentation(filename={filename}, format={export_format})")
        return ppt_handler.export_presentation(filename, export_format, output_filename)

    @mcp.tool()
    def add_ppt_animation(
        filename: str,
        slide_index: int,
        shape_index: int,
        animation_type: str = "fade",
        duration: float = 0.5,
        delay: float = 0.0,
        trigger: str = "onclick",
    ) -> dict[str, Any]:
        """添加 PowerPoint 动画效果.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引（从0开始）
            shape_index: 形状索引（从0开始）
            animation_type: 动画类型 ('fade'淡入, 'fly'飞入, 'wipe'擦除, 'split'分割, 'appear'出现, 'zoom'缩放, 'swivel'旋转, 默认 'fade')
            duration: 动画持续时间（秒, 默认 0.5）
            delay: 动画延迟时间（秒, 默认 0.0）
            trigger: 触发方式 ('onclick'单击时, 'withprevious'与上一动画同时, 'afterprevious'上一动画之后, 默认 'onclick')

        Returns:
            dict: 操作结果

        Note:
            此功能需要 Windows 环境和 Microsoft PowerPoint 应用程序，或安装 pywin32 库
        """
        logger.info(f"MCP工具调用: add_ppt_animation(filename={filename}, type={animation_type})")
        return ppt_handler.add_animation(
            filename, slide_index, shape_index, animation_type,
            duration, delay, trigger
        )

    # ========== 文本高级格式化 ==========
    @mcp.tool()
    def add_ppt_bullet_points(
        filename: str,
        slide_index: int,
        shape_index: int,
        bullet_type: str = "bullet",
        level: int = 0,
    ) -> dict[str, Any]:
        """为 PowerPoint 文本添加项目符号或编号.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引（从0开始）
            shape_index: 形状索引（从0开始）
            bullet_type: 项目符号类型 ('bullet'项目符号, 'number'编号列表, 'none'无, 默认 'bullet')
            level: 缩进级别 (0-8, 默认 0)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_ppt_bullet_points(filename={filename}, type={bullet_type})")
        return ppt_handler.add_bullet_points(filename, slide_index, shape_index, bullet_type, level)

    @mcp.tool()
    def set_ppt_paragraph_format(
        filename: str,
        slide_index: int,
        shape_index: int,
        line_spacing: Optional[float] = None,
        space_before: Optional[float] = None,
        space_after: Optional[float] = None,
        indent_level: int = 0,
    ) -> dict[str, Any]:
        """设置 PowerPoint 段落格式.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引（从0开始）
            shape_index: 形状索引（从0开始）
            line_spacing: 行距倍数 (如 1.5 表示1.5倍行距, 可选)
            space_before: 段前间距（磅值, 可选）
            space_after: 段后间距（磅值, 可选）
            indent_level: 缩进级别 (0-8, 默认 0)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: set_ppt_paragraph_format(filename={filename})")
        return ppt_handler.set_paragraph_format(
            filename, slide_index, shape_index, line_spacing, space_before, space_after, indent_level
        )

    @mcp.tool()
    def set_ppt_slide_background(
        filename: str,
        slide_index: int,
        background_type: str = "solid",
        color: Optional[str] = None,
        image_path: Optional[str] = None,
        apply_to_all: bool = False,
    ) -> dict[str, Any]:
        """设置 PowerPoint 幻灯片背景.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引（从0开始）
            background_type: 背景类型 ('solid'纯色, 'gradient'渐变, 'image'图片, 默认 'solid')
            color: 背景颜色 HEX格式 (如 '#FF0000', 可选)
            image_path: 背景图片路径 (当 background_type='image' 时必需)
            apply_to_all: 是否应用到所有幻灯片 (默认 False)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: set_ppt_slide_background(filename={filename}, type={background_type})")
        return ppt_handler.set_slide_background(
            filename, slide_index, background_type, color, image_path, apply_to_all
        )

    # ========== 表格高级操作 ==========
    @mcp.tool()
    def insert_ppt_table_row(
        filename: str,
        slide_index: int,
        table_index: int,
        row_index: int,
        data: Optional[List[str]] = None,
    ) -> dict[str, Any]:
        """向 PowerPoint 表格插入行.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引（从0开始）
            table_index: 表格索引（从0开始）
            row_index: 插入位置索引
            data: 行数据列表 (可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: insert_ppt_table_row(filename={filename})")
        return ppt_handler.insert_table_row(filename, slide_index, table_index, row_index, data)

    @mcp.tool()
    def merge_ppt_table_cells(
        filename: str,
        slide_index: int,
        table_index: int,
        start_row: int,
        start_col: int,
        end_row: int,
        end_col: int,
    ) -> dict[str, Any]:
        """合并 PowerPoint 表格单元格.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引（从0开始）
            table_index: 表格索引（从0开始）
            start_row: 起始行索引
            start_col: 起始列索引
            end_row: 结束行索引
            end_col: 结束列索引

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: merge_ppt_table_cells(filename={filename})")
        return ppt_handler.merge_table_cells(
            filename, slide_index, table_index, start_row, start_col, end_row, end_col
        )

    @mcp.tool()
    def format_ppt_table_cell(
        filename: str,
        slide_index: int,
        table_index: int,
        row: int,
        col: int,
        fill_color: Optional[str] = None,
        text_color: Optional[str] = None,
        bold: bool = False,
        font_size: Optional[int] = None,
    ) -> dict[str, Any]:
        """格式化 PowerPoint 表格单元格.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引（从0开始）
            table_index: 表格索引（从0开始）
            row: 行索引
            col: 列索引
            fill_color: 填充颜色 HEX格式 (如 '#FF0000', 可选)
            text_color: 文字颜色 HEX格式 (可选)
            bold: 是否加粗 (默认 False)
            font_size: 字号 (可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: format_ppt_table_cell(filename={filename})")
        return ppt_handler.format_table_cell(
            filename, slide_index, table_index, row, col, fill_color, text_color, bold, font_size
        )

    # ========== 形状操作 ==========
    @mcp.tool()
    def add_ppt_shape(
        filename: str,
        slide_index: int,
        shape_type: str,
        left_inches: float,
        top_inches: float,
        width_inches: float,
        height_inches: float,
        text: Optional[str] = None,
        fill_color: Optional[str] = None,
        line_color: Optional[str] = None,
    ) -> dict[str, Any]:
        """向 PowerPoint 幻灯片添加形状.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引（从0开始）
            shape_type: 形状类型 ('rectangle'矩形, 'oval'椭圆, 'triangle'三角形, 'arrow'箭头, 'rounded_rectangle'圆角矩形)
            left_inches: 左边距（英寸）
            top_inches: 上边距（英寸）
            width_inches: 宽度（英寸）
            height_inches: 高度（英寸）
            text: 形状中的文本 (可选)
            fill_color: 填充颜色 HEX格式 (可选)
            line_color: 线条颜色 HEX格式 (可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_ppt_shape(filename={filename}, type={shape_type})")
        return ppt_handler.add_shape(
            filename, slide_index, shape_type, left_inches, top_inches,
            width_inches, height_inches, text, fill_color, line_color
        )

    # ========== 图表操作 ==========
    @mcp.tool()
    def add_ppt_chart(
        filename: str,
        slide_index: int,
        chart_type: str,
        categories: List[str],
        series_data: dict[str, List[float]],
        left_inches: float = 1.0,
        top_inches: float = 1.5,
        width_inches: float = 8.0,
        height_inches: float = 5.0,
        title: Optional[str] = None,
    ) -> dict[str, Any]:
        """向 PowerPoint 幻灯片添加图表.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引（从0开始）
            chart_type: 图表类型 ('column'柱状图, 'bar'条形图, 'line'折线图, 'pie'饼图, 'area'面积图)
            categories: 分类标签列表
            series_data: 系列数据字典 {"系列名": [数据列表]}
            left_inches: 左边距（英寸, 默认 1.0）
            top_inches: 上边距（英寸, 默认 1.5）
            width_inches: 宽度（英寸, 默认 8.0）
            height_inches: 高度（英寸, 默认 5.0）
            title: 图表标题 (可选)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_ppt_chart(filename={filename}, type={chart_type})")
        return ppt_handler.add_chart(
            filename, slide_index, chart_type, categories, series_data,
            left_inches, top_inches, width_inches, height_inches, title
        )

    # ========== 备注和批注 ==========
    @mcp.tool()
    def add_ppt_speaker_notes(
        filename: str,
        slide_index: int,
        notes_text: str,
    ) -> dict[str, Any]:
        """向 PowerPoint 幻灯片添加演讲者备注.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引（从0开始）
            notes_text: 备注文本

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_ppt_speaker_notes(filename={filename})")
        return ppt_handler.add_speaker_notes(filename, slide_index, notes_text)

    @mcp.tool()
    def get_ppt_speaker_notes(
        filename: str,
        slide_index: int,
    ) -> dict[str, Any]:
        """获取 PowerPoint 幻灯片的演讲者备注.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引（从0开始）

        Returns:
            dict: 包含备注文本的操作结果
        """
        logger.info(f"MCP工具调用: get_ppt_speaker_notes(filename={filename})")
        return ppt_handler.get_speaker_notes(filename, slide_index)

    # ========== 页眉页脚 ==========
    @mcp.tool()
    def set_ppt_header_footer(
        filename: str,
        show_date: bool = False,
        show_slide_number: bool = True,
        footer_text: Optional[str] = None,
        apply_to_all: bool = True,
    ) -> dict[str, Any]:
        """设置 PowerPoint 页眉页脚.

        Args:
            filename: 文件名
            show_date: 是否显示日期 (默认 False)
            show_slide_number: 是否显示幻灯片编号 (默认 True)
            footer_text: 页脚文本 (可选)
            apply_to_all: 是否应用到所有幻灯片 (默认 True)

        Returns:
            dict: 操作结果

        Note:
            python-pptx 对页眉页脚的支持有限，完整功能需要 win32com
        """
        logger.info(f"MCP工具调用: set_ppt_header_footer(filename={filename})")
        return ppt_handler.set_header_footer(filename, show_date, show_slide_number, footer_text, apply_to_all)

    # ========== 超链接 ==========
    @mcp.tool()
    def add_ppt_hyperlink(
        filename: str,
        slide_index: int,
        shape_index: int,
        url: str,
        link_type: str = "url",
    ) -> dict[str, Any]:
        """向 PowerPoint 形状添加超链接.

        Args:
            filename: 文件名
            slide_index: 幻灯片索引（从0开始）
            shape_index: 形状索引（从0开始）
            url: 链接地址
            link_type: 链接类型 ('url'网址链接, 'slide'幻灯片链接, 'file'文件链接, 'email'邮箱链接, 默认 'url')

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: add_ppt_hyperlink(filename={filename}, type={link_type})")
        return ppt_handler.add_hyperlink(filename, slide_index, shape_index, url, link_type)

    # ========== 批量操作 ==========
    @mcp.tool()
    def batch_set_ppt_transition(
        filename: str,
        slide_indices: Optional[List[int]],
        transition_type: str,
        duration: float = 1.0,
    ) -> dict[str, Any]:
        """批量设置 PowerPoint 幻灯片过渡效果.

        Args:
            filename: 文件名
            slide_indices: 幻灯片索引列表 (None 表示所有幻灯片)
            transition_type: 过渡类型 ('fade'淡出, 'push'推进, 'wipe'擦除, 'split'分割, 'reveal'揭开, 'random'随机, 'none'无)
            duration: 过渡时长（秒, 默认 1.0）

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: batch_set_ppt_transition(filename={filename})")
        return ppt_handler.batch_set_transition(filename, slide_indices, transition_type, duration)

    @mcp.tool()
    def batch_add_ppt_footer(
        filename: str,
        footer_text: str,
        slide_indices: Optional[List[int]] = None,
    ) -> dict[str, Any]:
        """批量向 PowerPoint 幻灯片添加页脚.

        Args:
            filename: 文件名
            footer_text: 页脚文本
            slide_indices: 幻灯片索引列表 (None 表示所有幻灯片)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: batch_add_ppt_footer(filename={filename})")
        return ppt_handler.batch_add_footer(filename, footer_text, slide_indices)

    # ========== 内容提取 ==========
    @mcp.tool()
    def extract_ppt_text(filename: str) -> dict[str, Any]:
        """提取 PowerPoint 演示文稿中的所有文本内容.

        Args:
            filename: 文件名

        Returns:
            dict: 包含所有文本内容的结果，包括每张幻灯片的文本和汇总的所有文本
        """
        logger.info(f"MCP工具调用: extract_ppt_text(filename={filename})")
        return ppt_handler.extract_all_text(filename)

    @mcp.tool()
    def extract_ppt_titles(filename: str) -> dict[str, Any]:
        """提取 PowerPoint 演示文稿中所有幻灯片的标题.

        Args:
            filename: 文件名

        Returns:
            dict: 包含所有幻灯片标题的结果
        """
        logger.info(f"MCP工具调用: extract_ppt_titles(filename={filename})")
        return ppt_handler.extract_titles(filename)

    @mcp.tool()
    def extract_ppt_notes(filename: str) -> dict[str, Any]:
        """提取 PowerPoint 演示文稿中所有演讲者备注.

        Args:
            filename: 文件名

        Returns:
            dict: 包含所有演讲者备注的结果
        """
        logger.info(f"MCP工具调用: extract_ppt_notes(filename={filename})")
        return ppt_handler.extract_notes(filename)

    @mcp.tool()
    def extract_ppt_images(filename: str) -> dict[str, Any]:
        """提取 PowerPoint 演示文稿中所有图片的信息.

        Args:
            filename: 文件名

        Returns:
            dict: 包含所有图片信息的结果（位置、大小、类型等）
        """
        logger.info(f"MCP工具调用: extract_ppt_images(filename={filename})")
        return ppt_handler.extract_images(filename)

    @mcp.tool()
    def extract_ppt_hyperlinks(filename: str) -> dict[str, Any]:
        """提取 PowerPoint 演示文稿中所有超链接.

        Args:
            filename: 文件名

        Returns:
            dict: 包含所有超链接的结果（链接文本、URL、位置等）
        """
        logger.info(f"MCP工具调用: extract_ppt_hyperlinks(filename={filename})")
        return ppt_handler.extract_hyperlinks(filename)

    @mcp.tool()
    def extract_ppt_all_content(filename: str) -> dict[str, Any]:
        """提取 PowerPoint 演示文稿的所有内容（文本、标题、备注、图片、超链接）.

        Args:
            filename: 文件名

        Returns:
            dict: 包含所有内容的综合结果
        """
        logger.info(f"MCP工具调用: extract_ppt_all_content(filename={filename})")
        return ppt_handler.extract_all_content(filename)

    logger.info("PowerPoint MCP 工具注册完成")
