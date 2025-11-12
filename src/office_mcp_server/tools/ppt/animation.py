"""PowerPoint 动画和过渡工具."""

from typing import Any, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.ppt_handler import PowerPointHandler


def register_animation_tools(mcp: FastMCP, ppt_handler: PowerPointHandler) -> None:
    """注册 PowerPoint 动画和过渡工具."""

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

    @mcp.tool()
    def set_ppt_header_footer(
        filename: str,
        header_text: Optional[str] = None,
        footer_text: Optional[str] = None,
        show_date: bool = False,
        show_slide_number: bool = False,
        apply_to_all: bool = True,
    ) -> dict[str, Any]:
        """设置 PowerPoint 页眉页脚.

        Args:
            filename: 文件名
            header_text: 页眉文本 (可选)
            footer_text: 页脚文本 (可选)
            show_date: 是否显示日期 (默认 False)
            show_slide_number: 是否显示幻灯片编号 (默认 False)
            apply_to_all: 是否应用到所有幻灯片 (默认 True)

        Returns:
            dict: 操作结果
        """
        logger.info(f"MCP工具调用: set_ppt_header_footer(filename={filename})")
        return ppt_handler.set_header_footer(
            filename, header_text, footer_text, show_date, show_slide_number, apply_to_all
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
