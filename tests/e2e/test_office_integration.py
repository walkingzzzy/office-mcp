"""端到端集成测试"""
import pytest
import asyncio
import json
from pathlib import Path

from src.office_mcp_server.main import create_server
from src.office_mcp_server.handlers.excel_handler import ExcelHandler
from src.office_mcp_server.handlers.ppt_handler import PowerPointHandler


class TestOfficeIntegration:
    """Office集成端到端测试"""

    @pytest.fixture
    async def server(self):
        """创建测试服务器"""
        server = await create_server()
        yield server
        await server.cleanup()

    @pytest.fixture
    def sample_excel_file(self, tmp_path):
        """创建示例Excel文件"""
        file_path = tmp_path / "test.xlsx"
        # 这里应该创建一个真实的Excel文件用于测试
        return str(file_path)

    @pytest.fixture
    def sample_ppt_file(self, tmp_path):
        """创建示例PowerPoint文件"""
        file_path = tmp_path / "test.pptx"
        # 这里应该创建一个真实的PowerPoint文件用于测试
        return str(file_path)

    @pytest.mark.asyncio
    async def test_excel_workflow(self, server, sample_excel_file):
        """测试完整的Excel工作流程"""
        handler = ExcelHandler()

        # 1. 打开文件
        result = await handler.open_workbook(sample_excel_file)
        assert result.get("success") is True

        # 2. 读取数据
        data = await handler.read_range("A1:C3")
        assert "values" in data

        # 3. 写入数据
        write_result = await handler.write_range("D1:D3", [["Test1"], ["Test2"], ["Test3"]])
        assert write_result.get("success") is True

        # 4. 格式化
        format_result = await handler.format_range("D1:D3", {"font": {"bold": True}})
        assert format_result.get("success") is True

        # 5. 保存文件
        save_result = await handler.save_workbook()
        assert save_result.get("success") is True

    @pytest.mark.asyncio
    async def test_powerpoint_workflow(self, server, sample_ppt_file):
        """测试完整的PowerPoint工作流程"""
        handler = PowerPointHandler()

        # 1. 打开文件
        result = await handler.open_presentation(sample_ppt_file)
        assert result.get("success") is True

        # 2. 获取幻灯片信息
        slides_info = await handler.get_slides_info()
        assert "slides" in slides_info

        # 3. 添加文本框
        add_result = await handler.add_text_box(0, "测试文本", x=100, y=100)
        assert add_result.get("success") is True

        # 4. 更新文本
        if "shape_id" in add_result:
            update_result = await handler.update_shape_text(0, add_result["shape_id"], "更新后的文本")
            assert update_result.get("success") is True

        # 5. 保存文件
        save_result = await handler.save_presentation()
        assert save_result.get("success") is True

    @pytest.mark.asyncio
    async def test_batch_operations(self, server):
        """测试批量操作"""
        from src.office_mcp_server.tools.operation_queue import operation_queue, OperationType

        # 注册处理器
        excel_handler = ExcelHandler()
        operation_queue.register_handler('excel', excel_handler)

        # 添加批量操作
        operations = [
            {
                'type': 'excel',
                'handler': 'excel',
                'method': 'read_range',
                'args': ['A1:A5'],
                'priority': 1
            },
            {
                'type': 'excel',
                'handler': 'excel',
                'method': 'write_range',
                'args': ['B1:B5', [['1'], ['2'], ['3'], ['4'], ['5']]],
                'priority': 2
            }
        ]

        op_ids = await operation_queue.add_batch_operations(operations)
        assert len(op_ids) == 2

        # 等待操作完成
        results = await operation_queue.wait_for_all(op_ids, timeout=10.0)
        assert len(results) == 2

    @pytest.mark.asyncio
    async def test_error_handling(self, server):
        """测试错误处理"""
        handler = ExcelHandler()

        # 测试无效文件路径
        result = await handler.open_workbook("nonexistent_file.xlsx")
        assert result.get("success") is False
        assert "error" in result

        # 测试无效范围
        result = await handler.read_range("INVALID_RANGE")
        assert result.get("success") is False

    @pytest.mark.asyncio
    async def test_concurrent_operations(self, server):
        """测试并发操作"""
        handler = ExcelHandler()

        # 创建多个并发任务
        tasks = []
        for i in range(5):
            task = handler.read_range(f"A{i+1}:A{i+1}")
            tasks.append(task)

        # 等待所有任务完成
        results = await asyncio.gather(*tasks, return_exceptions=True)
        assert len(results) == 5

        # 检查是否有异常
        for result in results:
            if isinstance(result, Exception):
                pytest.fail(f"并发操作失败: {result}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])