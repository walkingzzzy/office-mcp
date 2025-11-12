"""Word 工具模块."""

from fastmcp import FastMCP

from office_mcp_server.handlers.word_handler import WordHandler
from office_mcp_server.tools.word.basic import register_basic_tools
from office_mcp_server.tools.word.format import register_format_tools
from office_mcp_server.tools.word.table import register_table_tools
from office_mcp_server.tools.word.image import register_image_tools
from office_mcp_server.tools.word.structure import register_structure_tools
from office_mcp_server.tools.word.edit import register_edit_tools
from office_mcp_server.tools.word.reference import register_reference_tools
from office_mcp_server.tools.word.extract import register_extract_tools
from office_mcp_server.tools.word.batch import register_batch_tools
from office_mcp_server.tools.word.io import register_io_tools
from office_mcp_server.tools.word.advanced import register_advanced_tools


def register_word_tools(mcp: FastMCP) -> None:
    """注册所有 Word 工具到 MCP 服务器.

    模块化架构：
    - basic: 基础操作 (8个工具)
    - format: 格式化 (6个工具)
    - table: 表格操作 (10个工具)
    - image: 图片操作 (3个工具)
    - structure: 结构操作 (4个工具)
    - edit: 文本编辑 (5个工具)
    - reference: 引用管理 (6个工具)
    - extract: 内容提取 (4个工具)
    - batch: 批量操作 (5个工具)
    - io: 导入导出 (2个工具)
    - advanced: 高级功能 (6个工具)

    总计：59个工具
    """
    word_handler = WordHandler()

    register_basic_tools(mcp, word_handler)
    register_format_tools(mcp, word_handler)
    register_table_tools(mcp, word_handler)
    register_image_tools(mcp, word_handler)
    register_structure_tools(mcp, word_handler)
    register_edit_tools(mcp, word_handler)
    register_reference_tools(mcp, word_handler)
    register_extract_tools(mcp, word_handler)
    register_batch_tools(mcp, word_handler)
    register_io_tools(mcp, word_handler)
    register_advanced_tools(mcp, word_handler)
