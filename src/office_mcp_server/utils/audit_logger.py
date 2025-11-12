"""审计日志系统模块."""

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from loguru import logger

from office_mcp_server.config import config


class AuditLogger:
    """审计日志记录器."""

    def __init__(self) -> None:
        """初始化审计日志."""
        self.log_dir = config.paths.output_dir / "audit_logs"
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.log_file = self.log_dir / f"audit_{datetime.now().strftime('%Y%m%d')}.log"

    def log_operation(
        self,
        operation: str,
        filename: str,
        sheet_name: Optional[str] = None,
        cell_range: Optional[str] = None,
        user: str = "system",
        details: Optional[dict[str, Any]] = None,
        status: str = "success",
    ) -> None:
        """记录操作日志.

        Args:
            operation: 操作类型
            filename: 文件名
            sheet_name: 工作表名称
            cell_range: 单元格范围
            user: 用户名
            details: 详细信息
            status: 操作状态
        """
        try:
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "operation": operation,
                "filename": filename,
                "sheet_name": sheet_name,
                "cell_range": cell_range,
                "user": user,
                "status": status,
                "details": details or {},
            }

            # 写入日志文件
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")

            logger.info(f"审计日志已记录: {operation} - {filename}")

        except Exception as e:
            logger.error(f"审计日志记录失败: {e}")

    def get_logs(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        operation: Optional[str] = None,
        filename: Optional[str] = None,
        user: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        """查询审计日志.

        Args:
            start_date: 开始日期 (YYYY-MM-DD)
            end_date: 结束日期 (YYYY-MM-DD)
            operation: 操作类型
            filename: 文件名
            user: 用户名

        Returns:
            日志条目列表
        """
        try:
            logs = []

            # 读取所有日志文件
            for log_file in self.log_dir.glob("audit_*.log"):
                with open(log_file, "r", encoding="utf-8") as f:
                    for line in f:
                        try:
                            entry = json.loads(line.strip())

                            # 应用过滤条件
                            if start_date and entry["timestamp"] < start_date:
                                continue
                            if end_date and entry["timestamp"] > end_date:
                                continue
                            if operation and entry["operation"] != operation:
                                continue
                            if filename and entry["filename"] != filename:
                                continue
                            if user and entry["user"] != user:
                                continue

                            logs.append(entry)
                        except json.JSONDecodeError:
                            continue

            # 按时间排序
            logs.sort(key=lambda x: x["timestamp"], reverse=True)

            return logs

        except Exception as e:
            logger.error(f"查询审计日志失败: {e}")
            return []

    def get_statistics(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> dict[str, Any]:
        """获取审计统计信息.

        Args:
            start_date: 开始日期 (YYYY-MM-DD)
            end_date: 结束日期 (YYYY-MM-DD)

        Returns:
            统计信息
        """
        try:
            logs = self.get_logs(start_date=start_date, end_date=end_date)

            # 统计各种操作
            operation_counts = {}
            user_counts = {}
            file_counts = {}
            status_counts = {"success": 0, "failure": 0}

            for log in logs:
                # 操作统计
                op = log["operation"]
                operation_counts[op] = operation_counts.get(op, 0) + 1

                # 用户统计
                user = log["user"]
                user_counts[user] = user_counts.get(user, 0) + 1

                # 文件统计
                filename = log["filename"]
                file_counts[filename] = file_counts.get(filename, 0) + 1

                # 状态统计
                status = log["status"]
                if status == "success":
                    status_counts["success"] += 1
                else:
                    status_counts["failure"] += 1

            return {
                "total_operations": len(logs),
                "operation_counts": operation_counts,
                "user_counts": user_counts,
                "file_counts": file_counts,
                "status_counts": status_counts,
                "date_range": {
                    "start": start_date or logs[-1]["timestamp"] if logs else None,
                    "end": end_date or logs[0]["timestamp"] if logs else None,
                },
            }

        except Exception as e:
            logger.error(f"获取审计统计失败: {e}")
            return {}

    def export_logs(
        self,
        output_file: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        format: str = "json",
    ) -> dict[str, Any]:
        """导出审计日志.

        Args:
            output_file: 输出文件名
            start_date: 开始日期
            end_date: 结束日期
            format: 导出格式 ('json' 或 'csv')

        Returns:
            操作结果
        """
        try:
            logs = self.get_logs(start_date=start_date, end_date=end_date)

            output_path = config.paths.output_dir / output_file

            if format == "json":
                with open(output_path, "w", encoding="utf-8") as f:
                    json.dump(logs, f, ensure_ascii=False, indent=2)
            elif format == "csv":
                import csv

                with open(output_path, "w", newline="", encoding="utf-8") as f:
                    if logs:
                        writer = csv.DictWriter(
                            f,
                            fieldnames=[
                                "timestamp",
                                "operation",
                                "filename",
                                "sheet_name",
                                "cell_range",
                                "user",
                                "status",
                            ],
                        )
                        writer.writeheader()
                        for log in logs:
                            row = {k: log.get(k, "") for k in writer.fieldnames}
                            writer.writerow(row)
            else:
                raise ValueError(f"不支持的导出格式: {format}")

            logger.info(f"审计日志导出成功: {output_path}")
            return {
                "success": True,
                "message": "导出成功",
                "output_file": str(output_path),
                "count": len(logs),
            }

        except Exception as e:
            logger.error(f"导出审计日志失败: {e}")
            return {"success": False, "message": f"导出失败: {str(e)}"}


# 全局审计日志实例
audit_logger = AuditLogger()
