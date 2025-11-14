"""Word 文档清理工具."""

from typing import Any

from fastmcp import FastMCP
from loguru import logger

from office_mcp_server.handlers.word_handler import WordHandler


def register_cleanup_tools(mcp: FastMCP, word_handler: WordHandler) -> None:
    """注册 Word 文档清理工具."""

    @mcp.tool()
    def delete_empty_paragraphs_in_word(
        filename: str,
    ) -> dict[str, Any]:
        """删除 Word 文档中的所有空段落.

        自动识别并删除文档中的所有空段落（不包含任何文本的段落），
        可以有效减少文档页数，提升文档紧凑度。

        Args:
            filename: 文件名

        Returns:
            dict: 操作结果，包含：
                - deleted_count: 删除的空段落数量
                - total_before: 删除前的总段落数
                - total_after: 删除后的总段落数
                - deleted_indices: 被删除的段落索引列表

        注意:
            - 从后向前遍历删除，确保索引不会错位
            - 只删除完全为空的段落（去除空白字符后无内容）
            - 删除操作不可逆，建议先备份文档
        """
        logger.info(f"MCP工具调用: delete_empty_paragraphs_in_word(filename={filename})")
        return word_handler.delete_empty_paragraphs(filename)

    @mcp.tool()
    def delete_paragraphs_by_indices_in_word(
        filename: str,
        paragraph_indices: list[int],
    ) -> dict[str, Any]:
        """按索引批量删除 Word 文档中的段落.

        根据提供的段落索引列表批量删除段落，适用于需要精确控制删除内容的场景。

        Args:
            filename: 文件名
            paragraph_indices: 要删除的段落索引列表（从0开始）

        Returns:
            dict: 操作结果，包含：
                - deleted_count: 成功删除的段落数量
                - total_requested: 请求删除的段落数量
                - total_before: 删除前的总段落数
                - total_after: 删除后的总段落数
                - failed_indices: 删除失败的索引列表

        注意:
            - 索引从0开始计数
            - 自动去重并从大到小排序，避免索引错位
            - 超出范围的索引会被跳过并记录在 failed_indices 中
            - 删除操作不可逆，建议先备份文档
        """
        logger.info(f"MCP工具调用: delete_paragraphs_by_indices_in_word(filename={filename}, indices={len(paragraph_indices)})")
        return word_handler.delete_paragraphs_by_indices(filename, paragraph_indices)

    @mcp.tool()
    def analyze_word_page_waste(
        filename: str,
    ) -> dict[str, Any]:
        """分析 Word 文档的页面浪费情况并给出优化建议.

        智能分析文档中浪费空间的问题，包括：
        - 空段落数量
        - 过大的段前段后间距（>18pt）
        - 过大的字号（>18pt）
        - 过大的行距（>1.5倍）

        并估算优化后可节省的页数，给出具体的优化建议。

        Args:
            filename: 文件名

        Returns:
            dict: 分析结果，包含：
                - analysis: 详细分析数据
                  * empty_paragraphs: 空段落数量
                  * empty_paragraph_indices: 空段落索引列表
                  * large_spacing: 过大间距的段落列表
                  * large_font_size: 过大字号的段落列表
                  * large_line_spacing: 过大行距的段落列表
                  * optimization_potential_pages: 预计可节省的页数
                - suggestions: 优化建议列表

        使用场景:
            - 在优化文档前先分析问题所在
            - 评估优化潜力
            - 获取针对性的优化建议
            - 验证优化效果

        建议:
            分析后可使用 auto_format_word_document 工具的 'compact' 预设进行一键优化
        """
        logger.info(f"MCP工具调用: analyze_word_page_waste(filename={filename})")
        return word_handler.analyze_page_waste(filename)

    @mcp.tool()
    def suggest_word_compression_strategy(
        filename: str,
    ) -> dict[str, Any]:
        """智能推荐 Word 文档压缩策略（AI辅助优化）.

        基于文档内容智能分析文档类型，并推荐最佳的压缩方案。

        功能特性：
        - 自动检测文档类型（商务报告、学术论文、技术文档、法律文书等）
        - 根据文档类型推荐最适合的格式预设
        - 评估压缩潜力（high/medium/low）
        - 提供针对性的优化建议
        - 对特殊文档类型给出警告（如法律文书不建议压缩）

        文档类型识别：
        - 商务报告：包含"报告"、"方案"、"计划"等关键词 → 推荐 compact 预设
        - 学术论文：包含"研究"、"分析"、"论文"等关键词 → 推荐 academic 预设（不建议过度压缩）
        - 技术文档：包含"开发"、"API"、"技术"等关键词 → 推荐 compact 预设
        - 法律文书：包含"合同"、"协议"、"条款"等关键词 → 不建议压缩
        - 医疗报告：包含"诊断"、"治疗"、"病历"等关键词 → 推荐 professional 预设
        - 教育文档：包含"教学"、"课程"、"学习"等关键词 → 推荐 simple 预设
        - 政府公文：包含"通知"、"公告"、"决定"等关键词 → 不建议压缩

        Args:
            filename: 文件名

        Returns:
            dict: 压缩策略建议，包含：
                - detected_type: 检测到的文档类型
                - recommended_preset: 推荐的预设方案（可能为None）
                - compression_potential: 压缩潜力（"high"/"medium"/"low"）
                - reason: 推荐理由
                - specific_suggestions: 具体优化建议列表
                - warnings: 警告信息列表
                - optimization_potential_pages: 预计可节省的页数

        使用场景:
            - 不确定应该使用哪个格式预设时
            - 需要评估文档压缩潜力时
            - 希望获得针对性优化建议时
            - 避免对特殊文档类型进行不当压缩

        工作流程:
            1. 调用此工具获取压缩策略建议
            2. 根据建议决定是否进行压缩
            3. 如果建议压缩，使用推荐的预设调用 auto_format_word_document
            4. 如果有空段落，先调用 delete_empty_paragraphs_in_word

        示例:
            建议 → compact预设 → 使用 auto_format_word_document(filename, "compact")
        """
        logger.info(f"MCP工具调用: suggest_word_compression_strategy(filename={filename})")
        return word_handler.suggest_compression_strategy(filename)

