"""PowerPoint批量操作优化器"""
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
import asyncio

@dataclass
class PowerPointOperation:
    type: str  # 'add_shape', 'modify_text', 'format_shape', 'move_shape'
    slide_index: int
    shape_id: str = None
    content: Any = None
    options: Dict[str, Any] = None

class PowerPointBatchOptimizer:
    """PowerPoint批量操作优化器"""

    def __init__(self):
        self.operations: List[PowerPointOperation] = []

    def add_operation(self, op_type: str, slide_index: int, shape_id: str = None,
                     content: Any = None, **options):
        """添加操作到批处理队列"""
        self.operations.append(PowerPointOperation(
            type=op_type,
            slide_index=slide_index,
            shape_id=shape_id,
            content=content,
            options=options
        ))

    def optimize_operations(self) -> List[List[PowerPointOperation]]:
        """优化操作顺序，返回批处理组"""
        if not self.operations:
            return []

        # 按幻灯片分组
        slide_groups = self._group_by_slide()

        # 优化每个幻灯片的操作
        optimized_groups = []
        for slide_index, ops in slide_groups.items():
            optimized_groups.extend(self._optimize_slide_operations(ops))

        return optimized_groups

    def _group_by_slide(self) -> Dict[int, List[PowerPointOperation]]:
        """按幻灯片分组"""
        groups = {}
        for op in self.operations:
            if op.slide_index not in groups:
                groups[op.slide_index] = []
            groups[op.slide_index].append(op)
        return groups

    def _optimize_slide_operations(self, ops: List[PowerPointOperation]) -> List[List[PowerPointOperation]]:
        """优化单个幻灯片的操作"""
        if len(ops) <= 1:
            return [ops] if ops else []

        # 按操作类型分组
        type_groups = {}
        for op in ops:
            if op.type not in type_groups:
                type_groups[op.type] = []
            type_groups[op.type].append(op)

        batches = []

        # 形状添加操作可以批量执行
        if 'add_shape' in type_groups:
            batches.extend(self._batch_shape_operations(type_groups['add_shape']))

        # 文本修改操作按形状分组
        if 'modify_text' in type_groups:
            batches.extend(self._batch_text_operations(type_groups['modify_text']))

        # 格式化操作可以批量执行
        if 'format_shape' in type_groups:
            batches.extend(self._batch_format_operations(type_groups['format_shape']))

        # 其他操作类型
        for op_type, type_ops in type_groups.items():
            if op_type not in ['add_shape', 'modify_text', 'format_shape']:
                batches.append(type_ops)

        return batches

    def _batch_shape_operations(self, ops: List[PowerPointOperation]) -> List[List[PowerPointOperation]]:
        """批量处理形状操作"""
        # 同一幻灯片的形状添加可以合并
        MAX_BATCH_SIZE = 10
        batches = []

        for i in range(0, len(ops), MAX_BATCH_SIZE):
            batch = ops[i:i + MAX_BATCH_SIZE]
            batches.append(batch)

        return batches

    def _batch_text_operations(self, ops: List[PowerPointOperation]) -> List[List[PowerPointOperation]]:
        """批量处理文本操作"""
        # 按形状ID分组
        shape_groups = {}
        for op in ops:
            if op.shape_id not in shape_groups:
                shape_groups[op.shape_id] = []
            shape_groups[op.shape_id].append(op)

        return [group for group in shape_groups.values()]

    def _batch_format_operations(self, ops: List[PowerPointOperation]) -> List[List[PowerPointOperation]]:
        """批量处理格式化操作"""
        # 相同格式的操作可以合并
        format_groups = {}
        for op in ops:
            format_key = str(sorted(op.options.items())) if op.options else 'default'
            if format_key not in format_groups:
                format_groups[format_key] = []
            format_groups[format_key].append(op)

        return [group for group in format_groups.values()]

    async def execute_batch(self, batch: List[PowerPointOperation], ppt_handler) -> Dict[str, Any]:
        """执行一批操作"""
        if not batch:
            return {"success": True, "results": []}

        results = []
        op_type = batch[0].type

        try:
            if op_type == 'add_shape':
                results = await self._execute_shape_batch(batch, ppt_handler)
            elif op_type == 'modify_text':
                results = await self._execute_text_batch(batch, ppt_handler)
            elif op_type == 'format_shape':
                results = await self._execute_format_batch(batch, ppt_handler)
            else:
                # 逐个执行其他类型操作
                for op in batch:
                    result = await self._execute_single_operation(op, ppt_handler)
                    results.append(result)

            return {
                "success": True,
                "batch_size": len(batch),
                "slide_index": batch[0].slide_index,
                "results": results
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "batch_size": len(batch)
            }

    async def _execute_shape_batch(self, batch: List[PowerPointOperation], ppt_handler) -> List[Dict]:
        """批量执行形状操作"""
        results = []

        # 构建批量形状数据
        shapes_data = []
        for op in batch:
            shapes_data.append({
                'type': op.options.get('shape_type', 'textbox'),
                'content': op.content,
                'position': op.options.get('position', {}),
                'size': op.options.get('size', {})
            })

        try:
            if hasattr(ppt_handler, 'batch_add_shapes'):
                result = await ppt_handler.batch_add_shapes(batch[0].slide_index, shapes_data)
                results.append(result)
            else:
                # 回退到逐个执行
                for op in batch:
                    result = await ppt_handler.add_text_box(
                        batch[0].slide_index,
                        op.content or "",
                        **op.options
                    )
                    results.append(result)
        except Exception as e:
            results.append({"success": False, "error": str(e)})

        return results

    async def _execute_text_batch(self, batch: List[PowerPointOperation], ppt_handler) -> List[Dict]:
        """批量执行文本修改操作"""
        results = []

        # 按形状分组的文本更新
        text_updates = {}
        for op in batch:
            if op.shape_id not in text_updates:
                text_updates[op.shape_id] = []
            text_updates[op.shape_id].append(op.content)

        try:
            if hasattr(ppt_handler, 'batch_update_text'):
                result = await ppt_handler.batch_update_text(batch[0].slide_index, text_updates)
                results.append(result)
            else:
                # 回退到逐个执行
                for op in batch:
                    result = await ppt_handler.update_shape_text(
                        batch[0].slide_index,
                        op.shape_id,
                        op.content
                    )
                    results.append(result)
        except Exception as e:
            results.append({"success": False, "error": str(e)})

        return results

    async def _execute_format_batch(self, batch: List[PowerPointOperation], ppt_handler) -> List[Dict]:
        """批量执行格式化操作"""
        results = []

        # 构建批量格式化数据
        format_data = []
        for op in batch:
            format_data.append({
                'shape_id': op.shape_id,
                'format': op.options or {}
            })

        try:
            if hasattr(ppt_handler, 'batch_format_shapes'):
                result = await ppt_handler.batch_format_shapes(batch[0].slide_index, format_data)
                results.append(result)
            else:
                # 回退到逐个执行
                for op in batch:
                    result = await ppt_handler.format_shape(
                        batch[0].slide_index,
                        op.shape_id,
                        op.options or {}
                    )
                    results.append(result)
        except Exception as e:
            results.append({"success": False, "error": str(e)})

        return results

    async def _execute_single_operation(self, op: PowerPointOperation, ppt_handler) -> Dict:
        """执行单个操作"""
        try:
            if op.type == 'move_shape':
                return await ppt_handler.move_shape(
                    op.slide_index,
                    op.shape_id,
                    op.options.get('position', {})
                )
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
            return {"total_operations": 0, "batches": 0, "slides": 0}

        batches = self.optimize_operations()
        slides = set(op.slide_index for op in self.operations)

        return {
            "total_operations": len(self.operations),
            "batches": len(batches),
            "slides": len(slides),
            "avg_batch_size": len(self.operations) / len(batches) if batches else 0,
            "operation_types": list(set(op.type for op in self.operations))
        }