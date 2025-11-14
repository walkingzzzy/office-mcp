"""Excel批量操作优化器"""
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
import asyncio

@dataclass
class ExcelOperation:
    type: str  # 'merge_cells', 'set_value', 'format', 'formula'
    range: str
    value: Any = None
    options: Dict[str, Any] = None

class ExcelBatchOptimizer:
    """Excel批量操作优化器"""

    def __init__(self):
        self.operations: List[ExcelOperation] = []

    def add_operation(self, op_type: str, range_addr: str, value: Any = None, **options):
        """添加操作到批处理队列"""
        self.operations.append(ExcelOperation(
            type=op_type,
            range=range_addr,
            value=value,
            options=options
        ))

    def optimize_operations(self) -> List[List[ExcelOperation]]:
        """优化操作顺序，返回批处理组"""
        if not self.operations:
            return []

        # 按类型分组
        grouped = self._group_by_type()

        # 合并相邻操作
        optimized_groups = []
        for op_type, ops in grouped.items():
            if op_type == 'merge_cells':
                optimized_groups.extend(self._optimize_merge_operations(ops))
            elif op_type == 'set_value':
                optimized_groups.extend(self._optimize_value_operations(ops))
            else:
                optimized_groups.append(ops)

        return optimized_groups

    def _group_by_type(self) -> Dict[str, List[ExcelOperation]]:
        """按操作类型分组"""
        groups = {}
        for op in self.operations:
            if op.type not in groups:
                groups[op.type] = []
            groups[op.type].append(op)
        return groups

    def _optimize_merge_operations(self, ops: List[ExcelOperation]) -> List[List[ExcelOperation]]:
        """优化合并单元格操作"""
        if len(ops) <= 1:
            return [ops] if ops else []

        # 按工作表分组
        sheet_groups = {}
        for op in ops:
            sheet = op.range.split('!')[0] if '!' in op.range else 'Sheet1'
            if sheet not in sheet_groups:
                sheet_groups[sheet] = []
            sheet_groups[sheet].append(op)

        # 每个工作表的操作合并为一批
        return [group for group in sheet_groups.values()]

    def _optimize_value_operations(self, ops: List[ExcelOperation]) -> List[List[ExcelOperation]]:
        """优化值设置操作"""
        # 按工作表和相邻性分组
        batches = []
        current_batch = []

        for op in sorted(ops, key=lambda x: self._get_cell_index(x.range)):
            if not current_batch:
                current_batch.append(op)
            elif self._is_adjacent(current_batch[-1].range, op.range):
                current_batch.append(op)
            else:
                if current_batch:
                    batches.append(current_batch)
                current_batch = [op]

        if current_batch:
            batches.append(current_batch)

        return batches

    def _get_cell_index(self, range_addr: str) -> Tuple[int, int]:
        """获取单元格索引用于排序"""
        # 简化实现：提取行列号
        import re
        match = re.match(r'([A-Z]+)(\d+)', range_addr.split('!')[-1])
        if match:
            col = sum((ord(c) - ord('A') + 1) * (26 ** i) for i, c in enumerate(reversed(match.group(1))))
            row = int(match.group(2))
            return (row, col)
        return (0, 0)

    def _is_adjacent(self, range1: str, range2: str) -> bool:
        """检查两个单元格是否相邻"""
        r1, c1 = self._get_cell_index(range1)
        r2, c2 = self._get_cell_index(range2)
        return abs(r1 - r2) <= 1 and abs(c1 - c2) <= 1

    async def execute_batch(self, batch: List[ExcelOperation], excel_handler) -> Dict[str, Any]:
        """执行一批操作"""
        results = []

        if not batch:
            return {"success": True, "results": []}

        # 根据操作类型选择执行方法
        op_type = batch[0].type

        if op_type == 'merge_cells':
            results = await self._execute_merge_batch(batch, excel_handler)
        elif op_type == 'set_value':
            results = await self._execute_value_batch(batch, excel_handler)
        else:
            # 逐个执行其他类型操作
            for op in batch:
                result = await self._execute_single_operation(op, excel_handler)
                results.append(result)

        return {
            "success": True,
            "batch_size": len(batch),
            "results": results
        }

    async def _execute_merge_batch(self, batch: List[ExcelOperation], excel_handler) -> List[Dict]:
        """批量执行合并单元格操作"""
        results = []

        # 构建批量合并请求
        merge_ranges = [op.range for op in batch]

        try:
            # 调用Excel处理器的批量合并方法
            if hasattr(excel_handler, 'batch_merge_cells'):
                result = await excel_handler.batch_merge_cells(merge_ranges)
                results.append(result)
            else:
                # 回退到逐个执行
                for op in batch:
                    result = await excel_handler.merge_cells(op.range)
                    results.append(result)
        except Exception as e:
            results.append({"success": False, "error": str(e)})

        return results

    async def _execute_value_batch(self, batch: List[ExcelOperation], excel_handler) -> List[Dict]:
        """批量执行值设置操作"""
        results = []

        # 构建批量值设置请求
        value_data = [(op.range, op.value) for op in batch]

        try:
            if hasattr(excel_handler, 'batch_set_values'):
                result = await excel_handler.batch_set_values(value_data)
                results.append(result)
            else:
                # 回退到逐个执行
                for op in batch:
                    result = await excel_handler.write_range(op.range, [[op.value]])
                    results.append(result)
        except Exception as e:
            results.append({"success": False, "error": str(e)})

        return results

    async def _execute_single_operation(self, op: ExcelOperation, excel_handler) -> Dict:
        """执行单个操作"""
        try:
            if op.type == 'format':
                return await excel_handler.format_range(op.range, op.options or {})
            elif op.type == 'formula':
                return await excel_handler.write_range(op.range, [[op.value]])
            else:
                return {"success": False, "error": f"Unknown operation type: {op.type}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def clear(self):
        """清空操作队列"""
        self.operations.clear()

    def get_stats(self) -> Dict[str, Any]:
        """获取优化统计信息"""
        if not self.operations:
            return {"total_operations": 0, "batches": 0}

        batches = self.optimize_operations()
        return {
            "total_operations": len(self.operations),
            "batches": len(batches),
            "avg_batch_size": len(self.operations) / len(batches) if batches else 0,
            "operation_types": list(set(op.type for op in self.operations))
        }