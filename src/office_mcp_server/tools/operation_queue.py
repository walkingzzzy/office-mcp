"""操作队列管理器"""
import asyncio
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
import time
import uuid

class OperationStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class OperationType(Enum):
    EXCEL = "excel"
    POWERPOINT = "powerpoint"
    WORD = "word"

@dataclass
class QueuedOperation:
    id: str
    type: OperationType
    priority: int
    handler: str
    method: str
    args: List[Any]
    kwargs: Dict[str, Any]
    status: OperationStatus = OperationStatus.PENDING
    created_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    result: Any = None
    error: Optional[str] = None

class OperationQueue:
    """批量操作队列管理器"""

    def __init__(self, max_concurrent: int = 3):
        self.max_concurrent = max_concurrent
        self.operations: Dict[str, QueuedOperation] = {}
        self.pending_queue: List[str] = []
        self.running_operations: Dict[str, asyncio.Task] = {}
        self.handlers: Dict[str, Any] = {}
        self._lock = asyncio.Lock()

    def register_handler(self, name: str, handler: Any):
        """注册操作处理器"""
        self.handlers[name] = handler

    async def add_operation(self, op_type: OperationType, handler: str, method: str,
                          args: List[Any] = None, kwargs: Dict[str, Any] = None,
                          priority: int = 0) -> str:
        """添加操作到队列"""
        op_id = str(uuid.uuid4())

        operation = QueuedOperation(
            id=op_id,
            type=op_type,
            priority=priority,
            handler=handler,
            method=method,
            args=args or [],
            kwargs=kwargs or {}
        )

        async with self._lock:
            self.operations[op_id] = operation
            self.pending_queue.append(op_id)
            self.pending_queue.sort(key=lambda x: self.operations[x].priority, reverse=True)

        # 尝试启动操作
        await self._process_queue()
        return op_id

    async def add_batch_operations(self, operations: List[Dict[str, Any]]) -> List[str]:
        """批量添加操作"""
        op_ids = []

        for op_data in operations:
            op_id = await self.add_operation(
                op_type=OperationType(op_data['type']),
                handler=op_data['handler'],
                method=op_data['method'],
                args=op_data.get('args', []),
                kwargs=op_data.get('kwargs', {}),
                priority=op_data.get('priority', 0)
            )
            op_ids.append(op_id)

        return op_ids

    async def _process_queue(self):
        """处理队列中的操作"""
        async with self._lock:
            # 检查是否可以启动新操作
            while (len(self.running_operations) < self.max_concurrent and
                   self.pending_queue):

                op_id = self.pending_queue.pop(0)
                operation = self.operations[op_id]

                # 启动操作
                task = asyncio.create_task(self._execute_operation(operation))
                self.running_operations[op_id] = task
                operation.status = OperationStatus.RUNNING
                operation.started_at = time.time()

    async def _execute_operation(self, operation: QueuedOperation):
        """执行单个操作"""
        try:
            # 获取处理器
            if operation.handler not in self.handlers:
                raise ValueError(f"Handler '{operation.handler}' not registered")

            handler = self.handlers[operation.handler]
            method = getattr(handler, operation.method)

            # 执行操作
            if asyncio.iscoroutinefunction(method):
                result = await method(*operation.args, **operation.kwargs)
            else:
                result = method(*operation.args, **operation.kwargs)

            # 更新操作状态
            operation.result = result
            operation.status = OperationStatus.COMPLETED
            operation.completed_at = time.time()

        except Exception as e:
            operation.error = str(e)
            operation.status = OperationStatus.FAILED
            operation.completed_at = time.time()

        finally:
            # 清理运行中的操作
            async with self._lock:
                if operation.id in self.running_operations:
                    del self.running_operations[operation.id]

            # 继续处理队列
            await self._process_queue()

    async def wait_for_operation(self, op_id: str, timeout: Optional[float] = None) -> QueuedOperation:
        """等待操作完成"""
        start_time = time.time()

        while True:
            operation = self.operations.get(op_id)
            if not operation:
                raise ValueError(f"Operation {op_id} not found")

            if operation.status in [OperationStatus.COMPLETED, OperationStatus.FAILED, OperationStatus.CANCELLED]:
                return operation

            if timeout and (time.time() - start_time) > timeout:
                raise asyncio.TimeoutError(f"Operation {op_id} timed out")

            await asyncio.sleep(0.1)

    async def wait_for_all(self, op_ids: List[str], timeout: Optional[float] = None) -> List[QueuedOperation]:
        """等待多个操作完成"""
        results = []
        for op_id in op_ids:
            result = await self.wait_for_operation(op_id, timeout)
            results.append(result)
        return results

    async def cancel_operation(self, op_id: str) -> bool:
        """取消操作"""
        async with self._lock:
            operation = self.operations.get(op_id)
            if not operation:
                return False

            if operation.status == OperationStatus.PENDING:
                # 从队列中移除
                if op_id in self.pending_queue:
                    self.pending_queue.remove(op_id)
                operation.status = OperationStatus.CANCELLED
                return True

            elif operation.status == OperationStatus.RUNNING:
                # 取消运行中的任务
                task = self.running_operations.get(op_id)
                if task:
                    task.cancel()
                    del self.running_operations[op_id]
                operation.status = OperationStatus.CANCELLED
                return True

            return False

    def get_operation_status(self, op_id: str) -> Optional[Dict[str, Any]]:
        """获取操作状态"""
        operation = self.operations.get(op_id)
        if not operation:
            return None

        return {
            "id": operation.id,
            "type": operation.type.value,
            "status": operation.status.value,
            "priority": operation.priority,
            "created_at": operation.created_at,
            "started_at": operation.started_at,
            "completed_at": operation.completed_at,
            "duration": (operation.completed_at - operation.started_at) if operation.started_at and operation.completed_at else None,
            "result": operation.result,
            "error": operation.error
        }

    def get_queue_stats(self) -> Dict[str, Any]:
        """获取队列统计信息"""
        pending = sum(1 for op in self.operations.values() if op.status == OperationStatus.PENDING)
        running = sum(1 for op in self.operations.values() if op.status == OperationStatus.RUNNING)
        completed = sum(1 for op in self.operations.values() if op.status == OperationStatus.COMPLETED)
        failed = sum(1 for op in self.operations.values() if op.status == OperationStatus.FAILED)

        return {
            "total_operations": len(self.operations),
            "pending": pending,
            "running": running,
            "completed": completed,
            "failed": failed,
            "max_concurrent": self.max_concurrent,
            "queue_length": len(self.pending_queue)
        }

    async def clear_completed(self):
        """清理已完成的操作"""
        async with self._lock:
            completed_ids = [
                op_id for op_id, op in self.operations.items()
                if op.status in [OperationStatus.COMPLETED, OperationStatus.FAILED, OperationStatus.CANCELLED]
            ]

            for op_id in completed_ids:
                del self.operations[op_id]

    async def shutdown(self):
        """关闭队列，取消所有操作"""
        async with self._lock:
            # 取消所有运行中的任务
            for task in self.running_operations.values():
                task.cancel()

            # 等待所有任务完成
            if self.running_operations:
                await asyncio.gather(*self.running_operations.values(), return_exceptions=True)

            # 清空队列
            self.operations.clear()
            self.pending_queue.clear()
            self.running_operations.clear()

# 全局队列实例
operation_queue = OperationQueue()