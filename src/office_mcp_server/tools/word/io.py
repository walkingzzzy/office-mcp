"""Word 导入导出工具."""

from typing import Any, List, Optional

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.word_handler import WordHandler


def register_io_tools(mcp: FastMCP, word_handler: WordHandler) -> None:
    """注册 Word 导入导出工具."""

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
    def batch_convert_word_format(filenames: List[str], output_format: str = "pdf") -> dict[str, Any]:
        """批量转换 Word 文档格式.

        Args:
            filenames: 文件名列表
            output_format: 输出格式 ('pdf', 'html', 'txt', 'markdown')

        Returns:
            dict: 批量转换结果
        """
        logger.info(f"MCP工具调用: batch_convert_word_format(files={len(filenames)}, format={output_format})")
        return word_handler.batch_convert_format(filenames, output_format)
