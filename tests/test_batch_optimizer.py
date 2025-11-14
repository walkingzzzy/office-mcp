"""批量优化器单元测试"""
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock

from src.office_mcp_server.tools.excel.batch_optimizer import ExcelBatchOptimizer, ExcelOperation
from src.office_mcp_server.tools.ppt.batch_optimizer import PowerPointBatchOptimizer, PowerPointOperation
from src.office_mcp_server.tools.operation_queue import OperationQueue, OperationType, OperationStatus


class TestExcelBatchOptimizer:
    """Excel批量优化器测试"""

    def test_add_operation(self):
        optimizer = ExcelBatchOptimizer()
        optimizer.add_operation('merge_cells', 'A1:B2', None)

        assert len(optimizer.operations) == 1
        assert optimizer.operations[0].type == 'merge_cells'
        assert optimizer.operations[0].range == 'A1:B2'

    def test_optimize_merge_operations(self):
        optimizer = ExcelBatchOptimizer()
        optimizer.add_operation('merge_cells', 'A1:B2')
        optimizer.add_operation('merge_cells', 'C1:D2')

        batches = optimizer.optimize_operations()
        assert len(batches) == 1
        assert len(batches[0]) == 2

    def test_optimize_value_operations(self):
        optimizer = ExcelBatchOptimizer()
        optimizer.add_operation('set_value', 'A1', 'test1')
        optimizer.add_operation('set_value', 'A2', 'test2')

        batches = optimizer.optimize_operations()
        assert len(batches) >= 1

    @pytest.mark.asyncio
    async def test_execute_batch(self):
        optimizer = ExcelBatchOptimizer()
        mock_handler = AsyncMock()
        mock_handler.batch_merge_cells = AsyncMock(return_value={"success": True})

        operations = [ExcelOperation('merge_cells', 'A1:B2')]
        result = await optimizer.execute_batch(operations, mock_handler)

        assert result["success"] is True
        mock_handler.batch_merge_cells.assert_called_once()

    def test_get_stats(self):
        optimizer = ExcelBatchOptimizer()
        optimizer.add_operation('merge_cells', 'A1:B2')
        optimizer.add_operation('set_value', 'C1', 'test')

        stats = optimizer.get_stats()
        assert stats["total_operations"] == 2
        assert 'merge_cells' in stats["operation_types"]
        assert 'set_value' in stats["operation_types"]


class TestPowerPointBatchOptimizer:
    """PowerPoint批量优化器测试"""

    def test_add_operation(self):
        optimizer = PowerPointBatchOptimizer()
        optimizer.add_operation('add_shape', 0, 'shape1', 'test content')

        assert len(optimizer.operations) == 1
        assert optimizer.operations[0].type == 'add_shape'
        assert optimizer.operations[0].slide_index == 0

    def test_optimize_slide_operations(self):
        optimizer = PowerPointBatchOptimizer()
        optimizer.add_operation('add_shape', 0, content='text1')
        optimizer.add_operation('add_shape', 0, content='text2')
        optimizer.add_operation('modify_text', 1, 'shape1', 'new text')

        batches = optimizer.optimize_operations()
        assert len(batches) >= 1

    @pytest.mark.asyncio
    async def test_execute_batch(self):
        optimizer = PowerPointBatchOptimizer()
        mock_handler = AsyncMock()
        mock_handler.batch_add_shapes = AsyncMock(return_value={"success": True})

        operations = [PowerPointOperation('add_shape', 0, content='test')]
        result = await optimizer.execute_batch(operations, mock_handler)

        assert result["success"] is True

    def test_get_stats(self):
        optimizer = PowerPointBatchOptimizer()
        optimizer.add_operation('add_shape', 0)
        optimizer.add_operation('modify_text', 1, 'shape1')

        stats = optimizer.get_stats()
        assert stats["total_operations"] == 2
        assert stats["slides"] == 2


class TestOperationQueue:
    """操作队列测试"""

    @pytest.mark.asyncio
    async def test_add_operation(self):
        queue = OperationQueue()
        mock_handler = Mock()
        queue.register_handler('test_handler', mock_handler)

        op_id = await queue.add_operation(
            OperationType.EXCEL,
            'test_handler',
            'test_method'
        )

        assert op_id in queue.operations
        assert queue.operations[op_id].status == OperationStatus.PENDING

    @pytest.mark.asyncio
    async def test_execute_operation(self):
        queue = OperationQueue()
        mock_handler = Mock()
        mock_handler.test_method = Mock(return_value="success")
        queue.register_handler('test_handler', mock_handler)

        op_id = await queue.add_operation(
            OperationType.EXCEL,
            'test_handler',
            'test_method'
        )

        # 等待操作完成
        await asyncio.sleep(0.1)
        operation = await queue.wait_for_operation(op_id, timeout=1.0)

        assert operation.status == OperationStatus.COMPLETED
        assert operation.result == "success"

    @pytest.mark.asyncio
    async def test_cancel_operation(self):
        queue = OperationQueue(max_concurrent=0)  # 阻止自动执行
        mock_handler = Mock()
        queue.register_handler('test_handler', mock_handler)

        op_id = await queue.add_operation(
            OperationType.EXCEL,
            'test_handler',
            'test_method'
        )

        success = await queue.cancel_operation(op_id)
        assert success is True
        assert queue.operations[op_id].status == OperationStatus.CANCELLED

    def test_get_queue_stats(self):
        queue = OperationQueue()
        stats = queue.get_queue_stats()

        assert "total_operations" in stats
        assert "pending" in stats
        assert "running" in stats
        assert "completed" in stats


if __name__ == "__main__":
    pytest.main([__file__, "-v"])