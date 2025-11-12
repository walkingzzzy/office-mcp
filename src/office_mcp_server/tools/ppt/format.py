"""PowerPoint 格式化工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.ppt_handler import PowerPointHandler


def register_format_tools(mcp: FastMCP, ppt_handler: PowerPointHandler) -> None:
    """注册 PowerPoint 格式化工具."""

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
