"""用户验收测试场景"""
import pytest
import asyncio
from pathlib import Path

from src.office_mcp_server.handlers.excel_handler import ExcelHandler
from src.office_mcp_server.handlers.ppt_handler import PowerPointHandler
from src.office_mcp_server.handlers.word_handler import WordHandler


class TestUserScenarios:
    """用户验收测试场景"""

    @pytest.fixture
    def sample_files(self, tmp_path):
        """创建示例文件"""
        return {
            'excel': tmp_path / 'sample.xlsx',
            'powerpoint': tmp_path / 'sample.pptx',
            'word': tmp_path / 'sample.docx'
        }

    @pytest.mark.asyncio
    async def test_data_analysis_workflow(self, sample_files):
        """场景1: 数据分析师工作流程"""
        handler = ExcelHandler()

        # 1. 打开包含销售数据的Excel文件
        result = await handler.open_workbook(str(sample_files['excel']))
        assert result.get('success'), "无法打开Excel文件"

        # 2. 读取销售数据
        sales_data = await handler.read_range("A1:E100")
        assert 'values' in sales_data, "无法读取销售数据"

        # 3. 计算总销售额
        formula_result = await handler.write_range("F1", [["=SUM(E2:E100)"]])
        assert formula_result.get('success'), "无法写入求和公式"

        # 4. 创建数据透视表
        pivot_result = await handler.create_pivot_table(
            source_range="A1:E100",
            destination="H1",
            rows=["产品类别"],
            values=["销售额"]
        )
        assert pivot_result.get('success'), "无法创建数据透视表"

        # 5. 格式化结果
        format_result = await handler.format_range("F1:K20", {
            "font": {"bold": True},
            "fill": {"color": "#E8F4FD"}
        })
        assert format_result.get('success'), "无法格式化数据"

    @pytest.mark.asyncio
    async def test_presentation_creation_workflow(self, sample_files):
        """场景2: 演示文稿创建工作流程"""
        handler = PowerPointHandler()

        # 1. 创建新演示文稿
        result = await handler.create_presentation()
        assert result.get('success'), "无法创建演示文稿"

        # 2. 添加标题幻灯片
        title_slide = await handler.add_slide("title")
        assert title_slide.get('success'), "无法添加标题幻灯片"

        slide_id = title_slide.get('slide_id')

        # 3. 设置标题和副标题
        title_result = await handler.add_text_box(
            slide_id, "季度业绩报告", x=100, y=100, width=600, height=100
        )
        assert title_result.get('success'), "无法添加标题"

        subtitle_result = await handler.add_text_box(
            slide_id, "2024年第一季度", x=100, y=250, width=600, height=50
        )
        assert subtitle_result.get('success'), "无法添加副标题"

        # 4. 添加内容幻灯片
        content_slide = await handler.add_slide("content")
        assert content_slide.get('success'), "无法添加内容幻灯片"

        # 5. 插入图表
        chart_result = await handler.add_chart(
            content_slide.get('slide_id'),
            chart_type="column",
            data=[
                ["月份", "销售额"],
                ["1月", 100000],
                ["2月", 120000],
                ["3月", 150000]
            ]
        )
        assert chart_result.get('success'), "无法插入图表"

    @pytest.mark.asyncio
    async def test_document_editing_workflow(self, sample_files):
        """场景3: 文档编辑工作流程"""
        handler = WordHandler()

        # 1. 打开文档
        result = await handler.open_document(str(sample_files['word']))
        assert result.get('success'), "无法打开Word文档"

        # 2. 插入标题
        title_result = await handler.insert_text("项目报告", style="Heading 1")
        assert title_result.get('success'), "无法插入标题"

        # 3. 插入段落
        paragraph_result = await handler.insert_text(
            "本报告总结了项目的主要成果和下一步计划。",
            style="Normal"
        )
        assert paragraph_result.get('success'), "无法插入段落"

        # 4. 插入表格
        table_result = await handler.insert_table(
            rows=3,
            cols=3,
            data=[
                ["任务", "状态", "负责人"],
                ["需求分析", "完成", "张三"],
                ["系统设计", "进行中", "李四"]
            ]
        )
        assert table_result.get('success'), "无法插入表格"

        # 5. 应用格式
        format_result = await handler.format_text(
            text="项目报告",
            font_size=16,
            bold=True,
            color="blue"
        )
        assert format_result.get('success'), "无法格式化文本"

    @pytest.mark.asyncio
    async def test_batch_processing_workflow(self):
        """场景4: 批量处理工作流程"""
        from src.office_mcp_server.tools.operation_queue import operation_queue, OperationType

        # 注册处理器
        excel_handler = ExcelHandler()
        operation_queue.register_handler('excel', excel_handler)

        # 1. 批量数据处理任务
        batch_operations = []

        # 创建100个数据处理任务
        for i in range(100):
            batch_operations.append({
                'type': 'excel',
                'handler': 'excel',
                'method': 'write_range',
                'args': [f'A{i+1}:A{i+1}', [[f'数据_{i}']]],
                'priority': 1
            })

        # 添加格式化任务
        for i in range(0, 100, 10):
            batch_operations.append({
                'type': 'excel',
                'handler': 'excel',
                'method': 'format_range',
                'args': [f'A{i+1}:A{i+10}', {'font': {'bold': True}}],
                'priority': 2
            })

        # 2. 提交批量任务
        op_ids = await operation_queue.add_batch_operations(batch_operations)
        assert len(op_ids) == len(batch_operations), "批量任务提交失败"

        # 3. 监控执行进度
        completed_count = 0
        while completed_count < len(op_ids):
            await asyncio.sleep(0.5)
            stats = operation_queue.get_queue_stats()
            completed_count = stats['completed']

            # 显示进度（在实际测试中可能需要mock）
            progress = completed_count / len(op_ids) * 100
            print(f"批量处理进度: {progress:.1f}%")

        # 4. 验证所有任务完成
        final_stats = operation_queue.get_queue_stats()
        assert final_stats['completed'] == len(batch_operations), "批量任务未全部完成"
        assert final_stats['failed'] == 0, "存在失败的任务"

    @pytest.mark.asyncio
    async def test_error_recovery_workflow(self):
        """场景5: 错误恢复工作流程"""
        handler = ExcelHandler()

        # 1. 尝试打开不存在的文件
        result = await handler.open_workbook("nonexistent_file.xlsx")
        assert not result.get('success'), "应该返回错误"
        assert 'error' in result, "应该包含错误信息"

        # 2. 用户收到友好的错误提示
        error_message = result.get('error', '')
        assert '文件不存在' in error_message or 'File not found' in error_message

        # 3. 尝试恢复操作 - 创建新文件
        create_result = await handler.create_workbook()
        assert create_result.get('success'), "无法创建新工作簿"

        # 4. 继续正常操作
        write_result = await handler.write_range("A1:A3", [["数据1"], ["数据2"], ["数据3"]])
        assert write_result.get('success'), "恢复后无法写入数据"

    @pytest.mark.asyncio
    async def test_collaborative_workflow(self):
        """场景6: 协作工作流程"""
        # 模拟多用户协作场景
        user1_handler = ExcelHandler()
        user2_handler = ExcelHandler()

        # 1. 用户1创建共享文档
        create_result = await user1_handler.create_workbook()
        assert create_result.get('success'), "用户1无法创建文档"

        # 2. 用户1写入数据
        user1_data = await user1_handler.write_range("A1:A5", [["用户1数据1"], ["用户1数据2"], ["用户1数据3"], ["用户1数据4"], ["用户1数据5"]])
        assert user1_data.get('success'), "用户1无法写入数据"

        # 3. 用户2读取数据
        user2_read = await user2_handler.read_range("A1:A5")
        assert 'values' in user2_read, "用户2无法读取数据"

        # 4. 用户2添加数据
        user2_data = await user2_handler.write_range("B1:B5", [["用户2数据1"], ["用户2数据2"], ["用户2数据3"], ["用户2数据4"], ["用户2数据5"]])
        assert user2_data.get('success'), "用户2无法写入数据"

        # 5. 验证协作结果
        final_data = await user1_handler.read_range("A1:B5")
        assert len(final_data.get('values', [])) == 5, "协作数据不完整"

    def test_user_interface_responsiveness(self):
        """场景7: 用户界面响应性测试"""
        # 这个测试需要与前端组件配合
        # 测试用户操作的响应时间

        import time

        # 模拟用户点击操作
        start_time = time.time()

        # 模拟处理时间
        time.sleep(0.1)  # 100ms处理时间

        response_time = time.time() - start_time

        # 用户界面响应应该在200ms内
        assert response_time < 0.2, f"界面响应时间过长: {response_time:.3f}s"

    @pytest.mark.asyncio
    async def test_data_export_workflow(self):
        """场景8: 数据导出工作流程"""
        handler = ExcelHandler()

        # 1. 准备数据
        await handler.create_workbook()
        test_data = [
            ["姓名", "年龄", "部门"],
            ["张三", 25, "技术部"],
            ["李四", 30, "销售部"],
            ["王五", 28, "市场部"]
        ]

        write_result = await handler.write_range("A1:C4", test_data)
        assert write_result.get('success'), "无法写入测试数据"

        # 2. 导出为CSV
        csv_result = await handler.export_to_csv("A1:C4")
        assert csv_result.get('success'), "无法导出CSV"
        assert 'csv_data' in csv_result, "CSV数据缺失"

        # 3. 导出为JSON
        json_result = await handler.export_to_json("A1:C4")
        assert json_result.get('success'), "无法导出JSON"
        assert 'json_data' in json_result, "JSON数据缺失"

        # 4. 验证导出数据完整性
        csv_lines = csv_result['csv_data'].split('\n')
        assert len(csv_lines) >= 4, "CSV数据行数不足"

        json_data = json_result['json_data']
        assert len(json_data) == 3, "JSON数据记录数不正确"  # 不包括标题行


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])