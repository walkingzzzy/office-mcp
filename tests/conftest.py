"""pytest配置文件"""
import pytest
import asyncio
import os
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

@pytest.fixture(scope="session")
def event_loop():
    """创建事件循环"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def temp_dir(tmp_path):
    """创建临时目录"""
    return tmp_path

@pytest.fixture
def mock_config():
    """模拟配置"""
    return {
        'server': {
            'host': 'localhost',
            'port': 8000,
            'debug': False,
            'log_level': 'INFO'
        },
        'api': {
            'key': 'test_key_encrypted'
        }
    }

@pytest.fixture(autouse=True)
def setup_test_environment():
    """设置测试环境"""
    # 设置测试环境变量
    os.environ['TESTING'] = 'true'
    os.environ['LOG_LEVEL'] = 'ERROR'  # 减少测试时的日志输出

    yield

    # 清理环境变量
    os.environ.pop('TESTING', None)
    os.environ.pop('LOG_LEVEL', None)

def pytest_configure(config):
    """pytest配置"""
    # 添加自定义标记
    config.addinivalue_line("markers", "slow: 标记慢速测试")
    config.addinivalue_line("markers", "integration: 标记集成测试")
    config.addinivalue_line("markers", "security: 标记安全测试")
    config.addinivalue_line("markers", "performance: 标记性能测试")

def pytest_collection_modifyitems(config, items):
    """修改测试收集"""
    # 为特定测试添加标记
    for item in items:
        if "performance" in item.nodeid:
            item.add_marker(pytest.mark.performance)
        if "security" in item.nodeid:
            item.add_marker(pytest.mark.security)
        if "e2e" in item.nodeid:
            item.add_marker(pytest.mark.integration)