"""后端性能优化工具"""
import asyncio
import time
from functools import wraps
from typing import Dict, Any, Callable, Optional
import weakref

class ResponseCache:
    """响应缓存"""
    def __init__(self, max_size: int = 1000, default_ttl: int = 300):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.max_size = max_size
        self.default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        if key not in self.cache:
            return None

        item = self.cache[key]
        if time.time() - item['timestamp'] > item['ttl']:
            del self.cache[key]
            return None

        return item['data']

    def set(self, key: str, data: Any, ttl: Optional[int] = None) -> None:
        if len(self.cache) >= self.max_size:
            # 删除最旧的项
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k]['timestamp'])
            del self.cache[oldest_key]

        self.cache[key] = {
            'data': data,
            'timestamp': time.time(),
            'ttl': ttl or self.default_ttl
        }

    def clear(self) -> None:
        self.cache.clear()

# 全局缓存实例
response_cache = ResponseCache()

def cache_response(ttl: int = 300, key_func: Optional[Callable] = None):
    """响应缓存装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 生成缓存键
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"

            # 尝试从缓存获取
            cached_result = response_cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            # 执行函数并缓存结果
            result = await func(*args, **kwargs)
            response_cache.set(cache_key, result, ttl)
            return result

        return wrapper
    return decorator

class ConnectionPool:
    """连接池管理"""
    def __init__(self, max_connections: int = 10):
        self.max_connections = max_connections
        self.connections = []
        self.in_use = set()
        self._lock = asyncio.Lock()

    async def get_connection(self):
        """获取连接"""
        async with self._lock:
            # 查找可用连接
            for conn in self.connections:
                if conn not in self.in_use:
                    self.in_use.add(conn)
                    return conn

            # 创建新连接
            if len(self.connections) < self.max_connections:
                conn = await self._create_connection()
                self.connections.append(conn)
                self.in_use.add(conn)
                return conn

            # 等待连接可用
            while True:
                await asyncio.sleep(0.01)
                for conn in self.connections:
                    if conn not in self.in_use:
                        self.in_use.add(conn)
                        return conn

    async def release_connection(self, conn):
        """释放连接"""
        async with self._lock:
            self.in_use.discard(conn)

    async def _create_connection(self):
        """创建新连接（子类实现）"""
        return object()  # 占位符

class BatchProcessor:
    """批处理器"""
    def __init__(self, batch_size: int = 50, flush_interval: float = 1.0):
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self.batch = []
        self.last_flush = time.time()
        self._lock = asyncio.Lock()

    async def add_item(self, item: Any, processor: Callable):
        """添加项目到批处理"""
        async with self._lock:
            self.batch.append((item, processor))

            # 检查是否需要刷新
            should_flush = (
                len(self.batch) >= self.batch_size or
                time.time() - self.last_flush >= self.flush_interval
            )

            if should_flush:
                await self._flush_batch()

    async def _flush_batch(self):
        """刷新批处理"""
        if not self.batch:
            return

        current_batch = self.batch.copy()
        self.batch.clear()
        self.last_flush = time.time()

        # 按处理器分组
        groups = {}
        for item, processor in current_batch:
            if processor not in groups:
                groups[processor] = []
            groups[processor].append(item)

        # 并行处理各组
        tasks = []
        for processor, items in groups.items():
            task = asyncio.create_task(processor(items))
            tasks.append(task)

        await asyncio.gather(*tasks, return_exceptions=True)

def rate_limit(calls_per_second: int = 10):
    """速率限制装饰器"""
    min_interval = 1.0 / calls_per_second
    last_called = {}

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            now = time.time()
            key = id(func)

            if key in last_called:
                elapsed = now - last_called[key]
                if elapsed < min_interval:
                    await asyncio.sleep(min_interval - elapsed)

            last_called[key] = time.time()
            return await func(*args, **kwargs)

        return wrapper
    return decorator

class QueryOptimizer:
    """查询优化器"""

    @staticmethod
    def optimize_range_query(range_str: str) -> Dict[str, Any]:
        """优化范围查询"""
        # 解析范围并优化
        if ':' in range_str:
            start, end = range_str.split(':')
            return {
                'optimized': True,
                'start': start.strip(),
                'end': end.strip(),
                'batch_size': 1000  # 分批处理大范围
            }
        return {'optimized': False, 'range': range_str}

    @staticmethod
    def should_use_batch(operation_count: int) -> bool:
        """判断是否应该使用批处理"""
        return operation_count > 10

# 全局批处理器实例
batch_processor = BatchProcessor()

async def optimize_excel_operations(operations: list) -> list:
    """优化Excel操作"""
    if len(operations) <= 1:
        return operations

    # 按类型分组
    grouped = {}
    for op in operations:
        op_type = op.get('type', 'unknown')
        if op_type not in grouped:
            grouped[op_type] = []
        grouped[op_type].append(op)

    # 合并相似操作
    optimized = []
    for op_type, ops in grouped.items():
        if op_type == 'read_range' and len(ops) > 5:
            # 合并读取操作
            optimized.append({
                'type': 'batch_read',
                'ranges': [op['range'] for op in ops]
            })
        else:
            optimized.extend(ops)

    return optimized