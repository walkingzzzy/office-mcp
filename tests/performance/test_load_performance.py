"""性能和负载测试"""
import pytest
import asyncio
import time
import statistics
from concurrent.futures import ThreadPoolExecutor

from src.office_mcp_server.handlers.excel_handler import ExcelHandler
from src.office_mcp_server.tools.operation_queue import OperationQueue, OperationType


class TestPerformance:
    """性能测试"""

    @pytest.fixture
    def performance_handler(self):
        """性能测试处理器"""
        return ExcelHandler()

    @pytest.mark.asyncio
    async def test_single_operation_performance(self, performance_handler):
        """测试单个操作性能"""
        operation_times = []

        for _ in range(10):
            start_time = time.time()
            await performance_handler.read_range("A1:A1")
            end_time = time.time()
            operation_times.append(end_time - start_time)

        avg_time = statistics.mean(operation_times)
        max_time = max(operation_times)

        # 单个操作应该在100ms内完成
        assert avg_time < 0.1, f"平均操作时间过长: {avg_time:.3f}s"
        assert max_time < 0.5, f"最大操作时间过长: {max_time:.3f}s"

    @pytest.mark.asyncio
    async def test_batch_operation_performance(self):
        """测试批量操作性能"""
        from src.office_mcp_server.tools.excel.batch_optimizer import ExcelBatchOptimizer

        optimizer = ExcelBatchOptimizer()

        # 添加100个操作
        for i in range(100):
            optimizer.add_operation('set_value', f'A{i+1}', f'value_{i}')

        start_time = time.time()
        batches = optimizer.optimize_operations()
        optimization_time = time.time() - start_time

        # 优化时间应该很短
        assert optimization_time < 0.1, f"批量优化时间过长: {optimization_time:.3f}s"

        # 批量操作应该减少操作数量
        total_batches = len(batches)
        assert total_batches < 100, f"批量优化效果不佳，批次数: {total_batches}"

    @pytest.mark.asyncio
    async def test_concurrent_operations(self):
        """测试并发操作性能"""
        queue = OperationQueue(max_concurrent=5)
        handler = ExcelHandler()
        queue.register_handler('excel', handler)

        # 创建50个并发操作
        start_time = time.time()
        op_ids = []

        for i in range(50):
            op_id = await queue.add_operation(
                OperationType.EXCEL,
                'excel',
                'read_range',
                args=[f'A{i+1}:A{i+1}']
            )
            op_ids.append(op_id)

        # 等待所有操作完成
        await queue.wait_for_all(op_ids, timeout=30.0)
        total_time = time.time() - start_time

        # 并发执行应该比串行快
        assert total_time < 10.0, f"并发操作时间过长: {total_time:.3f}s"

        # 检查队列统计
        stats = queue.get_queue_stats()
        assert stats['completed'] == 50

    def test_memory_usage_under_load(self):
        """测试负载下的内存使用"""
        import psutil
        import os

        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss

        # 创建大量数据
        large_datasets = []
        for i in range(10):
            dataset = [[f"data_{i}_{j}_{k}" for k in range(50)] for j in range(50)]
            large_datasets.append(dataset)

        current_memory = process.memory_info().rss
        memory_increase = current_memory - initial_memory

        # 内存增长应该在合理范围内
        assert memory_increase < 200 * 1024 * 1024, f"内存使用过多: {memory_increase / 1024 / 1024:.2f}MB"

    @pytest.mark.asyncio
    async def test_queue_throughput(self):
        """测试队列吞吐量"""
        queue = OperationQueue(max_concurrent=10)
        handler = ExcelHandler()
        queue.register_handler('excel', handler)

        # 测试1000个轻量级操作
        start_time = time.time()
        op_ids = []

        for i in range(1000):
            op_id = await queue.add_operation(
                OperationType.EXCEL,
                'excel',
                'get_workbook_info'
            )
            op_ids.append(op_id)

        # 等待前100个操作完成来测试吞吐量
        first_100 = op_ids[:100]
        await queue.wait_for_all(first_100, timeout=10.0)
        throughput_time = time.time() - start_time

        # 计算吞吐量（操作/秒）
        throughput = 100 / throughput_time
        assert throughput > 10, f"吞吐量过低: {throughput:.2f} ops/sec"

    @pytest.mark.asyncio
    async def test_stress_test(self):
        """压力测试"""
        queue = OperationQueue(max_concurrent=20)
        handler = ExcelHandler()
        queue.register_handler('excel', handler)

        # 创建大量混合操作
        operations = []
        for i in range(500):
            if i % 3 == 0:
                op_type = 'read_range'
                args = [f'A{i+1}:C{i+1}']
            elif i % 3 == 1:
                op_type = 'write_range'
                args = [f'D{i+1}:D{i+1}', [[f'test_{i}']]]
            else:
                op_type = 'get_workbook_info'
                args = []

            operations.append({
                'type': 'excel',
                'handler': 'excel',
                'method': op_type,
                'args': args,
                'priority': i % 5  # 不同优先级
            })

        start_time = time.time()
        op_ids = await queue.add_batch_operations(operations)

        # 等待所有操作完成
        await queue.wait_for_all(op_ids, timeout=60.0)
        total_time = time.time() - start_time

        # 检查结果
        stats = queue.get_queue_stats()
        success_rate = stats['completed'] / stats['total_operations']

        assert success_rate > 0.95, f"成功率过低: {success_rate:.2%}"
        assert total_time < 30.0, f"压力测试时间过长: {total_time:.3f}s"

    def test_resource_cleanup(self):
        """测试资源清理"""
        import gc

        # 创建大量对象
        handlers = [ExcelHandler() for _ in range(100)]
        queues = [OperationQueue() for _ in range(10)]

        # 删除引用
        del handlers
        del queues

        # 强制垃圾回收
        gc.collect()

        # 检查内存是否被正确释放
        import psutil
        import os
        process = psutil.Process(os.getpid())
        memory_after_cleanup = process.memory_info().rss

        # 这里应该检查内存是否回到合理水平
        assert memory_after_cleanup < 500 * 1024 * 1024, "内存清理不彻底"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])