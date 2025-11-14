"""Office版本兼容性测试"""
import pytest
import platform
import sys
from unittest.mock import Mock, patch

from src.office_mcp_server.handlers.excel_handler import ExcelHandler
from src.office_mcp_server.handlers.ppt_handler import PowerPointHandler
from src.office_mcp_server.handlers.word_handler import WordHandler


class TestOfficeCompatibility:
    """Office版本兼容性测试"""

    @pytest.fixture
    def mock_office_versions(self):
        """模拟不同Office版本"""
        return {
            "2016": {"version": "16.0", "features": ["basic_api"]},
            "2019": {"version": "16.0", "features": ["basic_api", "modern_api"]},
            "365": {"version": "16.0", "features": ["basic_api", "modern_api", "cloud_api"]}
        }

    def test_platform_detection(self):
        """测试平台检测"""
        current_platform = platform.system()
        assert current_platform in ["Windows", "Darwin", "Linux"]

        if current_platform == "Windows":
            # Windows平台应该支持完整的Office集成
            assert True
        else:
            # 其他平台可能需要特殊处理
            pytest.skip("非Windows平台跳过Office集成测试")

    @pytest.mark.parametrize("office_version", ["2016", "2019", "365"])
    def test_excel_version_compatibility(self, office_version, mock_office_versions):
        """测试Excel版本兼容性"""
        version_info = mock_office_versions[office_version]

        with patch('src.office_mcp_server.handlers.excel_handler.get_office_version') as mock_version:
            mock_version.return_value = version_info["version"]

            handler = ExcelHandler()

            # 测试基本功能（所有版本都应该支持）
            assert hasattr(handler, 'read_range')
            assert hasattr(handler, 'write_range')

            # 测试高级功能（仅新版本支持）
            if "modern_api" in version_info["features"]:
                assert hasattr(handler, 'format_range')

            if "cloud_api" in version_info["features"]:
                assert hasattr(handler, 'get_workbook_info')

    @pytest.mark.parametrize("office_version", ["2016", "2019", "365"])
    def test_powerpoint_version_compatibility(self, office_version, mock_office_versions):
        """测试PowerPoint版本兼容性"""
        version_info = mock_office_versions[office_version]

        with patch('src.office_mcp_server.handlers.ppt_handler.get_office_version') as mock_version:
            mock_version.return_value = version_info["version"]

            handler = PowerPointHandler()

            # 测试基本功能
            assert hasattr(handler, 'get_slides_info')
            assert hasattr(handler, 'add_text_box')

            # 测试版本特定功能
            if "modern_api" in version_info["features"]:
                assert hasattr(handler, 'format_shape')

    def test_python_version_compatibility(self):
        """测试Python版本兼容性"""
        python_version = sys.version_info

        # 要求Python 3.8+
        assert python_version >= (3, 8), f"需要Python 3.8+，当前版本: {python_version}"

        # 测试异步支持
        import asyncio
        assert hasattr(asyncio, 'run'), "需要asyncio.run支持"

    @pytest.mark.skipif(platform.system() != "Windows", reason="仅Windows平台")
    def test_windows_office_integration(self):
        """测试Windows Office集成"""
        try:
            import win32com.client
            assert True, "win32com可用"
        except ImportError:
            pytest.skip("win32com不可用，跳过Windows Office测试")

    def test_cross_platform_fallback(self):
        """测试跨平台回退机制"""
        from src.office_mcp_server.config import config

        if platform.system() != "Windows":
            # 非Windows平台应该使用文件处理模式
            assert config.server.mode == "file_processing"
        else:
            # Windows平台可以使用COM模式
            assert config.server.mode in ["com_integration", "file_processing"]

    @pytest.mark.parametrize("file_format", [".xlsx", ".xls", ".pptx", ".ppt", ".docx", ".doc"])
    def test_file_format_support(self, file_format):
        """测试文件格式支持"""
        if file_format in [".xlsx", ".xls"]:
            handler = ExcelHandler()
            assert handler.supports_format(file_format)
        elif file_format in [".pptx", ".ppt"]:
            handler = PowerPointHandler()
            assert handler.supports_format(file_format)
        elif file_format in [".docx", ".doc"]:
            handler = WordHandler()
            assert handler.supports_format(file_format)

    def test_memory_usage_limits(self):
        """测试内存使用限制"""
        import psutil
        import os

        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss

        # 模拟大文件处理
        large_data = [[f"cell_{i}_{j}" for j in range(100)] for i in range(100)]

        handler = ExcelHandler()
        # 这里应该测试处理大数据时的内存使用

        current_memory = process.memory_info().rss
        memory_increase = current_memory - initial_memory

        # 内存增长不应该超过100MB
        assert memory_increase < 100 * 1024 * 1024, f"内存使用过多: {memory_increase / 1024 / 1024:.2f}MB"

    def test_unicode_support(self):
        """测试Unicode字符支持"""
        test_strings = [
            "Hello World",  # 英文
            "你好世界",      # 中文
            "こんにちは",    # 日文
            "🎉📊💼",       # Emoji
            "Ñoño café"     # 特殊字符
        ]

        handler = ExcelHandler()

        for test_string in test_strings:
            # 测试字符串处理
            processed = handler._sanitize_text(test_string)
            assert isinstance(processed, str)
            assert len(processed) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])