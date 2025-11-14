"""内存管理和优化工具"""
import gc
import weakref
import psutil
import os
from typing import Dict, Any, Optional, List
from contextlib import contextmanager
import threading
import time

class MemoryMonitor:
    """内存监控器"""

    def __init__(self, threshold_mb: int = 500):
        self.threshold_mb = threshold_mb
        self.process = psutil.Process(os.getpid())
        self._monitoring = False
        self._monitor_thread = None

    def get_memory_usage(self) -> Dict[str, float]:
        """获取当前内存使用情况"""
        memory_info = self.process.memory_info()
        return {
            'rss_mb': memory_info.rss / 1024 / 1024,
            'vms_mb': memory_info.vms / 1024 / 1024,
            'percent': self.process.memory_percent()
        }

    def is_memory_critical(self) -> bool:
        """检查内存是否达到临界值"""
        usage = self.get_memory_usage()
        return usage['rss_mb'] > self.threshold_mb

    def start_monitoring(self, callback=None):
        """开始内存监控"""
        if self._monitoring:
            return

        self._monitoring = True
        self._monitor_thread = threading.Thread(
            target=self._monitor_loop,
            args=(callback,),
            daemon=True
        )
        self._monitor_thread.start()

    def stop_monitoring(self):
        """停止内存监控"""
        self._monitoring = False
        if self._monitor_thread:
            self._monitor_thread.join(timeout=1)

    def _monitor_loop(self, callback):
        """监控循环"""
        while self._monitoring:
            if self.is_memory_critical():
                if callback:
                    callback(self.get_memory_usage())
                else:
                    self._trigger_cleanup()
            time.sleep(5)  # 每5秒检查一次

    def _trigger_cleanup(self):
        """触发内存清理"""
        gc.collect()

class ObjectPool:
    """对象池"""

    def __init__(self, factory, max_size: int = 100):
        self.factory = factory
        self.max_size = max_size
        self.pool = []
        self._lock = threading.Lock()

    def get(self):
        """获取对象"""
        with self._lock:
            if self.pool:
                return self.pool.pop()
            return self.factory()

    def put(self, obj):
        """归还对象"""
        with self._lock:
            if len(self.pool) < self.max_size:
                # 重置对象状态
                if hasattr(obj, 'reset'):
                    obj.reset()
                self.pool.append(obj)

    def clear(self):
        """清空对象池"""
        with self._lock:
            self.pool.clear()

class WeakValueCache:
    """弱引用缓存"""

    def __init__(self):
        self._cache = weakref.WeakValueDictionary()

    def get(self, key: str):
        """获取缓存值"""
        return self._cache.get(key)

    def set(self, key: str, value):
        """设置缓存值"""
        self._cache[key] = value

    def clear(self):
        """清空缓存"""
        self._cache.clear()

    def size(self) -> int:
        """获取缓存大小"""
        return len(self._cache)

class ChunkedDataProcessor:
    """分块数据处理器"""

    def __init__(self, chunk_size: int = 1000):
        self.chunk_size = chunk_size

    def process_in_chunks(self, data: List[Any], processor):
        """分块处理数据"""
        results = []
        for i in range(0, len(data), self.chunk_size):
            chunk = data[i:i + self.chunk_size]
            chunk_result = processor(chunk)
            results.extend(chunk_result if isinstance(chunk_result, list) else [chunk_result])

            # 强制垃圾回收
            if i % (self.chunk_size * 10) == 0:
                gc.collect()

        return results

@contextmanager
def memory_limit(max_mb: int = 1000):
    """内存限制上下文管理器"""
    monitor = MemoryMonitor(max_mb)

    try:
        initial_usage = monitor.get_memory_usage()
        yield monitor

        final_usage = monitor.get_memory_usage()
        increase = final_usage['rss_mb'] - initial_usage['rss_mb']

        if increase > max_mb * 0.8:  # 超过80%阈值时警告
            print(f"警告: 内存使用增加了 {increase:.2f}MB")

    finally:
        # 清理内存
        gc.collect()

class DataStreamProcessor:
    """数据流处理器 - 避免大数据集全部加载到内存"""

    def __init__(self, buffer_size: int = 10000):
        self.buffer_size = buffer_size
        self.buffer = []

    def add_data(self, data):
        """添加数据到缓冲区"""
        self.buffer.append(data)

        if len(self.buffer) >= self.buffer_size:
            self._flush_buffer()

    def _flush_buffer(self):
        """刷新缓冲区"""
        if self.buffer:
            # 处理缓冲区数据
            self._process_buffer(self.buffer)
            self.buffer.clear()
            gc.collect()

    def _process_buffer(self, buffer_data):
        """处理缓冲区数据（子类实现）"""
        pass

    def finalize(self):
        """完成处理"""
        if self.buffer:
            self._flush_buffer()

class MemoryEfficientExcelHandler:
    """内存高效的Excel处理器"""

    def __init__(self):
        self.weak_cache = WeakValueCache()
        self.object_pool = ObjectPool(lambda: {})
        self.chunk_processor = ChunkedDataProcessor(chunk_size=500)

    def process_large_range(self, data: List[List[Any]]) -> List[List[Any]]:
        """处理大范围数据"""
        def chunk_processor(chunk):
            # 处理数据块
            processed = []
            for row in chunk:
                # 简单的数据处理示例
                processed_row = [str(cell).strip() if cell else '' for cell in row]
                processed.append(processed_row)
            return processed

        return self.chunk_processor.process_in_chunks(data, chunk_processor)

    def cache_workbook_info(self, workbook_id: str, info: Dict[str, Any]):
        """缓存工作簿信息"""
        self.weak_cache.set(workbook_id, info)

    def get_cached_workbook_info(self, workbook_id: str) -> Optional[Dict[str, Any]]:
        """获取缓存的工作簿信息"""
        return self.weak_cache.get(workbook_id)

    def cleanup(self):
        """清理资源"""
        self.weak_cache.clear()
        self.object_pool.clear()
        gc.collect()

# 全局内存监控器
memory_monitor = MemoryMonitor()

def optimize_memory_usage():
    """优化内存使用"""
    # 强制垃圾回收
    gc.collect()

    # 获取内存使用情况
    usage = memory_monitor.get_memory_usage()

    if usage['rss_mb'] > 300:  # 超过300MB时进行优化
        # 清理各种缓存
        from .performance_optimizer import response_cache
        response_cache.clear()

        # 再次垃圾回收
        gc.collect()

        return True

    return False

def get_memory_stats() -> Dict[str, Any]:
    """获取内存统计信息"""
    usage = memory_monitor.get_memory_usage()

    return {
        'current_usage_mb': usage['rss_mb'],
        'memory_percent': usage['percent'],
        'gc_counts': gc.get_count(),
        'gc_stats': gc.get_stats() if hasattr(gc, 'get_stats') else None
    }